import { FuguDivider } from "@/components/Fugu";
import { SealBadge } from "@/components/SealBadge";
import { SyncSheet } from "@/components/SyncSheet";
import { TopAppBar } from "@/components/TopAppBar";
import { Button } from "@/components/ui/button";
import { Text } from "@/components/ui/text";
import { DEMO_CHW_ID, formatRelative, patientTypeLabel } from "@/lib/config";
import {
  formatAge,
  getLastSyncedAt,
  listCases,
  type LocalCase,
} from "@/lib/db";
import { getPendingSyncCount, syncNow } from "@/lib/sync";
import { colors } from "@nyaaba/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useFocusEffect, useRouter, type Href } from "expo-router";
import { useCallback, useState } from "react";
import { Pressable, ScrollView, View } from "react-native";
import type { ReferralStatus } from "@nyaaba/rules-engine";
import { referralStatusLabel } from "@nyaaba/rules-engine";

type Row = LocalCase & { referralStatus?: ReferralStatus | null };

function caseHref(c: Row): Href {
  if (c.status !== "COMPLETED" || !c.riskTier) {
    return `/case/${c.id}/checklist`;
  }
  if (c.referralStatus) return `/case/${c.id}/referral`;
  return `/case/${c.id}/result`;
}

function caseSubtitle(c: Row) {
  const age = formatAge(c.ageValue, c.ageUnit);
  const parts = [
    patientTypeLabel(c.patientType),
    age,
    c.community,
  ].filter(Boolean);
  return parts.join(" · ");
}

function caseStatusLine(c: Row) {
  if (c.status !== "COMPLETED" || !c.riskTier) {
    return `In progress · ${formatRelative(c.updatedAt)}`;
  }
  if (c.referralStatus) {
    return `${referralStatusLabel(c.referralStatus)} · ${formatRelative(c.createdAt)}`;
  }
  return `${c.riskTier} · ${formatRelative(c.createdAt)}`;
}

export default function HomeScreen() {
  const router = useRouter();
  const [cases, setCases] = useState<Row[]>([]);
  const [pending, setPending] = useState(0);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>();

  const refresh = useCallback(async () => {
    setCases(await listCases());
    setPending(await getPendingSyncCount());
    setLastSynced(await getLastSyncedAt());
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  async function forceSync() {
    setSyncing(true);
    setStatusMessage(undefined);
    const result = await syncNow(DEMO_CHW_ID);
    setSyncing(false);
    if (result.ok) {
      setStatusMessage(
        `Synced · pushed ${result.pushed} · pulled ${result.pulled}`
      );
    } else {
      setStatusMessage(result.error ?? "Sync failed");
    }
    await refresh();
  }

  const completedCount = cases.filter((c) => c.status === "COMPLETED").length;

  return (
    <View className="flex-1 bg-shea">
      <TopAppBar
        title="Nyaaba"
        onSync={() => setSheetOpen(true)}
        syncBadge={pending}
      />
      <ScrollView>
        <View className="p-mobile pb-10">
          <Button
            variant="secondary"
            size="lg"
            className="mb-3 w-full bg-clay-bright"
            onPress={() => router.push("/case/new")}
          >
            <MaterialIcons name="add" size={22} color={colors.white} />
            <Text
              className="shrink-0 font-body-bold text-base normal-case tracking-normal text-white"
              numberOfLines={1}
            >
              New visit
            </Text>
          </Button>
          <Button
            variant="outline"
            className="mb-section border-clay"
            onPress={() => router.push("/translate")}
          >
            <MaterialIcons name="translate" size={22} color={colors.clay} />
            <Text className="font-body-bold text-sm uppercase tracking-[1px] text-clay">
              Offline Dagbani translate
            </Text>
          </Button>

          <Text className="mb-2 font-body-bold text-sm uppercase tracking-[2px] text-indigo-ink">
            Open cases
          </Text>
          <FuguDivider />

          {cases.length === 0 ? (
            <Text className="mt-6 font-body leading-6 text-muted-foreground">
              No visits yet. Register a patient to start a checklist — works
              fully offline.
            </Text>
          ) : (
            cases.map((c) => (
              <Pressable
                key={c.id}
                className="flex-row items-center justify-between border-b border-indigo-ink/10 py-4"
                onPress={() => router.push(caseHref(c))}
              >
                <View className="flex-1 flex-row items-center gap-4">
                  {c.riskTier ? (
                    <SealBadge tier={c.riskTier} />
                  ) : (
                    <View className="size-12 items-center justify-center rounded-full border-2 border-indigo-ink/30">
                      <MaterialIcons
                        name="pending"
                        size={22}
                        color={colors.onSurfaceVariant}
                      />
                    </View>
                  )}
                  <View className="flex-1">
                    <Text className="font-headline text-lg text-indigo-ink">
                      {c.patientName ?? "Patient"}
                    </Text>
                    <Text className="mt-0.5 font-body text-sm text-muted-foreground">
                      {caseSubtitle(c)}
                    </Text>
                    <View className="mt-1 flex-row items-center gap-1">
                      <MaterialIcons
                        name="schedule"
                        size={12}
                        color={colors.onSurfaceVariant}
                      />
                      <Text className="font-utility text-xs text-muted-foreground">
                        {caseStatusLine(c)}
                      </Text>
                    </View>
                  </View>
                </View>
                <MaterialIcons
                  name="chevron-right"
                  size={24}
                  color={colors.onSurfaceVariant}
                />
              </Pressable>
            ))
          )}

          <View className="mt-section">
            <Text className="mb-2 font-body-bold text-[11px] tracking-[1.5px] text-muted-foreground">
              VISITS THIS WEEK
            </Text>
            <View className="h-8 flex-row gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <View
                  key={i}
                  className="flex-1 bg-savanna"
                  style={{
                    opacity: i < Math.min(completedCount, 8) ? 0.8 : 0.2,
                  }}
                />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <SyncSheet
        visible={sheetOpen}
        pending={pending}
        lastSynced={lastSynced}
        syncing={syncing}
        statusMessage={statusMessage}
        onClose={() => setSheetOpen(false)}
        onForceSync={forceSync}
      />
    </View>
  );
}
