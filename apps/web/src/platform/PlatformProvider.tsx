import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  seedDemo,
  type AccessContext,
  type BidPlatform,
  type Entitlements,
  type Organization,
  type Workspace,
} from '@bid/core';

export type SessionMode = 'ORGANIZATION' | 'PLATFORM_ADMIN';

export interface SessionState {
  mode: SessionMode;
  organizationId: string;
}

interface PlatformValue {
  platform: BidPlatform;
  version: number;
  session: SessionState;
  organization: Organization;
  workspace?: Workspace;
  access: AccessContext;
  entitlements: Entitlements;
  /** MEMBER / REQUESTER / CUSTOMER shape the whole application surface. */
  isMember: boolean;
  isRequester: boolean;
  isCustomer: boolean;
  switchOrganization: (organizationId: string) => void;
  setMode: (mode: SessionMode) => void;
  /** Runs a mutation and re-renders everything derived from the store. */
  run: <T>(action: (platform: BidPlatform) => T) => T;
  runAsync: <T>(action: (platform: BidPlatform) => Promise<T>) => Promise<T>;
  refresh: () => void;
}

const PlatformContext = createContext<PlatformValue | null>(null);

const SESSION_KEY = 'bid.session';

function readRememberedSession(): SessionState | null {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<SessionState>;
    if (typeof parsed.organizationId !== 'string') return null;
    return { mode: parsed.mode === 'PLATFORM_ADMIN' ? 'PLATFORM_ADMIN' : 'ORGANIZATION', organizationId: parsed.organizationId };
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

export function PlatformProvider({ children }: { children: ReactNode }) {
  const [platform, setPlatform] = useState<BidPlatform | null>(null);
  const [version, setVersion] = useState(0);
  const [session, setSession] = useState<SessionState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    seedDemo()
      .then((handles) => {
        if (cancelled) return;
        setPlatform(handles.platform);
        // The demo store is in-memory, so a reload re-seeds it. The *viewpoint*
        // (which organization you are acting as) is worth keeping across
        // reloads — otherwise deep links always land you back in ABC.
        const remembered = readRememberedSession();
        const organizationId =
          remembered && handles.platform.organizations.get(remembered.organizationId)
            ? remembered.organizationId
            : handles.organizations.abc;
        setSession({ mode: remembered?.mode ?? 'ORGANIZATION', organizationId });
      })
      .catch((seedError: unknown) => {
        if (cancelled) return;
        setError(seedError instanceof Error ? seedError.message : String(seedError));
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(() => setVersion((value) => value + 1), []);

  useEffect(() => {
    if (!platform) return;
    // Async work (provider calls, monitoring sweeps) re-renders through the bus.
    const unsubscribeBus = platform.bus.subscribe('*', () => refresh());
    const unsubscribeChange = platform.onChange(() => refresh());
    return () => {
      unsubscribeBus();
      unsubscribeChange();
    };
  }, [platform, refresh]);

  const value = useMemo<PlatformValue | null>(() => {
    if (!platform || !session) return null;
    const organization = platform.organizations.require(session.organizationId);
    const workspace = platform.organizations.workspaceFor(organization.id);
    const access: AccessContext =
      session.mode === 'PLATFORM_ADMIN'
        ? { ...platform.adminContext(), organizationId: organization.id }
        : platform.accessContextFor(organization.id);
    const entitlements = access.entitlements;

    return {
      platform,
      version,
      session,
      organization,
      workspace,
      access,
      entitlements,
      isMember: organization.commercialState === 'MEMBER' || organization.commercialState === 'VERIFIED_MEMBER',
      isRequester: ['REQUESTER', 'CUSTOMER', 'ENTERPRISE'].includes(organization.commercialState),
      isCustomer: ['CUSTOMER', 'ENTERPRISE'].includes(organization.commercialState),
      switchOrganization: (organizationId: string) => {
        setSession((current) => {
          const next = current ? { ...current, organizationId } : current;
          if (next) rememberSession(next);
          return next;
        });
        refresh();
      },
      setMode: (mode: SessionMode) => {
        setSession((current) => {
          const next = current ? { ...current, mode } : current;
          if (next) rememberSession(next);
          return next;
        });
        refresh();
      },
      run: (action) => {
        const result = action(platform);
        refresh();
        return result;
      },
      runAsync: async (action) => {
        const result = await action(platform);
        refresh();
        return result;
      },
      refresh,
    };
  }, [platform, session, version, refresh]);

  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-navy-950 p-8 text-center text-sm text-red-200">
        <div>
          <p className="mb-2 font-semibold text-white">The demo environment failed to start.</p>
          <p className="font-mono text-xs">{error}</p>
        </div>
      </div>
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
        <p className="mt-1 text-xs text-navy-200">
          Seeding the demo network — organizations, policies, verifications, evidence…
        </p>
      </div>
      <div className="h-1 w-48 overflow-hidden rounded bg-navy-800">
        <div className="h-full w-1/2 animate-pulse rounded bg-brand-500" />
      </div>
    </div>
  );
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
