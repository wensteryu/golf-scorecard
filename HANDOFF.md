# HANDOFF — Golf Scorecard Web App (Elite Golf Realm)

## 1. Project Overview

**Purpose**: Digitizes a 2-page paper golf scorecard used by student athletes and their coach. Duolingo-inspired mobile-first UX. Small scale (1 coach, 1-5 students). Branded as "Elite Golf Realm" with dragon logo.

**Tech Stack**: Next.js 16 (App Router, TypeScript), Tailwind CSS 4, Supabase (Auth + Postgres + Realtime). No additional UI libraries.

**Architecture**:
- `src/app/` — Routes split by role (`/student/*`, `/coach/*`) + auth (`/login`, `/onboarding`, `/auth/callback`)
- `src/components/ui/` — Reusable: button, card, progress-bar, stepper, toggle-group
- `src/components/scorecard/` — Domain: hole-input, celebration-card, birdie-celebration (NEW)
- `src/lib/` — types.ts, calculations.ts, supabase/{client,server,middleware}.ts
- `supabase/migrations/` — 5 migrations (001 initial → 005 split GIR fields)

**DB Tables**: `profiles`, `golf_courses`, `course_holes`, `scorecards`, `hole_scores`, `notifications`. All RLS-protected.

**Repo**: `origin` → `https://github.com/wensteryu/golf-scorecard.git` (main branch)

## 2. Current Status

### This Session (2026-03-31) — UNCOMMITTED CHANGES

**Added Birdie/Eagle/Hole-in-One emoji celebrations during score entry**

When a student enters a score that is under par, an animated emoji overlay appears instantly. Non-blocking (`pointer-events-none`), auto-dismisses.

| Achievement | Emoji | Duration |
|---|---|---|
| Birdie (1 under) | 🐦 burst + "Birdie!" label | 1.8s |
| Eagle (2+ under) | 🦅 burst + "Eagle!" label | 1.8s |
| Hole-in-One (score=1) | 🎯 + confetti rain + screen flash + "HOLE IN ONE!" | 3s |

Changed files:
- `src/app/globals.css` — Added 5 CSS keyframe animations: `emoji-pop`, `emoji-fade-out`, `emoji-burst`, `label-slide-up`, `screen-flash` with utility classes
- `src/components/scorecard/birdie-celebration.tsx` (NEW) — Presentational overlay component. Config-driven per celebration type. Radial particle burst using CSS custom properties `--burst-x`/`--burst-y`. Reuses `ConfettiPiece` pattern from `celebration-card.tsx` for hole-in-one
- `src/app/student/round/[id]/page.tsx` — Added `celebrationType` state + `celebrationTimeout` ref. Detection in `handleFieldChange` when `field === 'score'`: compares score vs par, calls `triggerCelebration()`. Only triggers on score changes, not par changes

**Also committed this session** (already pushed):
- `14b4dcf` — 3-Putts tile to coach review round summary
- `d659c75` — Scoring by Par and 100 Yards In to coach review page

**Verified**: `npx tsc --noEmit` — zero errors. Dev server runs clean.

**Investigated**: Zoe's Micke Grove round (scorecard `9d6a7b35`) — status is `in_progress`, all 18 hole scores entered but never submitted. Zoe needs to complete the Reflect step, or DB status can be flipped manually.

### Previous Sessions — All committed & pushed

- **2026-03-30** (commits `14b4dcf`, `d659c75`): Added 3-Putts tile, Scoring by Par, 100 Yards In to coach review page.
- **2026-03-22** (commits `18d99f6`, `bf889bc`, `5202920`): Replaced Twilio SMS with Nodemailer Gmail email. Added student email notification on review. Added detailed Fairways/GIR/Putts breakdown tiles to coach review.
- **2026-03-19** (commits `7d596f6`, `dc4f9a5`): Split GIR into Yes/No + Pin Position. Fixed batched debounced save bug.

## 3. Key Decisions

| Decision | Rationale |
|---|---|
| Trigger celebration only on `field === 'score'` changes, not par changes | Changing par is a correction, not an achievement |
| `pointer-events-none` overlay, no dismiss button | Non-blocking UX; student can keep tapping +/- during celebration |
| `requestAnimationFrame` for unmount/remount cycle | Forces CSS animation restart when rapid clicking changes celebration type |
| Hole-in-one gets confetti + screen flash + 3s duration | Escalated intensity for rarer achievement; reuses existing confetti pattern |
| Supabase service role key added to `.env.local` | Needed for unauthenticated DB queries from CLI; key is `SUPABASE_SERVICE_ROLE_KEY` |
| Gmail + Nodemailer for notifications | Toll-free verification blocker (Twilio error 30032); Gmail simpler for small scale |

## 4. Next Steps

1. **Commit and push** — Birdie celebration feature is verified (tsc clean). 3 file changes (1 new, 2 modified).
2. **Visual verification** — Log in as a student, navigate to a round, adjust score to birdie/eagle to confirm animation renders. Dev server is running on `localhost:3000`.
3. **Deploy to Vercel** — Push triggers auto-deploy. Verify at `https://golf-scorecard-iota.vercel.app`.
4. **Zoe's Micke Grove round** — Scorecard `9d6a7b35` is `in_progress` with all 18 scores entered. Either have Zoe submit through the app (Reflect page), or manually update status to `submitted` in Supabase.
5. **Zoe's stale rounds** — 3 Baylands rounds stuck at `in_progress` (created 2026-03-19). May be test data; confirm with user before cleanup.
6. **Jaden's data correction** — Fairway "hit" values from before the debounce fix (pre-`dc4f9a5`) are likely missing in DB.
7. **Optional enhancements** — Coach review page still lacks Approach stats and full Short Game details. Add if Stan requests.

## 5. Context Notes

- **Deployed to Vercel**: `https://golf-scorecard-iota.vercel.app`
- **Supabase project**: `flraumgjaubkauconyoq.supabase.co`. Credentials in `.env.local` (anon key + service role key).
- **Supabase CLI not linked** — migrations must be run manually via SQL Editor.
- **Admin email**: `wenjyu@gmail.com` — sees RoleSwitcher for dual-role testing. Also the `GMAIL_USER` for sending notifications.
- **Git user**: `Wen Yu <wenjyu@gmail.com>`, GitHub username `wensteryu`.
- **Coach = Stan** — he reviews rounds on the coach review page. Feature requests from him should be prioritized.
- **Zoe Yu** — student (`yuzoe8@gmail.com`, profile `0c258b49`). Also has a coach profile (`wenjyu@gmail.com`, `1d5b5d33`) — likely for testing.
- **Save mechanism** (`round/[id]/page.tsx` lines 78-161): uses `pendingChanges` ref (object accumulator). Celebration detection is in `handleFieldChange` (lines 180-192). Critical for any future save-related changes.
- **Celebration component** (`birdie-celebration.tsx`): purely presentational, parent controls via `type` prop + timeout. Uses `getBurstPosition()` with `Math.random()` for particle directions — positions vary on each mount.
- **Review URL logic** (`notify-coach/route.ts` lines 22-27): uses `NEXT_PUBLIC_VERCEL_URL` in production, falls back to `localhost:3000` in dev.
