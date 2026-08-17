# BID Trust

**BID = Business Identity & Due Diligence** · `bidtrust.in`

> **Trust, backed by verification.**
> Verify the businesses and people your organization does business with.

BID Trust is an industry-agnostic trust, verification and due-diligence layer for
organizations. It connects **identity + relationship + policy + verification +
evidence + assessment + credential + monitoring** into one system, and it is
built around a single structural idea:

> **Every organization can be a verified subject today and a verification
> requester tomorrow.**

BID Trust is an independent private platform. It is **not** a government
authority, **not** a credit bureau, **not** a marketplace, and **not** a
replacement for existing verification providers — those remain the execution
layer underneath it.

---

## What is in this repository

| Path | What it is |
| --- | --- |
| `packages/core` | The domain. Identity, relationships, policy engine, verification engine, provider abstraction, evidence, assessment, credentials, monitoring, billing, customer lifecycle, event bus, audit. No HTTP, no React, no database driver. |
| `apps/web` | React + TypeScript + Vite + Tailwind + XYFlow application: product, public site, admin console, architecture explorer. |
| `apps/api` | Fastify + TypeScript REST API over the same domain package, with API-key auth, tenant guards and rate limiting. |
| `prisma/schema.prisma` | The PostgreSQL schema the API persists to, plus the migrations that build it. |
| `docs/` | Architecture, domain model, API, security, billing, verification model, provider integration, customer lifecycle, roadmap, assumptions, and 14 ADRs. |

The web app runs in **two modes**, and the same screens serve both.

**Connected** — point it at the API and you get a sign-in screen. Register an
organization or sign in as a seeded account; everything on screen came from the
server, and every change goes back to it through the documented API. Reload,
restart, sign in elsewhere: the state is the same, because it lives in
PostgreSQL rather than the tab.

**Demo** — with no API configured, the *same domain engine* runs in the browser
against a fictional network. Every workflow is still a genuine state transition
— invitations, provider routing, evidence, assessment, credential issuance,
monitoring, billing and audit all actually happen — but nothing is durable, and
no server is needed. This is what makes the one-file build possible.

Neither mode is a mock of the other: `packages/core` is the only implementation,
consumed identically by the browser, the API and the tests. See
[docs/LOCAL_DEVELOPMENT.md](docs/LOCAL_DEVELOPMENT.md).

---

## Quick start

```bash
npm install

# Build the domain package (the web app and API both consume it)
npm run build:core

# Web application → http://localhost:5173
npm run dev

# REST API → http://localhost:4000 (needs no database; see below to add one)
BID_PERSISTENCE=memory npm run dev:api

# Everything: typecheck, tests (38 across core and API), production builds
npm run typecheck
npm test
npm run build
```

To run the whole thing for real — PostgreSQL, the API, and a web app that signs
in against it:

```bash
docker compose up -d db
cp .env.example .env
npm run db:migrate     # applies prisma/migrations
npm run dev:api        # first boot writes the demo network, later boots load it

echo 'VITE_API_URL=http://127.0.0.1:4000' > apps/web/.env.local
npm run dev            # sign in with bid-demo-password
```

Requires Node 20+ (developed on Node 22).

### One-file build (no server needed)

```bash
npm run build:static --workspace @bid/web
# → apps/web/dist-static/bid-trust-standalone.html
```

Produces a single self-contained HTML file — CSS and JS inlined, hash routing,
zero external requests — that runs the whole product from any origin or straight
off disk. Useful for sharing a runnable demo without deploying anything.

### Docker

```bash
docker compose up --build
# web  → http://localhost:8080
# api  → http://localhost:4000
# db   → postgres:16 on 5432 (for the Prisma target schema)
```

---

## The demo network

The environment seeds a fictional network. Nothing here is a real company or a
real person.

| Organization | BID ID | State | Role in the story |
| --- | --- | --- | --- |
| ABC Technologies | `BID-BUS-00104` | Customer (Business plan) | Existing BID customer that verifies its counterparties |
| XYZ HR Consultants | `BID-BUS-00231` | **Verified member** | Verified by ABC; free member, not a customer — the flywheel candidate |
| LMN Components | `BID-BUS-00312` | Member | Verification in flight |
| RST Security Services | `BID-BUS-00366` | Member | Verification completed **with an exception** (statutory check failed) |
| OPQ Logistics | `BID-BUS-00340` | Invited | Invitation not yet accepted |
| JKL Pharma / GHI Textiles / TUV Facilities | … | Customer / dormant / churned | A second hub plus negative lifecycle states for analytics |
| Ravi Kumar | `BID-PER-00031` | Candidate | Consent-gated BGV, restricted evidence |

**Start here:**

1. `/` — the public landing page
2. `/app` — ABC Technologies' dashboard (switch organizations from the top-left)
3. `/app/journey` — the guided golden path: 15 steps that take a brand-new
   counterparty from *invited* → *member* → *verified* → *requester* → *paying
   customer* → *inviting its own suppliers*, performing real mutations
4. `/app/requests-received/:id` — the *subject's* view: what was asked, what it
   must supply, and exactly what the requester will and will not see
5. `/profile/BID-BUS-00231` — a public BID profile and digital card
6. `/architecture` — the interactive architecture explorer (12 views)
7. `/admin` — BID's own console: funnel, revenue, customer lifecycle, providers,
   pricing configuration

---

## The core principle

**Organizations are not permanently customers, vendors or suppliers.**

XYZ HR Consultants can simultaneously be a vendor to one company, a customer of
another, an employer of people, a verification subject and a verification
requester. So the model is not `VendorAccount` / `SupplierAccount`; it is:

```
ORGANIZATION  +  RELATIONSHIP  +  ROLE  +  POLICY  +  PERMISSIONS
```

and the commercial state (`MEMBER` vs `CUSTOMER`) is tracked separately from
identity, separately from any relationship, and separately from any verification.

### Member ≠ customer

| BID Member (free) | BID Requester / Customer (paid) |
| --- | --- |
| Claim and maintain the organization profile | Initiate verification of others |
| Receive and respond to verification requests | Create and version policies |
| Provide documents and consent | Run campaigns across many counterparties |
| Hold credentials, BID ID, digital card, public profile | Continuous monitoring |
| View its own verification history | BGV, API, webhooks, integrations |

This distinction is enforced in the data model, the permission layer, billing,
analytics and the UI — not only in the marketing copy. Try it: switch to XYZ HR
Consultants and watch the sidebar lock the requester capabilities, then run
`/app/become-requester`.

---

## The network flywheel

```
ABC (customer)
  └─ invites ─▶ XYZ ─▶ member ─▶ verified member ─▶ discovery
                                          └─ requester ─▶ paying customer
                                                   └─ invites ─▶ LMN ─▶ member ─▶ …
```

The first invitee must **not** automatically become a paying customer. The
lifecycle is explicit:

`UNKNOWN → INVITED → REGISTERED → BID MEMBER → VERIFICATION IN PROGRESS →
VERIFIED MEMBER → DISCOVERY → REQUESTER ACTIVATION → FIRST VERIFICATION →
PAID CUSTOMER → ACTIVE → EXPANDING → ENTERPRISE → NETWORK PARTICIPANT`

with negative states `LOW USAGE / AT RISK / DORMANT / CHURNED / WIN-BACK`.

---

## Domain agnosticism

There is no hospital module, manufacturing module or IT module in this codebase.
There is one engine and a **policy** that configures it:

```
CORE BID ENGINE  +  CONFIGURABLE POLICY  =  INDUSTRY WORKFLOW
```

Fifteen policy templates ship with the platform (critical supplier, healthcare
vendor, HR consultancy due diligence, critical contractor, fleet contractor,
pharma supplier, candidate BGV, …), and `/demo` generates a new one from
*what you want to verify* × *industry* × *risk level*.

---

## Provider neutrality

BID does not try to displace existing KYB, BGV, identity, banking or screening
providers. They remain the execution layer:

```
Enterprise → BID policy → provider router → provider → normalized result
          → evidence → assessment → Enterprise
```

Core logic depends only on capability interfaces (`IKYBProvider`,
`IBGVProvider`, `IRiskProvider`, …). This build ships three deterministic **mock
adapters** and makes **no external network calls**; the router already supports
priority, cost, SLA and quality strategies plus fallback, and records every
routing decision in the audit trail.

---

## Evidence, not adjectives

Every check produces a structured evidence record answering:

**WHAT · WHO · SOURCE · PROVIDER · METHOD · WHEN · RESULT · CONFIDENCE · SCOPE ·
FRESHNESS · POLICY VERSION · REFERENCE · AUDIT LINK**

and the UI always distinguishes **company-provided** from **BID-verified** from
**provider-verified** from **official-source-derived**. An assessment is never a
bare score: it carries per-category verdicts, what is missing, which policy
version applied, and when it expires.

> *Don't trust the badge. Verify the verification.*

---

## What this build does not claim

- BID Trust is **not** government authorized and does not certify businesses.
- A BID ID is an identifier issued by a private platform, not a government identity.
- Monitoring covers signals a configured provider reports — in this build, mock
  feeds, each labelled with its source.
- Prices shown are illustrative starting prices, configurable from the admin
  console: *final pricing depends on verification scope, provider costs, volume,
  SLA and requirements.*
- Nothing here asserts legal compliance for a specific deployment; that needs
  qualified legal review in your jurisdiction.

See [`docs/ASSUMPTIONS.md`](docs/ASSUMPTIONS.md) for the full list of
simplifications made for this build and what production would change.

---

## Documentation

| Document | Contents |
| --- | --- |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md) | System, service and deployment architecture |
| [DOMAIN_MODEL.md](docs/DOMAIN_MODEL.md) | Entities, lifecycles and invariants |
| [VERIFICATION_MODEL.md](docs/VERIFICATION_MODEL.md) | Policy → plan → evidence → assessment → credential |
| [PROVIDER_INTEGRATION.md](docs/PROVIDER_INTEGRATION.md) | How to add a real provider adapter |
| [API.md](docs/API.md) | REST contracts with runnable examples |
| [SECURITY.md](docs/SECURITY.md) | Tenancy, RBAC/ABAC, classification, consent, audit |
| [BILLING.md](docs/BILLING.md) | Plans, entitlements, usage, credits, invoicing |
| [CUSTOMER_LIFECYCLE.md](docs/CUSTOMER_LIFECYCLE.md) | The four lifecycles and the acquisition funnel |
| [ROADMAP.md](docs/ROADMAP.md) | Build order and what comes next |
| [ASSUMPTIONS.md](docs/ASSUMPTIONS.md) | Explicit simplifications and open questions |
| [ADRs](docs/adr/) | 14 architecture decision records |
