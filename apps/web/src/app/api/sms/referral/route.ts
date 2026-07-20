import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@nyaaba/db";

const AGOO_URL = "https://api.agoosms.com/v1/sms/send";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const to = body.to as string;
    const message = body.message as string;
    const caseId = body.caseId as string | undefined;

    if (!to || !message) {
      return NextResponse.json(
        { error: "to and message required" },
        { status: 400 }
      );
    }

    const apiKey = process.env.AGOO_SMS_API_KEY;
    let provider: "agoo" | "mock" = "mock";
    let providerResponse: unknown = { mock: true };

    if (apiKey) {
      provider = "agoo";
      const res = await fetch(AGOO_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": apiKey,
        },
        body: JSON.stringify({ to, message }),
      });
      providerResponse = await res.json().catch(() => ({ status: res.status }));
      if (!res.ok) {
        return NextResponse.json(
          { ok: false, provider, providerResponse },
          { status: 502 }
        );
      }
    }

    if (caseId) {
      await prisma.timelineEvent.create({
        data: {
          caseId,
          kind: "sms_sent",
          message: `SMS to ${to} via ${provider === "agoo" ? "AgooSMS" : "mock"}`,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      provider,
      providerResponse,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "sms failed" },
      { status: 500 }
    );
  }
}
