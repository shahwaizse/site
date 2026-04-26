import type { APIRoute } from "astro";
import { isAuthed } from "@/lib/auth";
import { listAdminBlogPosts } from "@/lib/blog";

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  if (!isAuthed(request)) {
    return new Response("unauthorized", { status: 401 });
  }

  try {
    const posts = await listAdminBlogPosts();
    return new Response(JSON.stringify({ posts }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[blog/list]", err);
    return new Response("failed to list posts", { status: 500 });
  }
};
