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

/** Input the domain refuses, with a message written for the person who typed it. */
export class ValidationError extends Error {
  readonly code = 'VALIDATION_FAILED';

  constructor(
    message: string,
    /** The input this is about, so a form can put the message next to the field. */
    readonly field?: string,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

/** The request is well-formed but collides with something that already exists. */
export class ConflictError extends Error {
  readonly code = 'CONFLICT';

  constructor(
    message: string,
    readonly resourceType: string,
  ) {
    super(message);
    this.name = 'ConflictError';
  }
}

export function isConflictError(error: unknown): error is ConflictError {
  return error instanceof ConflictError;
}
