# Security & privacy architecture

The governing rule:

> **Never allow a user to access another organization's private information
> merely because that organization exists in the BID network.**

---

## 1. Identity and authentication

| Control | Today | Production |
| --- | --- | --- |
| User authentication | Demo session bound to a seeded user | Email + password with MFA, or OIDC/OAuth SSO |
| MFA | Modelled on the user record | Enforced per workspace policy |
| SSO | OIDC-ready boundary | Enterprise plans; SCIM provisioning |
| API authentication | `x-bid-api-key` / bearer, prefix lookup | Hashed secrets, shown once, rotation and IP allowlists |
| Session management | In-memory | Short-lived tokens, refresh rotation, revocation on role change |

Provider credentials are never stored in tenant data. The provider record holds a
`secretRef` resolved from a secrets manager at call time.

---

## 2. Authorization: RBAC ∩ ABAC ∩ entitlements

Three independent gates, all of which must pass:

1. **Role (RBAC)** — `OWNER`, `ADMIN`, `COMPLIANCE_MANAGER`,
   `VERIFICATION_ANALYST`, `VIEWER`, `API_CLIENT`, each mapped to a permission
   set.
2. **Attributes (ABAC)** — tenant match, relationship existence, authorization
   grant, subject identity.
3. **Entitlement** — does the workspace's plan include this capability at all?

```ts
assertPermission(ctx, 'verification:initiate');
// → ForbiddenError { reason: 'ROLE' }        "your role does not permit this"
// → ForbiddenError { reason: 'ENTITLEMENT' } "your plan does not include this"
```

Distinguishing the two reasons is a product decision as much as a security one:
the user is told whether to ask an administrator or to change plan, and the
platform never pretends a paid capability is a permissions bug.

Deciding a verification outcome is deliberately **not** granted to
`API_CLIENT` by default: integrations can initiate and read, humans decide.

---

## 3. Tenant isolation

- Organization identity is global; the **workspace** is the tenant boundary.
- Every tenant-owned record carries `workspaceId`; every read and write takes an
  `AccessContext`.
- Cross-tenant reads raise `ForbiddenError('TENANT')` internally and surface as
  **404** at the API — existence itself is not disclosed.
- **Search uses the same guard as direct reads.** A permission-aware search
  service is the only way search results cannot become a side channel; the
  ⌘K palette does no filtering of its own.
- Planned defence in depth: PostgreSQL row-level security keyed on the same
  workspace id.

---

## 4. Data classification

Every field and evidence record carries a classification:

| Class | Examples | Who can see it |
| --- | --- | --- |
| `PUBLIC` | Name, BID ID, published verification status, public credentials | Anyone |
| `ORGANIZATION_ONLY` | Internal profile settings | The organization |
| `RELATIONSHIP_ONLY` | Evidence for checks a counterparty's policy required | Counterparty in an active relationship |
| `AUTHORIZED_ONLY` | Director lists, turnover corroboration, screening detail | Holder of a matching authorization |
| `SENSITIVE` | Bank verification, financial detail | The subject organization; the requesting workspace |
| `RESTRICTED` | All person/BGV evidence, documents, identifiers | The requesting workspace only |

Public projections are **built from classification**, not from a hand-maintained
allow-list, so adding a check cannot accidentally publish it. Tests assert that
the public profile and digital card contain no restricted material.

---

## 5. Consent and authorization

Two separate, revocable objects (ADR-007):

- **Consent** — a subject permitting processing, with purpose, scope, version,
  expiry and revocation. Person-subject checks remain `BLOCKED_ON_CONSENT` until
  an in-scope consent exists; the engine refuses to start otherwise.
- **Authorization** — one organization permitting another to perform a scoped
  operation for a bounded period, checked on every cross-organization action.

Revoking either takes effect immediately for future processing and is audited.

---

## 6. Evidence integrity and audit

- Every evidence record carries a `payloadHash` over the normalized provider
  response and a link to its audit entry.
- The audit log is **hash-chained**: each entry embeds the previous entry's hash,
  so removal or edit of any entry breaks the chain. A test asserts the chain
  across the whole seeded history.
- Audit entries capture actor (user, system, provider or API client), action,
  resource, summary and metadata — including provider routing decisions and
  fallbacks.
- This build uses a fast non-cryptographic hash for demonstration. Production
  uses SHA-256 with a signing key from the secrets manager, WORM retention, and
  optionally external anchoring.

---

## 7. Data minimization, retention and deletion

- Only attributes the applied policy requires are collected, stored or shared.
- Identifiers are masked in this build and encrypted at rest in production;
  person contact details are stored masked plus a hash for matching.
- Evidence expires by policy validity; expired evidence is retained for the
  audit window and then tiered or purged by retention policy.
- Identity and relationship history is **not** hard-deleted — due diligence that
  cannot be reconstructed is not due diligence. Deletion requests are handled
  through the retention policy, with person data given the shortest retention.
- **BID does not sell personal data and operates no public candidate database.**

---

## 8. Application and transport security

- TLS in transit; HSTS at the edge.
- Rate limiting per API key (in-process here, at the gateway in production).
- Input validation at the transport boundary (`zod` schemas) before any domain
  call; the domain re-checks its own invariants regardless.
- Errors never leak internal identifiers or stack traces to clients.
- The web client renders no untrusted HTML; content is text-bound by default.
- Webhook payloads are signed with a per-endpoint secret shown once.

---

## 9. Threat notes

| Threat | Mitigation |
| --- | --- |
| Tenant data leakage through search or graph views | Single permission-aware read path; graph is workspace-scoped by default |
| Evidence tampering | Payload hashes + hash-chained audit + append-only tables |
| Over-broad consent | Scope recorded per check, expiry enforced, revocation honoured |
| Provider compromise or drift | Adapter isolation, per-transaction records, quality scoring, fallback routing |
| Credential forgery | Credentials resolve to a BID-hosted profile; signing planned (see roadmap) |
| Stale trust | Freshness on every evidence record; monitoring; policy-driven expiry |
| Privilege creep | Role ∩ entitlement evaluated per operation, not per session |

---

## 10. Compliance posture

BID Trust is **designed to support** privacy and due-diligence obligations:
purpose-bound processing, recorded consent, data minimization, auditability,
retention control and subject-scoped access. Nothing in this repository asserts
legal compliance for a specific deployment or jurisdiction — that requires
qualified legal review, and the product copy deliberately never claims otherwise.
