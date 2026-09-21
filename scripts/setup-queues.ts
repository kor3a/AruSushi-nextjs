/**
 * Create the order-notification queue and its dead-letter queue.
 *
 * This is the infrastructure half of the notification pipeline, kept in the
 * repo so the queues are reproducible rather than hand-clicked in the console.
 * It is idempotent: CreateQueue returns the existing queue when the name and
 * attributes already match, and the redrive policy is re-applied each run.
 *
 * Run with: npm run queues:setup
 * Then copy the printed URLs into .env.
 */
import {
  CreateQueueCommand,
  GetQueueAttributesCommand,
  SetQueueAttributesCommand,
} from '@aws-sdk/client-sqs';
import { getSqsClient, QUEUE_NAMES } from '../lib/queue/sqs';

/** Deliveries attempted before SQS moves a message to the DLQ. */
const MAX_RECEIVE_COUNT = 5;

/** Must be >= the worker's per-message processing time. */
const VISIBILITY_TIMEOUT_SECONDS = 60;

/** Keep failed notifications for two weeks so they can be inspected/redriven. */
const DLQ_RETENTION_SECONDS = 14 * 24 * 60 * 60;

/** Enables long polling on the main queue. */
const RECEIVE_WAIT_TIME_SECONDS = 20;

async function createQueue(
  queueName: string,
  attributes: Record<string, string>
): Promise<string> {
  const result = await getSqsClient().send(
    new CreateQueueCommand({ QueueName: queueName, Attributes: attributes })
  );
  if (!result.QueueUrl) {
    throw new Error(`CreateQueue returned no URL for ${queueName}`);
  }
  return result.QueueUrl;
}

async function getQueueArn(queueUrl: string): Promise<string> {
  const result = await getSqsClient().send(
    new GetQueueAttributesCommand({
      QueueUrl: queueUrl,
      AttributeNames: ['QueueArn'],
    })
  );
  const arn = result.Attributes?.QueueArn;
  if (!arn) {
    throw new Error(`Could not read QueueArn for ${queueUrl}`);
  }
  return arn;
}

async function main(): Promise<void> {
  console.log('Region:', process.env.AWS_REGION || 'us-east-1');

  // 1. The DLQ must exist first so its ARN can go in the main queue's policy.
  const dlqUrl = await createQueue(QUEUE_NAMES.dlq, {
    MessageRetentionPeriod: String(DLQ_RETENTION_SECONDS),
  });
  const dlqArn = await getQueueArn(dlqUrl);
  console.log('Dead-letter queue ready:', dlqUrl);

  // 2. The main queue points at the DLQ via its redrive policy. After
  //    MAX_RECEIVE_COUNT failed deliveries SQS moves the message across
  //    automatically - the worker never has to implement retry itself.
  const redrivePolicy = JSON.stringify({
    deadLetterTargetArn: dlqArn,
    maxReceiveCount: MAX_RECEIVE_COUNT,
  });

  const queueUrl = await createQueue(QUEUE_NAMES.main, {
    VisibilityTimeout: String(VISIBILITY_TIMEOUT_SECONDS),
    ReceiveMessageWaitTimeSeconds: String(RECEIVE_WAIT_TIME_SECONDS),
    RedrivePolicy: redrivePolicy,
  });

  // Re-apply on every run so an existing queue picks up policy changes.
  await getSqsClient().send(
    new SetQueueAttributesCommand({
      QueueUrl: queueUrl,
      Attributes: {
        VisibilityTimeout: String(VISIBILITY_TIMEOUT_SECONDS),
        ReceiveMessageWaitTimeSeconds: String(RECEIVE_WAIT_TIME_SECONDS),
        RedrivePolicy: redrivePolicy,
      },
    })
  );

  console.log('Order notification queue ready:', queueUrl);
  console.log(`Redrive policy: ${MAX_RECEIVE_COUNT} attempts, then -> ${dlqArn}`);
  console.log('\nAdd these to .env:\n');
  console.log(`SQS_ORDER_NOTIFICATIONS_URL="${queueUrl}"`);
  console.log(`SQS_ORDER_NOTIFICATIONS_DLQ_URL="${dlqUrl}"`);
}

main().catch((error) => {
  console.error('Queue setup failed:', error);
  process.exit(1);
});
