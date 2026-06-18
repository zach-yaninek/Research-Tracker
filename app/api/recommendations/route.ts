import { NextResponse } from "next/server";
import { getRecommendations } from "@/lib/recommendations";

export async function GET() {
  try {
    return NextResponse.json(await getRecommendations());
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "failed to build recommendations" },
      { status: 502 }
    );
  }
}
