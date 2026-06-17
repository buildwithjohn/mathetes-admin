"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Lock,
  Eye,
  EyeOff,
  Loader2,
  AlertCircle,
  Sunrise,
  CheckCircle2,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function WelcomePage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [hasSession, setHasSession] = useState(false);
  const [name, setName] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setHasSession(!!data.user);
      setName(
        (data.user?.user_metadata?.name as string | undefined) ??
          data.user?.email ??
          null
      );
      setChecking(false);
    });
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password.length < 8) {
      setError("Use at least 8 characters.");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match.");
      return;
    }
    setSaving(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setError(error.message);
      setSaving(false);
      return;
    }
    router.push("/dashboard");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-parchment px-5 py-10 text-ink">
      <div className="w-full max-w-sm">
        <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
          <div className="h-1.5 w-full bg-copper" />
          <div className="px-6 py-8 sm:px-7">
            <div className="flex h-11 w-11 items-center justify-center rounded-full bg-copper/10 text-copper">
              <Sunrise size={22} strokeWidth={1.5} />
            </div>
            <h1 className="mt-4 font-display text-3xl tracking-tight text-ink">
              {hasSession ? `Welcome${name ? `, ${name}` : ""}` : "Set your password"}
            </h1>
            <p className="mt-1 text-sm text-ink/60">
              Choose a password. You will use it for both the admin dashboard and
              the Mathetes mobile app.
            </p>

            {checking ? (
              <div className="mt-8 flex items-center gap-2 text-sm text-ink/50">
                <Loader2 size={16} className="animate-spin" /> Checking your
                invite...
              </div>
            ) : !hasSession ? (
              <div className="mt-6 flex items-start gap-2 rounded-lg border border-oxblood/20 bg-oxblood/5 px-3 py-3 text-sm text-oxblood">
                <AlertCircle size={16} className="mt-0.5 shrink-0" />
                <span>
                  This invite link is invalid or has expired. Ask an admin to
                  resend it, or{" "}
                  <Link href="/signin" className="underline">
                    sign in
                  </Link>{" "}
                  if you already have a password.
                </span>
              </div>
            ) : (
              <form onSubmit={onSubmit}>
                <label
                  htmlFor="password"
                  className="mt-7 block text-sm font-medium text-ink"
                >
                  New password
                </label>
                <div className="relative mt-1.5">
                  <Lock
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
                  />
                  <input
                    id="password"
                    type={show ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-border bg-parchment py-2.5 pl-10 pr-11 text-ink outline-none transition focus:border-copper focus:ring-2 focus:ring-copper/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShow((s) => !s)}
                    aria-label={show ? "Hide password" : "Show password"}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-ink/40 transition hover:bg-surface-2 hover:text-ink/70"
                  >
                    {show ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>

                <label
                  htmlFor="confirm"
                  className="mt-4 block text-sm font-medium text-ink"
                >
                  Confirm password
                </label>
                <div className="relative mt-1.5">
                  <Lock
                    size={17}
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/40"
                  />
                  <input
                    id="confirm"
                    type={show ? "text" : "password"}
                    required
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-border bg-parchment py-2.5 pl-10 pr-3 text-ink outline-none transition focus:border-copper focus:ring-2 focus:ring-copper/20"
                  />
                </div>

                {error && (
                  <div className="mt-4 flex items-start gap-2 rounded-lg border border-oxblood/20 bg-oxblood/5 px-3 py-2 text-sm text-oxblood">
                    <AlertCircle size={16} className="mt-0.5 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={saving}
                  className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-copper py-2.5 font-medium text-white shadow-sm transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {saving ? (
                    <>
                      <Loader2 size={18} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={18} /> Set password and continue
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
        <p className="mt-6 text-center text-sm italic text-ink/40">
          In all thy ways acknowledge him.
        </p>
      </div>
    </main>
  );
}
