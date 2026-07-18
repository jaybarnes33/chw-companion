import { TopAppBar } from "@/components/TopAppBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { DEMO_FACILITY_PHONE } from "@/lib/config";
import { getCase } from "@/lib/db";
import { useGuidance, type GuidanceLang } from "@/lib/guidance-context";
import { sendReferralSms } from "@/lib/sync";
import { getPrimaryNutritionTip } from "@chw/content";
import { colors } from "@chw/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Pressable, View } from "react-native";

export default function GuidanceScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const guidance = useGuidance();
  const [tipText, setTipText] = useState("");
  const [tipKey, setTipKey] = useState<string | undefined>();
  const [source, setSource] = useState("");
  const [delivered, setDelivered] = useState(false);
  const [lang, setLang] = useState<GuidanceLang>("en");
  const [dagbani, setDagbani] = useState("");
  const [engine, setEngine] = useState("");

  useEffect(() => {
    (async () => {
      const c = await getCase(id);
      if (!c) return;
      const tip = getPrimaryNutritionTip(c.patientType);
      if (!tip) return;
      setSource(tip.source);
      setTipKey(tip.key);
      const phrased = await guidance.rephrase(tip.text);
      setTipText(phrased);
      const tr = await guidance.translate(phrased, tip.key);
      setDagbani(tr.dagbani);
      setEngine(tr.engine);
    })();
  }, [id]);

  const displayText = lang === "dag" && dagbani ? dagbani : tipText;

  async function togglePlay() {
    if (guidance.isSpeaking) {
      guidance.stop();
      return;
    }
    if (!displayText) return;
    if (lang === "dag" && !dagbani) {
      return;
    }
    await guidance.speakText(displayText, lang);
  }

  async function shareSms() {
    if (!displayText) return;
    await sendReferralSms({
      caseId: id,
      to: DEMO_FACILITY_PHONE,
      message: `Nutrition guidance: ${displayText}`,
    });
  }

  const packLabel =
    guidance.packState.status === "ready"
      ? `Pack v${guidance.packState.manifest.version}`
      : guidance.packState.status === "downloading"
        ? `Downloading… ${Math.round(guidance.packProgress * 100)}%`
        : "Phrasebook (no pack)";

  return (
    <View className="flex-1 bg-shea">
      <TopAppBar title="Guidance" onBack={() => router.back()} />
      <View className="gap-section p-mobile">
        <View className="flex-row gap-2">
          {(["en", "dag"] as const).map((l) => (
            <Pressable
              key={l}
              onPress={() => setLang(l)}
              className={`flex-1 items-center rounded-full border px-3 py-2 ${
                lang === l
                  ? "border-clay bg-clay"
                  : "border-indigo-ink/20 bg-white"
              }`}
            >
              <Text
                className={`font-body-bold text-xs uppercase tracking-[1px] ${
                  lang === l ? "text-white" : "text-indigo-ink"
                }`}
              >
                {l === "en" ? "English" : "Dagbani"}
              </Text>
            </Pressable>
          ))}
        </View>

        <Card className="relative items-center gap-5 border-indigo-ink/10 p-6">
          <View className="absolute inset-y-0 left-0 w-1 bg-clay" />
          <Text className="max-w-[280px] text-center font-body text-base leading-6 text-indigo-ink">
            {displayText || "Loading tip…"}
          </Text>
          {lang === "dag" && !dagbani ? (
            <Text className="text-center font-body text-sm text-muted-foreground">
              No offline Dagbani translation for this tip yet.
            </Text>
          ) : null}
          <Button
            size="icon"
            className={`size-20 ${
              guidance.isSpeaking ? "bg-indigo-ink" : "bg-clay"
            }`}
            onPress={togglePlay}
            disabled={lang === "dag" && !dagbani}
          >
            <MaterialIcons
              name={guidance.isSpeaking ? "pause" : "play-arrow"}
              size={48}
              color={colors.white}
            />
          </Button>
          <View className="h-3 w-full flex-row gap-0.5">
            {Array.from({ length: 24 }).map((_, i) => (
              <View
                key={i}
                className={`flex-1 ${
                  i < (guidance.isSpeaking ? 16 : 8) ? "bg-clay" : "bg-millet"
                }`}
              />
            ))}
          </View>
        </Card>

        <View className="flex-row items-start gap-2.5">
          <MaterialIcons name="info" size={18} color={colors.clay} />
          <Text className="flex-1 font-utility text-[11px] uppercase tracking-[0.8px] text-muted-foreground">
            Source: {source || "—"}
          </Text>
        </View>
        <View className="flex-row items-start gap-2.5">
          <MaterialIcons name="language" size={18} color={colors.clay} />
          <Text className="flex-1 font-body text-indigo-ink">
            {lang === "en"
              ? "English · device speech"
              : `Dagbani · ${engine || "—"} · ${packLabel}`}
          </Text>
        </View>
        {guidance.experimental ? (
          <Text className="font-body text-xs leading-5 text-muted-foreground">
            Experimental — verify health advice with a native speaker before
            clinical use. Dagbani TTS needs a development build + language pack.
          </Text>
        ) : null}
        {guidance.lastError ? (
          <Text className="font-body text-xs text-red-700">
            {guidance.lastError}
          </Text>
        ) : null}

        {guidance.packState.status !== "ready" ? (
          <Button
            variant="outline"
            className="border-clay"
            onPress={() => guidance.downloadPack()}
          >
            <MaterialIcons name="download" size={20} color={colors.clay} />
            <Text className="font-body-bold text-xs uppercase tracking-[1.2px] text-clay">
              Download language pack
            </Text>
          </Button>
        ) : null}

        <Button
          className="bg-indigo-ink"
          onPress={() => setDelivered(true)}
        >
          <MaterialIcons name="check-circle" size={20} color={colors.shea} />
          <Text className="font-body-bold text-xs uppercase tracking-[1.2px] text-shea">
            {delivered ? "Delivered" : "Mark as Delivered"}
          </Text>
        </Button>
        <Button
          variant="outline"
          className="border-clay"
          onPress={shareSms}
        >
          <MaterialIcons name="share" size={20} color={colors.clay} />
          <Text className="font-body-bold text-xs uppercase tracking-[1.2px] text-clay">
            Share via SMS
          </Text>
        </Button>
      </View>
    </View>
  );
}
