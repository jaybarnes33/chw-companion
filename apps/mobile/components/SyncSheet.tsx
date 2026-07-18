import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { cn } from "@/lib/utils";
import { colors } from "@chw/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { Modal, Pressable, View } from "react-native";

type Props = {
  visible: boolean;
  pending: number;
  lastSynced: string | null;
  syncing: boolean;
  statusMessage?: string;
  onClose: () => void;
  onForceSync: () => void;
};

export function SyncSheet({
  visible,
  pending,
  lastSynced,
  syncing,
  statusMessage,
  onClose,
  onForceSync,
}: Props) {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <Pressable className="flex-1 bg-indigo-ink/40" onPress={onClose} />
      <Card className="border-0 border-t-2 border-t-indigo-ink bg-shea p-mobile pb-12">
        <View className="mb-6 flex-row items-center justify-between">
          <Text className="font-headline text-2xl text-indigo-ink">Sync</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <MaterialIcons name="close" size={28} color={colors.indigoInk} />
          </Pressable>
        </View>
        <View className="mb-4 flex-row justify-center gap-1">
          {Array.from({ length: 6 }).map((_, i) => (
            <View
              key={i}
              className={cn(
                "h-3 w-2 bg-indigo-ink opacity-40",
                syncing && "opacity-100"
              )}
            />
          ))}
        </View>
        <Text className="text-center font-body-bold text-base text-indigo-ink">
          {pending} case{pending === 1 ? "" : "s"} waiting to sync
        </Text>
        <Text className="mt-1.5 text-center font-utility text-xs uppercase tracking-[1px] text-border">
          Last synced: {lastSynced ? new Date(lastSynced).toLocaleString() : "never"}
        </Text>
        {statusMessage ? (
          <Text className="mt-2 text-center font-body text-clay">
            {statusMessage}
          </Text>
        ) : null}
        <View className="my-6 flex-row gap-3">
          <MaterialIcons name="info" size={20} color={colors.clay} />
          <Text className="flex-1 font-body leading-[22px] text-muted-foreground">
            Sync happens automatically when you have a connection.
          </Text>
        </View>
        <Button onPress={onForceSync} disabled={syncing}>
          <MaterialIcons name="refresh" size={20} color={colors.shea} />
          <Text className="font-body-bold text-xs tracking-[1.2px] text-shea">
            {syncing ? "SYNCING..." : "FORCE SYNC NOW"}
          </Text>
        </Button>
      </Card>
    </Modal>
  );
}
