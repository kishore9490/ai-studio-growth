# Verification model

How a request becomes a defensible statement, and what that statement does and
does not mean.

---

## 1. The pipeline

```
Verification request
  → Policy version (immutable)
  → Compiled plan
  → Consent / authorization gate
  → Provider router
  → Provider
  → Normalized result
  → Evidence
  → Assessment
  → Decision (by the requester, never by BID)
  → Credential
  → Monitoring
```

Each arrow is a service boundary, and each step writes an audit entry.

---

## 2. Check catalog

The catalog is the platform's vocabulary. Policies compose from it; providers
execute it. A catalog entry declares what the check *is*, not who runs it:

```ts
CheckDefinition {
  code,                    // ORG_GST, PER_EDUCATION, …
  label, description,
  category,                // IDENTITY | COMPLIANCE | FINANCIAL | RISK | CREDENTIAL | PEOPLE
  subjectType,             // ORGANIZATION | PERSON
  capability,              // KYB | RISK | BGV | BANK | EDUCATION | EMPLOYMENT | DOCUMENT | IDENTITY
  sourceLabel,             // copied verbatim into evidence
  method,                  // API | DOCUMENT | DATABASE | MANUAL_REVIEW
  requiresConsent, requiresDocument,
  defaultValidityDays, unitCostPaise, slaHours,
  evidenceVisibility,      // classification of the resulting evidence
  publicSummaryAllowed,    // may a passing summary appear on a public profile?
}
```

Organization checks span identity (GST, PAN, registry, directors, address,
Udyam), financial (bank, turnover, financial health), compliance (filing
regularity, statutory workforce, certifications, licences, insurance) and risk
(sanctions, AML/adverse media, litigation, ownership/UBO). Person checks cover
identity, address, education, employment, professional credentials, permitted
database screening and references — all `requiresConsent: true`,
`evidenceVisibility: RESTRICTED`, `publicSummaryAllowed: false`.

---

## 3. Policy → plan

A policy version compiles into a plan **once**, at request time:

```ts
VerificationPlan {
  policyId, policyVersion,
  checks: [{ checkCode, definition, required, blocking, validityDays }],
  requiresConsent, consentScope[],
  requiredDocuments[],
  estimatedCostPaise, estimatedSlaHours,
}
```

- **required** — the policy expects it; a gap shows in the assessment.
- **blocking** — failure blocks the decision beyond the policy's tolerance.
- The version is **sealed** when it first justifies a completed decision. Later
  edits create a new version, so every historical decision remains
  reconstructible against the exact rules that produced it.

---

## 4. Consent and authorization gates

Person-subject checks are created in state `BLOCKED_ON_CONSENT` and stay there.
`start()` refuses to run and names the blocked checks. Granting an in-scope
consent moves them to `PLANNED`.

Consent records subject, purpose, scope, version, timestamps, expiry and
revocation. Authorization — one organization permitting another to operate, for
example an employer authorizing a staffing partner to run BGV on its behalf — is
a separate object with its own scope and window (ADR-007).

---

## 5. Routing and execution

The router chooses among providers that declare the required capability and
cover the subject's country, ordered by the configured strategy:

| Strategy | Ordering |
| --- | --- |
| `PRIORITY` (default) | capability match first, then configured priority |
| `COST` | lowest cost multiplier |
| `SLA` | fastest committed SLA |
| `QUALITY` | highest quality score |

On `UNAVAILABLE` the router falls through to the next candidate and records
`fallbackFrom`. Every attempt is written as a provider transaction with latency,
cost, outcome and reference, and the routing rationale goes into the audit trail
("Primary route for KYB capability (priority 1)").

Provider responses are normalized into an outcome (`PASS | ATTENTION | FAIL |
UNAVAILABLE`), a confidence, a human summary and a provider-agnostic payload.
Nothing downstream knows which vendor produced it.

---

## 6. Evidence

```ts
Evidence {
  what, source, attribution, providerId, providerName, method,
  checkedAt, result, confidence, scope, reference, payloadHash,
  expiresAt, freshness, policyId, policyVersion, visibility, auditLogId
}
```

Answering, for every check: **what · who · source · method · when · result ·
scope · freshness**.

`attribution` is what keeps the product honest:

| Attribution | Meaning |
| --- | --- |
| `COMPANY_PROVIDED` | Stated by the organization; not independently verified |
| `PROVIDER_VERIFIED` | Confirmed by a named verification provider |
| `OFFICIAL_SOURCE_DERIVED` | Derived from an authorized data source via a provider — **not** a government endorsement |
| `BID_VERIFIED` | Derived by BID from evidence collected under a policy |

Freshness is computed against the policy's validity window:
`CURRENT` (< 60%) → `AGING` (60–85%) → `STALE` (85–100%) → `EXPIRED`.

---

## 7. Assessment

Weights, and how the score is built:

| Category | Weight |
| --- | --- |
| Identity | 30 |
| Risk | 25 |
| Compliance | 20 |
| Financial | 15 |
| Credential | 7 |
| People | 3 |

For each applicable category:
`contribution = ((passed + 0.5 × attention) / total) × weight`
and `score = round(Σ contribution / Σ weight × 100)`.

Categories the policy did not ask for are marked `NOT_APPLICABLE` and excluded
from the denominator — a policy is never punished for what it deliberately did
not check.

Band:

| Condition | Band |
| --- | --- |
| Blocking failures beyond tolerance | `HIGH_RISK` |
| `score ≥ autoApproveScore` | `LOW_RISK` |
| `score ≥ reviewScore` | `MODERATE_RISK` |
| `score > 0` | `ELEVATED_RISK` |
| No evidence | `INSUFFICIENT_EVIDENCE` |

Every assessment carries an explanation naming the strongest and weakest
categories, blocking failures, failed/attention/missing checks and the
thresholds applied — plus the standing disclaimer that the statement is bounded
by the evidence and policy available for that verification.

**The score is never the only output.** The product surface always shows
per-category verdicts, the evidence table, what is missing and when it expires.

---

## 8. Decision

The approval rule comes from the policy version:

| Rule | Behaviour |
| --- | --- |
| `AUTO` | Approved automatically when the score clears the auto-approve threshold and no blocking failure exceeds tolerance |
| `MANUAL` | Always routed to a human reviewer |
| `DUAL_CONTROL` | Intended for two-person approval on critical policies |

Outcomes: `APPROVED`, `APPROVED_WITH_CONDITIONS`, `REJECTED`. The decision, the
decider and the note are recorded and audited. **BID does not decide whether a
counterparty is acceptable — the requesting organization does.**

---

## 9. Credential

Approval issues a credential carrying only public-safe attribute summaries
(Identity / Business status / Required compliance / Risk checks), the policy
version, issuance and expiry. It is portable: the verified organization reuses it
with its next counterparty, which is what makes verification an asset to the
subject rather than only a cost.

Credentials expire with the policy validity window and can be revoked with a
recorded reason.

---

## 10. Monitoring and re-verification

Monitoring rules watch signals (business/registry status, GST status, filing
regularity, credential expiry, risk signals, verification expiry, relationship
status) at the policy's cadence. An alert names its source, its severity and a
recommended action, and feeds back into re-assessment and re-verification.

In this build, signals come from a **mock feed**; BID does not claim access to
every government or private event stream.

---

## 11. Worked example — the demo's exception path

RST Security Services is verified under the Critical Contractor policy:

- `ORG_EPF` (statutory workforce compliance, **blocking**) → `FAIL`
- `ORG_INSURANCE` → `ATTENTION`
- `ORG_LICENCE` → `ATTENTION`
- everything else → `PASS`

Result: score 81/100 but band `HIGH_RISK`, because a blocking check failed and
the policy tolerates zero. Status becomes `REQUIRES_REVIEW`, not `COMPLETED`.
A monitoring alert later reports an unresolved statutory signal for the same
organization, tying the point-in-time finding to continuous oversight.

The number alone would have looked acceptable. The policy, the blocking flag and
the evidence are what make it correct.
