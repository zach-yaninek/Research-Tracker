import { NextResponse } from "next/server";
import { addResearcher, listResearchers, removeResearcher } from "@/lib/db";
import { clearDataCache } from "@/lib/data";

export async function GET() {
  return NextResponse.json(listResearchers());
}

export async function POST(req: Request) {
  const { authorId, name } = await req.json();
  if (!authorId || !name) {
    return NextResponse.json({ error: "authorId and name required" }, { status: 400 });
  }
  const researcher = addResearcher(String(authorId), String(name));
  clearDataCache();
  return NextResponse.json(researcher, { status: 201 });
}

export async function DELETE(req: Request) {
  const authorId = new URL(req.url).searchParams.get("authorId");
  if (!authorId) {
    return NextResponse.json({ error: "authorId required" }, { status: 400 });
  }
  removeResearcher(authorId);
  clearDataCache();
  return NextResponse.json({ ok: true });
}
