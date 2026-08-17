import type {
  ApiKeyRecord,
  Assessment,
  AuditLogEntry,
  Authorization,
  Campaign,
  CampaignMember,
  Consent,
  Credential,
  CreditLedgerEntry,
  CreditWallet,
  CustomerLifecycleRecord,
  Evidence,
  Invitation,
  Invoice,
  MonitoringEvent,
  MonitoringRule,
  Notification,
  Organization,
  OrganizationIdentifier,
  Payment,
  Person,
  Plan,
  Policy,
  PolicyVersion,
  ProviderRecord,
  ProviderTransaction,
  Relationship,
  Subscription,
  SupportCase,
  UsageRecord,
  User,
  VerificationCheck,
  VerificationDocument,
  VerificationRequest,
  VerificationResult,
  WebhookEndpoint,
  Workspace,
  WorkspaceMembership,
} from '../domain/types.js';

export interface Entity {
  id: string;
}

/**
 * A tiny repository abstraction. The in-memory implementation backs the browser
 * demo and the API's default profile; a Prisma-backed implementation can satisfy
 * the same interface without touching callers (see prisma/schema.prisma).
 */
export class Collection<T extends Entity> {
  private readonly items = new Map<string, T>();

  constructor(seed: T[] = []) {
    for (const item of seed) this.items.set(item.id, item);
  }

  insert(item: T): T {
    this.items.set(item.id, item);
    return item;
  }

  upsert(item: T): T {
    return this.insert(item);
  }

  update(id: string, patch: Partial<T>): T {
    const existing = this.items.get(id);
    if (!existing) throw new Error(`Record not found: ${id}`);
    const next = { ...existing, ...patch } as T;
    this.items.set(id, next);
    return next;
  }

  get(id: string): T | undefined {
    return this.items.get(id);
  }

  require(id: string): T {
    const item = this.items.get(id);
    if (!item) throw new Error(`Record not found: ${id}`);
    return item;
  }

  remove(id: string): void {
    this.items.delete(id);
  }

  all(): T[] {
    return [...this.items.values()];
  }

  find(predicate: (item: T) => boolean): T[] {
    return this.all().filter(predicate);
  }

  first(predicate: (item: T) => boolean): T | undefined {
    return this.all().find(predicate);
  }

  count(predicate?: (item: T) => boolean): number {
    return predicate ? this.find(predicate).length : this.items.size;
  }
}

/** The full persistence surface of the platform. */
export class BidStore {
  organizations = new Collection<Organization>();
  organizationIdentifiers = new Collection<OrganizationIdentifier>();
  persons = new Collection<Person>();
  users = new Collection<User>();
  workspaces = new Collection<Workspace>();
  memberships = new Collection<WorkspaceMembership>();
  relationships = new Collection<Relationship>();
  invitations = new Collection<Invitation>();
  policies = new Collection<Policy>();
  policyVersions = new Collection<PolicyVersion>();
  verificationRequests = new Collection<VerificationRequest>();
  verificationChecks = new Collection<VerificationCheck>();
  verificationDocuments = new Collection<VerificationDocument>();
  verificationResults = new Collection<VerificationResult>();
  evidence = new Collection<Evidence>();
  assessments = new Collection<Assessment>();
  credentials = new Collection<Credential>();
  consents = new Collection<Consent>();
  authorizations = new Collection<Authorization>();
  campaigns = new Collection<Campaign>();
  campaignMembers = new Collection<CampaignMember>();
  monitoringRules = new Collection<MonitoringRule>();
  monitoringEvents = new Collection<MonitoringEvent>();
  providers = new Collection<ProviderRecord>();
  providerTransactions = new Collection<ProviderTransaction>();
  plans = new Collection<Plan>();
  subscriptions = new Collection<Subscription>();
  usage = new Collection<UsageRecord>();
  creditWallets = new Collection<CreditWallet>();
  creditLedger = new Collection<CreditLedgerEntry>();
  invoices = new Collection<Invoice>();
  payments = new Collection<Payment>();
  notifications = new Collection<Notification>();
  auditLogs = new Collection<AuditLogEntry>();
  customerLifecycle = new Collection<CustomerLifecycleRecord>();
  supportCases = new Collection<SupportCase>();
  apiKeys = new Collection<ApiKeyRecord>();
  webhooks = new Collection<WebhookEndpoint>();
}
