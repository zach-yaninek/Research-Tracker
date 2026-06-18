import { cacheGet, cacheSet } from "./db";

export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// Tracks in-flight fetches per key so concurrent requests and the background
// warm-up never stampede the same upstream call — everyone awaits the same
// promise, and a background revalidation already running is reused.
const inflight = new Map<string, Promise<unknown>>();

/**
 * Run `fetcher` for `key` at most once at a time, persisting the result.
 * Subsequent callers with the same key in-flight share the same promise.
 */
function revalidate<T>(key: string, fetcher: () => Promise<T>): Promise<T> {
  const existing = inflight.get(key);
  if (existing) return existing as Promise<T>;

  const run = (async () => {
    try {
      const data = await fetcher();
      cacheSet(key, JSON.stringify(data));
      return data;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, run);
  return run;
}

/**
 * Stale-while-revalidate read for `key`.
 *
 *  - Fresh  (row within `ttlMs`): return it, no network.
 *  - Stale  (row past `ttlMs`):   return the stale value immediately and kick a
 *    non-blocking background revalidation so the request never waits.
 *  - Cold   (no row):             await the fetcher (only the first-ever load
 *    blocks). On failure with no row to fall back on, the error propagates.
 *
 * All network access funnels through `revalidate`, which dedupes concurrent
 * fetches for the same key.
 */
export async function getCached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const row = cacheGet(key);

  if (row) {
    const fresh = Date.now() - row.fetchedAt < ttlMs;
    if (!fresh) {
      // Detached: refresh in the background, swallow errors (we already have a
      // value to serve). Don't await — the caller gets stale data instantly.
      void revalidate(key, fetcher).catch(() => {});
    }
    return JSON.parse(row.payload) as T;
  }

  // Cold: nothing cached yet, so we must wait. Serve stale on a later failure;
  // here there's nothing to fall back on, so let the error propagate.
  return revalidate(key, fetcher);
}

/** Cache metadata for a key, if present. */
export function cacheAge(key: string): number | null {
  const row = cacheGet(key);
  return row ? Date.now() - row.fetchedAt : null;
}
