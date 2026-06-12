import type { Metadata } from "next";
import { Check } from "lucide-react";

export const metadata: Metadata = {
  title: "Email confirmed · Mathetes",
  description: "Your Mathetes account is verified. Open the app and sign in.",
};

// Public email-confirmation landing. Supabase verifies the account server-side
// and redirects here; this page touches no database and needs no auth. It lives
// in the (public) route group and is not listed in the middleware admin gate.
export default function ConfirmedPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-parchment px-5 py-10 text-ink">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
        {/* 6px red top bar */}
        <div className="h-1.5 w-full bg-copper" />

        <div className="flex flex-col items-center px-6 py-10 text-center sm:px-10 sm:py-12">
          <span className="text-xs font-semibold uppercase tracking-[0.3em] text-copper">
            CCCFSP FUOYE
          </span>

          <h1 className="mt-3 font-display text-5xl font-medium tracking-tight">
            Mathetes
          </h1>
          <p className="mt-1 font-display text-xl italic text-oxblood">
            Follow daily.
          </p>

          {/* Red circular checkmark badge */}
          <div className="mt-8 flex h-16 w-16 items-center justify-center rounded-full bg-copper text-white shadow-sm">
            <Check size={32} strokeWidth={3} />
          </div>

          <h2 className="mt-6 font-display text-3xl tracking-tight">
            Email confirmed!
          </h2>
          <p className="mt-3 max-w-sm text-base leading-relaxed text-ink/70">
            Your account is verified. Open the Mathetes app and sign in to set up
            your campus, house, and profile.
          </p>

          <a
            href="mathetes://"
            className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-copper px-6 py-3 text-base font-medium text-white transition hover:opacity-90 sm:w-auto"
          >
            Open Mathetes
          </a>

          <p className="mt-4 max-w-xs text-sm text-ink/45">
            If nothing happens, return to the app and tap &ldquo;I have confirmed,
            sign in.&rdquo;
          </p>
        </div>
      </div>

      <footer className="mt-8 max-w-md text-center text-xs text-ink/40">
        Celestial Church of Christ Federal Students Parish, FUOYE.
      </footer>
    </main>
  );
}
