import type { APIRoute } from "astro";
import { isAuthed } from "@/lib/auth";
import { addDocument } from "@/lib/rag";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!isAuthed(request)) {
    return new Response("unauthorized", { status: 401 });
  }

  let body: { title?: string; content?: string };
  try {
    body = await request.json();
  } catch {
    return new Response("invalid json", { status: 400 });
  }

  const title = body.title?.trim();
  const content = body.content?.trim();
  if (!title || !content) {
    return new Response("title and content are required", { status: 400 });
  }
  if (content.length > 500_000) {
    return new Response("content too large (500k char limit)", { status: 413 });
  }

  try {
    const result = await addDocument({ title, content });
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[kb/upload]", err);
    return new Response(
      err instanceof Error ? err.message : "upload failed",
      { status: 500 }
    );
  }
};
