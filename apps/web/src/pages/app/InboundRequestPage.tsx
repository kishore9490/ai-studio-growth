import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, FileUp, ShieldCheck } from 'lucide-react';
import { getCheckDefinition, type VerificationDocument } from '@bid/core';
import { usePlatform } from '../../platform/PlatformProvider';
import {
  Badge,
  Button,
  Callout,
  Card,
  DataList,
  Field,
  Modal,
  ProgressBar,
  SectionHeading,
  TextInput,
  Toast,
} from '../../components/ui';
import { AttributionChip, OrgAvatar, VerificationStatusBadge } from '../../components/domain';
import { formatDate, formatDateTime, humanize, percent } from '../../lib/format';

/**
 * The subject's side of a verification.
 *
 * A member is not a passive data subject: it can see exactly what was asked for,
 * what will be checked and against which sources, supply the documents the
 * policy requires, and grant or withhold consent.
 */
export function InboundRequestPage() {
  const { id = '' } = useParams();
  const { platform, organization, run } = usePlatform();
  const [uploadFor, setUploadFor] = useState<VerificationDocument | null>(null);
  const [fileName, setFileName] = useState('');
  const [note, setNote] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const request = platform.verifications.get(id);
  if (!request || request.subjectOrganizationId !== organization.id) {
    return (
      <Callout tone="exception" title="Request not found">
        This verification does not concern your organization.{' '}
        <Link className="underline" to="/app/requests-received">
          Back to requests received
        </Link>
      </Callout>
    );
  }

  const requester = platform.organizations.get(request.requesterOrganizationId);
  const policy = platform.policies.get(request.policyId);
  const plan = platform.policies.plan(request.policyId, request.policyVersion);
  const documents = platform.verifications.documents(request.id);
  const outstanding = platform.verifications.outstandingDocuments(request.id);
  const consent = request.consentId ? platform.store.consents.get(request.consentId) : undefined;
  const assessment = platform.verifications.assessment(request.id);
  const credential = request.credentialId ? platform.store.credentials.get(request.credentialId) : undefined;
  const provided = documents.filter((document) => document.status !== 'REQUESTED' && document.status !== 'REJECTED').length;

  return (
    <div className="space-y-5">
      <Toast message={toast} onDismiss={() => setToast(null)} />

      <div>
        <Link to="/app/requests-received" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-3 w-3" /> Requests received
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <OrgAvatar name={requester?.displayName ?? ''} color={requester?.logoColor} text={requester?.logoText} size="lg" />
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-navy-900">
                {requester?.displayName} asked you to verify
              </h1>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                <span className="font-mono">{request.bidId}</span>
                <span>·</span>
                <VerificationStatusBadge status={request.status} />
                <span>·</span>
                <span>
                  {policy?.name} <span className="text-slate-400">v{request.policyVersion}</span>
                </span>
                <span>·</span>
                <span>as a {humanize(request.relationshipType).toLowerCase()}</span>
              </div>
            </div>
          </div>
          {credential && (
            <Link to="/app/credentials">
              <Button variant="primary" icon={<ShieldCheck className="h-4 w-4" />}>
                View your credential
              </Button>
            </Link>
          )}
        </div>
      </div>

      {outstanding.length > 0 ? (
        <Callout tone="attention" title={`${outstanding.length} document(s) still needed from you`}>
          Verification cannot proceed until these are provided. Nothing is checked, and nothing is charged to you — responding
          to a verification request is a free member capability.
        </Callout>
      ) : (
        <Callout tone="verified" title="Nothing is outstanding from you">
          You have provided everything this policy asks of you. The requesting organization reviews the evidence and records
          its own decision.
        </Callout>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card padded={false}>
            <div className="border-b border-slate-200 px-4 py-3">
              <SectionHeading
                title="Documents requested"
                description="Each document is classified by the policy that asked for it, not by where it is displayed."
              />
              {documents.length > 0 && (
                <div className="mt-2">
                  <ProgressBar value={percent(provided, documents.length)} tone={outstanding.length ? 'attention' : 'verified'} />
                </div>
              )}
            </div>
            {documents.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">This policy does not require any documents from you.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="bid-table">
                  <thead>
                    <tr>
                      <th>Document</th>
                      <th>Requirement</th>
                      <th>Visibility</th>
                      <th>Status</th>
                      <th className="text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {documents.map((document) => (
                      <tr key={document.id}>
                        <td>
                          <div className="font-medium text-navy-900">{document.label}</div>
                          {document.fileName && (
                            <div className="text-2xs text-slate-500">
                              {document.fileName} · {Math.round((document.sizeBytes ?? 0) / 1024)} KB · provided{' '}
                              {formatDate(document.providedAt)}
                            </div>
                          )}
                          {document.status === 'REJECTED' && document.reviewNote && (
                            <div className="mt-0.5 text-2xs text-red-700">Returned: {document.reviewNote}</div>
                          )}
                        </td>
                        <td>
                          <Badge tone={document.required ? 'info' : 'pending'}>
                            {document.required ? 'Required' : 'Optional'}
                          </Badge>
                        </td>
                        <td className="text-2xs text-slate-500">{humanize(document.visibility)}</td>
                        <td>
                          <Badge
                            tone={
                              document.status === 'ACCEPTED'
                                ? 'verified'
                                : document.status === 'PROVIDED'
                                  ? 'info'
                                  : document.status === 'REJECTED'
                                    ? 'exception'
                                    : 'pending'
                            }
                          >
                            {humanize(document.status)}
                          </Badge>
                        </td>
                        <td className="text-right">
                          {(document.status === 'REQUESTED' || document.status === 'REJECTED') && (
                            <Button
                              size="sm"
                              icon={<FileUp className="h-3.5 w-3.5" />}
                              onClick={() => {
                                setUploadFor(document);
                                setFileName(`${document.code.toLowerCase()}.pdf`);
                                setNote('');
                              }}
                            >
                              Provide
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>

          <Card padded={false}>
            <div className="border-b border-slate-200 px-4 py-3">
              <SectionHeading
                title="What will be checked"
                description="The full plan, including the source each check runs against. No surprises after the fact."
              />
            </div>
            <div className="overflow-x-auto">
              <table className="bid-table">
                <thead>
                  <tr>
                    <th>Check</th>
                    <th>Category</th>
                    <th>Source</th>
                    <th>Requirement</th>
                    <th className="text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {platform.verifications.checks(request.id).map((check) => {
                    const definition = getCheckDefinition(check.checkCode);
                    return (
                      <tr key={check.id}>
                        <td className="font-medium text-navy-900">{definition?.label ?? check.checkCode}</td>
                        <td className="text-xs">{humanize(check.category)}</td>
                        <td className="text-xs text-slate-600">{definition?.sourceLabel}</td>
                        <td>
                          {check.blocking ? (
                            <Badge tone="exception">Blocking</Badge>
                          ) : check.required ? (
                            <Badge tone="info">Required</Badge>
                          ) : (
                            <Badge tone="pending">Optional</Badge>
                          )}
                        </td>
                        <td className="text-right">
                          <Badge
                            tone={
                              check.status === 'PASSED'
                                ? 'verified'
                                : check.status === 'FAILED'
                                  ? 'exception'
                                  : check.status === 'ATTENTION'
                                    ? 'attention'
                                    : 'pending'
                            }
                          >
                            {humanize(check.status)}
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <SectionHeading title="The request" />
            <DataList
              items={[
                { label: 'Requested by', value: requester?.displayName ?? '—' },
                { label: 'Their BID ID', value: <span className="font-mono text-xs">{requester?.bidId}</span> },
                { label: 'Relationship', value: humanize(request.relationshipType) },
                { label: 'Policy', value: `${policy?.name} v${request.policyVersion}` },
                { label: 'Checks', value: plan.checks.length },
                { label: 'Requested', value: formatDateTime(request.createdAt) },
                { label: 'Their SLA', value: formatDate(request.slaDueAt) },
                { label: 'Outcome', value: assessment ? `${humanize(assessment.band)}` : 'Pending' },
              ]}
            />
          </Card>

          {consent && (
            <Card>
              <SectionHeading title="Consent" description="Yours to give — and to revoke." />
              <DataList
                items={[
                  { label: 'Status', value: <Badge tone={consent.status === 'GRANTED' ? 'verified' : 'attention'}>{humanize(consent.status)}</Badge> },
                  { label: 'Purpose', value: <span className="text-xs">{consent.purpose}</span> },
                  { label: 'Scope', value: <span className="text-xs">{consent.scope.join(', ') || '—'}</span> },
                  { label: 'Expires', value: formatDate(consent.expiresAt) },
                ]}
              />
              <div className="mt-2 flex gap-2">
                {consent.status !== 'GRANTED' && (
                  <Button
                    size="sm"
                    variant="primary"
                    onClick={() => {
                      run((p) => p.verifications.grantConsent(consent.id));
                      setToast('Consent recorded with its purpose, scope and expiry.');
                    }}
                  >
                    Grant consent
                  </Button>
                )}
                {consent.status === 'GRANTED' && (
                  <Button
                    size="sm"
                    onClick={() => {
                      run((p) => p.verifications.revokeConsent(consent.id));
                      setToast('Consent revoked. Future processing under this scope stops.');
                    }}
                  >
                    Revoke consent
                  </Button>
                )}
              </div>
            </Card>
          )}

          <Card>
            <SectionHeading title="What they will and will not see" />
            <ul className="mt-2 space-y-2 text-xs text-slate-700">
              <li className="flex gap-2">
                <AttributionChip attribution="PROVIDER_VERIFIED" />
                <span>The outcome of the checks their policy asked for, with the source and date.</span>
              </li>
              <li className="flex gap-2">
                <AttributionChip attribution="COMPANY_PROVIDED" />
                <span>The documents listed above, at the classification the policy set.</span>
              </li>
              <li className="mt-1 border-t border-slate-100 pt-2 text-slate-600">
                They do <span className="font-semibold">not</span> see your other relationships, other verifications, your
                counterparties, or anything outside this policy.
              </li>
            </ul>
          </Card>
        </div>
      </div>

      <Modal
        open={Boolean(uploadFor)}
        onClose={() => setUploadFor(null)}
        title={`Provide "${uploadFor?.label ?? ''}"`}
        description="Demo behaviour: file metadata is recorded and hashed. Production stores the object behind a signed URL."
        footer={
          <>
            <Button onClick={() => setUploadFor(null)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!fileName.trim()}
              onClick={() => {
                if (!uploadFor) return;
                run((p) =>
                  p.verifications.provideDocument({
                    documentId: uploadFor.id,
                    fileName: fileName.trim(),
                    sizeBytes: 220_000,
                    note: note || undefined,
                    providedByOrganizationId: organization.id,
                  }),
                );
                setToast(`"${uploadFor.label}" provided. The requester has been notified.`);
                setUploadFor(null);
              }}
            >
              Provide document
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="File name" required>
            <TextInput value={fileName} onChange={(event) => setFileName(event.target.value)} />
          </Field>
          <Field label="Note to the requester">
            <TextInput value={note} onChange={(event) => setNote(event.target.value)} placeholder="Optional context" />
          </Field>
          {uploadFor && (
            <Callout tone="neutral" title={`Classification: ${humanize(uploadFor.visibility)}`}>
              This is the visibility the requesting organization's policy assigned to the document. It governs who can see it,
              including inside their own workspace.
            </Callout>
          )}
        </div>
      </Modal>
    </div>
  );
}
