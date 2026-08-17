# ADR-003 — Member and customer are different states

**Status:** Accepted · **Date:** 2026-08-17

## Context

The acquisition model depends on inviting organizations that have no commercial
relationship with BID. If an invitee is treated as a customer, the invitation
becomes a sales act and the network never compounds. If membership is only a
marketing label, the distinction erodes the first time an engineer needs a flag.

## Decision

Two independent concepts, both tracked:

- `Organization.commercialState`: `NON_MEMBER → MEMBER → VERIFIED_MEMBER →
  REQUESTER → CUSTOMER → ENTERPRISE` — descriptive.
- `Entitlements`, resolved from the workspace's subscription — **authoritative**.

Authorization reads entitlements only. A workspace with no subscription resolves
to the free member entitlement set. Approving a verification promotes the subject
to `VERIFIED_MEMBER` and never to a paying state; only `SubscriptionCreated`
does that.

The customer lifecycle (BID's funnel) is a third, separate concept, and neither
is the organization identity lifecycle.

## Consequences

- Free members get real capability — identity, profile, credentials, responding
  to requests — which is what makes them willing participants.
- No code path can grant a paid capability by inspecting a plan name; there is
  literally nothing to inspect except entitlements.
- Denials distinguish "your role does not permit this" from "your plan does not
  include this", so the UI can offer the right next action.
- Cost: four lifecycles to keep straight. DOMAIN_MODEL.md exists largely for this.

## Alternatives considered

- **Single "account tier" field.** Collapses commerce, identity and capability
  into one value that will be wrong for someone immediately.
- **Trial-based conversion.** Puts a clock on the invitee before it has seen any
  value, which inverts the flywheel.
