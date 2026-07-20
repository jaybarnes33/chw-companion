import Link from "next/link";
import { checklistDisclaimer, nutritionDisclaimer } from "@nyaaba/content";

export default function SpecsPage() {
  return (
    <div className="min-h-screen bg-shea text-on-surface">
      <header className="flex h-14 items-center justify-between border-b-2 border-indigo-ink bg-indigo-ink px-5 text-white">
        <Link href="/" className="font-[family-name:var(--font-display)] font-semibold">
          NYAABA
        </Link>
        <Link href="/dashboard" className="text-xs uppercase tracking-widest">
          Dashboard
        </Link>
      </header>
      <main className="mx-auto max-w-3xl space-y-8 px-5 py-12">
        <h1 className="font-[family-name:var(--font-display)] text-4xl font-bold">
          Technical specs
        </h1>
        <p className="text-on-surface-variant">
          UNICEF StartUp Lab — AI for Nurturing Care (Northern Ghana).
          Offline-first Expo companion + Next.js district dashboard + Postgres
          sync for CHPS compounds.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-sm">
          <li>Deterministic IMCI-style risk scoring (no ML diagnosis)</li>
          <li>Local SQLite source of truth; Postgres via Prisma when online</li>
          <li>AgooSMS referral nudges (mock without API key)</li>
          <li>On-device guidance + TTS; Cactus-ready provider with safe fallback</li>
          <li>Content sourced from WHO IMPAC / IMCI / IYCF + GHS job aids</li>
        </ul>
        <div className="border-l-4 border-clay bg-[#e7e2d5] p-4 text-sm">
          <p className="font-bold">Clinical disclaimer</p>
          <p className="mt-2">{checklistDisclaimer}</p>
          <p className="mt-2">{nutritionDisclaimer}</p>
        </div>
        <pre className="overflow-x-auto border border-indigo-ink/20 bg-indigo-ink p-4 font-[family-name:var(--font-mono)] text-xs text-shea">
{`[Expo] → expo-sqlite → /api/sync → Prisma → Postgres
                 ↘ /api/sms/referral → AgooSMS`}
        </pre>
      </main>
    </div>
  );
}
