/**
 * Creates the schema on your Turso database.
 *
 * Usage:
 *   1. Fill in TURSO_DATABASE_URL and TURSO_AUTH_TOKEN in .env
 *   2. pnpm db:init   (or: npm run db:init)
 */

import { createClient } from "@libsql/client";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Minimal .env loader (no dotenv dep needed)
try {
  const env = readFileSync(resolve(process.cwd(), ".env"), "utf8");
  for (const line of env.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !process.env[m[1]]) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
} catch {
  // ok — env may be set externally
}

const url = process.env.TURSO_DATABASE_URL;
const authToken = process.env.TURSO_AUTH_TOKEN;
const model = process.env.VOYAGE_MODEL ?? "voyage-3-lite";
const EMBEDDING_DIM = model === "voyage-3" ? 1024 : 512;

if (!url) {
  console.error("TURSO_DATABASE_URL is not set. Fill it in .env first.");
  process.exit(1);
}

const db = createClient({ url, authToken });

async function main() {
  console.log(`Initializing Turso schema (embedding dim = ${EMBEDDING_DIM})...`);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS kb_documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS kb_chunks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL REFERENCES kb_documents(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      embedding F32_BLOB(${EMBEDDING_DIM}) NOT NULL
    )
  `);

  // Libsql native vector index (approximate, very fast)
  await db.execute(`
    CREATE INDEX IF NOT EXISTS kb_chunks_embedding_idx
    ON kb_chunks (libsql_vector_idx(embedding))
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS kb_chunks_document_id_idx
    ON kb_chunks(document_id)
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  await db.execute(`
    CREATE TABLE IF NOT EXISTS blog_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      slug TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      draft INTEGER NOT NULL DEFAULT 0,
      published_at INTEGER,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `);

  await db.execute(`
    CREATE INDEX IF NOT EXISTS blog_posts_published_at_idx
    ON blog_posts(published_at DESC)
  `);

  console.log("✓ done.");
  console.log("  - kb_documents");
  console.log("  - kb_chunks (with vector index)");
  console.log("  - settings");
  console.log("  - blog_posts");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
