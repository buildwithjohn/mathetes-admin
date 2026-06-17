"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-parchment" />}>
      <SignInForm />
    </Suspense>
  );
}

function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-parchment px-5 py-10 text-ink">
      <div className="w-full max-w-sm">
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          {/* 6px red top bar */}
          <div className="h-1.5 w-full bg-copper" />

          <form onSubmit={onSubmit} className="px-7 py-8">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-copper">
              CCCFSP FUOYE
            </span>
            <h1 className="mt-2 font-display text-3xl tracking-tight">
              Mathetes admin
            </h1>
            <p className="mt-1 text-sm text-ink/60">
              Sign in to manage the parish.
            </p>

            {/* Email */}
            <label
              htmlFor="email"
              className="mt-7 block text-sm font-medium text-ink"
            >
              Email
            </label>
            <div className="relative mt-1.5">
              <Mail
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
              />
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="pastor@cccfsp.app"
                className="w-full rounded-xl border border-border bg-parchment py-2.5 pl-10 pr-3 text-ink outline-none transition focus:border-copper focus:ring-2 focus:ring-copper/20"
              />
            </div>

            {/* Password */}
            <label
              htmlFor="password"
              className="mt-4 block text-sm font-medium text-ink"
            >
              Password
            </label>
            <div className="relative mt-1.5">
              <Lock
                size={17}
                className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
              />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-border bg-parchment py-2.5 pl-10 pr-11 text-ink outline-none transition focus:border-copper focus:ring-2 focus:ring-copper/20"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink/40 transition hover:bg-surface-2 hover:text-ink/70"
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="mt-4 flex items-start gap-2 rounded-lg border border-oxblood/20 bg-oxblood/5 px-3 py-2 text-sm text-oxblood">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-copper py-2.5 font-medium text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm italic text-ink/40">
          In all thy ways acknowledge him.
        </p>
      </div>
    </main>
  );
}
