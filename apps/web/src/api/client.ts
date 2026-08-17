/**
 * HTTP client for the BID Trust API.
 *
 * The application can run in two ways. Connected to the API it is a real
 * multi-user product: you sign in, and what you see and change lives in
 * PostgreSQL. With no API configured it runs the same domain engine in the
 * browser against an in-memory demo network — which is what makes the
 * single-file build possible. This module is the boundary between the two.
 */

export interface ApiErrorBody {
  code: string;
  message: string;
  reason?: string;
  field?: string;
  details?: unknown;
  blockedBy?: 'CONSENT' | 'DOCUMENTS';
  outstanding?: string[];
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: ApiErrorBody,
  ) {
    super(body.message);
    this.name = 'ApiError';
  }

  /** The verification is waiting on the subject — a workflow state, not a fault. */
  get isBlocked(): boolean {
    return this.body.code === 'VERIFICATION_BLOCKED';
  }
}

/** Thrown when the API cannot be reached at all, as opposed to refusing. */
export class ApiUnreachableError extends Error {
  readonly reason: unknown;

  constructor(reason: unknown) {
    super('The BID Trust API could not be reached.');
    this.name = 'ApiUnreachableError';
    this.reason = reason;
  }
}

const TOKEN_KEY = 'bid.session.token';

/**
 * Where the API lives.
 *
 * `VITE_API_URL` names it explicitly. Failing that, a build served from the
 * same origin as the API uses relative URLs. An empty string means "no API" —
 * the demo build — and the app never attempts a request.
 */
export const API_BASE_URL: string = (import.meta.env.VITE_API_URL as string | undefined) ?? '';

export const apiConfigured = (): boolean => API_BASE_URL.length > 0;

export function readToken(): string | null {
  try {
    return window.localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function writeToken(token: string | null): void {
  try {
    if (token) window.localStorage.setItem(TOKEN_KEY, token);
    else window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Storage can be unavailable in private or embedded contexts. The session
    // then lasts only as long as the page, which is degraded but not broken.
  }
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Send no credential — used by sign-in and sign-up themselves. */
  anonymous?: boolean;
  signal?: AbortSignal;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, anonymous = false, signal } = options;

  const headers: Record<string, string> = {};
  if (body !== undefined) headers['content-type'] = 'application/json';
  if (!anonymous) {
    const token = readToken();
    if (token) headers.authorization = `Bearer ${token}`;
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal,
    });
  } catch (error) {
    // A network failure is not an API refusal, and the UI reacts to them
    // differently: one offers a retry, the other explains a rule.
    throw new ApiUnreachableError(error);
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();
  const parsed = text.length > 0 ? safeJson(text) : undefined;

  if (!response.ok) {
    const errorBody = (parsed as { error?: ApiErrorBody } | undefined)?.error;
    throw new ApiError(
      response.status,
      errorBody ?? { code: 'UNEXPECTED', message: `Request failed with status ${response.status}.` },
    );
  }

  return parsed as T;
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}

/* ---------------- authentication ---------------- */

export interface SessionResponse {
  token: string;
  expiresAt: string;
  user: { id: string; name: string; email: string; platformRoles: string[] };
  workspace: { id: string; name: string; requesterEnabled: boolean };
  organization: { bidId: string };
}

export interface RegistrationRequest {
  legalName: string;
  displayName?: string;
  industry?: string;
  country?: string;
  city?: string;
  website?: string;
  name: string;
  email: string;
  password: string;
}

export async function login(email: string, password: string): Promise<SessionResponse> {
  const { data } = await apiRequest<{ data: SessionResponse }>('/v1/auth/login', {
    method: 'POST',
    body: { email, password },
    anonymous: true,
  });
  writeToken(data.token);
  return data;
}

export async function register(input: RegistrationRequest): Promise<SessionResponse> {
  const { data } = await apiRequest<{ data: SessionResponse }>('/v1/auth/register', {
    method: 'POST',
    body: input,
    anonymous: true,
  });
  writeToken(data.token);
  return data;
}

export async function logout(): Promise<void> {
  try {
    await apiRequest('/v1/auth/logout', { method: 'POST' });
  } finally {
    // Whatever the server said, this browser is done with the token. Keeping it
    // after the user pressed sign out would be the worse failure.
    writeToken(null);
  }
}

/* ---------------- snapshot ---------------- */

export interface SnapshotSession {
  organizationId: string;
  workspaceId: string;
  userId: string;
  roles: string[];
  platformRoles: string[];
}

export interface Snapshot {
  session: SnapshotSession;
  collections: Record<string, { id: string }[]>;
}

export async function fetchSnapshot(signal?: AbortSignal): Promise<Snapshot> {
  const { data } = await apiRequest<{ data: Snapshot }>('/v1/workspace/snapshot', { signal });
  return data;
}
