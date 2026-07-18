/**
 * Offline Dagbani TTS via expo-sherpa-onnx when available.
 * Falls back to unavailable (English expo-speech is handled by guidance-context).
 */

import type { LanguagePackManifest } from "./language-pack";

export type TtsResult =
  | { ok: true; engine: "sherpa" }
  | { ok: false; error: string };

type TtsEngine = {
  generate: (text: string) => Promise<{ samples: number[]; sampleRate: number }>;
  destroy: () => Promise<void>;
};

let tts: TtsEngine | null = null;
let speaking = false;
let stopRequested = false;

export function isDagbaniTtsReady() {
  return tts != null;
}

export function isDagbaniTtsSpeaking() {
  return speaking;
}

export async function disposeDagbaniTts() {
  stopRequested = true;
  speaking = false;
  if (tts) {
    try {
      await tts.destroy();
    } catch {
      // ignore
    }
    tts = null;
  }
}

export async function initDagbaniTts(
  rootUri: string,
  manifest: LanguagePackManifest
): Promise<boolean> {
  await disposeDagbaniTts();
  const files = manifest.components.tts?.files ?? [];
  if (!manifest.components.tts?.ready || files.length === 0) {
    return false;
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const sherpa = require("expo-sherpa-onnx") as {
      createTTS: (config: Record<string, unknown>) => Promise<TtsEngine>;
      detectTtsModel?: (path: string) => Promise<unknown>;
    };

    const modelFile = files.find((f) => f.path.endsWith(".onnx") && f.path.includes("model"));
    const tokens = files.find((f) => f.path.endsWith("tokens.txt"));
    const lexicon = files.find((f) => f.path.endsWith("lexicon.txt"));
    const vocoder = files.find((f) => f.path.includes("vocos"));

    if (!modelFile || !tokens) {
      return false;
    }

    const ttsDir = `${rootUri}tts/`;
    const engine = await sherpa.createTTS({
      model: {
        matcha: {
          acousticModel: `${rootUri}${modelFile.path}`,
          vocoder: vocoder ? `${rootUri}${vocoder.path}` : undefined,
          lexicon: lexicon ? `${rootUri}${lexicon.path}` : "",
          tokens: `${rootUri}${tokens.path}`,
        },
      },
      // Also try vits shape if matcha fails at runtime — callers can re-init.
      maxNumSentences: 2,
      _fallbackDir: ttsDir,
    });

    tts = engine;
    return true;
  } catch {
    tts = null;
    return false;
  }
}

async function playPcm(samples: number[], sampleRate: number): Promise<void> {
  try {
    // Prefer expo-audio when installed in a dev client.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { Audio } = require("expo-av") as {
      Audio: {
        Sound: {
          createAsync: (
            source: { uri: string },
            status?: object
          ) => Promise<{ sound: { playAsync: () => Promise<void>; unloadAsync: () => Promise<void>; setOnPlaybackStatusUpdate: (cb: (s: { didJustFinish?: boolean }) => void) => void } }>;
        };
      };
    };
    // Writing raw PCM to a temp wav would go here; for now signal unsupported
    // if we only have samples without a wav writer.
    void Audio;
    void samples;
    void sampleRate;
    throw new Error("PCM playback bridge not configured — use generate+file API");
  } catch {
    // Last resort: no native playback for PCM in Expo Go.
    throw new Error(
      "Dagbani TTS engine loaded but audio playback requires a development build with expo-av/expo-audio"
    );
  }
}

export async function speakDagbani(text: string): Promise<TtsResult> {
  stopRequested = false;
  if (!tts) {
    return {
      ok: false,
      error:
        "Dagbani TTS not installed. Download the language pack in a development build.",
    };
  }
  if (!text.trim()) {
    return { ok: false, error: "Empty text" };
  }

  try {
    speaking = true;
    const audio = await tts.generate(text.trim());
    if (stopRequested) {
      speaking = false;
      return { ok: true, engine: "sherpa" };
    }
    await playPcm(audio.samples, audio.sampleRate);
    speaking = false;
    return { ok: true, engine: "sherpa" };
  } catch (e) {
    speaking = false;
    return {
      ok: false,
      error: e instanceof Error ? e.message : "TTS failed",
    };
  }
}

export function stopDagbaniTts() {
  stopRequested = true;
  speaking = false;
}
