import { Link, useParams } from 'react-router-dom';
import { Globe, MapPin, ShieldCheck } from 'lucide-react';
import { usePlatform } from '../../platform/PlatformProvider';
import { PublicLayout } from '../../components/PublicLayout';
import { Badge, Button, Callout, Card, SectionHeading } from '../../components/ui';
import { AttributionChip, BidDigitalCard, BidIdChip, FreshnessBadge, OrgAvatar, QrPlaceholder } from '../../components/domain';
import { formatDate, humanize } from '../../lib/format';

/**
 * Public BID profile: bidtrust.in/profile/BID-BUS-00231
 *
 * Served entirely from the `publicProfile` projection, which is derived from
 * credentials and public-safe check summaries. Raw evidence cannot reach it.
 */
export function PublicProfilePage() {
  const { bidId = '' } = useParams();
  const { platform } = usePlatform();

  const profile = platform.organizations.publicProfile(bidId);
  const card = platform.organizations.digitalCard(bidId);

  if (!profile || !card) {
    return (
      <PublicLayout>
        <div className="mx-auto max-w-3xl px-4 py-16">
          <Callout tone="exception" title="No BID profile found">
            No organization in this environment carries the identifier <span className="font-mono">{bidId}</span>. Try{' '}
            <Link className="underline" to="/profile/BID-BUS-00231">
              BID-BUS-00231
            </Link>
            .
          </Callout>
        </div>
      </PublicLayout>
    );
  }

  return (
    <PublicLayout>
      <div className="border-b border-slate-200 bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div className="flex items-start gap-4">
              <OrgAvatar name={profile.displayName} color={profile.logoColor} text={profile.logoText} size="lg" />
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-2xl font-semibold tracking-tight text-navy-900">{profile.displayName}</h1>
                  {profile.verificationSummary.verified && (
                    <Badge tone="verified" dot>
                      BID Verified
                    </Badge>
                  )}
                  <Badge tone="neutral">{humanize(profile.commercialState)}</Badge>
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-slate-600">
                  <BidIdChip bidId={profile.bidId} />
                  {profile.city && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3 w-3" /> {profile.city}, {profile.country}
                    </span>
                  )}
                  {profile.website && (
                    <a href={profile.website} className="inline-flex items-center gap-1 hover:underline" rel="noreferrer">
                      <Globe className="h-3 w-3" /> {profile.website.replace(/^https?:\/\//, '')}
                    </a>
                  )}
                  {profile.memberSince && <span>Member since {formatDate(profile.memberSince)}</span>}
                </div>
                <p className="mt-3 max-w-2xl text-sm text-slate-700">{profile.description}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-3">
              <QrPlaceholder payload={profile.profileUrl} size={84} />
              <Link to="/app/verifications/new">
                <Button variant="primary" icon={<ShieldCheck className="h-4 w-4" />}>
                  Request verification
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-3">
        <div className="min-w-0 space-y-6 lg:col-span-2">
          <Card>
            <SectionHeading
              title="BID-verified information"
              description="Derived from checks executed under a policy. Each line names its source and how fresh it is."
            />
            <div className="mt-3 overflow-x-auto">
              <table className="bid-table">
                <thead>
                  <tr>
                    <th>What was verified</th>
                    <th>Provenance</th>
                    <th>Source</th>
                    <th>Checked</th>
                    <th className="text-right">Freshness</th>
                  </tr>
                </thead>
                <tbody>
                  {profile.verifiedAttributes.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-6 text-center text-sm text-slate-500">
                        This organization has no completed verification yet.
                      </td>
                    </tr>
                  )}
                  {profile.verifiedAttributes.map((attribute) => (
                    <tr key={attribute.label}>
                      <td className="font-medium text-navy-900">
                        <span className="mr-2">{attribute.label}</span>
                        <Badge tone={attribute.state === 'VERIFIED' ? 'verified' : attribute.state === 'ATTENTION' ? 'attention' : 'pending'}>
                          {humanize(attribute.state)}
                        </Badge>
                      </td>
                      <td>
                        <AttributionChip attribution={attribute.attribution} />
                      </td>
                      <td className="text-xs text-slate-600">{attribute.source}</td>
                      <td className="text-xs">{formatDate(attribute.checkedAt)}</td>
                      <td className="text-right">
                        <FreshnessBadge freshness={attribute.freshness} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <SectionHeading
              title="Company-provided information"
              description="Stated by the organization itself. Not independently verified unless a check above covers it."
            />
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {profile.companyProvided.map((item) => (
                <div key={item.label} className="rounded border border-slate-200 p-3">
                  <p className="bid-label">{item.label}</p>
                  <p className="mt-0.5 text-sm text-navy-900">{item.value}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card>
            <SectionHeading title="Credentials" description="Portable outcomes of completed verifications." />
            <div className="mt-3 space-y-2">
              {profile.credentials.length === 0 && <p className="text-sm text-slate-500">No credentials issued.</p>}
              {profile.credentials.map((credential) => (
                <div key={credential.bidId} className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 p-3">
                  <div>
                    <p className="text-sm font-medium text-navy-900">{credential.title}</p>
                    <p className="text-2xs text-slate-500">
                      {credential.bidId} · policy {credential.policyName} · issued {formatDate(credential.issuedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone={credential.status === 'ACTIVE' ? 'verified' : 'attention'}>{humanize(credential.status)}</Badge>
                    <span className="text-2xs text-slate-500">valid to {formatDate(credential.expiresAt)}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Callout tone="neutral" title="What this profile does not show">
            Documents, identifiers, bank details, candidate data and raw evidence are never published here. Counterparties see
            evidence only inside the workspace that ran the verification, at the classification their relationship permits.
          </Callout>
        </div>

        <div className="min-w-0 space-y-5">
          <BidDigitalCard card={card} />

          <Card>
            <SectionHeading title="Verification summary" />
            <div className="mt-2 space-y-2 text-sm">
              <Row label="Status" value={profile.verificationSummary.verified ? 'Verified' : 'Not verified'} />
              <Row label="Last verified" value={formatDate(profile.verificationSummary.lastVerifiedAt)} />
              <Row label="Freshness" value={profile.verificationSummary.freshness ? humanize(profile.verificationSummary.freshness) : '—'} />
              <Row label="Policy applied" value={profile.verificationSummary.policyName ?? '—'} />
              <Row label="Requested by" value={profile.verificationSummary.verifiedByOrganization ?? '—'} />
            </div>
          </Card>

          <Card>
            <p className="text-xs leading-relaxed text-slate-600">{profile.disclaimer}</p>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 pb-1.5">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm text-navy-900">{value}</span>
    </div>
  );
}
