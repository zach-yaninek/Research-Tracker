import { Suspense } from "react";
import Link from "next/link";
import PaperList from "@/components/PaperList";
import { PaperListSkeleton } from "@/components/Skeleton";
import { authorDetail, researcherPapers } from "@/lib/data";
import { formatNumber } from "@/lib/format";
import type { AuthorDetail, Paper } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ResearcherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Shell renders instantly; header and publications stream in independently so
  // a cold/slow fetch shows skeletons instead of blocking or erroring the page.
  return (
    <div className="space-y-8">
      <Link href="/" className="text-xs text-faint hover:text-accent">
        ← Dashboard
      </Link>

      <Suspense fallback={<HeaderSkeleton />}>
        <ResearcherHeader id={id} />
      </Suspense>

      <section>
        <h2 className="mb-3 font-serif text-sm uppercase tracking-widest text-faint">
          Recent publications
        </h2>
        <Suspense fallback={<PaperListSkeleton rows={6} />}>
          <ResearcherPapers id={id} />
        </Suspense>
      </section>
    </div>
  );
}

async function ResearcherHeader({ id }: { id: string }) {
  let author: AuthorDetail | null = null;
  try {
    author = await authorDetail(id);
  } catch {
    author = null;
  }

  // Degrade gracefully rather than throwing to error.tsx on a rate limit.
  if (!author) {
    return (
      <header className="space-y-3 border-b border-line pb-6">
        <h1 className="font-serif text-3xl">Researcher</h1>
        <p className="text-sm text-faint">
          Profile details couldn&apos;t be loaded — rate limited.{" "}
          <a
            href={`https://www.semanticscholar.org/author/${id}`}
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline"
          >
            Semantic Scholar profile ↗
          </a>
        </p>
      </header>
    );
  }

  const affiliations = (author.affiliations ?? []).join(", ");
  const s2Url = author.url ?? `https://www.semanticscholar.org/author/${id}`;

  return (
    <header className="space-y-3 border-b border-line pb-6">
      <h1 className="font-serif text-3xl">{author.name}</h1>
      {affiliations ? <p className="text-sm text-muted">{affiliations}</p> : null}
      <dl className="flex flex-wrap gap-x-8 gap-y-1 text-sm">
        <Metric label="Publications" value={formatNumber(author.paperCount)} />
        <Metric label="Citations" value={formatNumber(author.citationCount)} />
        <Metric label="h-index" value={formatNumber(author.hIndex)} />
      </dl>
      <div className="flex gap-4 text-xs">
        <a href={s2Url} target="_blank" rel="noreferrer" className="text-accent hover:underline">
          Semantic Scholar profile ↗
        </a>
        {author.homepage ? (
          <a
            href={author.homepage}
            target="_blank"
            rel="noreferrer"
            className="text-accent hover:underline"
          >
            Homepage ↗
          </a>
        ) : null}
      </div>
    </header>
  );
}

async function ResearcherPapers({ id }: { id: string }) {
  let papers: Paper[] | null = null;
  try {
    papers = await researcherPapers(id);
  } catch {
    papers = null;
  }
  if (!papers) return <p className="py-3 text-sm text-faint">Couldn&apos;t load — rate limited.</p>;
  return <PaperList papers={papers.slice(0, 25)} showAbstract empty="No publications found." />;
}

function HeaderSkeleton() {
  return (
    <header className="animate-pulse space-y-3 border-b border-line pb-6" aria-hidden>
      <div className="h-8 w-2/3 rounded bg-line/80" />
      <div className="h-3 w-1/2 rounded bg-line/80" />
      <div className="flex gap-8 pt-1">
        <div className="h-6 w-16 rounded bg-line/80" />
        <div className="h-6 w-16 rounded bg-line/80" />
        <div className="h-6 w-16 rounded bg-line/80" />
      </div>
    </header>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-faint">{label}</dt>
      <dd className="font-serif text-lg">{value}</dd>
    </div>
  );
}
