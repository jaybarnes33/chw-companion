/**
 * Cactus Compute integration (Fafa pattern)
 * -----------------------------------------
 * Install in a development build (not Expo Go):
 *   pnpm --filter mobile add cactus-react-native react-native-nitro-modules
 *
 * Then replace GuidanceProvider rephrase() with:
 *
 *   import { useCactusLM } from 'cactus-react-native';
 *   const cactusLM = useCactusLM({ model: 'lfm2.5-1.2b-instruct' });
 *   // download on mount; complete({ messages: [{ role:'system', content: GUARDRAIL }, { role:'user', content: tip }] })
 *
 * Guardrail: only rephrase the provided nutrition tip; never add medical claims.
 */
export const CACTUS_MODEL = "lfm2.5-1.2b-instruct";

export const GUIDANCE_SYSTEM_PROMPT = `You are a Nyaaba voice. Rephrase the following nutrition tip in warm, plain language for a caregiver in Northern Ghana. Do NOT add new medical advice, dosages, or diagnoses. Stay faithful to the tip text only.`;
