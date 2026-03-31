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

### This Session (2026-03-30) — UNCOMMITTED CHANGES

**Added Scoring by Par + 100 Yards In to coach review page**

Coach (Stan) reported missing stats on the coach review page. These were only visible on the student-facing summary. Added:

Changed file:
- `src/app/coach/review/[id]/page.tsx` — Added `parScoringColor` helper (line ~202) and two new cards between Round Summary and Detailed Breakdown sections (lines ~349-385):
  - **Scoring by Par** card: Par 3s, Par 4s, Par 5s score-to-par with color coding (green under, red over, gray even). Uses existing `stats.par3ScoringToPar`, `stats.par4ScoringToPar`, `stats.par5ScoringToPar` from `calculateStats()`.
  - **100 Yards & In** card: Displays `scorecard.hundred_yards_in` (only shown when student filled it in on Reflect page). Matches the summary grid card style.

**Verified**: `npx tsc --noEmit` — zero errors.

### Previous Sessions — All committed & pushed

- **2026-03-22** (commits `18d99f6`, `bf889bc`, `5202920`): Replaced Twilio SMS with Nodemailer Gmail email. Added student email notification on review. Added detailed Fairways/GIR/Putts breakdown tiles to coach review.
- **2026-03-21** (commit `227b5e3`): Replaced Resend email with Twilio SMS. Now superseded.
- **2026-03-19** (commits `7d596f6`, `dc4f9a5`): Split GIR into Yes/No + Pin Position. Fixed batched debounced save bug.

## 3. Key Decisions

| Decision | Rationale |
|---|---|
| Place Scoring by Par between Round Summary and Detailed Breakdown | Logical flow: summary numbers → scoring patterns → visual hole-by-hole breakdowns |
| Only show 100 Yards In when value exists | Field is optional on Reflect page; avoid showing empty card |
| Reuse same card/color patterns as student summary | Visual consistency across student and coach views |
| Gmail + Nodemailer for notifications | Toll-free verification blocker (Twilio error 30032); Gmail simpler for small scale |

## 4. Next Steps

1. **Commit and push** — Coach review page change is verified (tsc clean). Single file change.
2. **Visual verification** — Start dev server and screenshot the coach review page with a scorecard that has scoring-by-par and 100-yards-in data to confirm rendering.
3. **Deploy to Vercel** — Push triggers auto-deploy. Verify at `https://golf-scorecard-iota.vercel.app`.
4. **Jaden's data correction** — Fairway "hit" values from before the debounce fix (pre-`dc4f9a5`) are likely missing in DB.
5. **Optional enhancements** — Coach review page still lacks Approach stats (avg distance, club usage) and full Short Game details (chip-ins, up & down %, 1st putt tendency) that are on student summary. Add if Stan requests.

## 5. Context Notes

- **Deployed to Vercel**: `https://golf-scorecard-iota.vercel.app`
- **Supabase project**: `flraumgjaubkauconyoq.supabase.co`. Credentials in `.env.local` (anon key only).
- **Supabase CLI not linked** — migrations must be run manually via SQL Editor.
- **Admin email**: `wenjyu@gmail.com` — sees RoleSwitcher for dual-role testing. Also the `GMAIL_USER` for sending notifications.
- **Gmail App Password**: real value is in `.env.local`. Generated for "Elite Golf Realm" app.
- **Coach = Stan** — he reviews rounds on the coach review page. Feature requests from him should be prioritized.
- **`hundred_yards_in`** is a manual entry on the Reflect page (`reflect/page.tsx` lines 188-206), stored on the `scorecards` table. It's a count of all strokes inside 100 yards — not computed from hole data.
- **Save mechanism** (`round/[id]/page.tsx` lines 78-161): uses `pendingChanges` ref (object accumulator). Critical for any future save-related changes.
- **Review URL logic** (`notify-coach/route.ts` lines 22-27): uses `NEXT_PUBLIC_VERCEL_URL` in production, falls back to `localhost:3000` in dev.
