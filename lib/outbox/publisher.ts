import { prisma } from '../db';
import { sendMessage, isQueueConfigured } from '../queue/sqs';
import type { OutboxMessage, OutboxEventType, OrderCreatedPayload } from './types';

const MAX_PUBLISH_ATTEMPTS = 10;

type PendingRow = {
  id: string;
  event_type: string;
  aggregate_id: string;
  payload: OrderCreatedPayload;
  attempts: number;
};

export interface DrainResult {
  claimed: number;
  published: number;
  failed: number;
}

/**
 * Drain pending outbox rows to SQS.
 *
 * Runs inside a transaction and claims rows with FOR UPDATE SKIP LOCKED, so
 * two publisher instances can run concurrently without sending the same event
 * twice — the second one skips the locked rows instead of blocking on them.
 *
 * Publishing is still at-least-once: if the SendMessage succeeds but the
 * transaction fails to commit, the row stays pending and gets republished.
 * That's the correct trade — a duplicate message is handled by the consumer's
 * idempotency key, a lost message is not recoverable.
 */
export async function drainOutbox(batchSize = 10): Promise<DrainResult> {
  if (!isQueueConfigured()) {
    return { claimed: 0, published: 0, failed: 0 };
  }

  const result: DrainResult = { claimed: 0, published: 0, failed: 0 };

  const rows = await prisma.$transaction(async (tx) => {
    const pending = await tx.$queryRaw<PendingRow[]>`
      SELECT id, event_type, aggregate_id, payload, attempts
      FROM outbox_events
      WHERE status = 'pending'
      ORDER BY created_at ASC
      LIMIT ${batchSize}
      FOR UPDATE SKIP LOCKED
    `;

    if (pending.length > 0) {
      await tx.$executeRaw`
        UPDATE outbox_events
        SET status = 'publishing', updated_at = NOW()
        WHERE id = ANY(${pending.map((row) => row.id)}::uuid[])
      `;
    }

    return pending;
  });

  result.claimed = rows.length;

  for (const row of rows) {
    const message: OutboxMessage = {
      eventId: row.id,
      eventType: row.event_type as OutboxEventType,
      payload: row.payload,
    };

    try {
      await sendMessage(message);

      await prisma.$executeRaw`
        UPDATE outbox_events
        SET status = 'published', published_at = NOW(), updated_at = NOW()
        WHERE id = ${row.id}::uuid
      `;

      result.published += 1;
    } catch (error: any) {
      const attempts = row.attempts + 1;
      const exhausted = attempts >= MAX_PUBLISH_ATTEMPTS;

      // Back to 'pending' so the next pass retries it. Only after ten failed
      // attempts do we park it as 'failed' — at that point the queue itself is
      // the problem, and an alert on failed rows is the signal to look.
      await prisma.$executeRaw`
        UPDATE outbox_events
        SET status = ${exhausted ? 'failed' : 'pending'},
            attempts = ${attempts},
            last_error = ${String(error?.message || error).slice(0, 1000)},
            updated_at = NOW()
        WHERE id = ${row.id}::uuid
      `;

      result.failed += 1;
      console.error(
        `[outbox] publish failed for ${row.id} (attempt ${attempts}${
          exhausted ? ', giving up' : ''
        }):`,
        error?.message || error
      );
    }
  }

  return result;
}

/**
 * Rows left in 'publishing' by a publisher that died mid-batch. Without this,
 * a crash between claiming and sending strands the event forever.
 */
export async function recoverStalePublishing(olderThanSeconds = 60): Promise<number> {
  const recovered = await prisma.$executeRaw`
    UPDATE outbox_events
    SET status = 'pending', updated_at = NOW()
    WHERE status = 'publishing'
      AND updated_at < NOW() - (${olderThanSeconds} * INTERVAL '1 second')
  `;

  if (recovered > 0) {
    console.warn(`[outbox] recovered ${recovered} stale publishing row(s)`);
  }

  return recovered;
}
