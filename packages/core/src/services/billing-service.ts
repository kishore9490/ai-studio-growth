import type { Entitlements, Invoice, Payment, Plan, Subscription, UsageRecord } from '../domain/types.js';
import { DEFAULT_USAGE_PRICES, type UsagePriceBook } from '../billing/pricing.js';
import { assertPermission, type AccessContext } from '../security/access.js';
import { addDays } from '../util/clock.js';
import type { PlatformContext } from './context.js';

export interface UsageSummary {
  period: string;
  includedChecks: number;
  usedChecks: number;
  overageChecks: number;
  monitoringEntities: number;
  apiCalls: number;
  bgvChecks: number;
  subscriptionPaise: number;
  overagePaise: number;
  monitoringPaise: number;
  totalPaise: number;
  creditBalance: number;
}

/**
 * Billing (Sections 30-31).
 *
 * Members consume free capabilities; requesters consume metered ones. The
 * entitlement object — not the plan name — is what authorization checks read,
 * so plans stay pure configuration.
 */
export class BillingService {
  private usagePrices: UsagePriceBook = { ...DEFAULT_USAGE_PRICES };

  constructor(private readonly ctx: PlatformContext) {}

  /* ---------------- plans ---------------- */

  plans(): Plan[] {
    return this.ctx.store.plans.all().sort((a, b) => a.monthlyPricePaise - b.monthlyPricePaise);
  }

  plan(id: string): Plan | undefined {
    return this.ctx.store.plans.get(id);
  }

  planByTier(tier: Plan['tier']): Plan | undefined {
    return this.ctx.store.plans.first((p) => p.tier === tier);
  }

  /** Admin-configurable pricing — no price is compiled into business logic. */
  updatePlan(id: string, patch: Partial<Plan>, actor?: AccessContext): Plan {
    const plan = this.ctx.store.plans.update(id, patch);
    this.ctx.audit({
      ctx: actor,
      action: 'billing.plan_updated',
      resourceType: 'plan',
      resourceId: id,
      summary: `Plan "${plan.name}" updated by BID admin.`,
      metadata: { fields: Object.keys(patch).join(',') },
    });
    return plan;
  }

  priceBook(): UsagePriceBook {
    return { ...this.usagePrices };
  }

  updatePriceBook(patch: Partial<UsagePriceBook>, actor?: AccessContext): UsagePriceBook {
    this.usagePrices = { ...this.usagePrices, ...patch };
    this.ctx.audit({
      ctx: actor,
      action: 'billing.price_book_updated',
      resourceType: 'price_book',
      resourceId: 'default',
      summary: 'Usage price book updated by BID admin.',
      metadata: { fields: Object.keys(patch).join(',') },
    });
    return this.priceBook();
  }

  /* ---------------- subscriptions ---------------- */

  subscriptionFor(workspaceId: string): Subscription | undefined {
    return this.ctx.store.subscriptions.first((s) => s.workspaceId === workspaceId && s.status !== 'CANCELLED');
  }

  /**
   * Entitlements for a workspace. A workspace with no subscription is a MEMBER:
   * free capabilities only (Business Rule 1).
   */
  entitlementsFor(workspaceId: string): Entitlements {
    const subscription = this.subscriptionFor(workspaceId);
    const plan = subscription ? this.plan(subscription.planId) : this.planByTier('MEMBER_FREE');
    return (
      plan?.entitlements ?? {
        canInitiateVerification: false,
        canCreateCampaigns: false,
        canCreatePolicies: false,
        canRunBgv: false,
        canUseMonitoring: false,
        canUseApi: false,
        canUseWebhooks: false,
        canUseEnterpriseIntegrations: false,
        maxSeats: 1,
        maxMonitoredEntities: 0,
        includedChecksPerMonth: 0,
      }
    );
  }

  subscribe(input: {
    workspaceId: string;
    organizationId: string;
    planId: string;
    seats?: number;
    actor?: AccessContext;
  }): Subscription {
    if (input.actor) assertPermission(input.actor, 'billing:write');
    const now = this.ctx.now();
    const plan = this.ctx.store.plans.require(input.planId);
    const existing = this.subscriptionFor(input.workspaceId);

    if (existing) {
      const updated = this.ctx.store.subscriptions.update(existing.id, { planId: input.planId, status: 'ACTIVE' });
      this.ctx.emit('SubscriptionChanged', { subscriptionId: updated.id, planId: input.planId }, { workspaceId: input.workspaceId });
      this.ctx.audit({
        ctx: input.actor,
        workspaceId: input.workspaceId,
        action: 'billing.plan_changed',
        resourceType: 'subscription',
        resourceId: updated.id,
        summary: `Subscription moved to ${plan.name}.`,
        metadata: { planId: input.planId },
      });
      return updated;
    }

    const subscription: Subscription = {
      id: this.ctx.ids.next('sub'),
      workspaceId: input.workspaceId,
      organizationId: input.organizationId,
      planId: input.planId,
      status: 'ACTIVE',
      startedAt: now,
      renewsAt: addDays(now, 30),
      seats: input.seats ?? 3,
      monitoredEntities: 0,
    };
    this.ctx.store.subscriptions.insert(subscription);
    this.ctx.store.workspaces.update(input.workspaceId, { requesterEnabled: plan.entitlements.canInitiateVerification });

    this.ctx.audit({
      ctx: input.actor,
      workspaceId: input.workspaceId,
      organizationId: input.organizationId,
      action: 'billing.subscribed',
      resourceType: 'subscription',
      resourceId: subscription.id,
      summary: `Subscribed to ${plan.name} (${plan.includedChecks} included checks/month).`,
      metadata: { planId: plan.id, tier: plan.tier },
    });
    this.ctx.emit(
      'SubscriptionCreated',
      { subscriptionId: subscription.id, planId: plan.id, organizationId: input.organizationId },
      { workspaceId: input.workspaceId, organizationId: input.organizationId },
    );
    return subscription;
  }

  cancel(workspaceId: string, actor?: AccessContext): Subscription | undefined {
    const subscription = this.subscriptionFor(workspaceId);
    if (!subscription) return undefined;
    const cancelled = this.ctx.store.subscriptions.update(subscription.id, {
      status: 'CANCELLED',
      cancelledAt: this.ctx.now(),
    });
    this.ctx.store.workspaces.update(workspaceId, { requesterEnabled: false });
    this.ctx.audit({
      ctx: actor,
      workspaceId,
      action: 'billing.cancelled',
      resourceType: 'subscription',
      resourceId: subscription.id,
      summary: 'Subscription cancelled. Workspace reverts to free BID Member capabilities.',
      metadata: {},
    });
    return cancelled;
  }

  /* ---------------- usage & credits ---------------- */

  period(at?: string): string {
    return (at ?? this.ctx.now()).slice(0, 7);
  }

  recordUsage(input: {
    workspaceId: string;
    metric: UsageRecord['metric'];
    quantity: number;
    amountPaise: number;
    reference?: string;
  }): UsageRecord {
    const record: UsageRecord = {
      id: this.ctx.ids.next('usg'),
      workspaceId: input.workspaceId,
      period: this.period(),
      metric: input.metric,
      quantity: input.quantity,
      amountPaise: input.amountPaise,
      reference: input.reference,
      createdAt: this.ctx.now(),
    };
    this.ctx.store.usage.insert(record);
    this.ctx.emit('UsageRecorded', { metric: record.metric, quantity: record.quantity }, { workspaceId: input.workspaceId });
    return record;
  }

  usageFor(workspaceId: string, period?: string): UsageRecord[] {
    const target = period ?? this.period();
    return this.ctx.store.usage.find((u) => u.workspaceId === workspaceId && u.period === target);
  }

  wallet(workspaceId: string) {
    let wallet = this.ctx.store.creditWallets.first((w) => w.workspaceId === workspaceId);
    if (!wallet) {
      wallet = this.ctx.store.creditWallets.insert({
        id: this.ctx.ids.next('wlt'),
        workspaceId,
        balance: 0,
        updatedAt: this.ctx.now(),
      });
    }
    return wallet;
  }

  addCredits(workspaceId: string, amount: number, reason: string, reference?: string) {
    const wallet = this.wallet(workspaceId);
    const updated = this.ctx.store.creditWallets.update(wallet.id, {
      balance: wallet.balance + amount,
      updatedAt: this.ctx.now(),
    });
    this.ctx.store.creditLedger.insert({
      id: this.ctx.ids.next('cle'),
      walletId: wallet.id,
      delta: amount,
      reason,
      reference,
      createdAt: this.ctx.now(),
    });
    return updated;
  }

  ledger(workspaceId: string) {
    const wallet = this.wallet(workspaceId);
    return this.ctx.store.creditLedger.find((e) => e.walletId === wallet.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  summary(workspaceId: string, period?: string): UsageSummary {
    const target = period ?? this.period();
    const subscription = this.subscriptionFor(workspaceId);
    const plan = subscription ? this.plan(subscription.planId) : this.planByTier('MEMBER_FREE');
    const records = this.usageFor(workspaceId, target);

    const sum = (metric: UsageRecord['metric']) =>
      records.filter((r) => r.metric === metric).reduce((total, r) => total + r.quantity, 0);

    const usedChecks = sum('CHECK') + sum('REVERIFICATION') + sum('ENHANCED_DD');
    const bgvChecks = sum('BGV');
    const includedChecks = plan?.includedChecks ?? 0;
    const overageChecks = Math.max(0, usedChecks + bgvChecks - includedChecks);
    const overagePaise = overageChecks * (plan?.overagePerCheckPaise ?? 0);
    const monitoringEntities = subscription?.monitoredEntities ?? 0;
    const monitoringPaise = monitoringEntities * this.usagePrices.monitoringPerEntityMonthPaise;
    const subscriptionPaise = plan?.monthlyPricePaise ?? 0;

    return {
      period: target,
      includedChecks,
      usedChecks: usedChecks + bgvChecks,
      overageChecks,
      monitoringEntities,
      apiCalls: sum('API_CALL'),
      bgvChecks,
      subscriptionPaise,
      overagePaise,
      monitoringPaise,
      totalPaise: subscriptionPaise + overagePaise + monitoringPaise,
      creditBalance: this.wallet(workspaceId).balance,
    };
  }

  /* ---------------- invoices ---------------- */

  invoices(workspaceId: string): Invoice[] {
    return this.ctx.store.invoices.find((i) => i.workspaceId === workspaceId).sort((a, b) => b.issuedAt.localeCompare(a.issuedAt));
  }

  issueInvoice(workspaceId: string, organizationId: string, period?: string): Invoice {
    const summary = this.summary(workspaceId, period);
    const now = this.ctx.now();
    const subscription = this.subscriptionFor(workspaceId);
    const plan = subscription ? this.plan(subscription.planId) : undefined;

    const lines: Invoice['lines'] = [];
    if (plan && summary.subscriptionPaise > 0) {
      lines.push({
        label: `${plan.name} subscription (${summary.period})`,
        quantity: 1,
        unitPricePaise: summary.subscriptionPaise,
        amountPaise: summary.subscriptionPaise,
      });
    }
    if (summary.overageChecks > 0) {
      lines.push({
        label: 'Verification checks beyond included volume',
        quantity: summary.overageChecks,
        unitPricePaise: plan?.overagePerCheckPaise ?? 0,
        amountPaise: summary.overagePaise,
      });
    }
    if (summary.monitoringPaise > 0) {
      lines.push({
        label: 'Continuous monitoring',
        quantity: summary.monitoringEntities,
        unitPricePaise: this.usagePrices.monitoringPerEntityMonthPaise,
        amountPaise: summary.monitoringPaise,
      });
    }

    const subtotal = lines.reduce((sum, line) => sum + line.amountPaise, 0);
    const tax = Math.round(subtotal * 0.18);
    const invoice: Invoice = {
      id: this.ctx.ids.next('inv'),
      workspaceId,
      organizationId,
      number: `BID/${summary.period.replace('-', '')}/${this.ctx.store.invoices.count() + 1001}`,
      period: summary.period,
      status: 'ISSUED',
      lines,
      subtotalPaise: subtotal,
      taxPaise: tax,
      totalPaise: subtotal + tax,
      issuedAt: now,
      dueAt: addDays(now, 15),
    };
    this.ctx.store.invoices.insert(invoice);
    this.ctx.emit('InvoiceIssued', { invoiceId: invoice.id, totalPaise: invoice.totalPaise }, { workspaceId });
    return invoice;
  }

  recordPayment(invoiceId: string, method: Payment['method'] = 'NEFT'): Payment {
    const invoice = this.ctx.store.invoices.require(invoiceId);
    const now = this.ctx.now();
    const payment: Payment = {
      id: this.ctx.ids.next('pay'),
      invoiceId,
      workspaceId: invoice.workspaceId,
      amountPaise: invoice.totalPaise,
      method,
      reference: `PAY-${invoice.number}`,
      receivedAt: now,
    };
    this.ctx.store.payments.insert(payment);
    this.ctx.store.invoices.update(invoiceId, { status: 'PAID', paidAt: now });
    this.ctx.emit('PaymentReceived', { invoiceId, amountPaise: payment.amountPaise }, { workspaceId: invoice.workspaceId });
    return payment;
  }

  payments(workspaceId: string): Payment[] {
    return this.ctx.store.payments.find((p) => p.workspaceId === workspaceId);
  }
}
