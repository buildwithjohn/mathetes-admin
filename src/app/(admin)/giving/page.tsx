import { startOfMonth, startOfYear, subDays, formatISO } from "date-fns";
import { HandCoins, CalendarClock, Repeat, Wallet } from "lucide-react";
import { requireCapability } from "@/lib/auth";
import { GivingManager } from "@/components/admin/GivingManager";

// Amounts are stored in kobo; divide by 100 for naira.
function naira(kobo: number) {
  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(kobo / 100);
}

export default async function GivingPage() {
  const { supabase, profile } = await requireCapability("giving");
  const parish = profile.parish_id!;
  const now = new Date();
  const monthStart = formatISO(startOfMonth(now));
  const yearStart = formatISO(startOfYear(now));
  const since30 = formatISO(subDays(now, 30));

  const [fundsRes, donationsRes, recurringRes] = await Promise.all([
    supabase
      .from("giving_funds")
      .select("id, name, slug, description, active, sort_order")
      .eq("parish_id", parish)
      .order("sort_order")
      .order("name"),
    // Only settled gifts count toward totals. We read aggregate fields only
    // (amount, fund, when) — never donor identity — so this view is safe
    // regardless of the gift-visibility policy decision.
    supabase
      .from("donations")
      .select("fund_id, amount_kobo, paid_at, created_at")
      .eq("parish_id", parish)
      .eq("status", "success"),
    supabase
      .from("giving_recurring")
      .select("status")
      .eq("parish_id", parish),
  ]);

  const funds = fundsRes.data ?? [];
  const donations = donationsRes.data ?? [];
  const recurring = recurringRes.data ?? [];

  // When did each gift settle? Prefer paid_at, fall back to created_at.
  const when = (d: { paid_at: string | null; created_at: string }) =>
    d.paid_at ?? d.created_at;

  let totalAll = 0;
  let totalMonth = 0;
  let total30 = 0;
  let totalYear = 0;
  let countAll = 0;
  const byFund = new Map<string, { sum: number; count: number }>();

  for (const d of donations) {
    const amt = d.amount_kobo;
    const t = when(d);
    totalAll += amt;
    countAll += 1;
    if (t >= monthStart) totalMonth += amt;
    if (t >= since30) total30 += amt;
    if (t >= yearStart) totalYear += amt;
    const key = d.fund_id ?? "__none__";
    const prev = byFund.get(key) ?? { sum: 0, count: 0 };
    byFund.set(key, { sum: prev.sum + amt, count: prev.count + 1 });
  }

  const activeRecurring = recurring.filter((r) => r.status === "active").length;

  const fundTotals = funds
    .map((f) => ({
      id: f.id,
      name: f.name,
      ...(byFund.get(f.id) ?? { sum: 0, count: 0 }),
    }))
    .sort((a, b) => b.sum - a.sum);
  const unassigned = byFund.get("__none__");
  if (unassigned) {
    fundTotals.push({
      id: "__none__",
      name: "Unassigned",
      sum: unassigned.sum,
      count: unassigned.count,
    });
  }
  const maxFund = Math.max(1, ...fundTotals.map((f) => f.sum));

  return (
    <div>
      <h1 className="font-display text-3xl sm:text-4xl">Giving</h1>
      <p className="mt-1 text-ink/60">
        Manage giving funds and review settled gifts. Totals reflect successful
        donations only; amounts are private and never shown per donor.
      </p>

      {/* Totals */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={Wallet} label="This month" value={naira(totalMonth)} />
        <Stat icon={CalendarClock} label="Last 30 days" value={naira(total30)} />
        <Stat icon={HandCoins} label="This year" value={naira(totalYear)} />
        <Stat
          icon={Repeat}
          label="Active recurring"
          value={String(activeRecurring)}
          hint={`${recurring.length} mandates total`}
        />
      </div>

      {/* Totals by fund */}
      <div className="mt-6 rounded-2xl border border-border bg-surface-1 p-6">
        <div className="flex items-baseline justify-between">
          <h2 className="font-display text-xl text-ink">Totals by fund</h2>
          <span className="text-sm text-ink/50">
            {naira(totalAll)} all time · {countAll} gifts
          </span>
        </div>
        <div className="mt-4 space-y-3">
          {fundTotals.length === 0 && (
            <p className="text-sm text-ink/50">No settled gifts yet.</p>
          )}
          {fundTotals.map((f) => (
            <div key={f.id}>
              <div className="flex items-center justify-between text-sm">
                <span className="text-ink/70">{f.name}</span>
                <span className="font-medium text-ink">
                  {naira(f.sum)}{" "}
                  <span className="font-normal text-ink/40">
                    ({f.count})
                  </span>
                </span>
              </div>
              <div className="mt-1 h-2 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-copper"
                  style={{ width: `${(f.sum / maxFund) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Funds CRUD */}
      <div className="mt-8">
        <GivingManager funds={funds} />
      </div>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Wallet;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-surface-1 p-5">
      <div className="flex items-center gap-2 text-ink/50">
        <Icon size={16} className="text-copper" />
        <span className="text-sm">{label}</span>
      </div>
      <p className="mt-2 font-display text-3xl text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink/40">{hint}</p>}
    </div>
  );
}
