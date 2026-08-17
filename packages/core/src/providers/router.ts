import type { CheckDefinition, ProviderRecord } from '../domain/types.js';
import type { ProviderCheckRequest, ProviderCheckResponse, ProviderRegistry, VerificationProvider } from './provider.js';

/**
 * Provider router.
 *
 * Chooses which provider executes a check and falls back when one is
 * unavailable. Routing strategy is configuration, not business logic, so BID
 * can later add cost-optimized, SLA-based, geographic or quality-weighted
 * routing without touching the verification engine.
 */
export type RoutingStrategy = 'PRIORITY' | 'COST' | 'SLA' | 'QUALITY';

export interface RoutingDecision {
  provider: VerificationProvider;
  record: ProviderRecord;
  strategy: RoutingStrategy;
  candidates: string[];
  reason: string;
}

export interface RouterExecution {
  response: ProviderCheckResponse;
  decision: RoutingDecision;
  attempts: { providerId: string; outcome: ProviderCheckResponse['outcome']; latencyMs: number }[];
  fallbackFrom?: string;
  costPaise: number;
}

export class ProviderRouter {
  constructor(
    private readonly registry: ProviderRegistry,
    private readonly records: () => ProviderRecord[],
    private readonly strategy: RoutingStrategy = 'PRIORITY',
  ) {}

  candidatesFor(definition: CheckDefinition, country: string): { provider: VerificationProvider; record: ProviderRecord }[] {
    const records = new Map(this.records().map((r) => [r.id, r]));
    const candidates = this.registry
      .all()
      .filter((provider) => provider.supports(definition, country))
      .map((provider) => ({ provider, record: records.get(provider.id) }))
      .filter((entry): entry is { provider: VerificationProvider; record: ProviderRecord } => Boolean(entry.record?.enabled));

    return candidates.sort((a, b) => this.compare(a.record, b.record, definition));
  }

  private compare(a: ProviderRecord, b: ProviderRecord, definition: CheckDefinition): number {
    switch (this.strategy) {
      case 'COST':
        return a.costMultiplier - b.costMultiplier;
      case 'SLA':
        return a.slaHours - b.slaHours;
      case 'QUALITY':
        return b.qualityScore - a.qualityScore;
      case 'PRIORITY':
      default: {
        // Prefer a provider whose primary capability matches the check.
        const aPrimary = a.capabilities[0] === definition.capability ? 0 : 1;
        const bPrimary = b.capabilities[0] === definition.capability ? 0 : 1;
        if (aPrimary !== bPrimary) return aPrimary - bPrimary;
        return a.priority - b.priority;
      }
    }
  }

  async execute(request: ProviderCheckRequest): Promise<RouterExecution> {
    const candidates = this.candidatesFor(request.definition, request.country);
    if (candidates.length === 0) {
      throw new Error(
        `No enabled provider offers capability ${request.definition.capability} for country ${request.country}.`,
      );
    }

    const attempts: RouterExecution['attempts'] = [];
    let fallbackFrom: string | undefined;

    for (const candidate of candidates) {
      const response = await candidate.provider.execute(request);
      attempts.push({ providerId: candidate.provider.id, outcome: response.outcome, latencyMs: response.latencyMs });

      if (response.outcome !== 'UNAVAILABLE') {
        return {
          response,
          decision: this.decisionFor(candidate, candidates, request.definition),
          attempts,
          fallbackFrom,
          costPaise: Math.round(request.definition.unitCostPaise * candidate.record.costMultiplier),
        };
      }
      fallbackFrom = candidate.provider.id;
    }

    // Every candidate was unavailable — report the last attempt honestly.
    const last = candidates[candidates.length - 1];
    return {
      response: {
        outcome: 'UNAVAILABLE',
        confidence: 0,
        summary: `${request.definition.label} could not be executed: no provider in the route was available.`,
        normalized: { attempted: candidates.length },
        reference: 'NO-ROUTE',
        latencyMs: attempts.reduce((sum, a) => sum + a.latencyMs, 0),
      },
      decision: this.decisionFor(last, candidates, request.definition),
      attempts,
      fallbackFrom,
      costPaise: 0,
    };
  }

  private decisionFor(
    chosen: { provider: VerificationProvider; record: ProviderRecord },
    candidates: { provider: VerificationProvider; record: ProviderRecord }[],
    definition: CheckDefinition,
  ): RoutingDecision {
    const reasonByStrategy: Record<RoutingStrategy, string> = {
      PRIORITY: `Primary route for ${definition.capability} capability (priority ${chosen.record.priority}).`,
      COST: `Lowest cost multiplier (${chosen.record.costMultiplier}×) among ${candidates.length} candidates.`,
      SLA: `Fastest committed SLA (${chosen.record.slaHours}h) among ${candidates.length} candidates.`,
      QUALITY: `Highest quality score (${chosen.record.qualityScore}) among ${candidates.length} candidates.`,
    };
    return {
      provider: chosen.provider,
      record: chosen.record,
      strategy: this.strategy,
      candidates: candidates.map((c) => c.provider.id),
      reason: reasonByStrategy[this.strategy],
    };
  }
}
