import { prisma } from "@nyaaba/db";
import { getChecklistItem } from "@nyaaba/content";
import { referralStatusLabel } from "@nyaaba/rules-engine";
import Link from "next/link";
import { DashboardFilters } from "@/components/DashboardFilters";
import { ReferralPipeline } from "@/components/ReferralPipeline";
import { updateReferralStatus } from "./actions";

export const dynamic = "force-dynamic";

type Search = {
  risk?: string;
  type?: string;
  status?: string;
  chw?: string;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;

  const cases = await prisma.case.findMany({
    where: {
      ...(sp.risk ? { riskTier: sp.risk as never } : {}),
      ...(sp.type ? { patientType: sp.type as never } : {}),
      ...(sp.chw ? { chwId: { contains: sp.chw } } : {}),
      ...(sp.status
        ? { referral: { status: sp.status as never } }
        : {}),
    },
    include: {
      referral: true,
      responses: true,
      timeline: { orderBy: { createdAt: "desc" }, take: 3 },
    },
    orderBy: { createdAt: "desc" },
  });

  const all = await prisma.case.findMany({
    include: { referral: true },
  });

  const counts = {
    total: all.length,
    red: all.filter((c) => c.riskTier === "RED").length,
    yellow: all.filter((c) => c.riskTier === "YELLOW").length,
    green: all.filter((c) => c.riskTier === "GREEN").length,
    openReferrals: all.filter(
      (c) => c.referral && c.referral.status !== "RESOLVED"
    ).length,
  };

  const chws = Array.from(new Set(all.map((c) => c.chwId)));

  return (
    <div className="min-h-screen bg-shea text-on-surface">
      <header className="flex h-14 items-center justify-between border-b-2 border-indigo-ink bg-indigo-ink px-5 text-white md:px-10">
        <div className="flex items-center gap-6">
          <Link href="/" className="font-[family-name:var(--font-display)] text-lg font-semibold">
            NYAABA
          </Link>
          <span className="hidden text-xs uppercase tracking-widest text-white/70 md:inline">
            District dashboard
          </span>
        </div>
        <Link href="/specs" className="text-xs font-bold uppercase tracking-widest text-white/80">
          Specs
        </Link>
      </header>

      <div className="border-b border-indigo-ink/10 bg-muted px-5 py-2 text-center font-[family-name:var(--font-mono)] text-[11px] uppercase tracking-wider text-indigo-ink md:px-10">
        District view · cases synced from CHPS compounds
      </div>

      <main className="mx-auto max-w-7xl space-y-8 px-5 py-8 md:px-10">
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {[
            ["Cases", counts.total, "indigo"],
            ["RED", counts.red, "ember"],
            ["YELLOW", counts.yellow, "clay"],
            ["GREEN", counts.green, "savanna"],
            ["Open referrals", counts.openReferrals, "indigo"],
          ].map(([label, value, tone]) => (
            <div
              key={label as string}
              className="border border-indigo-ink/15 border-l-4 bg-shea p-4"
              style={{
                borderLeftColor:
                  tone === "ember"
                    ? "#ba1a1a"
                    : tone === "clay"
                      ? "#a0410f"
                      : tone === "savanna"
                        ? "#2D6A4F"
                        : "#0b1127",
              }}
            >
              <p className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
                {label as string}
              </p>
              <p className="font-[family-name:var(--font-display)] text-3xl font-bold">
                {value as number}
              </p>
            </div>
          ))}
        </div>

        <section>
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-semibold">
            CHW summary
          </h2>
          <div className="grid gap-3 md:grid-cols-3">
            {chws.map((chw) => {
              const subset = all.filter((c) => c.chwId === chw);
              return (
                <div key={chw} className="border border-indigo-ink/15 p-4">
                  <p className="font-[family-name:var(--font-mono)] text-xs uppercase tracking-wider text-outline">
                    {chw}
                  </p>
                  <p className="mt-2 text-sm">
                    {subset.length} cases ·{" "}
                    {subset.filter((c) => c.riskTier === "RED").length} RED ·{" "}
                    {
                      subset.filter(
                        (c) => c.referral && c.referral.status !== "RESOLVED"
                      ).length
                    }{" "}
                    open
                  </p>
                </div>
              );
            })}
            {chws.length === 0 ? (
              <p className="text-on-surface-variant">No CHWs yet — run seed or sync.</p>
            ) : null}
          </div>
        </section>

        <DashboardFilters initial={sp} />

        <ReferralPipeline
          cases={cases.map((c) => ({
            id: c.id,
            name: c.patientName ?? c.id.slice(0, 8),
            riskTier: c.riskTier ?? "—",
            status: c.referral?.status ?? null,
            patientType: c.patientType,
          }))}
          updateAction={updateReferralStatus}
        />

        <section>
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-semibold">
            Cases
          </h2>
          <div className="overflow-x-auto border border-indigo-ink/15">
            <table className="w-full min-w-[800px] text-left text-sm">
              <thead className="bg-indigo-ink text-xs uppercase tracking-widest text-white">
                <tr>
                  <th className="px-4 py-3">Patient</th>
                  <th className="px-4 py-3">Community</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Referral</th>
                  <th className="px-4 py-3">CHW</th>
                  <th className="px-4 py-3">Created</th>
                  <th className="px-4 py-3">Synced</th>
                </tr>
              </thead>
              <tbody>
                {cases.map((c) => (
                  <tr
                    key={c.id}
                    className="border-t border-indigo-ink/10 align-top hover:bg-white/40"
                  >
                    <td className="px-4 py-3">
                      <Link
                        href={`/dashboard/cases/${c.id}`}
                        className="font-bold text-clay underline"
                      >
                        {c.patientName ?? c.id.slice(0, 8)}
                      </Link>
                      <div className="mt-2 space-y-1 text-xs text-on-surface-variant">
                        {c.responses
                          .filter((r) => r.answer)
                          .map((r) => {
                            const item = getChecklistItem(r.itemKey);
                            return (
                              <div key={r.id}>
                                ✓ {item?.question ?? r.itemKey}
                              </div>
                            );
                          })}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {c.community ?? "—"}
                    </td>
                    <td className="px-4 py-3 font-[family-name:var(--font-mono)] text-xs">
                      {c.patientType}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="px-2 py-1 text-xs font-bold text-white"
                        style={{
                          backgroundColor:
                            c.riskTier === "RED"
                              ? "#ba1a1a"
                              : c.riskTier === "YELLOW"
                                ? "#a0410f"
                                : c.riskTier === "GREEN"
                                  ? "#2D6A4F"
                                  : "#46464d",
                        }}
                      >
                        {c.riskTier ?? c.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {c.referral
                        ? referralStatusLabel(c.referral.status)
                        : "—"}
                    </td>
                    <td className="px-4 py-3 font-[family-name:var(--font-mono)] text-xs">
                      {c.chwId}
                    </td>
                    <td className="px-4 py-3 font-[family-name:var(--font-mono)] text-xs">
                      {c.createdAt.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 font-[family-name:var(--font-mono)] text-xs">
                      {c.syncedAt ? c.syncedAt.toLocaleString() : "pending"}
                    </td>
                  </tr>
                ))}
                {cases.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-on-surface-variant"
                    >
                      No cases match filters. Run{" "}
                      <code className="font-[family-name:var(--font-mono)]">
                        pnpm db:seed
                      </code>{" "}
                      or sync from the mobile app.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
