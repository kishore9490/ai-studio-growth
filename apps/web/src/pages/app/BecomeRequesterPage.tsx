import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Check, Rocket } from 'lucide-react';
import {
  INDUSTRY,
  INDUSTRY_LABEL,
  PRICING_DISCLAIMER,
  RISK_LEVEL,
  VERIFICATION_TARGET,
  generatePolicy,
  type Industry,
  type RiskLevel,
  type VerificationTarget,
} from '@bid/core';
import { usePlatform } from '../../platform/PlatformProvider';
import { Badge, Button, Callout, Card, SectionHeading, Stepper, cx } from '../../components/ui';
import { formatInr, humanize } from '../../lib/format';

const STEPS = [
  { id: 'what', label: 'What to verify' },
  { id: 'industry', label: 'Industry' },
  { id: 'risk', label: 'Risk level' },
  { id: 'plan', label: 'Plan' },
];

/**
 * The flywheel moment: a verified member decides to verify its own network.
 * Member → Requester → paying Customer, with the commercial state changing only
 * at the last step.
 */
export function BecomeRequesterPage() {
  const { platform, organization, isRequester, execute } = usePlatform();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [target, setTarget] = useState<VerificationTarget>('SUPPLIER');
  const [industry, setIndustry] = useState<Industry>(organization.industry);
  const [risk, setRisk] = useState<RiskLevel>('STANDARD');
  const [planId, setPlanId] = useState('');

  const generated = useMemo(() => generatePolicy({ target, industry, riskLevel: risk }), [target, industry, risk]);
  const plans = platform.billing.plans().filter((plan) => plan.tier !== 'MEMBER_FREE');

  const activate = async () => {
    await execute((c) => c.activateRequester(planId));
    // Give the new requester its generated policy so the first campaign is one
    // click away. Separate call on purpose: activation must succeed on its own
    // before anything is created under it.
    await execute((c) =>
      c.createPolicy({
        name: generated.name,
        description: generated.description,
        subjectType: generated.subjectType,
        relationshipType: generated.relationshipType,
        industry: generated.industry,
        riskLevel: generated.riskLevel,
        requiredChecks: generated.requiredChecks,
        optionalChecks: generated.optionalChecks,
        thresholds: generated.thresholds,
        validityDays: generated.validityDays,
        reverificationDays: generated.reverificationDays,
        monitoringFrequency: generated.monitoringFrequency,
        approvalRule: generated.approvalRule,
        requiresConsent: generated.requiresConsent,
      }),
    );
    navigate('/app/verifications/new');
  };

  if (isRequester) {
    return (
      <div className="space-y-4">
        <SectionHeading title="Requester capabilities are active" />
        <Callout tone="verified" title={`${organization.displayName} can initiate verification`}>
          This workspace can create policies, invite counterparties, run campaigns and enable monitoring.
        </Callout>
        <Button variant="primary" onClick={() => navigate('/app/verifications/new')}>
          Start a verification
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="rounded-lg border border-brand-200 bg-gradient-to-br from-brand-50 to-white p-5">
        <p className="bid-label text-brand-700">The other half of BID</p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-navy-900">Want to verify your own network?</h1>
        <p className="mt-1 max-w-2xl text-sm text-slate-600">
          {organization.displayName} has been verified by a counterparty. The same engine, policies and evidence model are
          available to you as a requester — for your suppliers, contractors, partners or candidates.
        </p>
      </div>

      <Card>
        <Stepper steps={STEPS} current={step} />
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            {step === 0 && (
              <div>
                <SectionHeading title="What do you want to verify?" />
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {VERIFICATION_TARGET.map((option) => (
                    <button
                      key={option}
                      onClick={() => setTarget(option)}
                      className={cx(
                        'rounded border px-3 py-2 text-sm transition',
                        target === option ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-slate-200 hover:border-slate-300',
                      )}
                    >
                      {humanize(option)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 1 && (
              <div>
                <SectionHeading title="In which industry?" description="Industry changes the policy, never the engine." />
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {INDUSTRY.map((option) => (
                    <button
                      key={option}
                      onClick={() => setIndustry(option)}
                      className={cx(
                        'rounded border px-3 py-2 text-sm transition',
                        industry === option ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-slate-200 hover:border-slate-300',
                      )}
                    >
                      {INDUSTRY_LABEL[option]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <SectionHeading title="How much risk does this relationship carry?" />
                <div className="mt-3 grid gap-2 sm:grid-cols-4">
                  {RISK_LEVEL.map((option) => (
                    <button
                      key={option}
                      onClick={() => setRisk(option)}
                      className={cx(
                        'rounded border px-3 py-2 text-sm transition',
                        risk === option ? 'border-brand-500 bg-brand-50 text-brand-800' : 'border-slate-200 hover:border-slate-300',
                      )}
                    >
                      {humanize(option)}
                    </button>
                  ))}
                </div>
                <div className="mt-4 rounded border border-slate-200 bg-slate-50 p-3">
                  <p className="bid-label">Generated policy preview</p>
                  <p className="mt-1 text-sm font-semibold text-navy-900">{generated.name}</p>
                  <ul className="mt-2 space-y-1 text-xs text-slate-600">
                    {generated.rationale.map((line) => (
                      <li key={line} className="flex gap-1.5">
                        <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                        {line}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {generated.requiredChecks.map((check) => (
                      <Badge key={check.checkCode} tone={check.blocking ? 'exception' : 'info'}>
                        {check.checkCode}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div>
                <SectionHeading title="Choose a requester plan" description={PRICING_DISCLAIMER} />
                <div className="mt-3 space-y-2">
                  {plans.map((plan) => (
                    <button
                      key={plan.id}
                      onClick={() => setPlanId(plan.id)}
                      className={cx(
                        'w-full rounded border p-3 text-left transition',
                        planId === plan.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300',
                      )}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-navy-900">{plan.name}</span>
                        <span className="text-sm font-semibold text-navy-900">
                          {plan.quoteOnly ? `From ${formatInr(plan.monthlyPricePaise)}/mo` : `${formatInr(plan.monthlyPricePaise)}/mo`}
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-slate-600">{plan.description}</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        <Badge tone="neutral">{plan.includedChecks} included checks</Badge>
                        <Badge tone="neutral">{plan.entitlements.maxSeats} seats</Badge>
                        <Badge tone="neutral">{plan.entitlements.maxMonitoredEntities} monitored entities</Badge>
                        {plan.entitlements.canUseApi && <Badge tone="brand">API</Badge>}
                        {plan.entitlements.canRunBgv && <Badge tone="brand">BGV</Badge>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
              <Button onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}>
                Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button variant="primary" onClick={() => setStep((value) => value + 1)} icon={<ArrowRight className="h-4 w-4" />}>
                  Continue
                </Button>
              ) : (
                <Button variant="primary" disabled={!planId} onClick={activate} icon={<Rocket className="h-4 w-4" />}>
                  Activate requester capabilities
                </Button>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <SectionHeading title="What changes" />
            <ul className="mt-3 space-y-2 text-sm text-slate-700">
              {[
                'Initiate verification of other organizations',
                'Create and version your own policies',
                'Run campaigns across many counterparties',
                'Enable continuous monitoring',
                'Issue credentials your counterparties can reuse',
                'API and webhook access, plan permitting',
              ].map((item) => (
                <li key={item} className="flex gap-2">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
          <Callout tone="neutral" title="What does not change">
            Your BID identity, your existing credentials and your membership stay exactly as they are. Becoming a requester
            adds capabilities; it does not alter the verification you already hold.
          </Callout>
        </div>
      </div>
    </div>
  );
}
