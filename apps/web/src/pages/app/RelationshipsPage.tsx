import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Plus } from 'lucide-react';
import type { Relationship } from '@bid/core';
import { usePlatform } from '../../platform/PlatformProvider';
import { Badge, Button, Callout, Card, DataList, Drawer, EmptyState, SectionHeading, Select } from '../../components/ui';
import { OrgAvatar, VerificationStatusBadge } from '../../components/domain';
import { formatDate, humanize } from '../../lib/format';

export function RelationshipsPage() {
  const { platform, workspace, organization, execute } = usePlatform();
  const [selected, setSelected] = useState<Relationship | null>(null);
  const [filter, setFilter] = useState('ALL');

  const relationships = workspace ? platform.relationships.listForWorkspace(workspace.id) : [];
  const inbound = platform.relationships.listInbound(organization.id);
  const filtered = relationships.filter((relationship) => filter === 'ALL' || relationship.type === filter);

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Relationships"
        description="A relationship is a first-class object: source, target, type, policy, verification status, monitoring and permissions."
        actions={
          <Link to="/app/verifications/new">
            <Button variant="primary" icon={<Plus className="h-4 w-4" />}>
              Add counterparty
            </Button>
          </Link>
        }
      />

      <Card padded={false}>
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 p-3">
          <p className="text-xs text-slate-500">
            {relationships.length} outbound relationship(s) owned by this workspace
          </p>
          <div className="w-52">
            <Select value={filter} onChange={(event) => setFilter(event.target.value)}>
              <option value="ALL">All types</option>
              {[...new Set(relationships.map((r) => r.type))].map((type) => (
                <option key={type} value={type}>
                  {humanize(type)}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState title="No relationships yet" description="Invite a counterparty to create your first relationship." />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="bid-table">
              <thead>
                <tr>
                  <th>Counterparty</th>
                  <th>Type</th>
                  <th>Lifecycle</th>
                  <th>Verification</th>
                  <th>Risk</th>
                  <th>Monitoring</th>
                  <th className="text-right">Since</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((relationship) => {
                  const target = relationship.targetOrganizationId
                    ? platform.organizations.get(relationship.targetOrganizationId)
                    : undefined;
                  const person = relationship.targetPersonId ? platform.store.persons.get(relationship.targetPersonId) : undefined;
                  return (
                    <tr key={relationship.id} className="cursor-pointer" onClick={() => setSelected(relationship)}>
                      <td>
                        <div className="flex items-center gap-2">
                          <OrgAvatar
                            name={target?.displayName ?? person?.fullName ?? '—'}
                            color={target?.logoColor ?? '#475569'}
                            text={target?.logoText}
                            size="sm"
                          />
                          <div>
                            <div className="font-medium text-navy-900">{target?.displayName ?? person?.fullName}</div>
                            <div className="font-mono text-2xs text-slate-400">{target?.bidId ?? person?.bidId}</div>
                          </div>
                        </div>
                      </td>
                      <td className="text-xs">{humanize(relationship.type)}</td>
                      <td>
                        <Badge tone={relationship.lifecycle === 'ACTIVE' || relationship.lifecycle === 'MONITORED' ? 'verified' : 'pending'}>
                          {humanize(relationship.lifecycle)}
                        </Badge>
                      </td>
                      <td>
                        <VerificationStatusBadge status={relationship.verificationStatus} />
                      </td>
                      <td className="text-xs">{humanize(relationship.riskLevel)}</td>
                      <td>
                        {relationship.monitoringEnabled ? (
                          <Badge tone="brand" dot>
                            On
                          </Badge>
                        ) : (
                          <Badge tone="pending">Off</Badge>
                        )}
                      </td>
                      <td className="text-right text-xs text-slate-500">{formatDate(relationship.startDate)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {inbound.length > 0 && (
        <Card>
          <SectionHeading
            title="Inbound relationships"
            description="Relationships where another organization has recorded your organization as its counterparty. These records live in that organization's workspace, not yours."
          />
          <div className="mt-3 space-y-2">
            {inbound.map((relationship) => {
              const source = platform.organizations.get(relationship.sourceOrganizationId);
              return (
                <div key={relationship.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-slate-200 p-3">
                  <div className="flex items-center gap-2">
                    <OrgAvatar name={source?.displayName ?? ''} color={source?.logoColor} text={source?.logoText} size="sm" />
                    <div>
                      <p className="text-sm font-medium text-navy-900">{source?.displayName}</p>
                      <p className="text-2xs text-slate-500">
                        records you as its {humanize(relationship.type).toLowerCase()}
                      </p>
                    </div>
                  </div>
                  <VerificationStatusBadge status={relationship.verificationStatus} />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      <Drawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Relationship"
        subtitle={selected?.bidId}
        footer={
          selected && (
            <div className="flex flex-wrap gap-2">
              {selected.latestVerificationId && (
                <Link to={`/app/verifications/${selected.latestVerificationId}`}>
                  <Button size="sm">Open verification</Button>
                </Link>
              )}
              {!selected.monitoringEnabled && selected.targetOrganizationId && (
                <Button
                  size="sm"
                  variant="primary"
                  icon={<Activity className="h-3.5 w-3.5" />}
                  onClick={() => {
                    const target = platform.organizations.get(selected.targetOrganizationId!);
                    if (!target || !workspace) return;
                    void execute((c) =>
                      c.enableMonitoringForRelationship({ subjectBidId: target.bidId, relationshipId: selected.id }),
                    );
                    setSelected(null);
                  }}
                >
                  Enable monitoring
                </Button>
              )}
              {selected.lifecycle === 'ACTIVE' && (
                <Button
                  size="sm"
                  onClick={() => {
                    void execute((c) =>
                      c.transitionRelationship(selected.id, 'SUSPENDED', 'suspended from relationship drawer'),
                    );
                    setSelected(null);
                  }}
                >
                  Suspend
                </Button>
              )}
            </div>
          )
        }
      >
        {selected && <RelationshipDetail relationship={selected} />}
      </Drawer>
    </div>
  );
}

function RelationshipDetail({ relationship }: { relationship: Relationship }) {
  const { platform } = usePlatform();
  const target = relationship.targetOrganizationId ? platform.organizations.get(relationship.targetOrganizationId) : undefined;
  const person = relationship.targetPersonId ? platform.store.persons.get(relationship.targetPersonId) : undefined;
  const policy = relationship.policyId ? platform.policies.get(relationship.policyId) : undefined;
  const verification = relationship.latestVerificationId
    ? platform.verifications.get(relationship.latestVerificationId)
    : undefined;
  const assessment = verification ? platform.verifications.assessment(verification.id) : undefined;

  return (
    <div className="space-y-4">
      <DataList
        items={[
          { label: 'Relationship ID', value: <span className="font-mono text-xs">{relationship.bidId}</span> },
          { label: 'Counterparty', value: target?.displayName ?? person?.fullName ?? '—' },
          { label: 'Counterparty BID ID', value: target?.bidId ?? person?.bidId ?? '—' },
          { label: 'Type', value: humanize(relationship.type) },
          { label: 'Lifecycle', value: humanize(relationship.lifecycle) },
          { label: 'Risk level', value: humanize(relationship.riskLevel) },
          { label: 'Criticality', value: humanize(relationship.criticality ?? 'ROUTINE') },
          { label: 'Policy', value: policy?.name ?? '—' },
          { label: 'Verification', value: humanize(relationship.verificationStatus) },
          { label: 'Assessment', value: assessment ? `${assessment.score}/100 · ${humanize(assessment.band)}` : '—' },
          { label: 'Monitoring', value: relationship.monitoringEnabled ? 'Enabled' : 'Not enabled' },
          { label: 'Contract reference', value: relationship.contractReference ?? '—' },
          { label: 'Start date', value: formatDate(relationship.startDate) },
        ]}
      />
      <Callout tone="neutral" title="Tenant boundary">
        This relationship record belongs to your workspace. The counterparty sees that a verification was requested — it does
        not see your other relationships, policies or assessments.
      </Callout>
    </div>
  );
}
