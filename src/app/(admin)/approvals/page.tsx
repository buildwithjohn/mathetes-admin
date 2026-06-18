import { requireCapability } from "@/lib/auth";
import { ApprovalsManager } from "@/components/admin/ApprovalsManager";

export default async function ApprovalsPage() {
  const { supabase, profile } = await requireCapability("approvals");
  const parish = profile.parish_id!;

  // list_pending_members (0027) returns pending members WITH their email,
  // joined from auth.users, and is pastor/admin gated. No service role needed.
  const [pendingRes, campusesRes] = await Promise.all([
    supabase.rpc("list_pending_members"),
    supabase
      .from("campuses")
      .select("id, name, slug, is_primary, allowed_email_domains")
      .eq("parish_id", parish)
      .order("is_primary", { ascending: false })
      .order("name"),
  ]);

  const campuses = campusesRes.data ?? [];

  const pending = (pendingRes.data ?? []).map((p) => {
    const domain = p.email?.includes("@") ? p.email.split("@")[1] : null;
    return {
      id: p.id,
      name: p.name,
      email: p.email ?? null,
      domain,
      signupAt: p.created_at,
    };
  });

  return (
    <div>
      <h1 className="font-display text-3xl sm:text-4xl">Approvals</h1>
      <p className="mt-1 text-ink/60">
        Let real students in. People with a recognized school email are approved
        automatically; everyone else waits here for a leader.
      </p>
      <div className="mt-8">
        <ApprovalsManager pending={pending} campuses={campuses} />
      </div>
    </div>
  );
}
