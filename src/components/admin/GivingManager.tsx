"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Pencil, Eye, EyeOff } from "lucide-react";
import { Modal } from "@/components/admin/Modal";
import { saveFund, setFundActive } from "@/app/(admin)/giving/actions";
import type { Tables } from "@/lib/db";
import { cn } from "@/utils/cn";

type Fund = Pick<
  Tables<"giving_funds">,
  "id" | "name" | "slug" | "description" | "active" | "sort_order"
>;

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export function GivingManager({ funds }: { funds: Fund[] }) {
  const router = useRouter();

  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | undefined>();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [active, setActive] = useState(true);
  const [sortOrder, setSortOrder] = useState(0);
  const [saving, setSaving] = useState(false);

  function openNew() {
    setEditingId(undefined);
    setName("");
    setSlug("");
    setSlugTouched(false);
    setDescription("");
    setActive(true);
    setSortOrder(funds.length);
    setOpen(true);
  }

  function openEdit(f: Fund) {
    setEditingId(f.id);
    setName(f.name);
    setSlug(f.slug);
    setSlugTouched(true);
    setDescription(f.description ?? "");
    setActive(f.active);
    setSortOrder(f.sort_order);
    setOpen(true);
  }

  async function save() {
    setSaving(true);
    const result = await saveFund({
      id: editingId,
      name,
      slug,
      description: description || null,
      active,
      sortOrder,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(editingId ? "Fund updated." : "Fund created.");
    setOpen(false);
    router.refresh();
  }

  async function toggleActive(f: Fund) {
    const result = await setFundActive(f.id, !f.active);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success(f.active ? "Fund hidden from members." : "Fund is now active.");
    router.refresh();
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl text-ink">Funds</h2>
        <button
          type="button"
          onClick={openNew}
          className="inline-flex items-center gap-2 rounded-lg bg-copper px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
        >
          <Plus size={16} /> New fund
        </button>
      </div>
      <p className="mt-1 text-sm text-ink/50">
        Designations members can give toward. Only active funds appear in the
        app.
      </p>

      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface-1">
        {funds.map((f, i) => (
          <div
            key={f.id}
            className={cn(
              "flex items-center gap-3 px-5 py-3",
              i > 0 && "border-t border-border",
              !f.active && "opacity-60"
            )}
          >
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold text-ink/60">
              {f.sort_order}
            </span>
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-2 font-medium text-ink">
                {f.name}
                <span className="font-mono text-xs text-ink/40">{f.slug}</span>
                {!f.active && (
                  <span className="rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-medium text-ink/50">
                    Hidden
                  </span>
                )}
              </p>
              {f.description && (
                <p className="truncate text-xs text-ink/50">{f.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => openEdit(f)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-sm text-ink/70 transition hover:bg-parchment"
            >
              <Pencil size={14} /> Edit
            </button>
            <button
              type="button"
              onClick={() => toggleActive(f)}
              title={f.active ? "Hide from members" : "Make active"}
              className="rounded-lg border border-border p-2 text-ink/60 transition hover:bg-parchment"
            >
              {f.active ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        ))}
        {funds.length === 0 && (
          <p className="px-5 py-12 text-center text-sm text-ink/50">
            No funds yet. Create one to let members give.
          </p>
        )}
      </div>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={editingId ? "Edit fund" : "New fund"}
        side="right"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-ink">Name</label>
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              placeholder="Building Fund"
              className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-ink outline-none focus:border-copper"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">Slug</label>
            <input
              value={slug}
              onChange={(e) => {
                setSlug(e.target.value);
                setSlugTouched(true);
              }}
              placeholder="building"
              className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 font-mono text-sm text-ink outline-none focus:border-copper"
            />
            <p className="mt-1 text-xs text-ink/50">Unique per parish.</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Toward the new auditorium."
              className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-ink outline-none focus:border-copper"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-ink">
                Sort order
              </label>
              <input
                type="number"
                min={0}
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
                className="mt-1 w-full rounded-lg border border-border bg-surface-1 px-3 py-2 text-ink outline-none focus:border-copper"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink">
                Status
              </label>
              <label className="mt-1 flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface-1 px-3 py-2">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="accent-copper"
                />
                <span className="text-sm text-ink/80">
                  {active ? "Active" : "Hidden"}
                </span>
              </label>
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
              {saving ? "Saving..." : editingId ? "Save" : "Create fund"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
