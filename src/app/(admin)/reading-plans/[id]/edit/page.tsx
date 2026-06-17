import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { PlanEditor } from "@/components/admin/PlanEditor";

export default async function EditReadingPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase, profile } = await requireAdmin();

  const { data: plan } = await supabase
    .from("reading_plans")
    .select("*")
    .eq("id", id)
    .eq("parish_id", profile.parish_id!)
    .single();
  if (!plan) notFound();

  const { data: days } = await supabase
    .from("reading_plan_days")
    .select(
      "id, day_number, title, scripture_reference, reflection_body, reflection_prompt"
    )
    .eq("plan_id", id)
    .order("day_number");

  return (
    <div>
      <Link
        href="/reading-plans"
        className="inline-flex items-center gap-1 text-sm text-ink/60 transition hover:text-copper"
      >
        <ArrowLeft size={15} /> Reading Plans
      </Link>
      <h1 className="mt-2 font-display text-3xl">{plan.title}</h1>
      <div className="mt-6">
        <PlanEditor plan={plan} days={days ?? []} />
      </div>
    </div>
  );
}
