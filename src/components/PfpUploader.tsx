import { useState } from "react";
import { ImageIcon, Loader2, Trash2 } from "lucide-react";

export default function PfpUploader() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // cachebust so the preview updates after upload/delete
  const [version, setVersion] = useState(() => Date.now());

  async function upload(file: File) {
    setError(null);
    if (!file.type.startsWith("image/")) {
      setError("must be an image");
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError("must be under 2MB");
      return;
    }
    setBusy(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/pfp", { method: "POST", body: form });
      if (!res.ok) throw new Error((await res.text()) || "upload failed");
      setVersion(Date.now());
    } catch (e) {
      setError(e instanceof Error ? e.message : "upload failed");
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!confirm("remove pfp and fall back to default?")) return;
    setBusy(true);
    try {
      await fetch("/api/pfp", { method: "DELETE" });
      setVersion(Date.now());
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-border-subtle bg-bg-elevated p-5">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-bg-subtle border border-border-subtle overflow-hidden shrink-0">
          <img
            src={`/api/pfp?v=${version}`}
            alt="current pfp"
            className="w-full h-full object-cover"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              if (!img.src.includes("/pfp.svg")) img.src = "/pfp.svg";
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-serif text-lg tracking-tight">profile picture</h2>
          <p className="text-xs text-fg-subtle">shown on the homepage. png/jpg, up to 2MB.</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <label className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-fg text-bg text-sm font-medium cursor-pointer hover:bg-fg-muted transition-colors">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={busy}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) upload(f);
                e.target.value = "";
              }}
            />
            {busy ? (
              <>
                <Loader2 size={14} className="animate-spin" /> uploading
              </>
            ) : (
              <>
                <ImageIcon size={14} /> upload
              </>
            )}
          </label>
          <button
            onClick={remove}
            disabled={busy}
            className="p-2 rounded-xl border border-border-subtle text-fg-subtle hover:text-red-300 hover:border-border transition-colors"
            aria-label="remove pfp"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-red-300 mt-3">{error}</p>}
    </div>
  );
}
