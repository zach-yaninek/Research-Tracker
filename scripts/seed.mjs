// Seeds the local watchlist with a few leading ML researchers and subject areas
// so the app opens with content. Idempotent: re-running just refreshes the rows.
//
//   npm run seed
//
// Author IDs below are verified canonical Semantic Scholar profiles.

import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "tracker.db");

// [Semantic Scholar authorId, display name]
const RESEARCHERS = [
  ["1695689", "Geoffrey Hinton"],
  ["1688882", "Yann LeCun"],
  ["1751762", "Yoshua Bengio"],
  ["34699434", "Andrew Ng"],
  ["1701686", "Ilya Sutskever"],
];

const SUBJECTS = [
  "large language models",
  "reinforcement learning",
  "computer vision",
];

function slugify(query) {
  return query
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

fs.mkdirSync(DATA_DIR, { recursive: true });
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");

// Match the schema the app creates, so seeding works before first run too.
db.exec(`
  CREATE TABLE IF NOT EXISTS researchers (
    authorId TEXT PRIMARY KEY, name TEXT NOT NULL, addedAt INTEGER NOT NULL
  );
  CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY, query TEXT NOT NULL, label TEXT NOT NULL, addedAt INTEGER NOT NULL
  );
`);

const base = Date.now();
const addResearcher = db.prepare(
  "INSERT OR REPLACE INTO researchers (authorId, name, addedAt) VALUES (?, ?, ?)"
);
const addSubject = db.prepare(
  "INSERT OR REPLACE INTO subjects (id, query, label, addedAt) VALUES (?, ?, ?, ?)"
);

// Earlier array items get a higher addedAt so they sort first on the dashboard.
db.transaction(() => {
  RESEARCHERS.forEach(([id, name], i) =>
    addResearcher.run(id, name, base - i * 1000)
  );
  SUBJECTS.forEach((q, i) =>
    addSubject.run(slugify(q), q, q, base - (RESEARCHERS.length + i) * 1000)
  );
})();

console.log(
  `Seeded ${RESEARCHERS.length} researchers and ${SUBJECTS.length} subjects into ${path.relative(process.cwd(), DB_PATH)}.`
);
db.close();
