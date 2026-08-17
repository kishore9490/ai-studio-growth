# API

Base URL (local): `http://localhost:4000` · all resources under `/v1`.

The API and the web application call the **same domain services**, so an
entitlement or tenancy rule cannot be true in one and false in the other.

---

## Authentication

```
x-bid-api-key: <key>
# or
Authorization: Bearer <key>
```

Keys are workspace-scoped. In production the key is hashed at rest, shown once
at creation, carries scopes and a per-key rate limit. This build additionally
accepts a demo master key (`bid_demo_key`, override with `BID_DEMO_API_KEY`) and
honours `x-bid-act-as: <BID-ID>` **for that key only**, so the examples below are
runnable against the seeded demo network.

Public routes (`/v1/public/*`, `/health`) require no key.

### Errors

```json
{ "error": { "code": "FORBIDDEN", "message": "…", "reason": "ENTITLEMENT" } }
```

| Status | Code | Meaning |
| --- | --- | --- |
| 400 | `BAD_REQUEST` | Schema validation failed (`details` carries field errors) |
| 401 | `UNAUTHORIZED` | Missing or unrecognized API key |
| 403 | `FORBIDDEN` | Role (`reason: ROLE`) or plan (`reason: ENTITLEMENT`) does not permit it |
| 404 | `NOT_FOUND` | Absent — or outside your tenant, which is reported identically |
| 429 | `RATE_LIMITED` | Per-key window exhausted |

Records belonging to another workspace return **404, not 403**: existence itself
is not disclosed across tenants.

---

## Resource index

`GET /v1` returns the machine-readable index of every route.

| Area | Routes |
| --- | --- |
| Organizations | `POST /v1/organizations` · `GET /v1/organizations` · `GET /v1/organizations/{bidId}` · `PATCH /v1/organizations/{bidId}` |
| Invitations | `POST /v1/invitations` · `GET /v1/invitations` · `GET /v1/invitations/{id}` · `POST /v1/invitations/{id}/accept` |
| Relationships | `POST /v1/relationships` · `GET /v1/relationships` · `GET /v1/relationships/{id}` · `PATCH /v1/relationships/{id}` |
| Policies | `GET /v1/policies` · `POST /v1/policies` · `GET /v1/policies/{id}` · `GET /v1/policies/{id}/plan` · `POST /v1/policies/{id}/versions` · `POST /v1/policies/generate` |
| Verification | `POST /v1/verification-requests` · `GET /v1/verification-requests` · `GET /v1/verification-requests/{id}` · `POST /v1/verification-requests/{id}/run` · `POST /v1/verification-requests/{id}/decision` · `GET /v1/verification-requests/{id}/evidence` · `GET /v1/verification-status/{bidId}` |
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
