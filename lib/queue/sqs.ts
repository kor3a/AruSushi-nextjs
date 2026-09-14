import {
  SQSClient,
  SendMessageCommand,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  ChangeMessageVisibilityCommand,
  type Message,
} from '@aws-sdk/client-sqs';

const region = process.env.AWS_REGION || 'us-east-1';

const sqs = new SQSClient({
  region,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export const ORDER_EVENTS_QUEUE_URL = process.env.SQS_ORDER_EVENTS_QUEUE_URL || '';

/**
 * Whether the queue is wired up. Mirrors the DoorDash client: when it isn't
 * configured the app degrades to sending notifications inline rather than
 * failing an order, so a missing env var never costs the restaurant a ticket.
 */
export function isQueueConfigured(): boolean {
  return !!(
    ORDER_EVENTS_QUEUE_URL &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  );
}

export async function sendMessage(body: unknown): Promise<string | undefined> {
  const result = await sqs.send(
    new SendMessageCommand({
      QueueUrl: ORDER_EVENTS_QUEUE_URL,
      MessageBody: JSON.stringify(body),
    })
  );

  return result.MessageId;
}

/**
 * Long poll. WaitTimeSeconds of 20 is the maximum and keeps us from paying for
 * a stream of empty receives on a quiet afternoon.
 */
export async function receiveMessages(maxMessages = 10): Promise<Message[]> {
  const result = await sqs.send(
    new ReceiveMessageCommand({
      QueueUrl: ORDER_EVENTS_QUEUE_URL,
      MaxNumberOfMessages: maxMessages,
      WaitTimeSeconds: 20,
      MessageAttributeNames: ['All'],
      // Needed so the consumer can log which receive this is — the number that
      // tells you how close a message is to the DLQ.
      MessageSystemAttributeNames: ['ApproximateReceiveCount'],
    })
  );

  return result.Messages || [];
}

export async function deleteMessage(receiptHandle: string): Promise<void> {
  await sqs.send(
    new DeleteMessageCommand({
      QueueUrl: ORDER_EVENTS_QUEUE_URL,
      ReceiptHandle: receiptHandle,
    })
  );
}

/**
 * Return a message to the queue immediately instead of waiting out the
 * visibility timeout. Used when we know a failure is transient and want the
 * retry sooner than 30 seconds from now.
 */
export async function releaseMessage(
  receiptHandle: string,
  delaySeconds = 0
): Promise<void> {
  await sqs.send(
    new ChangeMessageVisibilityCommand({
      QueueUrl: ORDER_EVENTS_QUEUE_URL,
      ReceiptHandle: receiptHandle,
      VisibilityTimeout: delaySeconds,
    })
  );
}
