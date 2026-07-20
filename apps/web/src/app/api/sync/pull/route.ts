import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nyaaba/db";

export async function GET(req: NextRequest) {
  try {
    const chwId = req.nextUrl.searchParams.get("chwId");
    if (!chwId) {
      return NextResponse.json({ error: "chwId required" }, { status: 400 });
    }

    const cases = await prisma.case.findMany({
      where: { chwId },
      include: {
        responses: true,
        referral: true,
        timeline: { orderBy: { createdAt: "desc" } },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      cases: cases.map((c) => ({
        ...c,
        createdAt: c.createdAt.toISOString(),
        updatedAt: c.updatedAt.toISOString(),
        syncedAt: c.syncedAt?.toISOString() ?? null,
        referral: c.referral
          ? {
              ...c.referral,
              updatedAt: c.referral.updatedAt.toISOString(),
            }
          : null,
        timeline: c.timeline.map((t) => ({
          ...t,
          createdAt: t.createdAt.toISOString(),
        })),
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "pull failed" },
      { status: 500 }
    );
  }
}
