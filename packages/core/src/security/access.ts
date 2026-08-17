import type { Entitlements, Relationship } from '../domain/types.js';
import type { PlatformRole, Visibility, WorkspaceRole } from '../domain/enums.js';
import { VISIBILITY_RANK } from '../domain/enums.js';

/**
 * The access context is threaded through every read/write in the platform.
 * Membership of the BID network never by itself grants visibility of another
 * organization's private data (Section 35).
 */
export interface AccessContext {
  userId: string;
  userName: string;
  workspaceId: string;
  tenantId: string;
  organizationId: string;
  roles: WorkspaceRole[];
  platformRoles: PlatformRole[];
  entitlements: Entitlements;
  /** True when acting through an API key rather than an interactive session. */
  viaApiKey?: boolean;
  scopes?: string[];
}

export type Permission =
  | 'org:read'
  | 'org:write'
  | 'relationship:read'
  | 'relationship:write'
  | 'invitation:send'
  | 'policy:read'
  | 'policy:write'
  | 'verification:read'
  | 'verification:initiate'
  | 'verification:decide'
  | 'evidence:read'
  | 'campaign:write'
  | 'monitoring:write'
  | 'billing:read'
  | 'billing:write'
  | 'team:write'
  | 'apikey:write'
  | 'admin:platform';

const ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  OWNER: [
    'org:read',
    'org:write',
    'relationship:read',
    'relationship:write',
    'invitation:send',
    'policy:read',
    'policy:write',
    'verification:read',
    'verification:initiate',
    'verification:decide',
    'evidence:read',
    'campaign:write',
    'monitoring:write',
    'billing:read',
    'billing:write',
    'team:write',
    'apikey:write',
  ],
  ADMIN: [
    'org:read',
    'org:write',
    'relationship:read',
    'relationship:write',
    'invitation:send',
    'policy:read',
    'policy:write',
    'verification:read',
    'verification:initiate',
    'verification:decide',
    'evidence:read',
    'campaign:write',
    'monitoring:write',
    'billing:read',
    'team:write',
    'apikey:write',
  ],
  COMPLIANCE_MANAGER: [
    'org:read',
    'relationship:read',
    'relationship:write',
    'invitation:send',
    'policy:read',
    'policy:write',
    'verification:read',
    'verification:initiate',
    'verification:decide',
    'evidence:read',
    'campaign:write',
    'monitoring:write',
  ],
  VERIFICATION_ANALYST: [
    'org:read',
    'relationship:read',
    'policy:read',
    'verification:read',
    'verification:initiate',
    'evidence:read',
    'campaign:write',
  ],
  VIEWER: ['org:read', 'relationship:read', 'policy:read', 'verification:read'],
  API_CLIENT: ['org:read', 'relationship:read', 'policy:read', 'verification:read', 'verification:initiate'],
};

/** Permissions gated by a paid entitlement in addition to a role (Rule 1). */
const ENTITLEMENT_GATES: Partial<Record<Permission, keyof Entitlements>> = {
  'verification:initiate': 'canInitiateVerification',
  'campaign:write': 'canCreateCampaigns',
  'policy:write': 'canCreatePolicies',
  'monitoring:write': 'canUseMonitoring',
};

export class ForbiddenError extends Error {
  readonly code = 'FORBIDDEN';
  constructor(message: string, readonly reason: 'ROLE' | 'ENTITLEMENT' | 'TENANT' | 'RELATIONSHIP' | 'AUTHORIZATION') {
    super(message);
    this.name = 'ForbiddenError';
  }
}

export function hasPermission(ctx: AccessContext, permission: Permission): boolean {
  if (permission === 'admin:platform') return ctx.platformRoles.length > 0;
  const roleGranted = ctx.roles.some((role) => ROLE_PERMISSIONS[role]?.includes(permission));
  if (!roleGranted) return false;
  const gate = ENTITLEMENT_GATES[permission];
  if (gate && !ctx.entitlements[gate]) return false;
  return true;
}

/** Explains *why* an action is unavailable — the UI shows this to the user. */
export function permissionDenialReason(ctx: AccessContext, permission: Permission): 'ROLE' | 'ENTITLEMENT' | null {
  if (hasPermission(ctx, permission)) return null;
  const roleGranted = ctx.roles.some((role) => ROLE_PERMISSIONS[role]?.includes(permission));
  if (!roleGranted) return 'ROLE';
  return 'ENTITLEMENT';
}

export function assertPermission(ctx: AccessContext, permission: Permission): void {
  const reason = permissionDenialReason(ctx, permission);
  if (!reason) return;
  throw new ForbiddenError(
    reason === 'ENTITLEMENT'
      ? `Your current plan does not include "${permission}". Upgrade to a requester plan to continue.`
      : `Your role does not permit "${permission}".`,
    reason,
  );
}

/** Hard tenant boundary — checked on every record load (ADR-011). */
export function assertTenant(ctx: AccessContext, record: { workspaceId?: string }): void {
  if (!record.workspaceId) return;
  if (record.workspaceId !== ctx.workspaceId) {
    throw new ForbiddenError('This record belongs to another workspace.', 'TENANT');
  }
}

export function isSameTenant(ctx: AccessContext, record: { workspaceId?: string }): boolean {
  return !record.workspaceId || record.workspaceId === ctx.workspaceId;
}

/**
 * Maximum data classification the viewer may see for a given subject.
 * Public callers see PUBLIC only; a counterparty in an active relationship sees
 * RELATIONSHIP_ONLY; the subject organization itself sees its own SENSITIVE data.
 */
export function maxVisibilityFor(options: {
  ctx?: AccessContext;
  subjectOrganizationId?: string;
  relationship?: Relationship | undefined;
  hasAuthorization?: boolean;
}): Visibility {
  const { ctx, subjectOrganizationId, relationship, hasAuthorization } = options;
  if (!ctx) return 'PUBLIC';
  if (subjectOrganizationId && ctx.organizationId === subjectOrganizationId) return 'SENSITIVE';
  if (hasAuthorization) return 'AUTHORIZED_ONLY';
  if (relationship && relationship.sourceOrganizationId === ctx.organizationId) return 'RELATIONSHIP_ONLY';
  return 'PUBLIC';
}

export function isVisible(fieldVisibility: Visibility, maxVisibility: Visibility): boolean {
  return VISIBILITY_RANK[fieldVisibility] <= VISIBILITY_RANK[maxVisibility];
}

/** Redacts a labelled value list down to what the viewer is allowed to see. */
export function redact<T extends { visibility: Visibility }>(items: T[], maxVisibility: Visibility): T[] {
  return items.filter((item) => isVisible(item.visibility, maxVisibility));
}

export function maskValue(value: string, keepStart = 2, keepEnd = 2): string {
  if (value.length <= keepStart + keepEnd) return '•'.repeat(value.length);
  return `${value.slice(0, keepStart)}${'•'.repeat(Math.max(4, value.length - keepStart - keepEnd))}${value.slice(-keepEnd)}`;
}
