import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Send } from 'lucide-react';
import { RELATIONSHIP_TYPE, RELATIONSHIP_TYPE_LABEL, type RelationshipType } from '@bid/core';
import { usePlatform } from '../../platform/PlatformProvider';
import {
  Badge,
  Button,
  Callout,
  Card,
  DataList,
  Field,
  SectionHeading,
  Select,
  Stepper,
  TextInput,
  cx,
} from '../../components/ui';
import { formatInr, humanize } from '../../lib/format';

const STEPS = [
  { id: 'counterparty', label: 'Counterparty', description: 'Who are you verifying?' },
  { id: 'relationship', label: 'Relationship', description: 'How do they relate to you?' },
  { id: 'policy', label: 'Policy', description: 'What must be true?' },
  { id: 'review', label: 'Review & send', description: 'Plan, cost and SLA' },
];

export function NewVerificationPage() {
  const { platform, organization, entitlements, execute } = usePlatform();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [existingOrgId, setExistingOrgId] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('SUPPLIER');
  const [policyId, setPolicyId] = useState('');

  const candidates = platform.organizations
    .list()
    .filter((candidate) => candidate.id !== organization.id)
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  const policies = useMemo(
    () =>
      platform.policies
        .listForWorkspace(platform.organizations.workspaceFor(organization.id)?.id)
        .filter((policy) => policy.subjectType === 'ORGANIZATION')
        .sort((a, b) => {
          const score = (relationship: RelationshipType, value: string) => (value === relationship ? 0 : 1);
          return score(relationshipType, a.relationshipType) - score(relationshipType, b.relationshipType);
        }),
    [platform, organization.id, relationshipType],
  );

  const selectedPolicy = policyId ? platform.policies.get(policyId) : undefined;
  const plan = policyId ? platform.policies.plan(policyId) : undefined;
  const resolvedName = existingOrgId ? platform.organizations.get(existingOrgId)?.displayName ?? '' : name;

  if (!entitlements.canInitiateVerification) {
    return (
      <div className="space-y-4">
        <SectionHeading title="Start a verification" />
        <Callout tone="attention" title="Initiating verification is a requester capability">
          Your organization is a BID Member. Membership is free and lets you respond to requests and hold credentials.
          Initiating verification of other organizations requires a requester plan.
          <div className="mt-2">
            <Link to="/app/become-requester">
              <Button variant="primary" size="sm">
                See requester plans
              </Button>
            </Link>
          </div>
        </Callout>
      </div>
    );
  }

  const canContinue =
    (step === 0 && (existingOrgId || (name.trim().length > 1 && email.includes('@')))) ||
    step === 1 ||
    (step === 2 && policyId) ||
    step === 3;

  const submit = async () => {
    const existing = existingOrgId ? platform.organizations.get(existingOrgId) : undefined;
    const result = await execute((c) =>
      c.inviteCounterparty({
        counterpartyName: resolvedName,
        counterpartyEmail: email || `contact@${resolvedName.toLowerCase().replace(/[^a-z]/g, '')}.example`,
        counterpartyOrganizationBidId: existing?.bidId,
        relationshipType,
        policyId,
      }),
    );
    navigate(`/app/verifications/${result.verificationId}`);
  };

  return (
    <div className="space-y-5">
      <div>
        <Link to="/app/verifications" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-3 w-3" /> Verifications
        </Link>
        <SectionHeading
          className="mt-2"
          title="Start a verification"
          description="An invitation, a relationship and a verification request are created together. The counterparty becomes a BID Member — not a paying customer."
        />
      </div>

      <Card>
        <Stepper steps={STEPS} current={step} />
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            {step === 0 && (
              <div className="space-y-4">
                <SectionHeading title="Who are you verifying?" description="Pick an organization already in the network, or invite a new one." />
                <Field label="Existing organization">
                  <Select
                    value={existingOrgId}
                    onChange={(event) => {
                      setExistingOrgId(event.target.value);
                      const org = platform.organizations.get(event.target.value);
                      if (org) setName(org.displayName);
                    }}
                  >
                    <option value="">— Invite a new organization —</option>
                    {candidates.map((candidate) => (
                      <option key={candidate.id} value={candidate.id}>
                        {candidate.displayName} ({candidate.bidId}) · {humanize(candidate.commercialState)}
                      </option>
                    ))}
                  </Select>
                </Field>
                {!existingOrgId && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    <Field label="Legal / trading name" required>
                      <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Deltaform Industries" />
                    </Field>
                    <Field label="Contact email" required hint="The invitation is addressed here.">
                      <TextInput value={email} onChange={(event) => setEmail(event.target.value)} placeholder="contracts@example.com" />
                    </Field>
                  </div>
                )}
              </div>
            )}

            {step === 1 && (
              <div className="space-y-4">
                <SectionHeading
                  title="How does this organization relate to you?"
                  description="A relationship is a first-class object. The same organization can be your supplier and someone else's customer."
                />
                <div className="grid gap-2 sm:grid-cols-3">
                  {RELATIONSHIP_TYPE.filter((type) => type !== 'VERIFIED_BY' && type !== 'CANDIDATE').map((type) => (
                    <button
                      key={type}
                      onClick={() => setRelationshipType(type)}
                      className={cx(
                        'rounded border px-3 py-2 text-left text-sm transition',
                        relationshipType === type
                          ? 'border-brand-500 bg-brand-50 text-brand-800'
                          : 'border-slate-200 hover:border-slate-300',
                      )}
                    >
                      {RELATIONSHIP_TYPE_LABEL[type]}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <SectionHeading
                  title="Which policy applies?"
                  description="The policy decides what must be checked, how deeply, and how often it is re-checked. Industry differences live here, not in the engine."
                />
                <div className="space-y-2">
                  {policies.map((policy) => {
                    const policyPlan = platform.policies.plan(policy.id);
                    return (
                      <button
                        key={policy.id}
                        onClick={() => setPolicyId(policy.id)}
                        className={cx(
                          'w-full rounded border p-3 text-left transition',
                          policyId === policy.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300',
                        )}
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="text-sm font-semibold text-navy-900">{policy.name}</span>
                          <div className="flex items-center gap-1.5">
                            <Badge tone={policy.riskLevel === 'CRITICAL' ? 'exception' : policy.riskLevel === 'HIGH' ? 'attention' : 'info'}>
                              {humanize(policy.riskLevel)} risk
                            </Badge>
                            <Badge tone="neutral">{policyPlan.checks.length} checks</Badge>
                            {policy.relationshipType === relationshipType && <Badge tone="brand">Suggested</Badge>}
                          </div>
                        </div>
                        <p className="mt-1 text-xs text-slate-600">{policy.description}</p>
                        <p className="mt-1 text-2xs text-slate-500">
                          Estimated {formatInr(policyPlan.estimatedCostPaise)} · longest SLA {policyPlan.estimatedSlaHours}h ·{' '}
                          {policyPlan.requiresConsent ? 'consent required' : 'no personal consent required'}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {step === 3 && plan && selectedPolicy && (
              <div className="space-y-4">
                <SectionHeading title="Review the compiled verification plan" description="This plan is frozen against the current policy version at the moment you send it." />
                <div className="overflow-x-auto">
                  <table className="bid-table">
                    <thead>
                      <tr>
                        <th>Check</th>
                        <th>Category</th>
                        <th>Requirement</th>
                        <th>Source</th>
                        <th className="text-right">Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {plan.checks.map((check) => (
                        <tr key={check.checkCode}>
                          <td className="font-medium text-navy-900">{check.definition.label}</td>
                          <td className="text-xs">{humanize(check.definition.category)}</td>
                          <td>
                            {check.blocking ? (
                              <Badge tone="exception">Blocking</Badge>
                            ) : check.required ? (
                              <Badge tone="info">Required</Badge>
                            ) : (
                              <Badge tone="pending">Optional</Badge>
                            )}
                          </td>
                          <td className="text-xs text-slate-600">{check.definition.sourceLabel}</td>
                          <td className="text-right text-xs">{formatInr(check.definition.unitCostPaise)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Callout tone="info" title="What happens when you send this">
                  {resolvedName} receives an invitation, claims its BID identity if it does not have one, and becomes a BID
                  Member. Checks execute against routed providers, produce evidence, and roll up into an assessment you decide on.
                </Callout>
              </div>
            )}

            <div className="mt-5 flex items-center justify-between border-t border-slate-200 pt-4">
              <Button onClick={() => setStep((value) => Math.max(0, value - 1))} disabled={step === 0}>
                Back
              </Button>
              {step < STEPS.length - 1 ? (
                <Button variant="primary" disabled={!canContinue} onClick={() => setStep((value) => value + 1)} icon={<ArrowRight className="h-4 w-4" />}>
                  Continue
                </Button>
              ) : (
                <Button variant="primary" onClick={submit} icon={<Send className="h-4 w-4" />}>
                  Send invitation & create verification
                </Button>
              )}
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <SectionHeading title="Summary" />
            <DataList
              items={[
                { label: 'Counterparty', value: resolvedName || '—' },
                { label: 'Relationship', value: RELATIONSHIP_TYPE_LABEL[relationshipType] },
                { label: 'Policy', value: selectedPolicy?.name ?? '—' },
                { label: 'Checks', value: plan ? plan.checks.length : '—' },
                { label: 'Estimated cost', value: plan ? formatInr(plan.estimatedCostPaise) : '—' },
                { label: 'Longest SLA', value: plan ? `${plan.estimatedSlaHours}h` : '—' },
                { label: 'Consent needed', value: plan ? (plan.requiresConsent ? 'Yes' : 'No') : '—' },
              ]}
            />
          </Card>
          <Callout tone="neutral" title="Member ≠ customer">
            The organization you invite becomes a BID Member for free. It only becomes a paying customer if it later chooses
            to verify its own network.
          </Callout>
        </div>
      </div>
    </div>
  );
}
