"use server";

import { prisma } from "@nyaaba/db";
import { revalidatePath } from "next/cache";

export async function updateReferralStatus(formData: FormData) {
  const caseId = formData.get("caseId") as string;
  const status = formData.get("status") as
    | "REFERRED"
    | "IN_TRANSIT"
    | "ARRIVED"
    | "RESOLVED";

  if (!caseId || !status) return;

  await prisma.referral.upsert({
    where: { caseId },
    create: {
      id: `ref-${caseId}`,
      caseId,
      status,
      facility: "District facility",
    },
    update: { status },
  });

  await prisma.timelineEvent.create({
    data: {
      caseId,
      kind: "status_change",
      message: `Dashboard set status to ${status}`,
    },
  });

  revalidatePath("/dashboard");
  revalidatePath(`/dashboard/cases/${caseId}`);
}
