-- CreateEnum
CREATE TYPE "OrganizationLifecycle" AS ENUM ('DISCOVERED', 'INVITED', 'CLAIMED', 'REGISTERED', 'VERIFIED', 'ACTIVE', 'SUSPENDED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "CommercialState" AS ENUM ('NON_MEMBER', 'MEMBER', 'VERIFIED_MEMBER', 'REQUESTER', 'CUSTOMER', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "CustomerLifecycleState" AS ENUM ('UNKNOWN', 'INVITED', 'REGISTERED', 'BID_MEMBER', 'VERIFICATION_IN_PROGRESS', 'VERIFIED_MEMBER', 'DISCOVERY', 'REQUESTER_ACTIVATION', 'FIRST_VERIFICATION', 'PAID_CUSTOMER', 'ACTIVE', 'EXPANDING', 'ENTERPRISE', 'NETWORK_PARTICIPANT', 'LOW_USAGE', 'AT_RISK', 'DORMANT', 'CHURNED', 'WIN_BACK');

-- CreateEnum
CREATE TYPE "RelationshipLifecycle" AS ENUM ('DISCOVERED', 'INVITED', 'VERIFICATION', 'ASSESSMENT', 'PENDING_APPROVAL', 'ACTIVE', 'MONITORED', 'SUSPENDED', 'TERMINATED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "VerificationLifecycle" AS ENUM ('REQUESTED', 'INVITED', 'ACCEPTED', 'CONSENT_PENDING', 'IN_PROGRESS', 'CHECKS_RUNNING', 'EVIDENCE_COLLECTED', 'ASSESSMENT', 'REVIEW', 'COMPLETED', 'CREDENTIAL_ISSUED', 'MONITORING', 'FAILED', 'PARTIAL', 'EXPIRED', 'REQUIRES_REVIEW', 'REVOKED');

-- CreateEnum
CREATE TYPE "RelationshipType" AS ENUM ('VENDOR', 'SUPPLIER', 'CUSTOMER', 'PARTNER', 'CONTRACTOR', 'CONSULTANT', 'DISTRIBUTOR', 'SERVICE_PROVIDER', 'EMPLOYER', 'CANDIDATE', 'VERIFIED_BY');

-- CreateEnum
CREATE TYPE "SubjectType" AS ENUM ('ORGANIZATION', 'PERSON');

-- CreateEnum
CREATE TYPE "RiskLevel" AS ENUM ('LOW', 'STANDARD', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "AssessmentBand" AS ENUM ('LOW_RISK', 'MODERATE_RISK', 'ELEVATED_RISK', 'HIGH_RISK', 'INSUFFICIENT_EVIDENCE');

-- CreateEnum
CREATE TYPE "CheckCategory" AS ENUM ('IDENTITY', 'COMPLIANCE', 'FINANCIAL', 'RISK', 'CREDENTIAL', 'PEOPLE');

-- CreateEnum
CREATE TYPE "CheckStatus" AS ENUM ('PLANNED', 'BLOCKED_ON_CONSENT', 'BLOCKED_ON_DOCUMENT', 'RUNNING', 'PASSED', 'ATTENTION', 'FAILED', 'UNAVAILABLE', 'SKIPPED');

-- CreateEnum
CREATE TYPE "Attribution" AS ENUM ('COMPANY_PROVIDED', 'BID_VERIFIED', 'PROVIDER_VERIFIED', 'OFFICIAL_SOURCE_DERIVED');

-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'ORGANIZATION_ONLY', 'RELATIONSHIP_ONLY', 'AUTHORIZED_ONLY', 'SENSITIVE', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "Freshness" AS ENUM ('CURRENT', 'AGING', 'STALE', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ProviderCapability" AS ENUM ('IDENTITY', 'KYB', 'BGV', 'BANK', 'EDUCATION', 'EMPLOYMENT', 'DOCUMENT', 'RISK');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('REQUESTED', 'PROVIDED', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ConsentStatus" AS ENUM ('REQUESTED', 'GRANTED', 'DECLINED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "AuthorizationStatus" AS ENUM ('REQUESTED', 'GRANTED', 'DECLINED', 'EXPIRED', 'REVOKED');

-- CreateEnum
CREATE TYPE "CredentialStatus" AS ENUM ('ACTIVE', 'EXPIRING', 'EXPIRED', 'REVOKED', 'SUPERSEDED');

-- CreateEnum
CREATE TYPE "MonitoringSeverity" AS ENUM ('INFO', 'LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "MonitoringFrequency" AS ENUM ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'EVENT_DRIVEN');

-- CreateEnum
CREATE TYPE "AlertStatus" AS ENUM ('OPEN', 'ACKNOWLEDGED', 'IN_REVIEW', 'RESOLVED', 'DISMISSED');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('MEMBER_FREE', 'STARTER', 'GROWTH', 'BUSINESS', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('NONE', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'OVERDUE', 'VOID');

-- CreateEnum
CREATE TYPE "Decision" AS ENUM ('APPROVED', 'APPROVED_WITH_CONDITIONS', 'REJECTED', 'PENDING');

-- CreateTable
CREATE TABLE "bid_ids" (
    "namespace" TEXT NOT NULL,
    "current" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "bid_ids_pkey" PRIMARY KEY ("namespace")
);

-- CreateTable
CREATE TABLE "organizations" (
    "id" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "description" TEXT,
    "website" TEXT,
    "logoText" TEXT NOT NULL,
    "logoColor" TEXT NOT NULL,
    "industry" TEXT NOT NULL,
    "country" TEXT NOT NULL DEFAULT 'IN',
    "city" TEXT,
    "registeredAddress" TEXT,
    "employeeBand" TEXT,
    "incorporationYear" INTEGER,
    "lifecycle" "OrganizationLifecycle" NOT NULL DEFAULT 'DISCOVERED',
    "commercialState" "CommercialState" NOT NULL DEFAULT 'NON_MEMBER',
    "primaryWorkspaceId" TEXT,
    "claimedAt" TIMESTAMP(3),
    "introducedByOrgId" TEXT,
    "tags" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "organizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "organization_identifiers" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "attribution" "Attribution" NOT NULL DEFAULT 'COMPANY_PROVIDED',
    "visibility" "Visibility" NOT NULL DEFAULT 'RELATIONSHIP_ONLY',
    "verifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "organization_identifiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "persons" (
    "id" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "emailHash" TEXT NOT NULL,
    "emailMasked" TEXT NOT NULL,
    "phoneMasked" TEXT NOT NULL,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'IN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "persons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT,
    "personId" TEXT,
    "platformRoles" TEXT[],
    "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLoginAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspaces" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "requesterEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspaces_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "workspace_memberships" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "roles" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "workspace_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relationships" (
    "id" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "sourceOrganizationId" TEXT NOT NULL,
    "targetType" "SubjectType" NOT NULL DEFAULT 'ORGANIZATION',
    "targetOrganizationId" TEXT,
    "targetPersonId" TEXT,
    "type" "RelationshipType" NOT NULL,
    "label" TEXT,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "lifecycle" "RelationshipLifecycle" NOT NULL DEFAULT 'DISCOVERED',
    "riskLevel" "RiskLevel" NOT NULL DEFAULT 'STANDARD',
    "criticality" TEXT,
    "policyId" TEXT,
    "latestVerificationId" TEXT,
    "verificationStatus" TEXT NOT NULL DEFAULT 'NONE',
    "contractReference" TEXT,
    "monitoringEnabled" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "relationships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "relationship_roles" (
    "id" TEXT NOT NULL,
    "relationshipId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "relationship_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "fromOrganizationId" TEXT NOT NULL,
    "toOrganizationName" TEXT NOT NULL,
    "toOrganizationId" TEXT,
    "toEmail" TEXT NOT NULL,
    "relationshipType" "RelationshipType" NOT NULL,
    "policyId" TEXT NOT NULL,
    "campaignId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'CREATED',
    "token" TEXT NOT NULL,
    "message" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "acceptedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authorizations" (
    "id" TEXT NOT NULL,
    "grantorOrganizationId" TEXT NOT NULL,
    "granteeOrganizationId" TEXT NOT NULL,
    "operation" TEXT NOT NULL,
    "scope" TEXT[],
    "relationshipId" TEXT,
    "status" "AuthorizationStatus" NOT NULL DEFAULT 'REQUESTED',
    "startAt" TIMESTAMP(3) NOT NULL,
    "endAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "authorizations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policies" (
    "id" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "subjectType" "SubjectType" NOT NULL DEFAULT 'ORGANIZATION',
    "relationshipType" "RelationshipType" NOT NULL,
    "industry" TEXT NOT NULL,
    "riskLevel" "RiskLevel" NOT NULL,
    "currentVersion" INTEGER NOT NULL DEFAULT 1,
    "system" BOOLEAN NOT NULL DEFAULT false,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "policies_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "policy_versions" (
    "id" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "requiredChecks" JSONB NOT NULL,
    "optionalChecks" JSONB NOT NULL,
    "documents" JSONB NOT NULL,
    "thresholds" JSONB NOT NULL,
    "validityDays" INTEGER NOT NULL,
    "reverificationDays" INTEGER NOT NULL,
    "monitoringFrequency" "MonitoringFrequency" NOT NULL,
    "approvalRule" TEXT NOT NULL,
    "requiresConsent" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "sealedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "policy_versions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_requests" (
    "id" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "requesterOrganizationId" TEXT NOT NULL,
    "subjectType" "SubjectType" NOT NULL DEFAULT 'ORGANIZATION',
    "subjectOrganizationId" TEXT,
    "subjectPersonId" TEXT,
    "subjectName" TEXT NOT NULL,
    "relationshipId" TEXT,
    "relationshipType" "RelationshipType" NOT NULL,
    "campaignId" TEXT,
    "policyId" TEXT NOT NULL,
    "policyVersion" INTEGER NOT NULL,
    "status" "VerificationLifecycle" NOT NULL DEFAULT 'REQUESTED',
    "consentId" TEXT,
    "authorizationId" TEXT,
    "decision" "Decision" NOT NULL DEFAULT 'PENDING',
    "decisionBy" TEXT,
    "decisionAt" TIMESTAMP(3),
    "decisionNote" TEXT,
    "slaDueAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "costPaise" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "verification_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_checks" (
    "id" TEXT NOT NULL,
    "verificationRequestId" TEXT NOT NULL,
    "checkCode" TEXT NOT NULL,
    "category" "CheckCategory" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "blocking" BOOLEAN NOT NULL DEFAULT false,
    "status" "CheckStatus" NOT NULL DEFAULT 'PLANNED',
    "providerId" TEXT,
    "providerTransactionId" TEXT,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "costPaise" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "verification_checks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_documents" (
    "id" TEXT NOT NULL,
    "verificationRequestId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "visibility" "Visibility" NOT NULL DEFAULT 'RELATIONSHIP_ONLY',
    "status" "DocumentStatus" NOT NULL DEFAULT 'REQUESTED',
    "fileName" TEXT,
    "sizeBytes" INTEGER,
    "contentHash" TEXT,
    "storageKey" TEXT,
    "note" TEXT,
    "providedByOrganizationId" TEXT,
    "providedAt" TIMESTAMP(3),
    "reviewedBy" TEXT,
    "reviewedAt" TIMESTAMP(3),
    "reviewNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_documents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_results" (
    "id" TEXT NOT NULL,
    "verificationRequestId" TEXT NOT NULL,
    "checkId" TEXT NOT NULL,
    "checkCode" TEXT NOT NULL,
    "outcome" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "summary" TEXT NOT NULL,
    "normalized" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "evidence" (
    "id" TEXT NOT NULL,
    "verificationRequestId" TEXT NOT NULL,
    "checkId" TEXT NOT NULL,
    "checkCode" TEXT NOT NULL,
    "subjectType" "SubjectType" NOT NULL,
    "subjectRef" TEXT NOT NULL,
    "what" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "attribution" "Attribution" NOT NULL,
    "providerId" TEXT NOT NULL,
    "providerName" TEXT NOT NULL,
    "method" TEXT NOT NULL,
    "checkedAt" TIMESTAMP(3) NOT NULL,
    "result" TEXT NOT NULL,
    "confidence" DOUBLE PRECISION NOT NULL,
    "scope" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "payloadHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "freshness" "Freshness" NOT NULL DEFAULT 'CURRENT',
    "policyId" TEXT NOT NULL,
    "policyVersion" INTEGER NOT NULL,
    "visibility" "Visibility" NOT NULL,
    "auditLogId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "evidence_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "risk_assessments" (
    "id" TEXT NOT NULL,
    "verificationRequestId" TEXT NOT NULL,
    "band" "AssessmentBand" NOT NULL,
    "score" INTEGER NOT NULL,
    "categories" JSONB NOT NULL,
    "missingChecks" TEXT[],
    "failedChecks" TEXT[],
    "attentionChecks" TEXT[],
    "freshness" "Freshness" NOT NULL,
    "policyId" TEXT NOT NULL,
    "policyVersion" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "disclaimer" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "risk_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credentials" (
    "id" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "subjectType" "SubjectType" NOT NULL,
    "subjectOrganizationId" TEXT,
    "subjectPersonId" TEXT,
    "verificationRequestId" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "policyVersion" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "publicAttributes" JSONB NOT NULL,
    "issuedByOrganizationId" TEXT,
    "status" "CredentialStatus" NOT NULL DEFAULT 'ACTIVE',
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "revocationReason" TEXT,

    CONSTRAINT "credentials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "consents" (
    "id" TEXT NOT NULL,
    "subjectType" "SubjectType" NOT NULL,
    "subjectRef" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "purpose" TEXT NOT NULL,
    "scope" TEXT[],
    "version" TEXT NOT NULL,
    "status" "ConsentStatus" NOT NULL DEFAULT 'REQUESTED',
    "requestedByOrganizationId" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grantedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "evidenceReference" TEXT,

    CONSTRAINT "consents_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaigns" (
    "id" TEXT NOT NULL,
    "bidId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "requesterOrganizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "policyId" TEXT NOT NULL,
    "relationshipType" "RelationshipType" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "slaDays" INTEGER NOT NULL DEFAULT 14,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "campaigns_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "campaign_members" (
    "id" TEXT NOT NULL,
    "campaignId" TEXT NOT NULL,
    "targetName" TEXT NOT NULL,
    "targetEmail" TEXT NOT NULL,
    "targetOrganizationId" TEXT,
    "invitationId" TEXT,
    "verificationRequestId" TEXT,
    "state" TEXT NOT NULL DEFAULT 'PENDING_INVITE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "campaign_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_rules" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "subjectType" "SubjectType" NOT NULL DEFAULT 'ORGANIZATION',
    "subjectRef" TEXT NOT NULL,
    "relationshipId" TEXT,
    "signals" TEXT[],
    "frequency" "MonitoringFrequency" NOT NULL DEFAULT 'QUARTERLY',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "monitoring_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "monitoring_events" (
    "id" TEXT NOT NULL,
    "ruleId" TEXT,
    "workspaceId" TEXT NOT NULL,
    "subjectType" "SubjectType" NOT NULL DEFAULT 'ORGANIZATION',
    "subjectRef" TEXT NOT NULL,
    "subjectName" TEXT NOT NULL,
    "signal" TEXT NOT NULL,
    "severity" "MonitoringSeverity" NOT NULL,
    "title" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" "AlertStatus" NOT NULL DEFAULT 'OPEN',
    "relationshipId" TEXT,
    "recommendedAction" TEXT NOT NULL,
    "detectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "resolvedAt" TIMESTAMP(3),

    CONSTRAINT "monitoring_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "providers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capabilities" "ProviderCapability"[],
    "countries" TEXT[],
    "costMultiplier" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "slaHours" INTEGER NOT NULL,
    "qualityScore" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "description" TEXT NOT NULL,
    "secretRef" TEXT,

    CONSTRAINT "providers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "provider_transactions" (
    "id" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "verificationRequestId" TEXT NOT NULL,
    "checkId" TEXT NOT NULL,
    "checkCode" TEXT NOT NULL,
    "requestedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL,
    "latencyMs" INTEGER NOT NULL,
    "outcome" TEXT NOT NULL,
    "costPaise" INTEGER NOT NULL,
    "reference" TEXT NOT NULL,
    "fallbackFrom" TEXT,

    CONSTRAINT "provider_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plans" (
    "id" TEXT NOT NULL,
    "tier" "PlanTier" NOT NULL,
    "name" TEXT NOT NULL,
    "monthlyPricePaise" INTEGER NOT NULL,
    "includedChecks" INTEGER NOT NULL,
    "overagePerCheckPaise" INTEGER NOT NULL,
    "entitlements" JSONB NOT NULL,
    "description" TEXT NOT NULL,
    "highlights" TEXT[],
    "quoteOnly" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'ACTIVE',
    "seats" INTEGER NOT NULL DEFAULT 3,
    "monitoredEntities" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renewsAt" TIMESTAMP(3) NOT NULL,
    "cancelledAt" TIMESTAMP(3),

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credit_wallets" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "balance" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "credit_wallets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "credits" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "delta" INTEGER NOT NULL,
    "reason" TEXT NOT NULL,
    "reference" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "credits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "invoices" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "lines" JSONB NOT NULL,
    "subtotalPaise" INTEGER NOT NULL,
    "taxPaise" INTEGER NOT NULL,
    "totalPaise" INTEGER NOT NULL,
    "issuedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueAt" TIMESTAMP(3) NOT NULL,
    "paidAt" TIMESTAMP(3),

    CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "amountPaise" INTEGER NOT NULL,
    "method" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "receivedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "customer_lifecycle" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "workspaceId" TEXT,
    "state" "CustomerLifecycleState" NOT NULL DEFAULT 'UNKNOWN',
    "enteredAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "history" JSONB NOT NULL,
    "healthScore" INTEGER NOT NULL DEFAULT 50,
    "signals" JSONB NOT NULL,
    "ownerName" TEXT NOT NULL DEFAULT 'Unassigned',
    "notes" TEXT,

    CONSTRAINT "customer_lifecycle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "support_cases" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "status" TEXT NOT NULL DEFAULT 'OPEN',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "support_cases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT,
    "organizationId" TEXT,
    "channel" TEXT NOT NULL DEFAULT 'IN_APP',
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "link" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'INFO',
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorType" TEXT NOT NULL,
    "actorId" TEXT NOT NULL,
    "actorName" TEXT NOT NULL,
    "workspaceId" TEXT,
    "organizationId" TEXT,
    "action" TEXT NOT NULL,
    "resourceType" TEXT NOT NULL,
    "resourceId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "metadata" JSONB NOT NULL,
    "hash" TEXT NOT NULL,
    "previousHash" TEXT NOT NULL,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "hashedSecret" TEXT NOT NULL,
    "scopes" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" TIMESTAMP(3),
    "revokedAt" TIMESTAMP(3),

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhooks" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "events" TEXT[],
    "active" BOOLEAN NOT NULL DEFAULT true,
    "secretHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "organizations_bidId_key" ON "organizations"("bidId");

-- CreateIndex
CREATE INDEX "organizations_commercialState_idx" ON "organizations"("commercialState");

-- CreateIndex
CREATE INDEX "organizations_lifecycle_idx" ON "organizations"("lifecycle");

-- CreateIndex
CREATE INDEX "organizations_introducedByOrgId_idx" ON "organizations"("introducedByOrgId");

-- CreateIndex
CREATE INDEX "organization_identifiers_organizationId_idx" ON "organization_identifiers"("organizationId");

-- CreateIndex
CREATE UNIQUE INDEX "persons_bidId_key" ON "persons"("bidId");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "workspaces_tenantId_key" ON "workspaces"("tenantId");

-- CreateIndex
CREATE INDEX "workspaces_organizationId_idx" ON "workspaces"("organizationId");

-- CreateIndex
CREATE INDEX "workspace_memberships_userId_idx" ON "workspace_memberships"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "workspace_memberships_workspaceId_userId_key" ON "workspace_memberships"("workspaceId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "relationships_bidId_key" ON "relationships"("bidId");

-- CreateIndex
CREATE INDEX "relationships_workspaceId_idx" ON "relationships"("workspaceId");

-- CreateIndex
CREATE INDEX "relationships_sourceOrganizationId_idx" ON "relationships"("sourceOrganizationId");

-- CreateIndex
CREATE INDEX "relationships_targetOrganizationId_idx" ON "relationships"("targetOrganizationId");

-- CreateIndex
CREATE INDEX "relationships_lifecycle_idx" ON "relationships"("lifecycle");

-- CreateIndex
CREATE UNIQUE INDEX "relationship_roles_relationshipId_userId_role_key" ON "relationship_roles"("relationshipId", "userId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "invitations_token_key" ON "invitations"("token");

-- CreateIndex
CREATE INDEX "invitations_workspaceId_idx" ON "invitations"("workspaceId");

-- CreateIndex
CREATE INDEX "invitations_toOrganizationId_idx" ON "invitations"("toOrganizationId");

-- CreateIndex
CREATE INDEX "authorizations_grantorOrganizationId_idx" ON "authorizations"("grantorOrganizationId");

-- CreateIndex
CREATE INDEX "authorizations_granteeOrganizationId_idx" ON "authorizations"("granteeOrganizationId");

-- CreateIndex
CREATE UNIQUE INDEX "policies_bidId_key" ON "policies"("bidId");

-- CreateIndex
CREATE INDEX "policies_workspaceId_idx" ON "policies"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "policy_versions_policyId_version_key" ON "policy_versions"("policyId", "version");

-- CreateIndex
CREATE UNIQUE INDEX "verification_requests_bidId_key" ON "verification_requests"("bidId");

-- CreateIndex
CREATE INDEX "verification_requests_workspaceId_idx" ON "verification_requests"("workspaceId");

-- CreateIndex
CREATE INDEX "verification_requests_subjectOrganizationId_idx" ON "verification_requests"("subjectOrganizationId");

-- CreateIndex
CREATE INDEX "verification_requests_status_idx" ON "verification_requests"("status");

-- CreateIndex
CREATE INDEX "verification_requests_campaignId_idx" ON "verification_requests"("campaignId");

-- CreateIndex
CREATE INDEX "verification_checks_verificationRequestId_idx" ON "verification_checks"("verificationRequestId");

-- CreateIndex
CREATE INDEX "verification_checks_status_idx" ON "verification_checks"("status");

-- CreateIndex
CREATE INDEX "verification_documents_verificationRequestId_status_idx" ON "verification_documents"("verificationRequestId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "verification_results_checkId_key" ON "verification_results"("checkId");

-- CreateIndex
CREATE INDEX "verification_results_verificationRequestId_idx" ON "verification_results"("verificationRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "evidence_checkId_key" ON "evidence"("checkId");

-- CreateIndex
CREATE INDEX "evidence_verificationRequestId_idx" ON "evidence"("verificationRequestId");

-- CreateIndex
CREATE INDEX "evidence_subjectRef_idx" ON "evidence"("subjectRef");

-- CreateIndex
CREATE INDEX "evidence_visibility_idx" ON "evidence"("visibility");

-- CreateIndex
CREATE UNIQUE INDEX "risk_assessments_verificationRequestId_key" ON "risk_assessments"("verificationRequestId");

-- CreateIndex
CREATE UNIQUE INDEX "credentials_bidId_key" ON "credentials"("bidId");

-- CreateIndex
CREATE UNIQUE INDEX "credentials_verificationRequestId_key" ON "credentials"("verificationRequestId");

-- CreateIndex
CREATE INDEX "credentials_subjectOrganizationId_idx" ON "credentials"("subjectOrganizationId");

-- CreateIndex
CREATE INDEX "credentials_status_idx" ON "credentials"("status");

-- CreateIndex
CREATE INDEX "consents_subjectRef_idx" ON "consents"("subjectRef");

-- CreateIndex
CREATE UNIQUE INDEX "campaigns_bidId_key" ON "campaigns"("bidId");

-- CreateIndex
CREATE INDEX "campaigns_workspaceId_idx" ON "campaigns"("workspaceId");

-- CreateIndex
CREATE INDEX "campaign_members_campaignId_idx" ON "campaign_members"("campaignId");

-- CreateIndex
CREATE INDEX "monitoring_rules_workspaceId_idx" ON "monitoring_rules"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "monitoring_rules_workspaceId_subjectRef_key" ON "monitoring_rules"("workspaceId", "subjectRef");

-- CreateIndex
CREATE INDEX "monitoring_events_workspaceId_status_idx" ON "monitoring_events"("workspaceId", "status");

-- CreateIndex
CREATE INDEX "monitoring_events_subjectRef_idx" ON "monitoring_events"("subjectRef");

-- CreateIndex
CREATE INDEX "provider_transactions_providerId_idx" ON "provider_transactions"("providerId");

-- CreateIndex
CREATE INDEX "provider_transactions_verificationRequestId_idx" ON "provider_transactions"("verificationRequestId");

-- CreateIndex
CREATE INDEX "subscriptions_workspaceId_idx" ON "subscriptions"("workspaceId");

-- CreateIndex
CREATE INDEX "subscriptions_status_idx" ON "subscriptions"("status");

-- CreateIndex
CREATE INDEX "usage_workspaceId_period_idx" ON "usage"("workspaceId", "period");

-- CreateIndex
CREATE UNIQUE INDEX "credit_wallets_workspaceId_key" ON "credit_wallets"("workspaceId");

-- CreateIndex
CREATE INDEX "credits_walletId_idx" ON "credits"("walletId");

-- CreateIndex
CREATE UNIQUE INDEX "invoices_number_key" ON "invoices"("number");

-- CreateIndex
CREATE INDEX "invoices_workspaceId_period_idx" ON "invoices"("workspaceId", "period");

-- CreateIndex
CREATE INDEX "payments_workspaceId_idx" ON "payments"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "customer_lifecycle_organizationId_key" ON "customer_lifecycle"("organizationId");

-- CreateIndex
CREATE INDEX "customer_lifecycle_state_idx" ON "customer_lifecycle"("state");

-- CreateIndex
CREATE INDEX "support_cases_organizationId_idx" ON "support_cases"("organizationId");

-- CreateIndex
CREATE INDEX "notifications_workspaceId_read_idx" ON "notifications"("workspaceId", "read");

-- CreateIndex
CREATE INDEX "notifications_organizationId_read_idx" ON "notifications"("organizationId", "read");

-- CreateIndex
CREATE INDEX "audit_logs_workspaceId_at_idx" ON "audit_logs"("workspaceId", "at");

-- CreateIndex
CREATE INDEX "audit_logs_resourceId_idx" ON "audit_logs"("resourceId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_prefix_key" ON "api_keys"("prefix");

-- CreateIndex
CREATE INDEX "api_keys_workspaceId_idx" ON "api_keys"("workspaceId");

-- CreateIndex
CREATE INDEX "webhooks_workspaceId_idx" ON "webhooks"("workspaceId");

-- AddForeignKey
ALTER TABLE "organizations" ADD CONSTRAINT "organizations_introducedByOrgId_fkey" FOREIGN KEY ("introducedByOrgId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "organization_identifiers" ADD CONSTRAINT "organization_identifiers_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_personId_fkey" FOREIGN KEY ("personId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspaces" ADD CONSTRAINT "workspaces_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "workspace_memberships" ADD CONSTRAINT "workspace_memberships_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_sourceOrganizationId_fkey" FOREIGN KEY ("sourceOrganizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_targetOrganizationId_fkey" FOREIGN KEY ("targetOrganizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationships" ADD CONSTRAINT "relationships_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "policies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "relationship_roles" ADD CONSTRAINT "relationship_roles_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_fromOrganizationId_fkey" FOREIGN KEY ("fromOrganizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_toOrganizationId_fkey" FOREIGN KEY ("toOrganizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policies" ADD CONSTRAINT "policies_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "policy_versions" ADD CONSTRAINT "policy_versions_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "policies"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_requesterOrganizationId_fkey" FOREIGN KEY ("requesterOrganizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_subjectOrganizationId_fkey" FOREIGN KEY ("subjectOrganizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_subjectPersonId_fkey" FOREIGN KEY ("subjectPersonId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_requests" ADD CONSTRAINT "verification_requests_consentId_fkey" FOREIGN KEY ("consentId") REFERENCES "consents"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_checks" ADD CONSTRAINT "verification_checks_verificationRequestId_fkey" FOREIGN KEY ("verificationRequestId") REFERENCES "verification_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_documents" ADD CONSTRAINT "verification_documents_verificationRequestId_fkey" FOREIGN KEY ("verificationRequestId") REFERENCES "verification_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_results" ADD CONSTRAINT "verification_results_verificationRequestId_fkey" FOREIGN KEY ("verificationRequestId") REFERENCES "verification_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "verification_results" ADD CONSTRAINT "verification_results_checkId_fkey" FOREIGN KEY ("checkId") REFERENCES "verification_checks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_verificationRequestId_fkey" FOREIGN KEY ("verificationRequestId") REFERENCES "verification_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "evidence" ADD CONSTRAINT "evidence_checkId_fkey" FOREIGN KEY ("checkId") REFERENCES "verification_checks"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "risk_assessments" ADD CONSTRAINT "risk_assessments_verificationRequestId_fkey" FOREIGN KEY ("verificationRequestId") REFERENCES "verification_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_subjectOrganizationId_fkey" FOREIGN KEY ("subjectOrganizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_subjectPersonId_fkey" FOREIGN KEY ("subjectPersonId") REFERENCES "persons"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_issuedByOrganizationId_fkey" FOREIGN KEY ("issuedByOrganizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credentials" ADD CONSTRAINT "credentials_verificationRequestId_fkey" FOREIGN KEY ("verificationRequestId") REFERENCES "verification_requests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_policyId_fkey" FOREIGN KEY ("policyId") REFERENCES "policies"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "campaign_members" ADD CONSTRAINT "campaign_members_campaignId_fkey" FOREIGN KEY ("campaignId") REFERENCES "campaigns"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_rules" ADD CONSTRAINT "monitoring_rules_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_rules" ADD CONSTRAINT "monitoring_rules_relationshipId_fkey" FOREIGN KEY ("relationshipId") REFERENCES "relationships"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_events" ADD CONSTRAINT "monitoring_events_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "monitoring_rules"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "monitoring_events" ADD CONSTRAINT "monitoring_events_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_transactions" ADD CONSTRAINT "provider_transactions_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "providers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "provider_transactions" ADD CONSTRAINT "provider_transactions_verificationRequestId_fkey" FOREIGN KEY ("verificationRequestId") REFERENCES "verification_requests"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_planId_fkey" FOREIGN KEY ("planId") REFERENCES "plans"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage" ADD CONSTRAINT "usage_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credit_wallets" ADD CONSTRAINT "credit_wallets_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "credits" ADD CONSTRAINT "credits_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "credit_wallets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "customer_lifecycle" ADD CONSTRAINT "customer_lifecycle_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "support_cases" ADD CONSTRAINT "support_cases_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhooks" ADD CONSTRAINT "webhooks_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE;
