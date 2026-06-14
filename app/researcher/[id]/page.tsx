import Link from "next/link";
import PaperList from "@/components/PaperList";
import { authorDetail, researcherPapers } from "@/lib/data";
import { formatNumber } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ResearcherPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [author, papers] = await Promise.all([
    authorDetail(id),
    researcherPapers(id),
  ]);

  const affiliations = (author.affiliations ?? []).join(", ");
  const s2Url = author.url ?? `https://www.semanticscholar.org/author/${id}`;

  return (
    <div className="space-y-8">
      <Link href="/" className="text-xs text-faint hover:text-accent">
        ← Dashboard
      </Link>

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

      <section>
        <h2 className="mb-3 font-serif text-sm uppercase tracking-widest text-faint">
          Recent publications
        </h2>
        <PaperList papers={papers.slice(0, 25)} showAbstract empty="No publications found." />
      </section>
    </div>
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
