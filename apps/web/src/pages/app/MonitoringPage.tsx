import { useState } from 'react';
import { Activity, PlayCircle } from 'lucide-react';
import { MONITORING_SIGNALS } from '@bid/core';
import { usePlatform } from '../../platform/PlatformProvider';
import {
  Badge,
  Button,
  Callout,
  Card,
  EmptyState,
  SectionHeading,
  StatCard,
  Toast,
} from '../../components/ui';
import { formatDateTime, humanize, relativeTime } from '../../lib/format';

export function MonitoringPage() {
  const { platform, workspace, entitlements, run } = usePlatform();
  const [cycle, setCycle] = useState(1);
  const [toast, setToast] = useState<string | null>(null);

  const rules = workspace ? platform.monitoring.rules(workspace.id) : [];
  const alerts = workspace ? platform.monitoring.alerts(workspace.id) : [];
  const open = alerts.filter((alert) => alert.status === 'OPEN');

  return (
    <div className="space-y-5">
      <Toast message={toast} onDismiss={() => setToast(null)} />
      <SectionHeading
        title="Monitoring"
        description="A verification is a point-in-time statement. Monitoring is what keeps it meaningful between verifications."
        actions={
          <div className="flex gap-2">
            <Button
              icon={<Activity className="h-4 w-4" />}
              disabled={!entitlements.canUseMonitoring}
              onClick={() => {
                if (!workspace) return;
                const created = run((p) => p.enableMonitoringForWorkspace(workspace.id));
                setToast(`Monitoring active on ${created.length} relationship(s).`);
              }}
            >
              Enable on all active relationships
            </Button>
            <Button
              variant="primary"
              icon={<PlayCircle className="h-4 w-4" />}
              disabled={!entitlements.canUseMonitoring}
              onClick={() => {
                if (!workspace) return;
                const raised = run((p) => p.monitoring.runSweep(workspace.id, cycle));
                setCycle((value) => value + 1);
                setToast(raised.length ? `${raised.length} new signal(s) raised.` : 'Sweep complete — no changes detected.');
              }}
            >
              Run monitoring sweep
            </Button>
          </div>
        }
      />

      <Callout tone="neutral" title="What BID does and does not claim">
        BID does not have access to every government or private event stream. Monitoring covers the signals a configured
        provider actually reports. In this build every signal comes from a mock feed and is labelled with its source.
      </Callout>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Monitored entities" value={rules.filter((rule) => rule.active).length} />
        <StatCard label="Open alerts" value={open.length} tone={open.length ? 'attention' : 'verified'} />
        <StatCard label="High / critical" value={open.filter((a) => ['HIGH', 'CRITICAL'].includes(a.severity)).length} tone="exception" />
        <StatCard label="Signals watched" value={MONITORING_SIGNALS.length} />
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card padded={false}>
            <div className="border-b border-slate-200 px-4 py-3">
              <SectionHeading title="Alerts" description="Each alert names the feed that produced it and a recommended action." />
            </div>
            {alerts.length === 0 ? (
              <div className="p-4">
                <EmptyState title="No alerts" description="Enable monitoring on a relationship, then run a sweep." />
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {alerts.map((alert) => (
                  <div key={alert.id} className="p-4">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold text-navy-900">{alert.title}</p>
                        <p className="mt-0.5 text-xs text-slate-600">{alert.detail}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Badge tone={['HIGH', 'CRITICAL'].includes(alert.severity) ? 'exception' : alert.severity === 'MEDIUM' ? 'attention' : 'info'}>
                          {alert.severity}
                        </Badge>
                        <Badge tone={alert.status === 'OPEN' ? 'attention' : 'verified'}>{humanize(alert.status)}</Badge>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-2xs text-slate-500">
                      <span className="font-medium text-slate-600">{alert.subjectName}</span>
                      <span>{alert.subjectRef}</span>
                      <span>·</span>
                      <span>Signal: {humanize(alert.signal)}</span>
                      <span>·</span>
                      <span>Source: {alert.source}</span>
                      <span>·</span>
                      <span>{relativeTime(alert.detectedAt)}</span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-700">
                      <span className="font-medium">Recommended:</span> {alert.recommendedAction}
                    </p>
                    {alert.status === 'OPEN' && (
                      <div className="mt-2 flex gap-2">
                        <Button size="sm" onClick={() => run((p) => p.monitoring.setAlertStatus(alert.id, 'ACKNOWLEDGED'))}>
                          Acknowledge
                        </Button>
                        <Button size="sm" onClick={() => run((p) => p.monitoring.setAlertStatus(alert.id, 'RESOLVED'))}>
                          Resolve
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => run((p) => p.monitoring.setAlertStatus(alert.id, 'DISMISSED'))}>
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-5">
          <Card padded={false}>
            <div className="border-b border-slate-200 px-4 py-3">
              <SectionHeading title="Monitoring rules" />
            </div>
            <div className="divide-y divide-slate-100">
              {rules.length === 0 && <p className="p-4 text-sm text-slate-500">No monitoring rules yet.</p>}
              {rules.map((rule) => {
                const organization = platform.store.organizations.first((o) => o.bidId === rule.subjectRef);
                return (
                  <div key={rule.id} className="flex items-start justify-between gap-2 p-3">
                    <div>
                      <p className="text-sm font-medium text-navy-900">{organization?.displayName ?? rule.subjectRef}</p>
                      <p className="text-2xs text-slate-500">
                        {humanize(rule.frequency)} · {rule.signals.length} signals · last run{' '}
                        {rule.lastRunAt ? relativeTime(rule.lastRunAt) : 'never'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <Badge tone={rule.active ? 'brand' : 'pending'}>{rule.active ? 'Active' : 'Paused'}</Badge>
                      {rule.active && (
                        <button
                          className="text-2xs text-slate-500 underline"
                          onClick={() => run((p) => p.monitoring.disable(rule.id))}
                        >
                          Pause
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <SectionHeading title="Signals" />
            <div className="mt-2 space-y-2">
              {MONITORING_SIGNALS.map((signal) => (
                <div key={signal.code} className="rounded border border-slate-200 p-2.5">
                  <p className="text-xs font-medium text-navy-900">{signal.label}</p>
                  <p className="mt-0.5 text-2xs text-slate-500">{signal.source}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

      <p className="text-2xs text-slate-400">Last sweep executed at {formatDateTime(new Date().toISOString())} (demo clock).</p>
    </div>
  );
}
