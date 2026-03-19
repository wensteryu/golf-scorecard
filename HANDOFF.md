# HANDOFF — Golf Scorecard Web App (Elite Golf Realm)

## 1. Project Overview

**Purpose**: Digitizes a 2-page paper golf scorecard used by student athletes and their coach. Duolingo-inspired mobile-first UX. Small scale (1 coach, 1-5 students). Branded as "Elite Golf Realm" with dragon logo.

**Tech Stack**: Next.js 16 (App Router, TypeScript), Tailwind CSS 4, Supabase (Auth + Postgres + Realtime). No additional UI libraries.

**Architecture**:
- `src/app/` — Routes split by role (`/student/*`, `/coach/*`) + auth (`/login`, `/onboarding`, `/auth/callback`)
- `src/components/ui/` — Reusable: button, card, progress-bar, stepper, toggle-group
- `src/components/scorecard/` — Domain: hole-input (core UX), celebration-card
- `src/lib/` — types.ts, calculations.ts, supabase/{client,server,middleware}.ts
- `supabase/migrations/` — 5 migrations (001 initial → 005 split GIR fields)

**DB Tables**: `profiles`, `golf_courses`, `course_holes`, `scorecards`, `hole_scores`, `notifications`. All RLS-protected.

**Repo**: `origin` → `https://github.com/wensteryu/golf-scorecard.git` (main branch)

## 2. Current Status

### Completed This Session (2026-03-19) — All committed & pushed

**1. Split GIR into Yes/No + Pin Position multi-select** (commit `7d596f6`)
- Migration 005: `gir` (enum) → `gir_hit` (boolean) + `pin_position` (text[])
- Toggle group: multi-select mode with `max` constraint
- Updated: types, calculations, hole-input, new round init, summary, review, coach review
- Migration applied to live Supabase DB

**2. Fixed critical save bug: batched debounced saves** (commit `dc4f9a5`)
- Root cause: `handleFieldChange` debounce dropped saves when multiple `onUpdate` calls fired in same event cycle (e.g., Fairway="Hit" triggered fairway + fairway_miss_distance, but only miss_distance was saved)
- Fix: replaced single `pendingSave` function ref with `pendingChanges` accumulator object — all fields in a debounce window are merged into one `.update()` call
- Affected flows fixed: Fairway Hit, GIR Yes, Putts 0, Putts 1

### Verification
- TypeScript: zero errors
- Production deployed via Vercel auto-deploy, site loads correctly
- Cannot do authenticated E2E testing from CLI (auth required)

## 3. Key Decisions

| Decision | Rationale |
|---|---|
| Pin Position independent of GIR hit/miss | Richer coaching data — "Hit GIR but short-right of pin" |
| Pin Position max 2 | Compound beyond 2 doesn't make golf sense |
| Batch save via pendingChanges object | Prevents field loss when multiple onUpdate calls fire synchronously |
| fetch keepalive for page unload flush | More reliable than sendBeacon (supports custom headers for Supabase auth) |

## 4. Next Steps

1. **Jaden's data correction** — Fairway "hit" values from before the fix are likely missing in DB. Either re-enter those holes or manually UPDATE in Supabase SQL Editor.
2. **Manual E2E test** — Log in, start a round, verify: Fairway Hit saves correctly, GIR Yes/No + Pin Position works, Putts 0/1 saves correctly, Summary/Review totals are accurate.
3. **Untracked files** — `ground truth/`, `mockup-enhanced-hole-input.png`, `stan_rev1.md` are reference artifacts in the repo root. Consider .gitignore or committing them.

## 5. Context Notes

- **Deployed to Vercel**: `https://golf-scorecard-iota.vercel.app`
- **Supabase project**: `flraumgjaubkauconyoq.supabase.co`. Credentials in `.env.local` (anon key only, no service role).
- **Supabase CLI not linked** — migrations must be run manually via SQL Editor.
- **Admin email**: `wenjyu@gmail.com` — sees RoleSwitcher for dual-role testing.
- **Save mechanism** (`round/[id]/page.tsx` lines 78-161): now uses `pendingChanges` ref (object accumulator) instead of `pendingSave` ref (single function). Critical to understand for any future save-related changes.
