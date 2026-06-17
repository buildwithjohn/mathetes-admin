import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { requireAdmin } from "@/lib/auth";
import { PlanForm } from "@/components/admin/PlanForm";

export default async function NewReadingPlanPage() {
  await requireAdmin();
  return (
    <div>
      <Link
        href="/reading-plans"
        className="inline-flex items-center gap-1 text-sm text-ink/60 transition hover:text-copper"
      >
        <ArrowLeft size={15} /> Reading Plans
      </Link>
      <h1 className="mt-2 font-display text-3xl">New reading plan</h1>
      <p className="mt-1 text-ink/60">
        Set up the plan, then add its days.
      </p>
      <div className="mt-6">
        <PlanForm initial={null} mode="create" />
      </div>
    </div>
  );
}
