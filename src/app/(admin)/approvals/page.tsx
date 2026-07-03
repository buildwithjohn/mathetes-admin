import { requireCapability } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { ApprovalsManager } from "@/components/admin/ApprovalsManager";

export const dynamic = "force-dynamic";

type Pending = {
  id: string;
  name: string;
  email: string | null;
  domain: string | null;
  signupAt: string;
};

export default async function ApprovalsPage() {
  const { supabase, profile } = await requireCapability("approvals");
  const parish = profile.parish_id!;

  const campusesRes = await supabase
    .from("campuses")
    .select("id, name, slug, is_primary, allowed_email_domains")
    .eq("parish_id", parish)
    .order("is_primary", { ascending: false })
    .order("name");
  const campuses = campusesRes.data ?? [];

  // Pending members. Pending signups have a null parish_id, so they can't be
  // scoped by parish (single-parish pilot: every pending signup is a candidate).
  //
  // We read them with the SERVICE-ROLE client -- the same path Members uses to
  // read non-active users (0025 RLS hides them from the normal client). This
  // avoids depending on the list_pending_members() RPC, which joins auth.users
  // as SECURITY DEFINER and was returning nothing on prod. Emails are resolved
  // via the Admin auth API (auth.users is not client-readable). Errors are
  // surfaced, never silently swallowed into an empty queue.
  const admin = createAdminClient();
  let pending: Pending[] = [];

  if (admin) {
    const { data: rows, error } = await admin
      .from("user_profiles")
      .select("id, auth_id, name, joined_at")
      .eq("status", "pending")
      .order("joined_at", { ascending: true });
    if (error) throw new Error(`Failed to load pending members: ${error.message}`);

    pending = await Promise.all(
      (rows ?? []).map(async (p) => {
        const { data: authUser } = await admin.auth.admin.getUserById(p.auth_id);
        const email = authUser?.user?.email ?? null;
        const domain = email?.includes("@") ? email.split("@")[1] : null;
        return { id: p.id, name: p.name, email, domain, signupAt: p.joined_at };
      })
    );
  } else {
    // No service-role key configured: fall back to the RPC (0027). Surface any
    // error instead of rendering a misleading empty queue.
    const { data, error } = await supabase.rpc("list_pending_members");
    if (error) throw new Error(`Failed to load pending members: ${error.message}`);
    pending = (data ?? []).map((p) => {
      const domain = p.email?.includes("@") ? p.email.split("@")[1] : null;
      return {
        id: p.id,
        name: p.name,
        email: p.email ?? null,
        domain,
        signupAt: p.created_at,
      };
    });
  }

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
