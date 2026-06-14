"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  AuthorDetail,
  Paper,
  Researcher,
  ResearcherSuggestion,
  Subject,
  SubjectSuggestion,
} from "@/lib/types";
import { authorLine, formatDate, formatNumber } from "@/lib/format";

type Tab = "researchers" | "subjects";

export default function ManagePage() {
  const [tab, setTab] = useState<Tab>("researchers");
  const [researchers, setResearchers] = useState<Researcher[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);

  const loadLists = useCallback(async () => {
    const [r, s] = await Promise.all([
      fetch("/api/watchlist/researchers").then((x) => x.json()),
      fetch("/api/watchlist/subjects").then((x) => x.json()),
    ]);
    setResearchers(r);
    setSubjects(s);
  }, []);

  useEffect(() => {
    loadLists();
  }, [loadLists]);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="font-serif text-3xl">Manage watchlists</h1>
        <p className="mt-2 text-sm text-muted">
          Add or remove the researchers and subject areas tracked on your dashboard.
        </p>
      </div>

      <div className="flex gap-1 border-b border-line">
        <TabButton active={tab === "researchers"} onClick={() => setTab("researchers")}>
          Researchers
        </TabButton>
        <TabButton active={tab === "subjects"} onClick={() => setTab("subjects")}>
          Subjects
        </TabButton>
      </div>

      {tab === "researchers" ? (
        <ResearchersTab
          researchers={researchers}
          onChange={loadLists}
        />
      ) : (
        <SubjectsTab subjects={subjects} onChange={loadLists} />
      )}

      <Recommendations researchers={researchers} subjects={subjects} onChange={loadLists} />
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2 text-sm transition-colors ${
        active
          ? "border-accent text-accent"
          : "border-transparent text-muted hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}

function Pill({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button
      onClick={onClick}
      className="rounded-full border border-line px-3 py-1 text-xs text-accent hover:bg-accent-soft transition-colors"
    >
      {label}
    </button>
  );
}

// ---------- Researchers ----------

function ResearchersTab({
  researchers,
  onChange,
}: {
  researchers: Researcher[];
  onChange: () => void;
}) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<AuthorDetail[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const watchedIds = new Set(researchers.map((r) => r.authorId));

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?type=author&q=${encodeURIComponent(q)}`).then((x) =>
        x.json()
      );
      if (res.error) throw new Error(res.error);
      setResults(res.authors ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function add(a: AuthorDetail) {
    await fetch("/api/watchlist/researchers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorId: a.authorId, name: a.name }),
    });
    onChange();
  }

  async function remove(authorId: string) {
    await fetch(`/api/watchlist/researchers?authorId=${authorId}`, { method: "DELETE" });
    onChange();
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-serif text-xl">Tracked researchers</h2>
        {researchers.length === 0 ? (
          <p className="mt-2 text-sm text-faint">None yet — search below to add some.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {researchers.map((r) => (
              <li key={r.authorId} className="flex items-center justify-between py-2">
                <span className="text-sm">{r.name}</span>
                <button
                  onClick={() => remove(r.authorId)}
                  className="text-xs text-faint hover:text-accent"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={search} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search for a researcher by name…"
          className="flex-1 border-b border-line bg-transparent px-1 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="submit"
          className="rounded border border-line px-3 py-1 text-sm hover:bg-accent-soft"
        >
          Search
        </button>
      </form>

      {loading ? <p className="text-sm text-faint">Searching…</p> : null}
      {error ? <p className="text-sm text-accent">{error}</p> : null}

      {results && !loading ? (
        results.length === 0 ? (
          <p className="text-sm text-faint">No matching researchers.</p>
        ) : (
          <ul className="divide-y divide-line">
            {results.map((a) => (
              <li key={a.authorId} className="flex items-start justify-between gap-4 py-3">
                <div>
                  <p className="text-sm font-medium">{a.name}</p>
                  <p className="text-xs text-faint">
                    {(a.affiliations ?? []).join(", ") || "Affiliation unknown"}
                  </p>
                  <p className="text-xs text-faint">
                    {formatNumber(a.paperCount)} papers · h-index {formatNumber(a.hIndex)} ·{" "}
                    {formatNumber(a.citationCount)} citations
                  </p>
                </div>
                {watchedIds.has(a.authorId) ? (
                  <span className="text-xs text-faint">Tracked</span>
                ) : (
                  <Pill onClick={() => add(a)} label="Add" />
                )}
              </li>
            ))}
          </ul>
        )
      ) : null}
    </section>
  );
}

// ---------- Subjects ----------

function SubjectsTab({
  subjects,
  onChange,
}: {
  subjects: Subject[];
  onChange: () => void;
}) {
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<Paper[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function search(e: React.FormEvent) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/search?type=paper&q=${encodeURIComponent(q)}`).then((x) =>
        x.json()
      );
      if (res.error) throw new Error(res.error);
      setPreview(res.papers ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }

  async function add(query: string) {
    await fetch("/api/watchlist/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    setQ("");
    setPreview(null);
    onChange();
  }

  async function remove(id: string) {
    await fetch(`/api/watchlist/subjects?id=${id}`, { method: "DELETE" });
    onChange();
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="font-serif text-xl">Tracked subjects</h2>
        {subjects.length === 0 ? (
          <p className="mt-2 text-sm text-faint">None yet — add a topic below.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {subjects.map((s) => (
              <li key={s.id} className="flex items-center justify-between py-2">
                <span className="text-sm">{s.label}</span>
                <button
                  onClick={() => remove(s.id)}
                  className="text-xs text-faint hover:text-accent"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <form onSubmit={search} className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="e.g. mechanistic interpretability"
          className="flex-1 border-b border-line bg-transparent px-1 py-2 text-sm outline-none focus:border-accent"
        />
        <button
          type="button"
          onClick={() => q.trim() && add(q)}
          className="rounded border border-line px-3 py-1 text-sm hover:bg-accent-soft"
        >
          Add topic
        </button>
        <button
          type="submit"
          className="rounded border border-line px-3 py-1 text-sm hover:bg-accent-soft"
        >
          Preview
        </button>
      </form>

      {loading ? <p className="text-sm text-faint">Searching…</p> : null}
      {error ? <p className="text-sm text-accent">{error}</p> : null}

      {preview && !loading ? (
        <div>
          <p className="mb-2 text-xs text-faint">
            Sample of what this topic would track:
          </p>
          {preview.length === 0 ? (
            <p className="text-sm text-faint">No papers found for that query.</p>
          ) : (
            <ul className="divide-y divide-line">
              {preview.slice(0, 5).map((p) => (
                <li key={p.paperId} className="py-2">
                  <p className="font-serif text-sm">{p.title}</p>
                  <p className="text-xs text-faint">
                    {authorLine(p)} · {formatDate(p)}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}

// ---------- Recommendations ----------

function Recommendations({
  researchers,
  subjects,
  onChange,
}: {
  researchers: Researcher[];
  subjects: Subject[];
  onChange: () => void;
}) {
  const [recs, setRecs] = useState<{
    researchers: ResearcherSuggestion[];
    subjects: SubjectSuggestion[];
  } | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (researchers.length === 0 && subjects.length === 0) {
      setRecs(null);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/recommendations").then((x) => x.json());
      if (!res.error) setRecs(res);
    } finally {
      setLoading(false);
    }
  }, [researchers.length, subjects.length]);

  useEffect(() => {
    load();
  }, [load]);

  async function addResearcher(s: ResearcherSuggestion) {
    await fetch("/api/watchlist/researchers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ authorId: s.authorId, name: s.name }),
    });
    onChange();
  }

  async function addSubject(field: string) {
    await fetch("/api/watchlist/subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: field }),
    });
    onChange();
  }

  if (researchers.length === 0 && subjects.length === 0) return null;

  return (
    <section className="space-y-4 border-t border-line pt-8">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-xl">Suggested for you</h2>
        <button onClick={load} className="text-xs text-faint hover:text-accent">
          Refresh
        </button>
      </div>
      {loading ? <p className="text-sm text-faint">Finding related work…</p> : null}

      {recs && recs.researchers.length > 0 ? (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-faint">
            Related researchers (frequent co-authors)
          </p>
          <div className="flex flex-wrap gap-2">
            {recs.researchers.map((s) => (
              <Pill
                key={s.authorId}
                onClick={() => addResearcher(s)}
                label={`${s.name}  +`}
              />
            ))}
          </div>
        </div>
      ) : null}

      {recs && recs.subjects.length > 0 ? (
        <div>
          <p className="mb-2 text-xs uppercase tracking-wide text-faint">
            Related subjects (common fields)
          </p>
          <div className="flex flex-wrap gap-2">
            {recs.subjects.map((s) => (
              <Pill key={s.field} onClick={() => addSubject(s.field)} label={`${s.field}  +`} />
            ))}
          </div>
        </div>
      ) : null}

      {recs && recs.researchers.length === 0 && recs.subjects.length === 0 && !loading ? (
        <p className="text-sm text-faint">No suggestions yet — add a few researchers first.</p>
      ) : null}
    </section>
  );
}
