import { Link } from 'react-router-dom';
import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Boxes,
  ClipboardCheck,
  Inbox,
  Rocket,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';
import { usePlatform } from '../../platform/PlatformProvider';
import { Badge, Button, Callout, Card, EmptyState, ProgressBar, SectionHeading, StatCard } from '../../components/ui';
import { BidDigitalCard, BidIdChip, OrgAvatar, VerificationStatusBadge } from '../../components/domain';
import { formatDate, formatInr, humanize, percent, relativeTime } from '../../lib/format';

export function DashboardPage() {
  const { platform, organization, workspace, isRequester, isCustomer, entitlements } = usePlatform();

  const card = platform.organizations.digitalCard(organization.bidId);
  const receivedRequests = platform.verifications.listForSubject(organization.id);
  const credentials = platform.verifications.credentialsForOrganization(organization.id);
  const relationships = workspace ? platform.relationships.listForWorkspace(workspace.id) : [];
  const sentRequests = workspace ? platform.verifications.listForWorkspace(workspace.id) : [];
  const alerts = workspace ? platform.monitoring.alerts(workspace.id).filter((a) => a.status === 'OPEN') : [];
  const campaigns = workspace ? platform.campaigns.listForWorkspace(workspace.id) : [];
  const subscription = workspace ? platform.billing.subscriptionFor(workspace.id) : undefined;
  const plan = subscription ? platform.billing.plan(subscription.planId) : platform.billing.planByTier('MEMBER_FREE');
  const usage = workspace ? platform.billing.summary(workspace.id) : undefined;

  const completed = sentRequests.filter((r) =>
    ['COMPLETED', 'CREDENTIAL_ISSUED', 'MONITORING'].includes(r.status),
  ).length;
  const exceptions = sentRequests.filter((r) => ['REQUIRES_REVIEW', 'FAILED', 'PARTIAL', 'EXPIRED'].includes(r.status)).length;
  const pendingReceived = receivedRequests.filter(
    (r) => !['COMPLETED', 'CREDENTIAL_ISSUED', 'MONITORING', 'FAILED'].includes(r.status),
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-3">
          <OrgAvatar name={organization.displayName} color={organization.logoColor} text={organization.logoText} size="lg" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-navy-900">{organization.displayName}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <BidIdChip bidId={organization.bidId} />
              <Badge tone="neutral">{humanize(organization.lifecycle)}</Badge>
              <Badge tone={isCustomer ? 'brand' : isRequester ? 'brand' : 'info'}>
                {humanize(organization.commercialState)}
              </Badge>
              <span className="text-xs text-slate-500">{plan?.name}</span>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to={`/profile/${organization.bidId}`}>
            <Button icon={<ShieldCheck className="h-4 w-4" />}>Public BID profile</Button>
          </Link>
          {isRequester ? (
            <Link to="/app/verifications/new">
              <Button variant="primary" icon={<ClipboardCheck className="h-4 w-4" />}>
                Start verification
              </Button>
            </Link>
          ) : (
            <Link to="/app/become-requester">
              <Button variant="primary" icon={<Rocket className="h-4 w-4" />}>
                Verify your own network
              </Button>
            </Link>
          )}
        </div>
      </div>

      {!isRequester && (
        <Callout tone="brand" title="You are a BID Member — free, and not a customer">
          Membership lets you hold your BID identity, respond to verification requests, and carry credentials others can
          check. Initiating your own verifications is a separate, paid capability.{' '}
          <Link className="font-semibold underline" to="/app/become-requester">
            See what changes when you become a requester →
          </Link>
        </Callout>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="BID status"
          value={card?.status === 'BID VERIFIED' ? 'Verified' : humanize(organization.commercialState)}
          sublabel={credentials[0] ? `Credential valid to ${formatDate(credentials[0].expiresAt)}` : 'No active credential'}
          tone={card?.status === 'BID VERIFIED' ? 'verified' : 'pending'}
          icon={<BadgeCheck className="h-4 w-4 text-emerald-600" />}
        />
        <StatCard
          label="Requests received"
          value={receivedRequests.length}
          sublabel={`${pendingReceived.length} awaiting your action`}
          tone={pendingReceived.length ? 'attention' : 'verified'}
          icon={<Inbox className="h-4 w-4 text-slate-400" />}
        />
        {isRequester ? (
          <>
            <StatCard
              label="Active relationships"
              value={relationships.filter((r) => ['ACTIVE', 'MONITORED'].includes(r.lifecycle)).length}
              sublabel={`${relationships.length} total in this workspace`}
              icon={<Boxes className="h-4 w-4 text-slate-400" />}
            />
            <StatCard
              label="Monitoring alerts"
              value={alerts.length}
              sublabel={alerts.length ? 'Open alerts need review' : 'No open alerts'}
              tone={alerts.length ? 'attention' : 'verified'}
              icon={<Activity className="h-4 w-4 text-slate-400" />}
            />
          </>
        ) : (
          <>
            <StatCard label="Credentials held" value={credentials.length} sublabel="Reusable across counterparties" />
            <StatCard
              label="Plan"
              value={plan?.name ?? 'BID Member'}
              sublabel={entitlements.canInitiateVerification ? 'Requester capabilities enabled' : 'Free member capabilities'}
            />
          </>
        )}
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          {isRequester && (
            <Card padded={false}>
              <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
                <SectionHeading title="Verification pipeline" description="Requests this workspace initiated." />
                <Link to="/app/verifications" className="text-xs font-medium text-brand-700 hover:underline">
                  View all
                </Link>
              </div>
              <div className="grid grid-cols-3 divide-x divide-slate-200 border-b border-slate-200">
                <PipelineStat label="Completed" value={completed} total={sentRequests.length} tone="verified" />
                <PipelineStat
                  label="In progress"
                  value={sentRequests.length - completed - exceptions}
                  total={sentRequests.length}
                  tone="info"
                />
                <PipelineStat label="Exceptions" value={exceptions} total={sentRequests.length} tone="exception" />
              </div>
              {sentRequests.length === 0 ? (
                <div className="p-4">
                  <EmptyState
                    title="No verifications yet"
                    description="Invite a counterparty and pick a policy to run your first verification."
                    action={
                      <Link to="/app/verifications/new">
                        <Button variant="primary" size="sm">
                          Start a verification
                        </Button>
                      </Link>
                    }
                  />
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="bid-table">
                    <thead>
                      <tr>
                        <th>Subject</th>
                        <th>Policy</th>
                        <th>Status</th>
                        <th>Assessment</th>
                        <th className="text-right">Updated</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sentRequests.slice(0, 6).map((request) => {
                        const assessment = platform.verifications.assessment(request.id);
                        return (
                          <tr key={request.id}>
                            <td>
                              <Link to={`/app/verifications/${request.id}`} className="font-medium text-navy-900 hover:underline">
                                {request.subjectName}
                              </Link>
                              <div className="font-mono text-2xs text-slate-400">{request.bidId}</div>
                            </td>
                            <td className="text-xs">{platform.policies.get(request.policyId)?.name}</td>
                            <td>
                              <VerificationStatusBadge status={request.status} />
                            </td>
                            <td className="text-xs">
                              {assessment ? `${assessment.score}/100 · ${humanize(assessment.band)}` : '—'}
                            </td>
                            <td className="text-right text-xs text-slate-500">{relativeTime(request.updatedAt)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          )}

          <Card padded={false}>
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <SectionHeading
                title="Requests received"
                description="Verification requests where your organization is the subject."
              />
              <Link to="/app/requests-received" className="text-xs font-medium text-brand-700 hover:underline">
                View all
              </Link>
            </div>
            {receivedRequests.length === 0 ? (
              <div className="p-4">
                <EmptyState title="No inbound requests" description="When a counterparty asks you to verify, it appears here." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="bid-table">
                  <thead>
                    <tr>
                      <th>Requested by</th>
                      <th>Relationship</th>
                      <th>Status</th>
                      <th className="text-right">Requested</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receivedRequests.slice(0, 5).map((request) => (
                      <tr key={request.id}>
                        <td className="font-medium text-navy-900">
                          {platform.organizations.get(request.requesterOrganizationId)?.displayName}
                        </td>
                        <td className="text-xs">{humanize(request.relationshipType)}</td>
                        <td>
                          <VerificationStatusBadge status={request.status} />
                        </td>
                        <td className="text-right text-xs text-slate-500">{relativeTime(request.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          {isRequester && campaigns.length > 0 && (
            <Card>
              <SectionHeading
                title="Campaigns"
                description="Batch verification of many counterparties under one policy."
                actions={
                  <Link to="/app/campaigns" className="text-xs font-medium text-brand-700 hover:underline">
                    View all
                  </Link>
                }
              />
              <div className="mt-3 space-y-3">
                {campaigns.slice(0, 3).map((campaign) => {
                  const progress = platform.campaigns.progress(campaign.id);
                  return (
                    <div key={campaign.id} className="rounded border border-slate-200 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <Link to={`/app/campaigns/${campaign.id}`} className="text-sm font-medium text-navy-900 hover:underline">
                          {campaign.name}
                        </Link>
                        <div className="flex items-center gap-2 text-2xs text-slate-500">
                          <span>{progress.invited} invited</span>
                          <span>·</span>
                          <span>{progress.completed} completed</span>
                          <span>·</span>
                          <span>{progress.exceptions} exceptions</span>
                        </div>
                      </div>
                      <div className="mt-2">
                        <ProgressBar value={progress.completionRate} tone={progress.exceptions ? 'attention' : 'verified'} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-5">
          {card && (
            <div>
              <p className="bid-label mb-2">BID digital card</p>
              <BidDigitalCard card={card} compact />
              <p className="mt-2 text-2xs leading-relaxed text-slate-500">
                The card carries status and attribute summaries only. Identifiers, documents and evidence never appear on it.
              </p>
            </div>
          )}

          {usage && plan && (
            <Card>
              <SectionHeading title="Usage this period" description={usage.period} />
              <div className="mt-3 space-y-3">
                <div>
                  <div className="flex items-baseline justify-between text-xs">
                    <span className="text-slate-500">Checks</span>
                    <span className="font-medium text-navy-900">
                      {usage.usedChecks} / {usage.includedChecks || '—'}
                    </span>
                  </div>
                  <div className="mt-1">
                    <ProgressBar
                      value={usage.includedChecks ? percent(usage.usedChecks, usage.includedChecks) : 0}
                      tone={usage.overageChecks ? 'attention' : 'brand'}
                    />
                  </div>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-500">Credit balance</span>
                  <span className="font-medium text-navy-900">{usage.creditBalance}</span>
                </div>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="text-slate-500">Estimated this period</span>
                  <span className="font-medium text-navy-900">{formatInr(usage.totalPaise)}</span>
                </div>
                <Link to="/app/billing">
                  <Button size="sm" className="w-full" icon={<TrendingUp className="h-3.5 w-3.5" />}>
                    Billing & usage
                  </Button>
                </Link>
              </div>
            </Card>
          )}

          {isRequester && (
            <Card>
              <SectionHeading title="Open monitoring alerts" />
              <div className="mt-3 space-y-2">
                {alerts.length === 0 && <p className="text-sm text-slate-500">No open alerts.</p>}
                {alerts.slice(0, 4).map((alert) => (
                  <Link
                    key={alert.id}
                    to="/app/monitoring"
                    className="block rounded border border-slate-200 p-2.5 hover:border-brand-300"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-medium text-navy-900">{alert.title}</p>
                      <Badge tone={alert.severity === 'HIGH' || alert.severity === 'CRITICAL' ? 'exception' : 'attention'}>
                        {alert.severity}
                      </Badge>
                    </div>
                    <p className="mt-1 text-2xs text-slate-500">
                      {alert.source} · {relativeTime(alert.detectedAt)}
                    </p>
                  </Link>
                ))}
                {alerts.length > 0 && (
                  <Link to="/app/monitoring" className="flex items-center gap-1 text-xs font-medium text-brand-700 hover:underline">
                    Review all alerts <ArrowRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function PipelineStat({
  label,
  value,
  total,
  tone,
}: {
  label: string;
  value: number;
  total: number;
  tone: 'verified' | 'info' | 'exception';
}) {
  return (
    <div className="px-4 py-3">
      <p className="bid-label">{label}</p>
      <p className="mt-1 text-xl font-semibold text-navy-900">{value}</p>
      <div className="mt-2">
        <ProgressBar value={percent(value, total)} tone={tone} />
      </div>
    </div>
  );
}
