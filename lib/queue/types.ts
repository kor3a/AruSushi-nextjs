/**
 * Contract for messages on the order-notification queue.
 *
 * Only the order id travels on the queue. The worker re-reads the order from
 * the database, so a message that sits in the queue (or gets redriven from the
 * DLQ hours later) still sends the current state of the order rather than a
 * stale snapshot.
 */
export type OrderNotificationType = 'restaurant_new_order' | 'customer_confirmation';

export const ORDER_NOTIFICATION_TYPES: OrderNotificationType[] = [
  'restaurant_new_order',
  'customer_confirmation',
];

export interface OrderNotificationMessage {
  /** Schema version, so the worker can reject messages it does not understand. */
  version: 1;
  type: OrderNotificationType;
  orderId: string;
  /** Set by the producer; used only for logging end-to-end latency. */
  enqueuedAt: string;
}

export function isOrderNotificationMessage(
  value: unknown
): value is OrderNotificationMessage {
  if (!value || typeof value !== 'object') return false;
  const message = value as Partial<OrderNotificationMessage>;
  return (
    message.version === 1 &&
    typeof message.orderId === 'string' &&
    message.orderId.length > 0 &&
    typeof message.type === 'string' &&
    ORDER_NOTIFICATION_TYPES.includes(message.type as OrderNotificationType)
  );
}
