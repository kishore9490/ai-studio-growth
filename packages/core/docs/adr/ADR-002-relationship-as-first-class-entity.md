# ADR-002 — Relationship as a first-class entity

**Status:** Accepted · **Date:** 2026-08-17

## Context

Given ADR-001, something must carry "ABC treats XYZ as a staffing partner under
this policy, at this risk level, verified on this date, monitored quarterly,
under contract reference X". Attaching that to either organization is wrong: it
is a property of the *pair*, owned by one side.

## Decision

`Relationship` is a first-class object with its own identifier, lifecycle,
policy binding, verification status, risk level, criticality, contract reference,
monitoring flag and owning workspace.

```
Relationship { workspaceId, sourceOrganizationId, targetOrganizationId | targetPersonId,
               type, lifecycle, riskLevel, policyId, latestVerificationId,
               verificationStatus, contractReference, monitoringEnabled, dates }
```

Lifecycle: `DISCOVERED → INVITED → VERIFICATION → ASSESSMENT → PENDING_APPROVAL →
ACTIVE → MONITORED → SUSPENDED → TERMINATED → ARCHIVED`.

## Consequences

- An organization participates in thousands of relationships with no schema
  strain; each carries its own policy and verification state.
- The relationship is the natural tenancy anchor: it belongs to the source's
  workspace, so the counterparty never inherits visibility of it.
- The network graph is a direct projection of relationship records rather than a
  derived guess.
- Cost: two organizations that both record each other produce two relationship
  records. Bidirectional acknowledgement is deliberately deferred (see
  ASSUMPTIONS).

## Alternatives considered

- **Join table with no lifecycle.** Cannot express "verification in progress" or
  "suspended pending remediation" — which is most of the operational value.
- **Relationship derived from verifications.** Breaks for relationships that
  exist before or without verification, and for terminated ones.
