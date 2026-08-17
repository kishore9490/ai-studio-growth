import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Save } from 'lucide-react';
import { INDUSTRY, INDUSTRY_LABEL } from '@bid/core';
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
  TextInput,
  Timeline,
  Toast,
} from '../../components/ui';
import { AttributionChip, BidIdChip, OrgAvatar } from '../../components/domain';
import { formatDate, formatDateTime, humanize } from '../../lib/format';

export function OrganizationPage() {
  const { platform, organization, workspace, run } = usePlatform();
  const [form, setForm] = useState({
    displayName: organization.displayName,
    legalName: organization.legalName,
    website: organization.website ?? '',
    city: organization.city ?? '',
    description: organization.description ?? '',
    industry: organization.industry,
  });
  const [toast, setToast] = useState<string | null>(null);

  const identifiers = platform.organizations.identifiers(organization.id);
  const credentials = platform.verifications.credentialsForOrganization(organization.id);
  const auditEntries = platform.auditLog({ organizationId: organization.id, limit: 12 });
  const subscription = workspace ? platform.billing.subscriptionFor(workspace.id) : undefined;

  return (
    <div className="space-y-5">
      <Toast message={toast} onDismiss={() => setToast(null)} />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <OrgAvatar name={organization.displayName} color={organization.logoColor} text={organization.logoText} size="lg" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-navy-900">{organization.displayName}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <BidIdChip bidId={organization.bidId} />
              <Badge tone="neutral">{humanize(organization.lifecycle)}</Badge>
              <Badge tone="info">{humanize(organization.commercialState)}</Badge>
            </div>
          </div>
        </div>
        <Link to={`/profile/${organization.bidId}`}>
          <Button>View public profile</Button>
        </Link>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Card>
            <SectionHeading
              title="Company-provided information"
              description="Everything on this card is stated by your organization. It is labelled as company-provided until a check corroborates it."
            />
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <Field label="Display name">
                <TextInput value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
              </Field>
              <Field label="Legal name">
                <TextInput value={form.legalName} onChange={(e) => setForm({ ...form, legalName: e.target.value })} />
              </Field>
              <Field label="Industry">
                <Select value={form.industry} onChange={(e) => setForm({ ...form, industry: e.target.value as typeof form.industry })}>
                  {INDUSTRY.map((industry) => (
                    <option key={industry} value={industry}>
                      {INDUSTRY_LABEL[industry]}
                    </option>
                  ))}
                </Select>
              </Field>
              <Field label="City">
                <TextInput value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
              </Field>
              <Field label="Website">
                <TextInput value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
              </Field>
              <Field label="Public description" hint="Appears on your public BID profile.">
                <TextInput value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
              </Field>
            </div>
            <div className="mt-4 flex justify-end">
              <Button
                variant="primary"
                icon={<Save className="h-4 w-4" />}
                onClick={() => {
                  run((p) => p.organizations.update(organization.id, form));
                  setToast('Organization profile updated. The change is recorded in the audit trail.');
                }}
              >
                Save changes
              </Button>
            </div>
          </Card>

          <Card>
            <SectionHeading
              title="Registered identifiers"
              description="Stored masked in this build. Production encrypts them at rest and exposes them only to permitted viewers."
            />
            <div className="mt-3 overflow-x-auto">
              <table className="bid-table">
                <thead>
                  <tr>
                    <th>Type</th>
                    <th>Value</th>
                    <th>Provenance</th>
                    <th>Visibility</th>
                    <th className="text-right">Added</th>
                  </tr>
                </thead>
                <tbody>
                  {identifiers.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center text-xs text-slate-500">
                        No identifiers recorded.
                      </td>
                    </tr>
                  )}
                  {identifiers.map((identifier) => (
                    <tr key={identifier.id}>
                      <td className="font-medium text-navy-900">{identifier.kind}</td>
                      <td className="font-mono text-xs">{identifier.value}</td>
                      <td>
                        <AttributionChip attribution={identifier.attribution} />
                      </td>
                      <td className="text-xs">{humanize(identifier.visibility)}</td>
                      <td className="text-right text-xs text-slate-500">{formatDate(identifier.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card>
            <SectionHeading title="Recent activity on this organization" />
            <div className="mt-3">
              <Timeline
                items={auditEntries.map((entry) => ({
                  title: entry.summary,
                  time: formatDateTime(entry.at),
                  tone: 'info',
                  description: <span className="font-mono text-2xs text-slate-400">{entry.action}</span>,
                }))}
              />
            </div>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <SectionHeading title="Identity & tenancy" />
            <DataList
              items={[
                { label: 'BID organization ID', value: <span className="font-mono text-xs">{organization.bidId}</span> },
                { label: 'Organization lifecycle', value: humanize(organization.lifecycle) },
                { label: 'Commercial state', value: humanize(organization.commercialState) },
                { label: 'Workspace (tenant)', value: workspace?.name ?? 'Not claimed' },
                { label: 'Tenant ID', value: <span className="font-mono text-2xs">{workspace?.tenantId ?? '—'}</span> },
                { label: 'Requester enabled', value: workspace?.requesterEnabled ? 'Yes' : 'No' },
                { label: 'Plan', value: subscription ? platform.billing.plan(subscription.planId)?.name ?? '—' : 'BID Member (free)' },
                { label: 'Member since', value: formatDate(organization.claimedAt) },
                {
                  label: 'Introduced by',
                  value: organization.introducedByOrgId
                    ? platform.organizations.get(organization.introducedByOrgId)?.displayName ?? '—'
                    : 'Direct registration',
                },
              ]}
            />
          </Card>

          <Card>
            <SectionHeading title="Credentials held" />
            <div className="mt-2 space-y-2">
              {credentials.length === 0 && <p className="text-sm text-slate-500">No credentials issued yet.</p>}
              {credentials.map((credential) => (
                <div key={credential.id} className="rounded border border-slate-200 p-2.5">
                  <p className="text-xs font-medium text-navy-900">{credential.title}</p>
                  <p className="mt-0.5 text-2xs text-slate-500">
                    {credential.bidId} · valid to {formatDate(credential.expiresAt)}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Callout tone="neutral" title="Organization ≠ tenant">
            Your organization identity is global and stable across the network. Your workspace is a private tenant: the
            relationships, policies and evidence inside it are not visible to anyone else, including organizations that have
            verified you.
          </Callout>
        </div>
      </div>
    </div>
  );
}
