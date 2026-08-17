# ADR-006 — Evidence carries full provenance

**Status:** Accepted · **Date:** 2026-08-17

## Context

"Verified" as a bare status is worth nothing: it does not say who checked, from
what source, by what method, when, or how much of the subject it covered. The
product promise — *don't trust the badge, verify the verification* — requires
that every claim be inspectable.

## Decision

Every check produces an immutable `Evidence` record:

`what · source · attribution · providerId/providerName · method · checkedAt ·
result · confidence · scope · reference · payloadHash · expiresAt · freshness ·
policyId · policyVersion · visibility · auditLogId`

`attribution` is one of `COMPANY_PROVIDED | BID_VERIFIED | PROVIDER_VERIFIED |
OFFICIAL_SOURCE_DERIVED`, and the UI must always distinguish them. Freshness is
computed against the policy's validity window rather than asserted.

## Consequences

- A verification can be defended in a procurement review or an audit, item by
  item.
- "Official-source derived" can never be presented as government endorsement,
  because the label and the source string travel together.
- Stale evidence is visibly stale rather than quietly wrong.
- Cost: more storage and more UI surface. Both are the product.

## Alternatives considered

- **Status-only results.** Cheap, unfalsifiable, and indistinguishable from the
  badge vendors this product exists to improve on.
- **Raw provider payload as evidence.** Leaks vendor-specific structure into the
  domain and risks publishing data the subject never agreed to share; a hash
  plus normalized fields is the compromise.
