"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatDistanceToNow, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  UserCheck,
  Check,
  X,
  Mail,
  AtSign,
  Inbox,
  Plus,
  Loader2,
} from "lucide-react";
import {
  approveMember,
  rejectMember,
  updateCampusDomains,
} from "@/app/(admin)/approvals/actions";
import type { Tables } from "@/lib/db";
import { cn } from "@/utils/cn";

type Pending = {
  id: string;
  name: string;
  email: string | null;
  domain: string | null;
  signupAt: string;
};
type Campus = Pick<
  Tables<"campuses">,
  "id" | "name" | "slug" | "is_primary" | "allowed_email_domains"
>;

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function ApprovalsManager({
  pending,
  campuses,
}: {
  pending: Pending[];
  campuses: Campus[];
}) {
  const router = useRouter();
  const primaryId = campuses.find((c) => c.is_primary)?.id ?? campuses[0]?.id ?? "";

  const [campusFor, setCampusFor] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);

  async function approve(p: Pending) {
    const campusId = campusFor[p.id] ?? primaryId;
    if (!campusId) return toast.error("Add a campus first.");
    setBusy(p.id);
    const res = await approveMember({ userId: p.id, campusId });
    setBusy(null);
    if (!res.ok) return toast.error(res.error);
    toast.success(`${p.name} approved.`);
    router.refresh();
  }

  async function reject(p: Pending) {
    setBusy(p.id);
    const res = await rejectMember(p.id);
    setBusy(null);
    if (!res.ok) return toast.error(res.error);
    toast.success(`${p.name} rejected.`);
    router.refresh();
  }

  return (
    <div className="space-y-10">
      {/* Pending queue */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink/50">
          <UserCheck size={15} className="text-copper" /> Waiting for review
          <span className="text-ink/30">({pending.length})</span>
        </h2>

        {pending.length === 0 ? (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface-1 px-5 py-14 text-center">
            <Inbox className="text-copper" size={26} />
            <p className="font-display text-lg text-ink">No one waiting</p>
            <p className="max-w-sm text-sm text-ink/60">
              Students who sign up with a recognized school email are approved
              automatically. Anyone else will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-border bg-surface-1">
            {pending.map((p, i) => (
              <div
                key={p.id}
                className={cn(
                  "flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:gap-4 sm:px-5",
                  i > 0 && "border-t border-border"
                )}
              >
                <div className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-semibold text-ink/60">
                    {initials(p.name)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-ink">{p.name}</p>
                    <p className="flex flex-wrap items-center gap-x-2 text-xs text-ink/50">
                      <span className="inline-flex items-center gap-1">
                        <Mail size={11} />
                        {p.email ?? "email unavailable"}
                      </span>
                      {p.domain && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-surface-2 px-1.5 py-0.5 text-[11px] text-ink/60">
                          <AtSign size={10} />
                          {p.domain}
                        </span>
                      )}
                      <span>
                        {formatDistanceToNow(parseISO(p.signupAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <select
                    value={campusFor[p.id] ?? primaryId}
                    onChange={(e) =>
                      setCampusFor((m) => ({ ...m, [p.id]: e.target.value }))
                    }
                    aria-label="Campus"
                    className="rounded-lg border border-border bg-surface-1 px-2.5 py-2 text-sm text-ink outline-none focus:border-copper"
                  >
                    {campuses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    disabled={busy === p.id}
                    onClick={() => approve(p)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-copper px-3 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-50"
                  >
                    {busy === p.id ? (
                      <Loader2 size={15} className="animate-spin" />
                    ) : (
                      <Check size={15} />
                    )}
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={busy === p.id}
                    onClick={() => reject(p)}
                    title="Reject"
                    aria-label={`Reject ${p.name}`}
                    className="rounded-lg border border-border p-2 text-ink/60 transition hover:bg-parchment disabled:opacity-50"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Auto-approval domains */}
      <section>
        <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-ink/50">
          <AtSign size={15} className="text-copper" /> Auto-approval domains
        </h2>
        <p className="mb-3 text-sm text-ink/50">
          Emails on these domains are approved automatically and routed to that
          campus. Use lowercase, no “@”.
        </p>
        <div className="grid gap-4 lg:grid-cols-2">
          {campuses.map((c) => (
            <CampusDomains key={c.id} campus={c} />
          ))}
          {campuses.length === 0 && (
            <p className="text-sm text-ink/50">No campuses configured.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function CampusDomains({ campus }: { campus: Campus }) {
  const router = useRouter();
  const [domains, setDomains] = useState<string[]>(
    campus.allowed_email_domains ?? []
  );
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  const original = (campus.allowed_email_domains ?? []).join(",");
  const dirty = domains.join(",") !== original;

  function add() {
    const d = input.trim().toLowerCase().replace(/^@+/, "");
    if (!d) return;
    if (d.includes("@") || /\s/.test(d)) {
      toast.error("No “@” or spaces in a domain.");
      return;
    }
    if (!domains.includes(d)) setDomains((prev) => [...prev, d]);
    setInput("");
  }

  function remove(d: string) {
    setDomains((prev) => prev.filter((x) => x !== d));
  }

  async function save() {
    setSaving(true);
    const res = await updateCampusDomains({ campusId: campus.id, domains });
    setSaving(false);
    if (!res.ok) return toast.error(res.error);
    toast.success(`${campus.name} domains saved.`);
    router.refresh();
  }

  return (
    <div className="rounded-2xl border border-border bg-surface-1 p-4">
      <div className="flex items-center justify-between">
        <p className="font-medium text-ink">{campus.name}</p>
        {campus.is_primary && (
          <span className="rounded-full bg-copper/10 px-2 py-0.5 text-[11px] font-semibold text-copper">
            Primary
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        {domains.length === 0 && (
          <span className="text-xs text-ink/40">No domains yet.</span>
        )}
        {domains.map((d) => (
          <span
            key={d}
            className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2.5 py-1 text-xs text-ink/70"
          >
            {d}
            <button
              type="button"
              onClick={() => remove(d)}
              aria-label={`Remove ${d}`}
              className="text-ink/40 transition hover:text-oxblood"
            >
              <X size={12} />
            </button>
          </span>
        ))}
      </div>

      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="students.fuoye.edu.ng"
          className="min-w-0 flex-1 rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm text-ink outline-none focus:border-copper"
        />
        <button
          type="button"
          onClick={add}
          className="inline-flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-ink/70 transition hover:bg-parchment"
        >
          <Plus size={15} /> Add
        </button>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          type="button"
          disabled={!dirty || saving}
          onClick={save}
          className="rounded-lg bg-copper px-4 py-2 text-sm font-medium text-white transition hover:opacity-90 disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save domains"}
        </button>
      </div>
    </div>
  );
}
