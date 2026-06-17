import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { DayEditor } from "@/components/admin/DayEditor";

export default async function ReadingPlanDayPage({
  params,
}: {
  params: Promise<{ id: string; dayNumber: string }>;
}) {
  const { id, dayNumber } = await params;
  const dayNum = Number(dayNumber);
  const { supabase, profile } = await requireAdmin();

  const { data: plan } = await supabase
    .from("reading_plans")
    .select("id, title, length_days")
    .eq("id", id)
    .eq("parish_id", profile.parish_id!)
    .single();
  if (!plan) notFound();

  const { data: day } = await supabase
    .from("reading_plan_days")
    .select(
      "id, day_number, title, scripture_reference, scripture_text, reflection_body, reflection_prompt, audio_url, devotional_id"
    )
    .eq("plan_id", id)
    .eq("day_number", dayNum)
    .single();
  if (!day) notFound();

  const { data: devotionals } = await supabase
    .from("devotionals")
    .select("id, title")
    .eq("parish_id", profile.parish_id!)
    .order("publish_date", { ascending: false, nullsFirst: false })
    .limit(100);

  return (
    <div>
      <Link
        href={`/reading-plans/${id}/edit`}
        className="inline-flex items-center gap-1 text-sm text-ink/60 transition hover:text-copper"
      >
        <ArrowLeft size={15} /> {plan.title}
      </Link>
      <h1 className="mt-2 font-display text-3xl">
        Day {day.day_number}
        <span className="text-ink/40"> of {plan.length_days}</span>
      </h1>
      <div className="mt-6">
        <DayEditor
          planId={id}
          totalDays={plan.length_days}
          day={day}
          devotionals={devotionals ?? []}
        />
      </div>
    </div>
  );
}
