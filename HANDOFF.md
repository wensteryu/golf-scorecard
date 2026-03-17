# HANDOFF — Golf Scorecard Web App

## 1. Project Overview

**Purpose**: Digitizes a 2-page paper golf scorecard used by student athletes and their coach. Duolingo-inspired mobile-first UX. Small scale (1 coach, 1-5 students).

**Tech Stack**: Next.js 16 (App Router, TypeScript), Tailwind CSS 4, Supabase (Auth + Postgres + Realtime). No additional UI libraries.

**Architecture**:
- `src/app/` — 18 routes split by role (`/student/*`, `/coach/*`) + auth (`/login`, `/onboarding`, `/auth/callback`)
- `src/components/ui/` — Reusable: button, card, progress-bar, stepper, toggle-group
- `src/components/scorecard/` — Domain: hole-input (core UX), celebration-card
- `src/components/notifications/` — NotificationBell with Supabase Realtime
- `src/lib/` — types.ts, calculations.ts, supabase/{client,server,middleware}.ts
- `src/hooks/` — use-notifications.ts
- `src/middleware.ts` — Auth guard + role-based routing
- `supabase/migrations/001_initial_schema.sql` — 6 tables, RLS policies, triggers

**DB Tables**: `profiles`, `golf_courses`, `course_holes`, `scorecards`, `hole_scores`, `notifications`. All RLS-protected. Triggers auto-create notifications on scorecard status changes.

## 2. Current Status

### Completed This Session
- Full MVP implemented in one commit (`99b2057`): 39 files, 6500 LOC
- All 18 routes build cleanly (`npm run build` passes, `tsc --noEmit` passes)
- Database migration SQL ready but **not yet applied** (no Supabase project created)
- No `.env.local` exists — app needs Supabase credentials to run

### Not Yet Done
- **No Supabase project created** — migration not applied, no auth configured
- **No tests** — zero test files exist
- **No deployment** — no Vercel project, no remote git configured
- **README.md** is still generic Next.js boilerplate
- **No end-to-end verification** — app builds but hasn't been tested against a live Supabase instance

## 3. Key Decisions

| Decision | Rationale |
|---|---|
| Supabase magic link auth (no passwords) | Simplicity for student athletes; no password management |
| Coach invite code system (6-char alphanumeric) | Simple onboarding: coach shares code, student enters it to link |
| Auto-save with 300ms debounce on hole entry | Prevents data loss; no explicit "save" button needed |
| All stats auto-calculated from hole_scores | Zero manual math — matches paper scorecard stats exactly |
| Scorecard status workflow: `in_progress` → `submitted` → `reviewed` | DB trigger creates notifications on each transition |
| Fairway input hidden on par 3 holes | Par 3s have no fairway — matches paper scorecard behavior |
| Up-and-down conditional on GIR miss | Only relevant when green is missed — reduces clutter |
| `@theme inline` in globals.css for Tailwind 4 custom colors | `golf-green`, `golf-blue`, `golf-orange`, `golf-red`, `golf-gray-*` palette |

## 4. Next Steps

**Priority 1 — Get it running:**
1. Create Supabase project → copy URL + anon key to `.env.local`
2. Run `supabase/migrations/001_initial_schema.sql` in Supabase SQL Editor
3. Enable Realtime on `notifications` table (Supabase Dashboard → Database → Replication)
4. Configure Auth: add `{your-domain}/auth/callback` as redirect URL in Supabase Auth settings
5. `npm run dev` → test login flow end-to-end

**Priority 2 — Verify core flows:**
1. Create coach account → get invite code
2. Create student account → enter invite code → verify linking
3. Coach creates a course with 18 holes
4. Student creates round → complete all 18 holes → verify auto-save persists on reload
5. Compare auto-calculated stats against reference paper scorecards (images in project root: `IMG_3104.JPG`, `IMG_3105.JPG` — Zoe Yu's round at Coyote Creek, Norcal Jr Cup, 2/28/26)
6. Submit → verify coach notification → coach reviews → verify student notification

**Priority 3 — Deploy:**
1. Add git remote (GitHub repo)
2. Connect to Vercel, set env vars
3. `vercel --prod`

**Priority 4 — Polish:**
- Add tests (especially `lib/calculations.ts` — verify against reference scorecard data)
- Update README.md with project-specific content
- Mobile viewport testing (Chrome DevTools)
- Loading skeleton states

## 5. Context Notes

- **Reference scorecard images** exist in project root (`IMG_3104*.JPG`, `IMG_3105*.JPG`) but are gitignored. These are Zoe Yu's handwritten scorecards — use them to validate stat calculations.
- **Paper scorecard stats from reference**: Score 85 (par 72, +13), Fairways 6/14 (missed L:7, R:1), GIR 9 (missed L:1, R:1, Short:5, Long:2), Putts 39 (1-putts:3, 3-putts:4, chip-ins:0), Up&Down 3/9, Par3:+3, Par4:+8, Par5:+2, Penalties:0, 100 yards in: 52, Mentality: 3.
- **No CLAUDE.md in project** — global CLAUDE.md at `~/.claude/CLAUDE.md` governs workflow (plan mode, verification, commit-and-push, dual explanations).
- **Middleware uses deprecated `middleware` convention** — Next.js 16 warns to use `proxy` instead. Non-blocking but worth migrating later.
- **No git remote configured** — user needs to create a repo and add the remote before pushing.
