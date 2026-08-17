import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Send } from 'lucide-react';
import { RELATIONSHIP_TYPE, RELATIONSHIP_TYPE_LABEL, type RelationshipType } from '@bid/core';
import { usePlatform } from '../../platform/PlatformProvider';
import {
  Badge,
  Button,
  Callout,
  Card,
  EmptyState,
  Field,
  Modal,
  ProgressBar,
  SectionHeading,
  Select,
  StatCard,
  TextInput,
  Toast,
} from '../../components/ui';
import { VerificationStatusBadge } from '../../components/domain';
import { formatDate, humanize } from '../../lib/format';

export function CampaignsPage() {
  const { platform, workspace, organization, entitlements, execute } = usePlatform();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [policyId, setPolicyId] = useState('');
  const [relationshipType, setRelationshipType] = useState<RelationshipType>('SUPPLIER');
  const [toast, setToast] = useState<string | null>(null);

  const campaigns = workspace ? platform.campaigns.listForWorkspace(workspace.id) : [];
  const policies = platform.policies.listForWorkspace(workspace?.id).filter((policy) => policy.subjectType === 'ORGANIZATION');

  return (
    <div className="space-y-5">
      <Toast message={toast} onDismiss={() => setToast(null)} />
      <SectionHeading
        title="Campaigns"
        description="Verify many counterparties under one policy, with SLA tracking and exception handling."
        actions={
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setOpen(true)} disabled={!entitlements.canCreateCampaigns}>
            New campaign
          </Button>
        }
      />

      {campaigns.length === 0 ? (
        <EmptyState title="No campaigns yet" description="A campaign is the right shape when you need to onboard a batch of suppliers or contractors at once." />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {campaigns.map((campaign) => {
            const progress = platform.campaigns.progress(campaign.id);
            return (
              <Link key={campaign.id} to={`/app/campaigns/${campaign.id}`} className="bid-card p-4 transition hover:border-brand-300">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-semibold text-navy-900">{campaign.name}</p>
                    <p className="mt-0.5 text-2xs text-slate-500">
                      {campaign.bidId} · {platform.policies.get(campaign.policyId)?.name}
                    </p>
                  </div>
                  <Badge tone={campaign.status === 'COMPLETED' ? 'verified' : 'info'}>{humanize(campaign.status)}</Badge>
                </div>
                <div className="mt-3">
                  <ProgressBar value={progress.completionRate} tone={progress.exceptions ? 'attention' : 'verified'} />
                </div>
                <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-2xs text-slate-500">
                  <span>{progress.invited} invited</span>
                  <span>{progress.registered} registered</span>
                  <span>{progress.completed} completed</span>
                  <span>{progress.exceptions} exceptions</span>
                  {progress.slaBreaches > 0 && <span className="text-red-600">{progress.slaBreaches} past SLA</span>}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New campaign"
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!name || !policyId}
              onClick={() => {
                if (!workspace) return;
                void execute((c) => c.createCampaign({ name, policyId, relationshipType }));
                setOpen(false);
                setName('');
                setToast('Campaign created. Add counterparties to invite them in one batch.');
              }}
            >
              Create campaign
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Campaign name" required>
            <TextInput value={name} onChange={(event) => setName(event.target.value)} placeholder="e.g. Q1 contractor verification" />
          </Field>
          <Field label="Relationship type">
            <Select value={relationshipType} onChange={(event) => setRelationshipType(event.target.value as RelationshipType)}>
              {RELATIONSHIP_TYPE.filter((type) => type !== 'VERIFIED_BY').map((type) => (
                <option key={type} value={type}>
                  {RELATIONSHIP_TYPE_LABEL[type]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Policy" required>
            <Select value={policyId} onChange={(event) => setPolicyId(event.target.value)}>
              <option value="">Select a policy…</option>
              {policies.map((policy) => (
                <option key={policy.id} value={policy.id}>
                  {policy.name}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}

export function CampaignDetailPage() {
  const { id = '' } = useParams();
  const { platform, execute } = usePlatform();
  const [addOpen, setAddOpen] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const campaign = platform.campaigns.get(id);
  if (!campaign) {
    return (
      <Callout tone="exception" title="Campaign not found">
        <Link className="underline" to="/app/campaigns">
          Back to campaigns
        </Link>
      </Callout>
    );
  }

  const progress = platform.campaigns.progress(campaign.id);
  const policy = platform.policies.get(campaign.policyId);

  return (
    <div className="space-y-5">
      <Toast message={toast} onDismiss={() => setToast(null)} />
      <div>
        <Link to="/app/campaigns" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-3 w-3" /> Campaigns
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-navy-900">{campaign.name}</h1>
            <p className="mt-1 text-xs text-slate-500">
              {campaign.bidId} · {policy?.name} · {humanize(campaign.relationshipType)} · SLA {campaign.slaDays} days · created{' '}
              {formatDate(campaign.createdAt)}
            </p>
          </div>
          <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setAddOpen(true)}>
            Add counterparty
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        <StatCard label="Invited" value={progress.invited} />
        <StatCard label="Registered" value={progress.registered} />
        <StatCard label="Completed" value={progress.completed} tone="verified" />
        <StatCard label="Exceptions" value={progress.exceptions} tone={progress.exceptions ? 'exception' : 'pending'} />
        <StatCard label="Past SLA" value={progress.slaBreaches} tone={progress.slaBreaches ? 'attention' : 'pending'} />
      </div>

      <Card padded={false}>
        <div className="border-b border-slate-200 px-4 py-3">
          <SectionHeading title="Counterparties" description={`${progress.completionRate}% complete`} />
          <div className="mt-2">
            <ProgressBar value={progress.completionRate} tone={progress.exceptions ? 'attention' : 'verified'} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="bid-table">
            <thead>
              <tr>
                <th>Counterparty</th>
                <th>State</th>
                <th>Verification</th>
                <th>Assessment</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {progress.members.map((member) => {
                const verification = member.verificationRequestId
                  ? platform.verifications.get(member.verificationRequestId)
                  : undefined;
                const assessment = verification ? platform.verifications.assessment(verification.id) : undefined;
                return (
                  <tr key={member.id}>
                    <td>
                      <div className="font-medium text-navy-900">{member.targetName}</div>
                      <div className="text-2xs text-slate-500">{member.targetEmail}</div>
                    </td>
                    <td>
                      <Badge
                        tone={
                          member.state === 'COMPLETED'
                            ? 'verified'
                            : member.state === 'EXCEPTION'
                              ? 'exception'
                              : member.state === 'PENDING_INVITE'
                                ? 'pending'
                                : 'info'
                        }
                      >
                        {humanize(member.state)}
                      </Badge>
                    </td>
                    <td>
                      {verification ? (
                        <Link to={`/app/verifications/${verification.id}`}>
                          <VerificationStatusBadge status={verification.status} />
                        </Link>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="text-xs">{assessment ? `${assessment.score}/100 · ${humanize(assessment.band)}` : '—'}</td>
                    <td className="text-right">
                      {member.state === 'PENDING_INVITE' && (
                        <Button
                          size="sm"
                          icon={<Send className="h-3 w-3" />}
                          onClick={() => {
                            void execute((c) => c.inviteCampaignMember(campaign.id, member.id));
                            setToast(`Invitation sent to ${member.targetName}.`);
                          }}
                        >
                          Send invitation
                        </Button>
                      )}
                    </td>
                  </tr>
                );
              })}
              {progress.members.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-sm text-slate-500">
                    No counterparties in this campaign yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Add a counterparty"
        description="They will be invited under this campaign's policy."
        footer={
          <>
            <Button onClick={() => setAddOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!memberName || !memberEmail.includes('@')}
              onClick={() => {
                void execute((c) =>
                  c.addCampaignMember({ campaignId: campaign.id, name: memberName, email: memberEmail }),
                );
                setAddOpen(false);
                setMemberName('');
                setMemberEmail('');
                setToast('Counterparty added. Send the invitation when ready.');
              }}
            >
              Add
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Organization name" required>
            <TextInput value={memberName} onChange={(event) => setMemberName(event.target.value)} />
          </Field>
          <Field label="Contact email" required>
            <TextInput value={memberEmail} onChange={(event) => setMemberEmail(event.target.value)} />
          </Field>
        </div>
      </Modal>
    </div>
  );
}
