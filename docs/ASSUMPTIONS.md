# Assumptions, simplifications and open questions

Written so that nobody has to guess which parts of this build are real
architecture and which are demo scaffolding.

---

## 1. Everything here is fictional

Organizations (ABC Technologies, XYZ HR Consultants, LMN Components, OPQ
Logistics, RST Security Services, GHI Textiles, JKL Pharma, TUV Facilities) and
people (Ravi Kumar, Anil Sharma, Priya Nair) are invented. Identifiers such as
GSTINs and CINs are syntactically shaped but not real. No real personal data
appears anywhere in this repository.

---

## 2. Deliberate simplifications

| Area | This build | Production |
| --- | --- | --- |
| Persistence | In-memory repositories | Prisma + PostgreSQL (`prisma/schema.prisma`) |
| Providers | Three deterministic mocks, **no external calls** | Real adapters behind the same interfaces |
| Event bus | In-process `InMemoryEventBus` | Broker (NATS/Kafka/SQS) with retries and DLQ |
| Check execution | Synchronous loop | Queue workers, partial results, retries |
| Audit hash | Fast non-cryptographic hash | SHA-256 with signing key, WORM retention |
| Identifiers | Masked strings | Encrypted at rest, decrypted per permission |
| Auth | Demo session; demo API key with `x-bid-act-as` | OIDC sessions, hashed workspace keys, SSO |
| Rate limiting | In-process per key | Gateway with shared store |
| Documents | Requirements modelled; no upload | Object storage with signed URLs and virus scanning |
| Search | In-memory permission-aware scan | OpenSearch index fed from the event bus |
| Credentials | Data records | Cryptographically signed, independently verifiable |
| Payments | Recorded, not processed | Gateway integration, dunning, tax |
| QR codes | Deterministic visual placeholder linking to the profile URL | Encoded QR |
| Revenue trend chart | Illustrative series derived from current MRR | Warehouse-backed time series |

Every one of these sits behind an interface, which is why they are
simplifications rather than debt.

---

## 3. Framework choice (deviation, stated plainly)

The brief lists "NestJS or equivalent enterprise framework". This build uses
**Fastify with an explicit modular structure** (composition root, route modules,
schema validation at the boundary, no business logic in the transport layer).

Reason: `@bid/core` is native ESM and is consumed unchanged by the browser app,
the API and the tests. Fastify keeps that single ESM domain package intact
without a decorator/CommonJS runtime, and the resulting layering — controllers →
services → domain — is the layering NestJS would have enforced. Migrating to
NestJS later means wrapping the same services in modules and providers; no
domain code changes. See ADR-014.

---

## 4. Legal and regulatory assumptions

- BID Trust is positioned as an **independent private platform**, never as a
  government authority or certification body. Product copy, evidence labels and
  disclaimers are written to keep that true.
- Which checks are lawful for which purpose varies by jurisdiction, sector and
  the subject's consent. The check catalog is deliberately conservative — e.g.
  the person check is "permitted database screening", scoped by the recorded
  consent, not an unqualified criminal-record search.
- Nothing here asserts compliance with a specific statute. That needs qualified
  legal review per deployment.
- Data residency, cross-border transfer and sector-specific retention rules are
  modelled as configuration but not implemented.

---

## 5. Commercial assumptions

- Prices are **illustrative starting prices**, editable at runtime; the platform
  charges nothing on its own.
- The free member tier is assumed to be sustainable because members consume
  almost no metered capacity and are the acquisition channel. If member support
  cost exceeded that value, the tier would need limits (this is a business
  assumption, not an architectural one).
- Provider costs are modelled as multipliers on catalog unit costs. Real
  contracts have volume tiers and minimums.
- Monitoring is priced per entity per month; real pricing likely differs by
  signal class.

---

## 6. Modelling decisions worth challenging

| Decision | Alternative |
| --- | --- |
| Assessment weights fixed in code (identity 30, risk 25, …) | Per-requester configurable weights — planned, deliberately not in v1 so scores stay comparable |
| A relationship is owned by the source workspace only | Bidirectional acknowledgement, so both parties see one relationship |
| Credentials are policy-scoped | Cross-policy equivalence ("this credential satisfies my Tier-2 policy") — powerful and risky |
| One workspace per organization | Multi-workspace (per business unit) with shared identity |
| Attention results earn half credit in scoring | A stricter model where any attention forces manual review |
| Sealing happens on first completed decision | Sealing on first execution, which is stricter but blocks in-flight fixes |

---

## 7. Open questions

1. **Credential acceptance.** When does a buyer accept a credential issued for
   another buyer's policy? Equivalence rules are the hard part of the network
   effect and are not implemented.
2. **Dispute handling.** What happens when a subject disputes a provider result?
   Today: re-run and record. Production needs a formal dispute lifecycle with
   provider SLAs.
3. **Monitoring signal quality.** Real feeds are noisy; alert fatigue would
   quietly destroy the value of monitoring. Needs tuning, suppression and
   severity calibration with real data.
4. **Subject rights.** A subject-facing view of everything BID holds about it,
   with export and revocation, is designed for but not built.
5. **Graph privacy.** Sub-tier supply chain mapping is valuable and immediately
   raises "who may see whose counterparties" questions. Authorization chains with
   depth limits are the proposed answer.
6. **Pricing model fit.** Per-check pricing aligns with provider cost but
   penalizes thorough policies. Bundled tiers by depth may fit buyers better.

---

## 8. Testing

`packages/core` ships 13 tests covering the invariants that matter most: member ≠
customer, evidence completeness, consent gating, policy version sealing, public
projection safety, tenant-scoped search, permission gates, generated-policy
escalation and audit chain integrity. The web app has no component tests yet;
the structure (thin pages over domain services) is what makes them cheap to add.
