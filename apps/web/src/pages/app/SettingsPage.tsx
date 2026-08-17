import { useState } from 'react';
import { KeyRound, Plus, Webhook } from 'lucide-react';
import { usePlatform } from '../../platform/PlatformProvider';
import {
  Badge,
  Button,
  Callout,
  Card,
  DataList,
  Field,
  Modal,
  SectionHeading,
  Select,
  TabPanel,
  Tabs,
  TextInput,
  Toast,
} from '../../components/ui';
import { formatDate, humanize, relativeTime } from '../../lib/format';

const SECURITY_CONTROLS = [
  { label: 'Authentication', value: 'Email + password with MFA. OIDC/OAuth-ready for SSO on enterprise plans.' },
  { label: 'Authorization', value: 'RBAC on workspace roles, plus attribute rules (tenant, relationship, entitlement) on every operation.' },
  { label: 'Tenant isolation', value: 'Every read and write carries a workspace id; cross-tenant access is rejected at the service layer.' },
  { label: 'API authentication', value: 'Scoped API keys (hashed at rest, shown once) with per-key rate limits.' },
  { label: 'Encryption', value: 'TLS in transit; identifiers and evidence encrypted at rest in production deployments.' },
  { label: 'Secrets', value: 'Provider credentials resolved from a secrets manager at runtime; never in source or config files.' },
  { label: 'Audit', value: 'Hash-chained audit log for every state change, with actor, resource and metadata.' },
  { label: 'Data minimization', value: 'Only attributes required by the applied policy are collected or shared.' },
  { label: 'Retention & deletion', value: 'Policy-driven retention; identity and relationship history is retained, evidence expires by classification.' },
];

export function SettingsPage() {
  const { platform, workspace, organization, access, entitlements, run } = usePlatform();
  const [tab, setTab] = useState('team');
  const [keyOpen, setKeyOpen] = useState(false);
  const [keyName, setKeyName] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const memberships = workspace ? platform.store.memberships.find((m) => m.workspaceId === workspace.id) : [];
  const apiKeys = workspace ? platform.store.apiKeys.find((k) => k.workspaceId === workspace.id) : [];
  const webhooks = workspace ? platform.store.webhooks.find((w) => w.workspaceId === workspace.id) : [];
  const authorizations = platform.verifications.authorizationsFor(organization.id);

  return (
    <div className="space-y-5">
      <Toast message={toast} onDismiss={() => setToast(null)} />
      <SectionHeading title="Team, API & security" description="Workspace access, integration credentials and the platform's security posture." />

      <Tabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'team', label: 'Team' },
          { id: 'api', label: 'API & webhooks' },
          { id: 'authorizations', label: 'Authorizations' },
          { id: 'security', label: 'Security' },
        ]}
      />

      <TabPanel id="team">
        <Card padded={false}>
          <div className="overflow-x-auto">
            <table className="bid-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Roles</th>
                  <th>MFA</th>
                  <th className="text-right">Last login</th>
                </tr>
              </thead>
              <tbody>
                {memberships.map((membership) => {
                  const user = platform.store.users.get(membership.userId);
                  return (
                    <tr key={membership.id}>
                      <td className="font-medium text-navy-900">{user?.name}</td>
                      <td className="text-xs">{user?.email}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          {membership.roles.map((role) => (
                            <Badge key={role} tone="neutral">
                              {humanize(role)}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td>{user?.mfaEnabled ? <Badge tone="verified">Enabled</Badge> : <Badge tone="attention">Off</Badge>}</td>
                      <td className="text-right text-xs text-slate-500">{user?.lastLoginAt ? relativeTime(user.lastLoginAt) : '—'}</td>
                    </tr>
                  );
                })}
                {memberships.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-sm text-slate-500">
                      No workspace members recorded.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
        <Card className="mt-4">
          <SectionHeading title="Your effective permissions" description="Role grants intersected with plan entitlements." />
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            <DataList
              items={[
                { label: 'Roles', value: access.roles.map(humanize).join(', ') },
                { label: 'Workspace', value: workspace?.name ?? '—' },
                { label: 'Tenant', value: <span className="font-mono text-2xs">{access.tenantId}</span> },
              ]}
            />
            <DataList
              items={Object.entries(entitlements).map(([key, value]) => ({
                label: humanize(key.replace(/^can/, '')),
                value: typeof value === 'boolean' ? (value ? <Badge tone="verified">Yes</Badge> : <Badge tone="pending">No</Badge>) : value,
              }))}
            />
          </div>
        </Card>
      </TabPanel>

      <TabPanel id="api">
        <div className="grid gap-4 lg:grid-cols-2">
          <Card padded={false}>
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <SectionHeading title="API keys" description="Scoped, hashed at rest, shown once at creation." />
              <Button
                size="sm"
                icon={<Plus className="h-3.5 w-3.5" />}
                disabled={!entitlements.canUseApi}
                onClick={() => setKeyOpen(true)}
              >
                New key
              </Button>
            </div>
            <div className="divide-y divide-slate-100">
              {apiKeys.length === 0 && <p className="p-4 text-sm text-slate-500">No API keys.</p>}
              {apiKeys.map((key) => (
                <div key={key.id} className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium text-navy-900">{key.name}</p>
                    <Badge tone={key.revokedAt ? 'exception' : 'verified'}>{key.revokedAt ? 'Revoked' : 'Active'}</Badge>
                  </div>
                  <p className="mt-1 font-mono text-2xs text-slate-500">{key.prefix}••••••••••••</p>
                  <p className="mt-1 text-2xs text-slate-500">
                    Scopes: {key.scopes.join(', ')} · created {formatDate(key.createdAt)} · last used{' '}
                    {key.lastUsedAt ? relativeTime(key.lastUsedAt) : 'never'}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          <Card padded={false}>
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
              <SectionHeading title="Webhooks" description="Domain events delivered to your systems." />
              <Webhook className="h-4 w-4 text-slate-400" />
            </div>
            <div className="divide-y divide-slate-100">
              {webhooks.length === 0 && <p className="p-4 text-sm text-slate-500">No webhook endpoints.</p>}
              {webhooks.map((webhook) => (
                <div key={webhook.id} className="p-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-mono text-xs text-navy-900">{webhook.url}</p>
                    <Badge tone={webhook.active ? 'verified' : 'pending'}>{webhook.active ? 'Active' : 'Paused'}</Badge>
                  </div>
                  <p className="mt-1 text-2xs text-slate-500">Events: {webhook.events.join(', ')}</p>
                  <p className="mt-0.5 font-mono text-2xs text-slate-400">{webhook.secretMasked}</p>
                </div>
              ))}
            </div>
          </Card>
        </div>
        <Callout tone="neutral" title="API-first by design" >
          The same operations available in this interface are exposed as REST resources (organizations, invitations,
          relationships, policies, verification-requests, campaigns, bgv, consents, authorizations, credentials, monitoring).
          See <span className="font-mono">docs/API.md</span> for the contracts.
        </Callout>
      </TabPanel>

      <TabPanel id="authorizations">
        <Card padded={false}>
          <div className="border-b border-slate-200 px-4 py-3">
            <SectionHeading
              title="Authorizations"
              description="One organization granting another permission to operate. Distinct from a person's consent."
            />
          </div>
          <div className="overflow-x-auto">
            <table className="bid-table">
              <thead>
                <tr>
                  <th>Grantor</th>
                  <th>Grantee</th>
                  <th>Operation</th>
                  <th>Scope</th>
                  <th>Status</th>
                  <th className="text-right">Valid to</th>
                </tr>
              </thead>
              <tbody>
                {authorizations.map((authorization) => (
                  <tr key={authorization.id}>
                    <td className="text-xs">{platform.organizations.get(authorization.grantorOrganizationId)?.displayName}</td>
                    <td className="text-xs">{platform.organizations.get(authorization.granteeOrganizationId)?.displayName}</td>
                    <td className="text-xs">{humanize(authorization.operation)}</td>
                    <td className="text-xs">{authorization.scope.join(', ')}</td>
                    <td>
                      <Badge tone={authorization.status === 'GRANTED' ? 'verified' : 'pending'}>{humanize(authorization.status)}</Badge>
                    </td>
                    <td className="text-right text-xs">{formatDate(authorization.endAt)}</td>
                  </tr>
                ))}
                {authorizations.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-6 text-center text-sm text-slate-500">
                      No authorizations granted or received.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </TabPanel>

      <TabPanel id="security">
        <Card>
          <SectionHeading title="Security architecture" description="How the platform protects tenant data." />
          <div className="mt-3">
            <DataList items={SECURITY_CONTROLS.map((control) => ({ label: control.label, value: <span className="text-xs">{control.value}</span> }))} />
          </div>
        </Card>
        <Callout tone="neutral" title="Compliance posture">
          BID Trust is designed to support privacy and due-diligence obligations. Nothing here asserts legal compliance for a
          specific deployment; that requires qualified legal review in your jurisdiction.
        </Callout>
      </TabPanel>

      <Modal
        open={keyOpen}
        onClose={() => setKeyOpen(false)}
        title="Create API key"
        description="The secret is displayed once. Only a hash is stored."
        footer={
          <>
            <Button onClick={() => setKeyOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              disabled={!keyName || !workspace}
              icon={<KeyRound className="h-4 w-4" />}
              onClick={() => {
                if (!workspace) return;
                run((p) =>
                  p.store.apiKeys.insert({
                    id: `key_${Math.random().toString(36).slice(2, 8)}`,
                    workspaceId: workspace.id,
                    name: keyName,
                    prefix: `bid_live_${Math.random().toString(36).slice(2, 5)}`,
                    hashedSecret: 'demo-hash',
                    scopes: ['organizations:read', 'verification-requests:write'],
                    createdAt: new Date().toISOString(),
                  }),
                );
                setKeyOpen(false);
                setKeyName('');
                setToast('API key created. In production the secret is shown once here and never again.');
              }}
            >
              Create key
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          <Field label="Key name" required>
            <TextInput value={keyName} onChange={(event) => setKeyName(event.target.value)} placeholder="e.g. Procurement integration" />
          </Field>
          <Field label="Scopes">
            <Select defaultValue="read-write">
              <option value="read">Read only</option>
              <option value="read-write">Read + initiate verification</option>
            </Select>
          </Field>
        </div>
      </Modal>
    </div>
  );
}
