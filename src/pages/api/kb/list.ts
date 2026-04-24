import type { APIRoute } from "astro";
import { isAuthed } from "@/lib/auth";
import { listDocuments } from "@/lib/rag";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!isAuthed(request)) {
    return new Response("unauthorized", { status: 401 });
  }
  try {
    const documents = await listDocuments();
    return new Response(JSON.stringify({ documents }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[kb/list]", err);
    return new Response("failed to list", { status: 500 });
  }
};
