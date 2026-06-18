import { NextResponse } from "next/server";
import { addSubject, listSubjects, removeSubject } from "@/lib/db";
import { clearDataCache } from "@/lib/data";

export async function GET() {
  return NextResponse.json(listSubjects());
}

export async function POST(req: Request) {
  const { query, label } = await req.json();
  if (!query || !String(query).trim()) {
    return NextResponse.json({ error: "query required" }, { status: 400 });
  }
  const subject = addSubject(String(query), label ? String(label) : undefined);
  clearDataCache();
  return NextResponse.json(subject, { status: 201 });
}

export async function DELETE(req: Request) {
  const id = new URL(req.url).searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  removeSubject(id);
  clearDataCache();
  return NextResponse.json({ ok: true });
}
