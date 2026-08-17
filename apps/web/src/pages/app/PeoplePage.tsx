import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, UserPlus } from 'lucide-react';
import { usePlatform } from '../../platform/PlatformProvider';
import {
  Badge,
  Button,
  Callout,
  Card,
  EmptyState,
  Field,
  Modal,
  SectionHeading,
  Select,
  TextInput,
  Toast,
} from '../../components/ui';
import { VerificationStatusBadge } from '../../components/domain';
import { humanize, relativeTime } from '../../lib/format';

/**
 * People verification (Section 24). Deliberately privacy-first: no public
 * candidate directory, consent-gated execution, restricted evidence.
 */
export function PeoplePage() {
  const { platform, workspace, organization, entitlements, run, runAsync } = usePlatform();
  const [open, setOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [policyId, setPolicyId] = useState('');
  const [toast, setToast] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const requests = workspace
    ? platform.verifications.listForWorkspace(workspace.id).filter((request) => request.subjectType === 'PERSON')
    : [];
  const peoplePolicies = platform.policies.listForWorkspace(workspace?.id).filter((policy) => policy.subjectType === 'PERSON');

  return (
    <div className="space-y-5">
      <Toast message={toast} onDismiss={() => setToast(null)} />
      <SectionHeading
        title="People & background verification"
        description="Candidate and employee verification runs on the same engine, with consent as a hard gate and restricted evidence visibility."
        actions={
          <Button
            variant="primary"
            icon={<UserPlus className="h-4 w-4" />}
            disabled={!entitlements.canRunBgv}
            onClick={() => {
              setPolicyId(peoplePolicies[0]?.id ?? '');
              setOpen(true);
            }}
          >
            New BGV request
          </Button>
        }
      />

      {!entitlements.canRunBgv && (
        <Callout tone="attention" title="BGV is a plan capability">
          People verification requires the Growth plan or above, because it carries additional privacy and provider
          obligations. <Link className="underline" to="/app/billing">See plans</Link>.
        </Callout>
      )}

      <Callout tone="neutral" title="Privacy posture">
        BID does not operate a public candidate database and does not sell personal data. A person record is visible only to
        the workspace that ran the verification, under a consent whose purpose and scope are recorded. Consent can be
        revoked, and evidence is classified RESTRICTED by default.
      </Callout>

      <Card padded={false}>
        {requests.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No people verifications" description="Create a BGV request to see the consent-gated flow." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="bid-table">
              <thead>
                <tr>
                  <th>Person</th>
                  <th>Policy</th>
                  <th>Consent</th>
                  <th>Status</th>
                  <th>Assessment</th>
                  <th className="text-right">Updated</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => {
                  const person = request.subjectPersonId ? platform.store.persons.get(request.subjectPersonId) : undefined;
                  const consent = request.consentId ? platform.store.consents.get(request.consentId) : undefined;
                  const assessment = platform.verifications.assessment(request.id);
                  return (
                    <tr key={request.id}>
                      <td>
                        <Link to={`/app/verifications/${request.id}`} className="font-medium text-navy-900 hover:underline">
                          {request.subjectName}
                        </Link>
                        <div className="font-mono text-2xs text-slate-400">{person?.bidId}</div>
                      </td>
                      <td className="text-xs">{platform.policies.get(request.policyId)?.name}</td>
                      <td>
                        {consent ? (
                          <Badge tone={consent.status === 'GRANTED' ? 'verified' : consent.status === 'REVOKED' ? 'exception' : 'attention'}>
                            {humanize(consent.status)}
                          </Badge>
                        ) : (
                          <Badge tone="pending">Not required</Badge>
                        )}
                      </td>
                      <td>
                        <VerificationStatusBadge status={request.status} />
                      </td>
                      <td className="text-xs">{assessment ? `${assessment.score}/100` : '—'}</td>
                      <td className="text-right text-xs text-slate-500">{relativeTime(request.updatedAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="New background verification"
        description="The person is asked for consent before any check executes."
        footer={
          <>
            <Button onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              loading={busy}
              disabled={!fullName || !email.includes('@') || !policyId || !workspace}
              icon={<ShieldCheck className="h-4 w-4" />}
              onClick={async () => {
                if (!workspace) return;
                setBusy(true);
                try {
                  await runAsync(async (p) => {
                    const person = p.organizations.createPerson({ fullName, email, phone: phone || '0000000000' });
                    const relationship = p.relationships.create({
                      workspaceId: workspace.id,
                      sourceOrganizationId: organization.id,
                      targetType: 'PERSON',
                      targetPersonId: person.id,
                      type: 'CANDIDATE',
                      policyId,
                      lifecycle: 'VERIFICATION',
                    });
                    const request = p.verifications.create({
                      workspaceId: workspace.id,
                      requesterOrganizationId: organization.id,
                      subjectType: 'PERSON',
                      subjectPersonId: person.id,
                      subjectName: person.fullName,
                      relationshipId: relationship.id,
                      relationshipType: 'CANDIDATE',
                      policyId,
                    });
                    p.verifications.requestConsent({ verificationRequestId: request.id });
                    return request;
                  });
                  setToast('BGV request created. It is blocked until the candidate grants consent.');
                  setOpen(false);
                  setFullName('');
                  setEmail('');
                  setPhone('');
                } finally {
                  setBusy(false);
                }
              }}
            >
              Create request
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Full name" required>
            <TextInput value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="e.g. Ravi Kumar" />
          </Field>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Email" required hint="Stored masked.">
              <TextInput value={email} onChange={(event) => setEmail(event.target.value)} />
            </Field>
            <Field label="Phone" hint="Stored masked.">
              <TextInput value={phone} onChange={(event) => setPhone(event.target.value)} />
            </Field>
          </div>
          <Field label="Policy" required>
            <Select value={policyId} onChange={(event) => setPolicyId(event.target.value)}>
              <option value="">Select a people policy…</option>
              {peoplePolicies.map((policy) => (
                <option key={policy.id} value={policy.id}>
                  {policy.name}
                </option>
              ))}
            </Select>
          </Field>
          <Callout tone="info" title="Consent, not authorization">
            The candidate's consent permits processing. Authorization is a separate object — for example, an employer
            authorizing a staffing partner to run BGV on its behalf.
          </Callout>
        </div>
      </Modal>
    </div>
  );
}
