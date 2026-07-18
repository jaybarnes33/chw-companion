import { TopAppBar } from "@/components/TopAppBar";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { DEMO_CHW_ID, DEMO_FACILITY } from "@/lib/config";
import { View } from "react-native";

export default function ProfileScreen() {
  return (
    <View className="flex-1 bg-shea">
      <TopAppBar title="Profile" />
      <View className="gap-2 p-mobile">
        <Text className="font-body-bold text-[11px] tracking-[1.5px] text-muted-foreground">
          COMMUNITY HEALTH WORKER
        </Text>
        <Text className="font-display text-[28px] text-indigo-ink">
          Kwesi Mensah
        </Text>
        <Text className="font-utility text-[13px] text-muted-foreground">
          ID: {DEMO_CHW_ID}
        </Text>
        <Text className="font-utility text-[13px] text-muted-foreground">
          Compound: Tamale North CHPS
        </Text>
        <Text className="font-utility text-[13px] text-muted-foreground">
          Catchment: Tamale North · Zuo · Sakasaka
        </Text>
        <Text className="font-utility text-[13px] text-muted-foreground">
          Referral facility: {DEMO_FACILITY}
        </Text>
        <Card className="mt-6 border-0 border-l-4 border-l-clay bg-muted p-4">
          <Text className="font-body leading-[22px] text-muted-foreground">
            Signed in on this device. Visit records sync to the district
            dashboard when connectivity is available.
          </Text>
        </Card>
      </View>
    </View>
  );
}
