import type { Paper } from "./types";

/** Best external link for a paper: DOI > arXiv > Semantic Scholar page. */
export function paperHref(p: Paper): string | undefined {
  const doi = p.externalIds?.DOI;
  if (doi) return `https://doi.org/${doi}`;
  const arxiv = p.externalIds?.ArXiv;
  if (arxiv) return `https://arxiv.org/abs/${arxiv}`;
  return p.url ?? undefined;
}

/** "A. Smith, B. Jones, +3 more" */
export function authorLine(p: Paper, max = 4): string {
  const names = (p.authors ?? []).map((a) => a.name).filter(Boolean);
  if (names.length === 0) return "";
  if (names.length <= max) return names.join(", ");
  return `${names.slice(0, max).join(", ")}, +${names.length - max} more`;
}

/** "14 Mar 2025" or just the year if no full date. */
export function formatDate(p: Paper): string {
  if (p.publicationDate) {
    const d = new Date(p.publicationDate);
    if (!Number.isNaN(d.getTime())) {
      return d.toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
    }
  }
  return p.year ? String(p.year) : "—";
}

export function formatNumber(n: number | null | undefined): string {
  if (n == null) return "—";
  return n.toLocaleString("en-US");
}
