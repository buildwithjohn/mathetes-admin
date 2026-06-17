import Link from "next/link";
import { formatDistanceToNow, parseISO, format } from "date-fns";
import {
  ShieldAlert,
  Flag,
  MessageSquareWarning,
  CheckCircle2,
} from "lucide-react";
import { requireCapability } from "@/lib/auth";
import { ReportActions } from "@/components/admin/ReportActions";
import type { ReportStatus } from "@/lib/db";

const FILTERS = [
  { value: "open", label: "Open" },
  { value: "reviewing", label: "Reviewing" },
  { value: "resolved", label: "Resolved" },
  { value: "dismissed", label: "Dismissed" },
  { value: "all", label: "All" },
] as const;

const TARGET_LABEL: Record<string, string> = {
  message: "Message",
  user: "User",
  prayer_request: "Prayer request",
  ask_question: "Ask Pastor question",
};

const SEVERITY_STYLE: Record<string, string> = {
  low: "bg-surface-2 text-ink/60",
  medium: "bg-copper/10 text-copper",
  high: "bg-oxblood/10 text-oxblood",
};

export default async function ModerationPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const active = FILTERS.some((f) => f.value === filter)
    ? (filter as (typeof FILTERS)[number]["value"])
    : "open";

  const { supabase, profile } = await requireCapability("moderation");

  let reportsQuery = supabase
    .from("reports")
    .select(
      "id, target_type, target_id, reason, status, created_at, reporter_id, resolved_at"
    )
    .eq("parish_id", profile.parish_id!)
    .order("created_at", { ascending: false });
  if (active !== "all")
    reportsQuery = reportsQuery.eq("status", active as ReportStatus);

  const [reportsRes, logRes] = await Promise.all([
    reportsQuery,
    supabase
      .from("moderation_log")
      .select("id, flag, severity, action_taken, created_at, message_id")
      .order("created_at", { ascending: false })
      .limit(20),
  ]);
  const reports = reportsRes.data ?? [];
  const log = logRes.data ?? [];

  // Resolve reporter names.
  const reporterIds = [...new Set(reports.map((r) => r.reporter_id))];
  const reporterName = new Map<string, string>();
  if (reporterIds.length > 0) {
    const { data } = await supabase
      .from("user_profiles")
      .select("id, name")
      .in("id", reporterIds);
    for (const u of data ?? []) reporterName.set(u.id, u.name);
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <ShieldAlert className="text-copper" size={26} />
        <h1 className="font-display text-4xl">Moderation</h1>
      </div>
      <p className="mt-1 text-ink/60">
        Review member reports and automated moderation flags.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/moderation?filter=${f.value}`}
            className={
              "rounded-full border px-3 py-1 text-sm transition " +
              (active === f.value
                ? "border-copper bg-copper/10 text-copper"
                : "border-border text-ink/70 hover:bg-parchment")
            }
          >
            {f.label}
          </Link>
        ))}
      </div>

      {/* Reports */}
      <div className="mt-6 space-y-3">
        {reports.map((r) => (
          <div
            key={r.id}
            className="rounded-2xl border border-border bg-surface-1 p-5"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-ink/50">
              <span className="inline-flex items-center gap-1 rounded-full bg-surface-2 px-2 py-0.5">
                <Flag size={12} /> {TARGET_LABEL[r.target_type] ?? r.target_type}
              </span>
              <span>by {reporterName.get(r.reporter_id) ?? "Unknown"}</span>
              <span className="ml-auto">
                {formatDistanceToNow(parseISO(r.created_at), { addSuffix: true })}
              </span>
            </div>
            <p className="mt-2 text-ink">
              {r.reason?.trim() ? r.reason : "No reason provided."}
            </p>
            <div className="mt-3 flex items-center justify-between">
              <span className="text-xs capitalize text-ink/50">{r.status}</span>
              <ReportActions id={r.id} status={r.status} />
            </div>
          </div>
        ))}

        {reports.length === 0 && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-surface-1 px-5 py-16 text-center">
            <CheckCircle2 className="text-copper" size={28} />
            <p className="font-display text-lg text-ink">Nothing to review</p>
            <p className="text-sm text-ink/60">
              No reports match this filter.
            </p>
          </div>
        )}
      </div>

      {/* Moderation log */}
      <h2 className="mt-10 flex items-center gap-2 font-display text-2xl text-ink">
        <MessageSquareWarning size={20} className="text-copper" /> Automated flags
      </h2>
      <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-surface-1">
        {log.length === 0 && (
          <p className="px-5 py-8 text-center text-sm text-ink/50">
            No automated moderation flags yet.
          </p>
        )}
        {log.map((l, i) => (
          <div
            key={l.id}
            className={
              "flex items-center gap-3 px-5 py-3 text-sm" +
              (i > 0 ? " border-t border-border" : "")
            }
          >
            <span
              className={
                "rounded-full px-2 py-0.5 text-xs font-medium capitalize " +
                (SEVERITY_STYLE[l.severity] ?? "bg-surface-2 text-ink/60")
              }
            >
              {l.severity}
            </span>
            <span className="text-ink/80">{l.flag}</span>
            <span className="text-ink/40">·</span>
            <span className="capitalize text-ink/50">
              {l.action_taken.replace(/_/g, " ")}
            </span>
            <span className="ml-auto text-xs text-ink/40">
              {format(parseISO(l.created_at), "MMM d, h:mm a")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
