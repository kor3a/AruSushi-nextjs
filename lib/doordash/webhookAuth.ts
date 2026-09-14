import { timingSafeEqual } from 'crypto';

/**
 * Constant-time string compare. A plain `===` on a shared secret leaks its
 * length and prefix through timing; this is cheap enough that there's no
 * reason not to.
 */
function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a, 'utf-8');
  const bufB = Buffer.from(b, 'utf-8');

  if (bufA.length !== bufB.length) {
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}

/**
 * Verify the shared secret DoorDash sends on delivery webhooks.
 *
 * Takes the header value rather than a request object so the same check runs
 * in two places: the Next.js route (when webhooks arrive directly) and the
 * queue consumer (when they arrive through API Gateway, which forwards the
 * header as a message attribute).
 *
 * Note on the API Gateway path: the gateway has no compute in it, so it cannot
 * verify this secret at the edge — that's the deliberate trade for an ingest
 * path that can't be taken down by our container. The gateway validates shape
 * and throttles; authenticity is established here, before anything touches the
 * database. An attacker who finds the endpoint can put garbage on the queue,
 * but cannot change an order.
 */
export function verifyWebhookAuth(authHeader?: string | null): boolean {
  const expectedHeader = process.env.DOORDASH_WEBHOOK_AUTH_HEADER;
  if (expectedHeader) {
    return !!authHeader && safeEqual(authHeader, expectedHeader);
  }

  const webhookUser = process.env.DOORDASH_WEBHOOK_USER;
  const webhookPass = process.env.DOORDASH_WEBHOOK_PASSWORD;
  if (webhookUser && webhookPass) {
    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return false;
    }

    let decoded: string;
    try {
      decoded = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8');
    } catch {
      return false;
    }

    const separator = decoded.indexOf(':');
    if (separator === -1) return false;

    const user = decoded.slice(0, separator);
    const pass = decoded.slice(separator + 1);

    return safeEqual(user, webhookUser) && safeEqual(pass, webhookPass);
  }

  console.warn('DoorDash webhook auth not configured — skipping verification');
  return true;
}
