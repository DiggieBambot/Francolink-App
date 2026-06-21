# Email campaigns

## `learning-tips` drip (automated)

A 6-email sequence that teaches practical language-learning tips and escalates
toward a Premium subscription. Personalised per learner's `learning_language`.
Sent by a daily Vercel Cron — set-and-forget.

| Step | Day | Subject focus | CTA |
|------|-----|---------------|-----|
| 1 | 0  | The 15-minute-a-day rule | Do today's lesson |
| 2 | 3  | Learn the 1,000 most common words first | Placement test |
| 3 | 6  | Cheap immersion (phone language, passive listening) | Continue learning |
| 4 | 10 | Speak from day one → AI partner / Premium | See Premium |
| 5 | 14 | Spaced repetition / forgetting curve | Review today |
| 6 | 20 | The hard ask: go Premium | Go Premium |

### Pieces
- `src/lib/email/campaigns/learning-tips.ts` — the sequence (`STEPS`) + copy.
- `src/lib/email/shell.ts` — shared "Tutor Njinu" HTML shell.
- `src/lib/email/send.ts` — Resend wrapper with `List-Unsubscribe` headers.
- `src/app/api/cron/learning-tips/route.ts` — daily cron; sends ≤1 email/user/run.
- `src/app/api/email/unsubscribe/route.ts` — one-click opt-out (HMAC-signed).
- `supabase/migrations/20260620_email_campaigns.sql` — send ledger + opt-out col.
- `vercel.json` — `0 9 * * *` cron schedule.

### Who gets it
Active `USER` accounts, not opted out, **on the FREE plan** (paying users are
skipped). Test/demo accounts are filtered. Each run sends only the earliest
*due, unsent* step, so nobody gets two tips in one day.

## Setup (one time)

1. **Apply the migration.** Paste `supabase/migrations/20260620_email_campaigns.sql`
   into the Supabase SQL Editor and Run (see `supabase/APPLY_DB.md`).
2. **Set `CRON_SECRET`** in Vercel (Project → Settings → Environment Variables).
   Vercel Cron sends it automatically as `Authorization: Bearer …`. Required for
   the live run; the Supabase service-role key is also accepted (for manual hits).
3. Deploy. The cron registers from `vercel.json`.

> `RESEND_API_KEY` is already configured. Sends use `njinu@francolink.net`.
> Sending happens **on Vercel**, where outbound fetch works — unlike local dev,
> where Node's fetch hangs (that's why `send-reengagement.mjs` shells out to curl).

## Operating it

Preview a step in the browser (no auth, no send):

    /api/cron/learning-tips?preview=4&lang=fr

Dry run — see who would get what, send nothing (needs auth header):

    curl -H "Authorization: Bearer $CRON_SECRET" \
      "https://app.francolink.net/api/cron/learning-tips?dry=1"

Send one real test email of a given step:

    curl -H "Authorization: Bearer $CRON_SECRET" \
      "https://app.francolink.net/api/cron/learning-tips?test=you@x.io&step=4&lang=fr"

`?limit=N` caps sends per run.

## Adding a tip
Append a `CampaignStep` to `STEPS` in `learning-tips.ts` with the next `step`
number and a `dayOffset`. No other change needed — the cron picks it up and the
ledger prevents re-sends.
