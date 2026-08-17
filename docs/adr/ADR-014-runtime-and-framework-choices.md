# ADR-014 — Runtime and framework choices

**Status:** Accepted · **Date:** 2026-08-17

## Context

The brief specifies React + TypeScript + Vite + Tailwind + XYFlow on the front
end, and "NestJS or equivalent enterprise framework" with PostgreSQL and Prisma
on the back end. Two constraints shaped the final choice: the domain package must
be consumable unchanged by the browser, the API and tests; and the demo must run
end-to-end without a database or external network access.

## Decision

- **Domain**: `@bid/core`, native ESM, zero runtime dependencies. Consumed by
  the web app (via Vite alias to source) and by the API (via built output).
- **Web**: React 18 + TypeScript + Vite + Tailwind + `@xyflow/react` +
  Framer Motion + Recharts + Lucide, exactly as specified.
- **API**: **Fastify** with an explicit modular structure — composition root,
  route modules, `zod` validation at the boundary, thin controllers over domain
  services — instead of NestJS.
- **Database**: PostgreSQL is the target; `prisma/schema.prisma` is the schema of
  record. The running demo uses in-memory repositories behind the same
  interfaces.

Reason for Fastify: NestJS's decorator/CommonJS runtime would have required
either dual-emitting the ESM domain package or duplicating it. Keeping one ESM
domain package used identically by browser, server and tests was judged more
valuable than the framework name, and the layering NestJS enforces is present
anyway. Migration to NestJS is mechanical: wrap the same services as providers,
keep the domain untouched.

## Consequences

- One implementation of every rule, shared by every surface — the property that
  makes "member ≠ customer" and tenancy guarantees testable once.
- The demo runs with `npm install && npm run dev`: no database, no seeds, no
  vendor keys, no network egress.
- Deviation from the letter of the brief on the API framework, recorded here and
  in ASSUMPTIONS.md rather than left implicit.
- Cost: no Nest ecosystem modules (DI container, interceptors, Swagger
  generation) out of the box; the API index route and `docs/API.md` stand in for
  generated documentation until OpenAPI is published.

## Alternatives considered

- **NestJS + CommonJS build of the domain.** Two build targets for the same
  source, and a real risk of behavioural drift between them.
- **Duplicate the domain in the API.** Guarantees drift; rejected outright.
