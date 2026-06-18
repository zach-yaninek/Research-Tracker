// Cached service layer: wraps the Semantic Scholar client with the SQLite cache
// so pages, the dashboard, and detail views share fetched data and stay within
// the rate limit. All network access in the app flows through here.

import { getCached, ONE_DAY_MS } from "./cache";
import { cacheDeleteByPrefix, listResearchers, listSubjects } from "./db";
import {
  getAuthorDetail,
  getAuthorPapers,
  getAuthorsBatch,
  getSubjectLatest,
  getSubjectMostCited,
} from "./semanticScholar";
import type {
  AuthorDetail,
  DashboardData,
  Paper,
  Subject,
} from "./types";

const CACHE_PREFIXES = [
  "dash-authors:",
  "author-papers:",
  "author:",
  "subject-latest:",
  "subject-cited:",
];

export function clearDataCache(): void {
  for (const prefix of CACHE_PREFIXES) cacheDeleteByPrefix(prefix);
}

/**
 * Warm the dashboard cache for the whole watchlist. Cold entries are fetched and
 * stored; stale entries are refreshed in the background (via the SWR cache).
 * Used by the startup/interval warm-up and the manual refresh so visitors never
 * pay for the network round-trips. Errors are swallowed by the caller.
 */
export async function warmAll(): Promise<void> {
  await getDashboard();
}

// ---- Researchers ----

export function dashboardAuthors(ids: string[]): Promise<AuthorDetail[]> {
  const key = `dash-authors:${[...ids].sort().join(",")}`;
  return getCached(key, ONE_DAY_MS, () => getAuthorsBatch(ids));
}

export function researcherPapers(authorId: string): Promise<Paper[]> {
  return getCached(`author-papers:${authorId}`, ONE_DAY_MS, () =>
    getAuthorPapers(authorId, 100)
  );
}

export function authorDetail(authorId: string): Promise<AuthorDetail> {
  return getCached(`author:${authorId}`, ONE_DAY_MS, () =>
    getAuthorDetail(authorId)
  );
}

// ---- Subjects ----

export function subjectLatest(subject: Subject, limit = 20): Promise<Paper[]> {
  return getCached(`subject-latest:${subject.id}`, ONE_DAY_MS, () =>
    getSubjectLatest(subject.query, limit)
  );
}

export function subjectMostCited(
  subject: Subject,
  years = 10,
  limit = 20
): Promise<Paper[]> {
  return getCached(`subject-cited:${subject.id}:${years}`, ONE_DAY_MS, () =>
    getSubjectMostCited(subject.query, limit, years)
  );
}

// ---- Dashboard assembly ----

export async function getDashboard(perSection = 3): Promise<DashboardData> {
  const researchers = listResearchers();
  const subjects = listSubjects();
  let partial = false;

  // The author-batch headers are non-essential; fall back to watchlist names.
  let authorById = new Map<string, AuthorDetail>();
  if (researchers.length) {
    try {
      const authors = await dashboardAuthors(researchers.map((r) => r.authorId));
      authorById = new Map(authors.map((a) => [a.authorId, a]));
    } catch {
      partial = true;
    }
  }

  // Fetch sections concurrently; each resolves independently so one rate-limited
  // request can't take down the whole dashboard — render what succeeds, flag
  // what doesn't. (The rate limiter still serializes the underlying network
  // calls; on a warm cache these are instant SQLite reads.)
  const researcherSections = await Promise.all(
    researchers.map(async (r) => {
      const author =
        authorById.get(r.authorId) ?? ({ authorId: r.authorId, name: r.name } as AuthorDetail);
      try {
        const papers = await researcherPapers(r.authorId);
        return { author, papers: papers.slice(0, perSection) };
      } catch {
        partial = true;
        return { author, papers: [], error: true };
      }
    })
  );

  const subjectSections = await Promise.all(
    subjects.map(async (s) => {
      try {
        const papers = await subjectLatest(s, perSection);
        return { subject: s, papers: papers.slice(0, perSection) };
      } catch {
        partial = true;
        return { subject: s, papers: [], error: true };
      }
    })
  );

  return {
    researchers: researcherSections,
    subjects: subjectSections,
    generatedAt: Date.now(),
    partial,
  };
}
