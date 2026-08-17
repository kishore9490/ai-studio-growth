import type {
  AlertStatus,
  AssessmentBand,
  Attribution,
  AuthorizationStatus,
  CampaignStatus,
  CheckCategory,
  CheckStatus,
  CommercialState,
  ConsentStatus,
  CredentialStatus,
  CustomerLifecycle,
  Decision,
  Freshness,
  Industry,
  InvitationStatus,
  InvoiceStatus,
  MonitoringFrequency,
  MonitoringSeverity,
  NotificationChannel,
  OrganizationLifecycle,
  PlanTier,
  PlatformRole,
  ProviderCapability,
  RelationshipLifecycle,
  RelationshipType,
  RiskLevel,
  SubjectType,
  SubscriptionStatus,
  VerificationLifecycle,
  Visibility,
  WorkspaceRole,
} from './enums.js';

/* ------------------------------------------------------------------ */
/* Identity                                                            */
/* ------------------------------------------------------------------ */

/**
 * An organization is the primary entity of the platform (ADR-001).
 * It is never intrinsically a "vendor" or a "customer" — those are
 * relationship- and commerce-scoped facts.
 */
export interface Organization {
  id: string;
  bidId: string;
  legalName: string;
  displayName: string;
  /** Short public description, company-provided. */
  description?: string;
  website?: string;
  logoText: string;
  logoColor: string;
  industry: Industry;
  country: string;
  city?: string;
  registeredAddress?: string;
  employeeBand?: string;
  incorporationYear?: number;
  lifecycle: OrganizationLifecycle;
  commercialState: CommercialState;
  /** The workspace this organization operates from, if it has claimed one. */
  primaryWorkspaceId?: string;
  claimedAt?: string;
  createdAt: string;
  updatedAt: string;
  /** Organization that introduced this org to the network (flywheel edge). */
  introducedByOrgId?: string;
  tags: string[];
}

/** Government-issued or registry identifiers the organization asserts. */
export interface OrganizationIdentifier {
  id: string;
  organizationId: string;
  kind: 'GSTIN' | 'PAN' | 'CIN' | 'UDYAM' | 'IEC' | 'LEI' | 'OTHER';
  /** Stored masked in this demo build; production stores encrypted at rest. */
  value: string;
  attribution: Attribution;
  visibility: Visibility;
  verifiedAt?: string;
  createdAt: string;
}

export interface Person {
  id: string;
  bidId: string;
  fullName: string;
  /** Personal identifiers are never public. */
  emailMasked: string;
  phoneMasked: string;
  city?: string;
  country: string;
  createdAt: string;
  updatedAt: string;
}

/** A login identity. A user belongs to one or more workspaces. */
export interface User {
  id: string;
  name: string;
  email: string;
  personId?: string;
  platformRoles: PlatformRole[];
  mfaEnabled: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

/**
 * Tenant boundary. An organization identity is global; a workspace is the
 * private tenant in which that organization does its own work (ADR-011).
 */
export interface Workspace {
  id: string;
  tenantId: string;
  organizationId: string;
  name: string;
  createdAt: string;
  /** Whether this workspace may initiate verification (requester capability). */
  requesterEnabled: boolean;
}

export interface WorkspaceMembership {
  id: string;
  workspaceId: string;
  userId: string;
  roles: WorkspaceRole[];
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Relationships                                                       */
/* ------------------------------------------------------------------ */

export interface Relationship {
  id: string;
  bidId: string;
  /** Workspace that owns this relationship record (tenant boundary). */
  workspaceId: string;
  sourceOrganizationId: string;
  targetType: SubjectType;
  targetOrganizationId?: string;
  targetPersonId?: string;
  type: RelationshipType;
  label?: string;
  startDate?: string;
  endDate?: string;
  lifecycle: RelationshipLifecycle;
  riskLevel: RiskLevel;
  policyId?: string;
  latestVerificationId?: string;
  verificationStatus: VerificationLifecycle | 'NONE';
  contractReference?: string;
  monitoringEnabled: boolean;
  criticality?: 'ROUTINE' | 'IMPORTANT' | 'CRITICAL';
  createdAt: string;
  updatedAt: string;
}

export interface Invitation {
  id: string;
  workspaceId: string;
  /** Organization sending the invitation. */
  fromOrganizationId: string;
  toOrganizationName: string;
  toOrganizationId?: string;
  toEmail: string;
  relationshipType: RelationshipType;
  policyId: string;
  campaignId?: string;
  status: InvitationStatus;
  token: string;
  message?: string;
  createdAt: string;
  sentAt?: string;
  acceptedAt?: string;
  expiresAt: string;
}

/* ------------------------------------------------------------------ */
/* Policy engine                                                       */
/* ------------------------------------------------------------------ */

export interface PolicyCheckRequirement {
  checkCode: string;
  required: boolean;
  /** Blocks the overall decision when it fails. */
  blocking: boolean;
  /** Overrides the catalog default validity window. */
  validityDays?: number;
  notes?: string;
}

export interface PolicyDocumentRequirement {
  code: string;
  label: string;
  required: boolean;
  visibility: Visibility;
}

export interface PolicyThresholds {
  /** Minimum assessment score (0-100) for automatic approval. */
  autoApproveScore: number;
  /** Below this, the assessment is treated as an exception. */
  reviewScore: number;
  /** Blocking check failures tolerated before rejection. */
  maxBlockingFailures: number;
}

export interface Policy {
  id: string;
  bidId: string;
  /** Null workspaceId ⇒ BID-published template available to all tenants. */
  workspaceId?: string;
  name: string;
  description: string;
  subjectType: SubjectType;
  relationshipType: RelationshipType;
  industry: Industry;
  riskLevel: RiskLevel;
  currentVersion: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  system: boolean;
}

/**
 * Immutable snapshot of a policy. Once a version has been used to reach a
 * completed verification decision it can never be edited (ADR-004, Section 9).
 */
export interface PolicyVersion {
  id: string;
  policyId: string;
  version: number;
  requiredChecks: PolicyCheckRequirement[];
  optionalChecks: PolicyCheckRequirement[];
  documents: PolicyDocumentRequirement[];
  thresholds: PolicyThresholds;
  /** Days after completion before the verification is considered expired. */
  validityDays: number;
  reverificationDays: number;
  monitoringFrequency: MonitoringFrequency;
  approvalRule: 'AUTO' | 'MANUAL' | 'DUAL_CONTROL';
  requiresConsent: boolean;
  notes?: string;
  createdAt: string;
  /** Set once the version has been used for a completed decision. */
  sealedAt?: string;
}

/** Catalog entry describing one atomic check BID can orchestrate. */
export interface CheckDefinition {
  code: string;
  label: string;
  category: CheckCategory;
  subjectType: SubjectType;
  capability: ProviderCapability;
  /** Human description of what is actually checked. */
  description: string;
  /** What the result is derived from — shown verbatim in evidence. */
  sourceLabel: string;
  method: 'API' | 'DOCUMENT' | 'DATABASE' | 'MANUAL_REVIEW';
  requiresConsent: boolean;
  requiresDocument: boolean;
  defaultValidityDays: number;
  /** Illustrative unit cost in paise; real cost is provider-dependent. */
  unitCostPaise: number;
  slaHours: number;
  evidenceVisibility: Visibility;
  /** Whether a passing result may appear on the public profile. */
  publicSummaryAllowed: boolean;
}

/* ------------------------------------------------------------------ */
/* Verification                                                        */
/* ------------------------------------------------------------------ */

export interface VerificationRequest {
  id: string;
  bidId: string;
  /** Workspace of the requester — the tenant that owns the private results. */
  workspaceId: string;
  requesterOrganizationId: string;
  subjectType: SubjectType;
  subjectOrganizationId?: string;
  subjectPersonId?: string;
  /** Name captured at request time, before the subject registers. */
  subjectName: string;
  relationshipId?: string;
  relationshipType: RelationshipType;
  campaignId?: string;
  policyId: string;
  policyVersion: number;
  status: VerificationLifecycle;
  consentId?: string;
  authorizationId?: string;
  decision: Decision;
  decisionBy?: string;
  decisionAt?: string;
  decisionNote?: string;
  assessmentId?: string;
  credentialId?: string;
  slaDueAt: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  expiresAt?: string;
  /** Rolled-up cost of provider transactions, in paise. */
  costPaise: number;
}

export interface VerificationCheck {
  id: string;
  verificationRequestId: string;
  checkCode: string;
  category: CheckCategory;
  required: boolean;
  blocking: boolean;
  status: CheckStatus;
  providerId?: string;
  providerTransactionId?: string;
  resultId?: string;
  startedAt?: string;
  completedAt?: string;
  attempts: number;
  costPaise: number;
}

export interface VerificationResult {
  id: string;
  verificationRequestId: string;
  checkId: string;
  checkCode: string;
  outcome: 'PASS' | 'ATTENTION' | 'FAIL' | 'UNAVAILABLE';
  /** 0-1 provider-reported confidence. */
  confidence: number;
  summary: string;
  /** Normalized, provider-agnostic fields. */
  normalized: Record<string, string | number | boolean>;
  evidenceId: string;
  createdAt: string;
}

/**
 * Structured provenance for a single check (Section 13).
 * Answers: WHAT / WHO / SOURCE / WHEN / METHOD / RESULT / SCOPE / FRESHNESS.
 */
export interface Evidence {
  id: string;
  verificationRequestId: string;
  checkId: string;
  checkCode: string;
  subjectType: SubjectType;
  subjectRef: string;
  what: string;
  source: string;
  attribution: Attribution;
  providerId: string;
  providerName: string;
  method: CheckDefinition['method'];
  checkedAt: string;
  result: string;
  confidence: number;
  scope: string;
  reference: string;
  /** Hash over the normalized payload — integrity anchor. */
  payloadHash: string;
  expiresAt: string;
  freshness: Freshness;
  policyId: string;
  policyVersion: number;
  visibility: Visibility;
  auditLogId: string;
  createdAt: string;
}

export interface AssessmentCategoryResult {
  category: CheckCategory;
  verdict: 'VERIFIED' | 'CLEAR' | 'PARTIAL' | 'ATTENTION' | 'NOT_VERIFIED' | 'NOT_APPLICABLE';
  passed: number;
  total: number;
  weight: number;
  contribution: number;
  notes: string;
}

export interface Assessment {
  id: string;
  verificationRequestId: string;
  band: AssessmentBand;
  /** Explainable score — never presented as the only output (Section 14). */
  score: number;
  categories: AssessmentCategoryResult[];
  missingChecks: string[];
  failedChecks: string[];
  attentionChecks: string[];
  freshness: Freshness;
  policyId: string;
  policyVersion: number;
  /** Plain-language statement bounded by the evidence actually collected. */
  explanation: string;
  disclaimer: string;
  createdAt: string;
  expiresAt: string;
}

export interface Credential {
  id: string;
  bidId: string;
  subjectType: SubjectType;
  subjectOrganizationId?: string;
  subjectPersonId?: string;
  verificationRequestId: string;
  policyId: string;
  policyVersion: number;
  title: string;
  /** Attribute summaries safe for the digital card / public profile. */
  publicAttributes: { label: string; state: 'VERIFIED' | 'ATTENTION' | 'NOT_VERIFIED'; attribution: Attribution }[];
  issuedByOrganizationId?: string;
  status: CredentialStatus;
  issuedAt: string;
  expiresAt: string;
  revokedAt?: string;
  revocationReason?: string;
}

/* ------------------------------------------------------------------ */
/* Consent & authorization (deliberately separate — ADR-007)           */
/* ------------------------------------------------------------------ */

export interface Consent {
  id: string;
  subjectType: SubjectType;
  subjectRef: string;
  subjectName: string;
  purpose: string;
  scope: string[];
  version: string;
  status: ConsentStatus;
  requestedByOrganizationId: string;
  requestedAt: string;
  grantedAt?: string;
  revokedAt?: string;
  expiresAt: string;
  evidenceReference?: string;
}

export interface Authorization {
  id: string;
  grantorOrganizationId: string;
  granteeOrganizationId: string;
  operation:
    | 'RUN_VERIFICATION'
    | 'VIEW_VERIFICATION_RESULT'
    | 'RUN_BGV_ON_BEHALF'
    | 'VIEW_RELATIONSHIP'
    | 'MANAGE_MONITORING';
  scope: string[];
  relationshipId?: string;
  status: AuthorizationStatus;
  startAt: string;
  endAt: string;
  createdAt: string;
  revokedAt?: string;
}

/* ------------------------------------------------------------------ */
/* Campaigns                                                           */
/* ------------------------------------------------------------------ */

export interface Campaign {
  id: string;
  bidId: string;
  workspaceId: string;
  requesterOrganizationId: string;
  name: string;
  policyId: string;
  relationshipType: RelationshipType;
  status: CampaignStatus;
  slaDays: number;
  createdAt: string;
  completedAt?: string;
}

export interface CampaignMember {
  id: string;
  campaignId: string;
  targetName: string;
  targetEmail: string;
  targetOrganizationId?: string;
  invitationId?: string;
  verificationRequestId?: string;
  state: 'PENDING_INVITE' | 'INVITED' | 'REGISTERED' | 'IN_PROGRESS' | 'COMPLETED' | 'EXCEPTION';
  createdAt: string;
}

/* ------------------------------------------------------------------ */
/* Monitoring                                                          */
/* ------------------------------------------------------------------ */

export interface MonitoringRule {
  id: string;
  workspaceId: string;
  subjectType: SubjectType;
  subjectRef: string;
  relationshipId?: string;
  signals: string[];
  frequency: MonitoringFrequency;
  active: boolean;
  createdAt: string;
  lastRunAt?: string;
}

export interface MonitoringEvent {
  id: string;
  ruleId?: string;
  workspaceId: string;
  subjectType: SubjectType;
  subjectRef: string;
  subjectName: string;
  signal: string;
  severity: MonitoringSeverity;
  title: string;
  detail: string;
  /** Mock signal source — BID does not claim access to every event stream. */
  source: string;
  status: AlertStatus;
  detectedAt: string;
  resolvedAt?: string;
  relationshipId?: string;
  recommendedAction: string;
}

/* ------------------------------------------------------------------ */
/* Providers                                                           */
/* ------------------------------------------------------------------ */

export interface ProviderRecord {
  id: string;
  name: string;
  capabilities: ProviderCapability[];
  countries: string[];
  /** Illustrative cost multiplier applied to catalog unit cost. */
  costMultiplier: number;
  slaHours: number;
  qualityScore: number;
  priority: number;
  enabled: boolean;
  description: string;
}

export interface ProviderTransaction {
  id: string;
  providerId: string;
  verificationRequestId: string;
  checkId: string;
  checkCode: string;
  requestedAt: string;
  completedAt: string;
  latencyMs: number;
  outcome: 'PASS' | 'ATTENTION' | 'FAIL' | 'UNAVAILABLE';
  costPaise: number;
  reference: string;
  fallbackFrom?: string;
}

/* ------------------------------------------------------------------ */
/* Billing                                                             */
/* ------------------------------------------------------------------ */

export interface Entitlements {
  canInitiateVerification: boolean;
  canCreateCampaigns: boolean;
  canCreatePolicies: boolean;
  canRunBgv: boolean;
  canUseMonitoring: boolean;
  canUseApi: boolean;
  canUseWebhooks: boolean;
  canUseEnterpriseIntegrations: boolean;
  maxSeats: number;
  maxMonitoredEntities: number;
  includedChecksPerMonth: number;
}

export interface Plan {
  id: string;
  tier: PlanTier;
  name: string;
  /** Illustrative monthly price in paise; configurable from admin console. */
  monthlyPricePaise: number;
  includedChecks: number;
  overagePerCheckPaise: number;
  entitlements: Entitlements;
  description: string;
  highlights: string[];
  /** Enterprise tiers are quote-based. */
  quoteOnly: boolean;
  active: boolean;
}

export interface Subscription {
  id: string;
  workspaceId: string;
  organizationId: string;
  planId: string;
  status: SubscriptionStatus;
  startedAt: string;
  renewsAt: string;
  cancelledAt?: string;
  seats: number;
  monitoredEntities: number;
}

export interface UsageRecord {
  id: string;
  workspaceId: string;
  period: string; // YYYY-MM
  metric: 'CHECK' | 'MONITORING' | 'API_CALL' | 'BGV' | 'REVERIFICATION' | 'ENHANCED_DD';
  quantity: number;
  amountPaise: number;
  reference?: string;
  createdAt: string;
}

export interface CreditWallet {
  id: string;
  workspaceId: string;
  balance: number;
  updatedAt: string;
}

export interface CreditLedgerEntry {
  id: string;
  walletId: string;
  delta: number;
  reason: string;
  reference?: string;
  createdAt: string;
}

export interface Invoice {
  id: string;
  workspaceId: string;
  organizationId: string;
  number: string;
  period: string;
  status: InvoiceStatus;
  lines: { label: string; quantity: number; unitPricePaise: number; amountPaise: number }[];
  subtotalPaise: number;
  taxPaise: number;
  totalPaise: number;
  issuedAt: string;
  dueAt: string;
  paidAt?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  workspaceId: string;
  amountPaise: number;
  method: 'CARD' | 'NEFT' | 'UPI' | 'INVOICE';
  reference: string;
  receivedAt: string;
}

/* ------------------------------------------------------------------ */
/* Customer success & platform ops                                     */
/* ------------------------------------------------------------------ */

export interface CustomerLifecycleRecord {
  id: string;
  organizationId: string;
  workspaceId?: string;
  state: CustomerLifecycle;
  enteredAt: string;
  history: { state: CustomerLifecycle; at: string; note?: string }[];
  healthScore: number;
  signals: {
    lastLoginAt?: string;
    verificationsLast30d: number;
    apiCallsLast30d: number;
    monitoredEntities: number;
    creditsUsedLast30d: number;
    policiesCreated: number;
    openSupportCases: number;
    featureAdoption: string[];
  };
  ownerName: string;
  notes?: string;
}

export interface SupportCase {
  id: string;
  organizationId: string;
  subject: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'PENDING' | 'RESOLVED';
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  workspaceId?: string;
  organizationId?: string;
  channel: NotificationChannel;
  kind: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: string;
  link?: string;
  severity: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
}

export interface AuditLogEntry {
  id: string;
  at: string;
  actorType: 'USER' | 'SYSTEM' | 'PROVIDER' | 'API_CLIENT';
  actorId: string;
  actorName: string;
  workspaceId?: string;
  organizationId?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  summary: string;
  metadata: Record<string, string | number | boolean>;
  /** Chained hash of the previous entry — tamper-evident audit trail. */
  hash: string;
  previousHash: string;
}

export interface ApiKeyRecord {
  id: string;
  workspaceId: string;
  name: string;
  prefix: string;
  /** Only a hash is stored; the secret is shown once at creation. */
  hashedSecret: string;
  scopes: string[];
  createdAt: string;
  lastUsedAt?: string;
  revokedAt?: string;
}

export interface WebhookEndpoint {
  id: string;
  workspaceId: string;
  url: string;
  events: string[];
  active: boolean;
  createdAt: string;
  secretMasked: string;
}
