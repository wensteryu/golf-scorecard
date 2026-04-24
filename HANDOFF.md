# HANDOFF — Golf Scorecard Web App (Elite Golf Realm)

## 1. Project Overview

**Purpose**: Digitizes a 2-page paper golf scorecard used by student athletes and their coach. Duolingo-inspired mobile-first UX. Small scale (1 coach, 1-5 students). Branded as "Elite Golf Realm" with dragon logo.

**Tech Stack**: Next.js 16 (App Router, TypeScript), Tailwind CSS 4, Supabase (Auth + Postgres + Realtime). No additional UI libraries.

**Architecture**:
- `src/app/` — Routes split by role (`/student/*`, `/coach/*`) + auth (`/login`, `/onboarding`, `/auth/callback`)
- `src/app/coach/layout.tsx` & `src/app/student/layout.tsx` — Role layouts that render RoleSwitcher for admin users on ALL sub-pages
- `src/components/ui/` — Reusable: button, card, progress-bar, stepper, toggle-group, role-switcher
- `src/components/scorecard/` — Domain: hole-input, celebration-card, birdie-celebration
- `src/lib/` — types.ts, calculations.ts, admin.ts, supabase/{client,server,middleware}.ts, **emails/parent-scorecard.ts** (shared email renderer)
- `supabase/migrations/` — 7 migrations (001 initial → 007 parent contact fields)

**DB Tables**: `profiles` (now with `parent_email`, `parent_first_name`), `golf_courses`, `course_holes`, `scorecards`, `hole_scores`, `notifications`. All RLS-protected.

**Repo**: `origin` → `https://github.com/wensteryu/golf-scorecard.git` (main branch)

## 2. Current Status

### This Session (2026-04-23) — All committed & pushed

**Parent email notifications** — two phases, both shipped.

**Phase 1: Plumbing** (commits `1157de5`, `b313d89`, `dba267f`)
- Migration 007 adds `parent_email`, `parent_first_name` to `profiles` (applied via dashboard).
- Student settings page at `/student/settings` lets students enter parent contact.
- Two API routes: `/api/notify-parent-submit`, `/api/notify-parent-review`.
- Wired into `/student/round/[id]/summary` (after `notify-coach`) and `/coach/review/[id]` (after `notify-student`), guarded by truthy `parent_email`. All fire-and-forget.
- Added `*.swp`/`*.swo`/`*~` to `.gitignore`.

**Phase 2: Embed full scorecard in parent emails** (commit `9c6bc24`)
- **Why:** E2E test revealed Vercel Deployment Protection intercepts email "View Round" links before the Next.js app runs, redirecting to `vercel.com/login`. Parents don't have Vercel accounts, so links were dead. Also, parents don't have Supabase accounts — even without the Vercel gate, the app would redirect them to login. Decision: the email IS the product for parents; embed the full round content inline, no links.
- **Shared renderer** at `src/lib/emails/parent-scorecard.ts` — `buildParentScorecardEmail(input)` returns `{ subject, html }`. Handles both `event: 'submit' | 'review'`. Pure function; takes parent contact, student/course/date, hole scores, stats, reflections, and (review only) coachFeedback.
- **Submit email**: green header "New Round Submitted" → hero card (course/date/score) → scorecard (front/back 9 with color-coded score cells — green birdie, gold eagle, amber bogey, darker amber double, red triple+) → key stats (fairways, GIR, putts, 1-putts, 3-putts) → student reflections (mentality, what transpired, how to respond).
- **Review email**: everything above + Coach feedback section (overall in green-accented blockquote + per-hole notes table, showing only holes with notes).
- **Route simplification**: Both API routes became ~50 lines — parse payload, call renderer, send via Nodemailer.
- **Call-site changes**: `/student/round/[id]/summary` and `/coach/review/[id]` now send expanded payloads with `holeScores`, `stats`, `reflections`, and (review) `coachFeedback` including in-flight `holeNotes` from component state.
- **Verified**: `npm run build` passes; rendered both templates with sample data (83/+11 round, birdie + bogeys, 3 coach-noted holes) and screenshotted via headless Chrome — clean and legible.

### Outstanding test step

Parent notifications are implemented and pushed but NOT yet end-to-end verified in production. To verify:
1. In `/student/settings` as Zoe, set parent first name + parent email to your own address.
2. Submit a test round → parent inbox should receive email with full scorecard inline.
3. Mark reviewed as Stan → parent inbox should receive email with scorecard + overall feedback + per-hole notes.
4. Negative case: clear parent email, submit another round, confirm only coach email sends (no error).

### Separate blocker: Vercel Deployment Protection breaks new-user signup

Vercel Deployment Protection is enabled on production and intercepts requests at Vercel's edge *before* Next.js sees them. Any new user (a new student Stan shares a link with, a new coach, or a parent clicking an email link from the pre-embed phase) is redirected to `vercel.com/login`, not the app's Supabase magic-link login. Evidence: parent test hit "Attempted Vercel Sign-in" email from Vercel. Existing users (Zoe, Jaden, Stan) aren't affected because they already have session cookies.

**Impact:** new students CANNOT sign up via a shared link from the coach until this is disabled. Parent emails no longer depend on this (content is self-contained post-embed), but student/coach onboarding still does.

**Fix (30 sec, reversible):** Vercel dashboard → project → Settings → Deployment Protection → Vercel Authentication section → click the blue "Enabled for" toggle to OFF → Save. Do NOT change the dropdown mode or upgrade to Pro — just disable the whole feature.

**Important nuance discovered this session:** "Standard Protection" only exempts **production Custom Domains** (e.g. `golf.elitegolfrealm.com`). The Vercel-assigned `.vercel.app` subdomain is NOT considered a custom domain, so Standard Protection still blocks it. Since we don't have a custom domain, changing the dropdown mode does nothing useful — the toggle must be turned fully off. Upgrading to Pro ($150/mo) is also overkill; Hobby plan allows toggling off entirely.

Safe because: Supabase middleware + RLS already gate `/student/*` and `/coach/*`; Vercel's layer is redundant and designed for staging, not prod auth. Sanity check after flipping: open the production URL in incognito — should land on the golf app login, not vercel.com.

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
| One parent per student (not a join table) | Single columns on `profiles` are simpler and match current reality. Cheap to migrate later. |
| Parent contact on `profiles`, not new table | Keeps schema flat; one row per student already exists. |
| Student captures parent contact via `/student/settings` | Student owns their profile row via RLS; no coach-mediated flow. |
| Parent emails are self-contained (no app links) | Parents have no Supabase/Vercel account. Dead link → bad UX. Embedding full content sidesteps auth entirely and is more private (no shared state). |
| Shared email renderer module, not duplicated templates | Two routes share ~90% of the layout. Single source of truth. |
| Two separate API routes (submit vs. review) | Keeps existing coach/student routes untouched; parent wording evolves independently. |
| Inline-styled table-based email layout | Maximum compatibility across Gmail/Outlook/Apple Mail; no external CSS, no flexbox. |
| Score cells color-coded per birdie/par/bogey/worse | At-a-glance legibility for parents who don't know golf notation. |
| Coach per-hole notes shown only for noted holes | Don't pad the email with 15+ empty rows; only surface what the coach actually wrote. |
| Fire-and-forget email sends | Matches existing pattern; failure never blocks submit/review. |
| Parent first name required if parent email set | Email opens with "Hi {First}" — empty first name reads awkwardly. |
| No unsubscribe link | Per user: parents want to see every submission; small private user base. |
| RoleSwitcher in layout.tsx | Ensures toggle on ALL sub-pages. |
| Admin list: `wenjyu@gmail.com`, `standumdumaya@gmail.com`, `bizacard@gmail.com` | Stan logs in with bizacard. |
| 1st Putts Made list filters by `putts === 1` | Matches the 1-Putts count. |
| 3-Putt distance section uses `putts >= 3` | Catches 3-putts and worse. |
| SG: Putting uses PGA Tour expected-putts benchmark | Standard practice; enables tracking improvement. |
| Club options ordered by distance | LW→SW→GW→PW→9i→…→2i→5H→4H→3H→7w→5w→3w→Driver. |
| Arccos stats page is static/hardcoded | No DB needed; single-purpose review page. |

## 4. Data Notes

- **Jaden has two profiles**: `fegsolutions@gmail.com` (`08cf3401`) and `jaywyeth676@gmail.com` (`b51fbb0f`).
- **Stan has two coach profiles**: `standumdumaya@gmail.com` (`8631965b`) and `bizacard@gmail.com` (`5d510e76`).
- **Jaden's 3/19 Rancho Solano** (`7d82ac02`): Holes 14/15 have `first_putt_result='made'` but `putts=2`. Hole 8 has `putts=1` but `first_putt_result='short'`.
- **Zoe's Arccos stats** (captured 2026-04-03): Benchmark is 0 HCP / 10 Round Avg. Key: SG Total +3.9, Driving +4.5 (71% fairways, 231 yds avg), Approach -0.5 (100-150 yd weakness), Putting -0.2 (0-10ft putts weakness).

## 5. Next Steps

1. **Disable Vercel Deployment Protection on Production** — Settings → Deployment Protection → Production: Disabled. **Currently blocks any new student/coach signup** (not just parents). Details in section 2's "Separate blocker" subsection.
2. **End-to-end test parent email flow** — see steps in section 2. Verify inline scorecard renders in Gmail (web + mobile), and that cleared parent email path produces no errors.
3. **Stan's feedback on Arccos stats page** — may want layout changes or different organization after reviewing `/coach/arccos/zoe`.
4. **Implement Strokes Gained** (pending user confirmation) — add SG: Putting + SG: Tee-to-Green to:
   - `src/lib/calculations.ts` — PGA expected-putts lookup table + SG calculation functions
   - `src/app/coach/review/[id]/page.tsx` — display SG stats on coach review
   - `src/app/student/round/[id]/summary/page.tsx` — display SG stats on student summary
5. **Stan/Jaden duplicate profiles** — both have two profiles each. May want to consolidate.
6. **Zoe's Micke Grove round** — scorecard `9d6a7b35` stuck at `in_progress`.
7. **Zoe's stale rounds** — 3 Baylands rounds stuck at `in_progress`.
8. **Jaden's data correction** — fairway "hit" values pre-debounce fix may be missing.

## 6. Context Notes

- **Deployed to Vercel**: `https://golf-scorecard-iota.vercel.app` — has Deployment Protection enabled (blocks fresh student/coach logins; parent emails no longer depend on the app).
- **Arccos stats page**: `https://golf-scorecard-iota.vercel.app/coach/arccos/zoe`
- **Student settings page**: `https://golf-scorecard-iota.vercel.app/student/settings`
- **Parent email renderer**: `src/lib/emails/parent-scorecard.ts`. Pure function; easy to iterate on the HTML without touching the API routes.
- **Supabase project**: `flraumgjaubkauconyoq.supabase.co`. Credentials in `.env.local`. Migrations applied manually via dashboard SQL editor (no local Supabase CLI).
- **Gmail credentials**: `GMAIL_USER` and `GMAIL_APP_PASSWORD` in `.env.local` (Vercel env too). Used by all four notify-* routes.
- **Git user**: `Wen Yu`, GitHub `wensteryu`. Use `gh auth switch --user wensteryu` if a push 403s (wrong account often active by default).
- **Coach = Stan** (`bizacard@gmail.com` primary login). Feature requests prioritized.
- **Zoe Yu** — student (`yuzoe8@gmail.com`, profile `0c258b49`).

---
Review the Next Steps section above and use it as your initial work queue.
