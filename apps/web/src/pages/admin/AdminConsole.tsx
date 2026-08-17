import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as ReTooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { PRICING_DISCLAIMER } from '@bid/core';
import { usePlatform } from '../../platform/PlatformProvider';
import {
  Badge,
  Button,
  Callout,
  Card,
  DataList,
  Field,
  ProgressBar,
  SectionHeading,
  StatCard,
  TabPanel,
  Tabs,
  TextInput,
  Toast,
  Toggle,
  cx,
} from '../../components/ui';
import { BidLogo, OrgAvatar } from '../../components/domain';
import { formatDate, formatInr, humanize, relativeTime } from '../../lib/format';

const CHART_COLORS = ['#2559eb', '#0f766e', '#b45309', '#7c3aed', '#0e7490', '#be123c'];

/** BID's own operating console (Sections 29, 40, 53). */
export function AdminConsole() {
  const [tab, setTab] = useState('overview');

  return (
    <div className="min-h-full bg-slate-50">
      <header className="border-b border-navy-800 bg-navy-950">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="text-white">
            <BidLogo />
          </Link>
          <Badge tone="brand" className="bg-brand-500/15 text-brand-200">
            Internal admin console
          </Badge>
          <div className="ml-auto flex items-center gap-2">
            <Link to="/app">
              <Button size="sm">Back to product</Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-4 py-5 sm:px-6">
        <Tabs
          value={tab}
          onChange={setTab}
          tabs={[
            { id: 'overview', label: 'Overview' },
            { id: 'customers', label: 'Customer lifecycle' },
            { id: 'revenue', label: 'Revenue' },
            { id: 'organizations', label: 'Organizations' },
            { id: 'providers', label: 'Providers' },
            { id: 'pricing', label: 'Plans & pricing' },
            { id: 'operations', label: 'Operations' },
          ]}
        />

        <TabPanel id="overview">
          <OverviewTab />
        </TabPanel>
        <TabPanel id="customers">
          <CustomersTab />
        </TabPanel>
        <TabPanel id="revenue">
          <RevenueTab />
        </TabPanel>
        <TabPanel id="organizations">
          <OrganizationsTab />
        </TabPanel>
        <TabPanel id="providers">
          <ProvidersTab />
        </TabPanel>
        <TabPanel id="pricing">
          <PricingTab />
        </TabPanel>
        <TabPanel id="operations">
          <OperationsTab />
        </TabPanel>
      </div>
    </div>
  );
}

function OverviewTab() {
  const { platform } = usePlatform();
  const funnel = platform.lifecycle.funnel();
  const revenue = platform.lifecycle.revenue();
  const organizations = platform.organizations.list();
  const verifications = platform.store.verificationRequests.all();
  const checks = platform.store.verificationChecks.all();
  const alerts = platform.monitoring.allAlerts();

  const completed = verifications.filter((request) => Boolean(request.completedAt)).length;
  const exceptions = verifications.filter((request) =>
    ['REQUIRES_REVIEW', 'FAILED', 'PARTIAL', 'EXPIRED'].includes(request.status),
  ).length;

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard label="Organizations" value={organizations.length} sublabel="in the network" />
        <StatCard label="Members" value={organizations.filter((o) => o.commercialState !== 'NON_MEMBER').length} />
        <StatCard
          label="Paying customers"
          value={revenue.payingCustomers}
          tone="brand"
          sublabel={`${Math.round((revenue.payingCustomers / Math.max(1, organizations.length)) * 100)}% of network`}
        />
        <StatCard label="Verifications" value={verifications.length} sublabel={`${completed} completed`} />
        <StatCard label="Checks executed" value={checks.filter((c) => c.completedAt).length} />
        <StatCard label="MRR" value={formatInr(revenue.mrrPaise, { compact: true })} tone="verified" />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionHeading
            title="Acquisition funnel"
            description="Derived live from the store: invitations, registrations, members, verified members, requesters, first verification, paid, expansion."
          />
          <div className="mt-4 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnel} margin={{ top: 8, right: 8, left: -18, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10 }} interval={0} angle={-18} textAnchor="end" height={60} />
                <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                <ReTooltip contentStyle={{ fontSize: 12 }} />
                <Bar dataKey="count" fill="#2559eb" radius={[3, 3, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-4">
            {funnel.slice(1).map((stage) => (
              <div key={stage.key} className="rounded border border-slate-200 p-2">
                <p className="text-2xs text-slate-500">{stage.label}</p>
                <p className="text-sm font-semibold text-navy-900">{stage.conversion}%</p>
                <ProgressBar value={stage.conversion} tone={stage.conversion > 60 ? 'verified' : 'attention'} />
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeading title="Platform health" />
          <DataList
            items={[
              { label: 'Verification completion', value: `${Math.round((completed / Math.max(1, verifications.length)) * 100)}%` },
              { label: 'Exceptions', value: exceptions },
              { label: 'Open monitoring alerts', value: alerts.filter((alert) => alert.status === 'OPEN').length },
              { label: 'Policies published', value: platform.policies.listAll().length },
              { label: 'Credentials issued', value: platform.store.credentials.count() },
              { label: 'Evidence records', value: platform.store.evidence.count() },
              { label: 'Audit entries', value: platform.store.auditLogs.count() },
              { label: 'Domain events (recent)', value: platform.events(500).length },
            ]}
          />
        </Card>
      </div>
    </div>
  );
}

function CustomersTab() {
  const { platform, run } = usePlatform();
  const records = platform.lifecycle.all();
  const board: Record<string, typeof records> = {};
  for (const record of records) {
    board[record.state] = [...(board[record.state] ?? []), record];
  }

  const atRisk = platform.lifecycle.atRisk();

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Customer lifecycle"
        description="BID's own customer-success engine. Health is computed from login recency, verification volume, API usage, monitoring, policy authoring and open support cases."
        actions={<Button onClick={() => run((p) => p.lifecycle.recomputeAll())}>Recompute health</Button>}
      />

      {atRisk.length > 0 && (
        <Callout tone="attention" title={`${atRisk.length} account(s) need attention`}>
          {atRisk.map((record) => platform.organizations.get(record.organizationId)?.displayName).join(', ')}
        </Callout>
      )}

      <div className="bid-scroll flex gap-3 overflow-x-auto pb-2">
        {Object.entries(board).map(([state, group]) => (
          <div key={state} className="w-64 shrink-0">
            <div className="flex items-center justify-between rounded-t bg-navy-900 px-3 py-2">
              <p className="text-2xs font-semibold uppercase tracking-wider text-white">{humanize(state)}</p>
              <span className="rounded bg-navy-800 px-1.5 text-2xs text-white">{group.length}</span>
            </div>
            <div className="space-y-2 rounded-b border border-t-0 border-slate-200 bg-white p-2">
              {group.map((record) => {
                const organization = platform.organizations.get(record.organizationId);
                if (!organization) return null;
                return (
                  <div key={record.id} className="rounded border border-slate-200 p-2.5">
                    <div className="flex items-center gap-2">
                      <OrgAvatar name={organization.displayName} color={organization.logoColor} text={organization.logoText} size="sm" />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-medium text-navy-900">{organization.displayName}</p>
                        <p className="truncate font-mono text-[10px] text-slate-500">{organization.bidId}</p>
                      </div>
                    </div>
                    <div className="mt-2">
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>Health</span>
                        <span className={cx(record.healthScore < 45 ? 'text-red-600' : 'text-emerald-700')}>{record.healthScore}</span>
                      </div>
                      <ProgressBar value={record.healthScore} tone={record.healthScore < 45 ? 'exception' : 'verified'} />
                    </div>
                    <div className="mt-2 space-y-0.5 text-[10px] text-slate-500">
                      <p>{record.signals.verificationsLast30d} verifications / 30d</p>
                      <p>{record.signals.monitoredEntities} monitored · {record.signals.apiCallsLast30d} API calls</p>
                      <p>Owner: {record.ownerName}</p>
                      <p>Since {formatDate(record.enteredAt)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <Card padded={false}>
        <div className="border-b border-slate-200 px-4 py-3">
          <SectionHeading title="Support cases" />
        </div>
        <div className="overflow-x-auto">
          <table className="bid-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>Subject</th>
                <th>Priority</th>
                <th>Status</th>
                <th className="text-right">Updated</th>
              </tr>
            </thead>
            <tbody>
              {platform.store.supportCases.all().map((supportCase) => (
                <tr key={supportCase.id}>
                  <td className="text-xs font-medium text-navy-900">
                    {platform.organizations.get(supportCase.organizationId)?.displayName}
                  </td>
                  <td className="text-xs">{supportCase.subject}</td>
                  <td>
                    <Badge tone={supportCase.priority === 'HIGH' || supportCase.priority === 'URGENT' ? 'exception' : 'info'}>
                      {humanize(supportCase.priority)}
                    </Badge>
                  </td>
                  <td>
                    <Badge tone={supportCase.status === 'RESOLVED' ? 'verified' : 'attention'}>{humanize(supportCase.status)}</Badge>
                  </td>
                  <td className="text-right text-xs text-slate-500">{relativeTime(supportCase.updatedAt)}</td>
                </tr>
              ))}
              {platform.store.supportCases.count() === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-slate-500">
                    No open support cases.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function RevenueTab() {
  const { platform } = usePlatform();
  const revenue = platform.lifecycle.revenue();

  const mix = [
    { name: 'Subscription', value: revenue.subscriptionRevenuePaise },
    { name: 'Verification', value: revenue.verificationRevenuePaise },
    { name: 'Monitoring', value: revenue.monitoringRevenuePaise },
    { name: 'BGV', value: revenue.bgvRevenuePaise },
    { name: 'API', value: revenue.apiRevenuePaise },
  ].filter((entry) => entry.value > 0);

  // Illustrative trailing trend built from current MRR — clearly demo data.
  const trend = Array.from({ length: 6 }, (_, index) => ({
    month: ['Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug'][index],
    mrr: Math.round((revenue.mrrPaise / 100) * (0.55 + index * 0.09)),
  }));

  return (
    <div className="space-y-5">
      <SectionHeading title="Revenue analytics" description="Demo data derived from the seeded network. Not a forecast." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-6">
        <StatCard label="MRR" value={formatInr(revenue.mrrPaise, { compact: true })} tone="verified" />
        <StatCard label="ARR" value={formatInr(revenue.arrPaise, { compact: true })} />
        <StatCard label="Paying customers" value={revenue.payingCustomers} />
        <StatCard label="Members" value={revenue.members} sublabel="free tier" />
        <StatCard label="ARPC" value={formatInr(revenue.averageRevenuePerCustomerPaise, { compact: true })} />
        <StatCard
          label="Net revenue retention"
          value={`${revenue.netRevenueRetention}%`}
          tone={revenue.netRevenueRetention >= 100 ? 'verified' : 'attention'}
        />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <SectionHeading title="MRR trend (illustrative)" />
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend} margin={{ top: 8, right: 12, left: 0, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} tickFormatter={(value) => `₹${Math.round(Number(value) / 1000)}K`} />
                <ReTooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} contentStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="mrr" stroke="#2559eb" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card>
          <SectionHeading title="Revenue mix" />
          <div className="mt-3 h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={mix} dataKey="value" nameKey="name" innerRadius={44} outerRadius={72} paddingAngle={2}>
                  {mix.map((entry, index) => (
                    <Cell key={entry.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <ReTooltip formatter={(value) => formatInr(Number(value))} contentStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <SectionHeading title="Streams" />
        <DataList
          items={[
            { label: 'Subscription revenue', value: formatInr(revenue.subscriptionRevenuePaise) },
            { label: 'Verification revenue', value: formatInr(revenue.verificationRevenuePaise) },
            { label: 'Monitoring revenue', value: formatInr(revenue.monitoringRevenuePaise) },
            { label: 'BGV revenue', value: formatInr(revenue.bgvRevenuePaise) },
            { label: 'API revenue', value: formatInr(revenue.apiRevenuePaise) },
            { label: 'Expansion revenue', value: formatInr(revenue.expansionRevenuePaise) },
            { label: 'Churned revenue', value: formatInr(revenue.churnedRevenuePaise) },
          ]}
        />
      </Card>
    </div>
  );
}

function OrganizationsTab() {
  const { platform } = usePlatform();
  const [query, setQuery] = useState('');
  const organizations = platform.organizations
    .list()
    .filter((organization) =>
      query ? `${organization.displayName} ${organization.bidId}`.toLowerCase().includes(query.toLowerCase()) : true,
    );

  return (
    <div className="space-y-4">
      <SectionHeading title="Organizations" description="Every identity in the network, with its lifecycle and commercial state." />
      <div className="w-72">
        <TextInput placeholder="Search name or BID ID" value={query} onChange={(event) => setQuery(event.target.value)} />
      </div>
      <Card padded={false}>
        <div className="overflow-x-auto">
          <table className="bid-table">
            <thead>
              <tr>
                <th>Organization</th>
                <th>BID ID</th>
                <th>Industry</th>
                <th>Lifecycle</th>
                <th>Commercial state</th>
                <th>Workspace</th>
                <th>Credentials</th>
                <th>Introduced by</th>
                <th className="text-right">Profile</th>
              </tr>
            </thead>
            <tbody>
              {organizations.map((organization) => {
                const workspace = platform.organizations.workspaceFor(organization.id);
                const subscription = workspace ? platform.billing.subscriptionFor(workspace.id) : undefined;
                return (
                  <tr key={organization.id}>
                    <td>
                      <div className="flex items-center gap-2">
                        <OrgAvatar name={organization.displayName} color={organization.logoColor} text={organization.logoText} size="sm" />
                        <span className="font-medium text-navy-900">{organization.displayName}</span>
                      </div>
                    </td>
                    <td className="font-mono text-2xs">{organization.bidId}</td>
                    <td className="text-xs">{humanize(organization.industry)}</td>
                    <td className="text-xs">{humanize(organization.lifecycle)}</td>
                    <td>
                      <Badge tone={['CUSTOMER', 'ENTERPRISE'].includes(organization.commercialState) ? 'brand' : 'info'}>
                        {humanize(organization.commercialState)}
                      </Badge>
                    </td>
                    <td className="text-xs">{subscription ? platform.billing.plan(subscription.planId)?.name : workspace ? 'Member' : '—'}</td>
                    <td className="text-xs">{platform.verifications.credentialsForOrganization(organization.id).length}</td>
                    <td className="text-xs">
                      {organization.introducedByOrgId
                        ? platform.organizations.get(organization.introducedByOrgId)?.displayName ?? '—'
                        : 'Direct'}
                    </td>
                    <td className="text-right">
                      <Link to={`/profile/${organization.bidId}`} className="text-xs font-medium text-brand-700 hover:underline">
                        View
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function ProvidersTab() {
  const { platform, run } = usePlatform();
  const [toast, setToast] = useState<string | null>(null);
  const providers = platform.store.providers.all();
  const transactions = platform.store.providerTransactions.all();

  return (
    <div className="space-y-5">
      <Toast message={toast} onDismiss={() => setToast(null)} />
      <SectionHeading
        title="Provider adapters"
        description="Enable, disable and prioritize the providers the router may select. Business logic never references a provider directly."
      />

      <div className="grid gap-3 md:grid-cols-3">
        {providers.map((provider) => {
          const providerTransactions = transactions.filter((transaction) => transaction.providerId === provider.id);
          const passRate = providerTransactions.length
            ? Math.round((providerTransactions.filter((t) => t.outcome === 'PASS').length / providerTransactions.length) * 100)
            : 0;
          const averageLatency = providerTransactions.length
            ? Math.round(providerTransactions.reduce((sum, t) => sum + t.latencyMs, 0) / providerTransactions.length)
            : 0;
          return (
            <Card key={provider.id}>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <p className="text-sm font-semibold text-navy-900">{provider.name}</p>
                  <p className="mt-0.5 text-2xs text-slate-500">{provider.capabilities.join(' · ')}</p>
                </div>
                <Toggle
                  checked={provider.enabled}
                  onChange={(value) => {
                    run((p) => p.store.providers.update(provider.id, { enabled: value }));
                    setToast(`${provider.name} ${value ? 'enabled' : 'disabled'} for routing.`);
                  }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-600">{provider.description}</p>
              <DataList
                items={[
                  { label: 'Priority', value: provider.priority },
                  { label: 'Cost multiplier', value: `${provider.costMultiplier}×` },
                  { label: 'SLA', value: `${provider.slaHours}h` },
                  { label: 'Quality score', value: provider.qualityScore },
                  { label: 'Transactions', value: providerTransactions.length },
                  { label: 'Pass rate', value: `${passRate}%` },
                  { label: 'Avg latency', value: `${averageLatency} ms` },
                  { label: 'Coverage', value: provider.countries.join(', ') },
                ]}
              />
            </Card>
          );
        })}
      </div>

      <Card padded={false}>
        <div className="border-b border-slate-200 px-4 py-3">
          <SectionHeading title="Recent provider transactions" />
        </div>
        <div className="max-h-96 overflow-y-auto">
          <table className="bid-table">
            <thead>
              <tr>
                <th>Provider</th>
                <th>Check</th>
                <th>Outcome</th>
                <th>Latency</th>
                <th>Cost</th>
                <th>Fallback from</th>
                <th className="text-right">When</th>
              </tr>
            </thead>
            <tbody>
              {transactions
                .slice()
                .reverse()
                .slice(0, 60)
                .map((transaction) => (
                  <tr key={transaction.id}>
                    <td className="text-xs font-medium text-navy-900">
                      {platform.store.providers.get(transaction.providerId)?.name ?? transaction.providerId}
                    </td>
                    <td className="text-xs">{transaction.checkCode}</td>
                    <td>
                      <Badge tone={transaction.outcome === 'PASS' ? 'verified' : transaction.outcome === 'ATTENTION' ? 'attention' : 'exception'}>
                        {transaction.outcome}
                      </Badge>
                    </td>
                    <td className="text-xs">{transaction.latencyMs} ms</td>
                    <td className="text-xs">{formatInr(transaction.costPaise)}</td>
                    <td className="text-2xs text-slate-500">{transaction.fallbackFrom ?? '—'}</td>
                    <td className="text-right text-xs text-slate-500">{relativeTime(transaction.completedAt)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}

function PricingTab() {
  const { platform, run } = usePlatform();
  const [toast, setToast] = useState<string | null>(null);
  const plans = platform.billing.plans();
  const priceBook = platform.billing.priceBook();

  return (
    <div className="space-y-5">
      <Toast message={toast} onDismiss={() => setToast(null)} />
      <SectionHeading
        title="Plans & pricing"
        description="Pricing is configuration. Editing here changes what the product charges — no code path reads a hard-coded price."
      />
      <Callout tone="neutral" title="Pricing disclaimer shown to customers">
        {PRICING_DISCLAIMER}
      </Callout>

      <div className="grid gap-3 lg:grid-cols-2">
        {plans.map((plan) => (
          <Card key={plan.id}>
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-navy-900">{plan.name}</p>
                <p className="text-2xs text-slate-500">{plan.tier}</p>
              </div>
              <Toggle
                checked={plan.active}
                onChange={(value) => {
                  run((p) => p.billing.updatePlan(plan.id, { active: value }));
                  setToast(`${plan.name} ${value ? 'activated' : 'deactivated'}.`);
                }}
              />
            </div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <Field label="Monthly price (₹)">
                <TextInput
                  type="number"
                  defaultValue={plan.monthlyPricePaise / 100}
                  onBlur={(event) => {
                    const value = Math.round(Number(event.target.value) * 100);
                    if (Number.isFinite(value) && value !== plan.monthlyPricePaise) {
                      run((p) => p.billing.updatePlan(plan.id, { monthlyPricePaise: value }));
                      setToast(`${plan.name} price updated.`);
                    }
                  }}
                />
              </Field>
              <Field label="Included checks">
                <TextInput
                  type="number"
                  defaultValue={plan.includedChecks}
                  onBlur={(event) => {
                    const value = Number(event.target.value);
                    if (Number.isFinite(value) && value !== plan.includedChecks) {
                      run((p) => p.billing.updatePlan(plan.id, { includedChecks: value }));
                      setToast(`${plan.name} included volume updated.`);
                    }
                  }}
                />
              </Field>
              <Field label="Overage per check (₹)">
                <TextInput
                  type="number"
                  defaultValue={plan.overagePerCheckPaise / 100}
                  onBlur={(event) => {
                    const value = Math.round(Number(event.target.value) * 100);
                    if (Number.isFinite(value) && value !== plan.overagePerCheckPaise) {
                      run((p) => p.billing.updatePlan(plan.id, { overagePerCheckPaise: value }));
                      setToast(`${plan.name} overage price updated.`);
                    }
                  }}
                />
              </Field>
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {Object.entries(plan.entitlements)
                .filter(([, value]) => typeof value === 'boolean')
                .map(([key, value]) => (
                  <Badge key={key} tone={value ? 'verified' : 'pending'}>
                    {humanize(key.replace(/^can/, ''))}
                  </Badge>
                ))}
            </div>
          </Card>
        ))}
      </div>

      <Card>
        <SectionHeading title="Usage price book" description="Applied to metered consumption." />
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {(
            [
              ['businessVerificationFromPaise', 'Business verification (from)'],
              ['bgvFromPaise', 'BGV (from)'],
              ['enhancedDueDiligenceFromPaise', 'Enhanced due diligence (from)'],
              ['monitoringPerEntityMonthPaise', 'Monitoring per entity / month'],
              ['reverificationFromPaise', 'Re-verification (from)'],
              ['apiCallPaise', 'API call'],
            ] as const
          ).map(([key, label]) => (
            <Field key={key} label={`${label} (₹)`}>
              <TextInput
                type="number"
                defaultValue={priceBook[key] / 100}
                onBlur={(event) => {
                  const value = Math.round(Number(event.target.value) * 100);
                  if (Number.isFinite(value) && value !== priceBook[key]) {
                    run((p) => p.billing.updatePriceBook({ [key]: value }));
                    setToast('Usage price book updated.');
                  }
                }}
              />
            </Field>
          ))}
        </div>
      </Card>
    </div>
  );
}

function OperationsTab() {
  const { platform } = usePlatform();
  const alerts = platform.monitoring.allAlerts();
  const audit = platform.auditLog({ limit: 60 });
  const events = platform.events(40);

  return (
    <div className="space-y-5">
      <SectionHeading title="Operations" description="Platform-wide monitoring, audit and event stream." />

      <div className="grid gap-5 lg:grid-cols-2">
        <Card padded={false}>
          <div className="border-b border-slate-200 px-4 py-3">
            <SectionHeading title={`Monitoring alerts (${alerts.length})`} />
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {alerts.map((alert) => (
              <div key={alert.id} className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-xs font-medium text-navy-900">{alert.title}</p>
                  <Badge tone={['HIGH', 'CRITICAL'].includes(alert.severity) ? 'exception' : 'attention'}>{alert.severity}</Badge>
                </div>
                <p className="mt-1 text-2xs text-slate-500">
                  {alert.subjectName} · {alert.source} · {relativeTime(alert.detectedAt)}
                </p>
              </div>
            ))}
            {alerts.length === 0 && <p className="p-4 text-sm text-slate-500">No alerts.</p>}
          </div>
        </Card>

        <Card padded={false}>
          <div className="border-b border-slate-200 px-4 py-3">
            <SectionHeading title="Recent domain events" />
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
            {events.map((event) => (
              <div key={event.id} className="flex items-center justify-between gap-2 p-2.5">
                <Badge tone="brand">{event.name}</Badge>
                <span className="text-2xs text-slate-500">{relativeTime(event.occurredAt)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card padded={false}>
        <div className="border-b border-slate-200 px-4 py-3">
          <SectionHeading title="Platform audit log" description="Hash-chained, append-only." />
        </div>
        <div className="max-h-96 overflow-y-auto">
          <table className="bid-table">
            <thead>
              <tr>
                <th>When</th>
                <th>Actor</th>
                <th>Action</th>
                <th>Summary</th>
              </tr>
            </thead>
            <tbody>
              {audit.map((entry) => (
                <tr key={entry.id}>
                  <td className="whitespace-nowrap text-xs">{relativeTime(entry.at)}</td>
                  <td className="text-xs">{entry.actorName}</td>
                  <td className="text-2xs font-mono">{entry.action}</td>
                  <td className="text-xs">{entry.summary}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
