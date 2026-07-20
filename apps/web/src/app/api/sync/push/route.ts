import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nyaaba/db";

type PushCase = {
  id: string;
  chwId: string;
  patientType: "MATERNAL" | "NEWBORN" | "UNDER5";
  patientName?: string | null;
  patientSex?: "FEMALE" | "MALE" | "UNKNOWN" | null;
  ageValue?: number | null;
  ageUnit?: "DAYS" | "MONTHS" | "YEARS" | null;
  community?: string | null;
  phone?: string | null;
  caregiverName?: string | null;
  caregiverPhone?: string | null;
  maternalStatus?: "PREGNANT" | "POSTPARTUM" | null;
  gestationalWeeks?: number | null;
  notes?: string | null;
  consentAt?: string | null;
  status?: "IN_PROGRESS" | "COMPLETED";
  createdAt: string;
  updatedAt: string;
  riskTier?: "RED" | "YELLOW" | "GREEN" | null;
  responses?: Array<{ id: string; itemKey: string; answer: boolean }>;
  referral?: {
    id: string;
    status: "REFERRED" | "IN_TRANSIT" | "ARRIVED" | "RESOLVED";
    facility?: string | null;
    updatedAt: string;
  } | null;
  timeline?: Array<{
    id: string;
    kind: string;
    message: string;
    createdAt: string;
  }>;
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const cases = body.cases as PushCase[];

    if (!Array.isArray(cases)) {
      return NextResponse.json({ error: "cases array required" }, { status: 400 });
    }

    const syncedAt = new Date();

    for (const c of cases) {
      const intake = {
        patientName: c.patientName ?? null,
        patientSex: c.patientSex ?? null,
        ageValue: c.ageValue ?? null,
        ageUnit: c.ageUnit ?? null,
        community: c.community ?? null,
        phone: c.phone ?? null,
        caregiverName: c.caregiverName ?? null,
        caregiverPhone: c.caregiverPhone ?? null,
        maternalStatus: c.maternalStatus ?? null,
        gestationalWeeks: c.gestationalWeeks ?? null,
        notes: c.notes ?? null,
        consentAt: c.consentAt ? new Date(c.consentAt) : null,
        status: c.status ?? (c.riskTier ? "COMPLETED" : "IN_PROGRESS"),
        riskTier: c.riskTier ?? null,
      } as const;

      await prisma.case.upsert({
        where: { id: c.id },
        create: {
          id: c.id,
          chwId: c.chwId,
          patientType: c.patientType,
          createdAt: new Date(c.createdAt),
          updatedAt: new Date(c.updatedAt),
          syncedAt,
          ...intake,
        },
        update: {
          patientType: c.patientType,
          updatedAt: new Date(c.updatedAt),
          syncedAt,
          ...intake,
        },
      });

      for (const r of c.responses ?? []) {
        await prisma.checklistResponse.upsert({
          where: { caseId_itemKey: { caseId: c.id, itemKey: r.itemKey } },
          create: {
            id: r.id,
            caseId: c.id,
            itemKey: r.itemKey,
            answer: r.answer,
          },
          update: { answer: r.answer },
        });
      }

      if (c.referral) {
        await prisma.referral.upsert({
          where: { caseId: c.id },
          create: {
            id: c.referral.id,
            caseId: c.id,
            status: c.referral.status,
            facility: c.referral.facility ?? null,
            updatedAt: new Date(c.referral.updatedAt),
          },
          update: {
            status: c.referral.status,
            facility: c.referral.facility ?? null,
            updatedAt: new Date(c.referral.updatedAt),
          },
        });
      }

      for (const t of c.timeline ?? []) {
        const exists = await prisma.timelineEvent.findUnique({
          where: { id: t.id },
        });
        if (!exists) {
          await prisma.timelineEvent.create({
            data: {
              id: t.id,
              caseId: c.id,
              kind: t.kind,
              message: t.message,
              createdAt: new Date(t.createdAt),
            },
          });
        }
      }
    }

    return NextResponse.json({ ok: true, syncedAt, count: cases.length });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "push failed" },
      { status: 500 }
    );
  }
}
