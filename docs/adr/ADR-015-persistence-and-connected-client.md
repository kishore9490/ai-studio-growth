# ADR-015 — Write-through persistence and a two-mode client

**Status:** Accepted · **Date:** 2026-08-17

## Context

Two requirements pull in opposite directions.

The domain package must run unchanged in a browser — that is what makes the demo
a real system rather than a slideshow, and what lets a single HTML file carry the
whole product. A browser has no database, so the domain has to be synchronous
and storage-agnostic.

But an application whose data disappears when the process restarts is not a
product. The API needs durable, queryable, relational storage, and a signed-in
user needs to see what is actually stored rather than a copy that drifts.

Reconciling those by making every domain service `async` and injecting a
repository interface would have made the browser path carry the ceremony of a
database it does not have, and would have put `await` in front of every business
rule for the benefit of one of the three consumers.

## Decision

### Persistence is a write-through sink, not a repository

`BidStore` exposes a `MutationSink`. Services keep reading and writing an
in-memory working set synchronously; every insert, update and remove is also
handed to the sink. In the API, `PrismaPersistence` implements it: it coalesces
writes per record, orders them by the schema's own foreign keys, and commits
them in one transaction. In the browser, no sink is bound and the same code
paths simply do nothing extra.

At boot the API hydrates every table into the store and the platform re-derives
its BID ID allocator and audit-chain head from the records themselves. Only the
surrogate-key counter is checkpointed, because seeded records carry readable keys
(`pol_standard`) whose suffixes are indistinguishable from generated ones.

Column names, types and write order are all read from the Prisma schema at
runtime rather than restated in a mapper, so adding a field to a domain type and
to the schema is the whole change.

### The HTTP layer waits for durability

A request is not answered until the writes it caused have committed. A `201`
therefore means the row survives a restart, and a failed flush returns `503`
with the change explicitly not applied. This costs a round trip per mutation and
buys the absence of a class of bug that is otherwise invisible until production.

### The client holds an authorized replica

`GET /v1/workspace/snapshot` returns everything the caller may hold, and the web
app hydrates a `BidPlatform` from it. Screens then answer their own questions
synchronously against the same engine the server runs — no per-screen read model,
no divergence between what the API enforces and what the UI believes.

This only works because the snapshot is exactly as strict as the individual
routes: it filters by workspace, includes another workspace's records only where
the caller is the subject, applies the domain's own visibility ceiling to
evidence, strips password hashes, and omits sessions entirely. Whatever it sends,
the client has.

Mutations are never applied locally in connected mode. They go through a
`Commands` interface with two implementations — one that posts to the API, one
that calls the domain services directly — and after each one the client reloads
the snapshot rather than patching its copy.

### Two surfaces are demo-only, and say so

The guided journey acts as several organizations in turn; the BID admin console
is staff software that configures the price book and the provider registry.
Neither is something one signed-in account can legitimately do. Rather than let
them write to an in-browser copy the server will never see, they explain why they
are unavailable and point at the demo mode where they work.

## Consequences

**Good**

- One implementation of every business rule, running in three places.
- Durability is a property of the transport, not a hope: it is asserted by tests
  that restart the process and read the record back.
- The snapshot is a single, reviewable authorization surface. Getting tenancy
  right there is more tractable than getting it right in thirty read endpoints.
- The demo build keeps working with no server and no network.

**Costs and limits**

- The working set lives in one process's memory, so the API is a single writer.
  Horizontal scale needs the sink to become the source of truth and reads to go
  to the database — a change contained to `PrismaPersistence` and hydration, but
  a real one.
- The snapshot is loaded whole. It is small for a workspace of this size and
  will not be for a large one; the shape that replaces it is a delta feed, which
  the sink already has the information to produce.
- A client holds more data than any one screen needs. That is why the snapshot's
  filtering is the security boundary and is tested as such.
