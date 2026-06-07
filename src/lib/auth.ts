import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/lib/database.types";

export type AdminProfile = Pick<
  Tables<"user_profiles">,
  "id" | "name" | "role" | "parish_id"
>;

/**
 * Resolve the signed-in admin's profile for use in Server Components and
 * Server Actions. Redirects to /signin when unauthenticated and to the
 * not-authorized shell when the user is not a pastor/admin.
 *
 * Returns the Supabase server client alongside the profile so callers can
 * issue further queries on the same request.
 */
export async function requireAdmin() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/signin");

  const { data } = await supabase
    .from("user_profiles")
    .select("id, name, role, parish_id")
    .eq("auth_id", user.id)
    .single();

  const profile = data as AdminProfile | null;
  if (!profile || (profile.role !== "pastor" && profile.role !== "admin")) {
    // The (admin) layout renders the friendly not-authorized screen; bouncing
    // to the dashboard keeps Server Actions from acting without a valid role.
    redirect("/dashboard");
  }

  return { supabase, profile };
}
