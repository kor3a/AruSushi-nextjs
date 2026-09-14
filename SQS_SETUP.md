# Order events queue

Order notifications run through a transactional outbox and an SQS queue rather
than being fired off inside the request that creates the order.

## Why

The old path called SES from the order handler with a detached promise:

```ts
sendOrderNotificationToRestaurant(order).catch((e) => console.error(e));
```

That kept a slow email off the customer's checkout path, but it was not
durable. If the container died between the response and the send, the email was
gone and nothing retried it — during a dinner rush that's a ticket the kitchen
never sees.

## Flow

```
POST /api/orders/create
  └─ one transaction: order + order_items + outbox_events row
        ↓
  worker: publisher loop
        └─ claims pending rows (FOR UPDATE SKIP LOCKED) → SQS
              ↓
  worker: consumer loop
        └─ long-polls SQS → loads order → sends via SES
              └─ records notification_deliveries (idempotency key)
```

### The outbox is the point

Enqueueing to SQS *after* the database commit is still a dual write: a crash
between the two loses the message with no trace. Writing the event to
`outbox_events` inside the same transaction as the order means the two commit
or fail together, and a separate process moves it to the queue. That's what
makes the pipeline exactly-once from the customer's point of view.

### At-least-once, so the consumer is idempotent

SQS standard queues redeliver a message whose visibility timeout expires mid
-processing. `notification_deliveries` has a unique index on
`(order_id, channel)`, so a duplicate delivery is a no-op instead of a second
email.

### Permanent vs transient failures

`lib/email/errors.ts` classifies SES failures. A `MessageRejected` (address not
verified, address doesn't exist) will never succeed, so it's recorded and the
message is deleted — retrying it five times just parks something in the DLQ
that nobody can act on. Throttling and 5xx are transient: the message is left
on the queue and retried after the visibility timeout.

## Queue configuration

In `infra/sqs.tf`. The values that matter:

| Setting | Value | Why |
| --- | --- | --- |
| Queue type | Standard | FIFO caps at 300 TPS and its 5-minute dedup window doesn't cover real retries |
| `visibility_timeout_seconds` | 30 | ~6× an SES call; long enough for a slow send, short enough that a crashed consumer's message retries quickly |
| `maxReceiveCount` | 5 | Then it goes to the DLQ instead of cycling until retention expires |
| Main retention | 4 days | |
| DLQ retention | 14 days | Clock does **not** reset on the move — inherited from original enqueue |
| `receive_wait_time_seconds` | 20 | Long polling; no paying for empty receives |

Alarms: any message in the DLQ, and `ApproximateAgeOfOldestMessage` over 5
minutes on the main queue (age, not depth — a deep queue draining fast is fine).

## Setup

```bash
cd infra
terraform init
terraform apply
```

Then set in `.env` for both the web and worker containers:

```
SQS_ORDER_EVENTS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/<account>/arusushi-order-events-production
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=...
AWS_SECRET_ACCESS_KEY=...
```

Apply the migration:

```bash
psql "$DIRECT_URL" -f prisma/migrations/add_outbox_and_notification_deliveries.sql
npx prisma generate
```

Run it:

```bash
npm run worker        # or: docker compose up worker
```

## Without the queue

`isQueueConfigured()` returns false when the env vars are unset, and
`/api/orders/create` falls back to the old inline send. Local development and
any deploy without AWS credentials keep working — a missing env var never costs
an order.

## Running more than one worker

Safe. The publisher claims rows with `FOR UPDATE SKIP LOCKED`, so a second
instance skips locked rows rather than double-publishing, and the consumer's
idempotency key covers duplicate deliveries.

## Operating the DLQ

Three things end up in there, and they want different handling:

1. **Hard SES rejection** — a typo'd address. Permanent; these are caught
   before the DLQ by the error classifier, so one appearing here means the
   classifier missed a case. Delete and fix validation at signup.
2. **Throttling during a burst** — transient. Redrive it.
3. **A payload shape change from a deploy** — messages written by the old
   producer that the new consumer can't parse. This is why `ORDER_EVENT_VERSION`
   exists in `lib/outbox/types.ts`: consumers branch on it and tolerate unknown
   fields, so a rollout doesn't strand what's already on the queue.

Redrive with `StartMessageMoveTask` or the console's redrive button. Don't
redrive blindly — check which of the three you have first, or a permanently bad
address just refills the DLQ.

---

# Delivery webhook ingestion (API Gateway → SQS)

DoorDash posts delivery status events — Dasher assigned, picked up, dropped
off. These used to go straight to `pages/api/webhooks/doordash.ts`, which meant
a deploy, a container restart or an OOM lost whatever arrived during the gap. A
lost `DASHER_PICKED_UP` leaves an order stuck on the customer's tracking page.

## Flow

```
DoorDash
  └─ POST → API Gateway (REST)
        ├─ validates body against a JSON Schema model
        ├─ throttles (20 rps, burst 40)
        └─ AWS service integration → SQS      ← no Lambda, no container
              ↓                                   returns 202 immediately
  worker: delivery consumer
        ├─ verifies the DoorDash shared secret
        └─ processDeliveryEvent() → update order → realtime broadcast
```

The point is what is **not** in the ingest path. No Lambda, no container, no
code of ours. The only things that must be up for an event to be accepted are
API Gateway and SQS. If the worker is down, events wait in the queue.

## Why REST API and not HTTP API

HTTP APIs are cheaper and lower latency, but they have no request validators and
no JSON Schema models. Validating the payload shape at the edge is half the
reason for a gateway here — a body with no `event_name` can never be processed,
so rejecting it at the edge keeps it off the queue entirely rather than spending
five receives and a DLQ slot to reach the same conclusion.

## Where authentication happens, and why it's not at the edge

The gateway has no compute in it, so it cannot verify DoorDash's shared secret.
That is the deliberate trade for an ingest path that can't be taken down by our
container.

The mapping template forwards the `Authorization` header into the message
envelope, and `lib/doordash/webhookAuth.ts` verifies it in the consumer — with a
constant-time compare — before anything touches the database. Someone who finds
the endpoint can put garbage on the queue; they cannot change an order. Edge
throttling bounds how much garbage.

If that trade ever stops being acceptable, the upgrade is a Lambda authorizer or
a REST API key, at the cost of putting compute back in the path.

## The message envelope

The mapping template wraps DoorDash's body:

```json
{
  "headers": { "authorization": "Basic ..." },
  "requestId": "...",
  "receivedAt": "1789000000000",
  "body": { "event_name": "DASHER_PICKED_UP", "delivery_id": "..." }
}
```

`$input.json('$')` is inserted raw. Passing it through `$util.escapeJavaScript`
— the obvious-looking thing to do — produces a string of escaped quotes in an
object position, which is not valid JSON. The header value *is* escaped, because
it lands inside a JSON string literal.

`worker/__tests__/gatewayTemplate.test.ts` renders the template straight out of
the `.tf` file and feeds the result through the real consumer, so that seam is
covered by a test rather than by hope.

## Idempotency

Delivery events are naturally idempotent — setting a status to the value it
already has is a no-op — with one exception. `DASHER_PICKED_UP` and
`DASHER_DROPPED_OFF` fall back to `new Date()` when DoorDash omits a timestamp,
so a redelivery would overwrite the real pickup time with whenever the retry
ran. Both are now guarded to stamp only once.

## Setup

```bash
cd infra
terraform apply
```

Then point the DoorDash developer portal webhook at the `doordash_webhook_url`
output, and set on the worker:

```
SQS_DELIVERY_EVENTS_QUEUE_URL=<delivery_events_queue_url output>
DOORDASH_WEBHOOK_AUTH_HEADER=<the exact Authorization value DoorDash sends>
```

## Fallback

`pages/api/webhooks/doordash.ts` still works and runs the same
`processDeliveryEvent`, so the two paths can't drift. It's there for local
development and as a way back if the gateway needs bypassing. It logs a warning
if it receives traffic while the queue is configured, which usually means
DoorDash is still pointed at the old URL.

## Tests

```bash
npm run test:outbox     # 30 assertions — order pipeline
npm run test:delivery   # 19 assertions — delivery consumer
npm run test:gateway    # 14 assertions — mapping template contract
```

All three need a Postgres and the schema applied; SQS and SES are stubbed at the
SDK client.
