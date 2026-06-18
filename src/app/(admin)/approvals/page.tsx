import { requireCapability } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApprovalsManager } from "@/components/admin/ApprovalsManager";

export default async function ApprovalsPage() {
  const { supabase, profile } = await requireCapability("approvals");
  const parish = profile.parish_id!;

  // Pending members have NO parish yet, and RLS hides them from admins, so list
  // them with the service-role client. The approve RPC re-checks authorization
  // and that the chosen campus is in the admin's parish.
  const admin = createAdminClient();

  const [pendingRes, campusesRes] = await Promise.all([
    admin
      ? admin
          .from("user_profiles")
          .select("id, name, auth_id, joined_at")
          .eq("status", "pending")
          .order("joined_at", { ascending: true })
      : Promise.resolve({ data: [] as { id: string; name: string; auth_id: string; joined_at: string }[] }),
    supabase
      .from("campuses")
      .select("id, name, slug, is_primary, allowed_email_domains")
      .eq("parish_id", parish)
      .order("is_primary", { ascending: false })
      .order("name"),
  ]);

  const pendingRows = pendingRes.data ?? [];
  const campuses = campusesRes.data ?? [];

  // Emails live on auth.users; resolve them with the service-role client.
  const emailById = new Map<string, string>();
  if (admin && pendingRows.length > 0) {
    await Promise.all(
      pendingRows.map(async (p) => {
        const { data } = await admin.auth.admin.getUserById(p.auth_id);
        if (data?.user?.email) emailById.set(p.id, data.user.email);
      })
    );
  }

  const pending = pendingRows.map((p) => {
    const email = emailById.get(p.id) ?? null;
    const domain = email?.includes("@") ? email.split("@")[1] : null;
    return { id: p.id, name: p.name, email, domain, signupAt: p.joined_at };
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
