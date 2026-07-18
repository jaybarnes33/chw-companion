import { StripMeter } from "@/components/Fugu";
import { TopAppBar } from "@/components/TopAppBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import {
  getCase,
  getResponses,
  upsertCase,
  upsertResponse,
} from "@/lib/db";
import { getChecklistByCategory } from "@chw/content";
import { scoreCaseDetailed } from "@chw/rules-engine";
import cuid from "cuid";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { View } from "react-native";

export default function ChecklistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  const [patientType, setPatientType] = useState<
    "MATERNAL" | "NEWBORN" | "UNDER5" | null
  >(null);

  useEffect(() => {
    (async () => {
      const c = await getCase(id);
      if (!c) return;
      setPatientType(c.patientType);
      const existing = await getResponses(id);
      const map: Record<string, boolean> = {};
      for (const r of existing) map[r.itemKey] = Boolean(r.answer);
      setAnswers(map);
      const items = getChecklistByCategory(c.patientType);
      const firstUnanswered = items.findIndex((i) => map[i.key] === undefined);
      setIndex(firstUnanswered >= 0 ? firstUnanswered : 0);
    })();
  }, [id]);

  const items = useMemo(
    () => (patientType ? getChecklistByCategory(patientType) : []),
    [patientType]
  );
  const current = items[index];
  const answeredCount = Object.keys(answers).length;

  async function answer(value: boolean) {
    if (!current || !patientType) return;
    const nextAnswers = { ...answers, [current.key]: value };
    setAnswers(nextAnswers);
    await upsertResponse({
      id: cuid(),
      caseId: id,
      itemKey: current.key,
      answer: value ? 1 : 0,
    });

    if (index < items.length - 1) {
      setIndex(index + 1);
      return;
    }

    const detailed = scoreCaseDetailed(
      Object.entries(nextAnswers).map(([itemKey, answer]) => ({
        itemKey,
        answer,
      }))
    );
    const c = await getCase(id);
    if (c) {
      await upsertCase({
        ...c,
        riskTier: detailed.riskTier,
        status: "COMPLETED",
        updatedAt: new Date().toISOString(),
        syncedAt: null,
      });
    }
    router.replace(`/case/${id}/result`);
  }

  if (!current) {
    return (
      <View className="flex-1 bg-shea">
        <TopAppBar title="Checklist" onBack={() => router.back()} />
        <Text className="p-5 text-muted-foreground">Loading…</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-shea">
      <TopAppBar
        title={`Case: ${patientType === "MATERNAL" ? "Maternal" : patientType === "NEWBORN" ? "Newborn" : "Under-5"}`}
        onBack={() => router.back()}
        right={
          <View className="border border-white/40 px-2.5 py-1">
            <Text className="font-utility text-xs text-white">
              {index + 1} / {items.length}
            </Text>
          </View>
        }
      />
      <View className="flex-1 justify-center gap-section p-mobile">
        <View className="flex-row justify-between">
          <Text className="font-body-bold text-[11px] uppercase tracking-[1.2px] text-indigo-ink">
            Progress Tracker
          </Text>
          <Text className="font-utility text-[11px] text-clay">
            DANGER INDICATOR
          </Text>
        </View>
        <StripMeter
          total={items.length}
          filled={answeredCount}
          dangerAt={items
            .map((item, i) =>
              answers[item.key] && item.riskIfTrue === "RED" ? i : -1
            )
            .filter((i) => i >= 0)}
        />

        <Card className="relative border-2 border-indigo-ink bg-shea p-6">
          <Text className="absolute -top-2.5 left-4 bg-shea px-2 font-body-bold text-[11px] tracking-[1.2px] text-indigo-ink">
            QUESTION {String(index + 1).padStart(2, "0")}
          </Text>
          <Text className="py-6 text-center font-body text-lg leading-7 text-indigo-ink">
            {current.question}
          </Text>
        </Card>

        <View className="flex-row gap-4">
          <Button
            variant="outline"
            className="flex-1 border-indigo-ink bg-shea"
            onPress={() => answer(false)}
          >
            <Text className="font-headline text-[22px] normal-case tracking-normal text-indigo-ink">
              No
            </Text>
          </Button>
          <Button
            variant="outline"
            className="flex-1 border-indigo-ink bg-shea"
            onPress={() => answer(true)}
          >
            <Text className="font-headline text-[22px] normal-case tracking-normal text-indigo-ink">
              Yes
            </Text>
          </Button>
        </View>

        <Text className="font-utility text-[11px] leading-4 text-muted-foreground">
          Source: {current.source}
        </Text>
      </View>
    </View>
  );
}
