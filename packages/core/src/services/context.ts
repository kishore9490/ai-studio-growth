import type { AuditLogEntry, Notification } from '../domain/types.js';
import type { DomainEvent, DomainEventName, EventBus } from '../events/events.js';
import type { ProviderRouter } from '../providers/router.js';
import type { ProviderRegistry } from '../providers/provider.js';
import type { BidStore } from '../store/store.js';
import type { Clock } from '../util/clock.js';
import { BidIdAllocator, SurrogateIdFactory, stableHash } from '../util/id.js';
import type { AccessContext } from '../security/access.js';

export interface AuditInput {
  ctx?: AccessContext;
  actorType?: AuditLogEntry['actorType'];
  actorId?: string;
  actorName?: string;
  action: string;
  resourceType: string;
  resourceId: string;
  summary: string;
  metadata?: Record<string, string | number | boolean>;
  workspaceId?: string;
  organizationId?: string;
}

export interface NotifyInput {
  workspaceId?: string;
  organizationId?: string;
  kind: string;
  title: string;
  body: string;
  link?: string;
  severity?: Notification['severity'];
  channel?: Notification['channel'];
}

/**
 * Shared service context. Everything a service needs is injected here so that
 * services stay free of framework and transport concerns and can run unchanged
 * in the browser demo, in the API process, or in a test.
 */
export class PlatformContext {
  readonly store: BidStore;
  readonly bus: EventBus;
  readonly clock: Clock;
  readonly ids: SurrogateIdFactory;
  readonly bidIds: BidIdAllocator;
  readonly registry: ProviderRegistry;
  readonly router: ProviderRouter;

  private lastAuditHash = 'GENESIS';

  constructor(args: {
    store: BidStore;
    bus: EventBus;
    clock: Clock;
    ids: SurrogateIdFactory;
    bidIds: BidIdAllocator;
    registry: ProviderRegistry;
    router: ProviderRouter;
  }) {
    this.store = args.store;
    this.bus = args.bus;
    this.clock = args.clock;
    this.ids = args.ids;
    this.bidIds = args.bidIds;
    this.registry = args.registry;
    this.router = args.router;
  }

  now(): string {
    return this.clock.isoNow();
  }

  /**
   * Continues an existing audit chain instead of starting a new one.
   *
   * Called after hydrating from a database: without it a restart would begin a
   * second chain at GENESIS, and the break would be indistinguishable from a
   * tampered log.
   */
  resumeAuditChain(hash: string): void {
    this.lastAuditHash = hash;
  }

  /**
   * Appends a hash-chained audit entry. Each entry embeds the previous hash so
   * that removal or edit of any entry is detectable (evidence integrity,
   * Section 35). Demo build uses a fast non-cryptographic hash; production
   * uses SHA-256 with a signing key held in the secrets manager.
   */
  audit(input: AuditInput): AuditLogEntry {
    const at = this.now();
    const id = this.ids.next('aud');
    const previousHash = this.lastAuditHash;
    const material = `${previousHash}|${id}|${at}|${input.action}|${input.resourceType}|${input.resourceId}`;
    const hash = stableHash(material).toString(16).padStart(8, '0');
    this.lastAuditHash = hash;

    const entry: AuditLogEntry = {
      id,
      at,
      actorType: input.actorType ?? (input.ctx ? 'USER' : 'SYSTEM'),
      actorId: input.actorId ?? input.ctx?.userId ?? 'system',
      actorName: input.actorName ?? input.ctx?.userName ?? 'BID system',
      workspaceId: input.workspaceId ?? input.ctx?.workspaceId,
      organizationId: input.organizationId ?? input.ctx?.organizationId,
      action: input.action,
      resourceType: input.resourceType,
      resourceId: input.resourceId,
      summary: input.summary,
      metadata: input.metadata ?? {},
      hash,
      previousHash,
    };
    this.store.auditLogs.insert(entry);
    return entry;
  }

  notify(input: NotifyInput): Notification {
    const notification: Notification = {
      id: this.ids.next('ntf'),
      workspaceId: input.workspaceId,
      organizationId: input.organizationId,
      channel: input.channel ?? 'IN_APP',
      kind: input.kind,
      title: input.title,
      body: input.body,
      read: false,
      createdAt: this.now(),
      link: input.link,
      severity: input.severity ?? 'INFO',
    };
    this.store.notifications.insert(notification);
    return notification;
  }

  emit<T extends Record<string, unknown>>(
    name: DomainEventName,
    payload: T,
    scope?: { workspaceId?: string; organizationId?: string; actorId?: string; correlationId?: string },
  ): DomainEvent<T> {
    const event: DomainEvent<T> = {
      id: this.ids.next('evt'),
      name,
      occurredAt: this.now(),
      workspaceId: scope?.workspaceId,
      organizationId: scope?.organizationId,
      actorId: scope?.actorId,
      correlationId: scope?.correlationId,
      payload,
    };
    this.bus.publish(event as DomainEvent);
    return event;
  }
}
