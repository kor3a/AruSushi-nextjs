import { db, prisma } from '../db';
import {
  sendOrderNotificationToRestaurant,
  sendOrderConfirmationToCustomer,
} from '../email/sendOrderNotification';
import { EmailSendError } from '../email/errors';
import { ORDER_EVENT_VERSION, type OutboxMessage } from '../outbox/types';
import type { Order } from '../db';

export type NotificationChannel =
  | 'restaurant_notification'
  | 'customer_confirmation';

/**
 * Thrown when a message can never be processed successfully. The worker deletes
 * these rather than letting them cycle to the DLQ, since nothing downstream can
 * act on them.
 */
export class UnprocessableMessageError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnprocessableMessageError';
  }
}

async function alreadyDelivered(
  orderId: string,
  channel: NotificationChannel
): Promise<boolean> {
  const rows = await prisma.$queryRaw<{ id: string }[]>`
    SELECT id FROM notification_deliveries
    WHERE order_id = ${orderId}::uuid AND channel = ${channel}
    LIMIT 1
  `;

  return rows.length > 0;
}

async function recordDelivery(
  orderId: string,
  channel: NotificationChannel,
  messageId: string | null
): Promise<void> {
  await prisma.$executeRaw`
    INSERT INTO notification_deliveries (order_id, channel, message_id)
    VALUES (${orderId}::uuid, ${channel}, ${messageId})
    ON CONFLICT (order_id, channel) DO NOTHING
  `;
}

/**
 * Send one notification, exactly once per order per channel.
 *
 * The check-send-record order matters. Recording before sending would mark a
 * notification delivered that never went out if SES then failed; recording
 * after means the worst case is a duplicate email when two consumers race the
 * same message, which is the right way round for a restaurant order.
 */
async function deliver(
  order: Order,
  channel: NotificationChannel,
  send: (order: Order) => Promise<{ MessageId?: string } | null | undefined>
): Promise<void> {
  if (await alreadyDelivered(order.id, channel)) {
    console.log(`[consumer] ${channel} already delivered for ${order.id}, skipping`);
    return;
  }

  try {
    const result = await send(order);
    await recordDelivery(order.id, channel, result?.MessageId ?? null);
    console.log(`[consumer] ${channel} sent for ${order.id}`);
  } catch (error) {
    if (error instanceof EmailSendError && error.permanent) {
      // A bad address is not going to become a good one. Record it so the
      // message can be deleted instead of burning five receives on its way to
      // a DLQ nobody can drain, and leave the reason in the row for anyone
      // auditing why a customer never got their confirmation.
      await recordDelivery(order.id, channel, `permanent-failure: ${error.message}`);
      console.error(
        `[consumer] ${channel} permanently failed for ${order.id}: ${error.message}`
      );
      return;
    }

    // Transient. Let it propagate: the message stays on the queue, becomes
    // visible again after the visibility timeout, and gets retried.
    throw error;
  }
}

export async function handleOrderEvent(message: OutboxMessage): Promise<void> {
  if (message.eventType !== 'order.created') {
    throw new UnprocessableMessageError(`Unknown event type: ${message.eventType}`);
  }

  const { payload } = message;

  if (payload?.version !== ORDER_EVENT_VERSION) {
    throw new UnprocessableMessageError(
      `Unsupported payload version ${payload?.version} (expected ${ORDER_EVENT_VERSION})`
    );
  }

  // Only the id travelled in the message, so read current state rather than
  // trusting a snapshot that may be a minute stale.
  const order = await db.findOrderById(payload.orderId);

  if (!order) {
    throw new UnprocessableMessageError(`Order ${payload.orderId} not found`);
  }

  if (order.paymentStatus !== 'paid') {
    console.log(
      `[consumer] order ${order.id} is ${order.paymentStatus}, not sending notifications`
    );
    return;
  }

  // Sequential, not Promise.all: if the restaurant notification throws a
  // transient error we want the whole message retried, and the customer
  // confirmation's own idempotency key stops it being sent twice.
  await deliver(order, 'restaurant_notification', sendOrderNotificationToRestaurant);
  await deliver(order, 'customer_confirmation', sendOrderConfirmationToCustomer);
}
