/**
 * Domain events (ADR-012).
 *
 * Services never call each other directly for side effects; they publish an
 * event and interested services subscribe. The bus below is in-memory, but the
 * interface is deliberately broker-shaped (publish / subscribe / envelope with
 * id + occurredAt + tenant) so NATS, Kafka or SQS can be dropped in later
 * without touching business logic.
 */

export const DOMAIN_EVENT_NAMES = [
  'OrganizationCreated',
  'OrganizationClaimed',
  'OrganizationVerified',
  'InvitationCreated',
  'InvitationSent',
  'InvitationAccepted',
  'RelationshipCreated',
  'RelationshipStateChanged',
  'PolicyCreated',
  'PolicyVersionSealed',
  'VerificationRequested',
  'VerificationStarted',
  'VerificationCheckCompleted',
  'VerificationCompleted',
  'VerificationFailed',
  'AssessmentCreated',
  'ConsentRequested',
  'ConsentGranted',
  'ConsentRevoked',
  'AuthorizationGranted',
  'AuthorizationRevoked',
  'CredentialIssued',
  'CredentialRevoked',
  'CampaignCreated',
  'CampaignCompleted',
  'MonitoringEnabled',
  'MonitoringAlertCreated',
  'SubscriptionCreated',
  'SubscriptionChanged',
  'UsageRecorded',
  'InvoiceIssued',
  'PaymentReceived',
  'CustomerLifecycleChanged',
  'CustomerAtRisk',
  'CustomerChurned',
] as const;

export type DomainEventName = (typeof DOMAIN_EVENT_NAMES)[number];

export interface DomainEvent<T = Record<string, unknown>> {
  id: string;
  name: DomainEventName;
  occurredAt: string;
  /** Tenant scope — consumers must respect it. */
  workspaceId?: string;
  organizationId?: string;
  actorId?: string;
  payload: T;
  /** Correlates every event produced while handling one command. */
  correlationId?: string;
}

export type EventHandler = (event: DomainEvent) => void | Promise<void>;

export interface EventBus {
  publish(event: DomainEvent): void;
  subscribe(name: DomainEventName | '*', handler: EventHandler): () => void;
  /** Recent events, newest first — surfaced in the UI event inspector. */
  recent(limit?: number): DomainEvent[];
}

export class InMemoryEventBus implements EventBus {
  private readonly handlers = new Map<string, Set<EventHandler>>();
  private readonly log: DomainEvent[] = [];
  private readonly maxLog: number;

  constructor(maxLog = 500) {
    this.maxLog = maxLog;
  }

  publish(event: DomainEvent): void {
    this.log.unshift(event);
    if (this.log.length > this.maxLog) this.log.length = this.maxLog;
    for (const key of [event.name, '*']) {
      const set = this.handlers.get(key);
      if (!set) continue;
      for (const handler of set) {
        try {
          void handler(event);
        } catch (error) {
          // A failing consumer must never break the producer. A real broker
          // would dead-letter here.
          // eslint-disable-next-line no-console
          console.error(`[event-bus] handler failed for ${event.name}`, error);
        }
      }
    }
  }

  subscribe(name: DomainEventName | '*', handler: EventHandler): () => void {
    const set = this.handlers.get(name) ?? new Set<EventHandler>();
    set.add(handler);
    this.handlers.set(name, set);
    return () => set.delete(handler);
  }

  recent(limit = 50): DomainEvent[] {
    return this.log.slice(0, limit);
  }
}
