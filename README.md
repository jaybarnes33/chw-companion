# CHW Companion

Offline-first mobile companion for Community Health Workers (CHWs) at CHPS compounds in Northern Ghana — UNICEF StartUp Lab hackathon prototype.

**Prototype — pending clinical review.** Checklist and nutrition content is transcribed from public WHO/UNICEF and Ghana Health Service job aids. It must be validated by a qualified health professional before any real-world use.

## Stack

| Layer | Tech |
|---|---|
| Mobile | Expo (Router), expo-sqlite, Expo Speech |
| Web | Next.js App Router, Tailwind, district dashboard |
| Shared | `@chw/content`, `@chw/rules-engine`, `@chw/ui` |
| Cloud DB | PostgreSQL + Prisma (`@chw/db`) |
| SMS | AgooSMS (`POST /api/sms/referral`) |

## Monorepo

```
chw-companion/
├── apps/mobile          # Expo CHW app
├── apps/web             # Landing + dashboard + sync/SMS API
├── packages/content     # checklist.json + nutrition.json
├── packages/rules-engine
├── packages/db          # Prisma
├── packages/ui          # Brand tokens
└── docker-compose.yml
```

## Quick start

```bash
# Install
pnpm install

# Start Postgres (requires Docker Desktop running)
pnpm db:up

# Migrate + seed demo cases
pnpm db:generate
pnpm db:migrate
pnpm db:seed

# Web (landing + dashboard + API) — http://localhost:3000
pnpm --filter web dev

# Mobile
pnpm --filter mobile dev
```

Set `EXPO_PUBLIC_API_URL` to your machine LAN IP when testing on a physical device (e.g. `http://192.168.x.x:3000`).

### Env

Copy examples:

- `apps/web/.env.example` → `apps/web/.env.local`
- `apps/mobile/.env.example` → env in Expo / `.env`
- `packages/db/.env` — `DATABASE_URL`

Optional: `AGOO_SMS_API_KEY` for live SMS. Without it, the API returns a successful mock response and still writes timeline events.

## Demo script (airplane mode)

1. Open the mobile app with network off / airplane mode.
2. **+ New case** → Pregnant / postpartum woman.
3. Answer **Yes** to “Is there heavy vaginal bleeding?” (and finish remaining questions).
4. See **RED** + referral action.
5. Play nutrition guidance (TTS).
6. **Start referral** → advance status; check SMS log (mock or Agoo).
7. Go online → Sync tab → Force Sync → open `/dashboard` and find the case.

## Architecture

```
[Expo App] ←→ [expo-sqlite] ←push/pull→ [/api/sync] ←→ [Postgres via Prisma]
                                      [/api/sms] → AgooSMS
```

Risk scoring is deterministic (any RED flag → RED). The on-device LLM path is guardrailed to rephrase fixed `nutrition.json` tips only — never open-ended clinical advice. Weekend build ships a Cactus-ready guidance provider with TTS fallback.

## Scripts

| Command | Purpose |
|---|---|
| `pnpm dev` | Turbo dev (all packages with `dev`) |
| `pnpm db:up` | Docker Postgres |
| `pnpm db:migrate` | Apply Prisma migrations |
| `pnpm db:seed` | Seed Ama / Kofi / Afi demo cases |
| `pnpm --filter web build` | Production web build |

## Post-hackathon

- Clinical review of all content
- Proper multi-device sync conflict resolution
- Native-speaker review of local-language TTS
- Wire live `cactus-react-native` in an Expo dev client (same pattern as Fafa)
