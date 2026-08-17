/**
 * Domain errors.
 *
 * A blocked verification is not a server fault and not a client mistake — it is
 * a legitimate state the caller needs to act on. Typing it lets every transport
 * translate it faithfully (409 at the API, an explanatory toast in the UI)
 * instead of collapsing it into "unexpected error".
 */
export class VerificationBlockedError extends Error {
  readonly code = 'VERIFICATION_BLOCKED';

  constructor(
    message: string,
    readonly blockedBy: 'CONSENT' | 'DOCUMENTS',
    /** What the subject still has to do, in the subject's own terms. */
    readonly outstanding: string[],
    readonly verificationRequestId: string,
  ) {
    super(message);
    this.name = 'VerificationBlockedError';
  }
}

export function isVerificationBlockedError(error: unknown): error is VerificationBlockedError {
  return error instanceof VerificationBlockedError;
}
