import { createClient } from "@libsql/client";

const url = import.meta.env.TURSO_DATABASE_URL ?? process.env.TURSO_DATABASE_URL;
const authToken =
  import.meta.env.TURSO_AUTH_TOKEN ?? process.env.TURSO_AUTH_TOKEN;

if (!url) {
  throw new Error("TURSO_DATABASE_URL is not set");
}

export const db = createClient({
  url,
  authToken,
});

export type KbDocument = {
  id: number;
  title: string;
  content: string;
  created_at: number;
};

export type KbChunk = {
  id: number;
  document_id: number;
  content: string;
  similarity: number;
};
