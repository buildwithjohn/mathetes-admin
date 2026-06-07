import Link from "next/link";
import { formatDistanceToNow, parseISO } from "date-fns";
import { MessageCircleQuestion, AlertTriangle, Lock, Globe } from "lucide-react";
import { requireAdmin } from "@/lib/auth";

const FILTERS = [
  { value: "awaiting", label: "Awaiting" },
  { value: "answered", label: "Answered" },
  { value: "public", label: "Public" },
  { value: "private", label: "Private" },
  { value: "all", label: "All" },
] as const;

type Filter = (typeof FILTERS)[number]["value"];

export default async function AskPastorPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const active: Filter = FILTERS.some((f) => f.value === filter)
    ? (filter as Filter)
    : "awaiting";

  const { supabase, profile } = await requireAdmin();

  let query = supabase
    .from("ask_questions")
    .select(
      "id, body, category, privacy, urgent, status, public_anonymized, created_at, asker_id"
    )
    .eq("parish_id", profile.parish_id!)
    .order("urgent", { ascending: false })
    .order("created_at", { ascending: false });

  if (active === "awaiting" || active === "answered")
    query = query.eq("status", active);
  if (active === "public" || active === "private")
    query = query.eq("privacy", active);

  const { data: questions } = await query;

  // Resolve asker names in one query (embedded selects aren't typed here).
  const askerIds = [...new Set((questions ?? []).map((q) => q.asker_id))];
  const askerName = new Map<string, string>();
  if (askerIds.length > 0) {
    const { data: askers } = await supabase
      .from("user_profiles")
      .select("id, name")
      .in("id", askerIds);
    for (const a of askers ?? []) askerName.set(a.id, a.name);
  }

  return (
    <div>
      <h1 className="font-display text-4xl">Ask Pastor</h1>
      <p className="mt-1 text-ink/60">
        Respond to questions within the 48-hour window.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/ask-pastor?filter=${f.value}`}
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

      <div className="mt-6 space-y-3">
        {(questions ?? []).map((q) => (
          <Link
            key={q.id}
            href={`/ask-pastor/${q.id}`}
            className="block rounded-2xl border border-border bg-white p-5 transition hover:border-copper/40 hover:shadow-sm"
          >
            <div className="flex items-center gap-2 text-xs text-ink/50">
              {q.urgent && (
                <span className="inline-flex items-center gap-1 rounded-full bg-oxblood/10 px-2 py-0.5 text-oxblood">
                  <AlertTriangle size={12} /> Urgent
                </span>
              )}
              <span className="inline-flex items-center gap-1">
                {q.privacy === "private" ? (
                  <>
                    <Lock size={12} /> Private
                  </>
                ) : (
                  <>
                    <Globe size={12} /> Public
                  </>
                )}
              </span>
              {q.category && <span>· {q.category}</span>}
              <span className="ml-auto">
                {formatDistanceToNow(parseISO(q.created_at), {
                  addSuffix: true,
                })}
              </span>
            </div>
            <p className="mt-2 line-clamp-2 text-ink">{q.body}</p>
            <div className="mt-3 flex items-center justify-between text-xs">
              <span className="text-ink/50">
                {askerName.get(q.asker_id) ?? "Unknown"}
              </span>
              <span
                className={
                  "rounded-full px-2 py-0.5 font-medium " +
                  (q.status === "answered"
                    ? "bg-house-bethany/15 text-house-bethany"
                    : "bg-copper/10 text-copper")
                }
              >
                {q.status === "answered" ? "Answered" : "Awaiting"}
              </span>
            </div>
          </Link>
        ))}

        {(!questions || questions.length === 0) && (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-border bg-white px-5 py-16 text-center">
            <MessageCircleQuestion className="text-copper" size={28} />
            <p className="font-display text-lg text-ink">Nothing here</p>
            <p className="text-sm text-ink/60">
              No questions match this filter.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
