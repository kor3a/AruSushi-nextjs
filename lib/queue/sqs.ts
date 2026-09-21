import { SQSClient } from '@aws-sdk/client-sqs';

/**
 * Shared SQS client and queue configuration.
 *
 * Credentials follow the same pattern as the SES client in
 * lib/email/sendOrderNotification.ts: explicit env vars when present,
 * otherwise the default provider chain (useful for IAM task roles).
 */

let client: SQSClient | null = null;

export function getSqsClient(): SQSClient {
  if (!client) {
    const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

    client = new SQSClient({
      region: process.env.AWS_REGION || 'us-east-1',
      ...(accessKeyId && secretAccessKey
        ? { credentials: { accessKeyId, secretAccessKey } }
        : {}),
      ...(process.env.AWS_SQS_ENDPOINT ? { endpoint: process.env.AWS_SQS_ENDPOINT } : {}),
    });
  }
  return client;
}

export function getOrderNotificationQueueUrl(): string | undefined {
  return process.env.SQS_ORDER_NOTIFICATIONS_URL || undefined;
}

export function getOrderNotificationDlqUrl(): string | undefined {
  return process.env.SQS_ORDER_NOTIFICATIONS_DLQ_URL || undefined;
}

/**
 * When no queue is configured the app falls back to sending inline, so local
 * development and existing deployments keep working without SQS.
 */
export function isQueueConfigured(): boolean {
  return Boolean(getOrderNotificationQueueUrl());
}

export const QUEUE_NAMES = {
  main: process.env.SQS_ORDER_NOTIFICATIONS_NAME || 'arusushi-order-notifications',
  dlq: process.env.SQS_ORDER_NOTIFICATIONS_DLQ_NAME || 'arusushi-order-notifications-dlq',
};
