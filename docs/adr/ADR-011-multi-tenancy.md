# ADR-011 — Organization identity is separate from tenancy

**Status:** Accepted · **Date:** 2026-08-17

## Context

An organization exists once in the network, but does its own private work in its
own space. If identity and tenant are the same object, either identities
fragment per counterparty or private data leaks between them.

## Decision

`Organization` (global identity) and `Workspace` (private tenant, carrying
`tenantId`) are separate entities. Every tenant-owned record carries
`workspaceId`; every read and write takes an `AccessContext` and is checked
against it. Cross-tenant access raises internally and surfaces as **404** —
existence itself is not disclosed. Search runs through the same guard as direct
reads.

## Consequences

- XYZ can be a subject in ABC's workspace and a requester in its own, with one
  identity and no leakage between them.
- The tenancy check is one function used by every service, so it cannot be
  forgotten in a new endpoint.
- Multi-workspace organizations (per business unit) become a later change to
  cardinality, not to the model.
- Planned defence in depth: PostgreSQL row-level security keyed on the same id.
- Cost: `workspaceId` threads through nearly every signature.

## Alternatives considered

- **Tenant = organization.** Cannot express an organization that is a subject in
  someone else's tenant.
- **Row filtering at the query layer only.** One raw query away from a breach.
