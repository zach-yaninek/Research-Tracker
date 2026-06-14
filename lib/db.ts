import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { Researcher, Subject } from "./types";

// Single shared connection. Stored under data/ (gitignored).
const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "tracker.db");

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (_db) return _db;
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS researchers (
      authorId TEXT PRIMARY KEY,
      name     TEXT NOT NULL,
      addedAt  INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS subjects (
      id      TEXT PRIMARY KEY,
      query   TEXT NOT NULL,
      label   TEXT NOT NULL,
      addedAt INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS cache (
      key       TEXT PRIMARY KEY,
      payload   TEXT NOT NULL,
      fetchedAt INTEGER NOT NULL
    );
  `);
  _db = db;
  return db;
}

// ---- Researchers ----
export function listResearchers(): Researcher[] {
  return getDb()
    .prepare("SELECT authorId, name, addedAt FROM researchers ORDER BY addedAt DESC")
    .all() as Researcher[];
}

export function addResearcher(authorId: string, name: string): Researcher {
  const addedAt = Date.now();
  getDb()
    .prepare(
      "INSERT OR REPLACE INTO researchers (authorId, name, addedAt) VALUES (?, ?, ?)"
    )
    .run(authorId, name, addedAt);
  return { authorId, name, addedAt };
}

export function removeResearcher(authorId: string): void {
  getDb().prepare("DELETE FROM researchers WHERE authorId = ?").run(authorId);
}

// ---- Subjects ----
export function slugify(query: string): string {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function listSubjects(): Subject[] {
  return getDb()
    .prepare("SELECT id, query, label, addedAt FROM subjects ORDER BY addedAt DESC")
    .all() as Subject[];
}

export function getSubject(id: string): Subject | undefined {
  return getDb()
    .prepare("SELECT id, query, label, addedAt FROM subjects WHERE id = ?")
    .get(id) as Subject | undefined;
}

export function addSubject(query: string, label?: string): Subject {
  const id = slugify(query);
  const addedAt = Date.now();
  const subject: Subject = { id, query: query.trim(), label: (label ?? query).trim(), addedAt };
  getDb()
    .prepare(
      "INSERT OR REPLACE INTO subjects (id, query, label, addedAt) VALUES (?, ?, ?, ?)"
    )
    .run(subject.id, subject.query, subject.label, subject.addedAt);
  return subject;
}

export function removeSubject(id: string): void {
  getDb().prepare("DELETE FROM subjects WHERE id = ?").run(id);
}

// ---- Cache ----
export function cacheGet(key: string): { payload: string; fetchedAt: number } | undefined {
  return getDb()
    .prepare("SELECT payload, fetchedAt FROM cache WHERE key = ?")
    .get(key) as { payload: string; fetchedAt: number } | undefined;
}

export function cacheSet(key: string, payload: string): void {
  getDb()
    .prepare("INSERT OR REPLACE INTO cache (key, payload, fetchedAt) VALUES (?, ?, ?)")
    .run(key, payload, Date.now());
}

export function cacheDeleteByPrefix(prefix: string): void {
  getDb().prepare("DELETE FROM cache WHERE key LIKE ?").run(`${prefix}%`);
}
