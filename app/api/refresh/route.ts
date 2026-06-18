import { after } from "next/server";
import { NextResponse } from "next/server";
import { clearDataCache, warmAll } from "@/lib/data";

// POST /api/refresh — drop cached data and re-warm in the background.
// Returns immediately (re-warming happens after the response via `after`) so the
// Refresh button never hangs on the rate-limited network. The page then streams
// the fresh sections in as they're re-fetched.
export async function POST() {
  try {
    clearDataCache();
    after(async () => {
      try {
        await warmAll();
      } catch {
        // Swallow — the next page visit will re-fetch on demand anyway.
      }
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "refresh failed" },
      { status: 502 }
    );
  }
}
