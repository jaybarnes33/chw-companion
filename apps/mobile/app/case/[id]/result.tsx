import { TopAppBar } from "@/components/TopAppBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { getCase, getResponses } from "@/lib/db";
import type { RiskTier } from "@chw/content";
import { scoreCaseDetailed } from "@chw/rules-engine";
import { colors, riskCanvas } from "@chw/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";

export default function ResultScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [tier, setTier] = useState<RiskTier>("GREEN");
  const [action, setAction] = useState<string | null>(null);
  const [patientName, setPatientName] = useState<string | null>(null);
  const [community, setCommunity] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const c = await getCase(id);
      if (!c) return;
      setPatientName(c.patientName);
      setCommunity(c.community);
      const responses = await getResponses(id);
      const detailed = scoreCaseDetailed(
        responses.map((r) => ({ itemKey: r.itemKey, answer: Boolean(r.answer) }))
      );
      setTier(detailed.riskTier);
      setAction(detailed.primaryAction);
    })();
  }, [id]);

  const bg = riskCanvas(tier);
  const headline =
    tier === "RED"
      ? "Refer immediately"
      : tier === "YELLOW"
        ? "Refer soon"
        : "Continue care";

  return (
    <View className="flex-1" style={{ backgroundColor: bg }}>
      <TopAppBar
        title="CHW Companion"
        onBack={() => router.replace("/")}
        backgroundColor={bg}
        borderColor={`${colors.white}33`}
      />
      <View className="flex-1 items-center justify-center p-mobile">
        <View className="mb-section">
          <View className="size-24 items-center justify-center rounded-full border-4 border-white bg-white/10">
            <MaterialIcons name="warning" size={48} color={colors.white} />
          </View>
        </View>
        <Text className="font-display text-[40px] text-white">{tier}</Text>
        <Text className="mt-2 font-body-bold text-lg text-white">
          {headline}
        </Text>
        <Card className="mt-section max-w-80 border-0 border-l-4 border-l-white bg-white/10 p-4">
          <Text className="text-center font-body text-[15px] leading-[22px] text-white">
            {action ??
              (tier === "GREEN"
                ? "No danger signs flagged. Continue routine counselling and follow-up."
                : "Follow local referral protocol.")}
          </Text>
        </Card>

        <View className="mt-auto w-full gap-3 pt-8">
          {tier !== "GREEN" ? (
            <Button
              className="bg-indigo-ink"
              onPress={() => router.push(`/case/${id}/referral`)}
            >
              <MaterialIcons name="share" size={22} color={colors.shea} />
              <Text className="font-body-bold text-base normal-case tracking-normal text-shea">
                Start referral
              </Text>
            </Button>
          ) : null}
          <Pressable onPress={() => router.push(`/case/${id}/guidance`)}>
            <Text className="py-3 text-center font-body text-white underline">
              Hear nutrition guidance →
            </Text>
          </Pressable>
        </View>
      </View>
      <View className="flex-row justify-between border-t-4 border-t-white/20 bg-indigo-ink px-mobile py-5">
        <View>
          <Text className="font-body-bold text-[10px] uppercase tracking-[1.2px] text-white/50">
            Patient
          </Text>
          <Text className="mt-1 font-body-bold text-base text-white">
            {patientName ?? id.slice(0, 8)}
            {community ? ` · ${community}` : ""}
          </Text>
        </View>
        <View>
          <Text className="font-body-bold text-[10px] uppercase tracking-[1.2px] text-white/50">
            Urgency
          </Text>
          <Text
            className={`mt-1 font-body-bold text-base ${
              tier === "RED" ? "text-ember" : "text-shea"
            }`}
          >
            {tier === "RED" ? "Critical" : tier === "YELLOW" ? "Urgent" : "Routine"}
          </Text>
        </View>
      </View>
    </View>
  );
}
