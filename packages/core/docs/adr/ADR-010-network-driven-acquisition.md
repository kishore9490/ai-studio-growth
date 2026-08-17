# ADR-010 — Network-driven customer acquisition

**Status:** Accepted · **Date:** 2026-08-17

## Context

Verification platforms sell to one side of a relationship and treat the other
side as a data subject to be processed. That subject is usually a business with
the same problem, and it has just experienced the product first-hand.

## Decision

The invited counterparty is a first-class participant, not a data subject:

1. It receives a real identity (BID ID), a real profile and a real credential.
2. Membership is free and genuinely useful — responding to requests, holding
   credentials, reusing them with the next buyer.
3. Only after being verified is it shown the requester proposition.
4. Becoming a requester is an explicit, priced activation.

The model records `introducedByOrgId`, so cohorts trace back to the customer that
generated them, and the funnel measures member → verified → requester → paid.

## Consequences

- Acquisition cost falls as the network grows; each customer introduces the next
  cohort as a by-product of normal use.
- The free tier must be genuinely valuable, which constrains what may be
  paywalled — a healthy constraint.
- The distinction in ADR-003 must hold everywhere, or the flywheel breaks at the
  first premature upsell.
- Cost: revenue per invited organization is deferred, sometimes indefinitely.

## Alternatives considered

- **Charge the subject for being verified.** Kills the network and inverts the
  incentive to complete verification.
- **Outbound sales only.** Ignores the highest-intent audience the product
  already has in hand.
