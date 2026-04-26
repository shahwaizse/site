import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trash2, Upload, FileText, Loader2 } from "lucide-react";

type Doc = {
  id: number;
  title: string;
  created_at: number;
  chunk_count: number;
};

export default function KbManager() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    try {
      const res = await fetch("/api/kb/list");
      if (!res.ok) throw new Error("failed to load");
      const json = await res.json();
      setDocs(json.documents ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "failed to load");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim() || !content.trim() || uploading) return;
    setUploading(true);
    setError(null);
    try {
      const res = await fetch("/api/kb/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: title.trim(), content: content.trim() }),
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || "upload failed");
      }
      setTitle("");
      setContent("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleFile(file: File) {
    const text = await file.text();
    setTitle(file.name.replace(/\.[^.]+$/, ""));
    setContent(text);
  }

  async function remove(id: number) {
    if (!confirm("delete this document and all its chunks?")) return;
    const res = await fetch(`/api/kb/delete?id=${id}`, { method: "DELETE" });
    if (res.ok) refresh();
  }

  const fmt = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="space-y-8">
      {/* Upload form */}
      <form
        onSubmit={upload}
        className="rounded-2xl border border-border-subtle bg-bg-elevated p-6 space-y-3"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg tracking-tight">add document</h2>
          <label className="text-xs text-fg-subtle hover:text-fg-muted font-mono cursor-pointer transition-colors">
            <input
              type="file"
              accept=".txt,.md,.markdown"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
            upload .md or .txt
          </label>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="title (e.g., 'resume', 'about me', 'projects')"
          className="w-full px-4 py-2.5 rounded-xl bg-bg-subtle border border-border-subtle focus:border-border outline-none text-fg placeholder:text-fg-subtle text-sm"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="paste content here..."
          rows={8}
          className="w-full px-4 py-3 rounded-xl bg-bg-subtle border border-border-subtle focus:border-border outline-none text-fg placeholder:text-fg-subtle text-sm resize-y font-mono"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-fg-subtle">
            {content.length.toLocaleString()} chars
          </span>
          <button
            type="submit"
            disabled={!title.trim() || !content.trim() || uploading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-fg text-bg text-sm font-medium disabled:opacity-30 disabled:cursor-not-allowed hover:bg-fg-muted transition-colors"
          >
            {uploading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> embedding...
              </>
            ) : (
              <>
                <Upload size={14} /> add to knowledge base
              </>
            )}
          </button>
        </div>
        {error && <p className="text-xs text-red-300">{error}</p>}
      </form>

      {/* Doc list */}
      <div>
        <h2 className="font-serif text-lg tracking-tight mb-4">documents</h2>
        {loading ? (
          <p className="text-sm text-fg-subtle flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> loading...
          </p>
        ) : docs.length === 0 ? (
          <p className="text-sm text-fg-subtle">
            no documents yet. add one above.
          </p>
        ) : (
          <ul className="divide-y divide-border-subtle rounded-2xl border border-border-subtle overflow-hidden">
            <AnimatePresence initial={false}>
              {docs.map((d) => (
                <motion.li
                  key={d.id}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center justify-between px-4 py-3 bg-bg-elevated"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={14} className="text-fg-subtle shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-fg truncate">{d.title}</p>
                      <p className="text-xs text-fg-subtle font-mono">
                        {d.chunk_count} chunks · {fmt.format(d.created_at)}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => remove(d.id)}
                    className="text-fg-subtle hover:text-red-300 transition-colors p-1"
                    aria-label="delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  );
}
