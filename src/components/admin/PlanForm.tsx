"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ImagePlus, Loader2, X } from "lucide-react";
import { savePlan } from "@/app/(admin)/reading-plans/actions";
import { createClient } from "@/lib/supabase/client";
import type { PlanDifficulty, Tables } from "@/lib/db";

type Plan = Pick<
  Tables<"reading_plans">,
  | "id"
  | "title"
  | "slug"
  | "description"
  | "length_days"
  | "difficulty"
  | "sequence_locked"
  | "cover_image_url"
>;

const COVER_BUCKET = "reading-plan-covers";

const DIFFICULTIES: { value: PlanDifficulty; label: string }[] = [
  { value: "starter", label: "Starter" },
  { value: "intermediate", label: "Intermediate" },
  { value: "deep", label: "Deep" },
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

export function PlanForm({
  initial,
  mode,
}: {
  initial: Plan | null;
  mode: "create" | "edit";
}) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState(initial?.title ?? "");
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [slugTouched, setSlugTouched] = useState(!!initial?.slug);
  const [description, setDescription] = useState(initial?.description ?? "");
  const [lengthDays, setLengthDays] = useState(
    initial?.length_days?.toString() ?? "7"
  );
  const [difficulty, setDifficulty] = useState<PlanDifficulty | "">(
    (initial?.difficulty as PlanDifficulty | null) ?? "starter"
  );
  const [sequenceLocked, setSequenceLocked] = useState(
    initial?.sequence_locked ?? true
  );
  const [coverUrl, setCoverUrl] = useState(initial?.cover_image_url ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  function onTitle(value: string) {
    setTitle(value);
    if (!slugTouched) setSlug(slugify(value));
  }

  async function onUpload(file: File) {
    setUploading(true);
    const supabase = createClient();
    const ext = file.name.split(".").pop() ?? "jpg";
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from(COVER_BUCKET)
      .upload(path, file, { upsert: true, contentType: file.type });
    setUploading(false);
    if (error) {
      toast.error(
        `Upload failed: ${error.message}. You can paste an image URL instead.`
      );
      return;
    }
    const { data } = supabase.storage.from(COVER_BUCKET).getPublicUrl(path);
    setCoverUrl(data.publicUrl);
    toast.success("Cover uploaded.");
  }

  async function onSave() {
    setSaving(true);
    const result = await savePlan({
      id: initial?.id,
      title,
      slug,
      description,
      lengthDays: Number(lengthDays) || 1,
      difficulty: difficulty || null,
      sequenceLocked,
      coverImageUrl: coverUrl || null,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    if (mode === "create" && result.data) {
      toast.success("Plan created. Now add its days.");
      router.push(`/reading-plans/${result.data.id}/edit`);
    } else {
      toast.success("Saved.");
      router.refresh();
    }
  }

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <label className="block text-sm font-medium text-ink">Title</label>
        <input
          value={title}
          onChange={(e) => onTitle(e.target.value)}
          placeholder="First 7 Days with Jesus"
          className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 font-display text-xl text-ink outline-none focus:border-copper"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-ink">Slug</label>
          <input
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugTouched(true);
            }}
            placeholder="first-7-days"
            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink outline-none focus:border-copper"
          />
          <p className="mt-1 text-xs text-ink/50">
            Lowercase letters, numbers, hyphens.
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium text-ink">
            Length (days)
          </label>
          <input
            type="number"
            min={1}
            max={365}
            value={lengthDays}
            onChange={(e) => setLengthDays(e.target.value)}
            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink outline-none focus:border-copper"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="A gentle first week for new believers."
          className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink outline-none focus:border-copper"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-ink">
            Difficulty
          </label>
          <select
            value={difficulty}
            onChange={(e) =>
              setDifficulty(e.target.value as PlanDifficulty | "")
            }
            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink outline-none focus:border-copper"
          >
            <option value="">None</option>
            {DIFFICULTIES.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-end">
          <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-white px-3 py-2.5 text-sm text-ink">
            <input
              type="checkbox"
              checked={sequenceLocked}
              onChange={(e) => setSequenceLocked(e.target.checked)}
              className="accent-copper"
            />
            Sequence locked
            <span
              className="text-ink/40"
              title="When on, members must complete days in order."
            >
              (in order)
            </span>
          </label>
        </div>
      </div>

      {/* Cover */}
      <div>
        <label className="block text-sm font-medium text-ink">
          Cover image
        </label>
        <div className="mt-1 flex items-start gap-3">
          <div className="relative h-24 w-40 shrink-0 overflow-hidden rounded-lg border border-border bg-surface-2">
            {coverUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={coverUrl}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setCoverUrl("")}
                  aria-label="Remove cover"
                  className="absolute right-1 top-1 rounded-md bg-ink/60 p-1 text-white"
                >
                  <X size={12} />
                </button>
              </>
            ) : (
              <div className="flex h-full w-full items-center justify-center text-ink/30">
                <ImagePlus size={22} />
              </div>
            )}
          </div>
          <div className="flex-1 space-y-2">
            <input
              value={coverUrl}
              onChange={(e) => setCoverUrl(e.target.value)}
              placeholder="https://... or upload"
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-sm text-ink outline-none focus:border-copper"
            />
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
              }}
            />
            <button
              type="button"
              disabled={uploading}
              onClick={() => fileRef.current?.click()}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-ink/70 transition hover:bg-parchment disabled:opacity-50"
            >
              {uploading ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <ImagePlus size={14} />
              )}
              {uploading ? "Uploading..." : "Upload image"}
            </button>
          </div>
        </div>
      </div>

      <div className="border-t border-border pt-5">
        <button
          type="button"
          disabled={saving}
          onClick={onSave}
          className="inline-flex items-center gap-2 rounded-lg bg-copper px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {mode === "create" ? "Create plan" : "Save changes"}
        </button>
      </div>
    </div>
  );
}
