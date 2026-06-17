import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import type { Database } from "@/lib/db";

type CookiesToSet = { name: string; value: string; options: CookieOptions }[];

// Path prefixes that require an authenticated admin session.
const ADMIN_PREFIXES = [
  "/dashboard",
  "/devotionals",
  "/word-of-day",
  "/reading-plans",
  "/announcements",
  "/members",
  "/ask-pastor",
  "/moderation",
  "/analytics",
];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: getUser() refreshes the session; do not remove.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const host = request.headers.get("host") ?? "";
  const isAdminHost = host.startsWith("admin.");
  const path = request.nextUrl.pathname;

  // The admin subdomain is the staff app: send its root straight to the
  // dashboard (or sign-in), not the public marketing landing. The apex
  // (mathetes.live) keeps serving the marketing page at "/".
  if (isAdminHost && path === "/") {
    const url = request.nextUrl.clone();
    url.pathname = user ? "/dashboard" : "/signin";
    return NextResponse.redirect(url);
  }

  const isProtected = ADMIN_PREFIXES.some((p) => path.startsWith(p));

  if (isProtected && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("redirect", path);
    return NextResponse.redirect(url);
  }

  return response;
}
