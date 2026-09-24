/**
 * Integration test for the API Gateway -> SQS -> worker delivery event path.
 *
 * The gateway itself is AWS config, so what's tested here is everything on our
 * side of it: the envelope shape the mapping template produces, the shared
 * secret check that the gateway can't do, and the processing that used to live
 * in the Next.js route.
 */
import { randomUUID } from 'crypto';
import { prisma, db } from '../../lib/db';
import {
  handleDeliveryEvent,
  UnprocessableDeliveryEventError,
  type DeliveryEventEnvelope,
} from '../../lib/queue/deliveryEventConsumer';

const AUTH = 'Basic ZG9vcmRhc2g6c2VjcmV0'; // doordash:secret
process.env.DOORDASH_WEBHOOK_AUTH_HEADER = AUTH;

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
    data: { id, email: `dd-${id}@example.com`, name: 'Delivery Customer' },
  });
  return id;
}

async function makeDeliveryOrder(deliveryId: string) {
  const userId = await makeUser();
  const order = await db.createOrder({
    userId,
    items: [{ itemName: 'Rainbow Roll', itemPrice: 16, quantity: 1 }],
    total: 16,
    orderType: 'delivery',
    paymentStatus: 'paid',
    deliveryAddress: '123 Test St',
    deliveryPhone: '5551234567',
    doordashDeliveryId: deliveryId,
    customerEmail: 'delivery@example.com',
  });
  return order;
}

/**
 * The envelope API Gateway's mapping template produces.
 *
 * `auth` takes null to mean "no header at all" rather than undefined, because
 * an explicit undefined would trigger the default parameter and silently send
 * a valid header instead.
 */
function envelope(
  body: Record<string, unknown>,
  auth: string | null = AUTH
): DeliveryEventEnvelope {
  return {
    headers: auth === null ? {} : { authorization: auth },
    requestId: randomUUID(),
    receivedAt: String(Date.now()),
    body: body as any,
  };
}

async function reset() {
  await prisma.$executeRaw`TRUNCATE notification_deliveries, outbox_events RESTART IDENTITY`;
  await prisma.$executeRaw`TRUNCATE order_items, orders RESTART IDENTITY CASCADE`;
  await prisma.$executeRaw`DELETE FROM users WHERE email LIKE 'dd-%@example.com'`;
}

async function run() {
  await reset();

  console.log('\n--- 1. a valid event updates the order ---');
  const deliveryId = `dd_${randomUUID()}`;
  const order = await makeDeliveryOrder(deliveryId);

  const outcome = await handleDeliveryEvent(
    envelope({
      event_name: 'DASHER_CONFIRMED',
      delivery_id: deliveryId,
      external_delivery_id: order.id,
      tracking_url: 'https://doordash.com/track/abc',
      dasher: {
        first_name: 'Sam',
        last_name: 'Rivera',
        dasher_phone_number_for_customer: '5559998888',
        location: { lat: 37.77, lng: -122.42 },
      },
    })
  );

  check('outcome is processed', outcome.status === 'processed', JSON.stringify(outcome));
  const updated = await db.findOrderById(order.id);
  check('status advanced', updated?.doordashDeliveryStatus === 'DASHER_CONFIRMED');
  check('dasher name mapped', updated?.dasherName === 'Sam Rivera', String(updated?.dasherName));
  check('customer-facing phone preferred', updated?.dasherPhone === '5559998888');
  check('dasher location stored', updated?.dasherLatitude === 37.77 && updated?.dasherLongitude === -122.42);
  check('tracking url stored', updated?.doordashTrackingUrl === 'https://doordash.com/track/abc');

  console.log('\n--- 2. a bad shared secret is rejected before any DB write ---');
  let authRejected = false;
  try {
    await handleDeliveryEvent(
      envelope({ event_name: 'DASHER_PICKED_UP', delivery_id: deliveryId }, 'Basic wrong')
    );
  } catch (e: any) {
    authRejected = e instanceof UnprocessableDeliveryEventError;
  }
  check('rejected as unprocessable', authRejected);
  const unchanged = await db.findOrderById(order.id);
  check('order untouched', unchanged?.doordashDeliveryStatus === 'DASHER_CONFIRMED');

  console.log('\n--- 3. a missing auth header is rejected ---');
  let missingRejected = false;
  try {
    await handleDeliveryEvent(
      envelope({ event_name: 'DASHER_PICKED_UP', delivery_id: deliveryId }, null)
    );
  } catch (e: any) {
    missingRejected = e instanceof UnprocessableDeliveryEventError;
  }
  check('rejected as unprocessable', missingRejected);

  console.log('\n--- 4. pickup time is stamped once, not on redelivery ---');
  await handleDeliveryEvent(
    envelope({ event_name: 'DASHER_PICKED_UP', delivery_id: deliveryId })
  );
  const firstPickup = (await db.findOrderById(order.id))?.actualPickupTime;
  check('pickup time set', !!firstPickup);

  await new Promise((r) => setTimeout(r, 25));
  // SQS is at-least-once: the same message can arrive again.
  await handleDeliveryEvent(
    envelope({ event_name: 'DASHER_PICKED_UP', delivery_id: deliveryId })
  );
  const secondPickup = (await db.findOrderById(order.id))?.actualPickupTime;
  check(
    'redelivery did not overwrite it',
    firstPickup?.getTime() === secondPickup?.getTime(),
    `${firstPickup?.toISOString()} vs ${secondPickup?.toISOString()}`
  );

  console.log('\n--- 5. dropoff advances order status ---');
  await handleDeliveryEvent(
    envelope({
      event_name: 'DASHER_DROPPED_OFF',
      delivery_id: deliveryId,
      actual_delivery_time: '2026-09-14T18:30:00.000Z',
    })
  );
  const delivered = await db.findOrderById(order.id);
  check('dropoff time from payload', delivered?.actualDropoffTime?.toISOString() === '2026-09-14T18:30:00.000Z');
  check('order status updated', delivered?.status === 'delivered', String(delivered?.status));

  console.log('\n--- 6. unknown event names are ignored, not retried ---');
  const ignored = await handleDeliveryEvent(
    envelope({ event_name: 'SOMETHING_NEW', delivery_id: deliveryId })
  );
  check('outcome is ignored', ignored.status === 'ignored', JSON.stringify(ignored));

  console.log('\n--- 7. an unmatched delivery id does not throw ---');
  const unmatched = await handleDeliveryEvent(
    envelope({ event_name: 'DASHER_CONFIRMED', delivery_id: `dd_${randomUUID()}` })
  );
  check('outcome is unmatched', unmatched.status === 'unmatched', JSON.stringify(unmatched));

  console.log('\n--- 8. external_delivery_id is used as a fallback key ---');
  const extId = `ext_${randomUUID()}`;
  const order2 = await makeDeliveryOrder(extId);
  const viaExternal = await handleDeliveryEvent(
    envelope({ event_name: 'DASHER_CONFIRMED', external_delivery_id: extId })
  );
  check('matched via external id', viaExternal.status === 'processed', JSON.stringify(viaExternal));
  check(
    'correct order matched',
    viaExternal.status === 'processed' && viaExternal.orderId === order2.id
  );

  console.log('\n--- 9. an envelope with no body is unprocessable ---');
  let noBodyRejected = false;
  try {
    await handleDeliveryEvent({ headers: { authorization: AUTH } } as any);
  } catch (e: any) {
    noBodyRejected = e instanceof UnprocessableDeliveryEventError;
  }
  check('rejected as unprocessable', noBodyRejected);

  console.log('\n--- 10. cancellation is recorded ---');
  const cancelId = `dd_${randomUUID()}`;
  const order3 = await makeDeliveryOrder(cancelId);
  await handleDeliveryEvent(
    envelope({
      event_name: 'DELIVERY_CANCELLED',
      delivery_id: cancelId,
      cancellation_reason: 'no dasher available',
    })
  );
  const cancelled = await db.findOrderById(order3.id);
  check('last event recorded', cancelled?.deliveryLastEvent === 'DELIVERY_CANCELLED');

  console.log(`\n========== ${passed} passed, ${failed} failed ==========\n`);
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(async (e) => {
  console.error('TEST HARNESS ERROR:', e);
  await prisma.$disconnect();
  process.exit(1);
});
