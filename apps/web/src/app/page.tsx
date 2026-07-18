import { cn } from "@/lib/utils";
import Link from "next/link";

export default function HomePage() {
  return (
    <div className="overflow-x-hidden bg-shea text-on-surface">
      <header className="fixed top-0 z-50 flex h-14 w-full items-center justify-between bg-shea px-5 md:px-20">
        <span className="font-[family-name:var(--font-display)] text-xl font-semibold tracking-tighter text-indigo-ink">
          CHW COMPANION
        </span>
        <nav className="flex items-center gap-4">
          <Link
            href="/dashboard"
            className="hidden text-sm font-bold uppercase tracking-widest text-indigo-ink md:inline"
          >
            Dashboard
          </Link>
          <a
            href="#demo"
            className="flex h-12 items-center bg-clay px-8 text-xs font-bold uppercase tracking-widest text-white transition-transform active:scale-95"
          >
            Watch demo
          </a>
        </nav>
      </header>

      <main className="pt-14">
        <section className="flex min-h-[870px] flex-col items-center overflow-hidden px-5 py-8 md:flex-row md:px-20">
          <div className="relative flex w-full items-center justify-center py-12 md:w-1/2">
            <div className="relative z-10 h-[580px] w-[280px] overflow-hidden rounded-[40px] border-[8px] border-indigo-ink bg-indigo-ink shadow-2xl ring-4 ring-indigo-ink/10">
              <div className="flex h-full w-full flex-col bg-shea">
                <div className="flex h-14 items-center justify-between bg-indigo-ink px-4 text-white">
                  <span className="text-sm">☰</span>
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    Checklist
                  </span>
                  <span className="text-sm">☁︎</span>
                </div>
                <div className="flex items-center justify-between bg-[#14130b] px-4 py-1 text-[10px] text-white">
                  <span>OFFLINE MODE</span>
                  <span>TAMALE N.</span>
                </div>
                <div className="space-y-4 p-4">
                  <div className="border border-l-4 border-ember bg-white/50 p-3">
                    <p className="mb-1 text-[10px] font-bold uppercase tracking-widest text-ember">
                      Danger sign detected
                    </p>
                    <p className="font-[family-name:var(--font-display)] text-sm font-semibold">
                      Heavy vaginal bleeding
                    </p>
                  </div>
                  {[
                    "Heavy vaginal bleeding",
                    "Severe headache / blurred vision",
                    "High fever",
                  ].map((q, i) => (
                    <div
                      key={q}
                      className="flex items-center gap-3 border border-indigo-ink/10 bg-white p-3"
                    >
                      <div className="flex h-6 w-6 items-center justify-center border-2 border-indigo-ink text-xs">
                        {i === 0 ? "✓" : ""}
                      </div>
                      <p className="text-xs">{q}</p>
                    </div>
                  ))}
                  <div className="fugu-pattern mt-4 h-16 w-full border border-indigo-ink/20" />
                </div>
              </div>
            </div>
            <div className="absolute bottom-10 right-4 z-20 max-w-[200px] border-l-4 border-clay bg-white p-6 shadow-xl md:-right-10">
              <p className="mb-2 text-clay">⚡</p>
              <p className="font-[family-name:var(--font-display)] text-lg font-semibold leading-tight">
                Fastest Referral Path
              </p>
              <p className="mt-2 text-xs opacity-70">
                Calculated via offline-first logic.
              </p>
            </div>
          </div>

          <div className="mt-12 w-full md:mt-0 md:w-1/2 md:pl-16">
            <h1 className="mb-6 font-[family-name:var(--font-display)] text-4xl font-bold leading-[1.1] text-indigo-ink md:text-5xl">
              A tool for the moments between a{" "}
              <span className="text-clay">danger sign</span> and a decision.
            </h1>
            <p className="mb-10 max-w-xl text-lg text-on-surface-variant">
              Built for CHPS compounds with no signal, no power, and no time to
              spare. Local resilience for the front lines of healthcare.
            </p>
            <div className="flex flex-col gap-4 sm:flex-row">
              <Link
                href="/dashboard"
                className="flex h-14 items-center justify-center bg-indigo-ink px-10 text-xs font-bold uppercase tracking-widest text-white hover:bg-[#20263d]"
              >
                Explore the platform
              </Link>
              <Link
                href="/specs"
                className="flex h-14 items-center justify-center border-2 border-clay px-10 text-xs font-bold uppercase tracking-widest text-clay transition-all hover:bg-clay hover:text-white"
              >
                Technical Specs
              </Link>
            </div>
          </div>
        </section>

        <section className="border-y-2 border-indigo-ink/10 bg-shea px-5 py-16">
          <div className="mx-auto max-w-4xl text-center">
            <h2 className="font-[family-name:var(--font-display)] text-3xl font-bold leading-tight text-indigo-ink md:text-5xl">
              &ldquo;In Northern Ghana,{" "}
              <span className="border-b-4 border-clay">distance and delay</span>{" "}
              cost lives that timely referral could save.&rdquo;
            </h2>
            <div className="mt-12 flex justify-center">
              <div className="h-2 w-24 bg-indigo-ink" />
            </div>
          </div>
        </section>

        <section
          id="demo"
          className="fugu-pattern bg-shea px-5 py-16 md:px-20"
        >
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <HowBlock
              step="01 — ASSESSMENT"
              title="Intelligent Strip Meter"
              body="Visualizing critical urgency through discrete vertical blocks, inspired by fugu weaving rhythms."
            >
              <div className="mt-auto flex gap-1">
                {[1, 1, 1, 2, 2, 0, 0, 0].map((v, i) => (
                  <div
                    key={i}
                    className={cn(
                      "mr-1 h-8 w-2",
                      v === 1 && "bg-surface-tint",
                      v === 2 && "bg-clay",
                      v === 0 && "bg-[#e7e2d5]"
                    )}
                  />
                ))}
              </div>
            </HowBlock>
            <div className="relative flex h-full flex-col bg-ember p-8 text-white">
              <span className="mb-6 font-[family-name:var(--font-mono)] text-sm text-white/70">
                02 — DIAGNOSIS
              </span>
              <h3 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-semibold">
                High-Alert Verification
              </h3>
              <p className="mb-12 text-base opacity-90">
                When thresholds are met, the interface shifts to extreme contrast
                for immediate legibility in direct sunlight.
              </p>
              <div className="mt-auto flex items-center justify-between border-2 border-white p-4">
                <span className="text-xs font-bold uppercase tracking-widest">
                  Urgent referral
                </span>
                <span>⚠</span>
              </div>
            </div>
            <HowBlock
              step="03 — ACTION"
              title="Referral Stepper"
              body="Guiding the health worker through the definitive steps of handoff and transport logistics."
              accent="clay"
            >
              <div className="mt-auto space-y-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-ink font-[family-name:var(--font-mono)] text-sm text-white">
                    1
                  </div>
                  <div className="h-px flex-1 bg-indigo-ink/20" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-widest">
                  Contact facility
                </p>
              </div>
            </HowBlock>
          </div>
        </section>

        <section className="bg-indigo-ink px-5 py-24 text-white md:px-20">
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-12 md:flex-row">
            <div className="w-full md:w-1/3">
              <h2 className="font-[family-name:var(--font-display)] text-2xl font-semibold">
                Trusted Protocols
              </h2>
              <p className="mt-4 text-on-primary-container">
                Built upon the foundation of global health excellence and local
                clinical guidelines.
              </p>
            </div>
            <div className="grid w-full grid-cols-2 gap-8 md:w-2/3 md:grid-cols-4">
              {[
                ["WHO", "IMCI Standards"],
                ["UNICEF", "Community Kit"],
                ["GHS", "Referral Policy"],
                ["USAID", "Digital Health"],
              ].map(([org, label]) => (
                <div
                  key={org}
                  className="flex flex-col opacity-60 transition-opacity hover:opacity-100"
                >
                  <span className="font-[family-name:var(--font-mono)] uppercase tracking-widest">
                    {org}
                  </span>
                  <span className="mt-1 text-[10px]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <footer className="border-t border-white/10 bg-indigo-ink px-5 pb-10 pt-20 md:px-20">
          <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-12 md:flex-row">
            <div className="max-w-xs">
              <h4 className="mb-6 font-[family-name:var(--font-display)] text-xl text-white">
                CHW COMPANION
              </h4>
              <p className="text-on-primary-container">
                UNICEF StartUp Lab — AI for Nurturing Care. Offline-first
                companion for maternal, newborn, and under-5 survival in Northern
                Ghana.
              </p>
              <p className="mt-4 text-xs text-on-primary-container">
                Clinical content adapted from WHO/UNICEF and Ghana Health Service
                job aids for CHPS compounds.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-16">
              <div>
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white">
                  Platform
                </p>
                <ul className="space-y-2 font-[family-name:var(--font-mono)] text-sm text-on-primary-container">
                  <li>
                    <Link href="/specs" className="hover:text-white">
                      Documentation
                    </Link>
                  </li>
                  <li>
                    <Link href="/dashboard" className="hover:text-white">
                      District dashboard
                    </Link>
                  </li>
                  <li>
                    <span>Offline Sync</span>
                  </li>
                </ul>
              </div>
              <div>
                <p className="mb-4 text-xs font-bold uppercase tracking-widest text-white">
                  Contact
                </p>
                <ul className="space-y-2 font-[family-name:var(--font-mono)] text-sm text-on-primary-container">
                  <li>Node Eight Studio</li>
                  <li>Northern Region</li>
                </ul>
              </div>
            </div>
          </div>
          <div className="mt-20 flex flex-col items-center justify-between gap-4 border-t border-white/5 pt-8 md:flex-row">
            <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-widest text-on-primary-container">
              © 2026 CHW COMPANION · NORTHERN GHANA · HACKATHON PROTOTYPE
            </p>
          </div>
        </footer>
      </main>
    </div>
  );
}

function HowBlock({
  step,
  title,
  body,
  children,
  accent = "tint",
}: {
  step: string;
  title: string;
  body: string;
  children: React.ReactNode;
  accent?: "tint" | "clay";
}) {
  return (
    <div className="relative flex h-full flex-col border border-indigo-ink/20 bg-shea p-8">
      <div
        className={cn(
          "absolute left-0 top-0 h-full w-1",
          accent === "clay" ? "bg-clay" : "bg-surface-tint"
        )}
      />
      <span className="mb-6 font-[family-name:var(--font-mono)] text-sm text-outline">
        {step}
      </span>
      <h3 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-semibold">
        {title}
      </h3>
      <p className="mb-12 text-on-surface-variant">{body}</p>
      {children}
    </div>
  );
}
