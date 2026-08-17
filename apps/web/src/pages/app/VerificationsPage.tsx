import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { usePlatform } from '../../platform/PlatformProvider';
import { Badge, Button, Card, EmptyState, SectionHeading, Select, TextInput } from '../../components/ui';
import { VerificationStatusBadge } from '../../components/domain';
import { formatDate, humanize, relativeTime } from '../../lib/format';

export function VerificationsPage() {
  const { platform, workspace } = usePlatform();
  const [status, setStatus] = useState('ALL');
  const [query, setQuery] = useState('');

  const requests = workspace ? platform.verifications.listForWorkspace(workspace.id) : [];

  const filtered = useMemo(
    () =>
      requests.filter((request) => {
        if (status !== 'ALL' && request.status !== status) return false;
        if (query && !`${request.subjectName} ${request.bidId}`.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      }),
    [requests, status, query],
  );

  const statuses = [...new Set(requests.map((r) => r.status))];

  return (
    <div className="space-y-5">
      <SectionHeading
        title="Verifications"
        description="Every verification this workspace initiated, with the policy version and evidence behind it."
        actions={
          <Link to="/app/verifications/new">
            <Button variant="primary" icon={<Plus className="h-4 w-4" />}>
              New verification
            </Button>
          </Link>
        }
      />

      <Card padded={false}>
        <div className="flex flex-wrap gap-2 border-b border-slate-200 p-3">
          <div className="w-56">
            <TextInput placeholder="Search subject or BID ID" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          <div className="w-56">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="ALL">All statuses</option>
              {statuses.map((value) => (
                <option key={value} value={value}>
                  {humanize(value)}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState
              title="No verifications match"
              description="Adjust the filters, or start a new verification against a counterparty."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="bid-table">
              <thead>
                <tr>
                  <th>Subject</th>
                  <th>Relationship</th>
                  <th>Policy</th>
                  <th>Status</th>
                  <th>Decision</th>
                  <th>Assessment</th>
                  <th>SLA</th>
                  <th className="text-right">Updated</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((request) => {
                  const assessment = platform.verifications.assessment(request.id);
                  const policy = platform.policies.get(request.policyId);
                  const overdue = request.slaDueAt < new Date().toISOString() && !request.completedAt;
                  return (
                    <tr key={request.id}>
                      <td>
                        <Link to={`/app/verifications/${request.id}`} className="font-medium text-navy-900 hover:underline">
                          {request.subjectName}
                        </Link>
                        <div className="font-mono text-2xs text-slate-400">{request.bidId}</div>
                      </td>
                      <td className="text-xs">{humanize(request.relationshipType)}</td>
                      <td className="text-xs">
                        {policy?.name}
                        <span className="ml-1 text-slate-400">v{request.policyVersion}</span>
                      </td>
                      <td>
                        <VerificationStatusBadge status={request.status} />
                      </td>
                      <td>
                        <Badge
                          tone={
                            request.decision === 'APPROVED'
                              ? 'verified'
                              : request.decision === 'APPROVED_WITH_CONDITIONS'
                                ? 'attention'
                                : request.decision === 'REJECTED'
                                  ? 'exception'
                                  : 'pending'
                          }
                        >
                          {humanize(request.decision)}
                        </Badge>
                      </td>
                      <td className="text-xs">{assessment ? `${assessment.score}/100` : '—'}</td>
                      <td className="text-xs">
                        {overdue ? <Badge tone="exception">Overdue</Badge> : formatDate(request.slaDueAt)}
                      </td>
                      <td className="text-right text-xs text-slate-500">{relativeTime(request.updatedAt)}</td>
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
