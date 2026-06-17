"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Settings2,
  ListOrdered,
  Plus,
  ChevronUp,
  ChevronDown,
  Trash2,
  CheckCircle2,
  Circle,
  Send,
  EyeOff,
  Loader2,
} from "lucide-react";
import { PlanForm } from "@/components/admin/PlanForm";
import { Modal } from "@/components/admin/Modal";
import {
  addDay,
  deleteDay,
  deletePlan,
  reorderDays,
  setPlanPublished,
} from "@/app/(admin)/reading-plans/actions";
import type { Tables } from "@/lib/db";
import { cn } from "@/utils/cn";

type Plan = Tables<"reading_plans">;
type Day = Pick<
  Tables<"reading_plan_days">,
  | "id"
  | "day_number"
  | "title"
  | "scripture_reference"
  | "reflection_body"
  | "reflection_prompt"
>;

function isComplete(d: Day) {
  return (
    d.scripture_reference.trim() !== "" &&
    d.reflection_body.trim() !== "" &&
    d.reflection_prompt.trim() !== ""
  );
}

export function PlanEditor({ plan, days }: { plan: Plan; days: Day[] }) {
  const router = useRouter();
  const [tab, setTab] = useState<"metadata" | "days">("days");
  const [order, setOrder] = useState<Day[]>(days);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function togglePublish() {
    setBusy(true);
    const result = await setPlanPublished(plan.id, !plan.published);
    setBusy(false);
    if (!result.ok) return toast.error(result.error);
    toast.success(plan.published ? "Unpublished." : "Published.");
    router.refresh();
  }

  async function onAddDay() {
    setBusy(true);
    const result = await addDay(plan.id);
    setBusy(false);
    if (!result.ok) return toast.error(result.error);
    router.push(`/reading-plans/${plan.id}/days/${result.data!.dayNumber}`);
  }

  async function onDeleteDay(id: string) {
    const result = await deleteDay(id, plan.id);
    if (!result.ok) return toast.error(result.error);
    setOrder((prev) => prev.filter((d) => d.id !== id));
    toast.success("Day removed.");
    router.refresh();
  }

  async function move(index: number, dir: -1 | 1) {
    const next = [...order];
    const target = index + dir;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setOrder(next);
    const result = await reorderDays(
      plan.id,
      next.map((d) => d.id)
    );
    if (!result.ok) {
      toast.error(result.error);
      setOrder(order);
      return;
    }
    router.refresh();
  }

  async function onDeletePlan() {
    const result = await deletePlan(plan.id);
    if (!result.ok) return toast.error(result.error);
    toast.success("Plan deleted.");
    router.push("/reading-plans");
  }

  return (
    <div>
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-border pb-4">
        <div className="flex rounded-lg border border-border bg-surface-1 p-0.5">
          <button
            type="button"
            onClick={() => setTab("metadata")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition",
              tab === "metadata" ? "bg-copper/10 text-copper" : "text-ink/60"
            )}
          >
            <Settings2 size={15} /> Metadata
          </button>
          <button
            type="button"
            onClick={() => setTab("days")}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition",
              tab === "days" ? "bg-copper/10 text-copper" : "text-ink/60"
            )}
          >
            <ListOrdered size={15} /> Days
            <span className="text-ink/40">({order.length})</span>
          </button>
        </div>

        <div className="ml-auto flex items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={togglePublish}
            className={cn(
              "inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition disabled:opacity-50",
              plan.published
                ? "border border-border text-ink/70 hover:bg-parchment"
                : "bg-copper text-white hover:opacity-90"
            )}
          >
            {busy ? (
              <Loader2 size={15} className="animate-spin" />
            ) : plan.published ? (
              <EyeOff size={15} />
            ) : (
              <Send size={15} />
            )}
            {plan.published ? "Unpublish" : "Publish"}
          </button>
          <button
            type="button"
            onClick={() => setConfirmDelete(true)}
            title="Delete plan"
            className="rounded-lg border border-border p-2 text-oxblood transition hover:bg-oxblood/10"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {tab === "metadata" ? (
        <div className="mt-6">
          <PlanForm
            mode="edit"
            initial={{
              id: plan.id,
              title: plan.title,
              slug: plan.slug,
              description: plan.description,
              length_days: plan.length_days,
              difficulty: plan.difficulty,
              sequence_locked: plan.sequence_locked,
              cover_image_url: plan.cover_image_url,
            }}
          />
        </div>
      ) : (
        <div className="mt-6 max-w-2xl">
          <div className="overflow-hidden rounded-2xl border border-border bg-surface-1">
            {order.map((d, i) => (
              <div
                key={d.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3",
                  i > 0 && "border-t border-border"
                )}
              >
                <div className="flex flex-col">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    aria-label="Move up"
                    className="text-ink/40 transition hover:text-ink disabled:opacity-30"
                  >
                    <ChevronUp size={15} />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === order.length - 1}
                    aria-label="Move down"
                    className="text-ink/40 transition hover:text-ink disabled:opacity-30"
                  >
                    <ChevronDown size={15} />
                  </button>
                </div>
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-surface-2 text-sm font-semibold text-ink/70">
                  {d.day_number}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/reading-plans/${plan.id}/days/${d.day_number}`
                    )
                  }
                  className="min-w-0 flex-1 text-left"
                >
                  <p className="truncate font-medium text-ink hover:text-copper">
                    {d.title || `Day ${d.day_number}`}
                  </p>
                  <p className="truncate text-xs text-ink/50">
                    {d.scripture_reference || "No scripture yet"}
                  </p>
                </button>
                {isComplete(d) ? (
                  <CheckCircle2 size={18} className="shrink-0 text-house-bethany" />
                ) : (
                  <Circle size={18} className="shrink-0 text-ink/25" />
                )}
                <button
                  type="button"
                  onClick={() => onDeleteDay(d.id)}
                  aria-label="Delete day"
                  className="shrink-0 rounded-md p-1.5 text-ink/40 transition hover:bg-oxblood/10 hover:text-oxblood"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            ))}

            <button
              type="button"
              disabled={busy}
              onClick={onAddDay}
              className={cn(
                "flex w-full items-center justify-center gap-2 px-4 py-3 text-sm font-medium text-copper transition hover:bg-copper/5 disabled:opacity-50",
                order.length > 0 && "border-t border-border"
              )}
            >
              <Plus size={16} /> Add day
            </button>
          </div>
          {order.length === 0 && (
            <p className="mt-3 text-center text-sm text-ink/50">
              No days yet. Add the first day to begin.
            </p>
          )}
        </div>
      )}

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete plan?"
      >
        <p className="text-sm text-ink/70">
          This permanently deletes “{plan.title}” and all {order.length} of its
          days. This cannot be undone.
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
            onClick={onDeletePlan}
            className="rounded-lg bg-oxblood px-4 py-2 text-sm font-medium text-white transition hover:opacity-90"
          >
            Delete
          </button>
        </div>
      </Modal>
    </div>
  );
}
