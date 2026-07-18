# Offline Dagbani language pack (ML)

This folder builds the downloadable pack used by the mobile app:

1. **Translation** — `dagbani-translation/` fine-tunes `t5-small` (LoRA) → ONNX INT8
2. **TTS** — `dagbani-tts/` packages sherpa-onnx Dagbani voices
3. **Assemble** — `build_language_pack.py` → `artifacts/language-pack/`

Beginner notes: [TRAINING-CRASH-COURSE.md](./TRAINING-CRASH-COURSE.md)  
Device checklist: [DEVICE-VALIDATION.md](./DEVICE-VALIDATION.md)

## Mobile wiring

The Expo app uses:

- Phrasebook fallback immediately (no pack required) for nutrition tips
- Optional ONNX + sherpa when a pack is downloaded in a **development build**

```bash
# After training + packaging, host the pack and set:
EXPO_PUBLIC_LANGUAGE_PACK_URL=https://your.host/language-pack
EXPO_PUBLIC_DAGBANI_EXPERIMENTAL=true

# Native engines (dev client only — not Expo Go):
pnpm --filter mobile add onnxruntime-react-native
# optional: pnpm --filter mobile add expo-sherpa-onnx
npx eas build --profile development --platform android
```

## Status

Everything ships as **experimental** until native-speaker review of
`dagbani-translation/artifacts/eval/native_review.csv` and license clearance
for TTS sources.