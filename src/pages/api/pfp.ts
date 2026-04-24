import type { APIRoute } from "astro";
import { db } from "@/lib/db";
import { isAuthed } from "@/lib/auth";

export const prerender = false;

// GET /api/pfp — serve the uploaded pfp (public)
export const GET: APIRoute = async () => {
  try {
    const res = await db.execute({
      sql: "SELECT value FROM settings WHERE key = 'pfp' LIMIT 1",
      args: [],
    });
    if (res.rows.length === 0) {
      return new Response(null, { status: 404 });
    }
    const stored = String(res.rows[0].value); // "mime|base64"
    const [mime, b64] = stored.split("|");
    const buf = Buffer.from(b64, "base64");
    return new Response(buf, {
      status: 200,
      headers: {
        "Content-Type": mime || "image/jpeg",
        "Cache-Control": "public, max-age=60",
      },
    });
  } catch (err) {
    console.error("[pfp get]", err);
    return new Response(null, { status: 500 });
  }
};

// POST /api/pfp — upload a new pfp (auth required, multipart)
export const POST: APIRoute = async ({ request }) => {
  if (!isAuthed(request)) {
    return new Response("unauthorized", { status: 401 });
  }
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      return new Response("no file", { status: 400 });
    }
    if (!file.type.startsWith("image/")) {
      return new Response("must be an image", { status: 400 });
    }
    if (file.size > 2 * 1024 * 1024) {
      return new Response("image too large (2MB max)", { status: 413 });
    }
    const buf = Buffer.from(await file.arrayBuffer());
    const b64 = buf.toString("base64");
    const value = `${file.type}|${b64}`;
    const now = Date.now();

    await db.execute({
      sql: `INSERT INTO settings (key, value, updated_at)
            VALUES ('pfp', ?, ?)
            ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
      args: [value, now],
    });

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[pfp post]", err);
    return new Response("upload failed", { status: 500 });
  }
};

// DELETE /api/pfp — remove the uploaded pfp (falls back to default)
export const DELETE: APIRoute = async ({ request }) => {
  if (!isAuthed(request)) {
    return new Response("unauthorized", { status: 401 });
  }
  await db.execute("DELETE FROM settings WHERE key = 'pfp'");
  return new Response(null, { status: 204 });
};
