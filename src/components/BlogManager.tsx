import { useEffect, useState } from "react";
import { Loader2, Plus, Trash2 } from "lucide-react";

type BlogPost = {
  id: number;
  title: string;
  slug: string;
  description: string;
  draft: boolean;
  published_at: number | null;
  created_at: number;
};

export default function BlogManager() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");
  const [draft, setDraft] = useState(false);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/blog/list");
      if (!res.ok) throw new Error("failed to load blog posts");
      const json = await res.json();
      setPosts(json.posts ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed to load blog posts");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function createPost(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim() || saving) return;

    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/blog/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          slug: slug.trim() || undefined,
          description: description.trim(),
          content: content.trim(),
          draft,
        }),
      });
      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || "failed to create post");
      }
      setTitle("");
      setSlug("");
      setDescription("");
      setContent("");
      setDraft(false);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed to create post");
    } finally {
      setSaving(false);
    }
  }

  async function removePost(id: number) {
    if (!confirm("delete this blog post?")) return;
    const res = await fetch(`/api/blog/delete?id=${id}`, { method: "DELETE" });
    if (res.ok) refresh();
  }

  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      <form
        onSubmit={createPost}
        className="rounded-2xl border border-border-subtle bg-bg-elevated p-6 space-y-3"
      >
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-lg tracking-tight">write blog post</h2>
          <label className="text-xs font-mono text-fg-subtle inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={draft}
              onChange={(e) => setDraft(e.target.checked)}
            />
            save as draft
          </label>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="post title"
          className="w-full px-4 py-2.5 rounded-xl bg-bg-subtle border border-border-subtle focus:border-border outline-none text-fg placeholder:text-fg-subtle text-sm"
        />
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="custom slug (optional)"
          className="w-full px-4 py-2.5 rounded-xl bg-bg-subtle border border-border-subtle focus:border-border outline-none text-fg placeholder:text-fg-subtle text-sm font-mono"
        />
        <input
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="short description (optional)"
          className="w-full px-4 py-2.5 rounded-xl bg-bg-subtle border border-border-subtle focus:border-border outline-none text-fg placeholder:text-fg-subtle text-sm"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="write markdown here..."
          rows={12}
          className="w-full px-4 py-3 rounded-xl bg-bg-subtle border border-border-subtle focus:border-border outline-none text-fg placeholder:text-fg-subtle text-sm resize-y font-mono"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-fg-subtle">
            {content.length.toLocaleString()} chars
          </span>
          <button
            type="submit"
            disabled={!title.trim() || !content.trim() || saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-fg text-bg text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-fg-muted transition-colors"
          >
            {saving ? (
              <>
                <Loader2 size={14} className="animate-spin" /> saving...
              </>
            ) : (
              <>
                <Plus size={14} /> {draft ? "save draft" : "publish post"}
              </>
            )}
          </button>
        </div>
        {error && <p className="text-xs text-red-300">{error}</p>}
      </form>

      <div>
        <h2 className="font-serif text-lg tracking-tight mb-4">blog posts</h2>
        {loading ? (
          <p className="text-sm text-fg-subtle inline-flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> loading...
          </p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-fg-subtle">no posts yet.</p>
        ) : (
          <ul className="divide-y divide-border-subtle rounded-2xl border border-border-subtle overflow-hidden">
            {posts.map((post) => (
              <li
                key={post.id}
                className="flex items-center justify-between px-4 py-3 bg-bg-elevated gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm text-fg truncate">{post.title}</p>
                  <p className="text-xs text-fg-subtle font-mono truncate">
                    /blog/{post.slug} ·{" "}
                    {post.draft
                      ? `draft · ${fmt.format(post.created_at)}`
                      : `published ${fmt.format(post.published_at ?? post.created_at)}`}
                  </p>
                </div>
                <button
                  onClick={() => removePost(post.id)}
                  className="text-fg-subtle hover:text-red-300 transition-colors p-1"
                  aria-label="delete post"
                >
                  <Trash2 size={14} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
