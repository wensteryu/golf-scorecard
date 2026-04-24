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
- `supabase/migrations/` — 7 migrations (001 initial → 007 parent contact fields)

**DB Tables**: `profiles` (now with `parent_email`, `parent_first_name`), `golf_courses`, `course_holes`, `scorecards`, `hole_scores`, `notifications`. All RLS-protected.

**Repo**: `origin` → `https://github.com/wensteryu/golf-scorecard.git` (main branch)

## 2. Current Status

### This Session (2026-04-23) — All committed & pushed

**Parent email notifications on scorecard submit and coach review** (commits `1157de5`, `b313d89`, `dba267f`)
- **Migration 007** (`supabase/migrations/007_add_parent_contact.sql`) — adds nullable `parent_email text` and `parent_first_name text` to `profiles`. **APPLIED by user in Supabase dashboard.**
- **Type update** — `Profile` interface in `src/lib/types.ts` gains both fields.
- **New student settings page** at `/student/settings` (`src/app/student/settings/page.tsx`) — student can edit their full name and add/edit parent first name + parent email. Validates email format; requires parent first name when email is set (used for "Hi [First]" greeting).
- **Settings link** added to `/student` dashboard footer (above Sign Out).
- **Two new API routes** using the existing Gmail/Nodemailer pattern:
  - `/api/notify-parent-submit` — fires when student submits a round ("{Student} just submitted a round for coach review").
  - `/api/notify-parent-review` — fires when coach marks reviewed ("Coach has reviewed {Student}'s round").
- **Wiring** — both routes fire in parallel with the existing coach/student emails, guarded by a truthy `parent_email` check. Fire-and-forget (`.catch(() => {})`).
- **Call sites**:
  - `src/app/student/round/[id]/summary/page.tsx` — loads `parent_email` + `parent_first_name` via the student profile fetch; fires `notify-parent-submit` after `notify-coach`.
  - `src/app/coach/review/[id]/page.tsx` — already joins `student:profiles!student_id(*)` so parent fields come through automatically; fires `notify-parent-review` after `notify-student`.
- Also added `*.swp`, `*.swo`, `*~` to `.gitignore`.
- `npm run build` passed with all 24 routes.
- Dev server spot-check: `/student/settings` correctly redirects unauthenticated to `/login`; compiled cleanly.

### BLOCKER DISCOVERED DURING E2E TEST (pending decision from user)

User tested the flow and the parent received the submit email, but **clicking "View Round" hit a Vercel "Attempted Vercel Sign-in" wall** — the Vercel deployment at `golf-scorecard-iota.vercel.app` has Deployment Protection enabled, so any unauthenticated request is intercepted by Vercel's edge auth and redirected to `vercel.com/login` before the Next.js middleware even runs. Parents don't have Vercel accounts, so they hit a dead end.

**Two layers of the problem:**
1. **Vercel layer**: Deployment Protection blocks parents from reaching the app at all. Fix: disable Deployment Protection in Vercel dashboard (Settings → Deployment Protection → Production: Disabled). Vercel's protection is preview-deploy ergonomics, not production security — Supabase + middleware already gates everything.
2. **App layer**: Even after (1), the middleware redirects unauth users to Supabase login. Parents don't have Supabase accounts either. Two options presented to user:
   - **Option 1**: Loosen RLS on `scorecards` + `hole_scores` to allow anonymous SELECT by ID, plus exempt `/student/round/[id]/summary` from middleware auth. Relies on UUIDs being unguessable.
   - **Option 2 (recommended)**: Embed the full scorecard content inside the parent emails (totals, score-to-par, hole-by-hole, coach feedback on the review email). No link, no sign-in, simpler UX. No RLS loosening.

**User has not yet picked between Option 1 and Option 2.** Ticket is paused on this choice.

### Previous Sessions — All committed & pushed

- **2026-04-03**: Captured Zoe's Arccos stats; created `/coach/arccos/zoe` static dashboard.
- **2026-04-01**: Added hybrid/2i/7w club options, fixed RoleSwitcher on sub-pages, added Stan's bizacard email to admin list, fixed 1st Putts Made list, added 3-Putt 1st Putt Distance summary.
- **2026-03-31**: Birdie/Eagle/Hole-in-One celebrations with dragon images.
- **2026-03-30**: Added 3-Putts tile, Scoring by Par, 100 Yards In to coach review page.
- **2026-03-22**: Replaced Twilio with Nodemailer Gmail. Added email notifications.
- **2026-03-19**: Split GIR into Yes/No + Pin Position. Fixed batched debounced save bug.

## 3. Key Decisions

| Decision | Rationale |
|---|---|
| One parent per student (not a join table) | Option A picked over multi-parent; single columns on `profiles` are simpler and match current reality. Cheap to migrate later. |
| Parent contact on `profiles`, not new table | Keeps schema flat; one row per student already exists. |
| Student captures parent contact themselves via `/student/settings` | No coach-mediated flow, no admin screen. Student owns their profile row already via RLS. |
| Two separate API routes for parent emails (not extending `notify-coach`/`notify-student`) | Parent templates read differently; separation keeps existing routes untouched (zero regression risk) and lets parent wording evolve independently. |
| Parent email sends are fire-and-forget | Matches existing coach/student email pattern; a send failure never blocks submit or review. |
| No unsubscribe link in parent emails | Per user: parents want to see all their kid's submissions; small private user base. |
| Parent first name required if parent email set | Email opens with "Hi {First}" personalization. |
| RoleSwitcher in layout.tsx | Ensures toggle on ALL sub-pages |
| Admin list: `wenjyu@gmail.com`, `standumdumaya@gmail.com`, `bizacard@gmail.com` | Stan logs in with bizacard |
| 1st Putts Made list filters by `putts === 1` | Matches the 1-Putts count; `first_putt_result` can be 'made' with 2+ putts |
| 3-Putt distance section uses `putts >= 3` | Catches 3-putts and worse |
| SG: Putting uses PGA Tour expected-putts benchmark | Standard practice even for amateurs; enables tracking improvement over time |
| Club options ordered by distance | LW→SW→GW→PW→9i→…→2i→5H→4H→3H→7w→5w→3w→Driver |
| Arccos stats page is static/hardcoded | No DB needed; data captured from Arccos screenshots; single-purpose review page |

## 4. Data Notes

- **Jaden has two profiles**: `fegsolutions@gmail.com` (`08cf3401`) and `jaywyeth676@gmail.com` (`b51fbb0f`).
- **Stan has two coach profiles**: `standumdumaya@gmail.com` (`8631965b`) and `bizacard@gmail.com` (`5d510e76`).
- **Jaden's 3/19 Rancho Solano** (`7d82ac02`): Holes 14/15 have `first_putt_result='made'` but `putts=2`. Hole 8 has `putts=1` but `first_putt_result='short'`.
- **Zoe's Arccos stats** (captured 2026-04-03): Benchmark is 0 HCP / 10 Round Avg. Key: SG Total +3.9, Driving +4.5 (71% fairways, 231 yds avg), Approach -0.5 (100-150 yd weakness), Putting -0.2 (0-10ft putts weakness).

## 5. Next Steps

1. **Resolve parent-can't-view-round blocker** — waiting on user choice between:
   - (a) Disable Vercel Deployment Protection + loosen RLS + exempt summary route from middleware auth.
   - (b) Embed full round content in the parent emails (recommended). No link dependency. Requires expanding `notify-parent-submit` and `notify-parent-review` templates to render scores/stats/feedback inline.
   - Whichever route is picked, also need to disable Vercel Deployment Protection at minimum (`vercel.com` → project → Settings → Deployment Protection → Production: Disabled), since it was blocking parents at the edge.
2. **End-to-end test parent notifications** (gated on #1) — submit round → confirm parent gets useful email (either link works or content is inline); mark reviewed → confirm second parent email.
3. **Stan's feedback on Arccos stats page** — may want layout changes or different organization after reviewing `/coach/arccos/zoe`.
4. **Implement Strokes Gained** (pending user confirmation) — Add SG: Putting + SG: Tee-to-Green to:
   - `src/lib/calculations.ts` — PGA expected-putts lookup table + SG calculation functions
   - `src/app/coach/review/[id]/page.tsx` — Display SG stats on coach review
   - `src/app/student/round/[id]/summary/page.tsx` — Display SG stats on student summary
5. **Stan/Jaden duplicate profiles** — Both have two profiles each. May want to consolidate.
6. **Zoe's Micke Grove round** — Scorecard `9d6a7b35` stuck at `in_progress`.
7. **Zoe's stale rounds** — 3 Baylands rounds stuck at `in_progress`.
8. **Jaden's data correction** — Fairway "hit" values pre-debounce fix may be missing.

## 6. Context Notes

- **Deployed to Vercel**: `https://golf-scorecard-iota.vercel.app` — has Deployment Protection enabled (blocking parents; see blocker above).
- **Arccos stats page**: `https://golf-scorecard-iota.vercel.app/coach/arccos/zoe`
- **Student settings page**: `https://golf-scorecard-iota.vercel.app/student/settings` (new this session)
- **Supabase project**: `flraumgjaubkauconyoq.supabase.co`. Credentials in `.env.local`. Migrations applied manually via the dashboard SQL editor (no local Supabase CLI).
- **Git user**: `Wen Yu`, GitHub `wensteryu`. Use `gh auth switch --user wensteryu` if a push 403s (wrong account often active by default).
- **Coach = Stan** (`bizacard@gmail.com` primary login). Feature requests prioritized.
- **Zoe Yu** — student (`yuzoe8@gmail.com`, profile `0c258b49`).

---
Review the Next Steps section above and use it as your initial work queue.
