import Link from "next/link";
import Image from "next/image";
import {
  BookOpenText,
  Sparkles,
  Users,
  HandHeart,
  MessageCircleHeart,
  CalendarHeart,
} from "lucide-react";

const FEATURES = [
  {
    icon: Sparkles,
    title: "A daily Word",
    body: "Start every day with the Word of the Day and a devotional from your pastor, with audio and a growing archive.",
  },
  {
    icon: BookOpenText,
    title: "The Bible in your pocket",
    body: "Read the King James Version in a calm, comfortable layout. Search, bookmark, highlight, and keep your own notes.",
  },
  {
    icon: Users,
    title: "Your house, close by",
    body: "House fellowship chats, direct messages, and a member directory, with conservative privacy built in.",
  },
  {
    icon: HandHeart,
    title: "Pray together",
    body: "Share requests on the prayer wall, stand with one another, and ask your pastor a question when you need to.",
  },
  {
    icon: MessageCircleHeart,
    title: "Verse images",
    body: "Turn any verse into a beautiful image in your house colours, ready to save and share.",
  },
  {
    icon: CalendarHeart,
    title: "Keep the habit",
    body: "Build a daily streak and let devotion become a rhythm, not a resolution.",
  },
];

function Wordmark({ size = 26 }: { size?: number }) {
  return (
    <span className="flex items-center gap-2">
      <Image
        src="/flame.png"
        alt=""
        width={Math.round(size * 0.42)}
        height={size}
        className="h-[1.1em] w-auto"
        priority
      />
      <span className="font-display text-xl tracking-tight text-ink">
        Mathetes
      </span>
    </span>
  );
}

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-parchment text-ink">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Wordmark />
        <Link
          href="/signin"
          className="rounded-full border border-border bg-white px-4 py-2 text-sm font-medium text-ink/80 transition hover:border-copper hover:text-copper"
        >
          Admin sign in
        </Link>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden
          className="pointer-events-none absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-copper/10 blur-3xl"
        />
        <div className="mx-auto grid max-w-6xl items-center gap-12 px-6 pb-8 pt-10 md:grid-cols-2 md:pt-16">
          <div className="text-center md:text-left">
            <span className="text-xs font-semibold uppercase tracking-[0.35em] text-copper">
              CCCFSP FUOYE
            </span>
            <h1 className="mt-4 font-display text-6xl font-medium leading-[0.95] tracking-tight md:text-7xl">
              Follow
              <br />
              daily.
            </h1>
            <p className="mx-auto mt-6 max-w-md text-lg leading-relaxed text-ink/70 md:mx-0">
              Mathetes is a campus discipleship companion: a daily Word,
              devotionals from your pastor, the Bible in your pocket, and your
              house fellowship close by.
            </p>
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row md:items-start md:justify-start">
              <span className="inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-medium text-parchment">
                <Image
                  src="/flame.png"
                  alt=""
                  width={9}
                  height={22}
                  className="h-4 w-auto"
                />
                Coming soon to Android and iOS
              </span>
              <span className="text-sm text-ink/45">Free for the fellowship</span>
            </div>
          </div>

          {/* Phone mockup */}
          <div className="flex justify-center md:justify-end">
            <div className="w-[264px] rounded-[2.6rem] border border-black/10 bg-[#16232f] p-3 shadow-2xl shadow-ink/20">
              <div className="rounded-[2rem] bg-[#1b2a38] px-6 py-10">
                <p className="text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-[#7ea8cd]">
                  Word of the Day
                </p>
                <p className="mt-10 text-center font-display text-[26px] leading-snug text-[#eef1f4]">
                  In all thy ways acknowledge him, and he shall direct thy paths.
                </p>
                <div className="mx-auto mt-6 h-px w-8 bg-[#7ea8cd]" />
                <p className="mt-5 text-center text-sm text-[#7ea8cd]">
                  Proverbs 3:6
                </p>
                <div className="mt-16 flex items-end justify-between">
                  <span className="font-display text-lg text-[#eef1f4]">
                    Mathetes
                  </span>
                  <span className="text-[10px] uppercase tracking-widest text-[#6b8299]">
                    CCCFSP FUOYE
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl tracking-tight">
            Everything for the walk, in one place
          </h2>
          <p className="mt-4 text-ink/60">
            Built for the CCCFSP FUOYE family, with room to grow as the
            fellowship grows.
          </p>
        </div>
        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-3xl border border-border bg-white p-7 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-ink/5"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-copper/10 text-copper">
                <f.icon size={22} strokeWidth={1.8} />
              </span>
              <h3 className="mt-5 font-display text-xl text-ink">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink/60">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Scripture band */}
      <section className="px-6 pb-20">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-ink px-8 py-16 text-center text-parchment md:py-20">
          <Image
            src="/flame.png"
            alt=""
            width={26}
            height={64}
            className="mx-auto h-12 w-auto"
          />
          <p className="mx-auto mt-6 max-w-2xl font-display text-3xl leading-snug md:text-4xl">
            &ldquo;And the disciples were called Christians first in
            Antioch.&rdquo;
          </p>
          <p className="mt-4 text-sm uppercase tracking-[0.3em] text-parchment/50">
            Acts 11:26
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-center sm:flex-row sm:text-left">
          <div>
            <Wordmark size={22} />
            <p className="mt-2 text-sm italic text-ink/45">
              In all thy ways acknowledge him.
            </p>
          </div>
          <nav className="flex items-center gap-4 text-sm text-ink/50">
            <Link href="/privacy" className="hover:text-copper">
              Privacy
            </Link>
            <span aria-hidden>·</span>
            <Link href="/terms" className="hover:text-copper">
              Terms
            </Link>
            <span aria-hidden>·</span>
            <Link href="/delete-account" className="hover:text-copper">
              Delete account
            </Link>
          </nav>
        </div>
        <p className="pb-8 text-center text-xs text-ink/35">
          © {new Date().getFullYear()} Mathetes · CCCFSP FUOYE
        </p>
      </footer>
    </main>
  );
}
