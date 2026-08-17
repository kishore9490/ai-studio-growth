import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import type { GraphEdge, GraphNode } from '@bid/core';
import { usePlatform } from '../../platform/PlatformProvider';
import { Badge, Button, Callout, Card, DataList, Drawer, SectionHeading, Toggle, cx } from '../../components/ui';
import { NetworkGraph } from '../../components/NetworkGraph';
import { formatDate, humanize } from '../../lib/format';

export function NetworkPage() {
  const { platform, workspace, organization } = usePlatform();
  const [scopeToWorkspace, setScopeToWorkspace] = useState(true);
  const [includePeople, setIncludePeople] = useState(true);
  const [includeCredentials, setIncludeCredentials] = useState(false);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [selectedEdge, setSelectedEdge] = useState<GraphEdge | null>(null);

  const graph = useMemo(
    () =>
      platform.graph({
        workspaceId: scopeToWorkspace ? workspace?.id : undefined,
        includePeople,
        includeCredentials,
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [platform, workspace?.id, scopeToWorkspace, includePeople, includeCredentials, platform.store.relationships.count()],
  );

  const nodes = graph.nodes.filter((node) => (includePeople ? true : node.kind !== 'PERSON'));

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Network graph"
        description="Organizations, people and credentials, connected by typed relationships. Click any node or edge to inspect it."
        actions={
          <div className="flex flex-wrap items-center gap-4">
            <Toggle checked={scopeToWorkspace} onChange={setScopeToWorkspace} label="My workspace only" />
            <Toggle checked={includePeople} onChange={setIncludePeople} label="People" />
            <Toggle checked={includeCredentials} onChange={setIncludeCredentials} label="Credentials" />
          </div>
        }
      />

      <div className="flex flex-wrap gap-2 text-2xs text-slate-500">
        <LegendItem className="border-emerald-300">Verified</LegendItem>
        <LegendItem className="border-brand-400">BID customer</LegendItem>
        <LegendItem className="border-slate-300">Member / unverified</LegendItem>
        <span className="inline-flex items-center gap-1">
          <span className="h-px w-6 bg-emerald-600" /> active relationship
        </span>
        <span className="inline-flex items-center gap-1">
          <span className="h-px w-6 border-t border-dashed border-slate-400" /> not monitored
        </span>
      </div>

      <NetworkGraph nodes={nodes} edges={graph.edges} onSelectNode={setSelectedNode} onSelectEdge={setSelectedEdge} height={600} />

      <Callout tone="neutral" title="What the graph shows and does not show">
        Scoped to your workspace, this is your counterparty network. Switched to the whole network, you see the BID demo
        environment as a platform operator would — in production an ordinary tenant never sees other tenants' relationships.
      </Callout>

      <Drawer
        open={Boolean(selectedNode)}
        onClose={() => setSelectedNode(null)}
        title={selectedNode?.label ?? ''}
        subtitle={selectedNode?.bidId}
      >
        {selectedNode && <NodeDetail node={selectedNode} viewerOrganizationId={organization.id} />}
      </Drawer>

      <Drawer
        open={Boolean(selectedEdge)}
        onClose={() => setSelectedEdge(null)}
        title="Relationship"
        subtitle={selectedEdge ? humanize(selectedEdge.type) : ''}
      >
        {selectedEdge && <EdgeDetail edge={selectedEdge} />}
      </Drawer>
    </div>
  );
}

function LegendItem({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded border bg-white px-1.5 py-0.5', className)}>{children}</span>
  );
}

function NodeDetail({ node, viewerOrganizationId }: { node: GraphNode; viewerOrganizationId: string }) {
  const { platform } = usePlatform();

  if (node.kind === 'PERSON') {
    const person = platform.store.persons.get(node.id);
    return (
      <div className="space-y-3">
        <DataList
          items={[
            { label: 'Name', value: person?.fullName ?? node.label },
            { label: 'BID person ID', value: <span className="font-mono text-xs">{node.bidId}</span> },
            { label: 'Email', value: person?.emailMasked ?? '—' },
            { label: 'Phone', value: person?.phoneMasked ?? '—' },
          ]}
        />
        <Callout tone="neutral" title="Person records are restricted">
          Person data is visible only to the workspace that ran the verification, under a recorded consent. It is never part
          of a public profile.
        </Callout>
      </div>
    );
  }

  const organization = platform.organizations.get(node.id);
  if (!organization) return null;
  const credentials = platform.verifications.credentialsForOrganization(organization.id);
  const relationship = platform.relationships.relationshipBetween(viewerOrganizationId, organization.id);

  return (
    <div className="space-y-4">
      <DataList
        items={[
          { label: 'Organization', value: organization.displayName },
          { label: 'BID ID', value: <span className="font-mono text-xs">{organization.bidId}</span> },
          { label: 'Industry', value: humanize(organization.industry) },
          { label: 'Organization lifecycle', value: humanize(organization.lifecycle) },
          { label: 'Commercial state', value: humanize(organization.commercialState) },
          { label: 'Credentials', value: credentials.length },
          { label: 'Your relationship', value: relationship ? humanize(relationship.type) : 'None' },
          { label: 'Member since', value: formatDate(organization.claimedAt) },
        ]}
      />
      <div className="flex flex-wrap gap-2">
        <Link to={`/profile/${organization.bidId}`}>
          <Button size="sm">Public BID profile</Button>
        </Link>
        {relationship?.latestVerificationId && (
          <Link to={`/app/verifications/${relationship.latestVerificationId}`}>
            <Button size="sm" variant="primary">
              Open verification
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}

function EdgeDetail({ edge }: { edge: GraphEdge }) {
  const { platform } = usePlatform();
  const relationship = platform.store.relationships.get(edge.id);
  const source = platform.organizations.get(edge.source);
  const target = platform.organizations.get(edge.target);

  return (
    <div className="space-y-4">
      <DataList
        items={[
          { label: 'From', value: source?.displayName ?? edge.source },
          { label: 'To', value: target?.displayName ?? edge.target },
          { label: 'Type', value: humanize(edge.type) },
          { label: 'Lifecycle', value: <Badge tone={edge.lifecycle === 'ACTIVE' ? 'verified' : 'pending'}>{humanize(edge.lifecycle)}</Badge> },
          { label: 'Verification', value: humanize(edge.verificationStatus) },
          { label: 'Monitored', value: edge.monitored ? 'Yes' : 'No' },
          { label: 'Relationship ID', value: <span className="font-mono text-xs">{relationship?.bidId ?? edge.id}</span> },
        ]}
      />
      {relationship?.latestVerificationId && (
        <Link to={`/app/verifications/${relationship.latestVerificationId}`}>
          <Button size="sm" variant="primary">
            Open verification
          </Button>
        </Link>
      )}
    </div>
  );
}
