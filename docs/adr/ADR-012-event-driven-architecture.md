# ADR-012 — Event-driven interior

**Status:** Accepted · **Date:** 2026-08-17

## Context

Completing a verification must meter usage, update campaign progress, move the
customer lifecycle, notify people, issue a credential and possibly start
monitoring. Calling all of those from the verification engine makes it depend on
billing, CRM and notification concerns, and every new consumer edits the engine.

## Decision

Services publish domain events; interested services subscribe. The bus interface
is broker-shaped (`publish` / `subscribe` / envelope with id, timestamp, tenant
scope, correlation id) and is implemented in-process today.

Events include `OrganizationCreated/Claimed/Verified`, `Invitation*`,
`Verification*`, `AssessmentCreated`, `Consent*`, `Authorization*`,
`Credential*`, `Campaign*`, `Monitoring*`, `Subscription*`, `UsageRecorded`,
`InvoiceIssued`, `PaymentReceived`, `CustomerLifecycleChanged`,
`CustomerAtRisk`, `CustomerChurned`.

## Consequences

- The verification engine contains no pricing, CRM or notification logic.
- New consumers (webhooks, search indexing, analytics) attach without touching
  producers.
- The event stream is a product surface: `/app/audit` shows it live, and webhooks
  publish it to customers.
- A failing consumer cannot break a producer (a real broker would dead-letter).
- Cost: causality is less obvious when reading code; the audit log and
  correlation ids exist partly to compensate.

## Alternatives considered

- **Direct service calls.** Simpler to trace, and turns the engine into a hub
  that depends on everything.
- **Broker from day one.** Operational weight this build does not need; the
  interface keeps the option open.
