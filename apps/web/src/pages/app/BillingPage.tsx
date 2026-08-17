import { useState } from 'react';
import { CreditCard, Receipt } from 'lucide-react';
import { PRICING_DISCLAIMER } from '@bid/core';
import { usePlatform } from '../../platform/PlatformProvider';
import {
  Badge,
  Button,
  Callout,
  Card,
  DataList,
  EmptyState,
  ProgressBar,
  SectionHeading,
  StatCard,
  Toast,
  cx,
} from '../../components/ui';
import { formatDate, formatInr, humanize, percent } from '../../lib/format';

export function BillingPage() {
  const { platform, workspace, organization, execute } = usePlatform();
  const [toast, setToast] = useState<string | null>(null);

  if (!workspace) {
    return <Callout tone="attention" title="No workspace">Claim your organization to access billing.</Callout>;
  }

  const subscription = platform.billing.subscriptionFor(workspace.id);
  const plan = subscription ? platform.billing.plan(subscription.planId) : platform.billing.planByTier('MEMBER_FREE');
  const summary = platform.billing.summary(workspace.id);
  const invoices = platform.billing.invoices(workspace.id);
  const ledger = platform.billing.ledger(workspace.id);
  const usageRecords = platform.billing.usageFor(workspace.id);
  const plans = platform.billing.plans();

  return (
    <div className="space-y-5">
      <Toast message={toast} onDismiss={() => setToast(null)} />
      <SectionHeading
        title="Billing & usage"
        description="Members use free capabilities. Requesters consume metered ones: checks, monitoring, BGV and API."
        actions={
          <Button
            icon={<Receipt className="h-4 w-4" />}
            onClick={() => {
              void execute((c) => c.issueInvoice());
              setToast('Invoice issued for the current period.');
            }}
          >
            Issue invoice for this period
          </Button>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Plan" value={plan?.name ?? 'BID Member'} sublabel={subscription ? humanize(subscription.status) : 'Free membership'} />
        <StatCard
          label="Checks used"
          value={`${summary.usedChecks}${summary.includedChecks ? ` / ${summary.includedChecks}` : ''}`}
          sublabel={summary.overageChecks ? `${summary.overageChecks} over included` : 'Within included volume'}
          tone={summary.overageChecks ? 'attention' : 'verified'}
        />
        <StatCard label="Credit balance" value={summary.creditBalance} sublabel="Prepaid check credits" />
        <StatCard label="Estimated this period" value={formatInr(summary.totalPaise)} sublabel={summary.period} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <SectionHeading title="Usage breakdown" description={summary.period} />
            <div className="mt-3 space-y-3">
              <div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-500">Verification checks</span>
                  <span className="font-medium text-navy-900">
                    {summary.usedChecks} of {summary.includedChecks || '—'} included
                  </span>
                </div>
                <div className="mt-1">
                  <ProgressBar
                    value={summary.includedChecks ? percent(summary.usedChecks, summary.includedChecks) : 0}
                    tone={summary.overageChecks ? 'attention' : 'brand'}
                  />
                </div>
              </div>
              <DataList
                items={[
                  { label: 'Subscription', value: formatInr(summary.subscriptionPaise) },
                  { label: 'Overage checks', value: `${summary.overageChecks} · ${formatInr(summary.overagePaise)}` },
                  { label: 'Monitoring', value: `${summary.monitoringEntities} entities · ${formatInr(summary.monitoringPaise)}` },
                  { label: 'BGV checks', value: summary.bgvChecks },
                  { label: 'API calls', value: summary.apiCalls },
                  { label: 'Total (estimate)', value: <span className="font-semibold">{formatInr(summary.totalPaise)}</span> },
                ]}
              />
            </div>
          </Card>

          <Card padded={false}>
            <div className="border-b border-slate-200 px-4 py-3">
              <SectionHeading title="Invoices" />
            </div>
            {invoices.length === 0 ? (
              <div className="p-4">
                <EmptyState title="No invoices yet" description="Issue one for the current period to see the line items." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="bid-table">
                  <thead>
                    <tr>
                      <th>Number</th>
                      <th>Period</th>
                      <th>Lines</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((invoice) => (
                      <tr key={invoice.id}>
                        <td className="font-mono text-xs">{invoice.number}</td>
                        <td className="text-xs">{invoice.period}</td>
                        <td className="text-xs">{invoice.lines.length}</td>
                        <td className="text-xs font-medium">{formatInr(invoice.totalPaise)}</td>
                        <td>
                          <Badge tone={invoice.status === 'PAID' ? 'verified' : invoice.status === 'OVERDUE' ? 'exception' : 'info'}>
                            {humanize(invoice.status)}
                          </Badge>
                        </td>
                        <td className="text-right">
                          {invoice.status !== 'PAID' && (
                            <Button
                              size="sm"
                              icon={<CreditCard className="h-3 w-3" />}
                              onClick={() => {
                                void execute((c) => c.recordPayment(invoice.id));
                                setToast(`Payment recorded for ${invoice.number}.`);
                              }}
                            >
                              Record payment
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card padded={false}>
            <div className="border-b border-slate-200 px-4 py-3">
              <SectionHeading title="Metered usage records" description="Written by the billing service in response to verification events." />
            </div>
            <div className="max-h-80 overflow-y-auto">
              <table className="bid-table">
                <thead>
                  <tr>
                    <th>Metric</th>
                    <th>Quantity</th>
                    <th>Amount</th>
                    <th className="text-right">Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {usageRecords.slice(0, 40).map((record) => (
                    <tr key={record.id}>
                      <td className="text-xs">{humanize(record.metric)}</td>
                      <td className="text-xs">{record.quantity}</td>
                      <td className="text-xs">{formatInr(record.amountPaise)}</td>
                      <td className="text-right font-mono text-2xs text-slate-400">{record.reference ?? '—'}</td>
                    </tr>
                  ))}
                  {usageRecords.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-6 text-center text-sm text-slate-500">
                        No metered usage this period.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <SectionHeading title="Plans" description={PRICING_DISCLAIMER} />
            <div className="mt-3 space-y-2">
              {plans.map((candidate) => {
                const active = plan?.id === candidate.id;
                return (
                  <div key={candidate.id} className={cx('rounded border p-3', active ? 'border-brand-500 bg-brand-50' : 'border-slate-200')}>
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-sm font-semibold text-navy-900">{candidate.name}</span>
                      <span className="text-xs font-semibold text-navy-900">
                        {candidate.monthlyPricePaise === 0
                          ? 'Free'
                          : `${candidate.quoteOnly ? 'From ' : ''}${formatInr(candidate.monthlyPricePaise)}/mo`}
                      </span>
                    </div>
                    <p className="mt-1 text-2xs text-slate-600">{candidate.description}</p>
                    {!active && candidate.tier !== 'MEMBER_FREE' && (
                      <Button
                        size="sm"
                        className="mt-2 w-full"
                        onClick={() => {
                          void execute((c) => c.changePlan(candidate.id));
                          setToast(`Subscription moved to ${candidate.name}.`);
                        }}
                      >
                        {plan && plan.monthlyPricePaise < candidate.monthlyPricePaise ? 'Upgrade' : 'Switch'} to {candidate.name}
                      </Button>
                    )}
                    {active && <Badge tone="brand" className="mt-2">Current plan</Badge>}
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <SectionHeading title="Credit ledger" />
            <div className="mt-2 space-y-1.5">
              {ledger.length === 0 && <p className="text-sm text-slate-500">No credit movements.</p>}
              {ledger.slice(0, 8).map((entry) => (
                <div key={entry.id} className="flex items-center justify-between text-xs">
                  <span className="text-slate-600">{entry.reason}</span>
                  <span className={entry.delta >= 0 ? 'text-emerald-700' : 'text-red-700'}>
                    {entry.delta >= 0 ? '+' : ''}
                    {entry.delta}
                  </span>
                </div>
              ))}
            </div>
          </Card>

          {subscription && (
            <Card>
              <SectionHeading title="Subscription" />
              <DataList
                items={[
                  { label: 'Status', value: humanize(subscription.status) },
                  { label: 'Started', value: formatDate(subscription.startedAt) },
                  { label: 'Renews', value: formatDate(subscription.renewsAt) },
                  { label: 'Seats', value: subscription.seats },
                  { label: 'Monitored entities', value: subscription.monitoredEntities },
                ]}
              />
              <Button
                size="sm"
                className="mt-2 w-full"
                onClick={() => {
                  void execute((c) => c.cancelSubscription());
                  setToast('Subscription cancelled. The workspace reverts to free member capabilities.');
                }}
              >
                Cancel subscription
              </Button>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
