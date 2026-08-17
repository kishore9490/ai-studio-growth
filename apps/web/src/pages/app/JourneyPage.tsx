import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Play, RotateCcw } from 'lucide-react';
import { getPolicyTemplate } from '@bid/core';
import { usePlatform } from '../../platform/PlatformProvider';
import { Badge, Button, Callout, Card, ProgressBar, SectionHeading, Toast, cx } from '../../components/ui';
import { DEMO_BID_IDS } from '@bid/core';

interface JourneyState {
  supplierOrgId?: string;
  invitationId?: string;
  verificationId?: string;
  policyId?: string;
  campaignId?: string;
  subSupplierOrgId?: string;
  subVerificationId?: string;
  supplierWorkspaceId?: string;
}

interface JourneyStep {
  id: string;
  title: string;
  detail: string;
  actor: string;
  run: () => Promise<string> | string;
  link?: string;
}

/**
 * The golden path (Section 57). Every step performs a real mutation against the
 * same engine the rest of the product uses — nothing here is a slideshow.
 */
export function JourneyPage() {
  const { platform, run, runAsync, switchOrganization } = usePlatform();
  const [index, setIndex] = useState(0);
  const [log, setLog] = useState<{ step: string; result: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const state = useRef<JourneyState>({});

  const abc = platform.organizations.byBidId(DEMO_BID_IDS.ABC);
  const abcWorkspace = abc ? platform.organizations.workspaceFor(abc.id) : undefined;

  const steps: JourneyStep[] = [
    {
      id: 'view-abc',
      actor: 'You',
      title: 'View as ABC Technologies',
      detail: 'ABC is an existing BID customer on the Business plan. Everything you do next happens inside its workspace.',
      run: () => {
        if (abc) switchOrganization(abc.id);
        return 'Session switched to ABC Technologies (BID-BUS-00104).';
      },
      link: '/app',
    },
    {
      id: 'create-policy',
      actor: 'ABC',
      title: 'Create a policy for a new supplier category',
      detail: 'ABC starts from the BID “Critical Supplier” template and saves it as its own versioned workspace policy.',
      run: () => {
        const template = getPolicyTemplate('CRITICAL_SUPPLIER');
        if (!template || !abcWorkspace || !abc) return 'ABC workspace unavailable.';
        const policy = run((p) =>
          p.policies.createFromTemplate(template, {
            workspaceId: abcWorkspace.id,
            createdBy: abc.displayName,
            name: 'ABC — Tier-1 supplier policy',
          }),
        );
        state.current.policyId = policy.id;
        return `Policy "${policy.name}" created at version 1 with ${platform.policies.plan(policy.id).checks.length} checks.`;
      },
      link: '/app/policies',
    },
    {
      id: 'create-campaign',
      actor: 'ABC',
      title: 'Open a verification campaign',
      detail: 'Campaigns batch the same policy across many counterparties with an SLA.',
      run: () => {
        if (!abcWorkspace || !abc || !state.current.policyId) return 'Run the previous step first.';
        const campaign = run((p) =>
          p.campaigns.create({
            workspaceId: abcWorkspace.id,
            requesterOrganizationId: abc.id,
            name: 'Tier-1 supplier onboarding',
            policyId: state.current.policyId!,
            relationshipType: 'SUPPLIER',
          }),
        );
        state.current.campaignId = campaign.id;
        return `Campaign "${campaign.name}" (${campaign.bidId}) is active.`;
      },
      link: '/app/campaigns',
    },
    {
      id: 'invite',
      actor: 'ABC',
      title: 'Invite Deltaform Industries',
      detail:
        'An organization identity, a relationship, an invitation and a verification request are created together. Deltaform is not yet a member — it has only been discovered and invited.',
      run: () => {
        if (!abc || !state.current.policyId) return 'Run the previous steps first.';
        const result = run((p) =>
          p.inviteCounterparty({
            requesterOrganizationId: abc.id,
            counterpartyName: 'Deltaform Industries',
            counterpartyEmail: 'contracts@deltaform.example',
            relationshipType: 'SUPPLIER',
            policyId: state.current.policyId!,
            campaignId: state.current.campaignId,
            industry: 'MANUFACTURING',
          }),
        );
        state.current.supplierOrgId = result.counterparty.id;
        state.current.invitationId = result.invitation.id;
        state.current.verificationId = result.verification.id;
        return `Deltaform Industries invited. Verification ${result.verification.bidId} is at status INVITED.`;
      },
      link: '/app/requests-sent',
    },
    {
      id: 'accept',
      actor: 'Deltaform',
      title: 'Deltaform accepts and claims its BID identity',
      detail:
        'Accepting provisions Deltaform’s own private workspace and makes it a BID Member — free, and explicitly not a paying customer.',
      run: () => {
        if (!state.current.invitationId) return 'Run the previous steps first.';
        const result = run((p) => p.acceptInvitation(state.current.invitationId!));
        state.current.supplierWorkspaceId = result.workspace?.id;
        return `${result.organization.displayName} claimed ${result.organization.bidId} and is now a BID Member.`;
      },
      link: '/app/requests-sent',
    },
    {
      id: 'documents',
      actor: 'Deltaform',
      title: 'Deltaform provides the documents the policy asked for',
      detail:
        'The policy does not only trigger provider checks — it names the paperwork the subject must supply. Until those arrive, the dependent checks stay blocked rather than quietly scoring zero.',
      run: () => {
        if (!state.current.verificationId) return 'Run the previous steps first.';
        const provided = run((p) => p.provideAllDocuments(state.current.verificationId!));
        return provided.length
          ? `${provided.length} document(s) provided: ${provided.map((document) => document.label).join(', ')}.`
          : 'This policy required no documents.';
      },
      link: undefined,
    },
    {
      id: 'run-checks',
      actor: 'BID engine',
      title: 'Run the verification plan',
      detail:
        'Each check is routed to a provider, normalized, written as evidence with full provenance, and rolled into an explainable assessment.',
      run: async () => {
        if (!state.current.verificationId) return 'Run the previous steps first.';
        const request = await runAsync((p) => p.runVerification(state.current.verificationId!));
        const assessment = platform.verifications.assessment(request.id);
        return `Checks complete. Assessment ${assessment?.score ?? '—'}/100 (${assessment?.band ?? '—'}). Status: ${request.status}.`;
      },
      link: undefined,
    },
    {
      id: 'review',
      actor: 'ABC',
      title: 'Review the evidence and decide',
      detail: 'BID never decides whether a counterparty is acceptable. ABC records the decision, and it lands in the audit trail.',
      run: () => {
        if (!state.current.verificationId) return 'Run the previous steps first.';
        const request = platform.verifications.get(state.current.verificationId);
        if (!request) return 'Verification not found.';
        if (request.decision !== 'PENDING') return `Decision already recorded: ${request.decision}.`;
        const decided = run((p) =>
          p.verifications.decide(request.id, 'APPROVED', 'Identity, financial and screening evidence accepted by procurement.'),
        );
        return `Decision recorded: ${decided.decision}. Credential issued to Deltaform Industries.`;
      },
      link: undefined,
    },
    {
      id: 'verified-member',
      actor: 'Deltaform',
      title: 'Deltaform is now a Verified BID Member',
      detail: 'Its digital card and public profile go live, reusable with the next customer that asks it to verify.',
      run: () => {
        if (!state.current.supplierOrgId) return 'Run the previous steps first.';
        switchOrganization(state.current.supplierOrgId);
        const organization = platform.organizations.require(state.current.supplierOrgId);
        return `Session switched to ${organization.displayName} — commercial state ${organization.commercialState}.`;
      },
      link: '/app/credentials',
    },
    {
      id: 'discovery',
      actor: 'Deltaform',
      title: 'Deltaform discovers the other half of BID',
      detail: '“Want to verify your own network?” This is the flywheel moment — subject today, requester tomorrow.',
      run: () => 'Requester activation flow opened.',
      link: '/app/become-requester',
    },
    {
      id: 'activate',
      actor: 'Deltaform',
      title: 'Activate requester capabilities on the Growth plan',
      detail: 'Only now does the commercial state change to CUSTOMER, and only now does billing start.',
      run: () => {
        if (!state.current.supplierOrgId) return 'Run the previous steps first.';
        const growth = platform.billing.planByTier('GROWTH');
        if (!growth) return 'Growth plan unavailable.';
        const result = run((p) => p.activateRequester({ organizationId: state.current.supplierOrgId!, planId: growth.id }));
        state.current.supplierWorkspaceId = result.workspace.id;
        const organization = platform.organizations.require(state.current.supplierOrgId);
        return `${organization.displayName} is now a paying BID customer on ${growth.name}.`;
      },
      link: '/app/billing',
    },
    {
      id: 'invite-sub',
      actor: 'Deltaform',
      title: 'Deltaform invites its own supplier',
      detail: 'The network extends by one hop. Kavya Metals becomes a member exactly the way Deltaform did.',
      run: () => {
        if (!state.current.supplierOrgId) return 'Run the previous steps first.';
        const policy = platform.policies.listAll().find((candidate) => candidate.name === 'Standard Supplier Policy');
        if (!policy) return 'Standard supplier policy unavailable.';
        const result = run((p) =>
          p.inviteCounterparty({
            requesterOrganizationId: state.current.supplierOrgId!,
            counterpartyName: 'Kavya Metals',
            counterpartyEmail: 'sales@kavya-metals.example',
            relationshipType: 'SUPPLIER',
            policyId: policy.id,
            industry: 'MANUFACTURING',
          }),
        );
        state.current.subSupplierOrgId = result.counterparty.id;
        state.current.subVerificationId = result.verification.id;
        run((p) => p.acceptInvitation(result.invitation.id));
        return `Kavya Metals invited, accepted, and issued ${platform.organizations.require(result.counterparty.id).bidId}.`;
      },
      link: '/app/relationships',
    },
    {
      id: 'verify-sub',
      actor: 'BID engine',
      title: 'Verify Kavya Metals',
      detail: 'Same engine, different policy and different tenant. Deltaform sees this evidence; ABC does not.',
      run: async () => {
        if (!state.current.subVerificationId) return 'Run the previous steps first.';
        const request = await runAsync((p) => p.runVerification(state.current.subVerificationId!));
        const assessment = platform.verifications.assessment(request.id);
        if (request.decision === 'PENDING') {
          run((p) => p.verifications.decide(request.id, 'APPROVED', 'Supplier evidence accepted.'));
        }
        return `Kavya Metals verified — assessment ${assessment?.score ?? '—'}/100.`;
      },
      link: '/app/verifications',
    },
    {
      id: 'monitoring',
      actor: 'Deltaform',
      title: 'Enable continuous monitoring',
      detail: 'A verification is a point-in-time statement; monitoring is what keeps it meaningful.',
      run: () => {
        if (!state.current.supplierWorkspaceId) return 'Run the previous steps first.';
        const rules = run((p) => p.enableMonitoringForWorkspace(state.current.supplierWorkspaceId!));
        const raised = run((p) => p.monitoring.runSweep(state.current.supplierWorkspaceId!, 3));
        return `Monitoring active on ${rules.length} relationship(s); sweep raised ${raised.length} signal(s).`;
      },
      link: '/app/monitoring',
    },
    {
      id: 'network',
      actor: 'You',
      title: 'See the expanded network',
      detail: 'ABC → Deltaform → Kavya Metals. Each hop was invited by the previous one — that is the acquisition model.',
      run: () => 'Network graph ready.',
      link: '/app/network',
    },
  ];

  const execute = async (stepIndex: number) => {
    const step = steps[stepIndex];
    setBusy(true);
    try {
      const result = await step.run();
      setLog((entries) => [...entries, { step: step.title, result }]);
      setToast(result);
      setIndex(Math.min(steps.length - 1, stepIndex + 1));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setLog((entries) => [...entries, { step: step.title, result: `Blocked: ${message}` }]);
      setToast(`Blocked: ${message}`);
    } finally {
      setBusy(false);
    }
  };

  const runAll = async () => {
    for (let i = index; i < steps.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await execute(i);
    }
  };

  return (
    <div className="space-y-5">
      <Toast message={toast} onDismiss={() => setToast(null)} />
      <SectionHeading
        title="Guided journey — the golden path"
        description="Fifteen steps that take a counterparty from “never heard of BID” to “paying customer verifying its own network”. Every step mutates the real store."
        actions={
          <div className="flex gap-2">
            <Button
              icon={<RotateCcw className="h-4 w-4" />}
              onClick={() => {
                setIndex(0);
                setLog([]);
                state.current = {};
              }}
            >
              Reset guide
            </Button>
            <Button variant="primary" icon={<Play className="h-4 w-4" />} loading={busy} onClick={runAll}>
              Run remaining steps
            </Button>
          </div>
        }
      />

      <Card>
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>
            Step {Math.min(index + 1, steps.length)} of {steps.length}
          </span>
          <span>{log.length} completed</span>
        </div>
        <div className="mt-2">
          <ProgressBar value={(log.length / steps.length) * 100} tone="brand" />
        </div>
      </Card>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-2 lg:col-span-2">
          {steps.map((step, stepIndex) => {
            const done = log.some((entry) => entry.step === step.title);
            const active = stepIndex === index;
            return (
              <div
                key={step.id}
                className={cx(
                  'rounded-md border p-4 transition',
                  active ? 'border-brand-400 bg-brand-50/40 shadow-card' : done ? 'border-emerald-200 bg-white' : 'border-slate-200 bg-white',
                )}
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <span
                      className={cx(
                        'mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-2xs font-bold',
                        done ? 'bg-emerald-600 text-white' : active ? 'bg-brand-600 text-white' : 'bg-slate-200 text-slate-600',
                      )}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : stepIndex + 1}
                    </span>
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-navy-900">{step.title}</p>
                        <Badge tone="neutral">{step.actor}</Badge>
                      </div>
                      <p className="mt-1 max-w-2xl text-xs leading-relaxed text-slate-600">{step.detail}</p>
                      {done && (
                        <p className="mt-1.5 text-2xs text-emerald-700">
                          {log.find((entry) => entry.step === step.title)?.result}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {step.link && done && (
                      <Link to={step.link}>
                        <Button size="sm">View</Button>
                      </Link>
                    )}
                    <Button size="sm" variant={active ? 'primary' : 'secondary'} loading={busy && active} onClick={() => execute(stepIndex)}>
                      {done ? 'Run again' : 'Run step'}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="space-y-4">
          <Callout tone="brand" title="What this demonstrates">
            Member ≠ customer. Deltaform holds a BID identity, a credential and a public profile before a single rupee is
            billed. It becomes a customer only when it decides to verify its own network — and then it invites the next
            organization.
          </Callout>
          <Card>
            <SectionHeading title="Journey log" />
            <div className="mt-2 space-y-2">
              {log.length === 0 && <p className="text-sm text-slate-500">No steps run yet.</p>}
              {log.map((entry, entryIndex) => (
                <div key={entryIndex} className="rounded border border-slate-200 p-2.5">
                  <p className="text-xs font-medium text-navy-900">{entry.step}</p>
                  <p className="mt-0.5 text-2xs text-slate-600">{entry.result}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
