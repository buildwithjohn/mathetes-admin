"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Sparkles, Headphones, BookText, Loader2, Save } from "lucide-react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import {
  saveDay,
  fetchScripture,
} from "@/app/(admin)/reading-plans/actions";
import type { Tables } from "@/lib/db";

type Day = Pick<
  Tables<"reading_plan_days">,
  | "id"
  | "day_number"
  | "title"
  | "scripture_reference"
  | "scripture_text"
  | "reflection_body"
  | "reflection_prompt"
  | "audio_url"
  | "devotional_id"
>;
type DevotionalOption = Pick<Tables<"devotionals">, "id" | "title">;

export function DayEditor({
  planId,
  totalDays,
  day,
  devotionals,
}: {
  planId: string;
  totalDays: number;
  day: Day;
  devotionals: DevotionalOption[];
}) {
  const router = useRouter();

  const [title, setTitle] = useState(day.title);
  const [scriptureRef, setScriptureRef] = useState(day.scripture_reference);
  const [scriptureText, setScriptureText] = useState(day.scripture_text ?? "");
  const [reflectionBody, setReflectionBody] = useState(day.reflection_body);
  const [reflectionPrompt, setReflectionPrompt] = useState(
    day.reflection_prompt
  );
  const [audioUrl, setAudioUrl] = useState(day.audio_url ?? "");
  const [devotionalId, setDevotionalId] = useState(day.devotional_id ?? "");

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const mark = () => setDirty(true);

  const buildValues = useCallback(
    () => ({
      id: day.id,
      planId,
      dayNumber: day.day_number,
      title,
      scriptureReference: scriptureRef,
      scriptureText: scriptureText || null,
      reflectionBody,
      reflectionPrompt,
      audioUrl: audioUrl || null,
      devotionalId: devotionalId || null,
    }),
    [
      day.id,
      day.day_number,
      planId,
      title,
      scriptureRef,
      scriptureText,
      reflectionBody,
      reflectionPrompt,
      audioUrl,
      devotionalId,
    ]
  );

  const stateRef = useRef(buildValues);
  useEffect(() => {
    stateRef.current = buildValues;
  });

  async function persist(opts: { navigate?: boolean } = {}) {
    setSaving(true);
    const result = await saveDay(buildValues());
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setDirty(false);
    setLastSavedAt(new Date());
    if (opts.navigate) {
      toast.success("Day saved.");
      router.push(`/reading-plans/${planId}/edit`);
      router.refresh();
    }
  }

  // Autosave every 30s when dirty.
  useEffect(() => {
    const id = setInterval(async () => {
      if (!dirty || saving) return;
      setSaving(true);
      const result = await saveDay(stateRef.current());
      setSaving(false);
      if (result.ok) {
        setDirty(false);
        setLastSavedAt(new Date());
      }
    }, 30_000);
    return () => clearInterval(id);
  }, [dirty, saving]);

  useEffect(() => {
    const h = (e: BeforeUnloadEvent) => {
      if (dirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty]);

  async function onFetchScripture() {
    if (!scriptureRef.trim()) {
      toast.error("Enter a reference first.");
      return;
    }
    setFetching(true);
    const result = await fetchScripture(scriptureRef);
    setFetching(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setScriptureText(result.data!.text);
    mark();
    toast.success("Fetched from KJV.");
  }

  const onBody = useCallback((md: string) => {
    setReflectionBody(md);
    setDirty(true);
  }, []);

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <label className="block text-sm font-medium text-ink">Title</label>
        <input
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            mark();
          }}
          placeholder={`Day ${day.day_number}`}
          className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 font-display text-xl text-ink outline-none focus:border-copper"
        />
      </div>

      <div>
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-ink">
            Scripture reference
          </label>
          <button
            type="button"
            disabled={fetching}
            onClick={onFetchScripture}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-copper transition hover:underline disabled:opacity-50"
          >
            {fetching ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <Sparkles size={13} />
            )}
            Fetch from KJV
          </button>
        </div>
        <input
          value={scriptureRef}
          onChange={(e) => {
            setScriptureRef(e.target.value);
            mark();
          }}
          placeholder="John 3:16"
          className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink outline-none focus:border-copper"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink">
          Scripture text
        </label>
        <textarea
          value={scriptureText}
          onChange={(e) => {
            setScriptureText(e.target.value);
            mark();
          }}
          rows={3}
          placeholder="Fetch from KJV, or paste the verse."
          className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 font-scripture text-ink outline-none focus:border-copper"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink">Reflection</label>
        <div className="mt-1">
          <RichTextEditor value={reflectionBody} onChange={onBody} />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink">
          Reflection prompt
        </label>
        <input
          value={reflectionPrompt}
          onChange={(e) => {
            setReflectionPrompt(e.target.value);
            mark();
          }}
          placeholder="Where is God asking you to trust him today?"
          className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink outline-none focus:border-copper"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-ink">
            <Headphones size={15} className="text-copper" /> Audio URL
            <span className="font-normal text-ink/40">(optional)</span>
          </label>
          <input
            type="url"
            value={audioUrl}
            onChange={(e) => {
              setAudioUrl(e.target.value);
              mark();
            }}
            placeholder="https://...mp3"
            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink outline-none focus:border-copper"
          />
        </div>
        <div>
          <label className="flex items-center gap-1.5 text-sm font-medium text-ink">
            <BookText size={15} className="text-copper" /> Linked devotional
            <span className="font-normal text-ink/40">(optional)</span>
          </label>
          <select
            value={devotionalId}
            onChange={(e) => {
              setDevotionalId(e.target.value);
              mark();
            }}
            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink outline-none focus:border-copper"
          >
            <option value="">None</option>
            {devotionals.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 border-t border-border pt-5">
        <button
          type="button"
          disabled={saving}
          onClick={() => persist({ navigate: true })}
          className="inline-flex items-center gap-2 rounded-lg bg-copper px-5 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          Save day
        </button>
        <span className="text-xs text-ink/50">
          Day {day.day_number} of {totalDays}
          {saving
            ? " · Saving..."
            : lastSavedAt
              ? ` · Saved ${format(lastSavedAt, "h:mm a")}`
              : dirty
                ? " · Unsaved changes"
                : ""}
        </span>
      </div>
    </div>
  );
}
