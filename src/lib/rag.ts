import { db, type KbChunk } from "./db";
import { embedOne, embed, EMBEDDING_DIM } from "./embeddings";
import { chunk } from "./chunk";

// Format a JS number[] as libsql vector literal: '[0.1,0.2,...]'
function toVectorLiteral(vec: number[]): string {
  return `[${vec.join(",")}]`;
}

export async function addDocument(opts: {
  title: string;
  content: string;
}): Promise<{ documentId: number; chunkCount: number }> {
  const now = Date.now();
  const insertDoc = await db.execute({
    sql: "INSERT INTO kb_documents (title, content, created_at) VALUES (?, ?, ?) RETURNING id",
    args: [opts.title, opts.content, now],
  });
  const documentId = Number(insertDoc.rows[0].id);

  const chunks = chunk(opts.content);
  if (chunks.length === 0) return { documentId, chunkCount: 0 };

  // Batch embed — Voyage supports up to 128 texts per call
  const BATCH = 64;
  const vectors: number[][] = [];
  for (let i = 0; i < chunks.length; i += BATCH) {
    const batch = chunks.slice(i, i + BATCH);
    const vecs = await embed(batch, "document");
    vectors.push(...vecs);
  }

  // Insert chunks with their embeddings
  for (let i = 0; i < chunks.length; i++) {
    await db.execute({
      sql: `INSERT INTO kb_chunks (document_id, content, embedding)
            VALUES (?, ?, vector32(?))`,
      args: [documentId, chunks[i], toVectorLiteral(vectors[i])],
    });
  }

  return { documentId, chunkCount: chunks.length };
}

export async function deleteDocument(documentId: number): Promise<void> {
  await db.batch(
    [
      {
        sql: "DELETE FROM kb_chunks WHERE document_id = ?",
        args: [documentId],
      },
      {
        sql: "DELETE FROM kb_documents WHERE id = ?",
        args: [documentId],
      },
    ],
    "write"
  );
}

export async function listDocuments() {
  const res = await db.execute(
    `SELECT d.id, d.title, d.created_at,
       (SELECT COUNT(*) FROM kb_chunks c WHERE c.document_id = d.id) AS chunk_count
     FROM kb_documents d
     ORDER BY d.created_at DESC`
  );
  return res.rows.map((r) => ({
    id: Number(r.id),
    title: String(r.title),
    created_at: Number(r.created_at),
    chunk_count: Number(r.chunk_count),
  }));
}

export async function retrieve(query: string, topK = 5): Promise<KbChunk[]> {
  const qvec = await embedOne(query, "query");

  // Use libsql's approximate vector index. vector_top_k returns row ids
  // ordered by cosine distance.
  const res = await db.execute({
    sql: `
      SELECT c.id, c.document_id, c.content,
             vector_distance_cos(c.embedding, vector32(?)) AS distance
      FROM vector_top_k('kb_chunks_embedding_idx', vector32(?), ?) AS t
      JOIN kb_chunks c ON c.rowid = t.id
      ORDER BY distance ASC
    `,
    args: [toVectorLiteral(qvec), toVectorLiteral(qvec), topK],
  });

  return res.rows.map((r) => ({
    id: Number(r.id),
    document_id: Number(r.document_id),
    content: String(r.content),
    similarity: 1 - Number(r.distance),
  }));
}

export { EMBEDDING_DIM };
