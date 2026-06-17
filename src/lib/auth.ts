import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/db";
import { canAccessAdmin, can, type Capability } from "@/lib/roles";

export type AdminProfile = Pick<
  Tables<"user_profiles">,
  "id" | "name" | "role" | "parish_id" | "is_owner"
>;

export type AdminContext = {
  user: { id: string; email?: string } | null;
  profile: AdminProfile | null;
};

/**
 * Load the signed-in user + their admin profile ONCE per request.
 *
 * Wrapped in React `cache()` so the admin layout and every page/Server Action
 * that needs the profile share a single `getUser()` + profile query within a
 * request, instead of each issuing their own network round-trips. This is the
 * main lever against per-navigation latency.
 */
export const getAdminContext = cache(async (): Promise<AdminContext> => {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };

  const { data } = await supabase
    .from("user_profiles")
    .select("id, name, role, parish_id, is_owner")
    .eq("auth_id", user.id)
    .single();

  return {
    user: { id: user.id, email: user.email },
    profile: (data as AdminProfile | null) ?? null,
  };
});

/**
 * For Server Components / Actions: resolve the admin's profile, redirecting to
 * /signin when unauthenticated and to /dashboard when not a pastor/admin.
 * Returns a Supabase server client for follow-up queries.
 */
export async function requireAdmin() {
  const { user, profile } = await getAdminContext();
  if (!user) redirect("/signin");
  if (!profile || !canAccessAdmin(profile)) {
    // The (admin) layout renders the friendly not-authorized screen; bouncing
    // here keeps Server Actions from acting without a valid role.
    redirect("/dashboard");
  }
  // createClient() is itself cheap and request-scoped; reuse it for queries.
  const supabase = await createClient();
  return { supabase, profile };
}

/**
 * Like requireAdmin, but also requires a specific capability. Pages for
 * management surfaces (members, giving, houses, moderation, analytics) use this
 * so a signed-in pastor can't reach them by typing the URL.
 */
export async function requireCapability(cap: Capability) {
  const ctx = await requireAdmin();
  if (!can(ctx.profile, cap)) redirect("/dashboard");
  return ctx;
}
