import type { CustomerLifecycle } from '../domain/enums.js';
import { NEGATIVE_CUSTOMER_STATES } from '../domain/enums.js';
import type { CustomerLifecycleRecord, Organization } from '../domain/types.js';
import type { PlatformContext } from './context.js';
import type { BillingService } from './billing-service.js';

export interface FunnelStage {
  key: string;
  label: string;
  count: number;
  /** Conversion from the previous stage, as a percentage. */
  conversion: number;
}

export interface RevenueAnalytics {
  mrrPaise: number;
  arrPaise: number;
  subscriptionRevenuePaise: number;
  verificationRevenuePaise: number;
  monitoringRevenuePaise: number;
  apiRevenuePaise: number;
  bgvRevenuePaise: number;
  averageRevenuePerCustomerPaise: number;
  payingCustomers: number;
  members: number;
  expansionRevenuePaise: number;
  churnedRevenuePaise: number;
  netRevenueRetention: number;
}

/**
 * Customer lifecycle (Sections 20, 29, 52).
 *
 * Deliberately separate from organization lifecycle: an organization can be
 * VERIFIED (identity) while its customer state is still BID_MEMBER (commerce).
 */
export class CustomerLifecycleService {
  constructor(private readonly ctx: PlatformContext, private readonly billing: BillingService) {}

  all(): CustomerLifecycleRecord[] {
    return this.ctx.store.customerLifecycle.all();
  }

  forOrganization(organizationId: string): CustomerLifecycleRecord {
    const existing = this.ctx.store.customerLifecycle.first((r) => r.organizationId === organizationId);
    if (existing) return existing;
    const now = this.ctx.now();
    return this.ctx.store.customerLifecycle.insert({
      id: this.ctx.ids.next('clc'),
      organizationId,
      state: 'UNKNOWN',
      enteredAt: now,
      history: [{ state: 'UNKNOWN', at: now }],
      healthScore: 50,
      signals: {
        verificationsLast30d: 0,
        apiCallsLast30d: 0,
        monitoredEntities: 0,
        creditsUsedLast30d: 0,
        policiesCreated: 0,
        openSupportCases: 0,
        featureAdoption: [],
      },
      ownerName: 'Unassigned',
    });
  }

  transition(organizationId: string, state: CustomerLifecycle, note?: string): CustomerLifecycleRecord {
    const record = this.forOrganization(organizationId);
    if (record.state === state) return record;
    const now = this.ctx.now();
    const updated = this.ctx.store.customerLifecycle.update(record.id, {
      state,
      enteredAt: now,
      history: [...record.history, { state, at: now, note }],
      workspaceId: this.ctx.store.workspaces.first((w) => w.organizationId === organizationId)?.id,
    });
    this.ctx.emit(
      'CustomerLifecycleChanged',
      { organizationId, from: record.state, to: state },
      { organizationId },
    );
    if (state === 'AT_RISK') this.ctx.emit('CustomerAtRisk', { organizationId }, { organizationId });
    if (state === 'CHURNED') this.ctx.emit('CustomerChurned', { organizationId }, { organizationId });
    this.ctx.audit({
      organizationId,
      action: 'customer.lifecycle_changed',
      resourceType: 'customer_lifecycle',
      resourceId: record.id,
      summary: `Customer lifecycle ${record.state} → ${state}${note ? ` (${note})` : ''}.`,
      metadata: { from: record.state, to: state },
    });
    return updated;
  }

  updateSignals(organizationId: string, signals: Partial<CustomerLifecycleRecord['signals']>): CustomerLifecycleRecord {
    const record = this.forOrganization(organizationId);
    const merged = { ...record.signals, ...signals };
    return this.ctx.store.customerLifecycle.update(record.id, {
      signals: merged,
      healthScore: computeHealth(merged, record.state),
    });
  }

  setOwner(organizationId: string, ownerName: string): CustomerLifecycleRecord {
    const record = this.forOrganization(organizationId);
    return this.ctx.store.customerLifecycle.update(record.id, { ownerName });
  }

  /** Recomputes health for every tracked customer — run on a schedule in prod. */
  recomputeAll(): void {
    for (const record of this.all()) {
      this.ctx.store.customerLifecycle.update(record.id, { healthScore: computeHealth(record.signals, record.state) });
    }
  }

  board(): Record<string, CustomerLifecycleRecord[]> {
    const board: Record<string, CustomerLifecycleRecord[]> = {};
    for (const record of this.all()) {
      board[record.state] = board[record.state] ?? [];
      board[record.state].push(record);
    }
    return board;
  }

  atRisk(): CustomerLifecycleRecord[] {
    return this.all().filter((r) => NEGATIVE_CUSTOMER_STATES.includes(r.state) || r.healthScore < 45);
  }

  /**
   * The acquisition flywheel (Section 52). Every stage is derived from real
   * records in the store, not from a hard-coded funnel.
   */
  funnel(): FunnelStage[] {
    const organizations = this.ctx.store.organizations.all();
    const invited = organizations.filter((o) => o.lifecycle !== 'DISCOVERED').length;
    const registered = organizations.filter((o) =>
      ['REGISTERED', 'VERIFIED', 'ACTIVE', 'SUSPENDED'].includes(o.lifecycle),
    ).length;
    const members = organizations.filter((o) => o.commercialState !== 'NON_MEMBER').length;
    const verified = organizations.filter((o) =>
      ['VERIFIED_MEMBER', 'REQUESTER', 'CUSTOMER', 'ENTERPRISE'].includes(o.commercialState),
    ).length;
    const requesters = organizations.filter((o) => ['REQUESTER', 'CUSTOMER', 'ENTERPRISE'].includes(o.commercialState)).length;
    const requesterIds = new Set(
      organizations.filter((o) => ['REQUESTER', 'CUSTOMER', 'ENTERPRISE'].includes(o.commercialState)).map((o) => o.id),
    );
    const firstVerification = new Set(
      this.ctx.store.verificationRequests
        .all()
        .map((r) => r.requesterOrganizationId)
        .filter((id) => requesterIds.has(id)),
    ).size;
    const paid = this.ctx.store.subscriptions.find((s) => s.status === 'ACTIVE' && requesterIds.has(s.organizationId)).length;
    const expanding = this.all().filter((r) => r.state === 'EXPANDING' || r.state === 'ENTERPRISE').length;

    const stages: { key: string; label: string; count: number }[] = [
      { key: 'invited', label: 'Invited', count: invited },
      { key: 'registered', label: 'Registered', count: registered },
      { key: 'member', label: 'BID Member', count: members },
      { key: 'verified', label: 'Verified member', count: verified },
      { key: 'requester', label: 'Requester', count: requesters },
      { key: 'first_verification', label: 'First verification', count: firstVerification },
      { key: 'paid', label: 'Paid customer', count: paid },
      { key: 'expansion', label: 'Expansion', count: expanding },
    ];

    return stages.map((stage, index) => {
      const previous = index === 0 ? stage.count : stages[index - 1].count;
      return {
        ...stage,
        conversion: previous > 0 ? Math.min(100, Math.round((stage.count / previous) * 100)) : 0,
      };
    });
  }

  revenue(): RevenueAnalytics {
    const subscriptions = this.ctx.store.subscriptions.find((s) => s.status === 'ACTIVE');
    let subscriptionRevenue = 0;
    let monitoringRevenue = 0;
    for (const subscription of subscriptions) {
      const plan = this.billing.plan(subscription.planId);
      subscriptionRevenue += plan?.monthlyPricePaise ?? 0;
      monitoringRevenue += subscription.monitoredEntities * this.billing.priceBook().monitoringPerEntityMonthPaise;
    }

    const usage = this.ctx.store.usage.all();
    const byMetric = (metric: string) =>
      usage.filter((u) => u.metric === metric).reduce((sum, u) => sum + u.amountPaise, 0);

    const verificationRevenue = byMetric('CHECK') + byMetric('REVERIFICATION') + byMetric('ENHANCED_DD');
    const bgvRevenue = byMetric('BGV');
    const apiRevenue = byMetric('API_CALL');

    const mrr = subscriptionRevenue + verificationRevenue + monitoringRevenue + apiRevenue + bgvRevenue;
    const payingCustomers = subscriptions.length;
    const members = this.ctx.store.organizations.count((o) => o.commercialState !== 'NON_MEMBER');
    const churned = this.ctx.store.subscriptions.find((s) => s.status === 'CANCELLED');
    const churnedRevenue = churned.reduce((sum, s) => sum + (this.billing.plan(s.planId)?.monthlyPricePaise ?? 0), 0);
    const expansionRevenue = verificationRevenue + monitoringRevenue;

    return {
      mrrPaise: mrr,
      arrPaise: mrr * 12,
      subscriptionRevenuePaise: subscriptionRevenue,
      verificationRevenuePaise: verificationRevenue,
      monitoringRevenuePaise: monitoringRevenue,
      apiRevenuePaise: apiRevenue,
      bgvRevenuePaise: bgvRevenue,
      averageRevenuePerCustomerPaise: payingCustomers ? Math.round(mrr / payingCustomers) : 0,
      payingCustomers,
      members,
      expansionRevenuePaise: expansionRevenue,
      churnedRevenuePaise: churnedRevenue,
      netRevenueRetention:
        subscriptionRevenue > 0
          ? Math.round(((subscriptionRevenue + expansionRevenue - churnedRevenue) / subscriptionRevenue) * 100)
          : 100,
    };
  }

  organizationFor(record: CustomerLifecycleRecord): Organization | undefined {
    return this.ctx.store.organizations.get(record.organizationId);
  }
}

function computeHealth(signals: CustomerLifecycleRecord['signals'], state: CustomerLifecycle): number {
  let score = 50;
  score += Math.min(20, signals.verificationsLast30d * 2);
  score += Math.min(10, signals.monitoredEntities / 5);
  score += Math.min(10, signals.featureAdoption.length * 2);
  score += Math.min(5, signals.policiesCreated * 2);
  score += signals.apiCallsLast30d > 0 ? 5 : 0;
  score -= signals.openSupportCases * 3;
  if (NEGATIVE_CUSTOMER_STATES.includes(state)) score -= 20;
  if (signals.verificationsLast30d === 0) score -= 10;
  return Math.max(0, Math.min(100, Math.round(score)));
}
