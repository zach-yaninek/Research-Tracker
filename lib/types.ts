// Shared types for the app + Semantic Scholar responses (subset of fields used).

export interface PaperAuthor {
  authorId: string | null;
  name: string;
}

export interface Paper {
  paperId: string;
  title: string;
  abstract?: string | null;
  year?: number | null;
  publicationDate?: string | null; // ISO date, may be null
  citationCount?: number | null;
  venue?: string | null;
  url?: string | null; // Semantic Scholar page
  externalIds?: { DOI?: string; ArXiv?: string } | null;
  authors?: PaperAuthor[];
  fieldsOfStudy?: string[] | null;
  s2FieldsOfStudy?: { category: string; source: string }[] | null;
}

export interface AuthorDetail {
  authorId: string;
  name: string;
  affiliations?: string[] | null;
  homepage?: string | null;
  paperCount?: number | null;
  citationCount?: number | null;
  hIndex?: number | null;
  url?: string | null;
}

// Watchlist records (persisted in SQLite).
export interface Researcher {
  authorId: string;
  name: string;
  addedAt: number;
}

export interface Subject {
  id: string; // slug of the query
  query: string;
  label: string;
  addedAt: number;
}

// Dashboard payload. `error` marks a section whose data couldn't be fetched
// (e.g. rate-limited) so the page can degrade gracefully instead of crashing.
export interface DashboardResearcher {
  author: AuthorDetail;
  papers: Paper[];
  error?: boolean;
}

export interface DashboardSubject {
  subject: Subject;
  papers: Paper[];
  error?: boolean;
}

export interface DashboardData {
  researchers: DashboardResearcher[];
  subjects: DashboardSubject[];
  generatedAt: number;
  partial: boolean; // true if any section failed to load
}

// Recommendation suggestions.
export interface ResearcherSuggestion {
  authorId: string;
  name: string;
  count: number; // co-occurrence weight
}

export interface SubjectSuggestion {
  field: string;
  count: number;
}
