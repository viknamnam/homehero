# HomeHero — Sprint 1 codebase

Less arguing. More appreciation. Better teamwork at home.

This repo implements **Phase 1 / Sprint 1–2 scope** from the build plan: household setup,
the <10-second Add Task flow, Today view, Week Summary with a first-class mental-load band,
estimated value with editable rates, and the hide-money toggle. It runs **fully local**
(AsyncStorage) so you can test the core loop today; Supabase sync is wired in Sprint 3.

## Project layout

```
homehero/
├── app/                      # Expo (React Native + TypeScript) app
│   ├── App.tsx               # Shell: tabs, Add Task overlay, toast
│   └── src/
│       ├── theme/tokens.ts   # Design tokens (mirrors Phase0_Design_Foundations §1)
│       ├── copy/strings.ts   # ALL user-facing strings (mirrors Phase0_Copy_Library)
│       ├── constants/categories.ts  # The 13 categories + mental-load flags
│       ├── store/HouseholdStore.tsx # Local-first state + persistence + log_duration_ms metric
│       ├── lib/supabase.ts   # Optional cloud client (inactive until .env is set)
│       ├── components/ui.tsx # Card, Chip, Avatar, StatCard, PrimaryButton, Toast
│       └── screens/          # Onboarding, Today, AddTask, Week, Settings
├── supabase/migrations/      # Postgres schema + seed trigger + RLS (run when cloud sync starts)
└── scripts/copy-lint.js      # CI guard: fails build on banned blame/debt phrases
```

## Getting started (PyCharm-friendly)

Prerequisites: **Node.js 20+** (https://nodejs.org). PyCharm Professional edits TS/React fine;
run commands in PyCharm's built-in Terminal.

```bash
cd app
npm install
npx expo start
```

Then:
- press **w** → opens in your browser (fastest way to try it)
- or install **Expo Go** on your phone and scan the QR code (same Wi-Fi network)

> If `npm install` reports version conflicts after Expo releases a new SDK, run
> `npx expo install --fix` to align native package versions.

## What to test first (maps to build-plan gates)

1. **The 10-second path**: open Add Task → tap a category → tap a duration → Save.
   The app records `log_duration_ms` on every save; **Settings shows your median** vs the <10s target.
2. **Hide money**: Settings → "Hide money everywhere" — value disappears from Today,
   Add Task preview, Week Summary, and Settings rates, instantly.
3. **Mental load band**: log a "Planning / Admin" or "Remembering" task → Week Summary
   shows it in the lavender Mental load band, above physical categories.

## Run the copy lint

```bash
node scripts/copy-lint.js
```

Wire this into CI so no banned phrase ever merges (build-plan Section 9).

## Wiring Supabase (Sprint 3 — not needed yet)

1. Create a project at supabase.com (one for staging, later one for prod — never shared).
2. SQL editor → run `supabase/migrations/0001_init.sql`, then `0002_rls.sql`.
   New households auto-seed 13 categories + default rates via trigger.
3. `cp app/.env.example app/.env` and fill in the URL + anon key.
4. Sprint 3 task: sync layer (local queue → Supabase, `client_id` idempotency,
   silent retry — logging must never visibly fail).

## Deliberately NOT in this build (per the phase plan)

Family Balance percentages, Thanks/appreciation, notifications, Kids Mode, AI parsing —
these are Phase 2–4 and several are emotionally sensitive surfaces that ship behind
feature flags with the appreciation layer. Don't pull them forward.

## Definition of done for Sprint 1 (tick in HomeHero_Build_Plan.md)

- [ ] Median log time <10s measured on a real phone (Settings metric)
- [ ] Two adults can both log on one device (person selector)
- [ ] Hide-money verified across every surface
- [ ] Week Summary shows mental load first-class
- [ ] Copy lint wired into CI
