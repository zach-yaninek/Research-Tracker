import { NextResponse } from "next/server";
import { getDashboard } from "@/lib/data";

export async function GET() {
  try {
    return NextResponse.json(await getDashboard());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed to load dashboard" },
      { status: 502 }
    );
  }
}
