import { Link } from 'react-router-dom';
import { Check, Send } from 'lucide-react';
import { usePlatform } from '../../platform/PlatformProvider';
import { Badge, Button, Callout, Card, EmptyState, SectionHeading } from '../../components/ui';
import { OrgAvatar, VerificationStatusBadge } from '../../components/domain';
import { formatDate, humanize, relativeTime } from '../../lib/format';

/** Verification requests where THIS organization is the subject. */
export function RequestsReceivedPage() {
  const { platform, organization, run } = usePlatform();
  const requests = platform.verifications.listForSubject(organization.id);
  const invitations = platform.relationships.invitationsForOrganization(organization.id);
  const pendingInvitations = invitations.filter((invitation) => ['SENT', 'OPENED', 'CREATED'].includes(invitation.status));

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Requests received"
        description="Organizations that have asked your organization to verify. Responding is free — membership is not a paid capability."
      />

      {pendingInvitations.length > 0 && (
        <Card>
          <SectionHeading title="Pending invitations" />
          <div className="mt-3 space-y-2">
            {pendingInvitations.map((invitation) => {
              const from = platform.organizations.get(invitation.fromOrganizationId);
              const policy = platform.policies.get(invitation.policyId);
              return (
                <div key={invitation.id} className="flex flex-wrap items-center justify-between gap-3 rounded border border-brand-200 bg-brand-50/50 p-3">
                  <div className="flex items-center gap-2.5">
                    <OrgAvatar name={from?.displayName ?? ''} color={from?.logoColor} text={from?.logoText} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-navy-900">
                        {from?.displayName} invited your organization to complete BID verification
                      </p>
                      <p className="text-2xs text-slate-600">
                        Relationship: {humanize(invitation.relationshipType)} · Policy: {policy?.name} · expires{' '}
                        {formatDate(invitation.expiresAt)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => run((p) => p.relationships.declineInvitation(invitation.id))}>
                      Decline
                    </Button>
                    <Button
                      size="sm"
                      variant="primary"
                      icon={<Check className="h-3.5 w-3.5" />}
                      onClick={() => run((p) => p.acceptInvitation(invitation.id))}
                    >
                      Accept & claim BID identity
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Card padded={false}>
        {requests.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No verification requests yet"
              description="When a counterparty asks you to verify, the request and its policy appear here."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="bid-table">
              <thead>
                <tr>
                  <th>Requested by</th>
                  <th>Relationship</th>
                  <th>Policy</th>
                  <th>Status</th>
                  <th>Needs from you</th>
                  <th>Outcome</th>
                  <th className="text-right">Requested</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((request) => {
                  const requester = platform.organizations.get(request.requesterOrganizationId);
                  const assessment = platform.verifications.assessment(request.id);
                  const outstanding = platform.verifications.outstandingDocuments(request.id).length;
                  const consent = request.consentId ? platform.store.consents.get(request.consentId) : undefined;
                  const needsConsent = consent ? consent.status !== 'GRANTED' : false;
                  return (
                    <tr key={request.id}>
                      <td>
                        <Link to={`/app/requests-received/${request.id}`} className="font-medium text-navy-900 hover:underline">
                          {requester?.displayName}
                        </Link>
                        <div className="font-mono text-2xs text-slate-400">{request.bidId}</div>
                      </td>
                      <td className="text-xs">{humanize(request.relationshipType)}</td>
                      <td className="text-xs">{platform.policies.get(request.policyId)?.name}</td>
                      <td>
                        <VerificationStatusBadge status={request.status} />
                      </td>
                      <td>
                        {outstanding > 0 || needsConsent ? (
                          <div className="flex flex-wrap gap-1">
                            {outstanding > 0 && <Badge tone="attention">{outstanding} document(s)</Badge>}
                            {needsConsent && <Badge tone="attention">Consent</Badge>}
                          </div>
                        ) : (
                          <Badge tone="verified">Nothing</Badge>
                        )}
                      </td>
                      <td className="text-xs">{assessment ? `${humanize(assessment.band)}` : '—'}</td>
                      <td className="text-right text-xs text-slate-500">{relativeTime(request.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Callout tone="neutral" title="What the requester can and cannot see">
        The requesting organization sees the checks its policy asked for and the resulting evidence. It does not gain access
        to your other relationships, your documents outside this policy, or verifications run by anyone else.
      </Callout>
    </div>
  );
}

/** Invitations and verification requests THIS workspace has sent. */
export function RequestsSentPage() {
  const { platform, workspace } = usePlatform();
  const invitations = workspace ? platform.relationships.invitationsForWorkspace(workspace.id) : [];

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Requests sent"
        description="Invitations issued by this workspace and where each counterparty has reached in the member lifecycle."
        actions={
          <Link to="/app/verifications/new">
            <Button variant="primary" icon={<Send className="h-4 w-4" />}>
              New invitation
            </Button>
          </Link>
        }
      />

      <Card padded={false}>
        {invitations.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No invitations sent" description="Invite a counterparty to start the flywheel." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="bid-table">
              <thead>
                <tr>
                  <th>Counterparty</th>
                  <th>Relationship</th>
                  <th>Policy</th>
                  <th>Invitation</th>
                  <th>Member state</th>
                  <th>Verification</th>
                  <th className="text-right">Sent</th>
                </tr>
              </thead>
              <tbody>
                {invitations.map((invitation) => {
                  const target = invitation.toOrganizationId ? platform.organizations.get(invitation.toOrganizationId) : undefined;
                  const verification = target
                    ? platform.store.verificationRequests.first(
                        (request) => request.subjectOrganizationId === target.id && request.workspaceId === workspace?.id,
                      )
                    : undefined;
                  return (
                    <tr key={invitation.id}>
                      <td>
                        <div className="font-medium text-navy-900">{invitation.toOrganizationName}</div>
                        <div className="font-mono text-2xs text-slate-400">{target?.bidId ?? 'not yet claimed'}</div>
                      </td>
                      <td className="text-xs">{humanize(invitation.relationshipType)}</td>
                      <td className="text-xs">{platform.policies.get(invitation.policyId)?.name}</td>
                      <td>
                        <Badge
                          tone={
                            invitation.status === 'ACCEPTED'
                              ? 'verified'
                              : invitation.status === 'DECLINED'
                                ? 'exception'
                                : 'pending'
                          }
                        >
                          {humanize(invitation.status)}
                        </Badge>
                      </td>
                      <td className="text-xs">{target ? humanize(target.commercialState) : '—'}</td>
                      <td>
                        {verification ? (
                          <Link to={`/app/verifications/${verification.id}`}>
                            <VerificationStatusBadge status={verification.status} />
                          </Link>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="text-right text-xs text-slate-500">{relativeTime(invitation.sentAt ?? invitation.createdAt)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
