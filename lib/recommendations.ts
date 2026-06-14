// Heuristic recommendations. No official author/subject recommendation endpoint
// exists, so we derive suggestions from data we already cache:
//   - related researchers = frequent co-authors of watched researchers
//   - related subjects   = frequent fields-of-study across watched papers
// Reuses the cached author-papers / subject-latest data, so it usually adds no
// network calls once the dashboard is warm.

import { listResearchers, listSubjects } from "./db";
import { researcherPapers, subjectLatest } from "./data";
import type { Paper, ResearcherSuggestion, SubjectSuggestion } from "./types";

function fieldsOf(p: Paper): string[] {
  const set = new Set<string>();
  for (const f of p.fieldsOfStudy ?? []) if (f) set.add(f);
  for (const f of p.s2FieldsOfStudy ?? []) if (f?.category) set.add(f.category);
  return [...set];
}

export async function getRecommendations(): Promise<{
  researchers: ResearcherSuggestion[];
  subjects: SubjectSuggestion[];
}> {
  const researchers = listResearchers();
  const subjects = listSubjects();
  const watchedAuthorIds = new Set(researchers.map((r) => r.authorId));
  const watchedFields = new Set(
    subjects.map((s) => s.label.toLowerCase().trim())
  );

  const coauthors = new Map<string, { name: string; count: number }>();
  const fields = new Map<string, number>();

  for (const r of researchers) {
    const papers = await researcherPapers(r.authorId);
    for (const p of papers.slice(0, 50)) {
      for (const a of p.authors ?? []) {
        if (!a.authorId || watchedAuthorIds.has(a.authorId)) continue;
        const cur = coauthors.get(a.authorId) ?? { name: a.name, count: 0 };
        cur.count += 1;
        coauthors.set(a.authorId, cur);
      }
      for (const f of fieldsOf(p)) fields.set(f, (fields.get(f) ?? 0) + 1);
    }
  }

  for (const s of subjects) {
    const papers = await subjectLatest(s, 20);
    for (const p of papers) {
      for (const f of fieldsOf(p)) fields.set(f, (fields.get(f) ?? 0) + 1);
    }
  }

  const researcherSuggestions: ResearcherSuggestion[] = [...coauthors.entries()]
    .map(([authorId, v]) => ({ authorId, name: v.name, count: v.count }))
    .filter((s) => s.count > 1)
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  const subjectSuggestions: SubjectSuggestion[] = [...fields.entries()]
    .map(([field, count]) => ({ field, count }))
    .filter((s) => !watchedFields.has(s.field.toLowerCase()))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8);

  return { researchers: researcherSuggestions, subjects: subjectSuggestions };
}
