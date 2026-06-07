import Link from "next/link";

// Marketing landing at the root domain.
export default function LandingPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-parchment px-6 text-ink">
      <div className="flex flex-col items-center text-center">
        <span className="mb-3 text-xs uppercase tracking-[0.3em] text-copper">
          CCCFSP FUOYE
        </span>
        <h1 className="font-display text-6xl font-medium tracking-tight md:text-7xl">
          Mathetes
        </h1>
        <p className="mt-4 font-display text-2xl text-oxblood md:text-3xl">
          Follow daily.
        </p>
        <p className="mt-6 max-w-md text-base leading-relaxed text-ink/70">
          A campus discipleship companion: a daily Word, devotionals from your
          pastor, the Bible in your pocket, and your house fellowship close by.
        </p>
        <div className="mt-10 flex items-center gap-4">
          <span className="rounded-full border border-border px-5 py-2 text-sm text-ink/60">
            iOS &amp; Android coming soon
          </span>
          <Link
            href="/signin"
            className="rounded-full bg-copper px-5 py-2 text-sm font-medium text-parchment transition hover:opacity-90"
          >
            Admin sign in
          </Link>
        </div>
      </div>
      <footer className="absolute bottom-8 text-sm italic text-ink/50">
        In all thy ways acknowledge him.
      </footer>
    </main>
  );
}
