import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as Speech from "expo-speech";
import { GUIDANCE_SYSTEM_PROMPT } from "./cactus";
import {
  cancelTranslation,
  disposeTranslator,
  initTranslator,
  translateToDagbani,
  type TranslateResult,
} from "./dagbani-translator";
import {
  disposeDagbaniTts,
  initDagbaniTts,
  isDagbaniTtsReady,
  speakDagbani,
  stopDagbaniTts,
} from "./dagbani-tts";
import {
  deleteLanguagePack,
  downloadLanguagePack,
  getInstalledPack,
  type LanguagePackManifest,
  type PackInstallState,
} from "./language-pack";

export type GuidanceLang = "en" | "dag";

type GuidanceContextValue = {
  isReady: boolean;
  isGenerating: boolean;
  rephrase: (tip: string) => Promise<string>;
  speak: (text: string, lang?: string) => void;
  stop: () => void;
  isSpeaking: boolean;

  // Language pack + Dagbani
  packState: PackInstallState;
  packProgress: number;
  refreshPack: () => Promise<void>;
  downloadPack: () => Promise<void>;
  removePack: () => Promise<void>;
  translatorReady: boolean;
  ttsReady: boolean;
  translate: (english: string, tipKey?: string) => Promise<TranslateResult>;
  speakText: (text: string, lang: GuidanceLang) => Promise<void>;
  lastError: string | null;
  experimental: boolean;
};

const GuidanceContext = createContext<GuidanceContextValue | null>(null);

async function wireNativeEngines(
  rootUri: string,
  manifest: LanguagePackManifest
) {
  const [tr, tts] = await Promise.all([
    initTranslator(rootUri, manifest),
    initDagbaniTts(rootUri, manifest),
  ]);
  return { translatorReady: tr, ttsReady: tts || isDagbaniTtsReady() };
}

/**
 * On-device guidance with optional Dagbani translation + TTS.
 * Guardrail: never invent clinical content — only deliver fixed tip text /
 * phrasebook / reviewed model output.
 */
export function GuidanceProvider({ children }: { children: React.ReactNode }) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [packState, setPackState] = useState<PackInstallState>({
    status: "missing",
  });
  const [packProgress, setPackProgress] = useState(0);
  const [translatorReady, setTranslatorReady] = useState(false);
  const [ttsReady, setTtsReady] = useState(false);
  const [lastError, setLastError] = useState<string | null>(null);

  const refreshPack = useCallback(async () => {
    const state = await getInstalledPack();
    setPackState(state);
    if (state.status === "ready") {
      const wired = await wireNativeEngines(state.rootUri, state.manifest);
      setTranslatorReady(wired.translatorReady);
      setTtsReady(wired.ttsReady);
    } else {
      setTranslatorReady(false);
      setTtsReady(false);
      await disposeTranslator();
      await disposeDagbaniTts();
    }
  }, []);

  useEffect(() => {
    refreshPack();
    return () => {
      void disposeTranslator();
      void disposeDagbaniTts();
      Speech.stop();
    };
  }, [refreshPack]);

  const downloadPack = useCallback(async () => {
    setLastError(null);
    setPackState({ status: "downloading", progress: 0 });
    const result = await downloadLanguagePack((p) => {
      setPackProgress(p);
      setPackState({ status: "downloading", progress: p });
    });
    setPackState(result);
    if (result.status === "ready") {
      const wired = await wireNativeEngines(result.rootUri, result.manifest);
      setTranslatorReady(wired.translatorReady);
      setTtsReady(wired.ttsReady);
      setPackProgress(1);
    } else if (result.status === "error") {
      setLastError(result.message);
    }
  }, []);

  const removePack = useCallback(async () => {
    await deleteLanguagePack();
    await disposeTranslator();
    await disposeDagbaniTts();
    setTranslatorReady(false);
    setTtsReady(false);
    setPackState({ status: "missing" });
    setPackProgress(0);
  }, []);

  const translate = useCallback(
    async (english: string, tipKey?: string): Promise<TranslateResult> => {
      setIsGenerating(true);
      setLastError(null);
      try {
        const result = await translateToDagbani(english, { tipKey });
        if (result.error) setLastError(result.error);
        return result;
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  const stop = useCallback(() => {
    cancelTranslation();
    stopDagbaniTts();
    Speech.stop();
    setIsSpeaking(false);
  }, []);

  const speakText = useCallback(
    async (text: string, lang: GuidanceLang) => {
      stop();
      if (!text.trim()) return;
      setIsSpeaking(true);
      setLastError(null);

      if (lang === "dag") {
        const result = await speakDagbani(text);
        if (!result.ok) {
          setLastError(result.error);
          setIsSpeaking(false);
          return;
        }
        setIsSpeaking(false);
        return;
      }

      Speech.speak(text, {
        language: "en-GH",
        onDone: () => setIsSpeaking(false),
        onStopped: () => setIsSpeaking(false),
        onError: () => setIsSpeaking(false),
      });
    },
    [stop]
  );

  const value = useMemo<GuidanceContextValue>(
    () => ({
      isReady: true,
      isGenerating,
      async rephrase(tip: string) {
        setIsGenerating(true);
        void GUIDANCE_SYSTEM_PROMPT;
        await new Promise((r) => setTimeout(r, 200));
        setIsGenerating(false);
        return tip;
      },
      speak(text: string, lang = "en-GH") {
        void speakText(text, lang.startsWith("dag") ? "dag" : "en");
      },
      stop,
      isSpeaking,
      packState,
      packProgress,
      refreshPack,
      downloadPack,
      removePack,
      translatorReady,
      ttsReady,
      translate,
      speakText,
      lastError,
      experimental: true,
    }),
    [
      isGenerating,
      isSpeaking,
      packState,
      packProgress,
      refreshPack,
      downloadPack,
      removePack,
      translatorReady,
      ttsReady,
      translate,
      speakText,
      stop,
      lastError,
    ]
  );

  return (
    <GuidanceContext.Provider value={value}>
      {children}
    </GuidanceContext.Provider>
  );
}

export function useGuidance() {
  const ctx = useContext(GuidanceContext);
  if (!ctx) throw new Error("useGuidance must be used within GuidanceProvider");
  return ctx;
}
