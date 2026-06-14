import { s2Fetch } from "./rateLimiter";
import type { AuthorDetail, Paper } from "./types";

const GRAPH = "https://api.semanticscholar.org/graph/v1";

const AUTHOR_FIELDS = [
  "name",
  "affiliations",
  "homepage",
  "paperCount",
  "citationCount",
  "hIndex",
  "url",
].join(",");

const PAPER_FIELDS = [
  "paperId",
  "title",
  "abstract",
  "year",
  "publicationDate",
  "citationCount",
  "venue",
  "url",
  "externalIds",
  "authors",
  "fieldsOfStudy",
  "s2FieldsOfStudy",
].join(",");

function buildUrl(base: string, params: Record<string, string | number | undefined>): string {
  const url = new URL(base);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") url.searchParams.set(k, String(v));
  }
  return url.toString();
}

interface SearchResponse<T> {
  total?: number;
  offset?: number;
  next?: number;
  data?: T[];
}

interface BulkResponse<T> {
  total?: number;
  token?: string | null;
  data?: T[];
}

// ---- Authors ----

export async function searchAuthors(query: string, limit = 10): Promise<AuthorDetail[]> {
  const url = buildUrl(`${GRAPH}/author/search`, {
    query,
    fields: AUTHOR_FIELDS,
    limit,
  });
  const res = await s2Fetch<SearchResponse<AuthorDetail>>(url);
  return res.data ?? [];
}

export async function getAuthorsBatch(authorIds: string[]): Promise<AuthorDetail[]> {
  if (authorIds.length === 0) return [];
  const url = buildUrl(`${GRAPH}/author/batch`, { fields: AUTHOR_FIELDS });
  const res = await s2Fetch<(AuthorDetail | null)[]>(url, {
    method: "POST",
    body: { ids: authorIds },
  });
  // Batch returns null for unresolved ids; drop them.
  return res.filter((a): a is AuthorDetail => a != null);
}

export async function getAuthorDetail(authorId: string): Promise<AuthorDetail> {
  const url = buildUrl(`${GRAPH}/author/${authorId}`, { fields: AUTHOR_FIELDS });
  return s2Fetch<AuthorDetail>(url);
}

/** Author papers, sorted newest-first client-side. */
export async function getAuthorPapers(authorId: string, limit = 100): Promise<Paper[]> {
  const url = buildUrl(`${GRAPH}/author/${authorId}/papers`, {
    fields: PAPER_FIELDS,
    limit,
  });
  const res = await s2Fetch<SearchResponse<Paper>>(url);
  return sortByDateDesc(res.data ?? []);
}

// ---- Papers / subjects ----

export async function searchPapers(query: string, limit = 10): Promise<Paper[]> {
  const url = buildUrl(`${GRAPH}/paper/search`, {
    query,
    fields: PAPER_FIELDS,
    limit,
  });
  const res = await s2Fetch<SearchResponse<Paper>>(url);
  return res.data ?? [];
}

/**
 * Bulk paper search supporting sort + year-range filtering.
 * sort: "publicationDate:desc" (latest) or "citationCount:desc" (most cited).
 * Returns at most `limit` papers (sliced from the bulk page).
 */
export async function bulkSearchPapers(
  query: string,
  opts: { sort?: string; year?: string; limit?: number } = {}
): Promise<Paper[]> {
  const url = buildUrl(`${GRAPH}/paper/search/bulk`, {
    query,
    fields: PAPER_FIELDS,
    sort: opts.sort,
    year: opts.year,
  });
  const res = await s2Fetch<BulkResponse<Paper>>(url);
  const data = res.data ?? [];
  return data.slice(0, opts.limit ?? 10);
}

/**
 * Quote a multi-word subject as a phrase so bulk search matches the topic
 * rather than loose individual tokens. Single words / already-quoted queries
 * are left as-is.
 */
function asPhrase(query: string): string {
  const q = query.trim();
  if (q.includes('"') || !q.includes(" ")) return q;
  return `"${q}"`;
}

/**
 * Keep papers whose title or abstract actually contains every query word.
 * S2's date-sorted bulk search loosely token-matches, so this trims clearly
 * off-topic results while preserving recency ordering.
 */
function filterRelevant(papers: Paper[], query: string): Paper[] {
  const words = query
    .toLowerCase()
    .replace(/"/g, "")
    .split(/\s+/)
    .filter(Boolean);
  if (words.length === 0) return papers;
  return papers.filter((p) => {
    const hay = `${p.title ?? ""} ${p.abstract ?? ""}`.toLowerCase();
    return words.every((w) => hay.includes(w));
  });
}

/** Latest publications for a subject query. */
export async function getSubjectLatest(query: string, limit = 10): Promise<Paper[]> {
  const papers = await bulkSearchPapers(asPhrase(query), {
    sort: "publicationDate:desc",
    limit: 100,
  });
  return filterRelevant(papers, query).slice(0, limit);
}

/** Most-cited papers for a subject query over the last `years` years. */
export async function getSubjectMostCited(
  query: string,
  limit = 10,
  years = 10
): Promise<Paper[]> {
  const now = new Date().getFullYear();
  const papers = await bulkSearchPapers(asPhrase(query), {
    sort: "citationCount:desc",
    year: `${now - years}-${now}`,
    limit: 100,
  });
  return filterRelevant(papers, query).slice(0, limit);
}

// ---- helpers ----

function paperTime(p: Paper): number {
  if (p.publicationDate) {
    const t = Date.parse(p.publicationDate);
    if (!Number.isNaN(t)) return t;
  }
  if (p.year) return Date.parse(`${p.year}-01-01`);
  return 0;
}

export function sortByDateDesc(papers: Paper[]): Paper[] {
  return [...papers].sort((a, b) => paperTime(b) - paperTime(a));
}
