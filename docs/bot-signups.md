# Bot signups — what's happening and how we stop it

## What the data shows (checked 2026-08-20)

Of 320 accounts, a large share are scripted. The signature is consistent:

- **Name**: two tokens of random consonants — `Dgqglt Dcbqongf`, `Xgdwtv Dlsyjnlnl`.
- **Email**: a *real, harvested* address — dotted Gmail aliases
  (`j.e.ff.r.e.y..p..sc.h.w.a.rt.z@gmail.com`), plus corporate addresses scraped
  from company sites (several `@korper.nl` staff in a row).
- **Volume**: ~1–3/day through early August, then 7 on Aug 16, 21 on Aug 17,
  and 9–17/day since. It is ramping.
- **Route**: overwhelmingly email/password, not Google OAuth.

Two things make this worse than cosmetic database noise:

1. **Email confirmation is off.** All 320 accounts show `email_confirmed_at`
   set and 318 have signed in. Every bot gets a real, usable session
   immediately — not a dormant unconfirmed row.
2. **The signup call goes browser → Supabase directly.** The forms call
   `supabase.auth.signUp()` with the public anon key. A bot never has to load
   our site; it can POST straight to `/auth/v1/signup`. That is why WAF rules,
   Vercel BotID, or Next.js middleware would not have caught any of this — none
   of that traffic passes through our app.

Because the addresses are other people's real addresses, the moment email
confirmation is switched on without a captcha in front of it, Supabase starts
mailing confirmation links to strangers. That is how a sending domain gets
blacklisted. **Do the captcha first, then confirmation.**

## The fix, in order

### 1. Turnstile on Supabase Auth (the one that matters)

The code side is done — `src/components/auth/turnstile.tsx` renders the widget
and every auth entry point now sends `captchaToken`:

- `src/components/auth/student-signup-form.tsx`
- `src/app/(auth)/signup/tutor/tutor-signup-form.tsx`
- `src/app/(auth)/join/[code]/student-join-form.tsx`
- `src/components/auth/login-form.tsx`
- `src/app/admin/login/page.tsx`
- `src/app/(auth)/forgot-password/page.tsx`

Sign-in and password-reset are wired too, because Supabase applies its captcha
check to those endpoints as well — miss them and logins start failing.

Dashboard steps (these can only be done by hand):

1. Cloudflare → Turnstile → **Add site**. Domain `app.francolink.net`,
   widget mode **Managed**. Copy the site key and secret key.
2. Supabase → Authentication → Settings → **Bot and Abuse Protection** →
   enable **Captcha protection**, provider **Turnstile**, paste the *secret* key.
3. Vercel → Project → Settings → Environment Variables →
   `NEXT_PUBLIC_TURNSTILE_SITE_KEY` = the *site* key, all environments. Redeploy.

Order matters: deploy the app **before** flipping the Supabase toggle, or live
logins break for the gap between the two.

With the env var unset the hook renders nothing and sends no token, so local dev
keeps working untouched.

### 2. Turn email confirmation on

Supabase → Authentication → Settings → **Confirm email**. Safe to do *after*
the captcha is live. This stops a scripted account from ever holding a session.

### 3. Tighten the Auth rate limits

Supabase → Authentication → Rate Limits. The defaults are generous. Cap signups
and emails per hour per IP to something a human would never hit.

### 4. Purge what already got in

```bash
node scripts/purge-bot-signups.mjs
```

Dry-run by default; prints each match. Re-run with `--apply` to delete. The
match rule is deliberately narrow (**both** name tokens must be consonant
gibberish, email/password provider only) and any account with real activity —
a booking, a tutor link, homework, an authored lesson — is spared regardless.
It currently proposes 29 deletions and spares 1 real user. Accounts with a
single odd-looking name token are left alone on purpose; review those by hand
in the admin panel rather than widening the rule.
