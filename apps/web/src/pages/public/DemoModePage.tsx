import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles } from 'lucide-react';
import {
  INDUSTRY,
  INDUSTRY_LABEL,
  RISK_LEVEL,
  VERIFICATION_TARGET,
  generatePolicy,
  getCheckDefinition,
  type Industry,
  type RiskLevel,
  type VerificationTarget,
} from '@bid/core';
import { PublicLayout } from '../../components/PublicLayout';
import { Badge, Button, Callout, Card, DataList, SectionHeading, cx } from '../../components/ui';
import { formatInr, humanize } from '../../lib/format';

/**
 * Domain demo mode (Section 43): the domain-agnosticism argument, made
 * interactive. Nothing about the engine changes between selections — only the
 * generated policy does.
 */
export function DemoModePage() {
  const [target, setTarget] = useState<VerificationTarget>('SUPPLIER');
  const [industry, setIndustry] = useState<Industry>('MANUFACTURING');
  const [risk, setRisk] = useState<RiskLevel>('CRITICAL');

  const policy = useMemo(() => generatePolicy({ target, industry, riskLevel: risk }), [target, industry, risk]);

  return (
    <PublicLayout>
      <div className="border-b border-slate-200 bg-navy-950">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <p className="text-2xs font-semibold uppercase tracking-widest text-brand-300">Domain demo</p>
          <h1 className="mt-1.5 text-3xl font-semibold tracking-tight text-white">What do you want to verify?</h1>
          <p className="mt-2 max-w-2xl text-sm text-navy-100">
            Pick a subject, an industry and a risk level. BID generates the policy. The engine underneath is identical for
            every combination — that is what makes the platform industry-agnostic rather than industry-specific.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-6xl space-y-6 px-4 py-10 sm:px-6">
        <Card>
          <SectionHeading title="1 · What do you want to verify?" />
          <div className="mt-3 flex flex-wrap gap-2">
            {VERIFICATION_TARGET.map((option) => (
              <Chip key={option} active={target === option} onClick={() => setTarget(option)}>
                {humanize(option)}
              </Chip>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeading title="2 · In which industry?" />
          <div className="mt-3 flex flex-wrap gap-2">
            {INDUSTRY.map((option) => (
              <Chip key={option} active={industry === option} onClick={() => setIndustry(option)}>
                {INDUSTRY_LABEL[option]}
              </Chip>
            ))}
          </div>
        </Card>

        <Card>
          <SectionHeading title="3 · What risk does this relationship carry?" />
          <div className="mt-3 flex flex-wrap gap-2">
            {RISK_LEVEL.map((option) => (
              <Chip key={option} active={risk === option} onClick={() => setRisk(option)}>
                {humanize(option)}
              </Chip>
            ))}
          </div>
        </Card>

        <Card className="border-brand-300">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="flex items-center gap-2 text-2xs font-semibold uppercase tracking-widest text-brand-700">
                <Sparkles className="h-3.5 w-3.5" /> Generated policy
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-navy-900">{policy.name}</h2>
              <p className="mt-1 max-w-2xl text-sm text-slate-600">{policy.description}</p>
            </div>
            <Link to="/app/become-requester">
              <Button variant="primary">Use a policy like this</Button>
            </Link>
          </div>

          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <p className="bid-label">Required checks</p>
              <div className="mt-2 overflow-x-auto">
                <table className="bid-table">
                  <thead>
                    <tr>
                      <th>Check</th>
                      <th>Category</th>
                      <th>Requirement</th>
                      <th>Source</th>
                      <th className="text-right">Unit cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...policy.requiredChecks, ...policy.optionalChecks].map((requirement) => {
                      const definition = getCheckDefinition(requirement.checkCode);
                      if (!definition) return null;
                      return (
                        <tr key={requirement.checkCode}>
                          <td className="font-medium text-navy-900">{definition.label}</td>
                          <td className="text-xs">{humanize(definition.category)}</td>
                          <td>
                            {requirement.blocking ? (
                              <Badge tone="exception">Blocking</Badge>
                            ) : requirement.required ? (
                              <Badge tone="info">Required</Badge>
                            ) : (
                              <Badge tone="pending">Optional</Badge>
                            )}
                          </td>
                          <td className="text-xs text-slate-600">{definition.sourceLabel}</td>
                          <td className="text-right text-xs">{formatInr(definition.unitCostPaise)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="bid-label">Policy rules</p>
                <DataList
                  items={[
                    { label: 'Subject type', value: humanize(policy.subjectType) },
                    { label: 'Relationship', value: humanize(policy.relationshipType) },
                    { label: 'Approval rule', value: humanize(policy.approvalRule) },
                    { label: 'Auto-approve at', value: policy.thresholds.autoApproveScore },
                    { label: 'Review below', value: policy.thresholds.reviewScore },
                    { label: 'Validity', value: `${policy.validityDays} days` },
                    { label: 'Re-verify after', value: `${policy.reverificationDays} days` },
                    { label: 'Monitoring', value: humanize(policy.monitoringFrequency) },
                    { label: 'Consent required', value: policy.requiresConsent ? 'Yes' : 'No' },
                    { label: 'Estimated cost', value: formatInr(policy.estimatedCostPaise) },
                    { label: 'Longest SLA', value: `${policy.estimatedSlaHours}h` },
                  ]}
                />
              </div>
              <div>
                <p className="bid-label">Why these checks</p>
                <ul className="mt-1.5 space-y-1.5 text-xs text-slate-600">
                  {policy.rationale.map((line) => (
                    <li key={line}>· {line}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </Card>

        <Callout tone="neutral" title="No industry modules">
          There is no hospital module, no manufacturing module and no IT module in this codebase. There is one policy engine,
          one verification engine, one evidence model and one assessment model — and a catalog of checks that policies compose.
        </Callout>
      </div>
    </PublicLayout>
  );
}

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={cx(
        'rounded border px-3 py-1.5 text-sm transition',
        active ? 'border-brand-500 bg-brand-50 font-medium text-brand-800' : 'border-slate-200 text-slate-700 hover:border-slate-300',
      )}
    >
      {children}
    </button>
  );
}
