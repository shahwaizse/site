import type { APIRoute } from "astro";
import { isAuthed } from "@/lib/auth";
import { deleteDocument } from "@/lib/rag";

export const prerender = false;

export const DELETE: APIRoute = async ({ request, url }) => {
  if (!isAuthed(request)) {
    return new Response("unauthorized", { status: 401 });
  }
  const id = Number(url.searchParams.get("id"));
  if (!Number.isFinite(id) || id <= 0) {
    return new Response("invalid id", { status: 400 });
  }
  try {
    await deleteDocument(id);
    return new Response(null, { status: 204 });
  } catch (err) {
    console.error("[kb/delete]", err);
    return new Response("delete failed", { status: 500 });
  }
};
