"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addMonths,
  isSameMonth,
  isBefore,
  startOfDay,
} from "date-fns";
import { toast } from "sonner";
import { Sparkles, Trash2 } from "lucide-react";
import { Modal } from "@/components/admin/Modal";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { saveWordOfDay, deleteWordOfDay } from "@/app/(admin)/word-of-day/actions";
import type { ContentStatus, Tables } from "@/lib/db";
import { cn } from "@/utils/cn";

type Wotd = Pick<
  Tables<"word_of_day">,
  | "id"
  | "verse_ref"
  | "verse_text"
  | "reflection_md"
  | "prayer_md"
  | "prompt"
  | "publish_date"
  | "status"
>;

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

export function WordOfDayCalendar({
  existing,
  todayStr,
  monthsToShow,
}: {
  existing: Wotd[];
  todayStr: string;
  monthsToShow: number;
}) {
  const router = useRouter();
  const today = startOfDay(parseISO(todayStr));

  const [items, setItems] = useState<Map<string, Wotd>>(
    () => new Map(existing.map((w) => [w.publish_date as string, w]))
  );
  const [selected, setSelected] = useState<string | null>(null);

  // Composer field state
  const [verseRef, setVerseRef] = useState("");
  const [verseText, setVerseText] = useState("");
  const [reflection, setReflection] = useState("");
  const [prayer, setPrayer] = useState("");
  const [prompt, setPrompt] = useState("");
  const [editingId, setEditingId] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const months = useMemo(
    () => Array.from({ length: monthsToShow }, (_, i) => addMonths(today, i)),
    [today, monthsToShow]
  );

  function openDay(dateStr: string) {
    const w = items.get(dateStr);
    setSelected(dateStr);
    setEditingId(w?.id);
    setVerseRef(w?.verse_ref ?? "");
    setVerseText(w?.verse_text ?? "");
    setReflection(w?.reflection_md ?? "");
    setPrayer(w?.prayer_md ?? "");
    setPrompt(w?.prompt ?? "");
  }

  function close() {
    setSelected(null);
  }

  async function persist(status: ContentStatus) {
    if (!selected) return;
    setSaving(true);
    const result = await saveWordOfDay({
      id: editingId,
      verseRef,
      verseText,
      reflectionMd: reflection || null,
      prayerMd: prayer || null,
      prompt: prompt || null,
      publishDate: selected,
      status,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    const saved: Wotd = {
      id: result.id,
      verse_ref: verseRef,
      verse_text: verseText,
      reflection_md: reflection || null,
      prayer_md: prayer || null,
      prompt: prompt || null,
      publish_date: selected,
      status,
    };
    setItems((prev) => new Map(prev).set(selected, saved));
    toast.success(status === "published" ? "Published." : "Scheduled.");
    close();
    router.refresh();
  }

  async function onDelete() {
    if (!editingId || !selected) return;
    const result = await deleteWordOfDay(editingId);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setItems((prev) => {
      const next = new Map(prev);
      next.delete(selected);
      return next;
    });
    toast.success("Removed.");
    close();
    router.refresh();
  }

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-3">
        {months.map((month) => {
          const gridStart = startOfWeek(startOfMonth(month));
          const gridEnd = endOfWeek(endOfMonth(month));
          const days = eachDayOfInterval({ start: gridStart, end: gridEnd });
          return (
            <div
              key={month.toISOString()}
              className="rounded-2xl border border-border bg-white p-4"
            >
              <p className="mb-3 font-display text-lg text-ink">
                {format(month, "MMMM yyyy")}
              </p>
              <div className="grid grid-cols-7 gap-1 text-center text-xs text-ink/40">
                {WEEKDAYS.map((d, i) => (
                  <span key={i}>{d}</span>
                ))}
              </div>
              <div className="mt-1 grid grid-cols-7 gap-1">
                {days.map((day) => {
                  const dateStr = format(day, "yyyy-MM-dd");
                  const inMonth = isSameMonth(day, month);
                  const past = isBefore(day, today);
                  const w = items.get(dateStr);
                  const disabled = !inMonth || past;
                  return (
                    <button
                      key={dateStr}
                      type="button"
                      disabled={disabled}
                      onClick={() => openDay(dateStr)}
                      className={cn(
                        "flex aspect-square flex-col items-center justify-center rounded-lg text-sm transition",
                        disabled
                          ? "cursor-default text-ink/20"
                          : "hover:bg-parchment",
                        w?.status === "published" &&
                          "bg-house-bethany/15 text-house-bethany",
                        w?.status === "scheduled" &&
                          "bg-copper/10 text-copper",
                        w?.status === "draft" && "bg-parchment text-ink/70"
                      )}
                    >
                      <span>{format(day, "d")}</span>
                      {w && (
                        <span className="mt-0.5 h-1 w-1 rounded-full bg-current" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-ink/60">
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-house-bethany/40" /> Published
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-copper/30" /> Scheduled
        </span>
        <span className="flex items-center gap-1.5">
          <span className="h-3 w-3 rounded bg-parchment border border-border" />{" "}
          Draft
        </span>
      </div>

      <Modal
        open={selected !== null}
        onClose={close}
        title={
          selected
            ? format(parseISO(selected), "EEEE, MMMM d yyyy")
            : "Word of the Day"
        }
        side="right"
      >
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase tracking-widest text-copper">
              Word of the Day
            </span>
            {editingId && (
              <button
                type="button"
                onClick={onDelete}
                className="inline-flex items-center gap-1 text-sm text-oxblood hover:underline"
              >
                <Trash2 size={14} /> Remove
              </button>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-sm font-medium text-ink">
                Verse reference
              </label>
              <button
                type="button"
                disabled
                title="Available once the Bible is imported (Phase 3)"
                className="inline-flex cursor-not-allowed items-center gap-1 text-xs text-ink/40"
              >
                <Sparkles size={13} /> Generate from Bible
              </button>
            </div>
            <input
              value={verseRef}
              onChange={(e) => setVerseRef(e.target.value)}
              placeholder="Proverbs 3:5-6"
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink outline-none focus:border-copper"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">
              Verse text
            </label>
            <textarea
              value={verseText}
              onChange={(e) => setVerseText(e.target.value)}
              rows={3}
              placeholder="Trust in the LORD with all thine heart..."
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 font-scripture text-ink outline-none focus:border-copper"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">
              Reflection
            </label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value)}
              rows={5}
              placeholder="A short reflection from the pastor. Markdown supported."
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink outline-none focus:border-copper"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">
              Prayer guide <span className="text-ink/40">(optional)</span>
            </label>
            <textarea
              value={prayer}
              onChange={(e) => setPrayer(e.target.value)}
              rows={4}
              placeholder="A short prayer to guide the reader. Markdown supported. Shows as a 'Pray' block in the app."
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink outline-none focus:border-copper"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">
              Prompt <span className="text-ink/40">(optional)</span>
            </label>
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Where do you need to trust him today?"
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink outline-none focus:border-copper"
            />
          </div>

          {/* Mobile preview */}
          {(verseText || verseRef) && (
            <div className="rounded-xl border border-border bg-parchment p-4">
              <p className="text-xs uppercase tracking-widest text-copper">
                Preview
              </p>
              <p className="mt-2 font-scripture text-lg leading-relaxed text-ink">
                {verseText || "Verse text..."}
              </p>
              <p className="mt-2 text-sm font-medium text-oxblood">{verseRef}</p>
              {reflection && (
                <p className="mt-3 text-sm leading-relaxed text-ink/80">
                  {reflection}
                </p>
              )}
              {prayer && (
                <div className="mt-3 rounded-lg border border-copper/20 bg-copper/5 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-copper">
                    Pray
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-ink/80">
                    {prayer}
                  </p>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2 border-t border-border pt-4">
            <button
              type="button"
              disabled={saving}
              onClick={() => persist("draft")}
              className="rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-ink transition hover:bg-parchment disabled:opacity-50"
            >
              Save draft
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => persist("scheduled")}
              className="rounded-lg border border-copper/40 bg-copper/10 px-4 py-2 text-sm font-medium text-copper transition hover:bg-copper/20 disabled:opacity-50"
            >
              Schedule
            </button>
            <button
              type="button"
              disabled={saving}
              onClick={() => persist("published")}
              className="rounded-lg bg-copper px-4 py-2 text-sm font-medium text-parchment transition hover:opacity-90 disabled:opacity-50"
            >
              Publish
            </button>
            {editingId && (
              <StatusBadge
                status={items.get(selected ?? "")?.status ?? "draft"}
                className="ml-auto"
              />
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
