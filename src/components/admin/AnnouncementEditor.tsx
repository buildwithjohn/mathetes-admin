"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { marked } from "marked";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import {
  Trash2,
  Plus,
  X,
  Save,
  CalendarClock,
  Send,
  Calendar,
  MapPin,
} from "lucide-react";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { Modal } from "@/components/admin/Modal";
import {
  saveAnnouncement,
  deleteAnnouncement,
} from "@/app/(admin)/announcements/actions";
import type {
  AnnouncementBanner,
  ContentStatus,
  Tables,
} from "@/lib/database.types";

type Initial = Pick<
  Tables<"announcements">,
  | "id"
  | "title"
  | "body_md"
  | "banner"
  | "event_data"
  | "photos"
  | "publish_date"
  | "status"
> | null;

type EventData = { date?: string; time?: string; location?: string };

function readEvent(value: Tables<"announcements">["event_data"]): EventData {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    const v = value as Record<string, unknown>;
    return {
      date: typeof v.date === "string" ? v.date : "",
      time: typeof v.time === "string" ? v.time : "",
      location: typeof v.location === "string" ? v.location : "",
    };
  }
  return { date: "", time: "", location: "" };
}

const BANNERS: { value: AnnouncementBanner | ""; label: string }[] = [
  { value: "", label: "None" },
  { value: "event", label: "Event" },
  { value: "urgent", label: "Urgent" },
];

export function AnnouncementEditor({ initial }: { initial: Initial }) {
  const router = useRouter();

  const [id, setId] = useState<string | undefined>(initial?.id);
  const [title, setTitle] = useState(initial?.title ?? "");
  const [bodyMd, setBodyMd] = useState(initial?.body_md ?? "");
  const [banner, setBanner] = useState<AnnouncementBanner | "">(
    initial?.banner ?? ""
  );
  const initialEvent = readEvent(initial?.event_data ?? null);
  const [hasEvent, setHasEvent] = useState(
    !!(initialEvent.date || initialEvent.time || initialEvent.location)
  );
  const [eventDate, setEventDate] = useState(initialEvent.date ?? "");
  const [eventTime, setEventTime] = useState(initialEvent.time ?? "");
  const [eventLocation, setEventLocation] = useState(
    initialEvent.location ?? ""
  );
  const [photos, setPhotos] = useState<string[]>(initial?.photos ?? []);
  const [photoInput, setPhotoInput] = useState("");
  const [publishDate, setPublishDate] = useState(initial?.publish_date ?? "");

  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  function addPhoto() {
    const url = photoInput.trim();
    if (!url) return;
    setPhotos((prev) => [...prev, url]);
    setPhotoInput("");
  }

  async function persist(status: ContentStatus) {
    if (!title.trim()) {
      toast.error("Add a title before saving.");
      return;
    }
    setSaving(true);
    const result = await saveAnnouncement({
      id,
      title,
      bodyMd,
      banner: banner || null,
      event: hasEvent
        ? { date: eventDate, time: eventTime, location: eventLocation }
        : null,
      photos,
      publishDate: publishDate || null,
      status,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    setId(result.id);
    toast.success(
      status === "published"
        ? "Posted."
        : status === "scheduled"
          ? "Scheduled."
          : "Draft saved."
    );
    router.push("/announcements");
    router.refresh();
  }

  async function onDelete() {
    if (!id) return;
    const result = await deleteAnnouncement(id);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Announcement deleted.");
    router.push("/announcements");
    router.refresh();
  }

  const previewHtml = useMemo(
    () => marked.parse(bodyMd || "_Nothing written yet._", { async: false }),
    [bodyMd]
  );

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-ink">Title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Parish thanksgiving service"
            className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 font-display text-xl text-ink outline-none focus:border-copper"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-ink">Body</label>
          <div className="mt-1">
            <RichTextEditor value={bodyMd} onChange={setBodyMd} />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-ink">Banner</label>
            <select
              value={banner}
              onChange={(e) =>
                setBanner(e.target.value as AnnouncementBanner | "")
              }
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink outline-none focus:border-copper"
            >
              {BANNERS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-ink">
              Publish date
            </label>
            <input
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-white px-3 py-2 text-ink outline-none focus:border-copper"
            />
          </div>
        </div>

        {/* Event details */}
        <div className="rounded-xl border border-border bg-white p-4">
          <label className="flex items-center gap-2 text-sm font-medium text-ink">
            <input
              type="checkbox"
              checked={hasEvent}
              onChange={(e) => setHasEvent(e.target.checked)}
              className="accent-copper"
            />
            Attach event details
          </label>
          {hasEvent && (
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-xs text-ink/60">Date</label>
                <input
                  type="date"
                  value={eventDate}
                  onChange={(e) => setEventDate(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-parchment px-3 py-2 text-ink outline-none focus:border-copper"
                />
              </div>
              <div>
                <label className="block text-xs text-ink/60">Time</label>
                <input
                  type="time"
                  value={eventTime}
                  onChange={(e) => setEventTime(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-border bg-parchment px-3 py-2 text-ink outline-none focus:border-copper"
                />
              </div>
              <div>
                <label className="block text-xs text-ink/60">Location</label>
                <input
                  value={eventLocation}
                  onChange={(e) => setEventLocation(e.target.value)}
                  placeholder="Main auditorium"
                  className="mt-1 w-full rounded-lg border border-border bg-parchment px-3 py-2 text-ink outline-none focus:border-copper"
                />
              </div>
            </div>
          )}
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm font-medium text-ink">
            Photos <span className="text-ink/40">(image URLs)</span>
          </label>
          <div className="mt-1 flex gap-2">
            <input
              value={photoInput}
              onChange={(e) => setPhotoInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addPhoto();
                }
              }}
              placeholder="https://..."
              className="w-full rounded-lg border border-border bg-white px-3 py-2 text-ink outline-none focus:border-copper"
            />
            <button
              type="button"
              onClick={addPhoto}
              className="shrink-0 rounded-lg border border-border px-3 text-ink/70 transition hover:bg-parchment"
            >
              <Plus size={16} />
            </button>
          </div>
          {photos.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {photos.map((url, i) => (
                <span
                  key={`${url}-${i}`}
                  className="inline-flex max-w-full items-center gap-1 rounded-full bg-parchment px-2.5 py-1 text-xs text-ink/70"
                >
                  <span className="truncate max-w-[14rem]">{url}</span>
                  <button
                    type="button"
                    onClick={() =>
                      setPhotos((prev) => prev.filter((_, idx) => idx !== i))
                    }
                    aria-label="Remove photo"
                  >
                    <X size={13} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-border pt-5">
          <button
            type="button"
            disabled={saving}
            onClick={() => persist("draft")}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-white px-4 py-2 text-sm font-medium text-ink transition hover:bg-parchment disabled:opacity-50"
          >
            <Save size={16} /> Save draft
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => persist("scheduled")}
            className="inline-flex items-center gap-2 rounded-lg border border-copper/40 bg-copper/10 px-4 py-2 text-sm font-medium text-copper transition hover:bg-copper/20 disabled:opacity-50"
          >
            <CalendarClock size={16} /> Schedule
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => persist("published")}
            className="inline-flex items-center gap-2 rounded-lg bg-copper px-4 py-2 text-sm font-medium text-parchment transition hover:opacity-90 disabled:opacity-50"
          >
            <Send size={16} /> Post now
          </button>
          {id && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              title="Delete announcement"
              className="ml-auto rounded-lg border border-border p-2 text-oxblood transition hover:bg-oxblood/10"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      {/* Preview */}
      <aside className="lg:sticky lg:top-8 lg:self-start">
        <p className="mb-2 text-xs uppercase tracking-widest text-copper">
          Mobile preview
        </p>
        <div className="overflow-hidden rounded-[2rem] border-[6px] border-ink/80 bg-parchment shadow-sm">
          <div className="max-h-[70vh] overflow-y-auto p-5">
            {banner && (
              <span
                className={
                  "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide " +
                  (banner === "urgent"
                    ? "bg-oxblood/15 text-oxblood"
                    : "bg-copper/15 text-copper")
                }
              >
                {banner}
              </span>
            )}
            <h1 className="mt-2 font-display text-2xl text-ink">
              {title || "Untitled announcement"}
            </h1>
            <div
              className="devotional-preview mt-3"
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
            {hasEvent && (eventDate || eventTime || eventLocation) && (
              <div className="mt-4 rounded-xl border border-border bg-white p-3 text-sm">
                {(eventDate || eventTime) && (
                  <p className="flex items-center gap-2 text-ink">
                    <Calendar size={14} className="text-copper" />
                    {eventDate
                      ? format(parseISO(eventDate), "EEE, MMM d yyyy")
                      : ""}
                    {eventTime ? ` · ${eventTime}` : ""}
                  </p>
                )}
                {eventLocation && (
                  <p className="mt-1 flex items-center gap-2 text-ink">
                    <MapPin size={14} className="text-copper" />
                    {eventLocation}
                  </p>
                )}
              </div>
            )}
            {photos.length > 0 && (
              <div className="mt-3 grid grid-cols-2 gap-2">
                {photos.slice(0, 4).map((url, i) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={`${url}-${i}`}
                    src={url}
                    alt=""
                    className="aspect-square w-full rounded-lg object-cover"
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete announcement?"
      >
        <p className="text-sm text-ink/70">
          This permanently removes “{title || "this announcement"}”. This cannot
          be undone.
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
