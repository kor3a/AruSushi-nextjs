/**
 * Order events worker.
 *
 * Two independent loops in one process:
 *
 *   publisher — drains the transactional outbox to SQS
 *   consumer  — long-polls SQS and sends the notifications
 *
 * They're separate so a slow SES call can't stall the outbox, and so either
 * side can be scaled out later by running the process with one loop disabled.
 * Both are safe to run in multiple copies: the publisher claims rows with
 * SKIP LOCKED, and the consumer is idempotent per order per channel.
 */
import { prisma } from '../lib/db';
import { drainOutbox, recoverStalePublishing } from '../lib/outbox/publisher';
import {
  orderEventsQueue,
  deliveryEventsQueue,
  isQueueConfigured,
} from '../lib/queue/sqs';
import {
  handleOrderEvent,
  UnprocessableMessageError,
} from '../lib/queue/orderEventConsumer';
import {
  handleDeliveryEvent,
  UnprocessableDeliveryEventError,
  type DeliveryEventEnvelope,
} from '../lib/queue/deliveryEventConsumer';
import type { OutboxMessage } from '../lib/outbox/types';

const PUBLISH_INTERVAL_MS = Number(process.env.OUTBOX_PUBLISH_INTERVAL_MS || 2000);
const STALE_RECOVERY_INTERVAL_MS = 60_000;

let shuttingDown = false;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function publisherLoop(): Promise<void> {
  let lastRecovery = 0;

  while (!shuttingDown) {
    try {
      const now = Date.now();
      if (now - lastRecovery > STALE_RECOVERY_INTERVAL_MS) {
        await recoverStalePublishing();
        lastRecovery = now;
      }

      const result = await drainOutbox();

      if (result.published > 0 || result.failed > 0) {
        console.log(
          `[publisher] claimed=${result.claimed} published=${result.published} failed=${result.failed}`
        );
      }

      // Only idle when there was nothing to do. A full batch means there's
      // probably more waiting, so come straight back for it.
      if (result.claimed === 0) {
        await sleep(PUBLISH_INTERVAL_MS);
      }
    } catch (error: any) {
      console.error('[publisher] loop error:', error?.message || error);
      await sleep(PUBLISH_INTERVAL_MS);
    }
  }
}

/**
 * One consumer loop, shared by both queues.
 *
 * `isUnprocessable` decides which errors are the message's own fault. Those get
 * deleted rather than retried, so the DLQ only ever collects failures a person
 * can actually do something about. Everything else is left on the queue to
 * reappear after the visibility timeout and, after maxReceiveCount, land in the
 * DLQ.
 */
async function consumerLoop<T>(
  label: string,
  queue: { receive: (n?: number) => Promise<any[]>; delete: (h: string) => Promise<void> },
  handle: (message: T) => Promise<unknown>,
  isUnprocessable: (error: unknown) => boolean
): Promise<void> {
  while (!shuttingDown) {
    try {
      const messages = await queue.receive();

      for (const message of messages) {
        if (!message.Body || !message.ReceiptHandle) continue;

        const receiveCount = Number(
          message.Attributes?.ApproximateReceiveCount || 1
        );

        let parsed: T;
        try {
          parsed = JSON.parse(message.Body) as T;
        } catch {
          console.error(
            `[${label}] message ${message.MessageId} is not valid JSON, deleting`
          );
          await queue.delete(message.ReceiptHandle);
          continue;
        }

        try {
          await handle(parsed);
          await queue.delete(message.ReceiptHandle);
        } catch (error: any) {
          if (isUnprocessable(error)) {
            console.error(
              `[${label}] unprocessable message ${message.MessageId}: ${error.message}`
            );
            await queue.delete(message.ReceiptHandle);
            continue;
          }

          console.error(
            `[${label}] failed ${message.MessageId} (receive ${receiveCount}): ${
              error?.message || error
            }`
          );
        }
      }
    } catch (error: any) {
      console.error(`[${label}] loop error:`, error?.message || error);
      await sleep(5000);
    }
  }
}

async function main(): Promise<void> {
  if (!isQueueConfigured()) {
    console.error(
      'SQS is not configured. Set SQS_ORDER_EVENTS_QUEUE_URL, AWS_ACCESS_KEY_ID ' +
        'and AWS_SECRET_ACCESS_KEY. See SQS_SETUP.md.'
    );
    process.exit(1);
  }

  console.log(`[worker] order events: ${orderEventsQueue.queueUrl}`);

  const shutdown = (signal: string) => {
    console.log(`[worker] ${signal} received, finishing in-flight work`);
    shuttingDown = true;
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  const loops: Promise<void>[] = [
    publisherLoop(),
    consumerLoop<OutboxMessage>(
      'order-consumer',
      orderEventsQueue,
      handleOrderEvent,
      (error) => error instanceof UnprocessableMessageError
    ),
  ];

  // The delivery queue is fed by API Gateway rather than by us, so it's
  // configured independently — the worker runs with or without it.
  if (deliveryEventsQueue.isConfigured()) {
    console.log(`[worker] delivery events: ${deliveryEventsQueue.queueUrl}`);
    loops.push(
      consumerLoop<DeliveryEventEnvelope>(
        'delivery-consumer',
        deliveryEventsQueue,
        handleDeliveryEvent,
        (error) => error instanceof UnprocessableDeliveryEventError
      )
    );
  } else {
    console.log(
      '[worker] delivery events queue not configured; DoorDash webhooks will ' +
        'use the direct Next.js route'
    );
  }

  await Promise.all(loops);

  await prisma.$disconnect();
  console.log('[worker] stopped');
}

main().catch((error) => {
  console.error('[worker] fatal:', error);
  process.exit(1);
});
