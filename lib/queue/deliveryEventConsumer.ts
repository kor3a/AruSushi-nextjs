import { verifyWebhookAuth } from '../doordash/webhookAuth';
import {
  processDeliveryEvent,
  type DoorDashWebhookPayload,
  type ProcessOutcome,
} from '../doordash/processDeliveryEvent';

/**
 * What API Gateway puts on the queue.
 *
 * The gateway's mapping template wraps the raw DoorDash body in an envelope
 * carrying the headers we need, because nothing of ours runs at the edge to
 * inspect them — see infra/api_gateway.tf.
 */
export interface DeliveryEventEnvelope {
  headers?: {
    authorization?: string;
  };
  body: DoorDashWebhookPayload;
  receivedAt?: string;
  requestId?: string;
}

export class UnprocessableDeliveryEventError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnprocessableDeliveryEventError';
  }
}

export async function handleDeliveryEvent(
  envelope: DeliveryEventEnvelope
): Promise<ProcessOutcome> {
  // Authenticity is established here rather than at the gateway. API Gateway
  // validates the payload's shape and throttles, but has no compute in it, so
  // it cannot check a shared secret — this runs before anything touches the
  // database, which is the boundary that actually matters.
  if (!verifyWebhookAuth(envelope.headers?.authorization)) {
    throw new UnprocessableDeliveryEventError(
      'webhook auth verification failed'
    );
  }

  if (!envelope.body || typeof envelope.body !== 'object') {
    throw new UnprocessableDeliveryEventError('envelope has no body');
  }

  return processDeliveryEvent(envelope.body);
}
