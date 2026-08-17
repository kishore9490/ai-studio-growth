# Provider integration

BID Trust is **provider-neutral**. Existing KYB, BGV, identity, banking, document
and screening providers remain the execution layer; BID contributes policy,
orchestration, evidence, assessment, credentials and monitoring around them.

This document is the contract for adding a real provider.

---

## 1. The interface

```ts
export interface VerificationProvider {
  readonly id: string;
  readonly name: string;
  readonly capabilities: ProviderCapability[]; // IDENTITY | KYB | BGV | BANK |
                                               // EDUCATION | EMPLOYMENT | DOCUMENT | RISK
  readonly countries: string[];
  supports(definition: CheckDefinition, country: string): boolean;
  execute(request: ProviderCheckRequest): Promise<ProviderCheckResponse>;
}
```

Capability-scoped aliases exist for readability (`IKYBProvider`,
`IBGVProvider`, `IRiskProvider`, …). One adapter may implement several.

```ts
interface ProviderCheckRequest {
  verificationRequestId, checkId, checkCode,
  definition,               // the catalog entry, including sourceLabel
  subjectType, subjectRef,  // BID ID — not internal keys
  subjectName,
  attributes,               // already minimized to what the check needs
  country, correlationId,
}

interface ProviderCheckResponse {
  outcome: 'PASS' | 'ATTENTION' | 'FAIL' | 'UNAVAILABLE';
  confidence: number;              // 0–1
  summary: string;                 // human-readable, shown to the requester
  normalized: Record<string, string | number | boolean>;
  reference: string;               // provider-side transaction reference
  latencyMs: number;
  sourceLabel?: string;            // overrides the catalog label if the provider names its source
}
```

**`UNAVAILABLE` is not a failure of the subject.** It means the provider could
not answer, and it is what triggers router fallback. Adapters must not map an
outage to `FAIL`.

---

## 2. Adding a provider

1. **Write the adapter** in `packages/core/src/providers/`:

```ts
export class AcmeKybProvider implements IKYBProvider {
  readonly id = 'acme-kyb';
  readonly name = 'Acme KYB';
  readonly capabilities: ProviderCapability[] = ['KYB'];
  readonly countries = ['IN'];

  constructor(private readonly http: HttpClient, private readonly secretRef: string) {}

  supports(definition: CheckDefinition, country: string) {
    return this.capabilities.includes(definition.capability) && this.countries.includes(country);
  }

  async execute(request: ProviderCheckRequest): Promise<ProviderCheckResponse> {
    const started = Date.now();
    const response = await this.http.post('/v2/gst/verify', {
      gstin: request.attributes.gstin,
      legalName: request.subjectName,
    });
    return {
      outcome: mapOutcome(response.status),        // adapter-local mapping
      confidence: response.matchScore / 100,
      summary: `${request.definition.label} confirmed against ${request.definition.sourceLabel}.`,
      normalized: {
        registrationStatus: response.status,
        nameMatch: response.nameMatch,
      },
      reference: response.txnId,
      latencyMs: Date.now() - started,
    };
  }
}
```

2. **Register it** in the composition root, and add a provider record (priority,
   cost multiplier, SLA, quality score, coverage, `secretRef`).
3. **Nothing else changes.** Policies, the verification engine, evidence,
   assessment, billing and the UI are untouched — this is the entire point of
   ADR-005.

---

## 3. Routing

```ts
new ProviderRouter(registry, () => store.providers.all(), strategy)
```

| Strategy | Ordering |
| --- | --- |
| `PRIORITY` (default) | capability match first, then configured priority |
| `COST` | lowest cost multiplier |
| `SLA` | fastest committed SLA |
| `QUALITY` | highest quality score |

Behaviour:

- Candidates are filtered by capability, country coverage and `enabled`.
- On `UNAVAILABLE` the router advances to the next candidate and records
  `fallbackFrom`.
- If every candidate is unavailable, the check is recorded as `UNAVAILABLE` with
  an honest summary — never silently marked passed or failed.
- Each decision writes an audit entry with the rationale
  ("Lowest cost multiplier (1×) among 3 candidates").

Provider records are editable at runtime from `/admin` → *Providers*: toggle a
provider off and the next check routes elsewhere.

---

## 4. Cost, SLA and observability

Every call produces a `ProviderTransaction`:

```
providerId · verificationRequestId · checkId · checkCode ·
requestedAt · completedAt · latencyMs · outcome · costPaise ·
reference · fallbackFrom
```

From these the admin console derives per-provider pass rate, average latency,
transaction volume and cost — the inputs to quality scoring and commercial
negotiation. `costPaise = catalog unit cost × provider cost multiplier`, so the
margin between customer price and provider cost is computable per check.

---

## 5. The mock adapters

Three adapters ship with the platform and make **no external network calls**:

| Adapter | Capabilities | Character |
| --- | --- | --- |
| Mock Provider A | KYB, IDENTITY, DOCUMENT | Fast, low cost, default identity route |
| Mock Provider B | RISK, KYB, BANK | Screening specialist; higher cost, higher quality |
| Mock Provider C | BGV, EDUCATION, EMPLOYMENT, IDENTITY, DOCUMENT | People verification; long SLA by nature |

Outcomes are a deterministic function of `(providerId, subjectRef, checkCode)`,
so the demo tells the same story on every load and tests stay stable. Each
adapter has a configurable `unavailabilityRate` that exercises router fallback,
and a `scripted` map the seed uses to make one contractor fail a statutory check
— because a demo where everything passes teaches nothing.

---

## 6. Adapter checklist

- [ ] Maps provider statuses to the four outcomes, with outages as `UNAVAILABLE`
- [ ] Returns a stable `reference` for dispute resolution
- [ ] Populates `normalized` with provider-agnostic fields only
- [ ] Never leaks raw provider payloads into the domain (evidence stores a hash)
- [ ] Reads credentials from the secrets manager via `secretRef`
- [ ] Enforces timeouts and retries **inside** the adapter; the router handles
      only routing-level fallback
- [ ] Declares accurate country coverage
- [ ] Ships adapter-level tests using recorded fixtures, not live calls
- [ ] Does not log personal data

---

## 7. What BID will not do

- Claim a provider partnership that has not been signed.
- Present provider data as government endorsement — evidence says
  "authorized GST data provider", never "certified by the Government".
- Hide which provider produced a result from the customer who paid for it.
- Lock a customer into a single provider: routing preference is configuration.
