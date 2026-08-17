/**
 * Domain enumerations.
 *
 * Four lifecycles are deliberately kept separate and must never be collapsed
 * into one another (see ADR-001 / ADR-003):
 *   - OrganizationLifecycle : the identity of an organization in the network
 *   - CustomerLifecycle     : the commercial relationship between BID and an org
 *   - RelationshipLifecycle : one org's relationship with another party
 *   - VerificationLifecycle : a single verification instance
 */

/** Identity of an organization inside the BID network. */
export const ORGANIZATION_LIFECYCLE = [
  'DISCOVERED',
  'INVITED',
  'CLAIMED',
  'REGISTERED',
  'VERIFIED',
  'ACTIVE',
  'SUSPENDED',
  'ARCHIVED',
] as const;
export type OrganizationLifecycle = (typeof ORGANIZATION_LIFECYCLE)[number];

/**
 * Commercial state of an organization towards BID.
 * MEMBER !== CUSTOMER. This distinction is load-bearing across billing,
 * permissions, analytics and UI (Business Rule 1).
 */
export const COMMERCIAL_STATE = [
  'NON_MEMBER',
  'MEMBER',
  'VERIFIED_MEMBER',
  'REQUESTER',
  'CUSTOMER',
  'ENTERPRISE',
] as const;
export type CommercialState = (typeof COMMERCIAL_STATE)[number];

/** BID's own customer-success funnel state for an organization. */
export const CUSTOMER_LIFECYCLE = [
  'UNKNOWN',
  'INVITED',
  'REGISTERED',
  'BID_MEMBER',
  'VERIFICATION_IN_PROGRESS',
  'VERIFIED_MEMBER',
  'DISCOVERY',
  'REQUESTER_ACTIVATION',
  'FIRST_VERIFICATION',
  'PAID_CUSTOMER',
  'ACTIVE',
  'EXPANDING',
  'ENTERPRISE',
  'NETWORK_PARTICIPANT',
  // negative states
  'LOW_USAGE',
  'AT_RISK',
  'DORMANT',
  'CHURNED',
  'WIN_BACK',
] as const;
export type CustomerLifecycle = (typeof CUSTOMER_LIFECYCLE)[number];

export const NEGATIVE_CUSTOMER_STATES: CustomerLifecycle[] = [
  'LOW_USAGE',
  'AT_RISK',
  'DORMANT',
  'CHURNED',
  'WIN_BACK',
];

export const RELATIONSHIP_LIFECYCLE = [
  'DISCOVERED',
  'INVITED',
  'VERIFICATION',
  'ASSESSMENT',
  'PENDING_APPROVAL',
  'ACTIVE',
  'MONITORED',
  'SUSPENDED',
  'TERMINATED',
  'ARCHIVED',
] as const;
export type RelationshipLifecycle = (typeof RELATIONSHIP_LIFECYCLE)[number];

export const VERIFICATION_LIFECYCLE = [
  'REQUESTED',
  'INVITED',
  'ACCEPTED',
  'CONSENT_PENDING',
  'IN_PROGRESS',
  'CHECKS_RUNNING',
  'EVIDENCE_COLLECTED',
  'ASSESSMENT',
  'REVIEW',
  'COMPLETED',
  'CREDENTIAL_ISSUED',
  'MONITORING',
  // exception states
  'FAILED',
  'PARTIAL',
  'EXPIRED',
  'REQUIRES_REVIEW',
  'REVOKED',
] as const;
export type VerificationLifecycle = (typeof VERIFICATION_LIFECYCLE)[number];

export const VERIFICATION_EXCEPTION_STATES: VerificationLifecycle[] = [
  'FAILED',
  'PARTIAL',
  'EXPIRED',
  'REQUIRES_REVIEW',
  'REVOKED',
];

/**
 * Relationship types. An organization is never "a vendor" — it *has* a vendor
 * relationship with a specific counterparty (Business Rule 3).
 */
export const RELATIONSHIP_TYPE = [
  'VENDOR',
  'SUPPLIER',
  'CUSTOMER',
  'PARTNER',
  'CONTRACTOR',
  'CONSULTANT',
  'DISTRIBUTOR',
  'SERVICE_PROVIDER',
  'EMPLOYER',
  'CANDIDATE',
  'VERIFIED_BY',
] as const;
export type RelationshipType = (typeof RELATIONSHIP_TYPE)[number];

export const RELATIONSHIP_TYPE_LABEL: Record<RelationshipType, string> = {
  VENDOR: 'Vendor',
  SUPPLIER: 'Supplier',
  CUSTOMER: 'Customer',
  PARTNER: 'Partner',
  CONTRACTOR: 'Contractor',
  CONSULTANT: 'Consultant',
  DISTRIBUTOR: 'Distributor',
  SERVICE_PROVIDER: 'Service provider',
  EMPLOYER: 'Employer',
  CANDIDATE: 'Candidate',
  VERIFIED_BY: 'Verified by',
};

export const SUBJECT_TYPE = ['ORGANIZATION', 'PERSON'] as const;
export type SubjectType = (typeof SUBJECT_TYPE)[number];

export const RISK_LEVEL = ['LOW', 'STANDARD', 'HIGH', 'CRITICAL'] as const;
export type RiskLevel = (typeof RISK_LEVEL)[number];

export const ASSESSMENT_BAND = ['LOW_RISK', 'MODERATE_RISK', 'ELEVATED_RISK', 'HIGH_RISK', 'INSUFFICIENT_EVIDENCE'] as const;
export type AssessmentBand = (typeof ASSESSMENT_BAND)[number];

export const CHECK_CATEGORY = ['IDENTITY', 'COMPLIANCE', 'FINANCIAL', 'RISK', 'CREDENTIAL', 'PEOPLE'] as const;
export type CheckCategory = (typeof CHECK_CATEGORY)[number];

export const CHECK_STATUS = [
  'PLANNED',
  'BLOCKED_ON_CONSENT',
  'BLOCKED_ON_DOCUMENT',
  'RUNNING',
  'PASSED',
  'ATTENTION',
  'FAILED',
  'UNAVAILABLE',
  'SKIPPED',
] as const;
export type CheckStatus = (typeof CHECK_STATUS)[number];

/**
 * Where a fact came from. The UI must always distinguish these four
 * (Section 12 — verification authority).
 */
export const ATTRIBUTION = [
  'COMPANY_PROVIDED',
  'BID_VERIFIED',
  'PROVIDER_VERIFIED',
  'OFFICIAL_SOURCE_DERIVED',
] as const;
export type Attribution = (typeof ATTRIBUTION)[number];

export const ATTRIBUTION_LABEL: Record<Attribution, string> = {
  COMPANY_PROVIDED: 'Company provided',
  BID_VERIFIED: 'BID verified',
  PROVIDER_VERIFIED: 'Provider verified',
  OFFICIAL_SOURCE_DERIVED: 'Official-source derived',
};

/** Field-level visibility classification (Section 36). */
export const VISIBILITY = [
  'PUBLIC',
  'ORGANIZATION_ONLY',
  'RELATIONSHIP_ONLY',
  'AUTHORIZED_ONLY',
  'SENSITIVE',
  'RESTRICTED',
] as const;
export type Visibility = (typeof VISIBILITY)[number];

export const VISIBILITY_RANK: Record<Visibility, number> = {
  PUBLIC: 0,
  ORGANIZATION_ONLY: 1,
  RELATIONSHIP_ONLY: 2,
  AUTHORIZED_ONLY: 3,
  SENSITIVE: 4,
  RESTRICTED: 5,
};

export const FRESHNESS = ['CURRENT', 'AGING', 'STALE', 'EXPIRED'] as const;
export type Freshness = (typeof FRESHNESS)[number];

export const PROVIDER_CAPABILITY = [
  'IDENTITY',
  'KYB',
  'BGV',
  'BANK',
  'EDUCATION',
  'EMPLOYMENT',
  'DOCUMENT',
  'RISK',
] as const;
export type ProviderCapability = (typeof PROVIDER_CAPABILITY)[number];

export const INDUSTRY = [
  'MANUFACTURING',
  'HEALTHCARE',
  'IT',
  'CONSTRUCTION',
  'LOGISTICS',
  'EDUCATION',
  'RETAIL',
  'HOSPITALITY',
  'PHARMA',
  'RECRUITMENT',
  'BPO_KPO',
  'GENERIC',
] as const;
export type Industry = (typeof INDUSTRY)[number];

export const INDUSTRY_LABEL: Record<Industry, string> = {
  MANUFACTURING: 'Manufacturing',
  HEALTHCARE: 'Healthcare',
  IT: 'IT / Software',
  CONSTRUCTION: 'Construction',
  LOGISTICS: 'Logistics',
  EDUCATION: 'Education',
  RETAIL: 'Retail',
  HOSPITALITY: 'Hospitality',
  PHARMA: 'Pharma',
  RECRUITMENT: 'Recruitment',
  BPO_KPO: 'BPO / KPO',
  GENERIC: 'Industry agnostic',
};

/** What a requester wants to verify — drives policy generation in demo mode. */
export const VERIFICATION_TARGET = [
  'VENDOR',
  'SUPPLIER',
  'EMPLOYEE',
  'CANDIDATE',
  'CONTRACTOR',
  'PARTNER',
  'CONSULTANT',
  'DISTRIBUTOR',
  'BUSINESS',
  'PERSON',
] as const;
export type VerificationTarget = (typeof VERIFICATION_TARGET)[number];

export const CAMPAIGN_STATUS = ['DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED'] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUS)[number];

export const INVITATION_STATUS = ['CREATED', 'SENT', 'OPENED', 'ACCEPTED', 'DECLINED', 'EXPIRED', 'REVOKED'] as const;
export type InvitationStatus = (typeof INVITATION_STATUS)[number];

export const CONSENT_STATUS = ['REQUESTED', 'GRANTED', 'DECLINED', 'EXPIRED', 'REVOKED'] as const;
export type ConsentStatus = (typeof CONSENT_STATUS)[number];

export const AUTHORIZATION_STATUS = ['REQUESTED', 'GRANTED', 'DECLINED', 'EXPIRED', 'REVOKED'] as const;
export type AuthorizationStatus = (typeof AUTHORIZATION_STATUS)[number];

export const CREDENTIAL_STATUS = ['ACTIVE', 'EXPIRING', 'EXPIRED', 'REVOKED', 'SUPERSEDED'] as const;
export type CredentialStatus = (typeof CREDENTIAL_STATUS)[number];

export const MONITORING_SEVERITY = ['INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const;
export type MonitoringSeverity = (typeof MONITORING_SEVERITY)[number];

export const MONITORING_FREQUENCY = ['DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'EVENT_DRIVEN'] as const;
export type MonitoringFrequency = (typeof MONITORING_FREQUENCY)[number];

export const ALERT_STATUS = ['OPEN', 'ACKNOWLEDGED', 'IN_REVIEW', 'RESOLVED', 'DISMISSED'] as const;
export type AlertStatus = (typeof ALERT_STATUS)[number];

/** Workspace roles (RBAC). Attribute rules layer on top (ABAC). */
export const WORKSPACE_ROLE = [
  'OWNER',
  'ADMIN',
  'COMPLIANCE_MANAGER',
  'VERIFICATION_ANALYST',
  'VIEWER',
  'API_CLIENT',
] as const;
export type WorkspaceRole = (typeof WORKSPACE_ROLE)[number];

/** Platform-level roles for the BID internal admin console. */
export const PLATFORM_ROLE = ['BID_ADMIN', 'BID_CUSTOMER_SUCCESS', 'BID_SUPPORT', 'BID_READONLY'] as const;
export type PlatformRole = (typeof PLATFORM_ROLE)[number];

export const PLAN_TIER = ['MEMBER_FREE', 'STARTER', 'GROWTH', 'BUSINESS', 'ENTERPRISE'] as const;
export type PlanTier = (typeof PLAN_TIER)[number];

export const SUBSCRIPTION_STATUS = ['NONE', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED'] as const;
export type SubscriptionStatus = (typeof SUBSCRIPTION_STATUS)[number];

export const INVOICE_STATUS = ['DRAFT', 'ISSUED', 'PAID', 'OVERDUE', 'VOID'] as const;
export type InvoiceStatus = (typeof INVOICE_STATUS)[number];

export const NOTIFICATION_CHANNEL = ['IN_APP', 'EMAIL', 'WEBHOOK'] as const;
export type NotificationChannel = (typeof NOTIFICATION_CHANNEL)[number];

export const DECISION = ['APPROVED', 'APPROVED_WITH_CONDITIONS', 'REJECTED', 'PENDING'] as const;
export type Decision = (typeof DECISION)[number];
