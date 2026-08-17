import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Activity,
  Bell,
  Boxes,
  Building2,
  CircleDollarSign,
  ClipboardCheck,
  FileStack,
  Gauge,
  Inbox,
  KeyRound,
  Lock,
  type LucideIcon,
  Menu,
  Network,
  ScrollText,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserRound,
  Users,
  X,
} from 'lucide-react';
import { usePlatform } from '../platform/PlatformProvider';
import { Badge, Button, Drawer, cx } from './ui';
import { BidLogo, CommercialStateBadge, OrgAvatar } from './domain';
import { formatDateTime, relativeTime } from '../lib/format';
import { CommandPalette } from './CommandPalette';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** Capability required; when missing the item renders locked. */
  requires?: 'requester';
  badge?: number;
}

export function AppShell({ children }: { children: ReactNode }) {
  const { platform, organization, workspace, isRequester, access } = usePlatform();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const location = useLocation();

  useEffect(() => setMobileNavOpen(false), [location.pathname]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setPaletteOpen((open) => !open);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const notifications = platform.notifications(workspace?.id, organization.id);
  const unread = notifications.filter((n) => !n.read).length;

  const pendingReceived = platform.verifications
    .listForSubject(organization.id)
    .filter((request) => !['COMPLETED', 'CREDENTIAL_ISSUED', 'MONITORING', 'FAILED'].includes(request.status)).length;

  const openAlerts = workspace ? platform.monitoring.openAlertCount(workspace.id) : 0;

  const navGroups: { title: string; items: NavItem[] }[] = useMemo(
    () => [
      {
        title: 'Overview',
        items: [
          { to: '/app', label: 'Dashboard', icon: Gauge },
          { to: '/app/organization', label: 'My organization', icon: Building2 },
          { to: '/app/network', label: 'Network graph', icon: Network },
        ],
      },
      {
        title: 'Trust',
        items: [
          { to: '/app/requests-received', label: 'Requests received', icon: Inbox, badge: pendingReceived },
          { to: '/app/credentials', label: 'Credentials & card', icon: ShieldCheck },
          { to: '/app/profile', label: 'BID profile', icon: UserRound },
        ],
      },
      {
        title: 'Verify others',
        items: [
          { to: '/app/relationships', label: 'Relationships', icon: Boxes, requires: 'requester' },
          { to: '/app/requests-sent', label: 'Requests sent', icon: Send, requires: 'requester' },
          { to: '/app/verifications', label: 'Verifications', icon: ClipboardCheck, requires: 'requester' },
          { to: '/app/campaigns', label: 'Campaigns', icon: FileStack, requires: 'requester' },
          { to: '/app/policies', label: 'Policies', icon: ScrollText, requires: 'requester' },
          { to: '/app/people', label: 'People & BGV', icon: Users, requires: 'requester' },
          { to: '/app/monitoring', label: 'Monitoring', icon: Activity, requires: 'requester', badge: openAlerts },
        ],
      },
      {
        title: 'Account',
        items: [
          { to: '/app/billing', label: 'Billing & usage', icon: CircleDollarSign },
          { to: '/app/settings', label: 'Team, API & security', icon: KeyRound },
          { to: '/app/audit', label: 'Audit & events', icon: ScrollText },
        ],
      },
    ],
    [pendingReceived, openAlerts],
  );

  return (
    <div className="flex h-full bg-slate-50">
      <aside className="hidden w-60 shrink-0 flex-col border-r border-navy-800 bg-navy-950 lg:flex">
        <SidebarContent navGroups={navGroups} isRequester={isRequester} />
      </aside>

      {mobileNavOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-navy-950/50" onClick={() => setMobileNavOpen(false)} />
          <aside className="relative flex h-full w-64 flex-col bg-navy-950">
            <button
              onClick={() => setMobileNavOpen(false)}
              className="absolute right-3 top-3 rounded p-1 text-navy-300 hover:bg-navy-900"
            >
              <X className="h-4 w-4" />
            </button>
            <SidebarContent navGroups={navGroups} isRequester={isRequester} />
          </aside>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-2.5">
          <button className="rounded p-1.5 text-slate-500 hover:bg-slate-100 lg:hidden" onClick={() => setMobileNavOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>

          <OrgSwitcher />

          <button
            onClick={() => setPaletteOpen(true)}
            className="ml-auto hidden items-center gap-2 rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-500 hover:bg-slate-50 sm:flex"
          >
            <Search className="h-3.5 w-3.5" />
            Search organizations, verifications, policies…
            <kbd className="rounded border border-slate-300 bg-slate-100 px-1 font-mono text-2xs">⌘K</kbd>
          </button>

          <Link
            to="/app/journey"
            className="hidden items-center gap-1.5 rounded border border-brand-200 bg-brand-50 px-2.5 py-1.5 text-xs font-medium text-brand-700 hover:bg-brand-100 md:flex"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Guided journey
          </Link>

          <button
            onClick={() => setNotificationsOpen(true)}
            className="relative rounded p-1.5 text-slate-500 hover:bg-slate-100"
            aria-label="Notifications"
          >
            <Bell className="h-4.5 w-4.5" />
            {unread > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                {unread}
              </span>
            )}
          </button>

          <div className="hidden items-center gap-2 border-l border-slate-200 pl-3 sm:flex">
            <div className="text-right">
              <p className="text-xs font-semibold text-navy-900">{access.userName}</p>
              <p className="text-2xs text-slate-500">{access.roles.join(', ').toLowerCase()}</p>
            </div>
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-navy-900 text-2xs font-bold text-white">
              {access.userName.slice(0, 2).toUpperCase()}
            </span>
          </div>
        </header>

        <main className="bid-scroll min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1400px] px-4 py-5 sm:px-6">{children}</div>
        </main>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />

      <Drawer
        open={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        title="Notifications"
        subtitle="In-app channel. Email and webhook delivery are wired through the same notification framework."
        footer={
          <Button
            size="sm"
            onClick={() => {
              platform.markAllNotificationsRead(workspace?.id, organization.id);
              setNotificationsOpen(false);
            }}
          >
            Mark all as read
          </Button>
        }
      >
        <div className="space-y-2">
          {notifications.length === 0 && <p className="text-sm text-slate-500">Nothing yet.</p>}
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={cx(
                'rounded border p-3',
                notification.read ? 'border-slate-200 bg-white' : 'border-brand-200 bg-brand-50/50',
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-medium text-navy-900">{notification.title}</p>
                <Badge
                  tone={
                    notification.severity === 'SUCCESS'
                      ? 'verified'
                      : notification.severity === 'WARNING'
                        ? 'attention'
                        : notification.severity === 'ERROR'
                          ? 'exception'
                          : 'info'
                  }
                >
                  {notification.channel}
                </Badge>
              </div>
              <p className="mt-1 text-xs text-slate-600">{notification.body}</p>
              <div className="mt-1.5 flex items-center gap-2 text-2xs text-slate-400">
                <span>{formatDateTime(notification.createdAt)}</span>
                <span>·</span>
                <span>{relativeTime(notification.createdAt)}</span>
                {notification.link && (
                  <Link
                    to={notification.link}
                    onClick={() => {
                      platform.markNotificationRead(notification.id);
                      setNotificationsOpen(false);
                    }}
                    className="ml-auto font-medium text-brand-700 hover:underline"
                  >
                    Open
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      </Drawer>
    </div>
  );
}

function SidebarContent({
  navGroups,
  isRequester,
}: {
  navGroups: { title: string; items: NavItem[] }[];
  isRequester: boolean;
}) {
  return (
    <>
      <div className="border-b border-navy-800 px-4 py-4">
        <Link to="/" className="text-white">
          <BidLogo />
        </Link>
      </div>
      <nav className="bid-scroll flex-1 space-y-5 overflow-y-auto px-2.5 py-4">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className="px-2 pb-1.5 text-2xs font-semibold uppercase tracking-wider text-navy-400">{group.title}</p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const locked = item.requires === 'requester' && !isRequester;
                const Icon = item.icon;
                if (locked) {
                  return (
                    <li key={item.to}>
                      <Link
                        to="/app/become-requester"
                        className="group flex items-center gap-2.5 rounded px-2 py-1.5 text-sm text-navy-400 hover:bg-navy-900"
                        title="Requires a requester plan"
                      >
                        <Icon className="h-4 w-4" />
                        <span className="flex-1">{item.label}</span>
                        <Lock className="h-3 w-3" />
                      </Link>
                    </li>
                  );
                }
                return (
                  <li key={item.to}>
                    <NavLink
                      to={item.to}
                      end={item.to === '/app'}
                      className={({ isActive }) =>
                        cx(
                          'flex items-center gap-2.5 rounded px-2 py-1.5 text-sm transition',
                          isActive ? 'bg-brand-600 text-white' : 'text-navy-100 hover:bg-navy-900',
                        )
                      }
                    >
                      <Icon className="h-4 w-4" />
                      <span className="flex-1">{item.label}</span>
                      {item.badge ? (
                        <span className="rounded bg-navy-800 px-1.5 text-2xs font-semibold text-white">{item.badge}</span>
                      ) : null}
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
      <div className="space-y-1 border-t border-navy-800 px-2.5 py-3 text-xs">
        <Link to="/architecture" className="block rounded px-2 py-1.5 text-navy-200 hover:bg-navy-900">
          Architecture explorer
        </Link>
        <Link to="/story" className="block rounded px-2 py-1.5 text-navy-200 hover:bg-navy-900">
          Network story
        </Link>
        <Link to="/admin" className="block rounded px-2 py-1.5 text-navy-200 hover:bg-navy-900">
          BID admin console
        </Link>
      </div>
    </>
  );
}

function OrgSwitcher() {
  const { platform, organization, switchOrganization, canSwitchOrganization, mode, access, signOut } = usePlatform();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const switchable = platform.organizations
    .list()
    .filter((candidate) => Boolean(platform.organizations.workspaceFor(candidate.id)))
    .sort((a, b) => a.displayName.localeCompare(b.displayName));

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2.5 rounded border border-slate-200 px-2 py-1.5 hover:bg-slate-50"
      >
        <OrgAvatar name={organization.displayName} color={organization.logoColor} text={organization.logoText} size="sm" />
        <span className="text-left">
          <span className="block text-xs font-semibold leading-tight text-navy-900">{organization.displayName}</span>
          <span className="block font-mono text-2xs leading-tight text-slate-500">{organization.bidId}</span>
        </span>
        <CommercialStateBadge state={organization.commercialState} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-full z-20 mt-1 w-80 rounded-md border border-slate-200 bg-white p-1.5 shadow-panel">
            {mode === 'CONNECTED' ? (
              <div className="px-2 py-1.5">
                <p className="text-2xs uppercase tracking-wider text-slate-400">Signed in</p>
                <p className="mt-0.5 text-xs font-medium text-navy-900">{access.userName}</p>
                <p className="font-mono text-2xs text-slate-500">{organization.bidId}</p>
                <p className="mt-2 text-2xs leading-relaxed text-slate-500">
                  Acting as another organization is a demo affordance. Here you are one tenant, and every other
                  workspace is invisible.
                </p>
                <button
                  onClick={() => {
                    setOpen(false);
                    void signOut();
                  }}
                  className="mt-2 w-full rounded border border-slate-200 px-2 py-1.5 text-xs font-medium text-navy-800 hover:bg-slate-50"
                >
                  Sign out
                </button>
              </div>
            ) : (
              <p className="px-2 py-1 text-2xs uppercase tracking-wider text-slate-400">
                View as — every workspace is a separate tenant
              </p>
            )}
            {canSwitchOrganization &&
              switchable.map((candidate) => (
              <button
                key={candidate.id}
                onClick={() => {
                  switchOrganization(candidate.id);
                  setOpen(false);
                  navigate('/app');
                }}
                className={cx(
                  'flex w-full items-center gap-2 rounded px-2 py-1.5 text-left hover:bg-slate-50',
                  candidate.id === organization.id && 'bg-slate-50',
                )}
              >
                <OrgAvatar name={candidate.displayName} color={candidate.logoColor} text={candidate.logoText} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-medium text-navy-900">{candidate.displayName}</span>
                  <span className="block font-mono text-2xs text-slate-500">{candidate.bidId}</span>
                </span>
                <CommercialStateBadge state={candidate.commercialState} />
                </button>
              ))}
          </div>
        </>
      )}
    </div>
  );
}
