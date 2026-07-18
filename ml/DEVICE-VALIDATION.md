# Device validation checklist — Dagbani language pack

Run after building a custom development client (not Expo Go).

## Prerequisites

```bash
# From repo root
pnpm --filter mobile test:langpack

# Train / package models (GPU / Colab), then:
python ml/dagbani-tts/package_sherpa.py
python ml/build_language_pack.py
# Host ml/artifacts/language-pack/ and set EXPO_PUBLIC_LANGUAGE_PACK_URL

cd apps/mobile
npx eas build --profile development --platform android
npx eas build --profile development --platform ios
```

## Automated (CI / laptop)

| Check | Command / method | Pass criteria |
|-------|------------------|---------------|
| Phrasebook + checksums | `pnpm --filter mobile test:langpack` | exit 0 |
| Data prep | `python ml/dagbani-translation/prepare_data.py` | train/val/test CSV written |
| Pack manifest | `python ml/build_language_pack.py` | `manifest.json` exists |

## Physical Android + iPhone

For each platform, record: model, OS, pack size (MB), download time, translate latency (ms), TTS latency (ms), peak memory (MB).

1. **Install pack** — open Translate screen → Download language pack. Confirm progress UI and resume after killing the app mid-download.
2. **Airplane mode** — with pack installed, translate a guidance tip and speak. Must work offline.
3. **Guidance flow** — complete a case → Guidance → switch English/Dagbani → play. English uses `expo-speech`; Dagbani uses sherpa when ready.
4. **Low storage** — fill disk near capacity; download should surface an error (not crash).
5. **Engine teardown** — open/close Translate 10×; no native crash / leaked sessions.
6. **Relaunch persistence** — kill app; reopen; pack still `ready` without re-download.
7. **Quality gate** — if BLEU/native review fails, keep `status: experimental` and rely on phrasebook for fixed tips only.

## Feature flag

If quality/memory fails:

- Keep UI behind `EXPO_PUBLIC_DAGBANI_EXPERIMENTAL=true`
- Ship only reviewed fixed guidance translations (phrasebook keys)
- Do not advertise free-form medical translation

## Sign-off

| Item | Android | iOS | Reviewer | Date |
|------|---------|-----|----------|------|
| Download + verify | ☐ | ☐ | | |
| Offline translate | ☐ | ☐ | | |
| Offline TTS | ☐ | ☐ | | |
| Native-speaker clinical review | ☐ | ☐ | | |
| License cleared | ☐ | ☐ | | |
