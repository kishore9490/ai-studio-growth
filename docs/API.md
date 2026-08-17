# API

Base URL (local): `http://localhost:4000` · all resources under `/v1`.

The API and the web application call the **same domain services**, so an
entitlement or tenancy rule cannot be true in one and false in the other.

---

## Authentication

Three credentials are accepted, in this order of precedence.

### 1. A session, from signing in

```bash
curl -s -X POST localhost:4000/v1/auth/login \
  -H 'content-type: application/json' \
  -d '{"email":"priya.nair@abc-technologies.example","password":"bid-demo-password"}'
```

```json
{ "data": { "token": "bid_sess_…", "expiresAt": "…", "user": {…}, "workspace": {…} } }
```

Send it as `Authorization: Bearer bid_sess_…`. The session acts as that person,
with that person's workspace roles.

Sessions expire after 12 hours and can be revoked before then — `POST
/v1/auth/logout` ends the current one, `POST /v1/auth/logout-all` ends every
session for the user, and `GET /v1/auth/sessions` lists them. The token itself
is never stored: only a SHA-256 digest is, so a database read cannot recover a
usable credential.

Passwords are stored as PBKDF2-HMAC-SHA256 with a per-user salt. A wrong
password and an unknown address produce byte-identical responses. Eight
consecutive failures lock an account for fifteen minutes, and a locked account
is still reported as `INVALID_CREDENTIALS` so the lockout does not confirm that
the address exists.

`POST /v1/auth/register` creates an organization, its workspace and an owner in
one call, and returns a session. It claims an existing unclaimed organization
rather than duplicating it — an organization is routinely in the network before
anyone from it signs up. Registering makes you a **member**, not a customer:
`canInitiateVerification` stays false until a requester plan is bought.

### 2. A workspace API key

```
x-bid-api-key: <key>
```

Machine access: scoped to one workspace, with no user behind it. In production
the key is hashed at rest, shown once at creation, carries scopes and a per-key
rate limit.

### 3. The demo master key

`bid_demo_key` (override with `BID_DEMO_API_KEY`, or set it empty to disable).
It is the only credential that honours `x-bid-act-as: <BID-ID>`, which is what
makes the examples below runnable against the seeded demo network.

Public routes (`/v1/public/*`, `/health`) require no credential at all.

### Errors

```json
{ "error": { "code": "FORBIDDEN", "message": "…", "reason": "ENTITLEMENT" } }
```

| Status | Code | Meaning |
| --- | --- | --- |
| 400 | `BAD_REQUEST` | Schema validation failed (`details` carries field errors) |
| 401 | `UNAUTHORIZED` | Missing, expired, revoked or unrecognized credential |
| 401 | `INVALID_CREDENTIALS` | Sign-in refused — identical for a wrong password, an unknown address and a locked account |
| 403 | `FORBIDDEN` | Role (`reason: ROLE`) or plan (`reason: ENTITLEMENT`) does not permit it |
| 404 | `NOT_FOUND` | Absent — or outside your tenant, which is reported identically |
| 409 | `CONFLICT` | Collides with something that exists (an email already registered) |
| 409 | `VERIFICATION_BLOCKED` | The verification is waiting on consent or documents; the body names what is outstanding |
| 422 | `VALIDATION_FAILED` | The domain refused the value; `field` names the input |
| 429 | `RATE_LIMITED` | Per-key window exhausted |
| 503 | `PERSISTENCE_UNAVAILABLE` | The change could not be committed to durable storage and was not applied |

Records belonging to another workspace return **404, not 403**: existence itself
is not disclosed across tenants.

---

## Resource index

`GET /v1` returns the machine-readable index of every route.

| Area | Routes |
| --- | --- |
| Auth | `POST /v1/auth/register` · `POST /v1/auth/login` · `POST /v1/auth/logout` · `POST /v1/auth/logout-all` · `GET /v1/auth/me` · `GET /v1/auth/sessions` · `DELETE /v1/auth/sessions/{id}` |
| Organizations | `POST /v1/organizations` · `GET /v1/organizations` · `GET /v1/organizations/{bidId}` · `PATCH /v1/organizations/{bidId}` |
| Invitations | `POST /v1/invitations` · `GET /v1/invitations` · `GET /v1/invitations/{id}` · `POST /v1/invitations/{id}/accept` |
| Relationships | `POST /v1/relationships` · `GET /v1/relationships` · `GET /v1/relationships/{id}` · `PATCH /v1/relationships/{id}` |
| Policies | `GET /v1/policies` · `POST /v1/policies` · `GET /v1/policies/{id}` · `GET /v1/policies/{id}/plan` · `POST /v1/policies/{id}/versions` · `POST /v1/policies/generate` |
| Verification | `POST /v1/verification-requests` · `GET /v1/verification-requests` · `GET /v1/verification-requests/{id}` · `POST /v1/verification-requests/{id}/run` · `POST /v1/verification-requests/{id}/decision` · `GET /v1/verification-requests/{id}/evidence` · `GET /v1/verification-status/{bidId}` |
| Documents | `GET /v1/verification-requests/{id}/documents` · `POST /v1/verification-requests/{id}/documents/{documentId}` · `POST /v1/verification-requests/{id}/documents/{documentId}/review` |
| People | `POST /v1/bgv/requests` · `POST /v1/consents` · `POST /v1/consents/{id}/grant` |
| Authorization | `POST /v1/authorizations` |
| Credentials | `GET /v1/credentials` |
| Campaigns | `POST /v1/campaigns` · `GET /v1/campaigns` · `GET /v1/campaigns/{id}` · `POST /v1/campaigns/{id}/members` |
| Monitoring | `POST /v1/monitoring` · `GET /v1/monitoring` · `GET /v1/monitoring/alerts` · `POST /v1/monitoring/alerts/{id}/status` · `POST /v1/monitoring/sweep` |
| Billing | `GET /v1/plans` · `GET /v1/billing/subscription` · `GET /v1/billing/usage` · `GET /v1/billing/invoices` · `POST /v1/billing/subscription` |
| Public | `GET /v1/public/profiles/{bidId}` · `GET /v1/public/cards/{bidId}` |

---

## Walkthrough: onboard and verify a supplier

```bash
KEY='x-bid-api-key: bid_demo_key'
JSON='content-type: application/json'

# 1. Find a policy
curl -s -H "$KEY" localhost:4000/v1/policies | jq '.data[] | select(.name=="Standard Supplier Policy")'

# 2. Inspect what it will actually do, before committing to it
curl -s -H "$KEY" localhost:4000/v1/policies/POLICY_ID/plan | jq '.data | {checks: [.checks[].label], estimatedCostPaise, estimatedSlaHours, requiresConsent}'

# 3. Invite the counterparty — creates identity, relationship, invitation and
#    verification request in one call
curl -s -X POST -H "$KEY" -H "$JSON" localhost:4000/v1/invitations -d '{
  "organizationName": "Nimbus Fasteners",
  "email": "sales@nimbus.example",
  "relationshipType": "SUPPLIER",
  "policyId": "POLICY_ID"
}' | jq
```

```json
{
  "data": {
    "invitationId": "inv_00j5",
    "status": "SENT",
    "counterparty": { "bidId": "BID-BUS-00419", "displayName": "Nimbus Fasteners" },
    "relationshipId": "BID-REL-00007",
    "verificationRequestId": "BID-VER-00007",
    "verificationId": "vr_00jd"
  }
}
```

```bash
# 4. The counterparty accepts (their own credentials; demo key + act-as here).
#    They become a MEMBER — free, not a customer.
curl -s -X POST -H "$KEY" -H "x-bid-act-as: BID-BUS-00419" \
  localhost:4000/v1/invitations/inv_00j5/accept | jq
# → { "data": { "commercialState": "MEMBER", ... } }

# 5. Run the plan
curl -s -X POST -H "$KEY" -H "$JSON" -d '{"mode":"ALL"}' \
  localhost:4000/v1/verification-requests/vr_00jd/run | jq '.data | {status, decision, assessment}'
```

```json
{
  "status": "CREDENTIAL_ISSUED",
  "decision": "APPROVED",
  "assessment": {
    "band": "LOW_RISK",
    "score": 100,
    "freshness": "CURRENT",
    "categories": [ { "category": "IDENTITY", "verdict": "VERIFIED", "passed": 4, "total": 4, "weight": 30, "contribution": 30 } ],
    "missingChecks": [],
    "explanation": "Score 100/100 is the weighted result of 4 evidence categories applied by this policy version. …",
    "disclaimer": "Assessment based on the evidence and policy available for this verification. BID Trust is an independent private verification platform; it is not a government authority …"
  }
}
```

```bash
# 6. Read the evidence behind it
curl -s -H "$KEY" localhost:4000/v1/verification-requests/vr_00jd/evidence | jq '.data[0]'
```

```json
{
  "what": "GST registration",
  "source": "Authorized GST data provider",
  "attribution": "OFFICIAL_SOURCE_DERIVED",
  "provider": "Mock Provider A",
  "method": "API",
  "checkedAt": "2026-08-17T09:30:46.000Z",
  "result": "PASS",
  "confidence": 0.97,
  "scope": "Confirms the GST registration number resolves to the stated legal entity and is currently active.",
  "reference": "MOCK-PROVIDER-A-7EB4BE77",
  "freshness": "CURRENT",
  "expiresAt": "2027-02-13T09:30:46.000Z",
  "policyVersion": 1,
  "visibility": "RELATIONSHIP_ONLY"
}
```

The subject organization calling the same endpoint receives a redacted set
(`"redacted": true`) filtered to its clearance.

---

## Documents

A policy asks for paperwork as well as provider checks. Both sides of the
request can list it; only the **subject** can supply it, and only the
**requester** can review it.

```bash
curl -s -H "$KEY" localhost:4000/v1/verification-requests/vr_00jd/documents | jq
```

```json
{
  "data": [
    { "id": "vdoc_001a", "label": "Labour licence", "required": true, "visibility": "RELATIONSHIP_ONLY", "status": "REQUESTED" },
    { "id": "vdoc_001b", "label": "Workmen compensation insurance", "required": true, "visibility": "RELATIONSHIP_ONLY", "status": "REQUESTED" }
  ],
  "outstanding": 2
}
```

Running before the paperwork arrives is refused, with the reason:

```bash
curl -s -X POST -H "$KEY" -H "$JSON" -d '{"mode":"ALL"}' \
  localhost:4000/v1/verification-requests/vr_00jd/run
# HTTP/1.1 409 Conflict
```

```json
{
  "error": {
    "code": "VERIFICATION_BLOCKED",
    "message": "Verification BID-VER-00007 is waiting on 2 document(s) from Southgate Facilities: Labour licence, Workmen compensation insurance.",
    "blockedBy": "DOCUMENTS",
    "outstanding": ["Labour licence", "Workmen compensation insurance"]
  }
}
```

The subject supplies each item (the requester attempting this gets `403`):

```bash
curl -s -X POST -H "$KEY" -H "x-bid-act-as: BID-BUS-00419" -H "$JSON" \
  -d '{"fileName":"labour-licence.pdf","sizeBytes":210000}' \
  localhost:4000/v1/verification-requests/vr_00jd/documents/vdoc_001a
```

and the requester accepts or returns it — returning it re-blocks the dependent
checks and tells the subject why:

```bash
curl -s -X POST -H "$KEY" -H "$JSON" \
  -d '{"accept":false,"note":"Licence has expired — please send the current one."}' \
  localhost:4000/v1/verification-requests/vr_00jd/documents/vdoc_001a/review
```

Only document **metadata** crosses this API in the current build. Production
issues a signed upload URL and stores the object encrypted; the hash recorded
here is the integrity anchor for it.

## Decisions

```bash
curl -s -X POST -H "$KEY" -H "$JSON" \
  localhost:4000/v1/verification-requests/vr_00jd/decision \
  -d '{"decision":"APPROVED_WITH_CONDITIONS","note":"Insurance certificate to be renewed within 30 days."}'
```

`decision ∈ APPROVED | APPROVED_WITH_CONDITIONS | REJECTED`. Approval issues a
credential and promotes the subject to **verified member** — never to customer.
An API key must carry the `verification:decide` scope; deciding acceptability is
a human role by default (Business Rule 14).

---

## People verification

```bash
curl -s -X POST -H "$KEY" -H "$JSON" localhost:4000/v1/bgv/requests -d '{
  "fullName": "Ravi Kumar",
  "email": "ravi.kumar@example.com",
  "phone": "9876543210",
  "policyId": "CANDIDATE_BGV_POLICY_ID"
}' | jq
```

```json
{
  "data": {
    "verificationBidId": "BID-VER-00008",
    "personBidId": "BID-PER-00032",
    "status": "CONSENT_PENDING",
    "consent": { "status": "REQUESTED", "scope": ["Identity verification", "Education verification"], "purpose": "…" },
    "note": "No check will execute until the subject grants consent for the recorded scope."
  }
}
```

`POST /v1/verification-requests/{id}/run` on a consent-blocked request fails with
a message naming the blocked checks. In production the grant endpoint is reached
by the subject through a signed consent link, not by the requester.

Requires `canRunBgv` (Growth plan and above).

---

## Policy generation (domain agnosticism, as an API)

```bash
curl -s -X POST -H "$KEY" -H "$JSON" localhost:4000/v1/policies/generate \
  -d '{"target":"CONTRACTOR","industry":"CONSTRUCTION","riskLevel":"CRITICAL"}' \
  | jq '.data | {name, approvalRule, requiredChecks: [.requiredChecks[].checkCode], rationale}'
```

---

## Public endpoints

```bash
curl -s localhost:4000/v1/public/profiles/BID-BUS-00231 | jq '.data.verifiedAttributes'
curl -s localhost:4000/v1/public/cards/BID-BUS-00231 | jq '.data'
```

These serve the same projection the web profile uses. Documents, identifiers,
bank details, candidate data and raw evidence are structurally unreachable from
them.

---

## Webhooks

Registered endpoints receive domain events (`VerificationCompleted`,
`MonitoringAlertCreated`, `CredentialIssued`, `InvitationAccepted`,
`CustomerAtRisk`, …):

```json
{
  "id": "evt_0f21",
  "name": "VerificationCompleted",
  "occurredAt": "2026-08-17T09:31:22.000Z",
  "workspaceId": "ws_0007",
  "organizationId": "org_0003",
  "payload": { "verificationRequestId": "vr_00jd", "band": "LOW_RISK", "score": 100 }
}
```

Delivery is signed with the endpoint secret (`whsec_…`, shown once). Consumers
must treat delivery as at-least-once and key on `id`.

---

## Conventions

- Responses wrap payloads in `data`, with `count` on collections.
- Timestamps are ISO-8601 UTC.
- Money is **paise** (integer). `499900` = ₹4,999.
- IDs come in two flavours: opaque internal ids (`vr_00jd`) and quotable BID IDs
  (`BID-VER-00007`). Public-facing references use BID IDs.
- Pricing responses carry the disclaimer: *illustrative starting prices; final
  pricing depends on verification scope, provider costs, volume, SLA and
  requirements.*
