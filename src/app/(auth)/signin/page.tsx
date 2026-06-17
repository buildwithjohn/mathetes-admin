"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Sunrise,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-parchment" />}>
      <SignInScreen />
    </Suspense>
  );
}

function SignInScreen() {
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
    <main className="flex min-h-screen flex-col bg-parchment lg:flex-row">
      <BrandPanel />

      {/* Form side */}
      <div className="flex flex-1 items-center justify-center px-5 py-10 sm:px-8">
        <div className="w-full max-w-sm">
          <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
            <div className="h-1.5 w-full bg-copper" />
            <form onSubmit={onSubmit} className="px-6 py-8 sm:px-7">
              <h1 className="font-display text-3xl tracking-tight text-ink">
                Welcome back
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

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded-lg border border-oxblood/20 bg-oxblood/5 px-3 py-2 text-sm text-oxblood">
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

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
      </div>
    </main>
  );
}

/** Animated, on-brand illustration panel (CSS/SVG only — no image assets). */
function BrandPanel() {
  // Rising "embers" of light.
  const embers = [
    { left: "18%", delay: "0s", dur: "7s", size: 6 },
    { left: "34%", delay: "2.4s", dur: "8.5s", size: 4 },
    { left: "52%", delay: "1.2s", dur: "6.5s", size: 5 },
    { left: "68%", delay: "3.1s", dur: "9s", size: 4 },
    { left: "82%", delay: "0.8s", dur: "7.8s", size: 6 },
  ];

  return (
    <aside
      className="relative flex h-52 w-full shrink-0 items-center justify-center overflow-hidden text-white sm:h-60 lg:h-auto lg:w-1/2"
      style={{
        backgroundImage:
          "linear-gradient(135deg, #7a1f28 0%, #9B2C36 45%, #F33A49 100%)",
      }}
    >
      {/* Soft moving sheen */}
      <div
        className="anim-sheen pointer-events-none absolute -inset-1/4 rounded-full blur-3xl"
        style={{
          background:
            "radial-gradient(circle, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0) 60%)",
        }}
      />
      {/* Floating blurred orbs */}
      <div className="anim-float pointer-events-none absolute -left-10 top-6 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="anim-float-rev pointer-events-none absolute -right-12 bottom-0 h-52 w-52 rounded-full bg-black/10 blur-2xl" />

      {/* Rising embers */}
      {embers.map((e, i) => (
        <span
          key={i}
          className="anim-rise pointer-events-none absolute bottom-6 rounded-full bg-white/70"
          style={{
            left: e.left,
            width: e.size,
            height: e.size,
            animationDelay: e.delay,
            animationDuration: e.dur,
          }}
        />
      ))}

      {/* Center motif: pulsing halo + slow dashed ring + sunrise */}
      <div className="relative z-10 flex flex-col items-center px-8 text-center">
        <div className="relative flex h-20 w-20 items-center justify-center lg:h-28 lg:w-28">
          <span className="anim-ring absolute inset-0 rounded-full border border-white/40" />
          <span
            className="anim-ring absolute inset-0 rounded-full border border-white/40"
            style={{ animationDelay: "1.5s" }}
          />
          <span
            className="anim-ring absolute inset-0 rounded-full border border-white/40"
            style={{ animationDelay: "3s" }}
          />
          <span className="anim-spin-slow absolute inset-[-14px] rounded-full border border-dashed border-white/25" />
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 backdrop-blur-sm lg:h-20 lg:w-20">
            <Sunrise className="anim-float h-7 w-7 lg:h-10 lg:w-10" strokeWidth={1.5} />
          </span>
        </div>

        <span className="mt-4 text-[10px] font-semibold uppercase tracking-[0.3em] text-white/70 lg:mt-6">
          CCCFSP FUOYE
        </span>
        <h2 className="mt-1 font-display text-3xl font-medium tracking-tight lg:text-5xl">
          Mathetes
        </h2>
        <p className="font-display text-lg italic text-white/90 lg:mt-1 lg:text-2xl">
          Follow daily.
        </p>
        <p className="mt-3 hidden max-w-xs text-sm leading-relaxed text-white/70 lg:block">
          His mercies are new every morning. Tend the daily Word, the
          devotionals, and your house fellowship — all in one place.
        </p>
      </div>
    </aside>
  );
}
