import { cacheGet, cacheSet } from "./db";

export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Return cached JSON for `key` if it is younger than `ttlMs`; otherwise run
 * `fetcher` (which performs the rate-limited network calls), store, and return.
 *
 * If `fetcher` throws but a stale cached value exists, the stale value is
 * returned so the UI degrades gracefully instead of erroring.
 */
export async function getCached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>
): Promise<T> {
  const row = cacheGet(key);
  const fresh = row && Date.now() - row.fetchedAt < ttlMs;
  if (row && fresh) {
    return JSON.parse(row.payload) as T;
  }

  try {
    const data = await fetcher();
    cacheSet(key, JSON.stringify(data));
    return data;
  } catch (err) {
    if (row) {
      // Serve stale data on failure rather than breaking the page.
      return JSON.parse(row.payload) as T;
    }
    throw err;
  }
}

/** Cache metadata for a key, if present. */
export function cacheAge(key: string): number | null {
  const row = cacheGet(key);
  return row ? Date.now() - row.fetchedAt : null;
}
