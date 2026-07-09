import Link from "next/link";
import Image from "next/image";
import {
  BookOpenText,
  Sparkles,
  Users,
  HandHeart,
  MessageCircleHeart,
  CalendarHeart,
  Play,
} from "lucide-react";
import { createAdminClient } from "@/lib/supabase/admin";

// Public Play listing. Swap for the store URL / opt-in link as the track changes.
const PLAY_URL =
  "https://play.google.com/store/apps/details?id=app.mathetes.mobile";

// Drop a real captured app screenshot here later ("/today.png" in /public) to
// show it inside the phone frame instead of the live verse.
const HERO_SCREENSHOT = "";

export const revalidate = 1800;

type Word = { verse_ref: string; verse_text: string };

const FALLBACK_WORD: Word = {
  verse_ref: "Proverbs 3:6",
  verse_text: "In all thy ways acknowledge him, and he shall direct thy paths.",
};

async function getTodaysWord(): Promise<Word> {
  const admin = createAdminClient();
  if (!admin) return FALLBACK_WORD;
  const today = new Date().toISOString().slice(0, 10);
  const { data } = await admin
    .from("word_of_day")
    .select("verse_ref, verse_text")
    .eq("status", "published")
    .lte("publish_date", today)
    .order("publish_date", { ascending: false })
    .limit(1)
    .maybeSingle();
  return data ?? FALLBACK_WORD;
}

const FEATURES = [
  {
    icon: Sparkles,
    title: "A daily Word",
    body: "The Word of the Day and a devotional from your pastor, with audio and a growing archive.",
  },
  {
    icon: BookOpenText,
    title: "The Bible, in your pocket",
    body: "The King James Version in a calm, readable layout. Search, bookmark, highlight, and keep your notes.",
  },
  {
    icon: Users,
    title: "Your house, close by",
    body: "House chats, direct messages, and a member directory, with conservative privacy built in.",
  },
  {
    icon: HandHeart,
    title: "Pray together",
    body: "Share requests on the prayer wall, stand with one another, and ask your pastor when you need to.",
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

function PlayButton({ dark = false }: { dark?: boolean }) {
  return (
    <a
      href={PLAY_URL}
      className={
        dark
          ? "inline-flex items-center gap-3 rounded-2xl bg-white px-6 py-3.5 text-ink shadow-lg shadow-black/20 transition hover:-translate-y-0.5"
          : "inline-flex items-center gap-3 rounded-2xl bg-ink px-6 py-3.5 text-parchment transition hover:-translate-y-0.5"
      }
    >
      <Play
        size={24}
        className={dark ? "fill-ink" : "fill-parchment"}
        strokeWidth={0}
      />
      <span className="flex flex-col text-left leading-none">
        <span
          className={`text-[10px] uppercase tracking-wide ${dark ? "text-ink/55" : "text-parchment/60"}`}
        >
          Get it on
        </span>
        <span className="text-lg font-semibold">Google Play</span>
      </span>
    </a>
  );
}

function Phone({ word }: { word: Word }) {
  return (
    <div className="relative w-[280px]">
      <div className="rounded-[3rem] border border-white/10 bg-[#0f171f] p-2.5 shadow-2xl shadow-black/50 ring-1 ring-black/40">
        <div className="relative overflow-hidden rounded-[2.5rem] bg-[#1b2a38]">
          <div className="absolute left-1/2 top-2 h-5 w-24 -translate-x-1/2 rounded-full bg-black/70" />
          {HERO_SCREENSHOT ? (
            <Image
              src={HERO_SCREENSHOT}
              alt="Mathetes app"
              width={560}
              height={1200}
            />
          ) : (
            <div className="px-7 py-14">
              <p className="text-center text-[11px] font-semibold uppercase tracking-[0.32em] text-[#7ea8cd]">
                Word of the Day
              </p>
              <p className="mt-12 text-center font-display text-[25px] leading-snug text-[#eef1f4]">
                {word.verse_text}
              </p>
              <div className="mx-auto mt-7 h-px w-8 bg-[#7ea8cd]" />
              <p className="mt-6 text-center text-sm text-[#7ea8cd]">
                {word.verse_ref}
              </p>
              <div className="mt-20 flex items-end justify-between">
                <span className="font-display text-lg text-[#eef1f4]">
                  Mathetes
                </span>
                <span className="text-[10px] uppercase tracking-widest text-[#6b8299]">
                  CCCFSP FUOYE
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default async function LandingPage() {
  const word = await getTodaysWord();

  return (
    <main className="bg-parchment text-ink">
      {/* ===== Hero (dark) ===== */}
      <section className="relative isolate overflow-hidden bg-[#15120E] text-[#F7F5F1]">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[38%] h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-copper/20 blur-[130px]"
        />
        <header className="relative mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
          <span className="flex items-center gap-2">
            <Image
              src="/flame.png"
              alt=""
              width={11}
              height={26}
              className="h-6 w-auto"
              priority
            />
            <span className="font-display text-xl tracking-tight">Mathetes</span>
          </span>
          <Link
            href="/signin"
            className="rounded-full border border-white/20 px-4 py-2 text-sm font-medium text-white/80 transition hover:border-white/50 hover:text-white"
          >
            Admin sign in
          </Link>
        </header>

        <div className="relative mx-auto max-w-3xl px-6 pb-4 pt-14 text-center md:pt-20">
          <span className="text-xs font-semibold uppercase tracking-[0.4em] text-copper">
            CCCFSP FUOYE
          </span>
          <h1 className="mt-6 font-display text-7xl font-medium leading-[0.9] tracking-tight md:text-8xl">
            Follow daily.
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-lg leading-relaxed text-[#F7F5F1]/65 md:text-xl">
            A discipleship companion for Celestial Church of Christ student
            fellowships, beginning with CCCFSP at FUOYE. A daily Word, the Bible
            in your pocket, and your house fellowship close by.
          </p>
          <div className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <PlayButton dark />
            <span className="text-sm text-[#F7F5F1]/50">
              Free for the fellowship
            </span>
          </div>
        </div>

        <div className="relative flex justify-center px-6 pb-0 pt-16">
          <div className="translate-y-16">
            <Phone word={word} />
          </div>
        </div>
      </section>

      {/* ===== Features (light) ===== */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-28">
        <div className="mx-auto max-w-2xl text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.35em] text-copper">
            Everything, in one place
          </span>
          <h2 className="mt-4 font-display text-4xl leading-tight tracking-tight md:text-5xl">
            Everything for the walk
          </h2>
          <p className="mt-4 text-lg text-ink/55">
            Built for the CCCFSP FUOYE family, with room to grow as more
            fellowships come on board.
          </p>
        </div>
        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="group bg-white p-8 transition hover:bg-parchment"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-copper/10 text-copper transition group-hover:bg-copper group-hover:text-white">
                <f.icon size={23} strokeWidth={1.7} />
              </span>
              <h3 className="mt-6 font-display text-xl text-ink">{f.title}</h3>
              <p className="mt-2 text-[15px] leading-relaxed text-ink/55">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ===== Scripture band (dark) ===== */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-5xl overflow-hidden rounded-[2.75rem] bg-[#15120E] px-8 py-20 text-center text-[#F7F5F1] md:py-28">
          <Image
            src="/flame.png"
            alt=""
            width={26}
            height={64}
            className="mx-auto h-14 w-auto"
          />
          <p className="mx-auto mt-8 max-w-3xl font-display text-3xl leading-snug tracking-tight md:text-5xl">
            &ldquo;And the disciples were called Christians first in
            Antioch.&rdquo;
          </p>
          <p className="mt-6 text-sm uppercase tracking-[0.35em] text-[#F7F5F1]/45">
            Acts 11:26
          </p>
        </div>
      </section>

      {/* ===== Closing CTA (light) ===== */}
      <section className="mx-auto max-w-4xl px-6 pb-28 text-center">
        <h2 className="font-display text-4xl leading-tight tracking-tight md:text-5xl">
          Bring your whole fellowship along.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-lg text-ink/55">
          Start your day in the Word, and keep your house close, wherever you
          are on campus.
        </p>
        <div className="mt-10 flex justify-center">
          <PlayButton />
        </div>
      </section>

      {/* ===== Footer ===== */}
      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-10 text-center sm:flex-row sm:text-left">
          <div>
            <span className="flex items-center justify-center gap-2 sm:justify-start">
              <Image
                src="/flame.png"
                alt=""
                width={9}
                height={22}
                className="h-5 w-auto"
              />
              <span className="font-display text-lg tracking-tight text-ink">
                Mathetes
              </span>
            </span>
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
