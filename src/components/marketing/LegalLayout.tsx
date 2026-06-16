import Link from "next/link";

// Shared shell for the public legal pages (/privacy, /terms): branded header,
// prose body, and a footer that cross-links Privacy / Terms / Home.
export function LegalLayout({
  title,
  lastUpdated,
  children,
}: {
  title: string;
  lastUpdated: string;
  children: React.ReactNode;
}) {
  return (
    <main className="min-h-screen bg-parchment px-5 py-12 text-ink">
      <article className="mx-auto max-w-3xl">
        <header className="border-b border-border pb-6">
          <Link
            href="/"
            className="text-xs font-semibold uppercase tracking-[0.3em] text-copper"
          >
            Mathetes · CCCFSP FUOYE
          </Link>
          <h1 className="mt-3 font-display text-4xl tracking-tight">{title}</h1>
          <p className="mt-2 text-sm text-ink/50">Last updated: {lastUpdated}</p>
        </header>

        <div className="legal-prose mt-8">{children}</div>

        <footer className="mt-12 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border pt-6 text-sm text-ink/50">
          <Link href="/privacy" className="hover:text-copper">
            Privacy
          </Link>
          <span aria-hidden>·</span>
          <Link href="/terms" className="hover:text-copper">
            Terms
          </Link>
          <span aria-hidden>·</span>
          <Link href="/" className="hover:text-copper">
            Home
          </Link>
          <span className="ml-auto italic">
            Celestial Church of Christ Federal Students Parish, FUOYE.
          </span>
        </footer>
      </article>
    </main>
  );
}
