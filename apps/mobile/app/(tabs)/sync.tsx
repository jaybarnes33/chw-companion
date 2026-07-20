import { SyncSheet } from "@/components/SyncSheet";
import { TopAppBar } from "@/components/TopAppBar";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { DEMO_CHW_ID } from "@/lib/config";
import { getLastSyncedAt } from "@/lib/db";
import { getPendingSyncCount, syncNow } from "@/lib/sync";
import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { View } from "react-native";

export default function SyncTab() {
  const [open, setOpen] = useState(true);
  const [pending, setPending] = useState(0);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>();

  const refresh = useCallback(async () => {
    setPending(await getPendingSyncCount());
    setLastSynced(await getLastSyncedAt());
  }, []);

  useFocusEffect(
    useCallback(() => {
      setOpen(true);
      refresh();
    }, [refresh])
  );

  async function forceSync() {
    setSyncing(true);
    const result = await syncNow(DEMO_CHW_ID);
    setSyncing(false);
    setStatusMessage(
      result.ok
        ? `Synced · pushed ${result.pushed} · pulled ${result.pulled}`
        : result.error
    );
    await refresh();
  }

  return (
    <View className="flex-1 bg-shea">
      <TopAppBar title="Nyaaba" onSync={() => setOpen(true)} syncBadge={pending} />
      <View className="gap-section p-mobile">
        <Text className="font-headline text-2xl text-indigo-ink">
          Daily Overview
        </Text>
        <Card className="border-indigo-ink/10 border-l-4 border-l-clay p-4">
          <Text className="font-body-bold text-[11px] tracking-[1.5px] text-clay">
            PENDING SYNC
          </Text>
          <Text className="font-display text-[40px] text-indigo-ink">{pending}</Text>
        </Card>
        <Text className="font-body text-muted-foreground">
          Open the sync sheet to push local cases to Postgres.
        </Text>
      </View>
      <SyncSheet
        visible={open}
        pending={pending}
        lastSynced={lastSynced}
        syncing={syncing}
        statusMessage={statusMessage}
        onClose={() => setOpen(false)}
        onForceSync={forceSync}
      />
    </View>
  );
}
