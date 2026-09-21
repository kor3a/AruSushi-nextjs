import { SendMessageBatchCommand } from '@aws-sdk/client-sqs';
import { Order } from '../db';
import {
  sendOrderNotificationToRestaurant,
  sendOrderConfirmationToCustomer,
} from '../email/sendOrderNotification';
import { getSqsClient, getOrderNotificationQueueUrl, isQueueConfigured } from './sqs';
import { OrderNotificationMessage, OrderNotificationType } from './types';

function buildMessage(
  type: OrderNotificationType,
  orderId: string
): OrderNotificationMessage {
  return {
    version: 1,
    type,
    orderId,
    enqueuedAt: new Date().toISOString(),
  };
}

/**
 * Send the notifications inline, the way the request handler used to.
 *
 * Used only when SQS is not configured, or as a last resort when the enqueue
 * itself fails - losing the queue should not also lose the order notification.
 */
async function sendInline(order: Order, types: OrderNotificationType[]): Promise<void> {
  await Promise.allSettled(
    types.map((type) =>
      type === 'restaurant_new_order'
        ? sendOrderNotificationToRestaurant(order)
        : sendOrderConfirmationToCustomer(order)
    )
  );
}

export interface EnqueueResult {
  queued: boolean;
  /** True when the queue was unavailable and the email was sent inline. */
  fellBack: boolean;
}

/**
 * Hand order notifications to SQS instead of emailing from the request path.
 *
 * The API route awaits this, but it is a single batched SQS call rather than
 * two SES round-trips, so a slow or failing SES no longer holds up (or drops)
 * an order during a dinner rush. Retries and the dead-letter queue are handled
 * by SQS itself - see scripts/setup-queues.ts for the redrive policy.
 */
export async function enqueueOrderNotifications(
  order: Order,
  types: OrderNotificationType[] = ['restaurant_new_order', 'customer_confirmation']
): Promise<EnqueueResult> {
  if (types.length === 0) {
    return { queued: false, fellBack: false };
  }

  const queueUrl = getOrderNotificationQueueUrl();

  if (!isQueueConfigured() || !queueUrl) {
    console.warn(
      'SQS_ORDER_NOTIFICATIONS_URL is not set; sending order notifications inline.'
    );
    await sendInline(order, types);
    return { queued: false, fellBack: true };
  }

  try {
    const result = await getSqsClient().send(
      new SendMessageBatchCommand({
        QueueUrl: queueUrl,
        Entries: types.map((type) => ({
          Id: type,
          MessageBody: JSON.stringify(buildMessage(type, order.id)),
          MessageAttributes: {
            notificationType: { DataType: 'String', StringValue: type },
            orderId: { DataType: 'String', StringValue: order.id },
          },
        })),
      })
    );

    const failed = result.Failed || [];
    if (failed.length > 0) {
      console.error('Some order notifications failed to enqueue:', failed);
      const failedTypes = failed
        .map((entry) => entry.Id as OrderNotificationType)
        .filter((type): type is OrderNotificationType => Boolean(type));
      await sendInline(order, failedTypes);
      return { queued: failed.length < types.length, fellBack: true };
    }

    console.log('Order notifications enqueued:', {
      orderId: order.id,
      types,
      messageIds: (result.Successful || []).map((entry) => entry.MessageId),
    });
    return { queued: true, fellBack: false };
  } catch (error: any) {
    // The queue is the durable path, so a failure to reach it is the one case
    // where sending inline is better than giving up.
    console.error(
      'Failed to enqueue order notifications, falling back to inline send:',
      error?.message || error
    );
    await sendInline(order, types);
    return { queued: false, fellBack: true };
  }
}
