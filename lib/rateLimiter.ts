// Serializes all Semantic Scholar requests to honor the 1 request/second limit.
// A single module-level promise chain guarantees calls run one at a time with a
// minimum gap between them; 429 responses are retried with exponential backoff.

const MIN_INTERVAL_MS = 1100; // a little over 1s for safety margin

let chain: Promise<unknown> = Promise.resolve();
let lastRun = 0;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Run `fn` on the shared rate-limited queue. */
export function schedule<T>(fn: () => Promise<T>): Promise<T> {
  const run = async (): Promise<T> => {
    const wait = MIN_INTERVAL_MS - (Date.now() - lastRun);
    if (wait > 0) await sleep(wait);
    try {
      return await fn();
    } finally {
      lastRun = Date.now();
    }
  };
  // Append to the chain regardless of prior success/failure.
  const result = chain.then(run, run);
  // Keep the chain alive even if this task rejects.
  chain = result.then(
    () => undefined,
    () => undefined
  );
  return result;
}

export interface S2FetchOptions {
  method?: string;
  body?: unknown;
  // Query string already appended to the URL by the caller.
}

/**
 * Rate-limited fetch against the Semantic Scholar API with 429 backoff.
 * Returns parsed JSON of type T.
 */
export async function s2Fetch<T>(url: string, opts: S2FetchOptions = {}): Promise<T> {
  const apiKey = process.env.SEMANTIC_SCHOLAR_API_KEY;
  const headers: Record<string, string> = { Accept: "application/json" };
  if (apiKey) headers["x-api-key"] = apiKey;
  if (opts.body !== undefined) headers["Content-Type"] = "application/json";

  const maxAttempts = 5;
  let attempt = 0;

  while (true) {
    attempt++;
    const res = await schedule(() =>
      fetch(url, {
        method: opts.method ?? "GET",
        headers,
        body: opts.body !== undefined ? JSON.stringify(opts.body) : undefined,
        cache: "no-store",
      })
    );

    if (res.status === 429 && attempt < maxAttempts) {
      // Prefer the server's Retry-After hint; otherwise exponential backoff
      // (1s, 2s, 4s, 8s) capped at 8s.
      const retryAfter = Number(res.headers.get("retry-after"));
      const backoff =
        Number.isFinite(retryAfter) && retryAfter > 0
          ? retryAfter * 1000
          : Math.min(1000 * 2 ** (attempt - 1), 8000);
      await sleep(backoff);
      continue;
    }

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      throw new Error(
        `Semantic Scholar ${res.status} for ${url}: ${text.slice(0, 200)}`
      );
    }

    return (await res.json()) as T;
  }
}
