import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  BidPlatform,
  seedDemo,
  type AccessContext,
  type Entitlements,
  type Organization,
  type WorkspaceRole,
  type Workspace,
} from '@bid/core';
import {
  ApiUnreachableError,
  apiConfigured,
  fetchSnapshot,
  logout as apiLogout,
  readToken,
  writeToken,
  type Snapshot,
} from '../api/client';
import { httpCommands, localCommands, type Commands } from '../api/commands';

/**
 * How the application is running.
 *
 * `CONNECTED` — signed in to the API. Everything on screen came from the
 * server, and every change goes back to it.
 * `DEMO` — no API. The same domain engine runs in the browser against the
 * fictional network. Real state transitions, nothing durable.
 * `SIGNED_OUT` — an API is configured but nobody is signed in.
 */
export type PlatformMode = 'CONNECTED' | 'DEMO' | 'SIGNED_OUT';

export type SessionMode = 'ORGANIZATION' | 'PLATFORM_ADMIN';

export interface SessionState {
  mode: SessionMode;
  organizationId: string;
}

interface PlatformValue {
  platform: BidPlatform;
  mode: PlatformMode;
  version: number;
  session: SessionState;
  organization: Organization;
  workspace?: Workspace;
  access: AccessContext;
  entitlements: Entitlements;
  commands: Commands;
  /** MEMBER / REQUESTER / CUSTOMER shape the whole application surface. */
  isMember: boolean;
  isRequester: boolean;
  isCustomer: boolean;
  /** Acting as a different organization is a demo affordance, not a real one. */
  canSwitchOrganization: boolean;
  switchOrganization: (organizationId: string) => void;
  setMode: (mode: SessionMode) => void;
  /**
   * Runs a command and reloads. In connected mode the reload comes from the
   * server, so what the screen shows afterwards is what was actually stored.
   */
  execute: <T>(action: (commands: Commands) => Promise<T>) => Promise<T>;
  /** Local-only mutation. Demo mode only; throws when connected. */
  run: <T>(action: (platform: BidPlatform) => T) => T;
  runAsync: <T>(action: (platform: BidPlatform) => Promise<T>) => Promise<T>;
  reload: () => Promise<void>;
  refresh: () => void;
  signOut: () => Promise<void>;
}

const PlatformContext = createContext<PlatformValue | null>(null);

const SESSION_KEY = 'bid.session';

function readRememberedSession(): SessionState | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionState>;
    if (typeof parsed.organizationId !== 'string') return null;
    return {
      mode: parsed.mode === 'PLATFORM_ADMIN' ? 'PLATFORM_ADMIN' : 'ORGANIZATION',
      organizationId: parsed.organizationId,
    };
  } catch {
    return null;
  }
}

function rememberSession(session: SessionState): void {
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    // Storage can be unavailable (private mode, embedded contexts). The session
    // simply falls back to the default organization.
  }
}

/** Builds a platform whose store holds exactly what the server sent. */
function platformFromSnapshot(snapshot: Snapshot): BidPlatform {
  const platform = new BidPlatform();
  const collections = platform.store.collections();

  for (const [name, records] of Object.entries(snapshot.collections)) {
    const collection = collections[name];
    // A collection the server knows about and this client does not is a version
    // skew, not a crash: ignore it and work with what is understood.
    if (collection) collection.hydrate(records);
  }

  // The client issues no identifiers of its own — every mutation is a request
  // to the server — but the audit chain head still has to be right for anything
  // reading the log.
  platform.resumeFromStore();
  return platform;
}

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [platform, setPlatform] = useState<BidPlatform | null>(null);
  const [mode, setPlatformMode] = useState<PlatformMode>(apiConfigured() ? 'SIGNED_OUT' : 'DEMO');
  const [snapshotSession, setSnapshotSession] = useState<Snapshot['session'] | null>(null);
  const [version, setVersion] = useState(0);
  const [session, setSession] = useState<SessionState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [booting, setBooting] = useState(true);

  const refresh = useCallback(() => setVersion((value) => value + 1), []);

  /* ---------------- connected boot ---------------- */

  const loadFromServer = useCallback(async () => {
    const snapshot = await fetchSnapshot();
    const next = platformFromSnapshot(snapshot);
    setPlatform(next);
    setSnapshotSession(snapshot.session);
    setSession({ mode: 'ORGANIZATION', organizationId: snapshot.session.organizationId });
    setPlatformMode('CONNECTED');
    refresh();
  }, [refresh]);

  /* ---------------- demo boot ---------------- */

  const loadDemo = useCallback(async () => {
    const handles = await seedDemo();
    setPlatform(handles.platform);
    setSnapshotSession(null);
    // The demo store is in-memory, so a reload re-seeds it. The *viewpoint*
    // (which organization you are acting as) is worth keeping across reloads —
    // otherwise deep links always land you back in ABC.
    const remembered = readRememberedSession();
    const organizationId =
      remembered && handles.platform.organizations.get(remembered.organizationId)
        ? remembered.organizationId
        : handles.organizations.abc;
    setSession({ mode: remembered?.mode ?? 'ORGANIZATION', organizationId });
    setPlatformMode('DEMO');
    refresh();
  }, [refresh]);

  const booted = useRef(false);

  useEffect(() => {
    if (booted.current) return;
    booted.current = true;

    const boot = async () => {
      if (!apiConfigured()) {
        await loadDemo();
        return;
      }
      if (!readToken()) {
        setPlatformMode('SIGNED_OUT');
        return;
      }
      try {
        await loadFromServer();
      } catch (bootError) {
        if (bootError instanceof ApiUnreachableError) {
          // Configured but not answering. Falling back to the demo network
          // silently would be worse than saying so.
          setError('The BID Trust API is not responding. Check that it is running, then reload.');
          return;
        }
        // A rejected token is the ordinary case here — it expired, or someone
        // signed out elsewhere. Drop it and ask for credentials again.
        writeToken(null);
        setPlatformMode('SIGNED_OUT');
      }
    };

    boot()
      .catch((bootError: unknown) => {
        setError(bootError instanceof Error ? bootError.message : String(bootError));
      })
      .finally(() => setBooting(false));
  }, [loadDemo, loadFromServer]);

  /* ---------------- re-render on domain activity ---------------- */

  useEffect(() => {
    if (!platform) return;
    const unsubscribeBus = platform.bus.subscribe('*', () => refresh());
    const unsubscribeChange = platform.onChange(() => refresh());
    return () => {
      unsubscribeBus();
      unsubscribeChange();
    };
  }, [platform, refresh]);

  /* ---------------- the value ---------------- */

  const value = useMemo<PlatformValue | null>(() => {
    if (!platform || !session) return null;
    const organization = platform.organizations.get(session.organizationId);
    if (!organization) return null;

    const workspace = platform.organizations.workspaceFor(organization.id);

    // Connected: the server already decided who you are and what you may do,
    // and the client must not talk itself into more. Demo: the local platform
    // derives it, because there is no server to ask.
    const base =
      session.mode === 'PLATFORM_ADMIN'
        ? { ...platform.adminContext(), organizationId: organization.id }
        : platform.accessContextFor(organization.id, {
            userId: snapshotSession?.userId,
            roles: snapshotSession?.roles as WorkspaceRole[] | undefined,
          });

    const access: AccessContext = snapshotSession
      ? { ...base, workspaceId: snapshotSession.workspaceId, userId: snapshotSession.userId }
      : base;

    const connected = mode === 'CONNECTED';
    const commands = connected ? httpCommands() : localCommands(platform, () => access);

    const reload = async () => {
      if (connected) await loadFromServer();
      else refresh();
    };

    return {
      platform,
      mode,
      version,
      session,
      organization,
      workspace,
      access,
      entitlements: access.entitlements,
      commands,
      isMember: organization.commercialState === 'MEMBER' || organization.commercialState === 'VERIFIED_MEMBER',
      isRequester: ['REQUESTER', 'CUSTOMER', 'ENTERPRISE'].includes(organization.commercialState),
      isCustomer: ['CUSTOMER', 'ENTERPRISE'].includes(organization.commercialState),
      canSwitchOrganization: !connected,
      switchOrganization: (organizationId: string) => {
        if (connected) return;
        setSession((current) => {
          const next = current ? { ...current, organizationId } : current;
          if (next) rememberSession(next);
          return next;
        });
        refresh();
      },
      setMode: (nextMode: SessionMode) => {
        setSession((current) => {
          const next = current ? { ...current, mode: nextMode } : current;
          if (next) rememberSession(next);
          return next;
        });
        refresh();
      },
      execute: async (action) => {
        const result = await action(commands);
        await reload();
        return result;
      },
      run: (action) => {
        if (connected) {
          throw new Error('This action has no API equivalent yet and cannot run against a real workspace.');
        }
        const result = action(platform);
        refresh();
        return result;
      },
      runAsync: async (action) => {
        if (connected) {
          throw new Error('This action has no API equivalent yet and cannot run against a real workspace.');
        }
        const result = await action(platform);
        refresh();
        return result;
      },
      reload,
      refresh,
      signOut: async () => {
        await apiLogout();
        setPlatform(null);
        setSession(null);
        setSnapshotSession(null);
        setPlatformMode('SIGNED_OUT');
      },
    };
  }, [platform, session, snapshotSession, mode, version, refresh, loadFromServer]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-navy-950 p-8 text-center text-sm text-red-200">
        <div className="max-w-md">
          <p className="mb-2 font-semibold text-white">BID Trust could not start.</p>
          <p className="font-mono text-xs">{error}</p>
        </div>
      </div>
    );
  }

  if (booting) return <BootScreen />;

  if (mode === 'SIGNED_OUT') {
    return (
      <AuthGate
        onAuthenticated={async () => {
          setBooting(true);
          try {
            await loadFromServer();
          } finally {
            setBooting(false);
          }
        }}
      />
    );
  }

  if (!value) return <BootScreen />;

  return <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>;
}

function BootScreen() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 bg-navy-950 text-white">
      <div className="flex h-12 w-12 items-center justify-center rounded-md bg-brand-600 text-lg font-bold">B</div>
      <div className="text-center">
        <p className="text-sm font-semibold tracking-wide">BID TRUST</p>
        <p className="mt-1 text-xs text-navy-200">Loading your workspace…</p>
      </div>
      <div className="h-1 w-48 overflow-hidden rounded bg-navy-800">
        <div className="h-full w-1/2 animate-pulse rounded bg-brand-500" />
      </div>
    </div>
  );
}

/** Lazily imported to keep the sign-in screen out of the demo build's path. */
function AuthGate({ onAuthenticated }: { onAuthenticated: () => Promise<void> }) {
  const [Screen, setScreen] = useState<null | ((props: { onAuthenticated: () => Promise<void> }) => JSX.Element)>(null);

  useEffect(() => {
    let cancelled = false;
    void import('../pages/auth/AuthPage').then((module) => {
      if (!cancelled) setScreen(() => module.AuthPage);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!Screen) return <BootScreen />;
  return <Screen onAuthenticated={onAuthenticated} />;
}

export function usePlatform(): PlatformValue {
  const value = useContext(PlatformContext);
  if (!value) throw new Error('usePlatform must be used inside <PlatformProvider>');
  return value;
}

/** Read-only access for public routes (landing page, public profile). */
export function useOptionalPlatform(): PlatformValue | null {
  return useContext(PlatformContext);
}
