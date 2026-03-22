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

### This Session (2026-03-22) — UNCOMMITTED CHANGES

**Replaced Twilio SMS with Nodemailer + Gmail email notification**

Changed files (all uncommitted):
- `src/app/api/notify-coach/route.ts` — rewrote: Twilio SDK → Nodemailer with Gmail SMTP. Sends HTML email with round details, score table, and green "Review Round" button. Env vars: `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `COACH_EMAIL`.
- `package.json` — removed `twilio`, added `nodemailer` + `@types/nodemailer`
- `package-lock.json` — updated accordingly
- `.env.local.example` — replaced Twilio placeholders with Gmail placeholders
- `src/app/student/round/[id]/summary/page.tsx` line 166 — comment: "SMS" → "email"
- `.env.local` — has real credentials: `GMAIL_USER=wenjyu@gmail.com`, `GMAIL_APP_PASSWORD=<real>`, `COACH_EMAIL=wenjyu@gmail.com` (temp for testing)

**Why the switch**: Twilio toll-free number `+18555933546` failed with error 30032 (toll-free verification required). Gmail email is simpler — no extra service, no verification wait.

**Verified working**:
- TypeScript: zero errors (`npx tsc --noEmit`)
- `grep -ri twilio src/` → zero matches
- Dev server test: `curl POST /api/notify-coach` → `{"success":true}` → **email received** in `wenjyu@gmail.com` inbox with correct subject, HTML body, and review link
- API contract unchanged — caller in `summary/page.tsx` needs no changes

### Previous Sessions — All committed & pushed

**Session 2026-03-21**: Replaced Resend email with Twilio SMS (commit `227b5e3`). Now reverted this session.

**Session 2026-03-19**: Split GIR into Yes/No + Pin Position (commit `7d596f6`). Fixed batched debounced save bug (commit `dc4f9a5`).

## 3. Key Decisions

| Decision | Rationale |
|---|---|
| Gmail + Nodemailer over Twilio SMS | Toll-free verification blocker (error 30032); Gmail simpler for small scale |
| Gmail + Nodemailer over Resend | No extra service signup; user already has Gmail |
| HTML email with styled button | Better UX than plain text; coach can click "Review Round" directly |
| Same API contract preserved | Caller (`summary/page.tsx`) unchanged; fire-and-forget pattern works for both SMS and email |
| Transporter created per-request | Low volume (1-5 rounds/day); no need for connection pooling |

## 4. Next Steps

1. **Get coach's email address from user** — Update `COACH_EMAIL` in `.env.local` (currently set to `wenjyu@gmail.com` for testing).
2. **Commit and push** — All changes verified working. Commit the 5 changed files (not `.env.local`).
3. **Add Vercel env vars** — Add `GMAIL_USER`, `GMAIL_APP_PASSWORD`, `COACH_EMAIL` to Vercel Project Settings → Environment Variables. Remove old Twilio vars (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `COACH_PHONE_NUMBER`).
4. **Production E2E test** — Submit a round on `https://golf-scorecard-iota.vercel.app`, verify coach receives email with working review link (should point to Vercel URL, not localhost).
5. **Jaden's data correction** — Fairway "hit" values from before the debounce fix (pre-`dc4f9a5`) are likely missing in DB.
6. **Optional: cancel Twilio** — Twilio account and toll-free number are no longer needed.

## 5. Context Notes

- **Deployed to Vercel**: `https://golf-scorecard-iota.vercel.app`
- **Supabase project**: `flraumgjaubkauconyoq.supabase.co`. Credentials in `.env.local` (anon key only).
- **Supabase CLI not linked** — migrations must be run manually via SQL Editor.
- **Admin email**: `wenjyu@gmail.com` — sees RoleSwitcher for dual-role testing. Also the `GMAIL_USER` for sending notifications.
- **Gmail App Password**: real value is in `.env.local`. Generated for "Elite Golf Realm" app.
- **Review URL logic** (`notify-coach/route.ts` lines 22-27): uses `NEXT_PUBLIC_VERCEL_URL` in production, falls back to `localhost:3000` in dev. Test email showed localhost link — this is expected and correct.
- **Save mechanism** (`round/[id]/page.tsx` lines 78-161): uses `pendingChanges` ref (object accumulator). Critical for any future save-related changes.
