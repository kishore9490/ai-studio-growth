/**
 * Identifier utilities.
 *
 * Two distinct kinds of identifier exist in BID Trust:
 *
 *  1. Internal surrogate keys (`org_…`, `vr_…`) — opaque, never shown as a
 *     trust signal, safe to regenerate across environments.
 *  2. BID IDs (`BID-BUS-00231`) — the public, human-quotable identifier of a
 *     subject in the BID network. Namespaced, monotonically allocated, stable
 *     for the lifetime of the subject.
 *
 * A BID ID is an identifier issued by an independent private platform.
 * It is NOT a government identity and carries no governmental endorsement.
 */

export type BidNamespace =
  | 'BUS' // business / organization
  | 'PER' // person
  | 'CRD' // credential
  | 'REL' // relationship
  | 'POL' // policy
  | 'VER' // verification
  | 'CMP'; // campaign

export const BID_NAMESPACE_LABEL: Record<BidNamespace, string> = {
  BUS: 'Organization',
  PER: 'Person',
  CRD: 'Credential',
  REL: 'Relationship',
  POL: 'Policy',
  VER: 'Verification',
  CMP: 'Campaign',
};

const BID_ID_PATTERN = /^BID-(BUS|PER|CRD|REL|POL|VER|CMP)-(\d{5,})$/;

export function formatBidId(namespace: BidNamespace, sequence: number): string {
  return `BID-${namespace}-${String(sequence).padStart(5, '0')}`;
}

export function isBidId(value: string): boolean {
  return BID_ID_PATTERN.test(value.trim().toUpperCase());
}

export function parseBidId(value: string): { namespace: BidNamespace; sequence: number } | null {
  const match = BID_ID_PATTERN.exec(value.trim().toUpperCase());
  if (!match) return null;
  return { namespace: match[1] as BidNamespace, sequence: Number(match[2]) };
}

/**
 * Allocates BID IDs per namespace. In production this is backed by a database
 * sequence (see `prisma/schema.prisma` → `bid_ids`); here it is in-memory so
 * the same allocation semantics can run in the browser demo.
 */
export class BidIdAllocator {
  private readonly counters = new Map<BidNamespace, number>();

  constructor(seed?: Partial<Record<BidNamespace, number>>) {
    for (const [ns, value] of Object.entries(seed ?? {})) {
      this.counters.set(ns as BidNamespace, value as number);
    }
  }

  next(namespace: BidNamespace): string {
    const current = this.counters.get(namespace) ?? 0;
    const next = current + 1;
    this.counters.set(namespace, next);
    return formatBidId(namespace, next);
  }

  /** Reserve a specific sequence (used by seed data so demo IDs are stable). */
  reserve(bidId: string): void {
    const parsed = parseBidId(bidId);
    if (!parsed) return;
    const current = this.counters.get(parsed.namespace) ?? 0;
    if (parsed.sequence > current) this.counters.set(parsed.namespace, parsed.sequence);
  }

  snapshot(): Record<string, number> {
    return Object.fromEntries(this.counters.entries());
  }
}

/** Deterministic, collision-resistant-enough surrogate key generator. */
export class SurrogateIdFactory {
  private counter = 0;

  constructor(private readonly prefixSeparator = '_') {}

  next(prefix: string): string {
    this.counter += 1;
    const suffix = this.counter.toString(36).padStart(4, '0');
    return `${prefix}${this.prefixSeparator}${suffix}`;
  }
}

/** Deterministic 32-bit hash — used by mock providers to produce stable results. */
export function stableHash(input: string): number {
  let hash = 2166136261;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

/** Deterministic pseudo-random float in [0,1) derived from a string seed. */
export function seededUnit(seed: string): number {
  return (stableHash(seed) % 100000) / 100000;
}
