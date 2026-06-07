"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { marked } from "marked";
import { toast } from "sonner";
import { format } from "date-fns";
import { Trash2, Plus, X, Save, CalendarClock, Send } from "lucide-react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Modal } from "@/components/admin/Modal";
import {
  saveDevotional,
  deleteDevotional,
  createSeries,
} from "@/app/(admin)/devotionals/actions";
import { readingTimeMinutes } from "@/lib/content";
import type { ContentStatus, Tables } from "@/lib/database.types";

type SeriesOption = Pick<Tables<"devotional_series">, "id" | "title">;
type InitialDevotional = Pick<
  Tables<"devotionals">,
  | "id"
  | "title"
  | "series_id"
  | "day_in_series"
  | "body_md"
  | "scripture_refs"
  | "reading_time_minutes"
  | "publish_date"
  | "status"
>;

export function DevotionalEditor({
  initial,
  series,
}: {
  initial: InitialDevotional | null;
  series: SeriesOption[];
}) {
  const router = useRouter();

  const [id, setId] = useState<string | undefined>(initial?.id);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [seriesId, setSeriesId] = useState(initial?.series_id ?? "");
  const [dayInSeries, setDayInSeries] = useState(
    initial?.day_in_series?.toString() ?? ""
  );
  const [bodyMd, setBodyMd] = useState(initial?.body_md ?? "");
  const [scriptureRefs, setScriptureRefs] = useState<string[]>(
    initial?.scripture_refs ?? []
  );
  const [refInput, setRefInput] = useState("");
  const [readingTime, setReadingTime] = useState(
    initial?.reading_time_minutes?.toString() ?? ""
  );
  const [readingTouched, setReadingTouched] = useState(
    initial?.reading_time_minutes != null
  );
  const [publishDate, setPublishDate] = useState(initial?.publish_date ?? "");

  const [seriesList, setSeriesList] = useState<SeriesOption[]>(series);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newSeriesOpen, setNewSeriesOpen] = useState(false);
  const [newSeriesTitle, setNewSeriesTitle] = useState("");

  // Keep the latest values available to the autosave interval without
  // re-subscribing on every keystroke.
  const stateRef = useRef<{
    values: () => Parameters<typeof saveDevotional>[0];
    dirty: boolean;
    saving: boolean;
  }>({ values: () => ({ title: "", status: "draft" }), dirty, saving });

  const markDirty = () => setDirty(true);

  const onBodyChange = useCallback(
    (md: string) => {
      setBodyMd(md);
      setDirty(true);
      if (!readingTouched) {
        const mins = readingTimeMinutes(md);
        setReadingTime(mins ? mins.toString() : "");
      }
    },
    [readingTouched]
  );

  function addRef(raw: string) {
    const parts = raw
      .split(",")
      .map((r) => r.trim())
      .filter(Boolean);
    if (parts.length === 0) return;
    setScriptureRefs((prev) => [...new Set([...prev, ...parts])]);
    setRefInput("");
    markDirty();
  }

  function removeRef(ref: string) {
    setScriptureRefs((prev) => prev.filter((r) => r !== ref));
    markDirty();
  }

  const buildValues = useCallback(
    (status: ContentStatus): Parameters<typeof saveDevotional>[0] => ({
      id,
      title,
      seriesId: seriesId || null,
      dayInSeries: dayInSeries ? Number(dayInSeries) : null,
      bodyMd,
      scriptureRefs,
      readingTimeMinutes: readingTime ? Number(readingTime) : null,
      publishDate: publishDate || null,
      status,
    }),
    [
      id,
      title,
      seriesId,
      dayInSeries,
      bodyMd,
      scriptureRefs,
      readingTime,
      publishDate,
    ]
  );

  const currentStatus: ContentStatus = initial?.status ?? "draft";

  async function persist(
    status: ContentStatus,
    { navigate }: { navigate: boolean }
  ) {
    if (!title.trim()) {
      toast.error("Add a title before saving.");
      return;
    }
    setSaving(true);
    const result = await saveDevotional(buildValues(status));
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setId(result.id);
    setDirty(false);
    setLastSavedAt(new Date());
    if (!id && !navigate) {
      // First save of a brand-new devotional: reflect the id in the URL so a
      // refresh lands on the edit route, without remounting the editor.
      window.history.replaceState(null, "", `/devotionals/${result.id}`);
    }
    if (navigate) {
      const label =
        status === "published"
          ? "Published."
          : status === "scheduled"
            ? "Scheduled."
            : "Draft saved.";
      toast.success(label);
      router.push("/devotionals");
      router.refresh();
    }
  }

  // Autosave drafts every 30s while there are unsaved changes.
  useEffect(() => {
    stateRef.current = {
      values: () => buildValues(currentStatus),
      dirty,
      saving,
    };
  });
  useEffect(() => {
    const interval = setInterval(async () => {
      const s = stateRef.current;
      const values = s.values();
      if (!s.dirty || s.saving || !values.title?.trim()) return;
      setSaving(true);
      const result = await saveDevotional(values);
      setSaving(false);
      if (result.ok) {
        setId((prev) => {
          if (!prev) {
            window.history.replaceState(
              null,
              "",
              `/devotionals/${result.id}`
            );
          }
          return result.id;
        });
        setDirty(false);
        setLastSavedAt(new Date());
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  // Warn before leaving with unsaved changes.
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  async function onCreateSeries() {
    const result = await createSeries(newSeriesTitle);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const opt = { id: result.id, title: newSeriesTitle.trim() };
    setSeriesList((prev) => [...prev, opt]);
    setSeriesId(result.id);
    setNewSeriesTitle("");
    setNewSeriesOpen(false);
    markDirty();
    toast.success("Series created.");
  }

  async function onDelete() {
    if (!id) return;
    const result = await deleteDevotional(id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Devotional deleted.");
    router.push("/devotionals");
    router.refresh();
  }

  const previewHtml = useMemo(
    () => marked.parse(bodyMd || "_Nothing written yet._", { async: false }),
    [bodyMd]
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      {/* Editor column */}
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-ink">Title</label>
          <input
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              markDirty();
            }}
            placeholder="The weight of small obediences"
            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 font-display text-xl text-ink outline-none focus:border-copper"
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-ink">Series</label>
            <div className="mt-1 flex gap-2">
              <select
                value={seriesId}
                onChange={(e) => {
                  setSeriesId(e.target.value);
                  markDirty();
                }}
                className="w-full rounded-lg border border-border bg-white px-3 py-2 text-ink outline-none focus:border-copper"
              >
                <option value="">No series</option>
                {seriesList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.title}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => setNewSeriesOpen(true)}
                title="Create series"
                className="shrink-0 rounded-lg border border-border px-3 text-ink/70 transition hover:bg-parchment"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">
              Day in series
            </label>
            <input
              type="number"
              min={1}
              value={dayInSeries}
              onChange={(e) => {
                setDayInSeries(e.target.value);
                markDirty();
              }}
              placeholder="e.g. 3"
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink outline-none focus:border-copper"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-ink">Body</label>
          <p className="mb-1 text-xs text-ink/50">
            Use the Scripture block for verses (oxblood border on mobile).
          </p>
          <RichTextEditor value={bodyMd} onChange={onBodyChange} />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink">
            Scripture references
          </label>
          <div className="mt-1 flex flex-wrap items-center gap-2 rounded-lg border border-border bg-white px-2 py-2">
            {scriptureRefs.map((ref) => (
              <span
                key={ref}
                className="inline-flex items-center gap-1 rounded-full bg-oxblood/10 px-2.5 py-1 text-sm text-oxblood"
              >
                {ref}
                <button
                  type="button"
                  onClick={() => removeRef(ref)}
                  aria-label={`Remove ${ref}`}
                >
                  <X size={13} />
                </button>
              </span>
            ))}
            <input
              value={refInput}
              onChange={(e) => setRefInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addRef(refInput);
                }
              }}
              onBlur={() => refInput.trim() && addRef(refInput)}
              placeholder={
                scriptureRefs.length ? "" : "Proverbs 3:5, John 3:16"
              }
              className="min-w-[8rem] flex-1 bg-transparent px-1 py-1 text-ink outline-none"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-ink">
              Reading time (minutes)
            </label>
            <input
              type="number"
              min={1}
              value={readingTime}
              onChange={(e) => {
                setReadingTime(e.target.value);
                setReadingTouched(true);
                markDirty();
              }}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink outline-none focus:border-copper"
            />
            <p className="mt-1 text-xs text-ink/50">
              Auto-calculated from word count. Override if needed.
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">
              Publish date
            </label>
            <input
              type="date"
              value={publishDate}
              onChange={(e) => {
                setPublishDate(e.target.value);
                markDirty();
              }}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink outline-none focus:border-copper"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
          <button
            type="button"
            disabled={saving}
            onClick={() => persist("draft", { navigate: true })}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-ink transition hover:bg-parchment disabled:opacity-50"
          >
            <Save size={16} /> Save draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => persist("scheduled", { navigate: true })}
            className="inline-flex items-center gap-2 rounded-lg border border-copper/40 bg-copper/10 px-4 py-2 text-sm font-medium text-copper transition hover:bg-copper/20 disabled:opacity-50"
          >
            <CalendarClock size={16} /> Schedule
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => persist("published", { navigate: true })}
            className="inline-flex items-center gap-2 rounded-lg bg-copper px-4 py-2 text-sm font-medium text-parchment transition hover:opacity-90 disabled:opacity-50"
          >
            <Send size={16} /> Publish now
          </button>

          <span className="ml-auto text-xs text-ink/50">
            {saving
              ? "Saving..."
              : lastSavedAt
                ? `Saved ${format(lastSavedAt, "h:mm a")}`
                : dirty
                  ? "Unsaved changes"
                  : ""}
          </span>

          {id && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              title="Delete devotional"
              className="rounded-lg border border-border p-2 text-oxblood transition hover:bg-oxblood/10"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Preview column */}
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <p className="mb-2 text-xs uppercase tracking-widest text-copper">
          Mobile preview
        </p>
        <div className="overflow-hidden rounded-[2rem] border-[6px] border-ink/80 bg-parchment shadow-sm">
          <div className="max-h-[70vh] overflow-y-auto p-5">
            {currentStatus && (
              <span className="text-xs uppercase tracking-widest text-copper">
                Devotional
              </span>
            )}
            <h1 className="mt-1 font-display text-2xl text-ink">
              {title || "Untitled devotional"}
            </h1>
            {(readingTime || scriptureRefs.length > 0) && (
              <p className="mt-1 text-xs text-ink/50">
                {readingTime ? `${readingTime} min read` : ""}
                {readingTime && scriptureRefs.length ? " · " : ""}
                {scriptureRefs.join(", ")}
              </p>
            )}
            <div
              className="devotional-preview mt-4"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </div>
      </aside>

      {/* New series modal */}
      <Modal
        open={newSeriesOpen}
        onClose={() => setNewSeriesOpen(false)}
        title="New series"
      >
        <label className="block text-sm font-medium text-ink">
          Series title
        </label>
        <input
          autoFocus
          value={newSeriesTitle}
          onChange={(e) => setNewSeriesTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onCreateSeries()}
          placeholder="Walking in the Spirit"
          className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink outline-none focus:border-copper"
        />
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setNewSeriesOpen(false)}
            className="rounded-lg border border-border px-4 py-2 text-sm text-ink transition hover:bg-parchment"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onCreateSeries}
            className="rounded-lg bg-copper px-4 py-2 text-sm font-medium text-parchment transition hover:opacity-90"
          >
            Create
          </button>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete devotional?"
      >
        <p className="text-sm text-ink/70">
          This permanently removes “{title || "this devotional"}”. This cannot be
          undone.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => setConfirmDelete(false)}
            className="rounded-lg border border-border px-4 py-2 text-sm text-ink transition hover:bg-parchment"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="rounded-lg bg-oxblood px-4 py-2 text-sm font-medium text-parchment transition hover:opacity-90"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
