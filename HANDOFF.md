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

### Completed This Session (2026-03-19)
**Split GIR into Yes/No + Pin Position multi-select** — 8 files modified + 1 new migration:

- **Migration** (`supabase/migrations/005_split_gir_fields.sql`) — Adds `gir_hit` (boolean) + `pin_position` (text[]), migrates old `gir` enum data, drops old `gir` column + constraint.
- **Types** (`src/lib/types.ts`) — Removed `GIRResult`, added `PinPosition` type. `HoleScore.gir` → `gir_hit` (boolean|null) + `pin_position` (PinPosition[]|null). `RoundStats`: `girMissed*` → `pinPosition*`.
- **Toggle Group** (`src/components/ui/toggle-group.tsx`) — Added discriminated union props for multi-select mode (`multiple`, `max`, array value/onChange). Backward compatible — existing single-select callers unchanged.
- **HoleInput** (`src/components/scorecard/hole-input.tsx`) — GIR is now Yes/No toggle. Pin Position multi-select (5 options, max 2) appears after GIR answer. Up & Down / Chip In conditional on `gir_hit === false`. Pin position clears when GIR set to Yes.
- **Round init** (`src/app/student/new/page.tsx`) — `gir: null` → `gir_hit: null, pin_position: null`.
- **Calculations** (`src/lib/calculations.ts`) — Uses `gir_hit` boolean for hit count, `pin_position.includes()` for direction stats. Compound positions (e.g., "short & right") count toward each direction.
- **Summary** (`src/app/student/round/[id]/summary/page.tsx`) — Renamed stat labels `girMissed*` → `pinPosition*` ("Left: N", "Right: N", etc.).
- **Review** (`src/app/student/round/[id]/review/page.tsx`) — `girDisplay()` shows checkmark/X + pin abbrevs (e.g., "✓ S,R"). `subtotal()` uses `gir_hit`.
- **Coach review** (`src/app/coach/review/[id]/page.tsx`) — `girLabel(hole)` shows "Hit (Short, Right)" or "Missed (Left)".

### Verification Status
- **TypeScript**: `npx tsc --noEmit` passes with zero errors
- **Migration**: NOT yet applied — user chose to run SQL manually in Supabase Dashboard
- **Runtime**: NOT yet tested — blocked on migration

### NOT Yet Done
- **Migration not applied** — SQL ready in `supabase/migrations/005_split_gir_fields.sql`, needs to be run in Supabase SQL Editor
- **Changes NOT committed** — all modified files are uncommitted
- **No end-to-end testing** — needs migration applied first

## 3. Key Decisions

| Decision | Rationale |
|---|---|
| Pin Position independent of GIR hit/miss | Player who hits GIR can still record pin position ("Hit but short-right") — richer coaching data per Coach Stan |
| Pin Position max 2 selections | Compound positions beyond 2 don't make golf sense (e.g., "short + right" = OK, three directions = nonsensical) |
| Pin position clears on GIR=Yes | Clean slate for re-selection; avoids stale data |
| Supabase `text[]` for pin_position | PostgREST handles arrays natively — no save mechanism changes needed |
| Discriminated union for toggle-group props | Type-safe multi-select without breaking existing single-select usage |

## 4. Next Steps

**Priority 1 — Apply migration:**
1. Run SQL from `supabase/migrations/005_split_gir_fields.sql` in Supabase SQL Editor
2. Verify: `SELECT gir_hit, pin_position FROM hole_scores LIMIT 5;`
3. Confirm old `gir` column is dropped: `SELECT column_name FROM information_schema.columns WHERE table_name = 'hole_scores' AND column_name = 'gir';` (should return 0 rows)

**Priority 2 — Runtime verification:**
1. `npm run dev` → create new round → test GIR Yes/No + pin position multi-select saves
2. Test max 2 pin positions enforced
3. Test Up & Down / Chip In visibility (hidden when GIR=Yes, shown when GIR=No)
4. Verify Summary, Review, Coach Review pages display new stats
5. Load existing round → backward compat (migrated data displays correctly)

**Priority 3 — Commit and push:**
1. Commit all changes
2. Push to main → Vercel auto-deploys
3. **CRITICAL**: Do NOT push before migration is confirmed applied

**Priority 4 — Production smoke test**

## 5. Context Notes

- **Old model**: `gir` was a single enum (`hit|left|right|short|over|pin_high`). **New model**: `gir_hit` (boolean) + `pin_position` (text[]). Two independent dimensions.
- **`PinPosition` type** at `types.ts:7` — DB column is untyped `text[]`, app-side types enforce the enum.
- **Save mechanism unchanged** — `handleFieldChange` in `round/[id]/page.tsx` uses generic `{ [field]: value }` pattern. Arrays auto-work with PostgREST.
- **Deployed to Vercel**: `https://golf-scorecard-iota.vercel.app`. Auto-deploys on push to main.
- **Supabase project**: `flraumgjaubkauconyoq.supabase.co`. Credentials in `.env.local`.
- **Admin email**: `wenjyu@gmail.com` — sees RoleSwitcher for dual-role testing.
- **TypeScript compiles clean** — zero errors from `npx tsc --noEmit`.
- **Mockup reference**: `mockup-enhanced-hole-input.png` in project root.
- **Stan's request doc**: `stan_rev1.md` in project root.
