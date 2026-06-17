"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Archive,
  ArchiveRestore,
  Users,
  Crown,
  MapPin,
  Home,
} from "lucide-react";
import { Modal } from "@/components/admin/Modal";
import { saveHouse, setHouseArchived } from "@/app/(admin)/houses/actions";
import type { Tables } from "@/lib/db";
import { cn } from "@/utils/cn";

type House = Pick<
  Tables<"houses">,
  | "id"
  | "name"
  | "slug"
  | "color"
  | "verse"
  | "verse_ref"
  | "leader_id"
  | "campus_id"
  | "archived_at"
>;
type Campus = Pick<Tables<"campuses">, "id" | "name" | "slug" | "is_primary">;
type Member = { id: string; name: string };

// The seven house accent colours (brand palette).
const PALETTE: { name: string; hex: string }[] = [
  { name: "Bethel", hex: "#B87333" },
  { name: "Antioch", hex: "#722F37" },
  { name: "Berea", hex: "#A87C3E" },
  { name: "Bethany", hex: "#7A8A6E" },
  { name: "Zion", hex: "#C9A24A" },
  { name: "Hebron", hex: "#A85838" },
  { name: "Salem", hex: "#6B7F8A" },
];

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function HousesManager({
  houses,
  campuses,
  members,
  leaderName,
  memberCount,
}: {
  houses: House[];
  campuses: Campus[];
  members: Member[];
  leaderName: Record<string, string>;
  memberCount: Record<string, number>;
}) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [color, setColor] = useState(PALETTE[2].hex);
  const [verse, setVerse] = useState("");
  const [verseRef, setVerseRef] = useState("");
  const [campusId, setCampusId] = useState(campuses[0]?.id ?? "");
  const [leaderId, setLeaderId] = useState("");
  const [saving, setSaving] = useState(false);

  function autoSlug(n: string, cId: string) {
    const c = campuses.find((x) => x.id === cId);
    const base = slugify(n);
    if (!c || c.is_primary) return base;
    return base ? `${base}-${c.slug}` : "";
  }

  function openNew() {
    setEditingId(undefined);
    setName("");
    setSlug("");
    setSlugTouched(false);
    setColor(PALETTE[2].hex);
    setVerse("");
    setVerseRef("");
    setCampusId(campuses[0]?.id ?? "");
    setLeaderId("");
    setOpen(true);
  }

  function openEdit(h: House) {
    setEditingId(h.id);
    setName(h.name);
    setSlug(h.slug);
    setSlugTouched(true);
    setColor(h.color);
    setVerse(h.verse ?? "");
    setVerseRef(h.verse_ref ?? "");
    setCampusId(h.campus_id ?? campuses[0]?.id ?? "");
    setLeaderId(h.leader_id ?? "");
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    const result = await saveHouse({
      id: editingId,
      name,
      slug,
      color,
      verse: verse || null,
      verseRef: verseRef || null,
      campusId,
      leaderId: leaderId || null,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(editingId ? "House updated." : "House created with its chat.");
    setOpen(false);
    router.refresh();
  }

  async function archive(h: House) {
    const result = await setHouseArchived(h.id, !h.archived_at);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(h.archived_at ? "House restored." : "House archived.");
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
          <Plus size={16} /> New house
        </button>
      </div>

      <div className="mt-6 space-y-8">
        {campuses.map((campus) => {
          const rows = houses.filter((h) => h.campus_id === campus.id);
          return (
            <section key={campus.id}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink/50">
                <MapPin size={15} className="text-copper" /> {campus.name}
                <span className="text-ink/30">({rows.length})</span>
              </h2>
              <div className="overflow-hidden rounded-2xl border border-border bg-surface-1">
                {rows.map((h, i) => (
                  <div
                    key={h.id}
                    className={cn(
                      "flex items-center gap-3 px-5 py-3",
                      i > 0 && "border-t border-border",
                      h.archived_at && "opacity-60"
                    )}
                  >
                    <span
                      className="h-9 w-9 shrink-0 rounded-full"
                      style={{ backgroundColor: h.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <p className="flex items-center gap-2 font-medium text-ink">
                        {h.name}
                        <span className="font-mono text-xs text-ink/40">
                          {h.slug}
                        </span>
                        {h.archived_at && (
                          <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink/50">
                            Archived
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-ink/50">
                        <Crown size={11} className="inline text-copper" />{" "}
                        {h.leader_id
                          ? leaderName[h.leader_id] ?? "Unknown"
                          : "No leader"}
                        {" · "}
                        <Users size={11} className="inline" />{" "}
                        {memberCount[h.id] ?? 0} members
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEdit(h)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-ink/70 transition hover:bg-parchment"
                    >
                      <Pencil size={14} /> Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => archive(h)}
                      title={h.archived_at ? "Restore" : "Archive"}
                      className="rounded-lg border border-border p-2 text-ink/60 transition hover:bg-parchment"
                    >
                      {h.archived_at ? (
                        <ArchiveRestore size={15} />
                      ) : (
                        <Archive size={15} />
                      )}
                    </button>
                  </div>
                ))}
                {rows.length === 0 && (
                  <p className="px-5 py-8 text-center text-sm text-ink/50">
                    No houses in {campus.name} yet.
                  </p>
                )}
              </div>
            </section>
          );
        })}
        {campuses.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface-1 px-5 py-16 text-center">
            <Home className="text-copper" size={28} />
            <p className="font-display text-lg text-ink">No campuses</p>
            <p className="text-sm text-ink/60">
              Add campuses before creating houses.
            </p>
          </div>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? "Edit house" : "New house"}
        side="right"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink">Name</label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(autoSlug(e.target.value, campusId));
              }}
              placeholder="Berea"
              className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-ink outline-none focus:border-copper"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">Campus</label>
            <select
              value={campusId}
              onChange={(e) => {
                setCampusId(e.target.value);
                if (!slugTouched) setSlug(autoSlug(name, e.target.value));
              }}
              className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-ink outline-none focus:border-copper"
            >
              {campuses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">Slug</label>
            <input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              placeholder="berea-ikole"
              className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 font-mono text-sm text-ink outline-none focus:border-copper"
            />
            <p className="mt-1 text-xs text-ink/50">Unique per campus.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">
              Accent colour
            </label>
            <div className="mt-2 flex flex-wrap gap-2">
              {PALETTE.map((p) => (
                <button
                  key={p.hex}
                  type="button"
                  title={p.name}
                  onClick={() => setColor(p.hex)}
                  className={cn(
                    "h-9 w-9 rounded-full ring-offset-2 transition",
                    color.toLowerCase() === p.hex.toLowerCase() &&
                      "ring-2 ring-copper"
                  )}
                  style={{ backgroundColor: p.hex }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">
              House leader
            </label>
            <select
              value={leaderId}
              onChange={(e) => setLeaderId(e.target.value)}
              className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-ink outline-none focus:border-copper"
            >
              <option value="">No leader</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
            <div>
              <label className="block text-sm font-medium text-ink">Verse</label>
              <input
                value={verse}
                onChange={(e) => setVerse(e.target.value)}
                placeholder="As for me and my house..."
                className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-ink outline-none focus:border-copper"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">Ref</label>
              <input
                value={verseRef}
                onChange={(e) => setVerseRef(e.target.value)}
                placeholder="Joshua 24:15"
                className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-ink outline-none focus:border-copper"
              />
            </div>
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
              disabled={saving}
              onClick={save}
              className="rounded-lg bg-copper px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Saving..." : editingId ? "Save" : "Create house"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
