"use client";

import { referralStatusLabel, REFERRAL_FLOW } from "@chw/rules-engine";

type CaseCard = {
  id: string;
  name: string;
  riskTier: string;
  status: string | null;
  patientType: string;
};

export function ReferralPipeline({
  cases,
  updateAction,
}: {
  cases: CaseCard[];
  updateAction: (formData: FormData) => Promise<void>;
}) {
  return (
    <section>
      <h2 className="mb-4 font-[family-name:var(--font-display)] text-2xl font-semibold">
        Referral pipeline
      </h2>
      <div className="grid gap-4 md:grid-cols-4">
        {REFERRAL_FLOW.map((status) => (
          <div key={status} className="border border-indigo-ink/15 bg-white/30 p-3">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-outline">
              {referralStatusLabel(status)}
            </p>
            <div className="space-y-2">
              {cases
                .filter((c) => c.status === status)
                .map((c) => (
                  <div
                    key={c.id}
                    className="border border-indigo-ink/10 bg-shea p-3"
                  >
                    <p className="font-bold">{c.name}</p>
                    <p className="font-[family-name:var(--font-mono)] text-[10px] uppercase tracking-wider text-outline">
                      {c.patientType} · {c.riskTier}
                    </p>
                    <form action={updateAction} className="mt-2">
                      <input type="hidden" name="caseId" value={c.id} />
                      <select
                        name="status"
                        defaultValue={status}
                        className="mb-2 h-9 w-full border border-indigo-ink/30 bg-shea text-xs"
                      >
                        {REFERRAL_FLOW.map((s) => (
                          <option key={s} value={s}>
                            {referralStatusLabel(s)}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        className="h-9 w-full bg-indigo-ink text-[10px] font-bold uppercase tracking-widest text-shea"
                      >
                        Update
                      </button>
                    </form>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
