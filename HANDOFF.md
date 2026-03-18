# HANDOFF — Golf Scorecard Web App (Elite Golf Realm)

## 1. Project Overview

**Purpose**: Digitizes a 2-page paper golf scorecard used by student athletes and their coach. Duolingo-inspired mobile-first UX. Small scale (1 coach, 1-5 students). Branded as "Elite Golf Realm" with dragon logo.

**Tech Stack**: Next.js 16 (App Router, TypeScript), Tailwind CSS 4, Supabase (Auth + Postgres + Realtime). No additional UI libraries.

**Architecture**:
- `src/app/` — Routes split by role (`/student/*`, `/coach/*`) + auth (`/login`, `/onboarding`, `/auth/callback`)
- `src/components/ui/` — Reusable: button, card, progress-bar, stepper, toggle-group
- `src/components/scorecard/` — Domain: hole-input (core UX), celebration-card
- `src/components/notifications/` — NotificationBell with Supabase Realtime
- `src/lib/` — types.ts, calculations.ts, supabase/{client,server,middleware}.ts
- `src/hooks/` — use-notifications.ts
- `src/middleware.ts` — Auth guard + role-based routing
- `supabase/migrations/001_initial_schema.sql` — 6 tables, RLS policies, triggers

**DB Tables**: `profiles`, `golf_courses`, `course_holes`, `scorecards`, `hole_scores`, `notifications`. All RLS-protected.

**Repo**: `origin` → `https://github.com/wensteryu/golf-scorecard.git` (main branch)

## 2. Current Status

### Completed (across prior sessions)
- Full MVP: 39 files, 6500+ LOC (`99b2057`)
- Supabase project created, `.env.local` configured, migration applied
- Google OAuth sign-in (`50b0f6e`)
- Removed invite code system — single-coach model (`7fc97e4`, `52bbb18`)
- Admin role switcher for `wenjyu@gmail.com` (`9444003`)
- Fixed RLS infinite recursion (`28f6116`) and profile creation (`986336b`)
- Scoring UX: par selector per hole (`50bac5f`), redesigned progress bar with hole numbers/scores/clickable (`bf24292`)
- Auto-save: immediate save on input, catches swipe/close/hide events (`92661db`)
- Auto-save par as default score when moving to next hole (`f47ef3b`)
- Par changes sync to `course_holes` for future rounds (`abcce06`)
- Home button with save-before-navigate (`7c4c331`)
- Fixed save to use `.update()` instead of `.upsert()` for hole scores (`eb15531`)
- UX: delete in-progress rounds, inline save feedback (`d18def0`)
- Branded with Elite Golf Realm dragon logo (`e9ea1bb`)

### This Session (2026-03-17)
All work listed in "Completed" above was done this session — from initial `create-next-app` through full MVP, deployment, and UX iteration.

### Known Issues / Unverified
- **Saving scores may still fail** — switched from `.upsert()` to `.update()` (`eb15531`) but user reported saves still not persisting. Root cause may be RLS or the `hole_scores` rows not being pre-created correctly. **This is the #1 issue to investigate next session.** Check browser console for `"Save failed:"` errors.
- **No tests** — zero test files exist
- **README.md** is still generic Next.js boilerplate
- **Middleware uses deprecated `middleware` convention** — Next.js 16 warns to use `proxy` instead (non-blocking)
- **Coach empty state** still references "invite code" (`src/app/coach/page.tsx` ~line 209) — needs updating

## 3. Key Decisions

| Decision | Rationale |
|---|---|
| Supabase magic link + Google OAuth | Simplicity for student athletes; no password management |
| Single-coach model (no invite codes) | Simplified onboarding — only 1 coach uses the app |
| Admin role switcher for `wenjyu@gmail.com` | Coach/student dual-role testing from single account |
| Auto-save with immediate flush on input | Prevents data loss; no explicit "save" button needed |
| Par auto-fills as default score | Students only edit non-par holes — faster entry |
| `.update()` over `.upsert()` for hole scores | Upsert was causing issues; update works with existing rows |
| All stats auto-calculated from `hole_scores` | Zero manual math — matches paper scorecard stats exactly |
| Fairway input hidden on par 3 holes | Par 3s have no fairway — matches paper scorecard behavior |
| Up-and-down conditional on GIR miss | Only relevant when green is missed — reduces clutter |
| `@theme inline` in globals.css for Tailwind 4 | Custom palette: `golf-green`, `golf-blue`, `golf-orange`, `golf-red`, `golf-gray-*` |

## 4. Next Steps

**Priority 1 — Fix score saving (CRITICAL):**
1. Debug why `.update()` on `hole_scores` isn't persisting — check RLS policies, check if rows exist after round creation, check browser console for errors
2. Key files: `src/app/student/round/[id]/page.tsx` (handleFieldChange ~line 114), `src/app/student/new/page.tsx` (hole_score row creation)
3. May need to add `SUPABASE_SERVICE_ROLE_KEY` for debugging or temporarily disable RLS on `hole_scores` to isolate

**Priority 2 — UX improvements from audit (see table in session history):**
- Items #1 (confirm on leave), #5 (confirm on submit), #6 (progress bar touch targets) rated HIGH
- Items #4 (coach empty state mentions invite code) rated HIGH — quick fix

**Priority 3 — Remaining polish:**
- Add tests (especially `lib/calculations.ts` — verify against reference scorecard data)
- Update README.md
- Mobile viewport testing
- Skeleton loading states
- UX audit items rated M/L

## 5. Context Notes

- **Reference scorecard images** exist in project root (`IMG_3104*.JPG`, `IMG_3105*.JPG`) but are gitignored. These are Zoe Yu's handwritten scorecards from Coyote Creek, Norcal Jr Cup, 2/28/26.
- **Paper scorecard stats from reference**: Score 85 (par 72, +13), Fairways 6/14 (missed L:7, R:1), GIR 9 (missed L:1, R:1, Short:5, Long:2), Putts 39 (1-putts:3, 3-putts:4, chip-ins:0), Up&Down 3/9, Par3:+3, Par4:+8, Par5:+2, Penalties:0, 100 yards in: 52, Mentality: 3.
- **No CLAUDE.md in project** — global CLAUDE.md at `~/.claude/CLAUDE.md` governs workflow.
- **Deployed to Vercel** at `https://golf-scorecard-iota.vercel.app`. Auto-deploys on push to main.
- **Supabase project**: `flraumgjaubkauconyoq.supabase.co`. Three migrations applied (001 initial, 002 open course access, 003 fix profiles recursion). Credentials in `.env.local`.
- **Google OAuth** configured: Client ID `181456796395-8ler...apps.googleusercontent.com`, redirect URI `https://flraumgjaubkauconyoq.supabase.co/auth/v1/callback`.
- **Admin email**: `wenjyu@gmail.com` — bypasses role routing, sees RoleSwitcher button (`src/lib/admin.ts`).
- **User is frustrated with save reliability** — this is the top priority. The UX audit produced a 22-item table; items #3 (delete rounds) and #7 (inline save feedback) were implemented this session.
- **Git remote**: `origin` → `wensteryu/golf-scorecard` on GitHub. Active account is `wensteryu`.
