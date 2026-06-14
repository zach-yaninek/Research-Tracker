import Link from "next/link";
import { notFound } from "next/navigation";
import PaperList from "@/components/PaperList";
import { getSubject } from "@/lib/db";
import { subjectLatest, subjectMostCited } from "@/lib/data";

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

  const [latest, cited] = await Promise.all([
    subjectLatest(subject, 20),
    subjectMostCited(subject, years, 20),
  ]);

  const thisYear = new Date().getFullYear();

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
          <PaperList papers={latest} empty="No recent papers found." />
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
          <PaperList papers={cited} empty="No papers found." />
        </section>
      </div>
    </div>
  );
}
