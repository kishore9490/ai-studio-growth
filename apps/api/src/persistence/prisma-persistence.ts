import { PrismaClient } from '@prisma/client';
import type { BidPlatform, MutationKind, MutationSink } from '@bid/core';
import { toRecord, toRow } from './codec.js';
import { COLLECTION_TO_MODEL, modelShape, persistenceOrder } from './model-map.js';

type Delegate = {
  findMany(args?: unknown): Promise<Record<string, unknown>[]>;
  upsert(args: unknown): Promise<unknown>;
  delete(args: unknown): Promise<unknown>;
  count(): Promise<number>;
};

interface PendingWrite {
  kind: MutationKind;
  value?: Record<string, unknown>;
}

/** Row in `bid_ids` holding the surrogate-key counter. */
const SURROGATE_NAMESPACE = '__surrogate';

/**
 * Durable persistence for the platform store.
 *
 * The domain layer stays synchronous — services read and mutate an in-memory
 * working set and never await a database. This class subscribes to those
 * mutations and writes them through to PostgreSQL, then reloads them at boot.
 * The trade is deliberate: domain code that can run in a browser, with a single
 * process owning the write path.
 *
 * Writes are coalesced per record and flushed in one transaction, ordered so
 * that referenced rows land before the rows referencing them.
 */
export class PrismaPersistence implements MutationSink {
  private readonly pending = new Map<string, Map<string, PendingWrite>>();
  private readonly order = persistenceOrder();
  private flushing: Promise<void> = Promise.resolve();
  private lastError: Error | undefined;
  private checkpoint: (() => { surrogateCounter: number }) | undefined;

  constructor(private readonly prisma: PrismaClient) {}

  static async connect(databaseUrl: string): Promise<PrismaPersistence> {
    const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
    await prisma.$connect();
    return new PrismaPersistence(prisma);
  }

  /* ---------------- MutationSink ---------------- */

  record(collection: string, kind: MutationKind, id: string, value?: unknown): void {
    if (!COLLECTION_TO_MODEL[collection]) return;
    let bucket = this.pending.get(collection);
    if (!bucket) {
      bucket = new Map();
      this.pending.set(collection, bucket);
    }
    // Last write wins: only the final state of a record within a flush window
    // reaches the database, so a create-then-update pair costs one statement.
    bucket.set(id, { kind, value: value as Record<string, unknown> | undefined });
  }

  /* ---------------- lifecycle ---------------- */

  /**
   * Loads every table into the store, then lets the platform re-derive the
   * allocator and audit-chain state it needs to continue issuing identifiers
   * where the previous process stopped.
   */
  async hydrate(platform: BidPlatform): Promise<number> {
    const collections = platform.store.collections();
    let loaded = 0;

    for (const name of this.order) {
      const collection = collections[name];
      if (!collection) continue;
      const shape = modelShape(COLLECTION_TO_MODEL[name]);
      const rows = await this.delegate(shape.delegate).findMany();
      collection.hydrate(rows.map((row) => toRecord(shape, row) as { id: string }));
      loaded += rows.length;
    }

    platform.resumeFromStore({ surrogateCounter: await this.readSurrogateCounter() });
    this.track(platform);
    return loaded;
  }

  /**
   * Records the platform's allocator checkpoint on every flush, so a restart
   * never re-issues a surrogate key the previous process handed out.
   */
  track(platform: BidPlatform): void {
    this.checkpoint = () => platform.idCheckpoint();
  }

  private async readSurrogateCounter(): Promise<number> {
    const rows = await this.delegate('bidIdSequence').findMany();
    const row = rows.find((candidate) => candidate.namespace === SURROGATE_NAMESPACE);
    return typeof row?.current === 'number' ? row.current : 0;
  }

  /** True when the database has never been written to. */
  async isEmpty(): Promise<boolean> {
    return (await this.delegate('organization').count()) === 0;
  }

  /**
   * Applies everything buffered so far.
   *
   * Callers that must not report success before the data is durable — the HTTP
   * layer, mainly — await this. Concurrent calls queue behind each other so
   * two flushes never interleave their transactions.
   */
  flush(): Promise<void> {
    // A previous failure must not poison the chain: swallow it here (it is
    // already recorded on `lastError`) so the retry actually runs.
    const next = this.flushing.catch(() => undefined).then(() => this.drain());
    this.flushing = next.catch((error) => {
      this.lastError = error instanceof Error ? error : new Error(String(error));
    });
    return next;
  }

  async disconnect(): Promise<void> {
    await this.flush().catch(() => undefined);
    await this.prisma.$disconnect();
  }

  /** Set when a flush failed; the process should be treated as degraded. */
  error(): Error | undefined {
    return this.lastError;
  }

  /* ---------------- internals ---------------- */

  private delegate(name: string, client: unknown = this.prisma): Delegate {
    const delegate = (client as Record<string, Delegate>)[name];
    if (!delegate) throw new Error(`Prisma delegate not found: ${name}`);
    return delegate;
  }

  private async drain(): Promise<void> {
    if (this.pending.size === 0) return;

    const batch = new Map(this.pending);
    this.pending.clear();

    // Statements are planned first and executed inside the transaction, so
    // every write in a batch shares one atomic unit.
    const statements: ((client: unknown) => Promise<unknown>)[] = [];

    // Upserts follow dependency order; deletes run in reverse, so a parent is
    // never removed while a child still points at it.
    for (const collection of this.order) {
      const writes = batch.get(collection);
      if (!writes) continue;
      const shape = modelShape(COLLECTION_TO_MODEL[collection]);

      for (const [id, write] of orderForInsert(writes, shape.selfReferences)) {
        if (write.kind === 'remove' || !write.value) continue;
        const data = toRow(shape, write.value);
        statements.push((client) =>
          this.delegate(shape.delegate, client).upsert({ where: { id }, create: data, update: data }),
        );
      }
    }

    for (const collection of [...this.order].reverse()) {
      const writes = batch.get(collection);
      if (!writes) continue;
      const shape = modelShape(COLLECTION_TO_MODEL[collection]);
      for (const [id, write] of writes) {
        if (write.kind !== 'remove') continue;
        statements.push((client) =>
          // Removing a row that was never persisted is not an error.
          this.delegate(shape.delegate, client).delete({ where: { id } }).catch(() => undefined),
        );
      }
    }

    if (statements.length === 0) return;

    // The allocator checkpoint rides in the same transaction as the rows it
    // describes, so the counter can never be behind the data it must not
    // collide with.
    const surrogateCounter = this.checkpoint?.().surrogateCounter;
    if (surrogateCounter !== undefined) {
      statements.push((client) =>
        (client as Record<string, { upsert(args: unknown): Promise<unknown> }>).bidIdSequence.upsert({
          where: { namespace: SURROGATE_NAMESPACE },
          create: { namespace: SURROGATE_NAMESPACE, current: surrogateCounter },
          update: { current: surrogateCounter },
        }),
      );
    }

    try {
      await this.prisma.$transaction(
        async (tx) => {
          for (const statement of statements) await statement(tx);
        },
        { timeout: 30_000 },
      );
    } catch (error) {
      // Put the batch back so the next flush retries rather than silently
      // losing writes the in-memory store already considers applied.
      for (const [collection, writes] of batch) {
        const existing = this.pending.get(collection);
        if (!existing) {
          this.pending.set(collection, writes);
          continue;
        }
        for (const [id, write] of writes) if (!existing.has(id)) existing.set(id, write);
      }
      throw error;
    }
  }
}

/**
 * Orders rows within one table so a row referencing a sibling is written after
 * it — the self-referencing case foreign keys still enforce inside a single
 * table (an organization introduced by another organization, for example).
 */
function orderForInsert(
  writes: Map<string, PendingWrite>,
  selfReferences: string[],
): [string, PendingWrite][] {
  const entries = [...writes.entries()];
  if (selfReferences.length === 0) return entries;

  const remaining = new Map(entries);
  const emitted = new Set<string>();
  const ordered: [string, PendingWrite][] = [];

  let progressed = true;
  while (remaining.size > 0 && progressed) {
    progressed = false;
    for (const [id, write] of [...remaining]) {
      const parents = selfReferences
        .map((field) => write.value?.[field])
        .filter((value): value is string => typeof value === 'string' && value !== id);
      // A parent outside this batch is already in the database; only parents
      // still queued behind us force a wait.
      if (parents.some((parent) => remaining.has(parent) && !emitted.has(parent))) continue;
      ordered.push([id, write]);
      emitted.add(id);
      remaining.delete(id);
      progressed = true;
    }
  }

  // A reference cycle cannot be ordered; emit the rest and let the database
  // reject it loudly rather than dropping the writes.
  return [...ordered, ...remaining.entries()];
}
