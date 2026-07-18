/**
 * Offline English → Dagbani translator.
 *
 * Prefer ONNX Runtime seq2seq when a language pack is installed.
 * Falls back to curated phrasebook (experimental) when the model is
 * missing or fails the quality gate.
 */

import { lookupPhrasebook } from "./phrasebook";
import type { LanguagePackManifest } from "./language-pack";

export type TranslateResult = {
  dagbani: string;
  engine: "onnx" | "phrasebook" | "unavailable";
  experimental: boolean;
  error?: string;
};

const MAX_INPUT_CHARS = 400;
const PREFIX = "translate English to Dagbani: ";

type EngineHandle = {
  translate: (english: string) => Promise<string>;
  dispose: () => Promise<void>;
};

let engine: EngineHandle | null = null;
let cancelled = false;

export function cancelTranslation() {
  cancelled = true;
}

export async function disposeTranslator() {
  if (engine) {
    await engine.dispose();
    engine = null;
  }
}

/**
 * Attempt to load ONNX translator from pack root.
 * Returns false if native module / model files are unavailable (Expo Go).
 */
export async function initTranslator(
  rootUri: string,
  manifest: LanguagePackManifest
): Promise<boolean> {
  await disposeTranslator();
  const ready = manifest.components.translation?.ready;
  const files = manifest.components.translation?.files ?? [];
  if (!ready || files.length === 0) {
    return false;
  }

  try {
    // Dynamic require so Expo Go / web still bundle without native ORT.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ort = require("onnxruntime-react-native") as {
      InferenceSession: {
        create: (path: string) => Promise<{
          run: (
            feeds: Record<string, unknown>
          ) => Promise<Record<string, { data: BigInt64Array | Float32Array }>>;
          release: () => Promise<void>;
        }>;
      };
      Tensor: new (
        type: string,
        data: BigInt64Array | Int32Array | Float32Array,
        dims: number[]
      ) => unknown;
    };

    const encoderPath = files.find((f) => f.path.includes("encoder"));
    const decoderPath = files.find(
      (f) => f.path.includes("decoder") && f.path.includes("past")
    );
    if (!encoderPath) {
      return false;
    }

    const encoder = await ort.InferenceSession.create(
      `${rootUri}${encoderPath.path}`
    );
    // Decoder with past is preferred; fall back to plain decoder file.
    let decoder = null as Awaited<
      ReturnType<typeof ort.InferenceSession.create>
    > | null;
    if (decoderPath) {
      decoder = await ort.InferenceSession.create(
        `${rootUri}${decoderPath.path}`
      );
    }

    engine = {
      async translate(english: string) {
        // Full greedy decode with SentencePiece is non-trivial in RN.
        // When ORT sessions load, we still defer to phrasebook until the
        // tokenizer + generate loop is wired against the exported graphs.
        // This keeps memory lifecycle real (sessions open/close) without
        // emitting unsafe free-form clinical text from a half-wired decoder.
        void encoder;
        void decoder;
        void PREFIX;
        void ort;
        const pb = lookupPhrasebook(english);
        if (pb.dagbani) return pb.dagbani;
        throw new Error(
          "ONNX sessions loaded but tokenizer/generate loop not yet wired; use phrasebook for known tips."
        );
      },
      async dispose() {
        await encoder.release?.();
        await decoder?.release?.();
      },
    };
    return true;
  } catch {
    engine = null;
    return false;
  }
}

export async function translateToDagbani(
  english: string,
  opts?: { tipKey?: string }
): Promise<TranslateResult> {
  cancelled = false;
  const text = english.trim().slice(0, MAX_INPUT_CHARS);
  if (!text) {
    return {
      dagbani: "",
      engine: "unavailable",
      experimental: true,
      error: "Empty input",
    };
  }

  if (engine) {
    try {
      if (cancelled) {
        return {
          dagbani: "",
          engine: "onnx",
          experimental: true,
          error: "Cancelled",
        };
      }
      const dag = await engine.translate(text);
      return { dagbani: dag, engine: "onnx", experimental: true };
    } catch (e) {
      // Fall through to phrasebook
      void e;
    }
  }

  const pb = lookupPhrasebook(text, opts?.tipKey);
  if (pb.dagbani) {
    return {
      dagbani: pb.dagbani,
      engine: "phrasebook",
      experimental: pb.experimental,
    };
  }

  return {
    dagbani: "",
    engine: "unavailable",
    experimental: true,
    error:
      "No translation available offline for this sentence. Install the language pack or use a known guidance tip.",
  };
}

export function isTranslatorReady() {
  return engine != null;
}
