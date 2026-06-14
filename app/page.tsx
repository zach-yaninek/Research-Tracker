import Link from "next/link";
import PaperList from "@/components/PaperList";
import RefreshButton from "@/components/RefreshButton";
import { getDashboard } from "@/lib/data";
import { timeAgo } from "@/lib/time";

// Cold loads hit the network (rate-limited); never statically cache this page.
export const dynamic = "force-dynamic";

export default async function Dashboard() {
  const data = await getDashboard();
  const isEmpty = data.researchers.length === 0 && data.subjects.length === 0;
  // Treats missing, empty, and whitespace-only values as "no key".
  const noKey = !process.env.SEMANTIC_SCHOLAR_API_KEY?.trim();

  return (
    <div className="space-y-12">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-serif text-3xl">Latest research</h1>
          <p className="mt-1 text-xs text-faint">Updated {timeAgo(data.generatedAt)}</p>
        </div>
        <RefreshButton />
      </div>

      {noKey ? (
        <p className="rounded border border-line bg-accent-soft px-4 py-3 text-sm text-muted">
          No Semantic Scholar API key set. Add{" "}
          <code className="font-mono text-xs">SEMANTIC_SCHOLAR_API_KEY</code> to{" "}
          <code className="font-mono text-xs">.env.local</code> and restart for reliable results.
        </p>
      ) : data.partial ? (
        <p className="rounded border border-line bg-accent-soft px-4 py-3 text-sm text-muted">
          Some sections couldn&apos;t be loaded — Semantic Scholar rate-limited the
          request. If you just added or changed your API key, restart the dev server.
          Otherwise wait a moment and press <span className="font-medium">Refresh</span>.
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

      {data.researchers.length > 0 ? (
        <section>
          <h2 className="mb-4 border-b border-line pb-2 font-serif text-sm uppercase tracking-widest text-faint">
            Researchers
          </h2>
          <div className="space-y-8">
            {data.researchers.map((r) => (
              <div key={r.author.authorId}>
                <Link
                  href={`/researcher/${r.author.authorId}`}
                  className="font-serif text-lg hover:text-accent transition-colors"
                >
                  {r.author.name}
                </Link>
                {r.error ? (
                  <p className="py-3 text-sm text-faint">Couldn&apos;t load — rate limited.</p>
                ) : (
                  <PaperList papers={r.papers} empty="No recent publications found." />
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {data.subjects.length > 0 ? (
        <section>
          <h2 className="mb-4 border-b border-line pb-2 font-serif text-sm uppercase tracking-widest text-faint">
            Subjects
          </h2>
          <div className="space-y-8">
            {data.subjects.map((s) => (
              <div key={s.subject.id}>
                <Link
                  href={`/subject/${s.subject.id}`}
                  className="font-serif text-lg hover:text-accent transition-colors"
                >
                  {s.subject.label}
                </Link>
                {s.error ? (
                  <p className="py-3 text-sm text-faint">Couldn&apos;t load — rate limited.</p>
                ) : (
                  <PaperList papers={s.papers} empty="No recent publications found." />
                )}
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
