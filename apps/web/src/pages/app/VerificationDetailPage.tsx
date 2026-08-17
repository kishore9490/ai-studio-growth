import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, PlayCircle, RefreshCw, ShieldAlert, XCircle } from 'lucide-react';
import type { VerificationCheck } from '@bid/core';
import { usePlatform } from '../../platform/PlatformProvider';
import {
  Badge,
  Button,
  Callout,
  Card,
  DataList,
  Drawer,
  Modal,
  SectionHeading,
  Stepper,
  TabPanel,
  Tabs,
  TextInput,
  Timeline,
  Toast,
} from '../../components/ui';
import { AssessmentPanel, ChecksTable, EvidenceTable, VerificationStatusBadge } from '../../components/domain';
import { formatDateTime, formatInr, humanize, relativeTime, verificationTone } from '../../lib/format';

const LIFECYCLE_STEPS = [
  { id: 'REQUESTED', label: 'Requested' },
  { id: 'INVITED', label: 'Invited' },
  { id: 'ACCEPTED', label: 'Accepted' },
  { id: 'CONSENT_PENDING', label: 'Consent' },
  { id: 'CHECKS_RUNNING', label: 'Checks' },
  { id: 'EVIDENCE_COLLECTED', label: 'Evidence' },
  { id: 'ASSESSMENT', label: 'Assessment' },
  { id: 'REVIEW', label: 'Review' },
  { id: 'COMPLETED', label: 'Completed' },
  { id: 'CREDENTIAL_ISSUED', label: 'Credential' },
  { id: 'MONITORING', label: 'Monitoring' },
];

function stepIndexFor(status: string): number {
  const map: Record<string, number> = {
    REQUESTED: 0,
    INVITED: 1,
    ACCEPTED: 2,
    CONSENT_PENDING: 3,
    IN_PROGRESS: 4,
    CHECKS_RUNNING: 4,
    EVIDENCE_COLLECTED: 5,
    ASSESSMENT: 6,
    REVIEW: 7,
    REQUIRES_REVIEW: 7,
    PARTIAL: 7,
    COMPLETED: 8,
    CREDENTIAL_ISSUED: 9,
    MONITORING: 10,
    FAILED: 7,
    EXPIRED: 8,
    REVOKED: 8,
  };
  return map[status] ?? 0;
}

export function VerificationDetailPage() {
  const { id = '' } = useParams();
  const { platform, workspace, organization, runAsync, run } = usePlatform();
  const navigate = useNavigate();
  const [tab, setTab] = useState('checks');
  const [selectedCheck, setSelectedCheck] = useState<VerificationCheck | null>(null);
  const [decisionOpen, setDecisionOpen] = useState(false);
  const [decisionNote, setDecisionNote] = useState('');
  const [running, setRunning] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const detail = platform.verifications.detail(id);
  if (!detail) {
    return (
      <Callout tone="exception" title="Verification not found">
        It may belong to another workspace. <Link className="underline" to="/app/verifications">Back to verifications</Link>
      </Callout>
    );
  }

  const { request, checks, documents, results, evidence, assessment, credential, consent } = detail;
  const isOwner = request.workspaceId === workspace?.id;
  const isSubject = request.subjectOrganizationId === organization.id;
  const policy = platform.policies.get(request.policyId);
  const plan = platform.policies.plan(request.policyId, request.policyVersion);
  const pending = platform.verifications.pendingChecks(request.id);
  const auditEntries = platform.auditLog({ resourceId: request.id, limit: 50 });
  const transactions = platform.store.providerTransactions.find((t) => t.verificationRequestId === request.id);
  const requester = platform.organizations.get(request.requesterOrganizationId);

  const blockedOnConsent = checks.filter((c) => c.status === 'BLOCKED_ON_CONSENT');
  const blockedOnDocuments = checks.filter((c) => c.status === 'BLOCKED_ON_DOCUMENT');
  const outstandingDocuments = platform.verifications.outstandingDocuments(request.id);

  const runNext = async () => {
    setRunning(true);
    try {
      const next = await runAsync((p) => p.verifications.runNextCheck(request.id));
      if (!next) {
        run((p) => p.verifications.finalize(request.id));
        setToast('All checks executed — assessment produced.');
      } else {
        setToast(`Executed ${next.checkCode} → ${next.status}`);
      }
    } catch (error) {
      setToast(error instanceof Error ? error.message : String(error));
    } finally {
      setRunning(false);
    }
  };

  const runAll = async () => {
    setRunning(true);
    try {
      await runAsync((p) => p.runVerification(request.id));
      setToast('Verification run complete.');
    } catch (error) {
      // Blocked runs (missing documents, missing consent) surface verbatim
      // rather than silently producing a partial assessment.
      setToast(error instanceof Error ? error.message : String(error));
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-5">
      <Toast message={toast} onDismiss={() => setToast(null)} />

      <div>
        <Link to="/app/verifications" className="inline-flex items-center gap-1 text-xs text-slate-500 hover:text-slate-700">
          <ArrowLeft className="h-3 w-3" /> Verifications
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-navy-900">{request.subjectName}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-mono">{request.bidId}</span>
              <span>·</span>
              <VerificationStatusBadge status={request.status} />
              <span>·</span>
              <span>
                {policy?.name} <span className="text-slate-400">v{request.policyVersion}</span>
              </span>
              {detail.policyVersionSealed && <Badge tone="neutral">Policy version sealed</Badge>}
            </div>
          </div>

          {isOwner && (
            <div className="flex flex-wrap gap-2">
              {pending.length > 0 && (
                <>
                  <Button onClick={runNext} loading={running} icon={<PlayCircle className="h-4 w-4" />}>
                    Run next check ({pending.length} left)
                  </Button>
                  <Button variant="primary" onClick={runAll} loading={running} icon={<RefreshCw className="h-4 w-4" />}>
                    Run all remaining
                  </Button>
                </>
              )}
              {pending.length === 0 && !assessment && (
                <Button variant="primary" onClick={() => run((p) => p.verifications.finalize(request.id))}>
                  Produce assessment
                </Button>
              )}
              {assessment && request.decision === 'PENDING' && (
                <Button variant="primary" onClick={() => setDecisionOpen(true)} icon={<CheckCircle2 className="h-4 w-4" />}>
                  Record decision
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <Card>
        <Stepper steps={LIFECYCLE_STEPS} current={stepIndexFor(request.status)} />
      </Card>

      {blockedOnConsent.length > 0 && (
        <Callout tone="attention" title="Blocked: consent required before these checks can run">
          {blockedOnConsent.length} check(s) require a recorded consent from {request.subjectName}. Consent is the subject
          permitting processing; it is a different object from the authorization one organization grants another.
          {consent && consent.status !== 'GRANTED' && isOwner && (
            <div className="mt-2">
              <Button size="sm" onClick={() => run((p) => p.verifications.grantConsent(consent.id))}>
                Simulate subject granting consent
              </Button>
            </div>
          )}
        </Callout>
      )}

      {blockedOnDocuments.length > 0 && (
        <Callout tone="attention" title="Blocked: waiting on documents from the subject">
          {blockedOnDocuments.length} check(s) cannot run until {request.subjectName} provides{' '}
          {outstandingDocuments.map((document) => document.label).join(', ')}. The subject sees the same list in its own
          workspace, with the classification each document carries.
        </Callout>
      )}

      {request.status === 'REQUIRES_REVIEW' && (
        <Callout tone="exception" title="Requires human review" icon={<ShieldAlert className="h-4 w-4" />}>
          The evidence did not satisfy the policy thresholds. BID does not decide whether a counterparty is acceptable —
          the requesting organization does (Business Rule 14).
        </Callout>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card padded={false}>
            <div className="px-4 pt-3">
              <Tabs
                value={tab}
                onChange={setTab}
                tabs={[
                  { id: 'checks', label: `Checks (${checks.length})` },
                  { id: 'documents', label: `Documents (${documents.length})` },
                  { id: 'assessment', label: 'Assessment' },
                  { id: 'evidence', label: `Evidence (${evidence.length})` },
                  { id: 'providers', label: `Providers (${transactions.length})` },
                  { id: 'audit', label: 'Audit trail' },
                ]}
              />
            </div>
            <div className="px-4 pb-4">
              <TabPanel id="checks" current={tab}>
                <ChecksTable checks={checks} results={results} onSelect={setSelectedCheck} />
              </TabPanel>

              <TabPanel id="documents" current={tab}>
                {documents.length === 0 ? (
                  <Callout tone="pending" title="This policy requires no documents">
                    Everything it asks for is answered by a routed provider check.
                  </Callout>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="bid-table">
                      <thead>
                        <tr>
                          <th>Document</th>
                          <th>Requirement</th>
                          <th>Provided</th>
                          <th>Classification</th>
                          <th>Status</th>
                          <th className="text-right">Review</th>
                        </tr>
                      </thead>
                      <tbody>
                        {documents.map((document) => (
                          <tr key={document.id}>
                            <td>
                              <div className="font-medium text-navy-900">{document.label}</div>
                              {document.fileName && (
                                <div className="font-mono text-2xs text-slate-500">
                                  {document.fileName} · hash {document.contentHash}
                                </div>
                              )}
                            </td>
                            <td>
                              <Badge tone={document.required ? 'info' : 'pending'}>
                                {document.required ? 'Required' : 'Optional'}
                              </Badge>
                            </td>
                            <td className="text-xs">{document.providedAt ? formatDateTime(document.providedAt) : '—'}</td>
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
                              {document.status === 'PROVIDED' && isOwner && (
                                <div className="flex justify-end gap-1.5">
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      run((p) => p.verifications.reviewDocument(document.id, true, 'Accepted on review.'));
                                      setToast(`"${document.label}" accepted.`);
                                    }}
                                  >
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => {
                                      run((p) =>
                                        p.verifications.reviewDocument(
                                          document.id,
                                          false,
                                          'Document is not legible or has expired — please resend.',
                                        ),
                                      );
                                      setToast(`"${document.label}" returned to the subject.`);
                                    }}
                                  >
                                    Return
                                  </Button>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </TabPanel>

              <TabPanel id="assessment" current={tab}>
                {assessment ? (
                  <AssessmentPanel assessment={assessment} policyName={policy?.name ?? 'Policy'} />
                ) : (
                  <Callout tone="pending" title="No assessment yet">
                    An assessment is produced once the planned checks have been executed. It is never the only output —
                    evidence and per-category verdicts sit alongside it.
                  </Callout>
                )}
              </TabPanel>

              <TabPanel id="evidence" current={tab}>
                <EvidenceTable evidence={evidence} />
              </TabPanel>

              <TabPanel id="providers" current={tab}>
                <div className="overflow-x-auto">
                  <table className="bid-table">
                    <thead>
                      <tr>
                        <th>Check</th>
                        <th>Provider</th>
                        <th>Outcome</th>
                        <th>Latency</th>
                        <th>Cost</th>
                        <th>Reference</th>
                        <th>Fallback</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((transaction) => (
                        <tr key={transaction.id}>
                          <td className="text-xs">{transaction.checkCode}</td>
                          <td className="text-xs font-medium text-navy-900">
                            {platform.store.providers.get(transaction.providerId)?.name ?? transaction.providerId}
                          </td>
                          <td>
                            <Badge tone={transaction.outcome === 'PASS' ? 'verified' : transaction.outcome === 'ATTENTION' ? 'attention' : 'exception'}>
                              {transaction.outcome}
                            </Badge>
                          </td>
                          <td className="text-xs">{transaction.latencyMs} ms</td>
                          <td className="text-xs">{formatInr(transaction.costPaise)}</td>
                          <td className="font-mono text-2xs text-slate-500">{transaction.reference}</td>
                          <td className="text-2xs text-slate-500">{transaction.fallbackFrom ?? '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <Callout tone="neutral" title="Provider-neutral by design">
                  BID routes each check to a provider and normalizes the result. Existing verification providers remain the
                  execution layer; BID adds policy, evidence, assessment and monitoring around them.
                </Callout>
              </TabPanel>

              <TabPanel id="audit" current={tab}>
                <Timeline
                  items={auditEntries.map((entry) => ({
                    title: entry.summary,
                    time: formatDateTime(entry.at),
                    tone: 'info',
                    description: (
                      <span className="font-mono text-2xs text-slate-400">
                        {entry.actorName} · {entry.action} · hash {entry.hash}
                      </span>
                    ),
                  }))}
                />
              </TabPanel>
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <SectionHeading title="Request" />
            <DataList
              items={[
                { label: 'Requested by', value: requester?.displayName ?? '—' },
                { label: 'Subject', value: request.subjectName },
                { label: 'Subject type', value: humanize(request.subjectType) },
                { label: 'Relationship', value: humanize(request.relationshipType) },
                { label: 'Created', value: formatDateTime(request.createdAt) },
                { label: 'SLA due', value: formatDateTime(request.slaDueAt) },
                { label: 'Completed', value: request.completedAt ? formatDateTime(request.completedAt) : '—' },
                { label: 'Expires', value: request.expiresAt ? formatDateTime(request.expiresAt) : '—' },
                { label: 'Provider cost', value: formatInr(request.costPaise) },
              ]}
            />
          </Card>

          <Card>
            <SectionHeading title="Applied policy" description={`${plan.checks.length} checks compiled at request time.`} />
            <DataList
              items={[
                { label: 'Policy', value: policy?.name ?? '—' },
                { label: 'Version', value: `v${request.policyVersion}` },
                { label: 'Requires consent', value: plan.requiresConsent ? 'Yes' : 'No' },
                { label: 'Estimated cost', value: formatInr(plan.estimatedCostPaise) },
                { label: 'Longest SLA', value: `${plan.estimatedSlaHours}h` },
              ]}
            />
            {policy && (
              <Link to={`/app/policies/${policy.id}`} className="mt-2 inline-block text-xs font-medium text-brand-700 hover:underline">
                Inspect policy →
              </Link>
            )}
          </Card>

          {consent && (
            <Card>
              <SectionHeading title="Consent" description="Subject permission — separate from organization authorization." />
              <DataList
                items={[
                  { label: 'Status', value: <Badge tone={consent.status === 'GRANTED' ? 'verified' : 'attention'}>{humanize(consent.status)}</Badge> },
                  { label: 'Purpose', value: <span className="text-xs">{consent.purpose}</span> },
                  { label: 'Scope', value: <span className="text-xs">{consent.scope.join(', ') || '—'}</span> },
                  { label: 'Version', value: consent.version },
                  { label: 'Granted', value: consent.grantedAt ? formatDateTime(consent.grantedAt) : '—' },
                  { label: 'Expires', value: formatDateTime(consent.expiresAt) },
                ]}
              />
            </Card>
          )}

          {credential && (
            <Card>
              <SectionHeading title="Credential issued" />
              <DataList
                items={[
                  { label: 'Credential', value: credential.bidId },
                  { label: 'Status', value: <Badge tone="verified">{humanize(credential.status)}</Badge> },
                  { label: 'Issued', value: formatDateTime(credential.issuedAt) },
                  { label: 'Valid to', value: formatDateTime(credential.expiresAt) },
                ]}
              />
            </Card>
          )}

          {isSubject && !isOwner && (
            <Callout tone="info" title="You are the subject of this verification">
              You can see what was checked and the outcome. Raw evidence classified as sensitive or restricted stays with the
              requesting workspace.
            </Callout>
          )}
        </div>
      </div>

      <Drawer
        open={Boolean(selectedCheck)}
        onClose={() => setSelectedCheck(null)}
        title={selectedCheck ? humanize(selectedCheck.checkCode) : ''}
        subtitle="What was checked, by whom, from which source, and when."
      >
        {selectedCheck && <CheckDetail check={selectedCheck} />}
      </Drawer>

      <Modal
        open={decisionOpen}
        onClose={() => setDecisionOpen(false)}
        title="Record a decision"
        description="The requesting organization decides whether the assessment is acceptable — BID does not."
        footer={
          <>
            <Button
              variant="danger"
              icon={<XCircle className="h-4 w-4" />}
              onClick={() => {
                run((p) => p.verifications.decide(request.id, 'REJECTED', decisionNote || 'Rejected by reviewer.'));
                setDecisionOpen(false);
                setToast('Decision recorded: rejected.');
              }}
            >
              Reject
            </Button>
            <Button
              onClick={() => {
                run((p) =>
                  p.verifications.decide(
                    request.id,
                    'APPROVED_WITH_CONDITIONS',
                    decisionNote || 'Approved with conditions pending remediation.',
                  ),
                );
                setDecisionOpen(false);
                setToast('Decision recorded: approved with conditions.');
              }}
            >
              Approve with conditions
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                run((p) => p.verifications.decide(request.id, 'APPROVED', decisionNote || 'Evidence accepted.'));
                setDecisionOpen(false);
                setToast('Decision recorded: approved. Credential issued.');
                navigate(`/app/verifications/${request.id}`);
              }}
            >
              Approve
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {assessment && (
            <Callout tone={assessment.band === 'LOW_RISK' ? 'verified' : 'attention'} title={`Assessment: ${humanize(assessment.band)} (${assessment.score}/100)`}>
              {assessment.explanation}
            </Callout>
          )}
          <TextInput
            placeholder="Decision note (recorded in the audit trail)"
            value={decisionNote}
            onChange={(event) => setDecisionNote(event.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}

function CheckDetail({ check }: { check: VerificationCheck }) {
  const { platform } = usePlatform();
  const result = platform.store.verificationResults.first((r) => r.checkId === check.id);
  const evidence = platform.store.evidence.first((e) => e.checkId === check.id);
  const transaction = check.providerTransactionId ? platform.store.providerTransactions.get(check.providerTransactionId) : undefined;
  const definition = platform.store.providers.get(check.providerId ?? '');

  return (
    <div className="space-y-4">
      <DataList
        items={[
          { label: 'Status', value: <Badge tone={verificationTone('COMPLETED')}>{humanize(check.status)}</Badge> },
          { label: 'Category', value: humanize(check.category) },
          { label: 'Requirement', value: check.blocking ? 'Blocking' : check.required ? 'Required' : 'Optional' },
          { label: 'Attempts', value: check.attempts },
          { label: 'Provider', value: definition?.name ?? check.providerId ?? '—' },
          { label: 'Started', value: check.startedAt ? formatDateTime(check.startedAt) : '—' },
          { label: 'Completed', value: check.completedAt ? relativeTime(check.completedAt) : '—' },
          { label: 'Cost', value: formatInr(check.costPaise) },
        ]}
      />

      {result && (
        <div>
          <p className="bid-label">Normalized result</p>
          <p className="mt-1 text-sm text-slate-700">{result.summary}</p>
          <pre className="bid-scroll mt-2 overflow-x-auto rounded border border-slate-200 bg-slate-50 p-3 text-2xs text-slate-700">
            {JSON.stringify(result.normalized, null, 2)}
          </pre>
        </div>
      )}

      {evidence && (
        <div>
          <p className="bid-label">Evidence record</p>
          <DataList
            items={[
              { label: 'What', value: evidence.what },
              { label: 'Source', value: evidence.source },
              { label: 'Method', value: humanize(evidence.method) },
              { label: 'Checked at', value: formatDateTime(evidence.checkedAt) },
              { label: 'Result', value: evidence.result },
              { label: 'Confidence', value: `${Math.round(evidence.confidence * 100)}%` },
              { label: 'Scope', value: <span className="text-xs">{evidence.scope}</span> },
              { label: 'Reference', value: <span className="font-mono text-2xs">{evidence.reference}</span> },
              { label: 'Payload hash', value: <span className="font-mono text-2xs">{evidence.payloadHash}</span> },
              { label: 'Visibility', value: humanize(evidence.visibility) },
              { label: 'Expires', value: formatDateTime(evidence.expiresAt) },
            ]}
          />
        </div>
      )}

      {transaction && (
        <div>
          <p className="bid-label">Provider transaction</p>
          <DataList
            items={[
              { label: 'Reference', value: <span className="font-mono text-2xs">{transaction.reference}</span> },
              { label: 'Latency', value: `${transaction.latencyMs} ms` },
              { label: 'Routed from fallback', value: transaction.fallbackFrom ?? 'No fallback needed' },
            ]}
          />
        </div>
      )}
    </div>
  );
}
