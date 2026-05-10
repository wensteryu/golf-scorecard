# HANDOFF — Golf Scorecard Web App (Elite Golf Realm)

## 1. Project Overview

**Purpose**: Digitizes a 2-page paper golf scorecard used by student athletes and their coach. Duolingo-inspired mobile-first UX. Small scale (1 coach, 1-5 students). Branded as "Elite Golf Realm" with dragon logo.

**Tech Stack**: Next.js 16 (App Router, TypeScript), Tailwind CSS 4, Supabase (Auth + Postgres + Realtime). No additional UI libraries.

**Architecture**:
- `src/app/` — Routes split by role (`/student/*`, `/coach/*`) + auth (`/login`, `/onboarding`, `/auth/callback`)
- `src/app/coach/layout.tsx` & `src/app/student/layout.tsx` — Role layouts that render RoleSwitcher for admin users on ALL sub-pages
- `src/components/ui/` — Reusable: button, card, progress-bar, stepper, toggle-group, role-switcher
- `src/components/scorecard/` — Domain: hole-input, celebration-card, birdie-celebration
- `src/lib/` — types.ts, calculations.ts, admin.ts, supabase/{client,server,middleware}.ts, emails/parent-scorecard.ts (shared email renderer)
- `supabase/migrations/` — 7 migrations (001 initial → 007 parent contact fields)

**DB Tables**: `profiles` (with `parent_email`, `parent_first_name`), `golf_courses`, `course_holes`, `scorecards`, `hole_scores`, `notifications`. All RLS-protected.

**Repo**: `origin` → `https://github.com/wensteryu/golf-scorecard.git` (main branch)

## 2. Current Status

### This Session (2026-05-10) — Local commit, NOT yet pushed

**Show 1st-putt distance on every hole in coach review** (commit `dc2260d`, local only)
- **Why:** Stan asked for first-putt-to-pin distance to be visible per hole on the coach review page. The data was already captured (`hole_scores.first_putt_distance`, populated by the existing "1st Putt Distance (ft)" input in the student form when putts > 0), but on the coach side it only surfaced in two aggregate lists ("1st Putts Made" and "3-Putt 1st Putt Distance") above the hole-by-hole section. Two-putt holes — the bulk of any round — had the data hidden.
- **What changed:** `src/app/coach/review/[id]/page.tsx` only. Two new conditional chips:
  1. Collapsed hole row: small `22ft` chip after the `2P` putts count.
  2. Expanded hole detail: `1st Putt Dist: 22 ft` chip alongside Club / Approach / 1st Putt result / FW Miss.
- **Both gated on `hole.first_putt_distance != null`** so holes without putts (or older rounds without the value) render unchanged.
- **No DB migration, no type change, no student-side change, no parent-email change.** `npm run build` passes.

### PUSH BLOCKED — credential mismatch

`git push origin main` failed with `403: Permission to wensteryu/golf-scorecard.git denied to wensteryupw`. The macOS keychain / current GitHub credential on this machine is for user `wensteryupw`, which does not have write access to the `wensteryu/golf-scorecard` repo. Local commit `dc2260d` is one ahead of `origin/main`.

**To unblock next session:**
1. From terminal: `gh auth login` as `wensteryu`, or update the keychain entry for `github.com` to use a PAT for that account, then `git push origin main`.
2. Or push from a session where credentials match `wensteryu`.

### Verification once pushed and deployed

Open any past round in `/coach/review/[id]` as Stan. Every hole that had a putt should show the first-putt distance:
- Collapsed row: `… 2P  22ft  ›`
- Expanded: `… 1st Putt: Made  1st Putt Dist: 22 ft …`
Holes with no putt logged should render unchanged.

### Outstanding from prior sessions

**Parent email notifications** (shipped 2026-04-23, NOT yet end-to-end verified in production):
1. As Zoe in `/student/settings`, set parent first name + parent email to a test address.
2. Submit a test round → parent inbox should receive email with full scorecard inline.
3. Mark reviewed as Stan → parent inbox should receive email with scorecard + overall feedback + per-hole notes.
4. Negative case: clear parent email, submit another round, confirm only coach email sends (no error).

**Vercel Deployment Protection blocks new-user signup** (separate, unresolved): Vercel's edge auth intercepts `/login` for new users (no session cookie yet) and redirects to `vercel.com/login`. Existing users (Zoe, Jaden, Stan) are unaffected. Parent emails are now self-contained (no app links) so this no longer blocks parent flow, but it still blocks new student/coach onboarding via shared link.

**Fix (30 sec, reversible):** Vercel dashboard → project → Settings → Deployment Protection → Vercel Authentication section → toggle the "Enabled for" switch fully OFF → Save. Do NOT change the dropdown mode or upgrade to Pro — Standard Protection only exempts production Custom Domains, and we don't have one, so the toggle must be fully off. Safe because Supabase middleware + RLS already gate `/student/*` and `/coach/*`.

### Previous Sessions — All committed & pushed

- **2026-04-23**: Parent email notifications — Phase 1 plumbing (settings page, two API routes, schema migration 007) + Phase 2 embed full scorecard inline (shared `parent-scorecard.ts` renderer, both submit + review templates).
- **2026-04-03**: Captured Zoe's Arccos stats; created `/coach/arccos/zoe` static dashboard.
- **2026-04-01**: Added hybrid/2i/7w club options, fixed RoleSwitcher on sub-pages, added Stan's bizacard email to admin list, fixed 1st Putts Made list, added 3-Putt 1st Putt Distance summary.
- **2026-03-31**: Birdie/Eagle/Hole-in-One celebrations with dragon images.
- **2026-03-30**: Added 3-Putts tile, Scoring by Par, 100 Yards In to coach review page.
- **2026-03-22**: Replaced Twilio with Nodemailer Gmail. Added email notifications.
- **2026-03-19**: Split GIR into Yes/No + Pin Position. Fixed batched debounced save bug.

## 3. Key Decisions

| Decision | Rationale |
|---|---|
| Surface first-putt distance per hole, not just on aggregate lists | Stan's review value is in seeing lag-putt quality on every hole, especially two-putt holes (the majority of any round) where the data was previously hidden. |
| Show on BOTH collapsed row and expanded detail | Stan picked this over expanded-only after seeing the side-by-side mockup. Glanceable from the list, with full label inside the expanded card. |
| No new DB column / migration | The `first_putt_distance` column has existed since migration 001. This was a display-only gap. |
| Don't add to parent email | Parent email is intentionally focused (score, key stats, reflections, overall coach feedback). Per-hole granular metrics belong in the coach view. |
| One parent per student (single columns on `profiles`) | Simpler than a join table; matches current reality. Cheap to migrate later if needed. |
| Parent emails are self-contained (no app links) | Parents have no Supabase/Vercel account. Embedding full content sidesteps auth and is more private. |
| Shared email renderer module (`src/lib/emails/parent-scorecard.ts`) | Two routes share ~90% of the layout. Single source of truth. |
| Inline-styled table-based email layout | Maximum compatibility across Gmail / Outlook / Apple Mail. |

## 4. Next Steps

1. **Push `dc2260d` to origin** once credentials are fixed (see "PUSH BLOCKED" above).
2. **Verify the per-hole first-putt distance** on a real round in production after deploy.
3. **Verify parent email notifications end-to-end** (steps in "Outstanding from prior sessions").
4. **Disable Vercel Deployment Protection** to unblock new-user onboarding (30 sec, reversible).
