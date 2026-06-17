import { headers } from "next/headers";

/**
 * The admin app's public origin, used to build absolute URLs (e.g. the invite
 * redirect that Supabase emails to a new pastor). Prefers NEXT_PUBLIC_ADMIN_URL
 * so it stays correct behind proxies; falls back to the request host.
 */
export async function adminOrigin(): Promise<string> {
  const env = process.env.NEXT_PUBLIC_ADMIN_URL;
  if (env) return env.replace(/\/$/, "");
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto = host.startsWith("localhost") ? "http" : "https";
  return `${proto}://${host}`;
}
