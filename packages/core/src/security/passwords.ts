/**
 * Password hashing.
 *
 * PBKDF2-HMAC-SHA256 over Web Crypto, which exists unchanged in Node 20+ and in
 * browsers — so the domain keeps one implementation rather than a port with a
 * different algorithm on each side. A deployment with an Argon2id or scrypt
 * binary available should prefer it; the stored format carries its parameters,
 * so hashes can be upgraded in place on next login.
 *
 * Stored form: `pbkdf2$sha256$<iterations>$<saltB64>$<hashB64>`.
 */

const ALGORITHM = 'pbkdf2';
const DIGEST = 'sha256';
/** OWASP's 2023 floor for PBKDF2-HMAC-SHA256. */
const ITERATIONS = 210_000;
const KEY_BITS = 256;
const SALT_BYTES = 16;

const encoder = new TextEncoder();

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function derive(password: string, salt: Uint8Array, iterations: number): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: salt as unknown as ArrayBuffer, iterations, hash: 'SHA-256' },
    key,
    KEY_BITS,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derive(password, salt, ITERATIONS);
  return [ALGORITHM, DIGEST, ITERATIONS, toBase64(salt), toBase64(hash)].join('$');
}

/**
 * Verifies a password against a stored hash.
 *
 * Returns false for anything malformed rather than throwing: a corrupted or
 * unrecognised hash is a failed login, not a server error, and must not be
 * distinguishable from a wrong password.
 */
export async function verifyPassword(password: string, stored: string | undefined): Promise<boolean> {
  if (!stored) return false;
  const parts = stored.split('$');
  if (parts.length !== 5) return false;
  const [algorithm, digest, iterationsRaw, saltB64, hashB64] = parts;
  if (algorithm !== ALGORITHM || digest !== DIGEST) return false;

  const iterations = Number(iterationsRaw);
  if (!Number.isInteger(iterations) || iterations < 1000) return false;

  try {
    const expected = fromBase64(hashB64);
    const actual = await derive(password, fromBase64(saltB64), iterations);
    return timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

/** True when a stored hash was produced with weaker parameters than we now use. */
export function needsRehash(stored: string | undefined): boolean {
  if (!stored) return true;
  const parts = stored.split('$');
  if (parts.length !== 5) return true;
  return parts[0] !== ALGORITHM || parts[1] !== DIGEST || Number(parts[2]) < ITERATIONS;
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let difference = 0;
  for (let i = 0; i < a.length; i += 1) difference |= a[i] ^ b[i];
  return difference === 0;
}

/** A high-entropy opaque token. Only its hash is ever stored. */
export function generateToken(prefix: string): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  const body = toBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${prefix}_${body}`;
}

/**
 * Digest used to store a bearer token.
 *
 * Unlike a password this is already high-entropy, so a single SHA-256 is
 * enough — the cost of PBKDF2 would buy nothing and would be paid on every
 * authenticated request.
 */
export async function hashToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token));
  return toBase64(new Uint8Array(digest));
}
