# HANDOFF — Golf Scorecard Web App (Elite Golf Realm)

## 1. Project Overview

**Purpose**: Digitizes a 2-page paper golf scorecard used by student athletes and their coach. Duolingo-inspired mobile-first UX. Small scale (1 coach, 1-5 students). Branded as "Elite Golf Realm" with dragon logo.

**Tech Stack**: Next.js 16 (App Router, TypeScript), Tailwind CSS 4, Supabase (Auth + Postgres + Realtime). No additional UI libraries.

**Architecture**:
- `src/app/` — Routes split by role (`/student/*`, `/coach/*`) + auth (`/login`, `/onboarding`, `/auth/callback`)
- `src/components/ui/` — Reusable: button, card, progress-bar, stepper, toggle-group
- `src/components/scorecard/` — Domain: hole-input (core UX), celebration-card
- `src/lib/` — types.ts, calculations.ts, supabase/{client,server,middleware}.ts
- `supabase/migrations/` — 4 migrations (001 initial, 002 open course access, 003 fix profiles recursion, 004 coaching fields)

**DB Tables**: `profiles`, `golf_courses`, `course_holes`, `scorecards`, `hole_scores`, `notifications`. All RLS-protected.

**Repo**: `origin` → `https://github.com/wensteryu/golf-scorecard.git` (main branch)

## 2. Current Status

### Completed This Session (2026-03-19)
Implemented Stan's 4 new coaching variables — full stack, all code changes done:

- **Migration** (`supabase/migrations/004_add_coaching_fields.sql`) — Adds `fairway_miss_distance`, `club_used`, `approach_distance`, `first_putt_result` columns. Drops old GIR constraint first, migrates `gir='long'→'over'`, adds new constraint with `'over'` and `'pin_high'`.
- **Types** (`src/lib/types.ts`) — `GIRResult` updated (`'long'`→`'over'`, added `'pin_high'`). New types: `ClubUsed`, `FirstPuttResult`. `HoleScore` extended with 4 fields. `RoundStats` extended with new aggregate stats.
- **Stepper** (`src/components/ui/stepper.tsx`) — Added `step` prop (default 1) for 5-yard increments.
- **HoleInput** (`src/components/scorecard/hole-input.tsx`) — Full redesign: 4 sections (Off the Tee / Approach Shot / On the Green / Other). FW miss distance stepper (conditional on miss), club dropdown, approach distance input, first putt result toggle (conditional on putts>0, auto-sets "Made" when putts=1). Up & Down and Chip In moved under "Other", shown only when GIR missed.
- **Round init** (`src/app/student/new/page.tsx`) — New fields initialized as `null`.
- **Calculations** (`src/lib/calculations.ts`) — `girMissedLong`→`girMissedOver`, added `girMissedPinHigh`, `avgFairwayMissDistance`, `avgApproachDistance`, `clubUsageCounts`, 5 first putt result counts.
- **Summary** (`src/app/student/round/[id]/summary/page.tsx`) — Updated GIR labels (Over/Pin High), avg FW miss distance, new Approach card, 1st Putt Tendency section.
- **Review** (`src/app/student/round/[id]/review/page.tsx`) — GIR display: `'over'`→`'O'`, `'pin_high'`→`'PH'`.
- **Coach review** (`src/app/coach/review/[id]/page.tsx`) — Updated GIR labels, expanded view shows Club/Approach Distance/1st Putt Result/FW Miss Distance.

### Blocker Encountered & Fixed
- **Migration ordering bug**: Original migration tried `UPDATE gir='over'` while old constraint (only allowing `'long'`) was still active → constraint violation error. **Fixed**: reordered to DROP constraint first, then UPDATE data, then ADD new constraint. Corrected SQL provided to user; migration file updated.

### NOT Yet Done
- **Migration status UNKNOWN** — user was given corrected SQL to run in Supabase SQL editor but session ended before confirming success
- **Changes NOT committed** — all 8 modified files + 1 new migration + HANDOFF.md are uncommitted
- **No end-to-end testing** — `npx tsc --noEmit` passes clean, but no runtime verification with real data

## 3. Key Decisions

| Decision | Rationale |
|---|---|
| GIR `'long'` → `'over'` rename | Coach Stan's terminology preference; migration handles existing data |
| GIR `'pin_high'` added | New miss category Stan wants to track for coaching analysis |
| Migration: drop constraint → update data → add constraint | Must drop old constraint before writing new enum values; original order caused CHECK violation |
| Section dividers (not collapsible) | Matches approved mockup; keeps all fields visible, just visually organized |
| Club as `<select>` dropdown | 15 options too many for toggle pills |
| FW miss distance: stepper with step=5 | 5-yard increments match how golfers estimate miss distance |
| Auto-set first putt result to "Made" when putts=1 | If 1 putt on the green, it was obviously made — saves a tap |
| Chip In & Up and Down hidden when GIR=hit | Not applicable when green is hit in regulation |

## 4. Next Steps

**Priority 1 — Verify migration applied:**
1. Check if corrected SQL was run: `SELECT column_name FROM information_schema.columns WHERE table_name = 'hole_scores' AND column_name IN ('fairway_miss_distance', 'club_used', 'approach_distance', 'first_putt_result');`
2. Verify GIR constraint: `SELECT pg_get_constraintdef(oid) FROM pg_constraint WHERE conname = 'hole_scores_gir_check';`
3. If not applied, run the corrected SQL from `supabase/migrations/004_add_coaching_fields.sql`

**Priority 2 — Commit and push:**
1. Commit all changes (8 modified + 1 new migration file)
2. Push to main → Vercel auto-deploys
3. **CRITICAL**: Do NOT push before migration is confirmed applied — deploy will break if new columns don't exist

**Priority 3 — End-to-end testing:**
1. Create new round → test all 4 new fields save correctly
2. Test par 3 hole (Off the Tee section hidden)
3. Test fairway miss → distance stepper appears; fairway hit → distance clears to null
4. Test putts=0 → first putt result hidden; putts≥1 → shown; putts=1 → auto-sets "Made"
5. Verify Summary, Review, Coach Review pages display new/renamed stats
6. Load existing scorecard → verify backward compat (nulls for new fields)

**Priority 4 — Polish:**
- Mobile testing of new HoleInput layout (more fields = more scrolling)
- Verify toggle-group handles 6 GIR options well on small screens

## 5. Context Notes

- **Mockup reference**: `mockup-enhanced-hole-input.png` in project root — approved design for the new layout
- **Stan's request doc**: `stan_rev1.md` in project root — original coaching variable requirements
- **Save mechanism unchanged** — `handleFieldChange` in `round/[id]/page.tsx` uses generic `{ [field]: value }` pattern. New fields auto-work with debounced save.
- **Deployed to Vercel**: `https://golf-scorecard-iota.vercel.app`. Auto-deploys on push to main.
- **Supabase project**: `flraumgjaubkauconyoq.supabase.co`. Credentials in `.env.local`.
- **Admin email**: `wenjyu@gmail.com` — sees RoleSwitcher for dual-role testing.
- **No CLAUDE.md in project** — global CLAUDE.md at `~/.claude/CLAUDE.md` governs workflow.
- **TypeScript compiles clean** — zero errors from `npx tsc --noEmit`.
