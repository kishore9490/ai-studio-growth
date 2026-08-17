import { Link } from 'react-router-dom';
import { ExternalLink } from 'lucide-react';
import { usePlatform } from '../../platform/PlatformProvider';
import { Badge, Button, Callout, Card, EmptyState, SectionHeading } from '../../components/ui';
import { BidDigitalCard, CredentialCard } from '../../components/domain';
import { formatDate, humanize } from '../../lib/format';

export function CredentialsPage() {
  const { platform, organization } = usePlatform();
  const card = platform.organizations.digitalCard(organization.bidId);
  const held = platform.verifications.credentialsForOrganization(organization.id);
  const issued = platform.verifications.credentialsIssuedBy(organization.id);

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Credentials & digital card"
        description="A credential is the portable outcome of a verification: what was verified, under which policy version, and until when."
        actions={
          <Link to={`/profile/${organization.bidId}`}>
            <Button icon={<ExternalLink className="h-4 w-4" />}>Public profile</Button>
          </Link>
        }
      />

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-3">
          {card && <BidDigitalCard card={card} />}
          <Callout tone="neutral" title="What the card deliberately omits">
            No identifiers, no documents, no evidence, no counterparty list. The card points to the profile; the profile
            points to the evidence summary; the evidence itself stays access-controlled.
          </Callout>
        </div>

        <div className="space-y-5 lg:col-span-2">
          <div>
            <SectionHeading title="Credentials held by this organization" />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {held.length === 0 && (
                <EmptyState
                  title="No credentials yet"
                  description="Complete a verification requested by a counterparty to receive your first credential."
                />
              )}
              {held.map((credential) => (
                <CredentialCard
                  key={credential.id}
                  credential={credential}
                  policyName={platform.policies.get(credential.policyId)?.name ?? 'Policy'}
                />
              ))}
            </div>
          </div>

          {issued.length > 0 && (
            <Card padded={false}>
              <div className="border-b border-slate-200 px-4 py-3">
                <SectionHeading
                  title="Credentials this organization issued"
                  description="Outcomes of verifications you requested. Each remains tied to the policy version that justified it."
                />
              </div>
              <div className="overflow-x-auto">
                <table className="bid-table">
                  <thead>
                    <tr>
                      <th>Subject</th>
                      <th>Credential</th>
                      <th>Policy</th>
                      <th>Status</th>
                      <th>Issued</th>
                      <th className="text-right">Valid to</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issued.map((credential) => {
                      const subject = credential.subjectOrganizationId
                        ? platform.organizations.get(credential.subjectOrganizationId)
                        : undefined;
                      const person = credential.subjectPersonId ? platform.store.persons.get(credential.subjectPersonId) : undefined;
                      return (
                        <tr key={credential.id}>
                          <td className="font-medium text-navy-900">{subject?.displayName ?? person?.fullName ?? '—'}</td>
                          <td className="font-mono text-2xs">{credential.bidId}</td>
                          <td className="text-xs">
                            {platform.policies.get(credential.policyId)?.name} v{credential.policyVersion}
                          </td>
                          <td>
                            <Badge tone={credential.status === 'ACTIVE' ? 'verified' : 'attention'}>
                              {humanize(credential.status)}
                            </Badge>
                          </td>
                          <td className="text-xs">{formatDate(credential.issuedAt)}</td>
                          <td className="text-right text-xs">{formatDate(credential.expiresAt)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
