import NetInfo from "@react-native-community/netinfo";
import {
  countUnsynced,
  getUnsyncedPayload,
  markCaseSynced,
  setLastSyncedAt,
  upsertCase,
  upsertReferral,
  upsertResponse,
  type AgeUnit,
  type CaseStatus,
  type LocalCase,
  type MaternalStatus,
  type PatientSex,
} from "./db";
import type { PatientType, RiskTier } from "@chw/content";

const API_URL =
  process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export async function getPendingSyncCount() {
  return countUnsynced();
}

function toIso(value: string | Date | null | undefined): string | null {
  if (value == null) return null;
  if (typeof value === "string") return value;
  return value.toISOString();
}

export async function syncNow(chwId: string): Promise<{
  ok: boolean;
  pushed: number;
  pulled: number;
  error?: string;
}> {
  const state = await NetInfo.fetch();
  if (!state.isConnected) {
    return { ok: false, pushed: 0, pulled: 0, error: "Offline" };
  }

  try {
    const payload = await getUnsyncedPayload();
    let pushed = 0;
    if (payload.length > 0) {
      const res = await fetch(`${API_URL}/api/sync/push`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cases: payload }),
      });
      if (!res.ok) {
        const text = await res.text();
        return { ok: false, pushed: 0, pulled: 0, error: text };
      }
      const syncedAt = new Date().toISOString();
      for (const c of payload) {
        await markCaseSynced(c.id, syncedAt);
      }
      pushed = payload.length;
    }

    const pullRes = await fetch(
      `${API_URL}/api/sync/pull?chwId=${encodeURIComponent(chwId)}`
    );
    let pulled = 0;
    if (pullRes.ok) {
      const data = (await pullRes.json()) as {
        cases: Array<{
          id: string;
          chwId: string;
          patientType: PatientType;
          patientName?: string | null;
          patientSex?: PatientSex | null;
          ageValue?: number | null;
          ageUnit?: AgeUnit | null;
          community?: string | null;
          phone?: string | null;
          caregiverName?: string | null;
          caregiverPhone?: string | null;
          maternalStatus?: MaternalStatus | null;
          gestationalWeeks?: number | null;
          notes?: string | null;
          consentAt?: string | Date | null;
          status?: CaseStatus;
          createdAt: string | Date;
          updatedAt: string | Date;
          riskTier?: RiskTier | null;
          responses: Array<{ id: string; itemKey: string; answer: boolean }>;
          referral: {
            id: string;
            caseId: string;
            status: string;
            facility: string | null;
            updatedAt: string | Date;
          } | null;
        }>;
      };
      for (const remote of data.cases ?? []) {
        const caseRow: LocalCase = {
          id: remote.id,
          chwId: remote.chwId,
          patientType: remote.patientType,
          patientName: remote.patientName ?? null,
          patientSex: remote.patientSex ?? null,
          ageValue: remote.ageValue ?? null,
          ageUnit: remote.ageUnit ?? null,
          community: remote.community ?? null,
          phone: remote.phone ?? null,
          caregiverName: remote.caregiverName ?? null,
          caregiverPhone: remote.caregiverPhone ?? null,
          maternalStatus: remote.maternalStatus ?? null,
          gestationalWeeks: remote.gestationalWeeks ?? null,
          notes: remote.notes ?? null,
          consentAt: toIso(remote.consentAt),
          status: remote.status ?? (remote.riskTier ? "COMPLETED" : "IN_PROGRESS"),
          createdAt: toIso(remote.createdAt)!,
          updatedAt: toIso(remote.updatedAt)!,
          syncedAt: new Date().toISOString(),
          riskTier: remote.riskTier ?? null,
        };
        await upsertCase(caseRow);
        for (const r of remote.responses ?? []) {
          await upsertResponse({
            id: r.id,
            caseId: remote.id,
            itemKey: r.itemKey,
            answer: r.answer ? 1 : 0,
          });
        }
        if (remote.referral) {
          await upsertReferral({
            id: remote.referral.id,
            caseId: remote.id,
            status: remote.referral.status as never,
            facility: remote.referral.facility,
            updatedAt: toIso(remote.referral.updatedAt)!,
          });
        }
        pulled += 1;
      }
    }

    await setLastSyncedAt(new Date().toISOString());
    return { ok: true, pushed, pulled };
  } catch (e) {
    return {
      ok: false,
      pushed: 0,
      pulled: 0,
      error: e instanceof Error ? e.message : "Sync failed",
    };
  }
}

export async function sendReferralSms(input: {
  caseId: string;
  to: string;
  message: string;
  patientName?: string | null;
  facility?: string | null;
  status?: string;
}) {
  const res = await fetch(`${API_URL}/api/sms/referral`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}
