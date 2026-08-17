# ADR-005 — Provider-neutral architecture

**Status:** Accepted · **Date:** 2026-08-17

## Context

Verification data comes from vendors: KYB, identity, banking, education,
employment, document and screening providers. Coverage, price, latency and
quality vary by check, by geography and over time. A platform that hard-codes one
vendor inherits that vendor's coverage gaps and pricing — and BID's stated
position is that it does not seek to displace existing providers.

## Decision

Core logic depends only on capability interfaces (`IKYBProvider`,
`IBGVProvider`, `IRiskProvider`, `IBankVerificationProvider`, …). A
`ProviderRouter` selects among registered adapters by capability, country
coverage and a configurable strategy (`PRIORITY | COST | SLA | QUALITY`), with
fallback on `UNAVAILABLE`. Every call is recorded as a provider transaction with
latency, cost, outcome, reference and fallback origin.

No provider name appears in policy, verification, evidence-classification or
billing logic.

## Consequences

- Adding a real provider is one adapter plus one registration.
- Cost/SLA/coverage/quality routing becomes a configuration decision rather than
  an engineering project.
- Customers can see which provider produced each result — provider neutrality is
  only credible if it is visible.
- Provider outages degrade gracefully (fallback, then an honest `UNAVAILABLE`)
  instead of being reported as subject failures.
- Cost: an extra normalization layer per adapter, and the discipline not to leak
  vendor-shaped fields into `normalized`.

## Alternatives considered

- **Direct integration with one vendor.** Fastest path to a demo; strategically
  fatal.
- **Provider chosen per policy.** Ties commercial routing to compliance
  configuration; routing belongs to the platform, not the policy author.
