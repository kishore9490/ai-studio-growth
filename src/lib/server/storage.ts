import "server-only";
import path from "node:path";

// Private storage for paid digital assets. Files live outside /public and are
// only ever streamed through /api/files after a signed, expiring token and an
// entitlement check. In production, swap this for a private object store
// (S3/R2/GCS) and serve short-lived pre-signed URLs instead.

export function storageRoot() {
  // Runtime-configured location; excluded from build-time file tracing so the
  // private files are never bundled into the server output.
  return path.resolve(/*turbopackIgnore: true*/ process.env.PRIVATE_STORAGE_DIR ?? "./storage/private");
}

/** Resolve a storage key safely, refusing any path that escapes the root. */
export function resolveStoragePath(storageKey: string) {
  const root = storageRoot();
  const full = path.resolve(root, storageKey);
  if (!full.startsWith(root + path.sep)) throw new Error("Invalid storage key");
  return full;
}
