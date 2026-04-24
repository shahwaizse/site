import { createClient, type Client } from "@libsql/client";

let _client: Client | undefined;

function getClient(): Client {
  if (!_client) {
    const url = process.env.TURSO_DATABASE_URL;
    const authToken = process.env.TURSO_AUTH_TOKEN;
    if (!url) throw new Error("TURSO_DATABASE_URL is not set");
    _client = createClient({ url, authToken });
  }
  return _client;
}

export const db = new Proxy({} as Client, {
  get(_t, prop) {
    return Reflect.get(getClient(), prop);
  },
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
