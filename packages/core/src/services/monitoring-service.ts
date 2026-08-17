import type { MonitoringFrequency, MonitoringSeverity, SubjectType } from '../domain/enums.js';
import type { MonitoringEvent, MonitoringRule } from '../domain/types.js';
import { assertPermission, type AccessContext } from '../security/access.js';
import { seededUnit } from '../util/id.js';
import type { PlatformContext } from './context.js';

/**
 * Monitoring (Section 26, ADR-009).
 *
 * A verification is a point-in-time statement; monitoring is what keeps it
 * meaningful. BID does not claim access to every government or private event
 * stream — signals below are explicitly mock signals in this build, and each
 * alert names the source it came from.
 */

export const MONITORING_SIGNALS = [
  { code: 'BUSINESS_STATUS', label: 'Business/registry status change', source: 'Company registry data provider (mock feed)' },
  { code: 'GST_STATUS', label: 'GST registration status change', source: 'Authorized GST data provider (mock feed)' },
  { code: 'COMPLIANCE_FILING', label: 'Filing regularity change', source: 'Compliance data provider (mock feed)' },
  { code: 'CREDENTIAL_EXPIRY', label: 'Credential or document expiry', source: 'BID internal credential ledger' },
  { code: 'RISK_SIGNAL', label: 'Sanctions / adverse media signal', source: 'Screening data provider (mock feed)' },
  { code: 'VERIFICATION_EXPIRY', label: 'Verification approaching expiry', source: 'BID internal policy clock' },
  { code: 'RELATIONSHIP_STATUS', label: 'Relationship status change', source: 'BID internal relationship engine' },
] as const;

export type MonitoringSignalCode = (typeof MONITORING_SIGNALS)[number]['code'];

export class MonitoringService {
  constructor(private readonly ctx: PlatformContext) {}

  rules(workspaceId: string): MonitoringRule[] {
    return this.ctx.store.monitoringRules.find((r) => r.workspaceId === workspaceId);
  }

  alerts(workspaceId: string): MonitoringEvent[] {
    return this.ctx.store.monitoringEvents
      .find((e) => e.workspaceId === workspaceId)
      .sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));
  }

  allAlerts(): MonitoringEvent[] {
    return this.ctx.store.monitoringEvents.all().sort((a, b) => b.detectedAt.localeCompare(a.detectedAt));
  }

  openAlertCount(workspaceId: string): number {
    return this.ctx.store.monitoringEvents.count((e) => e.workspaceId === workspaceId && e.status === 'OPEN');
  }

  enable(input: {
    workspaceId: string;
    subjectType?: SubjectType;
    subjectRef: string;
    relationshipId?: string;
    signals?: string[];
    frequency?: MonitoringFrequency;
    actor?: AccessContext;
  }): MonitoringRule {
    if (input.actor) assertPermission(input.actor, 'monitoring:write');
    const existing = this.ctx.store.monitoringRules.first(
      (r) => r.workspaceId === input.workspaceId && r.subjectRef === input.subjectRef,
    );
    if (existing) {
      return this.ctx.store.monitoringRules.update(existing.id, { active: true, frequency: input.frequency ?? existing.frequency });
    }
    const rule: MonitoringRule = {
      id: this.ctx.ids.next('mrl'),
      workspaceId: input.workspaceId,
      subjectType: input.subjectType ?? 'ORGANIZATION',
      subjectRef: input.subjectRef,
      relationshipId: input.relationshipId,
      signals: input.signals ?? ['BUSINESS_STATUS', 'GST_STATUS', 'RISK_SIGNAL', 'VERIFICATION_EXPIRY'],
      frequency: input.frequency ?? 'QUARTERLY',
      active: true,
      createdAt: this.ctx.now(),
    };
    this.ctx.store.monitoringRules.insert(rule);
    if (input.relationshipId) {
      this.ctx.store.relationships.update(input.relationshipId, { monitoringEnabled: true, lifecycle: 'MONITORED' });
    }
    this.ctx.audit({
      ctx: input.actor,
      workspaceId: input.workspaceId,
      action: 'monitoring.enabled',
      resourceType: 'monitoring_rule',
      resourceId: rule.id,
      summary: `Monitoring enabled for ${input.subjectRef} (${rule.frequency.toLowerCase()}, ${rule.signals.length} signals).`,
      metadata: { frequency: rule.frequency },
    });
    this.ctx.emit('MonitoringEnabled', { ruleId: rule.id, subjectRef: input.subjectRef }, { workspaceId: input.workspaceId });
    return rule;
  }

  disable(ruleId: string): MonitoringRule {
    const rule = this.ctx.store.monitoringRules.update(ruleId, { active: false });
    if (rule.relationshipId) {
      this.ctx.store.relationships.update(rule.relationshipId, { monitoringEnabled: false });
    }
    return rule;
  }

  raiseAlert(input: {
    workspaceId: string;
    subjectRef: string;
    subjectName: string;
    subjectType?: SubjectType;
    signal: string;
    severity: MonitoringSeverity;
    title: string;
    detail: string;
    source?: string;
    relationshipId?: string;
    ruleId?: string;
    recommendedAction?: string;
    detectedAt?: string;
  }): MonitoringEvent {
    const signalDef = MONITORING_SIGNALS.find((s) => s.code === input.signal);
    const event: MonitoringEvent = {
      id: this.ctx.ids.next('mev'),
      ruleId: input.ruleId,
      workspaceId: input.workspaceId,
      subjectType: input.subjectType ?? 'ORGANIZATION',
      subjectRef: input.subjectRef,
      subjectName: input.subjectName,
      signal: input.signal,
      severity: input.severity,
      title: input.title,
      detail: input.detail,
      source: input.source ?? signalDef?.source ?? 'Mock monitoring feed',
      status: 'OPEN',
      detectedAt: input.detectedAt ?? this.ctx.now(),
      relationshipId: input.relationshipId,
      recommendedAction: input.recommendedAction ?? 'Review the evidence and decide whether re-verification is required.',
    };
    this.ctx.store.monitoringEvents.insert(event);
    this.ctx.emit(
      'MonitoringAlertCreated',
      { alertId: event.id, severity: event.severity, subjectRef: event.subjectRef },
      { workspaceId: input.workspaceId },
    );
    this.ctx.notify({
      workspaceId: input.workspaceId,
      kind: 'monitoring.alert',
      title: input.title,
      body: `${input.subjectName} · ${event.severity} · ${event.source}`,
      severity: event.severity === 'CRITICAL' || event.severity === 'HIGH' ? 'ERROR' : 'WARNING',
      link: '/app/monitoring',
    });
    return event;
  }

  setAlertStatus(alertId: string, status: MonitoringEvent['status'], actor?: AccessContext): MonitoringEvent {
    const patch: Partial<MonitoringEvent> = { status };
    if (status === 'RESOLVED' || status === 'DISMISSED') patch.resolvedAt = this.ctx.now();
    const event = this.ctx.store.monitoringEvents.update(alertId, patch);
    this.ctx.audit({
      ctx: actor,
      workspaceId: event.workspaceId,
      action: 'monitoring.alert_updated',
      resourceType: 'monitoring_event',
      resourceId: alertId,
      summary: `Alert "${event.title}" marked ${status}.`,
      metadata: { status },
    });
    return event;
  }

  /**
   * Runs a monitoring sweep against the mock signal feed. Deterministic per
   * (rule, cycle) so the demo is reproducible.
   */
  runSweep(workspaceId: string, cycle = 1): MonitoringEvent[] {
    const rules = this.rules(workspaceId).filter((r) => r.active);
    const raised: MonitoringEvent[] = [];
    const now = this.ctx.now();

    for (const rule of rules) {
      this.ctx.store.monitoringRules.update(rule.id, { lastRunAt: now });
      const roll = seededUnit(`${rule.id}|sweep|${cycle}`);
      if (roll < 0.72) continue; // most sweeps find nothing — that is the normal case

      const signal = rule.signals[Math.floor(seededUnit(`${rule.id}|sig|${cycle}`) * rule.signals.length)] ?? 'BUSINESS_STATUS';
      const definition = MONITORING_SIGNALS.find((s) => s.code === signal);
      const organization = this.ctx.store.organizations.first((o) => o.bidId === rule.subjectRef);
      const severity: MonitoringSeverity = roll > 0.95 ? 'HIGH' : roll > 0.85 ? 'MEDIUM' : 'LOW';

      raised.push(
        this.raiseAlert({
          workspaceId,
          ruleId: rule.id,
          subjectRef: rule.subjectRef,
          subjectName: organization?.displayName ?? rule.subjectRef,
          subjectType: rule.subjectType,
          signal,
          severity,
          title: `${definition?.label ?? signal} detected for ${organization?.displayName ?? rule.subjectRef}`,
          detail: `A change was reported by ${definition?.source ?? 'the monitoring feed'} during the ${rule.frequency.toLowerCase()} sweep. This is a demo signal generated by the mock monitoring feed.`,
          relationshipId: rule.relationshipId,
          recommendedAction:
            severity === 'HIGH'
              ? 'Re-run the affected checks and review the relationship before the next transaction.'
              : 'Review at the next scheduled re-verification.',
        }),
      );
    }
    return raised;
  }
}
