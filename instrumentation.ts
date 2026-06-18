// Runs once when a Next.js server instance starts. We use it to keep the local
// SQLite snapshot warm: fetch the watchlist on boot, then refresh on an interval
// so stale data is replaced in the background and no visitor ever waits on the
// Semantic Scholar API. See node_modules/next/dist/docs/.../instrumentation.md.

const WARM_INTERVAL_MS = 6 * 60 * 60 * 1000; // every 6 hours

export async function register() {
  // better-sqlite3 (via lib/data) is Node-only; never load it in the Edge
  // runtime. The dynamic import keeps it out of non-Node bundles entirely.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  // Guard against double-registration (e.g. dev hot-reload re-invoking register).
  const g = globalThis as typeof globalThis & { __trackerWarmStarted?: boolean };
  if (g.__trackerWarmStarted) return;
  g.__trackerWarmStarted = true;

  const { warmAll } = await import("@/lib/data");
  const warm = () => {
    warmAll().catch(() => {
      // A failed warm-up must never crash the server; visitors still get the
      // last cached snapshot.
    });
  };

  warm(); // on boot
  const timer = setInterval(warm, WARM_INTERVAL_MS);
  // Don't keep the process alive just for the warm timer.
  timer.unref?.();
}
