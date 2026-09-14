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
  receiveMessages,
  deleteMessage,
  isQueueConfigured,
  ORDER_EVENTS_QUEUE_URL,
} from '../lib/queue/sqs';
import {
  handleOrderEvent,
  UnprocessableMessageError,
} from '../lib/queue/orderEventConsumer';
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

async function consumerLoop(): Promise<void> {
  while (!shuttingDown) {
    try {
      const messages = await receiveMessages();

      for (const message of messages) {
        if (!message.Body || !message.ReceiptHandle) continue;

        const receiveCount = Number(
          message.Attributes?.ApproximateReceiveCount || 1
        );

        let parsed: OutboxMessage;
        try {
          parsed = JSON.parse(message.Body) as OutboxMessage;
        } catch {
          console.error(
            `[consumer] message ${message.MessageId} is not valid JSON, deleting`
          );
          await deleteMessage(message.ReceiptHandle);
          continue;
        }

        try {
          await handleOrderEvent(parsed);
          await deleteMessage(message.ReceiptHandle);
        } catch (error: any) {
          if (error instanceof UnprocessableMessageError) {
            // Nothing downstream can act on this. Deleting keeps the DLQ for
            // failures a human can actually do something about.
            console.error(
              `[consumer] unprocessable message ${message.MessageId}: ${error.message}`
            );
            await deleteMessage(message.ReceiptHandle);
            continue;
          }

          // Leave it on the queue. It reappears after the visibility timeout,
          // and after maxReceiveCount it lands in the DLQ.
          console.error(
            `[consumer] failed ${message.MessageId} (receive ${receiveCount}): ${
              error?.message || error
            }`
          );
        }
      }
    } catch (error: any) {
      console.error('[consumer] loop error:', error?.message || error);
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

  console.log(`[worker] starting against ${ORDER_EVENTS_QUEUE_URL}`);

  const shutdown = (signal: string) => {
    console.log(`[worker] ${signal} received, finishing in-flight work`);
    shuttingDown = true;
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));

  await Promise.all([publisherLoop(), consumerLoop()]);

  await prisma.$disconnect();
  console.log('[worker] stopped');
}

main().catch((error) => {
  console.error('[worker] fatal:', error);
  process.exit(1);
});
