import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { AdminShell } from "@/components/admin/AdminShell";
import { effectiveRole, capabilitiesFor, ROLE_LABEL } from "@/lib/roles";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Shared (cached) per-request lookup; pages reuse this same result.
  const { user, profile } = await getAdminContext();

  // Middleware already redirects unauthenticated users; defense in depth.
  if (!user) redirect("/signin");

  // Role gate: only owner / admin / pastor may enter.
  if (!profile || (profile.role !== "pastor" && profile.role !== "admin")) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-parchment px-6 text-center">
        <div>
          <h1 className="font-display text-3xl text-ink">Not authorized</h1>
          <p className="mt-2 text-ink/60">
            This area is for the pastor and content team only.
          </p>
        </div>
      </main>
    );
  }

  const name = profile.name ?? user.email ?? "?";
  const role = effectiveRole(profile);
  const caps = capabilitiesFor(role);

  // Pending-approval count for the nav badge. 0027 lets parish admins select
  // pending members directly (user_profiles_admin_pending_select).
  let pendingCount = 0;
  if (caps.includes("approvals")) {
    const supabase = await createClient();
    const { count } = await supabase
      .from("user_profiles")
      .select("id", { count: "exact", head: true })
      .eq("status", "pending");
    pendingCount = count ?? 0;
  }

  return (
    <AdminShell
      name={name}
      roleLabel={ROLE_LABEL[role]}
      caps={caps}
      pendingCount={pendingCount}
    >
      {children}
    </AdminShell>
  );
}
