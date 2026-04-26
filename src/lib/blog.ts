import { db } from "@/lib/db";

export type BlogPost = {
  id: number;
  title: string;
  slug: string;
  description: string;
  content: string;
  draft: boolean;
  published_at: number | null;
  created_at: number;
  updated_at: number;
};

function rowToPost(row: Record<string, unknown>): BlogPost {
  return {
    id: Number(row.id),
    title: String(row.title),
    slug: String(row.slug),
    description: String(row.description ?? ""),
    content: String(row.content),
    draft: Number(row.draft) === 1,
    published_at:
      row.published_at === null || row.published_at === undefined
        ? null
        : Number(row.published_at),
    created_at: Number(row.created_at),
    updated_at: Number(row.updated_at),
  };
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/['"]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function createBlogPost(opts: {
  title: string;
  description?: string;
  content: string;
  slug?: string;
  draft?: boolean;
}) {
  const now = Date.now();
  const draft = opts.draft ?? false;
  const baseSlug = slugify(opts.slug?.trim() || opts.title);
  if (!baseSlug) throw new Error("slug is required");

  const publishedAt = draft ? null : now;
  const res = await db.execute({
    sql: `INSERT INTO blog_posts
          (title, slug, description, content, draft, published_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
          RETURNING *`,
    args: [
      opts.title.trim(),
      baseSlug,
      opts.description?.trim() ?? "",
      opts.content.trim(),
      draft ? 1 : 0,
      publishedAt,
      now,
      now,
    ],
  });
  return rowToPost(res.rows[0] as Record<string, unknown>);
}

export async function listAdminBlogPosts() {
  const res = await db.execute(
    `SELECT *
     FROM blog_posts
     ORDER BY COALESCE(published_at, created_at) DESC`
  );
  return res.rows.map((r) => rowToPost(r as Record<string, unknown>));
}

export async function listPublishedBlogPosts() {
  const res = await db.execute(
    `SELECT *
     FROM blog_posts
     WHERE draft = 0
     ORDER BY published_at DESC, created_at DESC`
  );
  return res.rows.map((r) => rowToPost(r as Record<string, unknown>));
}

export async function getPublishedBlogPostBySlug(slug: string) {
  const res = await db.execute({
    sql: `SELECT *
          FROM blog_posts
          WHERE slug = ? AND draft = 0
          LIMIT 1`,
    args: [slug],
  });
  const row = res.rows[0];
  if (!row) return null;
  return rowToPost(row as Record<string, unknown>);
}

export async function deleteBlogPost(id: number) {
  await db.execute({
    sql: "DELETE FROM blog_posts WHERE id = ?",
    args: [id],
  });
}
