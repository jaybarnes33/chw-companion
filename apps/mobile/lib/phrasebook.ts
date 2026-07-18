/**
 * Curated English → Dagbani phrasebook for offline guidance.
 * Used when the ONNX translator is unavailable or fails the quality gate.
 *
 * IMPORTANT: Dagbani strings below are provisional placeholders for the
 * hackathon prototype. Replace with native-speaker reviewed text before
 * any clinical use.
 */

export type PhraseEntry = {
  en: string;
  dag: string;
  key?: string;
};

/** Exact matches for nutrition tip keys / full tip text. */
export const GUIDANCE_PHRASES: PhraseEntry[] = [
  {
    key: "exclusive_breastfeeding_0_6mo",
    en: "For the first 6 months, feed your baby only breast milk — no water, porridge, or other foods. Breast milk alone is enough during this time.",
    dag: "Bihili piligu goli ayobu ni, dihimi a bia mɔɣisim bihili ko — kom, sakoro, bee bindirigu shɛli. Mɔɣisim bihili ko nyɛla din saɣi saha ŋɔ ni.",
  },
  {
    key: "early_initiation",
    en: "Start breastfeeding within the first hour after birth. This helps protect the baby and supports your milk supply.",
    dag: "Pihimi bihili dihibu awa tuuli ni nyaanga dɔɣibu. Ŋɔ sɔŋdi a bia ka lahi sɔŋdi a bihili yibu.",
  },
  {
    key: "frequent_feeding_newborn",
    en: "Breastfeed on demand, day and night, as often as the baby wants — this is normal and helps your milk supply increase.",
    dag: "Dihimi bihili saha shɛli bia maa ni bɔra — wuntaŋ ni yuŋ. Ŋɔ nyɛla din niŋdi ka sɔŋdi bihili yibu.",
  },
  {
    key: "complementary_feeding_start",
    en: "At 6 months, start adding soft, mashed foods alongside continued breastfeeding. Do not stop breast milk — add food on top of it.",
    dag: "Goli ayobu ni, pahi bindirigu ŋun mali yoli ka dihi bihili. Di chɛ bihili dihibu — pahi bindirigu bihili zuɣu.",
  },
  {
    key: "dietary_diversity",
    en: "Try to include a mix of foods each day — grains, beans or groundnuts, vegetables, fruit, and if available, eggs, fish, or meat — for a well-rounded diet.",
    dag: "Zaŋmi bindirigu balibu zaŋ n-ti dabsili kam — kawana, bean bee sukuŋkɔŋ, wula, alibarika, ni saha shɛli galgɔŋ, zimu, bee nɛma.",
  },
  {
    key: "continued_breastfeeding_2yr",
    en: "Keep breastfeeding alongside other foods until your child is at least 2 years old.",
    dag: "Dihi bihili mini bindirigu shɛŋa hali ni a bia yuun'ayi.",
  },
  {
    key: "responsive_feeding",
    en: "Feed your child patiently, encourage them gently, and watch for hunger and fullness cues rather than forcing them to finish.",
    dag: "Dihimi a bia ni suɣulo, sɔŋmi o, ka lihimi o kom ni o suhuyoli — di zaŋ yiko n-ti o ka o di zaa.",
  },
  {
    key: "sick_child_feeding",
    en: "Continue feeding your child small, frequent meals during illness, and offer extra food after recovery to help them catch up.",
    dag: "Dihimi a bia bindirigu biɛla biɛla o doro saha, ka ti o din pahi o nyaanga alaafee.",
  },
  {
    key: "maternal_nutrition_pregnancy",
    en: "Eat a variety of foods during pregnancy and take iron-folic acid supplements as advised by your health worker.",
    dag: "Di bindirigu balibu a puhuli saha, ka di iron-folic acid tima din ni a alaafee tumtumda yɛli.",
  },
  {
    key: "maternal_nutrition_postpartum",
    en: "Continue eating a varied diet and drink enough fluids while breastfeeding — your body needs extra energy during this time.",
    dag: "Di bindirigu balibu ka nyuri kom pam bihili dihibu saha — a nini bora yiko din pahi.",
  },
];

export const COMMON_PHRASES: PhraseEntry[] = [
  { en: "Good morning", dag: "Deseba" },
  { en: "How are you?", dag: "A wuhira?" },
  { en: "Thank you", dag: "N tipaya" },
  { en: "Please sit down", dag: "Moli ninyɔɣu" },
  { en: "Drink water", dag: "Nyuri kom" },
  { en: "The child is sick", dag: "Bia maa bɛri" },
  { en: "Go to the clinic", dag: "Chani asibiti" },
  { en: "Wash your hands", dag: "Yohimi a nuhi" },
  { en: "Breastfeed your baby", dag: "Dihimi a bia bihili" },
  { en: "This is important", dag: "Ŋɔ nyɛla barina" },
];

function normalize(s: string) {
  return s.trim().toLowerCase().replace(/\s+/g, " ");
}

export function lookupPhrasebook(
  english: string,
  tipKey?: string
): { dagbani: string; source: "guidance" | "common" | "none"; experimental: boolean } {
  if (tipKey) {
    const byKey = GUIDANCE_PHRASES.find((p) => p.key === tipKey);
    if (byKey) {
      return { dagbani: byKey.dag, source: "guidance", experimental: true };
    }
  }
  const n = normalize(english);
  const exact =
    GUIDANCE_PHRASES.find((p) => normalize(p.en) === n) ||
    COMMON_PHRASES.find((p) => normalize(p.en) === n);
  if (exact) {
    return {
      dagbani: exact.dag,
      source: GUIDANCE_PHRASES.includes(exact) ? "guidance" : "common",
      experimental: true,
    };
  }
  // Fuzzy: if English contains a known phrase
  for (const p of [...GUIDANCE_PHRASES, ...COMMON_PHRASES]) {
    if (n.includes(normalize(p.en)) || normalize(p.en).includes(n)) {
      return { dagbani: p.dag, source: "common", experimental: true };
    }
  }
  return { dagbani: "", source: "none", experimental: true };
}
