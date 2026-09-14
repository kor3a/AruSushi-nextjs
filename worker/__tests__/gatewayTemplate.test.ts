/**
 * Contract test between infra/api_gateway.tf and the delivery consumer.
 *
 * The API Gateway mapping template is the seam nothing else checks: terraform
 * can't tell you the VTL produces valid JSON, and the consumer's types can't
 * tell you the gateway actually sends that shape. This renders the template
 * out of the real .tf file, applies VTL's escaping rules, and feeds the result
 * through the real consumer.
 */
import { readFileSync } from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { prisma, db } from '../../lib/db';
import { handleDeliveryEvent } from '../../lib/queue/deliveryEventConsumer';

const AUTH = 'Basic ZG9vcmRhc2g6c2VjcmV0';
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

/** Pull the live template out of the terraform rather than duplicating it. */
function extractTemplate(): string {
  const tf = readFileSync(join(process.cwd(), 'infra/api_gateway.tf'), 'utf-8');
  const match = tf.match(/"application\/json" = <<EOT\n([\s\S]*?)\nEOT/);
  if (!match) throw new Error('could not find request_templates in api_gateway.tf');
  return match[1];
}

/**
 * Apply the VTL substitutions API Gateway would perform.
 * In VTL, "" inside a quoted string is an escaped literal quote.
 */
function renderTemplate(
  template: string,
  opts: { authorization: string; body: unknown; requestId: string; epoch: string }
): string {
  let out = template;

  out = out.replace(
    "$util.escapeJavaScript($input.params('Authorization'))",
    // escapeJavaScript on a base64 Basic credential is a no-op; modelled as such
    opts.authorization.replace(/["\\]/g, (c) => '\\' + c)
  );
  out = out.replace("$input.json('$')", JSON.stringify(opts.body));
  out = out.replace('$context.requestId', opts.requestId);
  out = out.replace('$context.requestTimeEpoch', opts.epoch);

  return out;
}

/** Undo the outer $util.urlEncode("...") wrapper and VTL's "" escaping. */
function extractMessageBody(rendered: string): string {
  const prefix = 'Action=SendMessage&MessageBody=$util.urlEncode("';
  if (!rendered.startsWith(prefix)) {
    throw new Error(`template does not start with expected prefix:\n${rendered}`);
  }
  const inner = rendered.slice(prefix.length, rendered.lastIndexOf('")'));
  // VTL: "" -> literal "
  return inner.replace(/""/g, '"');
}

async function run() {
  await prisma.$executeRaw`TRUNCATE order_items, orders RESTART IDENTITY CASCADE`;
  await prisma.$executeRaw`DELETE FROM users WHERE email LIKE 'gw-%@example.com'`;

  const template = extractTemplate();

  console.log('\n--- 1. template renders to parseable JSON ---');
  const deliveryId = `dd_${randomUUID()}`;
  const requestId = randomUUID();
  const doordashBody = {
    event_name: 'DASHER_PICKED_UP',
    delivery_id: deliveryId,
    external_delivery_id: 'ext-123',
    tracking_url: 'https://doordash.com/track/xyz?a=1&b=2',
    dasher: {
      first_name: 'Alex',
      last_name: "O'Brien",
      dasher_phone_number_for_customer: '5551112222',
      location: { lat: 37.7749, lng: -122.4194 },
    },
  };

  const rendered = renderTemplate(template, {
    authorization: AUTH,
    body: doordashBody,
    requestId,
    epoch: '1789000000000',
  });

  check('renders to a SendMessage action', rendered.startsWith('Action=SendMessage&MessageBody='));

  const messageBody = extractMessageBody(rendered);
  let envelope: any;
  let parseError = '';
  try {
    envelope = JSON.parse(messageBody);
  } catch (e: any) {
    parseError = `${e.message}\n  raw: ${messageBody}`;
  }
  check('MessageBody is valid JSON', !!envelope, parseError);

  if (!envelope) {
    console.log(`\n========== ${passed} passed, ${failed} failed ==========\n`);
    await prisma.$disconnect();
    process.exit(1);
  }

  console.log('\n--- 2. envelope matches what the consumer expects ---');
  check('authorization header survived the hop', envelope.headers?.authorization === AUTH);
  check('requestId present', envelope.requestId === requestId);
  check('receivedAt present', envelope.receivedAt === '1789000000000');
  check('body is an object, not a string', typeof envelope.body === 'object');
  check('event_name intact', envelope.body?.event_name === 'DASHER_PICKED_UP');
  check('nested dasher object intact', envelope.body?.dasher?.location?.lat === 37.7749);
  check('apostrophe in name survived', envelope.body?.dasher?.last_name === "O'Brien");
  check('url with query params intact', envelope.body?.tracking_url === doordashBody.tracking_url);

  console.log('\n--- 3. the real consumer processes that envelope ---');
  const userId = randomUUID();
  await prisma.user.create({
    data: { id: userId, email: `gw-${userId}@example.com`, name: 'Gateway Test' },
  });
  const order = await db.createOrder({
    userId,
    items: [{ itemName: 'Chirashi', itemPrice: 22, quantity: 1 }],
    total: 22,
    orderType: 'delivery',
    paymentStatus: 'paid',
    doordashDeliveryId: deliveryId,
    deliveryAddress: '1 Gateway Way',
    deliveryPhone: '5550000000',
  });

  const outcome = await handleDeliveryEvent(envelope);
  check('consumer processed it', outcome.status === 'processed', JSON.stringify(outcome));

  const updated = await db.findOrderById(order.id);
  check('order status updated', updated?.doordashDeliveryStatus === 'DASHER_PICKED_UP');
  check('dasher name mapped', updated?.dasherName === "Alex O'Brien", String(updated?.dasherName));
  check('pickup time stamped', !!updated?.actualPickupTime);

  console.log(`\n========== ${passed} passed, ${failed} failed ==========\n`);
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

run().catch(async (e) => {
  console.error('TEST HARNESS ERROR:', e);
  await prisma.$disconnect();
  process.exit(1);
});
