"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Send,
  EyeOff,
  Loader2,
  UploadCloud,
  BookText,
  Headphones,
  Video,
  FileText,
  ExternalLink,
} from "lucide-react";
import { Modal } from "@/components/admin/Modal";
import {
  saveLibraryItem,
  setLibraryPublished,
  deleteLibraryItem,
} from "@/app/(admin)/library/actions";
import { createClient } from "@/lib/supabase/client";
import type { LibraryKind, Tables } from "@/lib/db";
import { cn } from "@/utils/cn";

type Item = Pick<
  Tables<"library_items">,
  | "id"
  | "kind"
  | "title"
  | "author"
  | "category"
  | "description"
  | "cover_image_url"
  | "file_url"
  | "external_url"
  | "duration_seconds"
  | "published"
  | "published_at"
>;

const BUCKET = "content-media";

const KINDS: {
  value: LibraryKind;
  label: string;
  icon: typeof BookText;
  accept: string;
  fileLabel: string;
  media: boolean;
  external: boolean;
}[] = [
  { value: "book", label: "Book", icon: BookText, accept: "application/pdf", fileLabel: "PDF", media: false, external: false },
  { value: "manual", label: "Devotional manual", icon: FileText, accept: "application/pdf", fileLabel: "PDF", media: false, external: false },
  { value: "audio", label: "Audio sermon", icon: Headphones, accept: "audio/*", fileLabel: "Audio file", media: true, external: false },
  { value: "video", label: "Video message", icon: Video, accept: "video/mp4", fileLabel: "MP4 file", media: true, external: true },
];

function kindMeta(k: string) {
  return KINDS.find((x) => x.value === k) ?? KINDS[0];
}

function formatDuration(s: number | null) {
  if (!s) return null;
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// Best-effort read of an uploaded media file's duration (audio/mp4).
function readDuration(file: File): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const el = document.createElement(
      file.type.startsWith("video") ? "video" : "audio"
    );
    el.preload = "metadata";
    el.onloadedmetadata = () => {
      URL.revokeObjectURL(url);
      resolve(Number.isFinite(el.duration) ? Math.round(el.duration) : null);
    };
    el.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(null);
    };
    el.src = url;
  });
}

export function LibraryManager({ items }: { items: Item[] }) {
  const router = useRouter();
  const coverRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [kind, setKind] = useState<LibraryKind>("book");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [fileUrl, setFileUrl] = useState("");
  const [externalUrl, setExternalUrl] = useState("");
  const [duration, setDuration] = useState<string>("");
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<Item | null>(null);

  const meta = kindMeta(kind);

  function openNew() {
    setEditingId(undefined);
    setKind("book");
    setTitle("");
    setAuthor("");
    setCategory("");
    setDescription("");
    setCoverUrl("");
    setFileUrl("");
    setExternalUrl("");
    setDuration("");
    setOpen(true);
  }

  function openEdit(it: Item) {
    setEditingId(it.id);
    setKind(it.kind as LibraryKind);
    setTitle(it.title);
    setAuthor(it.author ?? "");
    setCategory(it.category ?? "");
    setDescription(it.description ?? "");
    setCoverUrl(it.cover_image_url ?? "");
    setFileUrl(it.file_url ?? "");
    setExternalUrl(it.external_url ?? "");
    setDuration(it.duration_seconds ? String(it.duration_seconds) : "");
    setOpen(true);
  }

  async function upload(file: File) {
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "bin";
    const path = `library/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type });
    if (error) {
      toast.error(`Upload failed: ${error.message}`);
      return null;
    }
    return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  }

  async function onCover(file: File) {
    setUploadingCover(true);
    const url = await upload(file);
    setUploadingCover(false);
    if (url) {
      setCoverUrl(url);
      toast.success("Cover uploaded.");
    }
  }

  async function onContentFile(file: File) {
    setUploadingFile(true);
    // Auto-fill duration for media before uploading.
    if (meta.media) {
      const d = await readDuration(file);
      if (d) setDuration(String(d));
    }
    const url = await upload(file);
    setUploadingFile(false);
    if (url) {
      setFileUrl(url);
      toast.success(`${meta.fileLabel} uploaded.`);
    }
  }

  async function save() {
    setSaving(true);
    const result = await saveLibraryItem({
      id: editingId,
      kind,
      title,
      author: author || null,
      category: category || null,
      description: description || null,
      coverImageUrl: coverUrl || null,
      fileUrl: fileUrl || null,
      externalUrl: kind === "video" ? externalUrl || null : null,
      durationSeconds: duration ? Number(duration) : null,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(editingId ? "Item saved." : "Item created.");
    setOpen(false);
    router.refresh();
  }

  async function togglePublish(it: Item) {
    const result = await setLibraryPublished(it.id, !it.published);
    if (!result.ok) return toast.error(result.error);
    toast.success(it.published ? "Unpublished." : "Published.");
    router.refresh();
  }

  async function confirmDelete() {
    if (!deleting) return;
    const result = await deleteLibraryItem(deleting.id);
    if (!result.ok) return toast.error(result.error);
    toast.success("Item deleted.");
    setDeleting(null);
    router.refresh();
  }

  return (
    <div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-copper px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          <Plus size={16} /> New item
        </button>
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface-1">
        {items.map((it, i) => {
          const m = kindMeta(it.kind);
          const Icon = m.icon;
          return (
            <div
              key={it.id}
              className={cn(
                "flex items-center gap-3 px-4 py-3 sm:px-5",
                i > 0 && "border-t border-border",
                !it.published && "opacity-70"
              )}
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-2 text-ink/50">
                {it.cover_image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={it.cover_image_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <Icon size={18} />
                )}
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-2 truncate font-medium text-ink">
                  {it.title}
                  {!it.published && (
                    <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink/50">
                      Draft
                    </span>
                  )}
                </p>
                <p className="truncate text-xs text-ink/50">
                  {m.label}
                  {it.author ? ` · ${it.author}` : ""}
                  {it.category ? ` · ${it.category}` : ""}
                  {formatDuration(it.duration_seconds)
                    ? ` · ${formatDuration(it.duration_seconds)}`
                    : ""}
                </p>
              </div>
              <button
                type="button"
                onClick={() => togglePublish(it)}
                title={it.published ? "Unpublish" : "Publish"}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition",
                  it.published
                    ? "border border-border text-ink/70 hover:bg-parchment"
                    : "bg-copper text-white hover:opacity-90"
                )}
              >
                {it.published ? <EyeOff size={14} /> : <Send size={14} />}
                <span className="hidden sm:inline">
                  {it.published ? "Unpublish" : "Publish"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => openEdit(it)}
                aria-label="Edit"
                className="rounded-lg border border-border p-2 text-ink/70 transition hover:bg-parchment"
              >
                <Pencil size={15} />
              </button>
              <button
                type="button"
                onClick={() => setDeleting(it)}
                aria-label="Delete"
                className="rounded-lg border border-border p-2 text-oxblood transition hover:bg-oxblood/10"
              >
                <Trash2 size={15} />
              </button>
            </div>
          );
        })}
        {items.length === 0 && (
          <div className="flex flex-col items-center gap-2 px-5 py-16 text-center">
            <BookText className="text-copper" size={28} />
            <p className="font-display text-lg text-ink">No library items yet</p>
            <p className="text-sm text-ink/60">
              Add a book, manual, sermon, or message for the mobile Library.
            </p>
          </div>
        )}
      </div>

      {/* Editor */}
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? "Edit item" : "New item"}
        side="right"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink">Type</label>
            <select
              value={kind}
              onChange={(e) => setKind(e.target.value as LibraryKind)}
              className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-ink outline-none focus:border-copper"
            >
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="The Weight of Glory"
              className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-ink outline-none focus:border-copper"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink">
                {kind === "audio" || kind === "video" ? "Speaker" : "Author"}
              </label>
              <input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="Pastor John"
                className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-ink outline-none focus:border-copper"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">
                Category
              </label>
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="September 2026"
                className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-ink outline-none focus:border-copper"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="A short summary."
              className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-ink outline-none focus:border-copper"
            />
          </div>

          {/* Cover */}
          <div>
            <label className="block text-sm font-medium text-ink">
              Cover image
            </label>
            <div className="mt-1 flex items-center gap-3">
              <span className="flex h-16 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-surface-2 text-ink/40">
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <BookText size={18} />
                )}
              </span>
              <input
                ref={coverRef}
                type="file"
                accept="image/*"
                hidden
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) onCover(f);
                }}
              />
              <button
                type="button"
                disabled={uploadingCover}
                onClick={() => coverRef.current?.click()}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm text-ink/70 transition hover:bg-parchment disabled:opacity-50"
              >
                {uploadingCover ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <UploadCloud size={15} />
                )}
                {uploadingCover ? "Uploading..." : "Upload cover"}
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="rounded-xl border border-border bg-parchment/40 p-3">
            <p className="text-sm font-medium text-ink">Content</p>

            {meta.external && (
              <div className="mt-2">
                <label className="block text-xs font-medium text-ink/70">
                  Video URL (YouTube or external)
                </label>
                <input
                  value={externalUrl}
                  onChange={(e) => setExternalUrl(e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-ink outline-none focus:border-copper"
                />
                <p className="mt-1 text-center text-xs text-ink/40">
                  — or upload a file —
                </p>
              </div>
            )}

            <input
              ref={fileRef}
              type="file"
              accept={meta.accept}
              hidden
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onContentFile(f);
              }}
            />
            <button
              type="button"
              disabled={uploadingFile}
              onClick={() => fileRef.current?.click()}
              className="mt-2 inline-flex items-center gap-2 rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-ink/70 transition hover:bg-parchment disabled:opacity-50"
            >
              {uploadingFile ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <UploadCloud size={15} />
              )}
              {uploadingFile ? "Uploading..." : `Upload ${meta.fileLabel}`}
            </button>

            {fileUrl && (
              <a
                href={fileUrl}
                target="_blank"
                rel="noreferrer"
                className="mt-2 flex items-center gap-1.5 truncate text-xs text-copper hover:underline"
              >
                <ExternalLink size={12} /> Current file attached
              </a>
            )}

            {meta.media && (
              <div className="mt-3">
                <label className="block text-xs font-medium text-ink/70">
                  Duration (seconds)
                </label>
                <input
                  type="number"
                  min={0}
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="auto-filled from the file"
                  className="mt-1 w-40 rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-ink outline-none focus:border-copper"
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 border-t border-border pt-4">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-border px-4 py-2 text-sm text-ink transition hover:bg-parchment"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={saving || uploadingCover || uploadingFile}
              onClick={save}
              className="rounded-lg bg-copper px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Save" : "Create item"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Delete confirm */}
      <Modal
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        title="Delete item?"
      >
        <p className="text-sm text-ink/70">
          This permanently deletes “{deleting?.title}”. The uploaded file stays in
          storage. This cannot be undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setDeleting(null)}
            className="rounded-lg border border-border px-4 py-2 text-sm text-ink transition hover:bg-parchment"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirmDelete}
            className="rounded-lg bg-oxblood px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
