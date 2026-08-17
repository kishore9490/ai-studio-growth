import { useMemo, useState } from 'react';
import { usePlatform } from '../../platform/PlatformProvider';
import { Badge, Callout, Card, SectionHeading, TabPanel, Tabs, TextInput } from '../../components/ui';
import { formatDateTime, humanize, relativeTime } from '../../lib/format';

export function AuditPage() {
  const { platform, workspace } = usePlatform();
  const [tab, setTab] = useState('audit');
  const [query, setQuery] = useState('');

  const entries = platform.auditLog({ workspaceId: workspace?.id, limit: 300 });
  const events = platform.events(120);

  const filtered = useMemo(
    () =>
      entries.filter((entry) =>
        query ? `${entry.summary} ${entry.action} ${entry.actorName}`.toLowerCase().includes(query.toLowerCase()) : true,
      ),
    [entries, query],
  );

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Audit & events"
        description="Every state change is written to a hash-chained audit log, and every meaningful transition publishes a domain event."
      />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'audit', label: `Audit log (${entries.length})` },
          { id: 'events', label: `Event stream (${events.length})` },
        ]}
      />

      <TabPanel id="audit" current={tab}>
        <Card padded={false}>
          <div className="border-b border-slate-200 p-3">
            <div className="w-72">
              <TextInput placeholder="Filter by action, actor or summary" value={query} onChange={(e) => setQuery(e.target.value)} />
            </div>
          </div>
          <div className="max-h-[36rem] overflow-y-auto">
            <table className="bid-table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Actor</th>
                  <th>Action</th>
                  <th>Summary</th>
                  <th className="text-right">Hash chain</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry) => (
                  <tr key={entry.id}>
                    <td className="whitespace-nowrap text-xs">{formatDateTime(entry.at)}</td>
                    <td className="text-xs">
                      <div className="font-medium text-navy-900">{entry.actorName}</div>
                      <div className="text-2xs text-slate-400">{humanize(entry.actorType)}</div>
                    </td>
                    <td>
                      <Badge tone="neutral">{entry.action}</Badge>
                    </td>
                    <td className="max-w-xl text-xs">{entry.summary}</td>
                    <td className="text-right font-mono text-2xs text-slate-400">
                      {entry.previousHash.slice(0, 6)} → {entry.hash.slice(0, 6)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Callout tone="neutral" title="Tamper evidence">
          Each entry embeds the hash of the previous entry, so removing or editing one breaks the chain. This build uses a
          fast non-cryptographic hash for demonstration; production uses SHA-256 with a signing key held in the secrets
          manager.
        </Callout>
      </TabPanel>

      <TabPanel id="events" current={tab}>
        <Card padded={false}>
          <div className="max-h-[36rem] overflow-y-auto">
            <table className="bid-table">
              <thead>
                <tr>
                  <th>Event</th>
                  <th>When</th>
                  <th>Scope</th>
                  <th>Payload</th>
                </tr>
              </thead>
              <tbody>
                {events.map((event) => (
                  <tr key={event.id}>
                    <td>
                      <Badge tone="brand">{event.name}</Badge>
                    </td>
                    <td className="whitespace-nowrap text-xs">{relativeTime(event.occurredAt)}</td>
                    <td className="font-mono text-2xs text-slate-500">
                      {event.workspaceId ?? '—'} / {event.organizationId ?? '—'}
                    </td>
                    <td className="max-w-xl font-mono text-2xs text-slate-600">{JSON.stringify(event.payload)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
        <Callout tone="neutral" title="Event-driven by design">
          Verification, billing, credentialing, notification, monitoring and customer-lifecycle services communicate through
          these events rather than direct calls. The bus is in-memory here; the interface is broker-shaped so NATS, Kafka or
          SQS can replace it without touching business logic.
        </Callout>
      </TabPanel>
    </div>
  );
}
