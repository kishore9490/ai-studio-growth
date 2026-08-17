# ADR-007 — Consent and authorization are different objects

**Status:** Accepted · **Date:** 2026-08-17

## Context

Two permissions are routinely conflated: a person permitting their data to be
processed, and one organization permitting another to act on its behalf. They
have different grantors, different legal weight, different scopes and different
revocation semantics. Conflating them leads to processing personal data on the
strength of a commercial agreement the person never saw.

## Decision

Two separate objects, two separate lifecycles.

**Consent** — subject, purpose, scope, version, status, timestamps, expiry,
revocation, evidence reference. Person-subject checks are created in
`BLOCKED_ON_CONSENT` and the engine refuses to start until an in-scope consent
exists.

**Authorization** — grantor organization, grantee organization, operation, scope,
relationship, validity window, status, revocation. Checked on cross-organization
operations such as running BGV on behalf of a client.

## Consequences

- A staffing partner can be authorized by an employer *and* still require the
  candidate's consent — which is the actual legal shape of that arrangement.
- Revoking consent stops future processing without touching the commercial
  authorization, and vice versa.
- Consent scope is derived from the compiled plan, so it names the checks the
  subject is actually agreeing to.
- Cost: two objects to model, display and revoke.

## Alternatives considered

- **One "permission" object.** Simpler, and wrong in exactly the cases that
  matter most.
- **Consent as a boolean on the request.** No scope, no purpose, no expiry, no
  revocation — unusable as evidence that consent was obtained.
