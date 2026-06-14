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

  // Fetch each section independently so one rate-limited request can't take
  // down the whole dashboard — render what succeeds, flag what doesn't.
  const researcherSections = [];
  for (const r of researchers) {
    const author =
      authorById.get(r.authorId) ?? ({ authorId: r.authorId, name: r.name } as AuthorDetail);
    try {
      const papers = await researcherPapers(r.authorId);
      researcherSections.push({ author, papers: papers.slice(0, perSection) });
    } catch {
      partial = true;
      researcherSections.push({ author, papers: [], error: true });
    }
  }

  const subjectSections = [];
  for (const s of subjects) {
    try {
      const papers = await subjectLatest(s, perSection);
      subjectSections.push({ subject: s, papers: papers.slice(0, perSection) });
    } catch {
      partial = true;
      subjectSections.push({ subject: s, papers: [], error: true });
    }
  }

  return {
    researchers: researcherSections,
    subjects: subjectSections,
    generatedAt: Date.now(),
    partial,
  };
}
