/**
 * Order notification worker.
 *
 * Long-polls the order-notification queue and turns each message into an SES
 * send. This is the half of the pipeline that makes a dinner-rush burst safe:
 * the web request only enqueues, and a slow or failing SES retries here
 * instead of dropping the notification.
 *
 * Failure handling is delegated to SQS:
 *   - the message is deleted only after a successful send
 *   - a thrown error leaves the message in flight; once the visibility timeout
 *     expires SQS redelivers it
 *   - after maxReceiveCount deliveries SQS moves it to the DLQ
 *     (redrive policy set in scripts/setup-queues.ts)
 *
 * Run with: npm run worker
 */
import {
  ReceiveMessageCommand,
  DeleteMessageCommand,
  ChangeMessageVisibilityCommand,
  Message,
} from '@aws-sdk/client-sqs';
import { db } from '../lib/db';
import {
  sendOrderNotificationToRestaurant,
  sendOrderConfirmationToCustomer,
} from '../lib/email/sendOrderNotification';
import { getSqsClient, getOrderNotificationQueueUrl } from '../lib/queue/sqs';
import { isOrderNotificationMessage, OrderNotificationMessage } from '../lib/queue/types';

const WAIT_TIME_SECONDS = Number(process.env.SQS_WAIT_TIME_SECONDS || 20);
const MAX_MESSAGES = Number(process.env.SQS_MAX_MESSAGES || 10);
const VISIBILITY_TIMEOUT_SECONDS = Number(process.env.SQS_VISIBILITY_TIMEOUT || 60);

let shuttingDown = false;

async function handleMessage(
  queueUrl: string,
  message: Message
): Promise<void> {
  const receiptHandle = message.ReceiptHandle;
  if (!receiptHandle) return;

  let parsed: unknown;
  try {
    parsed = JSON.parse(message.Body || '');
  } catch {
    // Unparseable body will never succeed. Delete it rather than letting it
    // cycle through to the DLQ and mask real failures.
    console.error('Discarding unparseable message:', message.MessageId);
    await getSqsClient().send(
      new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: receiptHandle })
    );
    return;
  }

  if (!isOrderNotificationMessage(parsed)) {
    console.error('Discarding message with unknown schema:', message.MessageId, parsed);
    await getSqsClient().send(
      new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: receiptHandle })
    );
    return;
  }

  const notification: OrderNotificationMessage = parsed;

  // Read the order fresh so a redriven message sends current state.
  const order = await db.findOrderById(notification.orderId);
  if (!order) {
    console.error(
      'Order no longer exists, discarding notification:',
      notification.orderId
    );
    await getSqsClient().send(
      new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: receiptHandle })
    );
    return;
  }

  // throwOnError: a transient SES failure must NOT delete the message.
  if (notification.type === 'restaurant_new_order') {
    await sendOrderNotificationToRestaurant(order, { throwOnError: true });
  } else {
    await sendOrderConfirmationToCustomer(order, { throwOnError: true });
  }

  await getSqsClient().send(
    new DeleteMessageCommand({ QueueUrl: queueUrl, ReceiptHandle: receiptHandle })
  );

  const latencyMs = Date.now() - new Date(notification.enqueuedAt).getTime();
  console.log('Notification sent:', {
    type: notification.type,
    orderId: notification.orderId,
    receiveCount: message.Attributes?.ApproximateReceiveCount,
    latencyMs,
  });
}

async function releaseMessage(queueUrl: string, message: Message): Promise<void> {
  // Make the message visible again immediately instead of waiting out the
  // visibility timeout, so a transient blip retries quickly.
  if (!message.ReceiptHandle) return;
  try {
    await getSqsClient().send(
      new ChangeMessageVisibilityCommand({
        QueueUrl: queueUrl,
        ReceiptHandle: message.ReceiptHandle,
        VisibilityTimeout: 5,
      })
    );
  } catch (error: any) {
    console.error('Could not reset visibility timeout:', error?.message || error);
  }
}

async function poll(queueUrl: string): Promise<void> {
  const response = await getSqsClient().send(
    new ReceiveMessageCommand({
      QueueUrl: queueUrl,
      MaxNumberOfMessages: MAX_MESSAGES,
      WaitTimeSeconds: WAIT_TIME_SECONDS,
      VisibilityTimeout: VISIBILITY_TIMEOUT_SECONDS,
      MessageAttributeNames: ['All'],
      // ApproximateReceiveCount shows how many delivery attempts a message has
      // used, i.e. how close it is to being moved to the DLQ.
      MessageSystemAttributeNames: ['ApproximateReceiveCount'],
    })
  );

  const messages = response.Messages || [];
  if (messages.length === 0) return;

  // Messages in a batch are independent, so one failure must not block others.
  await Promise.all(
    messages.map(async (message) => {
      try {
        await handleMessage(queueUrl, message);
      } catch (error: any) {
        console.error('Notification failed, leaving message for SQS retry:', {
          messageId: message.MessageId,
          receiveCount: message.Attributes?.ApproximateReceiveCount,
          error: error?.message || error,
        });
        await releaseMessage(queueUrl, message);
      }
    })
  );
}

async function main(): Promise<void> {
  const queueUrl = getOrderNotificationQueueUrl();
  if (!queueUrl) {
    console.error(
      'SQS_ORDER_NOTIFICATIONS_URL is not set. Run `npm run queues:setup` and add it to .env.'
    );
    process.exit(1);
  }

  console.log('Order notification worker started:', {
    queueUrl,
    region: process.env.AWS_REGION || 'us-east-1',
  });

  while (!shuttingDown) {
    try {
      await poll(queueUrl);
    } catch (error: any) {
      // Never let a polling error kill the loop; back off briefly and retry.
      console.error('Polling error:', error?.message || error);
      await new Promise((resolve) => setTimeout(resolve, 5000));
    }
  }

  console.log('Order notification worker stopped.');
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.on(signal, () => {
    if (shuttingDown) return;
    console.log(`Received ${signal}, finishing current batch before exit...`);
    shuttingDown = true;
  });
}

main().catch((error) => {
  console.error('Worker crashed:', error);
  process.exit(1);
});
