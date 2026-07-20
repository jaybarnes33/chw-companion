import { FuguDivider } from "@/components/Fugu";
import { TopAppBar } from "@/components/TopAppBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import {
  DEMO_FACILITY,
  DEMO_FACILITY_PHONE,
  formatRelative,
  patientTypeLabel,
} from "@/lib/config";
import {
  addSmsLog,
  addTimeline,
  getCase,
  getReferral,
  getTimeline,
  listSmsLogs,
  upsertCase,
  upsertReferral,
  type LocalSmsLog,
  type LocalTimeline,
} from "@/lib/db";
import { sendReferralSms } from "@/lib/sync";
import {
  nextReferralStatus,
  REFERRAL_FLOW,
  referralStatusLabel,
  type ReferralStatus,
} from "@nyaaba/rules-engine";
import { colors } from "@nyaaba/ui";
import { MaterialIcons } from "@expo/vector-icons";
import cuid from "cuid";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import {
  Linking,
  ScrollView,
  View,
} from "react-native";

export default function ReferralScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [status, setStatus] = useState<ReferralStatus>("REFERRED");
  const [title, setTitle] = useState("Referral");
  const [facility, setFacility] = useState(DEMO_FACILITY);
  const [timeline, setTimeline] = useState<LocalTimeline[]>([]);
  const [smsLogs, setSmsLogs] = useState<LocalSmsLog[]>([]);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async () => {
    const c = await getCase(id);
    if (!c) return;
    setTitle(
      `${c.patientName ?? "Patient"} · ${patientTypeLabel(c.patientType)} · ${c.riskTier}`
    );
    let ref = await getReferral(id);
    if (!ref) {
      const now = new Date().toISOString();
      ref = {
        id: cuid(),
        caseId: id,
        status: "REFERRED",
        facility: DEMO_FACILITY,
        updatedAt: now,
      };
      await upsertReferral(ref);
      await addTimeline({
        id: cuid(),
        caseId: id,
        kind: "referral_created",
        message: "Referral Form Submitted",
        createdAt: now,
      });
      await upsertCase({ ...c, syncedAt: null, updatedAt: now });

      const smsMessage = `Nyaaba: Referral for ${c.patientName ?? "patient"} (${c.patientType}, ${c.riskTier}) to ${DEMO_FACILITY}. Status: REFERRED.`;
      const sms = await sendReferralSms({
        caseId: id,
        to: DEMO_FACILITY_PHONE,
        message: smsMessage,
        patientName: c.patientName,
        facility: DEMO_FACILITY,
        status: "REFERRED",
      });
      await addSmsLog({
        id: cuid(),
        caseId: id,
        to: DEMO_FACILITY_PHONE,
        message: smsMessage,
        status: sms.ok ? "sent" : "queued_or_failed",
        createdAt: now,
      });
      await addTimeline({
        id: cuid(),
        caseId: id,
        kind: "sms_sent",
        message: sms.ok
          ? "Facility Notified via AgooSMS"
          : "SMS queued (offline or API unavailable)",
        createdAt: now,
      });
    }
    setStatus(ref.status);
    setFacility(ref.facility ?? DEMO_FACILITY);
    setTimeline(await getTimeline(id));
    setSmsLogs(await listSmsLogs(id));
  }, [id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const statusIndex = REFERRAL_FLOW.indexOf(status);
  const next = nextReferralStatus(status);

  async function markNext() {
    if (!next) return;
    setBusy(true);
    const now = new Date().toISOString();
    const existing = await getReferral(id);
    await upsertReferral({
      id: existing?.id ?? cuid(),
      caseId: id,
      status: next,
      facility,
      updatedAt: now,
    });
    const c = await getCase(id);
    if (c) {
      await upsertCase({ ...c, syncedAt: null, updatedAt: now });
    }
    await addTimeline({
      id: cuid(),
      caseId: id,
      kind: "status_change",
      message: `Marked ${referralStatusLabel(next)}`,
      createdAt: now,
    });
    const smsMessage = `Nyaaba update: referral ${id.slice(0, 8)} now ${next} at ${facility}.`;
    const sms = await sendReferralSms({
      caseId: id,
      to: DEMO_FACILITY_PHONE,
      message: smsMessage,
      facility,
      status: next,
    });
    await addSmsLog({
      id: cuid(),
      caseId: id,
      to: DEMO_FACILITY_PHONE,
      message: smsMessage,
      status: sms.ok ? "sent" : "queued_or_failed",
      createdAt: now,
    });
    setBusy(false);
    await refresh();
  }

  return (
    <View className="flex-1 bg-shea">
      <TopAppBar title={title} onBack={() => router.replace("/")} />
      <ScrollView>
        <View className="p-mobile pb-12">
        <View className="mb-2 flex-row items-center gap-3">
          <Text className="overflow-hidden bg-ember px-2.5 py-1 font-body-bold text-[11px] uppercase tracking-[1px] text-white">
            Critical Referral
          </Text>
          <Text className="font-utility text-xs text-muted-foreground">
            ID: #{id.slice(0, 8)}
          </Text>
        </View>
        <Text className="mb-section font-display text-[28px] text-indigo-ink">
          Referral Progress
        </Text>

        <View className="relative mb-section flex-row justify-between pt-2">
          <View className="absolute left-[12%] right-[12%] top-[22px] h-0.5 bg-indigo-ink/10" />
          <View
            className="absolute left-[12%] top-[22px] h-0.5 bg-indigo-ink"
            style={{ width: `${(statusIndex / (REFERRAL_FLOW.length - 1)) * 100}%` }}
          />
          {REFERRAL_FLOW.map((s, i) => {
            const active = i <= statusIndex;
            return (
              <View key={s} className="w-1/4 items-center">
                <View
                  className={`z-2 mb-2 size-8 items-center justify-center border-2 ${
                    active
                      ? "border-indigo-ink bg-indigo-ink"
                      : "border-border bg-shea opacity-60"
                  }`}
                >
                  {i < statusIndex ? (
                    <MaterialIcons name="check" size={14} color={colors.white} />
                  ) : (
                    <MaterialIcons
                      name={
                        s === "IN_TRANSIT"
                          ? "local-shipping"
                          : s === "ARRIVED"
                            ? "location-on"
                            : s === "RESOLVED"
                              ? "done-all"
                              : "flag"
                      }
                      size={14}
                      color={active ? colors.white : colors.outline}
                    />
                  )}
                </View>
                <Text
                  className={`text-center font-body-bold text-[11px] text-indigo-ink ${
                    active ? "" : "opacity-50"
                  }`}
                >
                  {referralStatusLabel(s)}
                </Text>
              </View>
            );
          })}
        </View>

        <Card className="mb-section border-indigo-ink/10 border-l-4 border-l-ember p-5">
          <Text className="mb-3 font-body-bold text-[11px] tracking-[1.2px] text-muted-foreground">
            REFERRAL SUMMARY
          </Text>
          <Text className="font-body-bold text-base text-indigo-ink">
            {facility}
          </Text>
          <Text className="mt-1 font-utility text-xs text-muted-foreground">
            Receiving Facility
          </Text>
        </Card>

        <FuguDivider />

        {next ? (
          <Button
            className="mt-section bg-clay"
            onPress={markNext}
            disabled={busy}
          >
            <MaterialIcons name="local-shipping" size={22} color={colors.white} />
            <Text className="font-body-bold text-base normal-case tracking-normal text-white">
              Mark: {referralStatusLabel(next)}
            </Text>
          </Button>
        ) : null}

        <Button
          variant="outline"
          className="mt-3 border-indigo-ink"
          onPress={() => Linking.openURL(`tel:${DEMO_FACILITY_PHONE}`)}
        >
          <MaterialIcons name="call" size={22} color={colors.indigoInk} />
          <Text className="font-body-bold text-base normal-case tracking-normal text-indigo-ink">
            Call Dispatch
          </Text>
        </Button>

        <Button
          variant="ghost"
          className="h-auto py-4"
          onPress={() => router.push(`/case/${id}/guidance`)}
        >
          <Text className="text-center font-body normal-case tracking-normal text-clay underline">
            Hear nutrition guidance →
          </Text>
        </Button>

        <Text className="mb-3 mt-section font-body-bold text-[11px] tracking-[1.2px] text-indigo-ink">
          TIMELINE LOGS
        </Text>
        {timeline.map((t) => (
          <View
            key={t.id}
            className="flex-row items-start gap-3 border-b border-b-indigo-ink/10 py-3"
          >
            <MaterialIcons
              name="check-circle"
              size={20}
              color={colors.savanna}
            />
            <View className="flex-1">
              <Text className="font-body text-indigo-ink">{t.message}</Text>
              <Text className="mt-0.5 font-utility text-[11px] text-muted-foreground">
                {formatRelative(t.createdAt)}
              </Text>
            </View>
          </View>
        ))}

        <Text className="mb-3 mt-section font-body-bold text-[11px] tracking-[1.2px] text-indigo-ink">
          SMS LOG
        </Text>
        {smsLogs.length === 0 ? (
          <Text className="mt-0.5 font-utility text-[11px] text-muted-foreground">
            No SMS yet
          </Text>
        ) : (
          smsLogs.map((s) => (
            <View
              key={s.id}
              className="flex-row items-start gap-3 border-b border-b-indigo-ink/10 py-3"
            >
              <MaterialIcons name="sms" size={20} color={colors.clay} />
              <View className="flex-1">
                <Text className="font-body text-indigo-ink">
                  {s.status.toUpperCase()}
                </Text>
                <Text
                  className="mt-0.5 font-utility text-[11px] text-muted-foreground"
                  numberOfLines={2}
                >
                  {s.message}
                </Text>
              </View>
            </View>
          ))
        )}
        </View>
      </ScrollView>
    </View>
  );
}
