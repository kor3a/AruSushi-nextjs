/**
 * Integration test for the outbox → SQS → consumer pipeline.
 * Runs against a real Postgres; SQS and SES are stubbed at the SDK client.
 */
import { SQSClient } from '@aws-sdk/client-sqs';
import { SESClient } from '@aws-sdk/client-ses';
import { randomUUID } from 'crypto';

// ---- stubs, installed before the app modules load ----
const sentToSqs: any[] = [];
let sqsShouldFail = false;

(SQSClient.prototype as any).send = async function (command: any) {
  const name = command.constructor.name;
  if (name === 'SendMessageCommand') {
    if (sqsShouldFail) throw new Error('simulated SQS outage');
    sentToSqs.push(JSON.parse(command.input.MessageBody));
    return { MessageId: `msg-${sentToSqs.length}` };
  }
  return {};
};

const sesSent: any[] = [];
let sesFailure: { name: string; status?: number } | null = null;

(SESClient.prototype as any).send = async function (command: any) {
  if (sesFailure) {
    const err: any = new Error(`simulated ${sesFailure.name}`);
    err.name = sesFailure.name;
    err.$metadata = { httpStatusCode: sesFailure.status };
    throw err;
  }
  sesSent.push(command.input.Destination.ToAddresses[0]);
  return { MessageId: `ses-${sesSent.length}` };
};

import { prisma, db } from '../../lib/db';
import { drainOutbox, recoverStalePublishing } from '../../lib/outbox/publisher';
import { handleOrderEvent } from '../../lib/queue/orderEventConsumer';

let passed = 0;
let failed = 0;

function check(name: string, condition: boolean, detail = '') {
  if (condition) {
    console.log(`  PASS  ${name}`);
    passed++;
  } else {
    console.log(`  FAIL  ${name} ${detail}`);
    failed++;
  }
}

async function makeUser() {
  const id = randomUUID();
  await prisma.user.create({
    data: { id, email: `test-${id}@example.com`, name: 'Test Customer' },
  });
  return id;
}

async function outboxRows(orderId: string) {
  return prisma.$queryRaw<any[]>`
    SELECT id, event_type, aggregate_id, payload, status, attempts
    FROM outbox_events WHERE aggregate_id = ${orderId}::uuid
  `;
}

/**
 * Start from a known-empty state. Several assertions count rows across the
 * whole table, so leftovers from a previous run make the suite fail for the
 * wrong reason.
 */
async function reset() {
  await prisma.$executeRaw`TRUNCATE notification_deliveries, outbox_events RESTART IDENTITY`;
  await prisma.$executeRaw`TRUNCATE order_items, orders RESTART IDENTITY CASCADE`;
  await prisma.$executeRaw`DELETE FROM users WHERE email LIKE 'test-%@example.com'`;
}

async function run() {
  await reset();

  console.log('\n--- 1. order + outbox commit atomically ---');
  const userId = await makeUser();
  const order = await db.createOrder({
    userId,
    items: [{ itemName: 'California Roll', itemPrice: 8.5, quantity: 2 }],
    total: 17.0,
    paymentStatus: 'paid',
    paymentIntentId: `pi_${randomUUID()}`,
    customerEmail: 'customer@example.com',
    customerName: 'Test Customer',
  });

  const rows = await outboxRows(order.id);
  check('outbox row written with the order', rows.length === 1);
  check('event type is order.created', rows[0]?.event_type === 'order.created');
  check('payload carries orderId', rows[0]?.payload?.orderId === order.id);
  check('payload is versioned', rows[0]?.payload?.version === 1);
  check('starts pending', rows[0]?.status === 'pending');

  console.log('\n--- 2. a failed transaction leaves neither ---');
  const before = await prisma.$queryRaw<any[]>`SELECT COUNT(*)::int AS c FROM outbox_events`;
  let threw = false;
  try {
    await db.createOrder({
      userId: randomUUID(), // no such user -> FK violation
      items: [{ itemName: 'Spicy Tuna', itemPrice: 9.0, quantity: 1 }],
      total: 9.0,
      paymentStatus: 'paid',
    });
  } catch {
    threw = true;
  }
  const after = await prisma.$queryRaw<any[]>`SELECT COUNT(*)::int AS c FROM outbox_events`;
  check('order creation rejected', threw);
  check('no orphan outbox row', before[0].c === after[0].c, `${before[0].c} -> ${after[0].c}`);

  console.log('\n--- 3. publisher drains to SQS ---');
  sentToSqs.length = 0;
  const drained = await drainOutbox();
  check('one event published', drained.published === 1, JSON.stringify(drained));
  check('message reached SQS', sentToSqs.length === 1);
  check('message carries eventId', !!sentToSqs[0]?.eventId);
  const afterPublish = await outboxRows(order.id);
  check('row marked published', afterPublish[0]?.status === 'published');

  console.log('\n--- 4. published rows are not re-sent ---');
  sentToSqs.length = 0;
  const second = await drainOutbox();
  check('nothing re-published', second.published === 0 && sentToSqs.length === 0);

  console.log('\n--- 5. SQS failure leaves the row retryable ---');
  const user2 = await makeUser();
  const order2 = await db.createOrder({
    userId: user2,
    items: [{ itemName: 'Dragon Roll', itemPrice: 14.0, quantity: 1 }],
    total: 14.0,
    paymentStatus: 'paid',
    customerEmail: 'customer2@example.com',
  });
  sqsShouldFail = true;
  const failedDrain = await drainOutbox();
  sqsShouldFail = false;
  check('drain reported failure', failedDrain.failed === 1);
  const retryRow = await outboxRows(order2.id);
  check('row back to pending', retryRow[0]?.status === 'pending', retryRow[0]?.status);
  check('attempt counted', retryRow[0]?.attempts === 1, String(retryRow[0]?.attempts));

  sentToSqs.length = 0;
  const retryDrain = await drainOutbox();
  check('retry succeeds', retryDrain.published === 1 && sentToSqs.length === 1);

  console.log('\n--- 6. concurrent publishers do not double-send (SKIP LOCKED) ---');
  const user3 = await makeUser();
  const orderIds: string[] = [];
  for (let i = 0; i < 6; i++) {
    const o = await db.createOrder({
      userId: user3,
      items: [{ itemName: `Roll ${i}`, itemPrice: 5, quantity: 1 }],
      total: 5,
      paymentStatus: 'paid',
      customerEmail: `c${i}@example.com`,
    });
    orderIds.push(o.id);
  }
  sentToSqs.length = 0;
  const [a, b, c] = await Promise.all([drainOutbox(), drainOutbox(), drainOutbox()]);
  const totalPublished = a.published + b.published + c.published;
  const uniqueEventIds = new Set(sentToSqs.map((m) => m.eventId));
  check('all six published', totalPublished === 6, String(totalPublished));
  check('no duplicate sends', uniqueEventIds.size === sentToSqs.length, `${uniqueEventIds.size}/${sentToSqs.length}`);

  console.log('\n--- 7. stale "publishing" rows recover ---');
  const user4 = await makeUser();
  const order4 = await db.createOrder({
    userId: user4,
    items: [{ itemName: 'Unagi', itemPrice: 11, quantity: 1 }],
    total: 11,
    paymentStatus: 'paid',
    customerEmail: 'stale@example.com',
  });
  await prisma.$executeRaw`
    UPDATE outbox_events SET status='publishing', updated_at = NOW() - INTERVAL '5 minutes'
    WHERE aggregate_id = ${order4.id}::uuid
  `;
  const recovered = await recoverStalePublishing();
  check('stale row recovered', recovered === 1, String(recovered));
  const recoveredRow = await outboxRows(order4.id);
  check('back to pending', recoveredRow[0]?.status === 'pending');

  console.log('\n--- 8. consumer sends both emails ---');
  sesSent.length = 0;
  await handleOrderEvent({
    eventId: randomUUID(),
    eventType: 'order.created',
    payload: { version: 1, orderId: order.id, userId, occurredAt: new Date().toISOString() },
  });
  check('two emails sent', sesSent.length === 2, JSON.stringify(sesSent));

  console.log('\n--- 9. duplicate delivery is a no-op (at-least-once) ---');
  sesSent.length = 0;
  await handleOrderEvent({
    eventId: randomUUID(),
    eventType: 'order.created',
    payload: { version: 1, orderId: order.id, userId, occurredAt: new Date().toISOString() },
  });
  check('redelivery sent nothing', sesSent.length === 0, JSON.stringify(sesSent));

  console.log('\n--- 10. permanent SES failure is not retried ---');
  const user5 = await makeUser();
  const order5 = await db.createOrder({
    userId: user5,
    items: [{ itemName: 'Tekka Maki', itemPrice: 7, quantity: 1 }],
    total: 7,
    paymentStatus: 'paid',
    customerEmail: 'bad-address@example.com',
  });
  sesFailure = { name: 'MessageRejected', status: 400 };
  let permThrew = false;
  try {
    await handleOrderEvent({
      eventId: randomUUID(),
      eventType: 'order.created',
      payload: { version: 1, orderId: order5.id, userId: user5, occurredAt: new Date().toISOString() },
    });
  } catch {
    permThrew = true;
  }
  sesFailure = null;
  check('permanent failure did not throw (no retry)', !permThrew);
  const deliveries = await prisma.$queryRaw<any[]>`
    SELECT channel, message_id FROM notification_deliveries WHERE order_id = ${order5.id}::uuid
  `;
  check('failure recorded for audit', deliveries.length === 2, String(deliveries.length));
  check(
    'recorded as permanent-failure',
    deliveries.every((d) => String(d.message_id).startsWith('permanent-failure')),
    JSON.stringify(deliveries)
  );

  console.log('\n--- 11. transient SES failure throws so SQS retries ---');
  const user6 = await makeUser();
  const order6 = await db.createOrder({
    userId: user6,
    items: [{ itemName: 'Salmon Nigiri', itemPrice: 6, quantity: 1 }],
    total: 6,
    paymentStatus: 'paid',
    customerEmail: 'throttled@example.com',
  });
  sesFailure = { name: 'ThrottlingException', status: 429 };
  let transientThrew = false;
  try {
    await handleOrderEvent({
      eventId: randomUUID(),
      eventType: 'order.created',
      payload: { version: 1, orderId: order6.id, userId: user6, occurredAt: new Date().toISOString() },
    });
  } catch {
    transientThrew = true;
  }
  sesFailure = null;
  check('transient failure propagated', transientThrew);
  const noDelivery = await prisma.$queryRaw<any[]>`
    SELECT 1 FROM notification_deliveries WHERE order_id = ${order6.id}::uuid
  `;
  check('nothing recorded as delivered', noDelivery.length === 0);

  sesSent.length = 0;
  await handleOrderEvent({
    eventId: randomUUID(),
    eventType: 'order.created',
    payload: { version: 1, orderId: order6.id, userId: user6, occurredAt: new Date().toISOString() },
  });
  check('retry after throttle delivers', sesSent.length === 2, JSON.stringify(sesSent));

  console.log('\n--- 12. unpaid orders are not emailed ---');
  const user7 = await makeUser();
  const order7 = await db.createOrder({
    userId: user7,
    items: [{ itemName: 'Miso Soup', itemPrice: 3, quantity: 1 }],
    total: 3,
    paymentStatus: 'pending',
    customerEmail: 'unpaid@example.com',
  });
  sesSent.length = 0;
  await handleOrderEvent({
    eventId: randomUUID(),
    eventType: 'order.created',
    payload: { version: 1, orderId: order7.id, userId: user7, occurredAt: new Date().toISOString() },
  });
  check('no email for unpaid order', sesSent.length === 0);

  console.log('\n--- 13. unknown payload version is rejected ---');
  let versionRejected = false;
  try {
    await handleOrderEvent({
      eventId: randomUUID(),
      eventType: 'order.created',
      payload: { version: 99, orderId: order.id, userId, occurredAt: new Date().toISOString() } as any,
    });
  } catch (e: any) {
    versionRejected = e.name === 'UnprocessableMessageError';
  }
  check('future version rejected as unprocessable', versionRejected);

  console.log(`\n========== ${passed} passed, ${failed} failed ==========\n`);
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(async (e) => {
  console.error('TEST HARNESS ERROR:', e);
  await prisma.$disconnect();
  process.exit(1);
});
