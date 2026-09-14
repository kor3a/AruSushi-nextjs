/**
 * Message schema for the order events queue.
 *
 * `version` is deliberate: a deploy that changes this shape will find messages
 * written by the previous producer still sitting on the queue, and a consumer
 * that can't parse them sends perfectly good orders to the DLQ. Consumers
 * branch on the version and tolerate fields they don't recognize.
 */
export const ORDER_EVENT_VERSION = 1;

export type OutboxEventType = 'order.created';

export interface OrderCreatedPayload {
  version: number;
  orderId: string;
  userId: string;
  /**
   * Only identifiers travel in the message. The consumer reads current order
   * state from Postgres, so a message that sits in the queue for a minute
   * doesn't email a stale total.
   */
  occurredAt: string;
}

export interface OutboxMessage {
  eventId: string;
  eventType: OutboxEventType;
  payload: OrderCreatedPayload;
}
