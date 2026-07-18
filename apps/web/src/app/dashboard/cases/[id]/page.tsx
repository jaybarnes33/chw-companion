import { prisma } from "@chw/db";
import { getChecklistItem } from "@chw/content";
import { referralStatusLabel } from "@chw/rules-engine";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const c = await prisma.case.findUnique({
    where: { id },
    include: {
      responses: true,
      referral: true,
      timeline: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!c) notFound();

  return (
    <div className="min-h-screen bg-shea text-on-surface">
      <header className="flex h-14 items-center gap-4 border-b-2 border-indigo-ink bg-indigo-ink px-5 text-white">
        <Link href="/dashboard">← Dashboard</Link>
        <h1 className="font-[family-name:var(--font-display)] text-lg font-semibold">
          {c.patientName ?? c.id} · {c.riskTier ?? c.status}
        </h1>
      </header>
      <main className="mx-auto max-w-3xl space-y-8 px-5 py-8">
        <div className="border border-indigo-ink/15 border-l-4 border-l-ember p-6">
          <p className="text-xs font-bold uppercase tracking-widest text-outline">
            Patient intake
          </p>
          <p className="mt-2">
            {c.patientType}
            {c.community ? ` · ${c.community}` : ""}
            {c.ageValue != null && c.ageUnit
              ? ` · ${c.ageValue} ${c.ageUnit.toLowerCase()}`
              : ""}
          </p>
          {c.maternalStatus ? (
            <p className="mt-1 text-sm">
              {c.maternalStatus === "PREGNANT"
                ? `Pregnant${c.gestationalWeeks ? ` · ${c.gestationalWeeks} weeks` : ""}`
                : "Postpartum"}
            </p>
          ) : null}
          {c.caregiverName ? (
            <p className="mt-1 text-sm">
              Caregiver: {c.caregiverName}
              {c.caregiverPhone ? ` · ${c.caregiverPhone}` : ""}
            </p>
          ) : null}
          {c.phone ? <p className="mt-1 text-sm">Phone: {c.phone}</p> : null}
          {c.notes ? (
            <p className="mt-2 text-sm text-on-surface-variant">{c.notes}</p>
          ) : null}
          <p className="mt-3 text-sm">
            CHW {c.chwId} · Created {c.createdAt.toLocaleString()}
            {c.consentAt ? ` · Consent recorded` : ""}
          </p>
          {c.referral ? (
            <p className="mt-2">
              Referral: {referralStatusLabel(c.referral.status)} →{" "}
              {c.referral.facility ?? "facility TBD"}
            </p>
          ) : null}
        </div>

        <section>
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold">
            Checklist answers
          </h2>
          <div className="space-y-3">
            {c.responses.map((r) => {
              const item = getChecklistItem(r.itemKey);
              return (
                <div key={r.id} className="border border-indigo-ink/10 p-4">
                  <p className="font-bold">
                    {r.answer ? "YES" : "NO"} — {item?.question ?? r.itemKey}
                  </p>
                  {item ? (
                    <>
                      <p className="mt-2 text-sm text-on-surface-variant">
                        Action if yes: {item.action}
                      </p>
                      <p className="mt-1 font-[family-name:var(--font-mono)] text-[11px] text-outline">
                        Source: {item.source}
                      </p>
                    </>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-4 font-[family-name:var(--font-display)] text-xl font-semibold">
            Timeline
          </h2>
          <ul className="space-y-2">
            {c.timeline.map((t) => (
              <li key={t.id} className="border-b border-indigo-ink/10 py-2 text-sm">
                <span className="font-[family-name:var(--font-mono)] text-xs text-outline">
                  {t.createdAt.toLocaleString()}
                </span>
                <br />
                {t.message}
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
