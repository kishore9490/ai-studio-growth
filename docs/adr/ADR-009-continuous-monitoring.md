# ADR-009 — Monitoring is first-class

**Status:** Accepted · **Date:** 2026-08-17

## Context

A verification is a statement about a moment. Licences lapse, registrations
change, insurance expires, sanctions lists move. Buyers usually discover these
through an incident, because the onboarding artefact was never designed to age.

## Decision

Monitoring is a first-class capability, not a report:

- `MonitoringRule` per subject: signals, cadence, active flag, owning workspace.
- `MonitoringEvent` per alert: signal, severity, **named source**, detail,
  status, recommended action, link back to the relationship.
- Policies declare a monitoring cadence and a re-verification interval alongside
  their checks, so the cadence follows the risk.
- Evidence carries freshness computed against policy validity, so decay is
  visible before it becomes an alert.

## Consequences

- Trust degrades gracefully and visibly rather than silently.
- Monitoring is a natural recurring revenue stream because it delivers recurring
  value.
- Alerts must name their source; BID never implies access to event streams it
  does not have. In this build every signal comes from a mock feed and says so.
- Cost: alert quality becomes a product problem — noisy monitoring is worse than
  none.

## Alternatives considered

- **Periodic full re-verification only.** Expensive and still late.
- **Monitoring as an add-on report.** Disconnected from the policy that defined
  what mattered in the first place.
