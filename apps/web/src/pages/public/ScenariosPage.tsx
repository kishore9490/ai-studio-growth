import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SCENARIOS, getCheckDefinition, getPolicyTemplate } from '@bid/core';
import { PublicLayout } from '../../components/PublicLayout';
import { Badge, Button, Callout, Card, DataList, SectionHeading, cx } from '../../components/ui';
import { formatInr, humanize } from '../../lib/format';

/** Seven prebuilt scenarios (Section 44) — one engine, seven policies. */
export function ScenariosPage() {
  const [selectedId, setSelectedId] = useState(SCENARIOS[0].id);
  const scenario = SCENARIOS.find((item) => item.id === selectedId) ?? SCENARIOS[0];
  const template = getPolicyTemplate(scenario.policyTemplateKey);

  return (
    <PublicLayout>
      <div className="border-b border-slate-200 bg-navy-950">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <p className="text-2xs font-semibold uppercase tracking-widest text-brand-300">Business scenarios</p>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-white">Same engine. Seven very different questions.</h1>
          <p className="mt-2 max-w-2xl text-sm text-navy-100">
            Each scenario below runs the identical verification engine, evidence model and assessment model. Only the policy
            changes — which is exactly the claim BID makes about being industry-agnostic.
          </p>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-3">
        <div className="space-y-2">
          {SCENARIOS.map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedId(item.id)}
              className={cx(
                'w-full rounded border p-3 text-left transition',
                item.id === selectedId ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-slate-300',
              )}
            >
              <p className="text-sm font-semibold text-navy-900">{item.title}</p>
              <p className="mt-0.5 text-2xs text-slate-500">
                {humanize(item.riskLevel)} risk · {humanize(item.relationshipType)}
              </p>
            </button>
          ))}
        </div>

        <div className="space-y-5 lg:col-span-2">
          <Card>
            <SectionHeading title={scenario.title} description={scenario.question} />
            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge tone="neutral">{scenario.requester}</Badge>
              <Badge tone="neutral">→</Badge>
              <Badge tone="brand">{scenario.subject}</Badge>
              <Badge tone={scenario.riskLevel === 'CRITICAL' ? 'exception' : 'attention'}>{humanize(scenario.riskLevel)} risk</Badge>
            </div>
            <div className="mt-4 space-y-3 text-sm text-slate-700">
              <div>
                <p className="bid-label">Why it matters</p>
                <p className="mt-1">{scenario.whyItMatters}</p>
              </div>
              <div>
                <p className="bid-label">Outcome in BID</p>
                <p className="mt-1">{scenario.outcome}</p>
              </div>
            </div>
          </Card>

          {template && (
            <Card>
              <SectionHeading title={`Policy applied — ${template.name}`} description={template.description} />
              <div className="mt-4 grid gap-5 lg:grid-cols-2">
                <div>
                  <p className="bid-label">Checks</p>
                  <ul className="mt-2 space-y-1.5">
                    {[...template.requiredChecks, ...template.optionalChecks].map((requirement) => {
                      const definition = getCheckDefinition(requirement.checkCode);
                      if (!definition) return null;
                      return (
                        <li key={requirement.checkCode} className="flex items-start justify-between gap-2 border-b border-slate-100 pb-1.5">
                          <span className="text-xs text-navy-900">{definition.label}</span>
                          <span className="shrink-0">
                            {requirement.blocking ? (
                              <Badge tone="exception">Blocking</Badge>
                            ) : requirement.required ? (
                              <Badge tone="info">Required</Badge>
                            ) : (
                              <Badge tone="pending">Optional</Badge>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>
                </div>
                <div>
                  <p className="bid-label">Rules</p>
                  <DataList
                    items={[
                      { label: 'Approval', value: humanize(template.approvalRule) },
                      { label: 'Auto-approve at', value: template.thresholds.autoApproveScore },
                      { label: 'Blocking failures tolerated', value: template.thresholds.maxBlockingFailures },
                      { label: 'Validity', value: `${template.validityDays} days` },
                      { label: 'Monitoring', value: humanize(template.monitoringFrequency) },
                      { label: 'Consent required', value: template.requiresConsent ? 'Yes' : 'No' },
                      {
                        label: 'Indicative cost',
                        value: formatInr(
                          [...template.requiredChecks, ...template.optionalChecks].reduce(
                            (sum, requirement) => sum + (getCheckDefinition(requirement.checkCode)?.unitCostPaise ?? 0),
                            0,
                          ),
                        ),
                      },
                    ]}
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link to="/demo">
                  <Button>Generate a variant of this policy</Button>
                </Link>
                <Link to="/app/verifications/new">
                  <Button variant="primary">Run this in the product</Button>
                </Link>
              </div>
            </Card>
          )}

          <Callout tone="neutral" title="Scenario ≠ special case">
            Nothing in the codebase branches on “healthcare” or “construction”. The scenarios differ only in which checks the
            policy requires, which of them block, how the thresholds are set, and how often monitoring runs.
          </Callout>
        </div>
      </div>
    </PublicLayout>
  );
}
