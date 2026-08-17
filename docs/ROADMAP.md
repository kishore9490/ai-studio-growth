# Roadmap

## Build order (what has been done)

| Phase | Scope | State |
| --- | --- | --- |
| 1 | Design system, app shell, session/auth mock, organization model, BID ID | ✅ |
| 2 | Organization dashboard, relationships, invitations, member lifecycle | ✅ |
| 3 | Policy engine, verification engine, mock providers, evidence, assessment | ✅ |
| 4 | Public BID profile, digital card, credentials | ✅ |
| 5 | Requester workflow, campaigns, counterparty verification | ✅ |
| 6 | Billing: plans, entitlements, credits, usage, invoices | ✅ |
| 7 | Monitoring rules, mock signal feed, alerts | ✅ |
| 8 | Customer lifecycle, customer success board, revenue analytics | ✅ |
| 9 | Interactive architecture explorer (12 views) | ✅ |
| 10 | People/BGV, consent, authorization | ✅ |
| 11 | REST API, provider adapters, webhook model | ✅ |
| 12 | Enterprise capabilities | ◐ modelled, not implemented |

The application is runnable at every phase boundary; `npm run build` and
`npm test` are green.

---

## Next: production readiness

### Persistence
- Prisma client against `prisma/schema.prisma`, repository implementations
  behind the existing interfaces
- Migrations, seed script for non-production environments
- PostgreSQL row-level security keyed on `workspace_id` as defence in depth

### Execution
- Queue-backed check execution (BullMQ or SQS) with retries and partial results
- Scheduled monitoring sweeps and re-verification triggers
- Webhook delivery with backoff, dead-lettering and replay

### Identity & access
- OIDC sessions, SSO enforcement per workspace, SCIM provisioning
- Hashed workspace API keys with rotation, scopes and IP allowlists
- Custom roles; approval delegation and escalation

### Providers
- First real adapters: KYB, screening, banking, BGV
- Provider conformance test suite with recorded fixtures
- Quality scoring feeding automatic demotion
- Cost/SLA/coverage routing enabled in production configuration

### Trust artefacts
- Cryptographically signed credentials and a third-party verification endpoint
- Signed evidence bundles for audit export
- Verifiable credential (W3C VC) export path

---

## Product roadmap

**Near term**
- Real document upload behind signed URLs (the request → provide → review →
  re-request loop and its integrity hashes already exist; only the object store
  is missing)
- Document expiry tracking and automatic re-request before it lapses
- Bulk counterparty import with de-duplication against existing identities
- Requester-tunable assessment category weights
- Policy diffing and impact analysis before versioning
- Subject-facing consent dashboard with one-click revocation

**Medium term**
- Sub-tier supply chain mapping (verify your supplier's suppliers, with depth
  limits and authorization chains)
- Concentration and single-point-of-failure analytics on the relationship graph
- Procurement/HRMS/ATS connectors
- Multi-workspace organizations (per business unit) with shared identity
- Data residency and regional routing

**Longer term**
- Reciprocal trust: a credential issued for one buyer accepted by another under
  policy equivalence rules
- Marketplace of certified provider adapters
- Continuous assurance: policies that re-run themselves on signal, not schedule

---

## Explicitly out of scope

BID does not become:
- a government identity system or certification authority
- a credit bureau
- an ERP or a procurement suite
- a marketplace
- a data broker — personal data is not sold, and there is no public candidate
  database

Every one of these would break the trust position the product depends on.
