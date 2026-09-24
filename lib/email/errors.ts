/**
 * SES failures split into two kinds, and the consumer has to treat them
 * differently or the DLQ fills with garbage.
 *
 * Permanent: the send will never succeed no matter how many times it runs —
 * an address that doesn't exist, an unverified sender in sandbox mode. These
 * must NOT be retried; retrying burns five receives and parks a message in the
 * DLQ that nobody can do anything about.
 *
 * Transient: throttling, a 5xx from SES, a dropped connection. These should be
 * retried, and that's exactly what leaving the message on the queue does.
 */
export class EmailSendError extends Error {
  readonly permanent: boolean;
  readonly cause?: unknown;

  constructor(message: string, permanent: boolean, cause?: unknown) {
    super(message);
    this.name = 'EmailSendError';
    this.permanent = permanent;
    this.cause = cause;
  }
}

const PERMANENT_SES_ERRORS = new Set([
  'MessageRejected', // address not verified / rejected outright
  'MailFromDomainNotVerifiedException',
  'ConfigurationSetDoesNotExistException',
  'InvalidParameterValue',
  'ValidationException',
]);

const TRANSIENT_SES_ERRORS = new Set([
  'Throttling',
  'ThrottlingException',
  'TooManyRequestsException',
  'ServiceUnavailable',
  'InternalFailure',
  'RequestTimeout',
  'TimeoutError',
]);

export function classifySesError(error: any): EmailSendError {
  const name = error?.name || error?.Code || '';
  const status = error?.$metadata?.httpStatusCode;
  const message = error?.message || String(error);

  if (PERMANENT_SES_ERRORS.has(name)) {
    return new EmailSendError(message, true, error);
  }

  if (TRANSIENT_SES_ERRORS.has(name)) {
    return new EmailSendError(message, false, error);
  }

  // 5xx and throttling are worth retrying; anything else in the 4xx range is
  // our request being wrong, which retrying won't fix.
  if (typeof status === 'number') {
    if (status >= 500 || status === 429) {
      return new EmailSendError(message, false, error);
    }
    if (status >= 400) {
      return new EmailSendError(message, true, error);
    }
  }

  // Unknown failures get retried. A message that turns out to be genuinely
  // undeliverable ends up in the DLQ after maxReceiveCount, which is a place we
  // can look — silently dropping it is not.
  return new EmailSendError(message, false, error);
}
