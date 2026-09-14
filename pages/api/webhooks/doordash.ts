import type { NextApiRequest, NextApiResponse } from 'next';
import { verifyWebhookAuth } from '../../../lib/doordash/webhookAuth';
import {
  processDeliveryEvent,
  type DoorDashWebhookPayload,
} from '../../../lib/doordash/processDeliveryEvent';
import { isDeliveryQueueConfigured } from '../../../lib/queue/sqs';

export const config = {
  api: { bodyParser: true },
};

/**
 * Direct webhook endpoint for DoorDash delivery events.
 *
 * This is the fallback path. In production DoorDash points at API Gateway,
 * which validates the payload and writes it straight to SQS with no compute in
 * between, so delivery events survive a deploy or a container restart — see
 * infra/api_gateway.tf. The worker consumes that queue and calls the same
 * processDeliveryEvent used here, so the two paths can't drift.
 *
 * This route stays for local development and as a way back if the gateway ever
 * needs to be bypassed.
 */
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  if (!verifyWebhookAuth(req.headers.authorization)) {
    console.warn('DoorDash webhook: auth verification failed');
    return res.status(401).json({ message: 'Unauthorized' });
  }

  if (isDeliveryQueueConfigured()) {
    console.warn(
      'DoorDash webhook hit the direct route while the queue is configured — ' +
        'check that DoorDash points at the API Gateway endpoint.'
    );
  }

  try {
    const outcome = await processDeliveryEvent(req.body as DoorDashWebhookPayload);

    // 200 on everything DoorDash can't fix by resending. A 4xx or 5xx makes
    // them retry, which for an unknown event or an unmatched delivery just
    // repeats the same no-op.
    return res.status(200).json({
      received: true,
      matched: outcome.status === 'processed',
    });
  } catch (error: any) {
    console.error('DoorDash webhook error:', error);
    return res.status(200).json({ received: true, error: error.message });
  }
}
