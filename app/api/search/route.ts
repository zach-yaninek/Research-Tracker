import { NextResponse } from "next/server";
import { searchAuthors, searchPapers } from "@/lib/semanticScholar";

// GET /api/search?type=author|paper&q=...
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const q = params.get("q")?.trim();
  const type = params.get("type") ?? "author";
  if (!q) return NextResponse.json({ error: "q required" }, { status: 400 });

  try {
    if (type === "paper") {
      return NextResponse.json({ papers: await searchPapers(q, 10) });
    }
    return NextResponse.json({ authors: await searchAuthors(q, 10) });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "search failed" },
      { status: 502 }
    );
  }
}
