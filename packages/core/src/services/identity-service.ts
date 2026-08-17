import type { User, UserSession, Workspace } from '../domain/types.js';
import type { PlatformRole, WorkspaceRole } from '../domain/enums.js';
import { ConflictError, ValidationError } from '../domain/errors.js';
import { generateToken, hashPassword, hashToken, needsRehash, verifyPassword } from '../security/passwords.js';
import type { PlatformContext } from './context.js';

/** How long a session stays valid without being renewed. */
const SESSION_TTL_HOURS = 12;
/** Consecutive failures before an account is temporarily locked. */
const MAX_FAILED_LOGINS = 8;
const LOCKOUT_MINUTES = 15;

export interface RegistrationInput {
  name: string;
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
  userAgent?: string;
  ipAddress?: string;
}

export interface AuthenticatedSession {
  /** Returned once, at issue. Only its digest is stored. */
  token: string;
  session: UserSession;
  user: User;
  workspace: Workspace;
}

export type LoginFailure =
  | 'INVALID_CREDENTIALS'
  | 'ACCOUNT_SUSPENDED'
  | 'ACCOUNT_LOCKED'
  | 'NO_WORKSPACE';

export class LoginError extends Error {
  constructor(readonly reason: LoginFailure, message: string) {
    super(message);
    this.name = 'LoginError';
  }
}

export function isLoginError(error: unknown): error is LoginError {
  return error instanceof Error && error.name === 'LoginError';
}

/**
 * Users, passwords and sessions.
 *
 * This is the only service whose methods are asynchronous: password hashing is
 * deliberately slow, and pretending otherwise would mean either a blocking
 * domain or a weak hash. Everything it touches still lives in the same store as
 * the rest of the platform, so a session is as durable as the data it protects.
 */
export class IdentityService {
  constructor(private readonly ctx: PlatformContext) {}

  /* ---------------- users ---------------- */

  byEmail(email: string): User | undefined {
    const normalized = normalizeEmail(email);
    return this.ctx.store.users.first((user) => normalizeEmail(user.email) === normalized);
  }

  get(userId: string): User | undefined {
    return this.ctx.store.users.get(userId);
  }

  /**
   * Creates a login identity. Rejects an email already in use — case- and
   * whitespace-insensitively, because a user who signs up twice with different
   * capitalisation has made a mistake, not created a second account.
   */
  async createUser(input: RegistrationInput & { platformRoles?: PlatformRole[] }): Promise<User> {
    const email = normalizeEmail(input.email);
    if (this.byEmail(email)) throw new ConflictError('An account already exists for this email address.', 'User');
    assertPasswordAcceptable(input.password);

    const now = this.ctx.now();
    return this.ctx.store.users.insert({
      id: this.ctx.ids.next('usr'),
      name: input.name.trim(),
      email,
      platformRoles: input.platformRoles ?? [],
      mfaEnabled: false,
      createdAt: now,
      passwordHash: await hashPassword(input.password),
      passwordUpdatedAt: now,
      status: 'ACTIVE',
      failedLoginCount: 0,
    });
  }

  /** Sets or replaces a user's password. Revokes every existing session. */
  async setPassword(userId: string, password: string): Promise<User> {
    assertPasswordAcceptable(password);
    const now = this.ctx.now();
    const user = this.ctx.store.users.update(userId, {
      passwordHash: await hashPassword(password),
      passwordUpdatedAt: now,
      failedLoginCount: 0,
      lockedUntil: undefined,
    });
    this.revokeAllForUser(userId);
    return user;
  }

  addMembership(workspaceId: string, userId: string, roles: WorkspaceRole[]): void {
    const existing = this.ctx.store.memberships.first(
      (membership) => membership.workspaceId === workspaceId && membership.userId === userId,
    );
    if (existing) {
      this.ctx.store.memberships.update(existing.id, { roles });
      return;
    }
    this.ctx.store.memberships.insert({
      id: this.ctx.ids.next('mem'),
      workspaceId,
      userId,
      roles,
      createdAt: this.ctx.now(),
    });
  }

  membershipsFor(userId: string): { workspaceId: string; roles: WorkspaceRole[] }[] {
    return this.ctx.store.memberships
      .find((membership) => membership.userId === userId)
      .map((membership) => ({ workspaceId: membership.workspaceId, roles: membership.roles }));
  }

  /* ---------------- sessions ---------------- */

  async login(input: LoginInput): Promise<AuthenticatedSession> {
    const user = this.byEmail(input.email);

    // The same message and roughly the same work for an unknown address as for
    // a wrong password, so the response does not disclose who has an account.
    if (!user) {
      await verifyPassword(input.password, undefined);
      throw new LoginError('INVALID_CREDENTIALS', 'Email address or password is incorrect.');
    }
    // Lockout is checked before hashing, so a flood of attempts cannot be used
    // to burn CPU. The caller is told nothing specific — see the API's error
    // handler, which only relays reasons that required a correct password.
    if (user.lockedUntil && user.lockedUntil > this.ctx.now()) {
      throw new LoginError('ACCOUNT_LOCKED', 'Too many failed attempts. Try again shortly.');
    }

    if (!(await verifyPassword(input.password, user.passwordHash))) {
      this.recordFailedLogin(user);
      throw new LoginError('INVALID_CREDENTIALS', 'Email address or password is incorrect.');
    }

    // Deliberately after the password check: refusing a suspended account any
    // earlier would tell an unauthenticated caller that the address is real.
    if (user.status === 'SUSPENDED') {
      throw new LoginError('ACCOUNT_SUSPENDED', 'This account has been suspended. Contact your workspace owner.');
    }

    const membership = this.ctx.store.memberships.first((candidate) => candidate.userId === user.id);
    const workspace = membership ? this.ctx.store.workspaces.get(membership.workspaceId) : undefined;
    if (!workspace) {
      throw new LoginError('NO_WORKSPACE', 'This account is not a member of any workspace.');
    }

    // Parameters strengthen over time; a correct password is the one moment we
    // hold the plaintext and can upgrade the stored hash.
    const passwordHash = needsRehash(user.passwordHash) ? await hashPassword(input.password) : user.passwordHash;

    const now = this.ctx.now();
    const updated = this.ctx.store.users.update(user.id, {
      lastLoginAt: now,
      failedLoginCount: 0,
      lockedUntil: undefined,
      passwordHash,
    });

    return this.issue(updated, workspace, input);
  }

  /** Resolves a bearer token to its session, or undefined if it is not usable. */
  async authenticate(token: string): Promise<{ session: UserSession; user: User } | undefined> {
    if (!token) return undefined;
    const tokenHash = await hashToken(token);
    const session = this.ctx.store.sessions.first((candidate) => candidate.tokenHash === tokenHash);
    if (!session || session.revokedAt) return undefined;

    const now = this.ctx.now();
    if (session.expiresAt <= now) return undefined;

    const user = this.ctx.store.users.get(session.userId);
    if (!user || user.status === 'SUSPENDED') return undefined;

    // Cheap freshness signal for the sessions list; not a sliding expiry.
    this.ctx.store.sessions.update(session.id, { lastSeenAt: now });
    return { session, user };
  }

  revoke(sessionId: string): void {
    const session = this.ctx.store.sessions.get(sessionId);
    if (!session || session.revokedAt) return;
    this.ctx.store.sessions.update(sessionId, { revokedAt: this.ctx.now() });
  }

  revokeAllForUser(userId: string): number {
    const now = this.ctx.now();
    const active = this.ctx.store.sessions.find((session) => session.userId === userId && !session.revokedAt);
    for (const session of active) this.ctx.store.sessions.update(session.id, { revokedAt: now });
    return active.length;
  }

  activeSessionsFor(userId: string): UserSession[] {
    const now = this.ctx.now();
    return this.ctx.store.sessions.find(
      (session) => session.userId === userId && !session.revokedAt && session.expiresAt > now,
    );
  }

  /** Drops sessions that expired long enough ago to be of no forensic use. */
  purgeExpiredSessions(olderThanDays = 30): number {
    const cutoff = new Date(Date.parse(this.ctx.now()) - olderThanDays * 86_400_000).toISOString();
    const stale = this.ctx.store.sessions.find((session) => session.expiresAt < cutoff);
    for (const session of stale) this.ctx.store.sessions.remove(session.id);
    return stale.length;
  }

  /* ---------------- internals ---------------- */

  private async issue(user: User, workspace: Workspace, input: LoginInput): Promise<AuthenticatedSession> {
    const token = generateToken('bid_sess');
    const now = this.ctx.now();
    const session = this.ctx.store.sessions.insert({
      id: this.ctx.ids.next('ses'),
      userId: user.id,
      workspaceId: workspace.id,
      organizationId: workspace.organizationId,
      tokenHash: await hashToken(token),
      issuedAt: now,
      expiresAt: new Date(Date.parse(now) + SESSION_TTL_HOURS * 3_600_000).toISOString(),
      lastSeenAt: now,
      userAgent: input.userAgent,
      ipAddress: input.ipAddress,
    });

    this.ctx.audit({
      actorType: 'USER',
      actorId: user.id,
      actorName: user.name,
      action: 'auth.session.issued',
      resourceType: 'UserSession',
      resourceId: session.id,
      summary: `${user.name} signed in`,
      workspaceId: workspace.id,
      organizationId: workspace.organizationId,
    });

    return { token, session, user, workspace };
  }

  private recordFailedLogin(user: User): void {
    const failures = (user.failedLoginCount ?? 0) + 1;
    const lockedUntil =
      failures >= MAX_FAILED_LOGINS
        ? new Date(Date.parse(this.ctx.now()) + LOCKOUT_MINUTES * 60_000).toISOString()
        : user.lockedUntil;
    this.ctx.store.users.update(user.id, { failedLoginCount: failures, lockedUntil });
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Length is the property that actually matters, so this checks length and
 * rejects the handful of strings that are long but still guessed first. It is
 * not a composition rule — those push people towards `Password1!`.
 */
export function assertPasswordAcceptable(password: string): void {
  if (password.length < 12) {
    throw new ValidationError('Password must be at least 12 characters.', 'password');
  }
  if (password.length > 200) {
    throw new ValidationError('Password must be 200 characters or fewer.', 'password');
  }
  const collapsed = password.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (COMMON_PASSWORDS.has(collapsed)) {
    throw new ValidationError('That password is too easily guessed. Choose another.', 'password');
  }
}

const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  'passw0rd123',
  '123456789012',
  'qwertyuiop12',
  'letmein12345',
  'administrator',
  'welcome12345',
  'iloveyou1234',
  'bidtrust1234',
]);
