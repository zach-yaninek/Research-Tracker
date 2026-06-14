import type { Paper } from "@/lib/types";
import { authorLine, formatDate, formatNumber, paperHref } from "@/lib/format";

function PaperItem({ paper, showAbstract = false }: { paper: Paper; showAbstract?: boolean }) {
  const href = paperHref(paper);
  return (
    <li className="border-b border-line py-4 last:border-b-0">
      <h3 className="font-serif text-base leading-snug">
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noreferrer"
            className="hover:text-accent transition-colors"
          >
            {paper.title}
          </a>
        ) : (
          paper.title
        )}
      </h3>
      <p className="mt-1 text-sm text-muted">{authorLine(paper)}</p>
      <p className="mt-1 text-xs text-faint">
        {paper.venue ? <span className="italic">{paper.venue}</span> : null}
        {paper.venue ? " · " : ""}
        {formatDate(paper)}
        {paper.citationCount != null ? ` · ${formatNumber(paper.citationCount)} citations` : ""}
      </p>
      {showAbstract && paper.abstract ? (
        <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-4">
          {paper.abstract}
        </p>
      ) : null}
    </li>
  );
}

export default function PaperList({
  papers,
  showAbstract = false,
  empty = "No publications found.",
}: {
  papers: Paper[];
  showAbstract?: boolean;
  empty?: string;
}) {
  if (papers.length === 0) {
    return <p className="py-3 text-sm text-faint">{empty}</p>;
  }
  return (
    <ul>
      {papers.map((p) => (
        <PaperItem key={p.paperId} paper={p} showAbstract={showAbstract} />
      ))}
    </ul>
  );
}
