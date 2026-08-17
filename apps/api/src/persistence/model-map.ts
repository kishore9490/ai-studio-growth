import { Prisma } from '@prisma/client';

/**
 * The only place that knows which store collection corresponds to which table.
 *
 * Everything else about persistence — column names, types, write order — is
 * derived from the Prisma schema at runtime, so adding a field to a domain type
 * and to the schema is all it takes; no mapper needs editing.
 */
export const COLLECTION_TO_MODEL: Record<string, string> = {
  organizations: 'Organization',
  organizationIdentifiers: 'OrganizationIdentifier',
  persons: 'Person',
  users: 'User',
  sessions: 'UserSession',
  workspaces: 'Workspace',
  memberships: 'WorkspaceMembership',
  relationships: 'Relationship',
  invitations: 'Invitation',
  policies: 'Policy',
  policyVersions: 'PolicyVersion',
  verificationRequests: 'VerificationRequest',
  verificationChecks: 'VerificationCheck',
  verificationDocuments: 'VerificationDocument',
  verificationResults: 'VerificationResult',
  evidence: 'Evidence',
  assessments: 'RiskAssessment',
  credentials: 'Credential',
  consents: 'Consent',
  authorizations: 'Authorization',
  campaigns: 'Campaign',
  campaignMembers: 'CampaignMember',
  monitoringRules: 'MonitoringRule',
  monitoringEvents: 'MonitoringEvent',
  providers: 'Provider',
  providerTransactions: 'ProviderTransaction',
  plans: 'Plan',
  subscriptions: 'Subscription',
  usage: 'UsageRecord',
  creditWallets: 'CreditWallet',
  creditLedger: 'CreditLedgerEntry',
  invoices: 'Invoice',
  payments: 'Payment',
  notifications: 'Notification',
  auditLogs: 'AuditLog',
  customerLifecycle: 'CustomerLifecycle',
  supportCases: 'SupportCase',
  apiKeys: 'ApiKey',
  webhooks: 'WebhookEndpoint',
};

export type ScalarField = Prisma.DMMF.Field;

export interface ModelShape {
  name: string;
  /** Prisma client property, e.g. `organization`. */
  delegate: string;
  scalars: Map<string, ScalarField>;
  /** Foreign keys pointing at rows in the same table (e.g. `introducedByOrgId`). */
  selfReferences: string[];
  /** Other model names whose rows must exist before this model's rows. */
  dependsOn: string[];
}

const MODELS = new Map<string, ModelShape>();

for (const model of Prisma.dmmf.datamodel.models) {
  const scalars = new Map<string, ScalarField>();
  for (const field of model.fields) {
    if (field.kind !== 'object') scalars.set(field.name, field);
  }

  const dependsOn = new Set<string>();
  const selfReferences: string[] = [];
  for (const field of model.fields) {
    // A relation whose foreign key lives on *this* model is a hard ordering
    // constraint: the referenced row has to be written first.
    if (field.kind !== 'object' || !field.relationFromFields?.length) continue;
    if (field.type === model.name) selfReferences.push(...field.relationFromFields);
    else dependsOn.add(field.type);
  }

  MODELS.set(model.name, {
    name: model.name,
    delegate: model.name.charAt(0).toLowerCase() + model.name.slice(1),
    scalars,
    selfReferences,
    dependsOn: [...dependsOn],
  });
}

export function modelShape(name: string): ModelShape {
  const shape = MODELS.get(name);
  if (!shape) throw new Error(`Prisma model not found in schema: ${name}`);
  return shape;
}

/**
 * Collections ordered so that every row's referenced rows are written before
 * it, computed from the schema's own foreign keys rather than a hand-kept list
 * that would rot the first time a relation is added.
 */
export function persistenceOrder(): string[] {
  const collectionsByModel = new Map<string, string>();
  for (const [collection, model] of Object.entries(COLLECTION_TO_MODEL)) {
    collectionsByModel.set(model, collection);
  }

  const ordered: string[] = [];
  const placed = new Set<string>();
  const visiting = new Set<string>();

  const visit = (modelName: string): void => {
    if (placed.has(modelName) || visiting.has(modelName)) return;
    const shape = MODELS.get(modelName);
    if (!shape) return;
    visiting.add(modelName);
    for (const dependency of shape.dependsOn) visit(dependency);
    visiting.delete(modelName);
    placed.add(modelName);
    const collection = collectionsByModel.get(modelName);
    if (collection) ordered.push(collection);
  };

  for (const model of Object.values(COLLECTION_TO_MODEL)) visit(model);
  return ordered;
}
