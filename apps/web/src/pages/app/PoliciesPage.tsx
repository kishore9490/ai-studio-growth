import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Lock, Plus } from 'lucide-react';
import { CHECK_CATALOG, getCheckDefinition, type PolicyCheckRequirement } from '@bid/core';
import { usePlatform } from '../../platform/PlatformProvider';
import {
  Badge,
  Button,
  Callout,
  Card,
  DataList,
  Field,
  Modal,
  SectionHeading,
  Select,
  TextInput,
  Toast,
  Toggle,
  cx,
} from '../../components/ui';
import { formatDate, formatInr, humanize } from '../../lib/format';

export function PoliciesPage() {
  const { platform, workspace, organization, entitlements, run } = usePlatform();
  const [createOpen, setCreateOpen] = useState(false);
  const [templateKey, setTemplateKey] = useState(platform.policies.templates()[0]?.key ?? '');
  const [name, setName] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const policies = platform.policies.listForWorkspace(workspace?.id);
  const systemPolicies = policies.filter((policy) => policy.system);
  const ownPolicies = policies.filter((policy) => !policy.system);

  return (
    <div className="space-y-5">
      <Toast message={toast} onDismiss={() => setToast(null)} />
      <SectionHeading
        title="Policies"
        description="A policy states what must be true about a counterparty, how deeply it is checked, who approves, and how often it is re-checked. Industry differences live here."
        actions={
          <Button
            variant="primary"
            icon={<Plus className="h-4 w-4" />}
            onClick={() => setCreateOpen(true)}
            disabled={!entitlements.canCreatePolicies}
            title={entitlements.canCreatePolicies ? undefined : 'Requires a plan that includes custom policies'}
          >
            New policy
          </Button>
        }
      />

      {!entitlements.canCreatePolicies && (
        <Callout tone="attention" title="Custom policies are a plan capability">
          You can use every BID-published template below. Creating your own versioned policies requires the Growth plan or
          above.
        </Callout>
      )}

      {ownPolicies.length > 0 && (
        <div>
          <p className="bid-label mb-2">Workspace policies</p>
          <PolicyGrid policyIds={ownPolicies.map((p) => p.id)} />
        </div>
      )}

      <div>
        <p className="bid-label mb-2">BID-published templates</p>
        <PolicyGrid policyIds={systemPolicies.map((p) => p.id)} />
      </div>

      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a policy"
        description="Start from a BID template, then version it as your requirements change."
        footer={
          <>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                const template = platform.policies.templates().find((t) => t.key === templateKey);
                if (!template || !workspace) return;
                run((p) =>
                  p.policies.createFromTemplate(template, {
                    workspaceId: workspace.id,
                    createdBy: organization.displayName,
                    name: name || `${template.name} (${organization.displayName})`,
                  }),
                );
                setCreateOpen(false);
                setName('');
                setToast('Policy created at version 1.');
              }}
            >
              Create policy
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Base template">
            <Select value={templateKey} onChange={(event) => setTemplateKey(event.target.value)}>
              {platform.policies.templates().map((template) => (
                <option key={template.key} value={template.key}>
                  {template.name} · {humanize(template.riskLevel)} risk
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Policy name" hint="Leave blank to use the template name.">
            <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Tier-1 supplier policy" />
          </Field>
        </div>
      </Modal>
    </div>
  );
}

function PolicyGrid({ policyIds }: { policyIds: string[] }) {
  const { platform } = usePlatform();
  return (
    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
      {policyIds.map((policyId) => {
        const policy = platform.policies.require(policyId);
        const plan = platform.policies.plan(policyId);
        const sealed = platform.policies.isSealed(policyId, policy.currentVersion);
        return (
          <Link key={policy.id} to={`/app/policies/${policy.id}`} className="bid-card p-4 transition hover:border-brand-300">
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold text-navy-900">{policy.name}</p>
              <Badge tone={policy.riskLevel === 'CRITICAL' ? 'exception' : policy.riskLevel === 'HIGH' ? 'attention' : 'info'}>
                {humanize(policy.riskLevel)}
              </Badge>
            </div>
            <p className="mt-1 line-clamp-2 text-xs text-slate-600">{policy.description}</p>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <Badge tone="neutral">{plan.checks.length} checks</Badge>
              <Badge tone="neutral">v{policy.currentVersion}</Badge>
              <Badge tone="neutral">{humanize(policy.subjectType)}</Badge>
              {sealed && (
                <Badge tone="pending">
                  <Lock className="mr-0.5 h-2.5 w-2.5" /> sealed
                </Badge>
              )}
            </div>
            <p className="mt-2 text-2xs text-slate-500">
              Est. {formatInr(plan.estimatedCostPaise)} · SLA {plan.estimatedSlaHours}h ·{' '}
              {plan.requiresConsent ? 'consent required' : 'no personal consent'}
            </p>
          </Link>
        );
      })}
    </div>
  );
}

export function PolicyDetailPage() {
  const { id = '' } = useParams();
  const { platform, entitlements, run } = usePlatform();
  const [versionOpen, setVersionOpen] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [draftChecks, setDraftChecks] = useState<string[]>([]);
  const [autoApprove, setAutoApprove] = useState(75);

  const policy = platform.policies.get(id);
  const versions = useMemo(() => (policy ? platform.policies.versions(policy.id) : []), [platform, policy]);

  if (!policy) {
    return (
      <Callout tone="exception" title="Policy not found">
        <Link className="underline" to="/app/policies">
          Back to policies
        </Link>
      </Callout>
    );
  }

  const current = platform.policies.currentVersion(policy.id);
  const plan = platform.policies.plan(policy.id);
  const sealed = Boolean(current.sealedAt);
  const usedBy = platform.store.verificationRequests.find((request) => request.policyId === policy.id);

  const openVersionEditor = () => {
    setDraftChecks(current.requiredChecks.map((check) => check.checkCode));
    setAutoApprove(current.thresholds.autoApproveScore);
    setVersionOpen(true);
  };

  return (
    <div className="space-y-5">
      <Toast message={toast} onDismiss={() => setToast(null)} />
      <div>
        <Link to="/app/policies" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-3 w-3" /> Policies
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-navy-900">{policy.name}</h1>
            <p className="mt-1 max-w-3xl text-sm text-slate-600">{policy.description}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge tone="neutral">{policy.bidId}</Badge>
              <Badge tone="info">{humanize(policy.subjectType)}</Badge>
              <Badge tone="neutral">{humanize(policy.relationshipType)}</Badge>
              <Badge tone="neutral">{humanize(policy.industry)}</Badge>
              <Badge tone={policy.riskLevel === 'CRITICAL' ? 'exception' : 'attention'}>{humanize(policy.riskLevel)} risk</Badge>
              {policy.system && <Badge tone="brand">BID template</Badge>}
            </div>
          </div>
          <Button variant="primary" onClick={openVersionEditor} disabled={!entitlements.canCreatePolicies}>
            Create new version
          </Button>
        </div>
      </div>

      {sealed && (
        <Callout tone="neutral" title={`Version ${current.version} is sealed`}>
          This version has justified at least one completed verification decision, so it can never be edited. Changes create
          version {current.version + 1}; historical decisions keep pointing at the version that produced them.
        </Callout>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card padded={false}>
            <div className="border-b border-slate-200 px-4 py-3">
              <SectionHeading title={`Checks in version ${current.version}`} description={`${plan.checks.length} checks compiled into the verification plan.`} />
            </div>
            <div className="overflow-x-auto">
              <table className="bid-table">
                <thead>
                  <tr>
                    <th>Check</th>
                    <th>Category</th>
                    <th>Requirement</th>
                    <th>Source</th>
                    <th>Validity</th>
                    <th className="text-right">Unit cost</th>
                  </tr>
                </thead>
                <tbody>
                  {plan.checks.map((check) => (
                    <tr key={check.checkCode}>
                      <td>
                        <div className="font-medium text-navy-900">{check.definition.label}</div>
                        <div className="text-2xs text-slate-500">{check.definition.description}</div>
                      </td>
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
                      <td className="text-xs">{check.validityDays}d</td>
                      <td className="text-right text-xs">{formatInr(check.definition.unitCostPaise)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <SectionHeading title="Required documents" />
            <div className="mt-3 space-y-2">
              {current.documents.length === 0 && <p className="text-sm text-slate-500">No documents required by this policy.</p>}
              {current.documents.map((document) => (
                <div key={document.code} className="flex items-center justify-between rounded border border-slate-200 px-3 py-2">
                  <div>
                    <p className="text-sm text-navy-900">{document.label}</p>
                    <p className="text-2xs text-slate-500">Visibility: {humanize(document.visibility)}</p>
                  </div>
                  <Badge tone={document.required ? 'info' : 'pending'}>{document.required ? 'Required' : 'Optional'}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card padded={false}>
            <div className="border-b border-slate-200 px-4 py-3">
              <SectionHeading title="Version history" description="Immutable once used for a completed decision." />
            </div>
            <div className="overflow-x-auto">
              <table className="bid-table">
                <thead>
                  <tr>
                    <th>Version</th>
                    <th>Checks</th>
                    <th>Approval</th>
                    <th>Auto-approve at</th>
                    <th>Validity</th>
                    <th>Created</th>
                    <th className="text-right">Sealed</th>
                  </tr>
                </thead>
                <tbody>
                  {versions.map((version) => (
                    <tr key={version.id} className={version.version === policy.currentVersion ? 'bg-brand-50/40' : undefined}>
                      <td className="font-medium text-navy-900">v{version.version}</td>
                      <td className="text-xs">{version.requiredChecks.length + version.optionalChecks.length}</td>
                      <td className="text-xs">{humanize(version.approvalRule)}</td>
                      <td className="text-xs">{version.thresholds.autoApproveScore}</td>
                      <td className="text-xs">{version.validityDays}d</td>
                      <td className="text-xs">{formatDate(version.createdAt)}</td>
                      <td className="text-right text-xs">{version.sealedAt ? formatDate(version.sealedAt) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <SectionHeading title="Rules" />
            <DataList
              items={[
                { label: 'Approval rule', value: humanize(current.approvalRule) },
                { label: 'Auto-approve score', value: current.thresholds.autoApproveScore },
                { label: 'Review score', value: current.thresholds.reviewScore },
                { label: 'Blocking failures tolerated', value: current.thresholds.maxBlockingFailures },
                { label: 'Validity', value: `${current.validityDays} days` },
                { label: 'Re-verification', value: `${current.reverificationDays} days` },
                { label: 'Monitoring', value: humanize(current.monitoringFrequency) },
                { label: 'Consent required', value: current.requiresConsent ? 'Yes' : 'No' },
                { label: 'Estimated cost', value: formatInr(plan.estimatedCostPaise) },
              ]}
            />
          </Card>

          <Card>
            <SectionHeading title="Used by" description={`${usedBy.length} verification(s)`} />
            <div className="mt-2 space-y-1.5">
              {usedBy.slice(0, 8).map((request) => (
                <Link
                  key={request.id}
                  to={`/app/verifications/${request.id}`}
                  className="flex items-center justify-between rounded border border-slate-200 px-2.5 py-1.5 text-xs hover:border-brand-300"
                >
                  <span className="font-medium text-navy-900">{request.subjectName}</span>
                  <span className="text-slate-500">v{request.policyVersion}</span>
                </Link>
              ))}
              {usedBy.length === 0 && <p className="text-sm text-slate-500">Not used yet.</p>}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        open={versionOpen}
        onClose={() => setVersionOpen(false)}
        title={`Create version ${policy.currentVersion + 1}`}
        description="The current version stays exactly as it is. Verifications already decided under it are unaffected."
        width="max-w-2xl"
        footer={
          <>
            <Button onClick={() => setVersionOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                const requiredChecks: PolicyCheckRequirement[] = draftChecks.map((code) => {
                  const existing = current.requiredChecks.find((check) => check.checkCode === code);
                  return existing ?? { checkCode: code, required: true, blocking: false };
                });
                run((p) =>
                  p.policies.createVersion(policy.id, {
                    requiredChecks,
                    thresholds: { ...current.thresholds, autoApproveScore: autoApprove },
                  }),
                );
                setVersionOpen(false);
                setToast(`Version ${policy.currentVersion + 1} created.`);
              }}
            >
              Create version
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Field label="Auto-approve score" hint="Assessments at or above this score are approved automatically when the approval rule is AUTO.">
            <TextInput
              type="number"
              value={autoApprove}
              onChange={(event) => setAutoApprove(Number(event.target.value))}
              min={0}
              max={100}
            />
          </Field>
          <div>
            <p className="bid-label mb-2">Required checks</p>
            <div className="grid max-h-72 gap-1.5 overflow-y-auto sm:grid-cols-2">
              {CHECK_CATALOG.filter((definition) => definition.subjectType === policy.subjectType).map((definition) => {
                const active = draftChecks.includes(definition.code);
                return (
                  <button
                    key={definition.code}
                    onClick={() =>
                      setDraftChecks((current) =>
                        current.includes(definition.code)
                          ? current.filter((code) => code !== definition.code)
                          : [...current, definition.code],
                      )
                    }
                    className={cx(
                      'rounded border px-2.5 py-2 text-left text-xs transition',
                      active ? 'border-brand-500 bg-brand-50' : 'border-slate-200 hover:border-slate-300',
                    )}
                  >
                    <span className="block font-medium text-navy-900">{definition.label}</span>
                    <span className="block text-2xs text-slate-500">
                      {humanize(definition.category)} · {formatInr(definition.unitCostPaise)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
          <Toggle checked label="New version becomes current immediately" onChange={() => undefined} />
          <p className="text-2xs text-slate-500">
            Selected: {draftChecks.map((code) => getCheckDefinition(code)?.label ?? code).join(', ') || 'none'}
          </p>
        </div>
      </Modal>
    </div>
  );
}
