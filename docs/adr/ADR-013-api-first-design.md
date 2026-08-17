# ADR-013 — API-first design

**Status:** Accepted · **Date:** 2026-08-17

## Context

Verification is not a destination product. It belongs inside procurement,
onboarding, HRMS and ATS workflows. If the API is a later projection of the UI,
it inherits screen-shaped endpoints and lags behind the product.

## Decision

Every capability is a resource under `/v1`, and the web application and the API
call the **same domain services**. Transport layers validate input, resolve an
`AccessContext` and delegate; no business rule lives in a controller or a React
component.

Auth is workspace-scoped API keys with scopes and rate limits. Domain events are
published outward as webhooks. Responses are envelope-consistent (`data`,
`count`), money is integer paise, and public-facing references use BID IDs.

## Consequences

- An entitlement or tenancy rule cannot be true in the UI and false in the API.
- Integrations are first-class from day one; `API_CLIENT` is a real role with a
  deliberately narrower permission set (it may initiate, not decide).
- Cross-tenant reads return 404 in both surfaces, for the same reason.
- Cost: features must be designed as resources, not as screens.

## Alternatives considered

- **UI-first with a later API.** Produces endpoints shaped like pages.
- **GraphQL.** Attractive for the graph views; harder to reason about for
  tenant-scoped authorization and per-field classification, which is precisely
  where this product's risk sits.
