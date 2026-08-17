export interface ArchNode {
  id: string;
  label: string;
  kind: 'service' | 'store' | 'external' | 'client' | 'concept';
  x: number;
  y: number;
  purpose: string;
  responsibilities: string[];
  inputs: string[];
  outputs: string[];
  dependencies: string[];
  data: string[];
  events: string[];
  apis: string[];
  security: string[];
  future: string[];
}

export interface ArchEdge {
  source: string;
  target: string;
  label?: string;
}

export interface ArchView {
  id: string;
  title: string;
  description: string;
  nodes: ArchNode[];
  edges: ArchEdge[];
}

const node = (
  id: string,
  label: string,
  kind: ArchNode['kind'],
  x: number,
  y: number,
  detail: Partial<Omit<ArchNode, 'id' | 'label' | 'kind' | 'x' | 'y'>> & { purpose: string },
): ArchNode => ({
  id,
  label,
  kind,
  x,
  y,
  purpose: detail.purpose,
  responsibilities: detail.responsibilities ?? [],
  inputs: detail.inputs ?? [],
  outputs: detail.outputs ?? [],
  dependencies: detail.dependencies ?? [],
  data: detail.data ?? [],
  events: detail.events ?? [],
  apis: detail.apis ?? [],
  security: detail.security ?? [],
  future: detail.future ?? [],
});

export const ARCHITECTURE_VIEWS: ArchView[] = [
  {
    id: 'overview',
    title: 'Overview',
    description:
      'The eight capabilities that compose BID Trust. Identity and relationship describe the world; policy, verification, evidence and assessment interrogate it; credential and monitoring keep the answer useful over time.',
    nodes: [
      node('identity', 'Identity', 'concept', 0, 0, {
        purpose: 'Stable, namespaced identifiers for organizations and people, independent of any tenant.',
        responsibilities: ['Allocate BID IDs', 'Hold organization and person records', 'Track organization lifecycle'],
        outputs: ['BID-BUS-… / BID-PER-… identifiers'],
        data: ['organizations', 'persons', 'organization_identifiers', 'bid_ids'],
        events: ['OrganizationCreated', 'OrganizationClaimed', 'OrganizationVerified'],
        apis: ['POST /v1/organizations', 'GET /v1/organizations/{bidId}'],
        security: ['Identity is network-visible at name/ID level only'],
        future: ['Merge/dedupe of discovered identities', 'Cross-border identifier namespaces'],
      }),
      node('relationship', 'Relationship', 'concept', 240, 0, {
        purpose: 'A typed, time-bounded link between a workspace and a counterparty — the object procurement actually manages.',
        responsibilities: ['Own relationship lifecycle', 'Bind policy and verification to a counterparty', 'Carry monitoring flag'],
        data: ['relationships', 'relationship_roles', 'invitations'],
        events: ['RelationshipCreated', 'RelationshipStateChanged', 'InvitationAccepted'],
        apis: ['POST /v1/relationships', 'POST /v1/invitations'],
        security: ['Records are workspace-scoped; counterparties never see them'],
        future: ['Contract and SLA linkage', 'Sub-tier (n-th degree) supply chain mapping'],
      }),
      node('policy', 'Policy engine', 'concept', 480, 0, {
        purpose: 'Turns "what must be true about this counterparty" into an executable, versioned plan.',
        responsibilities: ['Compose checks', 'Set thresholds and approval rules', 'Version immutably', 'Define validity and monitoring cadence'],
        outputs: ['Verification plan'],
        data: ['policies', 'policy_versions'],
        events: ['PolicyCreated', 'PolicyVersionSealed'],
        apis: ['POST /v1/policies', 'GET /v1/policies/{id}'],
        security: ['Workspace policies are private; BID templates are shared read-only'],
        future: ['Policy inheritance and org-wide defaults', 'Policy simulation against historical evidence'],
      }),
      node('verification', 'Verification engine', 'concept', 720, 0, {
        purpose: 'Executes a plan through routed providers and produces normalized results.',
        responsibilities: ['Drive the verification lifecycle', 'Enforce consent gating', 'Record provider transactions'],
        dependencies: ['Policy engine', 'Provider router', 'Consent'],
        data: ['verification_requests', 'verification_checks', 'verification_results'],
        events: ['VerificationRequested', 'VerificationStarted', 'VerificationCheckCompleted', 'VerificationCompleted'],
        apis: ['POST /v1/verification-requests', 'GET /v1/verification-requests/{id}'],
        security: ['Results are tenant-owned; subjects see outcomes, not others’ evidence'],
        future: ['Parallel check execution with partial results', 'Retry and remediation workflows'],
      }),
      node('evidence', 'Evidence', 'concept', 120, 170, {
        purpose: 'Provenance for every check: what, source, provider, method, when, result, scope, freshness.',
        responsibilities: ['Store immutable evidence records', 'Classify visibility', 'Compute freshness against policy validity'],
        data: ['evidence'],
        apis: ['GET /v1/verification-requests/{id}/evidence'],
        security: ['Field-level classification from PUBLIC to RESTRICTED', 'Payload hash + audit link'],
        future: ['Signed evidence bundles', 'Verifiable credential export (W3C VC)'],
      }),
      node('assessment', 'Assessment', 'concept', 360, 170, {
        purpose: 'An explainable, policy-bounded verdict — never a bare score.',
        responsibilities: ['Weight categories', 'Explain contributions and gaps', 'Set expiry'],
        data: ['risk_assessments'],
        events: ['AssessmentCreated'],
        security: ['Assessment text avoids unsupported claims about a counterparty'],
        future: ['Requester-tunable category weights', 'Peer benchmarking with consent'],
      }),
      node('credential', 'Credential', 'concept', 600, 170, {
        purpose: 'The portable outcome the verified organization reuses with its next counterparty.',
        responsibilities: ['Issue, expire and revoke', 'Expose only public-safe attribute summaries'],
        data: ['credentials'],
        events: ['CredentialIssued', 'CredentialRevoked'],
        apis: ['GET /v1/credentials'],
        security: ['Public attributes derived only from checks flagged publicly shareable'],
        future: ['Cryptographic credential signing', 'Third-party credential verification endpoint'],
      }),
      node('monitoring', 'Monitoring', 'concept', 840, 170, {
        purpose: 'Keeps a point-in-time verification meaningful between verifications.',
        responsibilities: ['Hold monitoring rules', 'Ingest signals', 'Raise alerts and prompt re-assessment'],
        data: ['monitoring_rules', 'monitoring_events'],
        events: ['MonitoringEnabled', 'MonitoringAlertCreated'],
        apis: ['POST /v1/monitoring'],
        security: ['Alerts are workspace-scoped; sources are always named'],
        future: ['Real provider event streams', 'Signal-to-policy auto re-verification'],
      }),
    ],
    edges: [
      { source: 'identity', target: 'relationship' },
      { source: 'relationship', target: 'policy' },
      { source: 'policy', target: 'verification' },
      { source: 'verification', target: 'evidence' },
      { source: 'evidence', target: 'assessment' },
      { source: 'assessment', target: 'credential' },
      { source: 'credential', target: 'monitoring' },
      { source: 'monitoring', target: 'verification', label: 're-verify' },
    ],
  },
  {
    id: 'business',
    title: 'Business architecture',
    description:
      'How BID makes money without turning members into products: free membership creates the network, paid requester capabilities monetize it.',
    nodes: [
      node('member', 'BID Member (free)', 'concept', 0, 0, {
        purpose: 'An organization that holds its identity and responds to verification requests.',
        responsibilities: ['Maintain profile', 'Respond to requests', 'Hold credentials'],
        outputs: ['Network supply of verified counterparties'],
        security: ['Cannot initiate verification or read others’ data'],
        future: ['Member-initiated profile refresh reminders'],
      }),
      node('requester', 'BID Requester (paid)', 'concept', 260, 0, {
        purpose: 'An organization that initiates verification of others.',
        responsibilities: ['Create policies and campaigns', 'Run verification', 'Enable monitoring'],
        dependencies: ['Subscription with requester entitlements'],
        security: ['Entitlement checks gate every requester capability'],
        future: ['Team-level spend controls'],
      }),
      node('flywheel', 'Network flywheel', 'concept', 130, 160, {
        purpose: 'Each verified member is a candidate requester, and each requester introduces the next cohort.',
        responsibilities: ['Convert invitees to members', 'Convert verified members to requesters'],
        data: ['customer_lifecycle', 'invitations'],
        events: ['InvitationAccepted', 'SubscriptionCreated', 'CustomerLifecycleChanged'],
        future: ['Referral attribution and incentives'],
      }),
      node('revenue', 'Revenue streams', 'concept', 400, 160, {
        purpose: 'Subscription plus consumption: checks, re-verification, monitoring, BGV, API, enhanced due diligence.',
        data: ['plans', 'subscriptions', 'usage', 'invoices'],
        events: ['UsageRecorded', 'InvoiceIssued', 'PaymentReceived'],
        security: ['Pricing is admin configuration, never compiled into domain logic'],
        future: ['Usage-based enterprise contracts', 'Provider cost pass-through transparency'],
      }),
      node('providers-biz', 'Provider ecosystem', 'external', 640, 0, {
        purpose: 'Existing verification vendors remain the execution layer; BID is the orchestration layer above them.',
        responsibilities: ['Execute checks', 'Return provider results'],
        security: ['Credentials held in a secrets manager, never in tenant data'],
        future: ['Marketplace of certified adapters', 'Commercial routing by negotiated rate'],
      }),
    ],
    edges: [
      { source: 'member', target: 'flywheel', label: 'gets verified' },
      { source: 'flywheel', target: 'requester', label: 'discovers value' },
      { source: 'requester', target: 'revenue', label: 'subscribes & consumes' },
      { source: 'requester', target: 'member', label: 'invites next cohort' },
      { source: 'requester', target: 'providers-biz', label: 'orchestrates' },
    ],
  },
  {
    id: 'organization',
    title: 'Organization architecture',
    description:
      'Organization identity is global and permanent; the workspace is the private tenant an organization operates from. Confusing the two is the single most common modelling mistake in this space.',
    nodes: [
      node('org-entity', 'Organization', 'store', 0, 0, {
        purpose: 'The primary entity. Never intrinsically a vendor, supplier or customer.',
        data: ['organizations'],
        outputs: ['BID organization ID'],
        security: ['Name and BID ID are network-visible; everything else is classified'],
        future: ['Entity resolution across duplicate registrations'],
      }),
      node('workspace', 'Workspace (tenant)', 'store', 260, 0, {
        purpose: 'The private tenant where an organization does its own verification work.',
        data: ['workspaces', 'workspace_memberships'],
        security: ['Every read/write carries workspace_id; cross-tenant access is rejected'],
        future: ['Multiple workspaces per organization (by business unit)'],
      }),
      node('identifiers', 'Identifiers', 'store', 520, 0, {
        purpose: 'Registry identifiers the organization asserts (GSTIN, PAN, CIN, Udyam).',
        data: ['organization_identifiers'],
        security: ['Masked in this build; encrypted at rest in production'],
        future: ['Per-identifier verification status and re-check cadence'],
      }),
      node('users', 'Users & roles', 'store', 130, 160, {
        purpose: 'Login identities and their roles inside a workspace.',
        data: ['users', 'workspace_memberships'],
        security: ['RBAC roles intersected with plan entitlements', 'MFA; OIDC-ready for SSO'],
        future: ['SCIM provisioning', 'Just-in-time access for auditors'],
      }),
      node('lifecycle-org', 'Organization lifecycle', 'concept', 390, 160, {
        purpose: 'DISCOVERED → INVITED → CLAIMED → REGISTERED → VERIFIED → ACTIVE → SUSPENDED → ARCHIVED.',
        security: ['Historical identity is retained under retention policy rather than deleted'],
        future: ['Formal state machine guards with transition audit reasons'],
      }),
    ],
    edges: [
      { source: 'org-entity', target: 'workspace', label: 'claims' },
      { source: 'org-entity', target: 'identifiers', label: 'asserts' },
      { source: 'workspace', target: 'users', label: 'grants access' },
      { source: 'org-entity', target: 'lifecycle-org' },
    ],
  },
  {
    id: 'relationship',
    title: 'Relationship architecture',
    description:
      'Relationships are first-class. The same organization is a supplier here, a customer there, and an employer of people — simultaneously.',
    nodes: [
      node('rel-core', 'Relationship record', 'store', 0, 0, {
        purpose: 'Source, target, type, dates, risk, policy, verification status, monitoring, permissions.',
        data: ['relationships'],
        events: ['RelationshipCreated', 'RelationshipStateChanged'],
        apis: ['POST /v1/relationships', 'GET /v1/relationships/{id}'],
        security: ['Owned by the source workspace'],
        future: ['Bidirectional acknowledgement by the counterparty'],
      }),
      node('invitation', 'Invitation', 'service', 260, 0, {
        purpose: 'Brings a counterparty into the network and starts the member lifecycle.',
        data: ['invitations'],
        events: ['InvitationCreated', 'InvitationSent', 'InvitationAccepted'],
        apis: ['POST /v1/invitations'],
        security: ['Single-use token, expiry, revocable'],
        future: ['Bulk import with de-duplication against existing identities'],
      }),
      node('rel-lifecycle', 'Relationship lifecycle', 'concept', 520, 0, {
        purpose: 'DISCOVERED → INVITED → VERIFICATION → ASSESSMENT → PENDING APPROVAL → ACTIVE → MONITORED → SUSPENDED → TERMINATED → ARCHIVED.',
        future: ['Automatic suspension on critical monitoring signals'],
      }),
      node('authorization', 'Authorization', 'service', 130, 160, {
        purpose: 'One organization granting another permission to operate — distinct from a person’s consent.',
        data: ['authorizations'],
        events: ['AuthorizationGranted', 'AuthorizationRevoked'],
        apis: ['POST /v1/authorizations'],
        security: ['Scoped, time-bounded, revocable; checked on every cross-org operation'],
        future: ['Delegated verification chains with depth limits'],
      }),
      node('graph', 'Network graph', 'service', 390, 160, {
        purpose: 'Projection of organizations, people, credentials and typed edges for exploration.',
        dependencies: ['Relationship record', 'Credential'],
        security: ['Tenant-scoped by default; platform-wide view is admin-only'],
        future: ['Concentration and single-point-of-failure analytics'],
      }),
    ],
    edges: [
      { source: 'invitation', target: 'rel-core', label: 'creates' },
      { source: 'rel-core', target: 'rel-lifecycle' },
      { source: 'rel-core', target: 'graph', label: 'projects into' },
      { source: 'authorization', target: 'rel-core', label: 'scopes' },
    ],
  },
  {
    id: 'trust-engine',
    title: 'Trust engine',
    description: 'How a request becomes a defensible statement: plan, execute, evidence, assess, decide, credential, monitor.',
    nodes: [
      node('request', 'Verification request', 'service', 0, 0, {
        purpose: 'Binds a subject, a relationship and a policy version into one unit of work.',
        data: ['verification_requests'],
        events: ['VerificationRequested'],
        security: ['Entitlement-gated: only requesters may create one'],
        future: ['Requested-by-subject (self-verification) flows'],
      }),
      node('plan', 'Verification plan', 'concept', 240, 0, {
        purpose: 'Compiled, immutable list of checks with requirements, validity and cost.',
        inputs: ['Policy version'],
        outputs: ['Planned checks'],
        future: ['Cost/SLA optimization at plan time'],
      }),
      node('consent-gate', 'Consent gate', 'service', 480, 0, {
        purpose: 'Blocks person-subject checks until an in-scope consent is recorded.',
        data: ['consents'],
        events: ['ConsentRequested', 'ConsentGranted', 'ConsentRevoked'],
        security: ['Purpose, scope, version, expiry and revocation all recorded'],
        future: ['Consent receipts exportable to the subject'],
      }),
      node('exec', 'Check execution', 'service', 720, 0, {
        purpose: 'Runs each check through the provider router and normalizes the response.',
        data: ['verification_checks', 'provider_transactions'],
        events: ['VerificationCheckCompleted'],
        future: ['Concurrent execution with partial-result assessment'],
      }),
      node('evidence-store', 'Evidence store', 'store', 120, 170, {
        purpose: 'Immutable provenance records with classification and freshness.',
        data: ['evidence'],
        security: ['Redaction applied on read according to viewer clearance'],
        future: ['Object-storage attachments with signed URLs'],
      }),
      node('assess', 'Assessment service', 'service', 360, 170, {
        purpose: 'Weighted, explainable verdict per category with gaps stated explicitly.',
        data: ['risk_assessments'],
        events: ['AssessmentCreated'],
        future: ['Configurable weighting per requester'],
      }),
      node('decision', 'Decision', 'service', 600, 170, {
        purpose: 'The requester accepts, accepts with conditions, or rejects. BID never decides.',
        security: ['Dual-control supported for critical policies'],
        future: ['Approval delegation and escalation rules'],
      }),
      node('credential-svc', 'Credential service', 'service', 840, 170, {
        purpose: 'Issues, expires and revokes credentials on approval.',
        events: ['CredentialIssued', 'CredentialRevoked'],
        future: ['Signed, independently verifiable credentials'],
      }),
    ],
    edges: [
      { source: 'request', target: 'plan' },
      { source: 'plan', target: 'consent-gate' },
      { source: 'consent-gate', target: 'exec' },
      { source: 'exec', target: 'evidence-store' },
      { source: 'evidence-store', target: 'assess' },
      { source: 'assess', target: 'decision' },
      { source: 'decision', target: 'credential-svc' },
    ],
  },
  {
    id: 'provider',
    title: 'Provider architecture',
    description:
      'BID is provider-neutral. Core logic depends on capability interfaces, never on a vendor. Adding a real provider means writing one adapter.',
    nodes: [
      node('router', 'Provider router', 'service', 240, 0, {
        purpose: 'Selects a provider per check and falls back when one is unavailable.',
        inputs: ['Check definition', 'Country', 'Strategy'],
        outputs: ['Routing decision', 'Normalized response'],
        security: ['Routing decisions and fallbacks are written to the audit trail'],
        future: ['Cost, SLA, coverage and quality-weighted routing in production'],
      }),
      node('iface', 'Capability interfaces', 'concept', 0, 0, {
        purpose: 'IIdentityProvider, IKYBProvider, IBGVProvider, IBankVerificationProvider, IEducationProvider, IEmploymentProvider, IDocumentProvider, IRiskProvider.',
        security: ['Business logic never imports a concrete provider'],
        future: ['Adapter conformance test suite'],
      }),
      node('mock-a', 'Mock Provider A', 'external', 0, 170, {
        purpose: 'KYB and business identity coverage — fast, low cost, default identity route.',
        future: ['Replace with a real KYB vendor adapter'],
      }),
      node('mock-b', 'Mock Provider B', 'external', 240, 170, {
        purpose: 'Risk and screening specialist — sanctions, adverse media, litigation.',
        future: ['Replace with a real screening vendor adapter'],
      }),
      node('mock-c', 'Mock Provider C', 'external', 480, 170, {
        purpose: 'People verification — identity, education, employment, permitted database screening.',
        future: ['Replace with a real BGV vendor adapter'],
      }),
      node('tx', 'Provider transactions', 'store', 480, 0, {
        purpose: 'Every provider call recorded with latency, cost, outcome, reference and fallback origin.',
        data: ['provider_transactions'],
        security: ['Cost data is workspace-scoped; provider references retained for dispute resolution'],
        future: ['Provider scorecards and automatic demotion on quality drift'],
      }),
    ],
    edges: [
      { source: 'iface', target: 'router', label: 'implemented by' },
      { source: 'router', target: 'mock-a' },
      { source: 'router', target: 'mock-b' },
      { source: 'router', target: 'mock-c' },
      { source: 'router', target: 'tx', label: 'records' },
    ],
  },
  {
    id: 'data',
    title: 'Data architecture',
    description:
      'Thirty-plus tables grouped by bounded context. In-memory today, PostgreSQL-shaped throughout — see prisma/schema.prisma.',
    nodes: [
      node('identity-data', 'Identity', 'store', 0, 0, {
        purpose: 'organizations · persons · users · workspaces · workspace_memberships · organization_identifiers · bid_ids',
        security: ['Identifiers masked/encrypted; person records restricted'],
        future: ['Partitioning by tenant for very large deployments'],
      }),
      node('rel-data', 'Relationship', 'store', 240, 0, {
        purpose: 'relationships · relationship_roles · invitations · authorizations',
        future: ['Temporal tables for point-in-time relationship reconstruction'],
      }),
      node('policy-data', 'Policy', 'store', 480, 0, {
        purpose: 'policies · policy_versions',
        security: ['Sealed versions are append-only'],
        future: ['Policy diffing and impact analysis'],
      }),
      node('verif-data', 'Verification', 'store', 0, 150, {
        purpose: 'verification_requests · verification_checks · verification_results · evidence · risk_assessments · credentials · consents',
        security: ['Evidence carries a visibility classification per row'],
        future: ['Cold storage tiering for expired evidence'],
      }),
      node('ops-data', 'Operations', 'store', 240, 150, {
        purpose: 'campaigns · campaign_members · monitoring_rules · monitoring_events · notifications · support_cases',
        future: ['Queue-backed campaign execution'],
      }),
      node('commerce-data', 'Commerce', 'store', 480, 150, {
        purpose: 'plans · subscriptions · usage · credits · invoices · payments · customer_lifecycle',
        future: ['Revenue recognition exports'],
      }),
      node('platform-data', 'Platform', 'store', 240, 300, {
        purpose: 'providers · provider_transactions · audit_logs · api_keys · webhooks',
        security: ['Audit log is hash-chained and append-only'],
        future: ['WORM storage for audit retention'],
      }),
    ],
    edges: [
      { source: 'identity-data', target: 'rel-data' },
      { source: 'rel-data', target: 'policy-data' },
      { source: 'policy-data', target: 'verif-data' },
      { source: 'verif-data', target: 'ops-data' },
      { source: 'ops-data', target: 'commerce-data' },
      { source: 'verif-data', target: 'platform-data' },
    ],
  },
  {
    id: 'security',
    title: 'Security architecture',
    description:
      'Being in the same network is never a reason to see someone’s data. Authorization is checked on every operation, and every field carries a classification.',
    nodes: [
      node('authn', 'Authentication', 'service', 0, 0, {
        purpose: 'Session and API-key authentication; MFA; OIDC/OAuth-ready for enterprise SSO.',
        security: ['Secrets never stored in plaintext', 'API keys hashed, shown once'],
        future: ['SSO enforcement per workspace', 'Passkeys'],
      }),
      node('rbac', 'RBAC + ABAC', 'service', 240, 0, {
        purpose: 'Role grants intersected with attribute rules: tenant, relationship, entitlement.',
        security: ['Denials distinguish “your role cannot” from “your plan does not include”'],
        future: ['Custom roles per workspace'],
      }),
      node('tenant', 'Tenant isolation', 'service', 480, 0, {
        purpose: 'Every record carries workspace_id; cross-tenant reads are rejected at the service layer.',
        security: ['Search runs through the same guard, so results cannot leak'],
        future: ['Row-level security in PostgreSQL as defence in depth'],
      }),
      node('classification', 'Data classification', 'concept', 0, 160, {
        purpose: 'PUBLIC · ORGANIZATION_ONLY · RELATIONSHIP_ONLY · AUTHORIZED_ONLY · SENSITIVE · RESTRICTED.',
        security: ['Public projections are built from classification, not hand-picked fields'],
        future: ['Automatic classification linting in CI'],
      }),
      node('consent-sec', 'Consent & authorization', 'service', 240, 160, {
        purpose: 'Two separate, revocable objects with independent lifecycles.',
        security: ['Person checks cannot execute without in-scope consent'],
        future: ['Subject-facing consent dashboard'],
      }),
      node('audit', 'Audit & integrity', 'service', 480, 160, {
        purpose: 'Hash-chained audit entries; evidence payload hashes; provider references retained.',
        security: ['Tamper-evident by construction'],
        future: ['SHA-256 with signing key, WORM retention, external anchoring'],
      }),
    ],
    edges: [
      { source: 'authn', target: 'rbac' },
      { source: 'rbac', target: 'tenant' },
      { source: 'tenant', target: 'classification' },
      { source: 'classification', target: 'consent-sec' },
      { source: 'consent-sec', target: 'audit' },
    ],
  },
  {
    id: 'customer-lifecycle',
    title: 'Customer lifecycle',
    description:
      'Four lifecycles run in parallel and must never be collapsed: organization identity, customer commerce, relationship, and verification.',
    nodes: [
      node('unknown', 'Unknown → Invited', 'concept', 0, 0, {
        purpose: 'An organization exists in the network as a discovered identity, then receives an invitation.',
        events: ['OrganizationCreated', 'InvitationCreated'],
      }),
      node('member-state', 'Registered → BID Member', 'concept', 240, 0, {
        purpose: 'The organization claims its identity and gets a private workspace. Free.',
        events: ['OrganizationClaimed'],
      }),
      node('verified-state', 'Verified member', 'concept', 480, 0, {
        purpose: 'A counterparty has approved a verification and a credential has been issued.',
        events: ['OrganizationVerified', 'CredentialIssued'],
      }),
      node('discovery-state', 'Discovery → Requester activation', 'concept', 0, 160, {
        purpose: 'The verified member decides to verify its own network.',
        events: ['CustomerLifecycleChanged'],
      }),
      node('paid-state', 'First verification → Paid customer', 'concept', 240, 160, {
        purpose: 'A plan is selected, entitlements switch on, and metered usage begins.',
        events: ['SubscriptionCreated', 'VerificationCompleted'],
      }),
      node('expansion-state', 'Active → Expanding → Enterprise', 'concept', 480, 160, {
        purpose: 'More users, more policies, more monitored entities, API adoption.',
        future: ['Automated expansion playbooks'],
      }),
      node('negative-state', 'Low usage → At risk → Dormant → Churned → Win-back', 'concept', 240, 310, {
        purpose: 'Health scoring from login, verification volume, API usage, monitoring and support signals.',
        events: ['CustomerAtRisk', 'CustomerChurned'],
        future: ['Predictive churn scoring on usage trend'],
      }),
    ],
    edges: [
      { source: 'unknown', target: 'member-state' },
      { source: 'member-state', target: 'verified-state' },
      { source: 'verified-state', target: 'discovery-state' },
      { source: 'discovery-state', target: 'paid-state' },
      { source: 'paid-state', target: 'expansion-state' },
      { source: 'expansion-state', target: 'negative-state', label: 'health decay' },
      { source: 'negative-state', target: 'paid-state', label: 'win-back' },
    ],
  },
  {
    id: 'revenue',
    title: 'Revenue architecture',
    description: 'Plans define entitlements; entitlements gate capabilities; usage meters consumption. Pricing is configuration.',
    nodes: [
      node('plans', 'Plans & entitlements', 'store', 0, 0, {
        purpose: 'Member (free), Starter, Growth, Business, Enterprise — each an entitlement bundle.',
        data: ['plans'],
        security: ['Authorization reads entitlements, not plan names'],
        future: ['Per-customer custom entitlement overrides'],
      }),
      node('subscription', 'Subscription', 'store', 240, 0, {
        purpose: 'Binds a workspace to a plan, with seats and monitored entity counts.',
        data: ['subscriptions'],
        events: ['SubscriptionCreated', 'SubscriptionChanged'],
      }),
      node('metering', 'Usage metering', 'service', 480, 0, {
        purpose: 'Consumes verification events and writes usage records — the verification engine knows nothing about pricing.',
        data: ['usage', 'credits'],
        events: ['UsageRecorded'],
        future: ['Real-time budget alerts and hard caps'],
      }),
      node('invoicing', 'Invoicing & payments', 'service', 120, 160, {
        purpose: 'Period invoices with subscription, overage and monitoring lines; payments recorded against them.',
        data: ['invoices', 'payments'],
        events: ['InvoiceIssued', 'PaymentReceived'],
        future: ['Payment gateway integration and dunning'],
      }),
      node('analytics-rev', 'Revenue analytics', 'service', 360, 160, {
        purpose: 'MRR, ARR, stream mix, ARPC, expansion, churn and net revenue retention.',
        future: ['Cohort retention and provider-cost margin analysis'],
      }),
    ],
    edges: [
      { source: 'plans', target: 'subscription' },
      { source: 'subscription', target: 'metering' },
      { source: 'metering', target: 'invoicing' },
      { source: 'invoicing', target: 'analytics-rev' },
    ],
  },
  {
    id: 'api',
    title: 'API architecture',
    description: 'Every product capability is a REST resource, authenticated by scoped API keys, with webhooks for the reverse direction.',
    nodes: [
      node('rest', 'REST API', 'service', 0, 0, {
        purpose: 'Versioned resources under /v1 with typed contracts shared between server and client.',
        apis: [
          'POST /v1/organizations',
          'POST /v1/invitations',
          'POST /v1/relationships',
          'POST /v1/policies',
          'POST /v1/verification-requests',
          'POST /v1/campaigns',
          'POST /v1/bgv/requests',
          'POST /v1/consents',
          'POST /v1/authorizations',
          'GET /v1/credentials',
          'POST /v1/monitoring',
        ],
        security: ['Scoped keys, per-key rate limits, tenant guard on every route'],
        future: ['OpenAPI publication and SDK generation'],
      }),
      node('keys', 'API keys & scopes', 'store', 260, 0, {
        purpose: 'Hashed secrets, prefixes, scopes and last-used tracking.',
        data: ['api_keys'],
        security: ['Secret shown once at creation'],
        future: ['Key rotation policy and IP allowlists'],
      }),
      node('webhooks', 'Webhooks', 'service', 520, 0, {
        purpose: 'Domain events delivered to customer systems with signed payloads.',
        data: ['webhooks'],
        events: ['VerificationCompleted', 'MonitoringAlertCreated', 'CredentialIssued'],
        future: ['Delivery retries with exponential backoff and a replay endpoint'],
      }),
      node('integrations', 'Enterprise integrations', 'external', 260, 160, {
        purpose: 'HRMS, ATS, ERP and procurement systems consuming the same API surface.',
        future: ['Prebuilt connectors for common procurement suites'],
      }),
    ],
    edges: [
      { source: 'keys', target: 'rest', label: 'authenticates' },
      { source: 'rest', target: 'webhooks', label: 'publishes' },
      { source: 'rest', target: 'integrations' },
      { source: 'webhooks', target: 'integrations' },
    ],
  },
  {
    id: 'network',
    title: 'Network architecture',
    description: 'The deployment shape: cloud-neutral services behind an API gateway, with queues, storage and search as abstractions.',
    nodes: [
      node('web', 'Web application', 'client', 0, 0, {
        purpose: 'React + TypeScript + Vite. Consumes the same domain package as the API.',
        future: ['Server-rendered public profiles for indexability'],
      }),
      node('gateway', 'API gateway', 'service', 240, 0, {
        purpose: 'TLS termination, rate limiting, authentication, request routing.',
        security: ['Per-key and per-tenant rate limits'],
        future: ['Regional routing for data residency'],
      }),
      node('core-svc', 'Domain services', 'service', 480, 0, {
        purpose: 'Organization, relationship, policy, verification, campaign, monitoring, billing, lifecycle.',
        future: ['Extraction into separately deployable services where load demands'],
      }),
      node('queue', 'Queue / workers', 'service', 0, 160, {
        purpose: 'Long-running check execution, campaign fan-out, monitoring sweeps, webhook delivery.',
        future: ['BullMQ or SQS behind the same interface'],
      }),
      node('db', 'PostgreSQL', 'store', 240, 160, {
        purpose: 'Primary store for all bounded contexts.',
        future: ['Read replicas; row-level security'],
      }),
      node('cache', 'Cache & search', 'store', 480, 160, {
        purpose: 'Redis-ready cache; OpenSearch-ready index for global search.',
        future: ['Search index kept current from the event bus'],
      }),
      node('objects', 'Object storage', 'store', 240, 310, {
        purpose: 'S3-compatible abstraction for documents and evidence attachments.',
        security: ['Signed, short-lived URLs; encryption at rest'],
        future: ['Customer-managed keys'],
      }),
    ],
    edges: [
      { source: 'web', target: 'gateway' },
      { source: 'gateway', target: 'core-svc' },
      { source: 'core-svc', target: 'db' },
      { source: 'core-svc', target: 'queue' },
      { source: 'core-svc', target: 'cache' },
      { source: 'queue', target: 'objects' },
    ],
  },
];

export function findArchView(id: string): ArchView | undefined {
  return ARCHITECTURE_VIEWS.find((view) => view.id === id);
}
