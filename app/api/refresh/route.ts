import { NextResponse } from "next/server";
import { clearDataCache, getDashboard } from "@/lib/data";

// POST /api/refresh — drop cached data and re-warm the dashboard.
export async function POST() {
  try {
    clearDataCache();
    const data = await getDashboard();
    return NextResponse.json({ ok: true, generatedAt: data.generatedAt });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "refresh failed" },
      { status: 502 }
    );
  }
}
