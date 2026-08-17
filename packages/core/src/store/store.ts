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
  UserSession,
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

export type MutationKind = 'insert' | 'update' | 'remove';

/**
 * Receives every mutation applied to the store.
 *
 * The domain stays synchronous — services read and write an in-memory working
 * set — while a sink durably records the same changes. That is what lets the
 * identical engine run against PostgreSQL in the API process and against
 * nothing at all in the browser demo.
 */
export interface MutationSink {
  record(collection: string, kind: MutationKind, id: string, value?: unknown): void;
}

/**
 * A tiny repository abstraction. The in-memory implementation backs the browser
 * demo; in the API it is hydrated from PostgreSQL at boot and every mutation is
 * written through to it (see prisma/schema.prisma).
 */
export class Collection<T extends Entity> {
  private readonly items = new Map<string, T>();
  private sink?: MutationSink;
  private name = 'unknown';

  constructor(seed: T[] = []) {
    for (const item of seed) this.items.set(item.id, item);
  }

  /** Called once by the store; not part of the domain surface. */
  bindSink(name: string, sink: MutationSink | undefined): void {
    this.name = name;
    this.sink = sink;
  }

  /** Loads records without emitting mutations — used when hydrating from the database. */
  hydrate(records: T[]): void {
    for (const record of records) this.items.set(record.id, record);
  }

  insert(item: T): T {
    this.items.set(item.id, item);
    this.sink?.record(this.name, 'insert', item.id, item);
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
    this.sink?.record(this.name, 'update', id, next);
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
    this.sink?.record(this.name, 'remove', id);
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
  sessions = new Collection<UserSession>();
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

  /**
   * Routes every mutation in every collection to `sink`, keyed by the property
   * name — which is also the name the persistence layer maps to a table.
   */
  bindSink(sink: MutationSink | undefined): void {
    for (const [name, value] of Object.entries(this)) {
      if (value instanceof Collection) value.bindSink(name, sink);
    }
  }

  /** Every collection, keyed by name — used by hydration and persistence. */
  collections(): Record<string, Collection<Entity>> {
    const out: Record<string, Collection<Entity>> = {};
    for (const [name, value] of Object.entries(this)) {
      if (value instanceof Collection) out[name] = value as Collection<Entity>;
    }
    return out;
  }
}
