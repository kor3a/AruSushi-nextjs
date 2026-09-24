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

function hasCredentials(): boolean {
  return !!(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
}

/**
 * One queue's worth of operations. There are two queues in this system and
 * they have different producers: order events are published by our own outbox
 * publisher, delivery events are written straight into SQS by API Gateway with
 * no code of ours in the path.
 */
export class Queue {
  constructor(private readonly url: string) {}

  isConfigured(): boolean {
    return !!this.url && hasCredentials();
  }

  get queueUrl(): string {
    return this.url;
  }

  async send(body: unknown): Promise<string | undefined> {
    const result = await sqs.send(
      new SendMessageCommand({
        QueueUrl: this.url,
        MessageBody: JSON.stringify(body),
      })
    );

    return result.MessageId;
  }

  /**
   * Long poll. WaitTimeSeconds of 20 is the maximum and keeps us from paying
   * for a stream of empty receives on a quiet afternoon.
   */
  async receive(maxMessages = 10): Promise<Message[]> {
    const result = await sqs.send(
      new ReceiveMessageCommand({
        QueueUrl: this.url,
        MaxNumberOfMessages: maxMessages,
        WaitTimeSeconds: 20,
        MessageAttributeNames: ['All'],
        // Needed so the consumer can log which receive this is — the number
        // that tells you how close a message is to the DLQ.
        MessageSystemAttributeNames: ['ApproximateReceiveCount'],
      })
    );

    return result.Messages || [];
  }

  async delete(receiptHandle: string): Promise<void> {
    await sqs.send(
      new DeleteMessageCommand({
        QueueUrl: this.url,
        ReceiptHandle: receiptHandle,
      })
    );
  }

  /**
   * Return a message to the queue immediately instead of waiting out the
   * visibility timeout.
   */
  async release(receiptHandle: string, delaySeconds = 0): Promise<void> {
    await sqs.send(
      new ChangeMessageVisibilityCommand({
        QueueUrl: this.url,
        ReceiptHandle: receiptHandle,
        VisibilityTimeout: delaySeconds,
      })
    );
  }
}

/** Order lifecycle events, published from the transactional outbox. */
export const orderEventsQueue = new Queue(
  process.env.SQS_ORDER_EVENTS_QUEUE_URL || ''
);

/**
 * DoorDash delivery status events. API Gateway writes to this queue directly
 * via an AWS service integration — nothing of ours runs at ingest time.
 */
export const deliveryEventsQueue = new Queue(
  process.env.SQS_DELIVERY_EVENTS_QUEUE_URL || ''
);

export const ORDER_EVENTS_QUEUE_URL = orderEventsQueue.queueUrl;

/**
 * Whether the order pipeline is wired up. When false the order handler falls
 * back to sending notifications inline, so a missing env var never costs the
 * restaurant a ticket.
 */
export function isQueueConfigured(): boolean {
  return orderEventsQueue.isConfigured();
}

/** Whether delivery webhooks are being ingested through API Gateway + SQS. */
export function isDeliveryQueueConfigured(): boolean {
  return deliveryEventsQueue.isConfigured();
}

export async function sendMessage(body: unknown): Promise<string | undefined> {
  return orderEventsQueue.send(body);
}

export async function receiveMessages(maxMessages = 10): Promise<Message[]> {
  return orderEventsQueue.receive(maxMessages);
}

export async function deleteMessage(receiptHandle: string): Promise<void> {
  return orderEventsQueue.delete(receiptHandle);
}

export async function releaseMessage(
  receiptHandle: string,
  delaySeconds = 0
): Promise<void> {
  return orderEventsQueue.release(receiptHandle, delaySeconds);
}
