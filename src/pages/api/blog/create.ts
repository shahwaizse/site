import type { APIRoute } from "astro";
import { isAuthed } from "@/lib/auth";
import { createBlogPost } from "@/lib/blog";

export const prerender = false;

export const POST: APIRoute = async ({ request }) => {
  if (!isAuthed(request)) {
    return new Response("unauthorized", { status: 401 });
  }

  let body: {
    title?: string;
    slug?: string;
    description?: string;
    content?: string;
    draft?: boolean;
  };
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
  if (content.length > 200_000) {
    return new Response("content too large (200k char limit)", { status: 413 });
  }

  try {
    const post = await createBlogPost({
      title,
      slug: body.slug,
      description: body.description,
      content,
      draft: Boolean(body.draft),
    });
    return new Response(JSON.stringify({ post }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "create failed";
    const isUniqueError = /unique/i.test(message);
    return new Response(message, { status: isUniqueError ? 409 : 500 });
  }
};
