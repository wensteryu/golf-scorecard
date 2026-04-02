# HANDOFF — Golf Scorecard Web App (Elite Golf Realm)

## 1. Project Overview

**Purpose**: Digitizes a 2-page paper golf scorecard used by student athletes and their coach. Duolingo-inspired mobile-first UX. Small scale (1 coach, 1-5 students). Branded as "Elite Golf Realm" with dragon logo.

**Tech Stack**: Next.js 16 (App Router, TypeScript), Tailwind CSS 4, Supabase (Auth + Postgres + Realtime). No additional UI libraries.

**Architecture**:
- `src/app/` — Routes split by role (`/student/*`, `/coach/*`) + auth (`/login`, `/onboarding`, `/auth/callback`)
- `src/app/coach/layout.tsx` & `src/app/student/layout.tsx` — Role layouts that render RoleSwitcher for admin users on ALL sub-pages
- `src/components/ui/` — Reusable: button, card, progress-bar, stepper, toggle-group, role-switcher
- `src/components/scorecard/` — Domain: hole-input, celebration-card, birdie-celebration
- `src/lib/` — types.ts, calculations.ts, admin.ts, supabase/{client,server,middleware}.ts
- `supabase/migrations/` — 5 migrations (001 initial → 005 split GIR fields)

**DB Tables**: `profiles`, `golf_courses`, `course_holes`, `scorecards`, `hole_scores`, `notifications`. All RLS-protected.

**Repo**: `origin` → `https://github.com/wensteryu/golf-scorecard.git` (main branch)

## 2. Current Status

### This Session (2026-04-01) — All committed & pushed

**1. Added hybrid, 2i, and 7w club options** (commit `a69941b`)
- Coach requested 3H/4H/5H hybrids, 2-iron, and 7-wood added to approach shot club dropdown.
- Updated `ClubUsed` type in `src/lib/types.ts` and `clubOptions` array in `src/components/scorecard/hole-input.tsx`.
- No DB migration needed — `club_used` is unconstrained text.

### Previous Sessions — All committed & pushed

- **2026-04-01 (earlier)**: Fixed RoleSwitcher on sub-pages, added Stan's bizacard email to admin list, fixed 1st Putts Made list, added 3-Putt 1st Putt Distance summary.
- **2026-03-31**: Birdie/Eagle/Hole-in-One celebrations with dragon images.
- **2026-03-30**: Added 3-Putts tile, Scoring by Par, 100 Yards In to coach review page.
- **2026-03-22**: Replaced Twilio with Nodemailer Gmail. Added email notifications.
- **2026-03-19**: Split GIR into Yes/No + Pin Position. Fixed batched debounced save bug.

## 3. Key Decisions

| Decision | Rationale |
|---|---|
| RoleSwitcher in layout.tsx | Ensures toggle on ALL sub-pages |
| Admin list: `wenjyu@gmail.com`, `standumdumaya@gmail.com`, `bizacard@gmail.com` | Stan logs in with bizacard |
| 1st Putts Made list filters by `putts === 1` | Matches the 1-Putts count; `first_putt_result` can be 'made' with 2+ putts |
| 3-Putt distance section uses `putts >= 3` | Catches 3-putts and worse |
| SG: Putting uses PGA Tour expected-putts benchmark | Standard practice even for amateurs; enables tracking improvement over time |
| Club options ordered by distance | LW→SW→GW→PW→9i→…→2i→5H→4H→3H→7w→5w→3w→Driver |

## 4. Data Notes

- **Jaden has two profiles**: `fegsolutions@gmail.com` (`08cf3401`) and `jaywyeth676@gmail.com` (`b51fbb0f`).
- **Stan has two coach profiles**: `standumdumaya@gmail.com` (`8631965b`) and `bizacard@gmail.com` (`5d510e76`).
- **Jaden's 3/19 Rancho Solano** (`7d82ac02`): Holes 14/15 have `first_putt_result='made'` but `putts=2`. Hole 8 has `putts=1` but `first_putt_result='short'`.

## 5. Next Steps

1. **Implement Strokes Gained** (pending user confirmation) — Add SG: Putting + SG: Tee-to-Green to:
   - `src/lib/calculations.ts` — PGA expected-putts lookup table + SG calculation functions
   - `src/app/coach/review/[id]/page.tsx` — Display SG stats on coach review
   - `src/app/student/round/[id]/summary/page.tsx` — Display SG stats on student summary
   - Possibly `src/app/student/history/[id]/page.tsx` — Student round history view
2. **Stan/Jaden duplicate profiles** — Both have two profiles each. May want to consolidate.
3. **Zoe's Micke Grove round** — Scorecard `9d6a7b35` stuck at `in_progress`.
4. **Zoe's stale rounds** — 3 Baylands rounds stuck at `in_progress`.
5. **Jaden's data correction** — Fairway "hit" values pre-debounce fix may be missing.

## 6. Context Notes

- **Deployed to Vercel**: `https://golf-scorecard-iota.vercel.app`
- **Supabase project**: `flraumgjaubkauconyoq.supabase.co`. Credentials in `.env.local`.
- **Git user**: `Wen Yu`, GitHub `wensteryu`. Use `gh auth switch --user wensteryu` if needed.
- **Coach = Stan** (`bizacard@gmail.com` primary login). Feature requests prioritized.
- **Zoe Yu** — student (`yuzoe8@gmail.com`, profile `0c258b49`).
