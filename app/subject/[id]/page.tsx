import { Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import PaperList from "@/components/PaperList";
import { PaperListSkeleton } from "@/components/Skeleton";
import { getSubject } from "@/lib/db";
import { subjectLatest, subjectMostCited } from "@/lib/data";
import type { Paper, Subject } from "@/lib/types";

export const dynamic = "force-dynamic";

const YEAR_OPTIONS = [10, 5, 2, 1] as const;

export default async function SubjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ years?: string }>;
}) {
  const { id } = await params;
  const { years: yearsParam } = await searchParams;
  const subject = getSubject(id);
  if (!subject) notFound();

  const years = YEAR_OPTIONS.includes(Number(yearsParam) as (typeof YEAR_OPTIONS)[number])
    ? Number(yearsParam)
    : 10;

  const thisYear = new Date().getFullYear();

  // Header comes from local SQLite (instant); the two paper lists stream in.
  return (
    <div className="space-y-8">
      <Link href="/" className="text-xs text-faint hover:text-accent">
        ← Dashboard
      </Link>

      <header className="border-b border-line pb-6">
        <p className="text-xs uppercase tracking-widest text-faint">Subject area</p>
        <h1 className="mt-1 font-serif text-3xl">{subject.label}</h1>
      </header>

      <div className="grid gap-10 md:grid-cols-2">
        <section>
          <h2 className="mb-3 font-serif text-sm uppercase tracking-widest text-faint">
            Recent research
          </h2>
          <Suspense fallback={<PaperListSkeleton rows={5} />}>
            <LatestPapers subject={subject} />
          </Suspense>
        </section>

        <section>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="font-serif text-sm uppercase tracking-widest text-faint">
              Most cited · {thisYear - years}–{thisYear}
            </h2>
            <div className="flex gap-2 text-xs">
              {YEAR_OPTIONS.map((y) => (
                <Link
                  key={y}
                  href={`/subject/${subject.id}?years=${y}`}
                  scroll={false}
                  className={
                    y === years
                      ? "text-accent underline underline-offset-4"
                      : "text-faint hover:text-accent"
                  }
                >
                  {y}y
                </Link>
              ))}
            </div>
          </div>
          {/* Key by `years` so changing the range shows a fresh skeleton. */}
          <Suspense key={years} fallback={<PaperListSkeleton rows={5} />}>
            <CitedPapers subject={subject} years={years} />
          </Suspense>
        </section>
      </div>
    </div>
  );
}

async function LatestPapers({ subject }: { subject: Subject }) {
  let latest: Paper[] | null = null;
  try {
    latest = await subjectLatest(subject, 20);
  } catch {
    latest = null;
  }
  if (!latest) return <RateLimited />;
  return <PaperList papers={latest} empty="No recent papers found." />;
}

async function CitedPapers({ subject, years }: { subject: Subject; years: number }) {
  let cited: Paper[] | null = null;
  try {
    cited = await subjectMostCited(subject, years, 20);
  } catch {
    cited = null;
  }
  if (!cited) return <RateLimited />;
  return <PaperList papers={cited} empty="No papers found." />;
}

function RateLimited() {
  return <p className="py-3 text-sm text-faint">Couldn&apos;t load — rate limited.</p>;
}
