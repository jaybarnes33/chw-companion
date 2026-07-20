import { TopAppBar } from "@/components/TopAppBar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import { useGuidance } from "@/lib/guidance-context";
import { colors } from "@nyaaba/ui";
import { MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  TextInput,
  View,
} from "react-native";

export default function TranslateScreen() {
  const router = useRouter();
  const guidance = useGuidance();
  const [english, setEnglish] = useState("");
  const [dagbani, setDagbani] = useState("");
  const [engine, setEngine] = useState("");

  async function onTranslate() {
    Keyboard.dismiss();
    const result = await guidance.translate(english);
    setDagbani(result.dagbani);
    setEngine(result.engine);
  }

  async function onSpeak() {
    Keyboard.dismiss();
    if (!dagbani) return;
    await guidance.speakText(dagbani, "dag");
  }

  return (
    <View className="flex-1 bg-shea">
      <TopAppBar title="Translate" onBack={() => router.back()} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
      <ScrollView
        className="flex-1"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ gap: 16, padding: 16, paddingBottom: 40 }}
      >
      <Pressable onPress={Keyboard.dismiss} accessible={false}>
        <View className="gap-4">
        <Card className="gap-3 border-amber-700/30 bg-amber-50 p-4">
          <Text className="font-body-bold text-sm text-amber-900">
            Experimental offline translator
          </Text>
          <Text className="font-body text-xs leading-5 text-amber-900/80">
            Do not use for unverified medical advice. Phrasebook covers common
            tips; free-form sentences need the trained ONNX pack + native review.
          </Text>
        </Card>

        <Text className="font-body-bold text-xs uppercase tracking-[1.5px] text-indigo-ink">
          English
        </Text>
        <TextInput
          className="min-h-[100px] rounded-xl border border-indigo-ink/15 bg-white p-4 font-body text-base text-indigo-ink"
          multiline
          blurOnSubmit
          returnKeyType="done"
          placeholder="Type English text…"
          placeholderTextColor={colors.onSurfaceVariant}
          value={english}
          onChangeText={setEnglish}
          onSubmitEditing={Keyboard.dismiss}
          textAlignVertical="top"
        />

        <Button
          className="bg-clay"
          onPress={onTranslate}
          disabled={!english.trim() || guidance.isGenerating}
        >
          <MaterialIcons name="translate" size={20} color={colors.white} />
          <Text className="font-body-bold text-xs uppercase tracking-[1.2px] text-white">
            {guidance.isGenerating ? "Translating…" : "Translate"}
          </Text>
        </Button>

        <Text className="font-body-bold text-xs uppercase tracking-[1.5px] text-indigo-ink">
          Dagbani
        </Text>
        <Card className="min-h-[100px] border-indigo-ink/10 p-4">
          <Text className="font-body text-base leading-6 text-indigo-ink">
            {dagbani || "—"}
          </Text>
          {engine ? (
            <Text className="mt-2 font-utility text-[11px] uppercase text-muted-foreground">
              Engine: {engine}
            </Text>
          ) : null}
        </Card>

        <View className="flex-row gap-2">
          <Button
            className="flex-1 bg-indigo-ink"
            onPress={onSpeak}
            disabled={!dagbani}
          >
            <MaterialIcons
              name={guidance.isSpeaking ? "stop" : "volume-up"}
              size={20}
              color={colors.shea}
            />
            <Text className="font-body-bold text-xs uppercase tracking-[1.2px] text-shea">
              {guidance.isSpeaking ? "Stop" : "Speak"}
            </Text>
          </Button>
          {guidance.isSpeaking ? (
            <Button
              variant="outline"
              className="border-clay"
              onPress={() => {
                Keyboard.dismiss();
                guidance.stop();
              }}
            >
              <MaterialIcons name="stop" size={20} color={colors.clay} />
            </Button>
          ) : null}
        </View>

        {guidance.packState.status !== "ready" ? (
          <Button
            variant="outline"
            className="border-clay"
            onPress={() => {
              Keyboard.dismiss();
              void guidance.downloadPack();
            }}
          >
            <MaterialIcons name="download" size={20} color={colors.clay} />
            <Text className="font-body-bold text-xs uppercase tracking-[1.2px] text-clay">
              Download language pack
            </Text>
          </Button>
        ) : (
          <Text className="font-body text-xs text-muted-foreground">
            Pack ready · TTS {guidance.ttsReady ? "on" : "offline stub"} ·
            translator {guidance.translatorReady ? "ONNX" : "phrasebook"}
          </Text>
        )}

        {guidance.lastError ? (
          <Text className="font-body text-xs text-red-700">{guidance.lastError}</Text>
        ) : null}
        </View>
      </Pressable>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
