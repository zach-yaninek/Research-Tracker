import { Suspense } from "react";
import Link from "next/link";
import PaperList from "@/components/PaperList";
import RefreshButton from "@/components/RefreshButton";
import { PaperListSkeleton } from "@/components/Skeleton";
import { cacheAge } from "@/lib/cache";
import { researcherPapers, subjectLatest } from "@/lib/data";
import { listResearchers, listSubjects } from "@/lib/db";
import type { Paper, Researcher, Subject } from "@/lib/types";
import { timeAgo } from "@/lib/time";

// The shell reads only the local watchlist (instant SQLite) and renders right
// away; each section streams in via Suspense. Never statically cache this page.
export const dynamic = "force-dynamic";

const PER_SECTION = 3;

export default function Dashboard() {
  const researchers = listResearchers();
  const subjects = listSubjects();
  const isEmpty = researchers.length === 0 && subjects.length === 0;
  // Treats missing, empty, and whitespace-only values as "no key".
  const noKey = !process.env.SEMANTIC_SCHOLAR_API_KEY?.trim();
  const updatedAt = newestUpdate(researchers, subjects);

  return (
    <div className="space-y-12">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl">Latest research</h1>
          {updatedAt ? (
            <p className="mt-1 text-xs text-faint">Updated {timeAgo(updatedAt)}</p>
          ) : null}
        </div>
        <RefreshButton />
      </div>

      {noKey ? (
        <p className="rounded border border-line bg-accent-soft px-4 py-3 text-sm text-muted">
          No Semantic Scholar API key set. Add{" "}
          <code className="font-mono text-xs">SEMANTIC_SCHOLAR_API_KEY</code> to{" "}
          <code className="font-mono text-xs">.env.local</code> and restart for reliable results.
        </p>
      ) : null}

      {isEmpty ? (
        <div className="rounded border border-line px-6 py-10 text-center">
          <p className="font-serif text-lg">Your watchlist is empty.</p>
          <p className="mt-2 text-sm text-muted">
            Head to{" "}
            <Link href="/manage" className="text-accent underline">
              Manage
            </Link>{" "}
            to add researchers and subject areas.
          </p>
        </div>
      ) : null}

      {researchers.length > 0 ? (
        <section>
          <h2 className="mb-4 border-b border-line pb-2 font-serif text-sm uppercase tracking-widest text-faint">
            Researchers
          </h2>
          <div className="space-y-8">
            {researchers.map((r) => (
              <div key={r.authorId}>
                <Link
                  href={`/researcher/${r.authorId}`}
                  className="font-serif text-lg hover:text-accent transition-colors"
                >
                  {r.name}
                </Link>
                <Suspense fallback={<PaperListSkeleton rows={PER_SECTION} />}>
                  <ResearcherSection authorId={r.authorId} />
                </Suspense>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {subjects.length > 0 ? (
        <section>
          <h2 className="mb-4 border-b border-line pb-2 font-serif text-sm uppercase tracking-widest text-faint">
            Subjects
          </h2>
          <div className="space-y-8">
            {subjects.map((s) => (
              <div key={s.id}>
                <Link
                  href={`/subject/${s.id}`}
                  className="font-serif text-lg hover:text-accent transition-colors"
                >
                  {s.label}
                </Link>
                <Suspense fallback={<PaperListSkeleton rows={PER_SECTION} />}>
                  <SubjectSection subject={s} />
                </Suspense>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}

// Each section fetches its own slice through the SWR cache: a warm/stale cache
// resolves instantly, a cold one streams in behind the skeleton. Errors degrade
// to an inline message instead of taking down the page.
async function ResearcherSection({ authorId }: { authorId: string }) {
  let papers: Paper[] | null = null;
  try {
    papers = await researcherPapers(authorId);
  } catch {
    papers = null;
  }
  if (!papers) return <RateLimited />;
  return <PaperList papers={papers.slice(0, PER_SECTION)} empty="No recent publications found." />;
}

async function SubjectSection({ subject }: { subject: Subject }) {
  let papers: Paper[] | null = null;
  try {
    papers = await subjectLatest(subject, PER_SECTION);
  } catch {
    papers = null;
  }
  if (!papers) return <RateLimited />;
  return <PaperList papers={papers.slice(0, PER_SECTION)} empty="No recent publications found." />;
}

function RateLimited() {
  return <p className="py-3 text-sm text-faint">Couldn&apos;t load — rate limited.</p>;
}

/** Most-recent cache write across watchlist sections, or null if none cached. */
function newestUpdate(researchers: Researcher[], subjects: Subject[]): number | null {
  const ages: number[] = [];
  for (const r of researchers) {
    const age = cacheAge(`author-papers:${r.authorId}`);
    if (age != null) ages.push(age);
  }
  for (const s of subjects) {
    const age = cacheAge(`subject-latest:${s.id}`);
    if (age != null) ages.push(age);
  }
  if (ages.length === 0) return null;
  return Date.now() - Math.min(...ages);
}
