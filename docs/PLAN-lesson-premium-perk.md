# Plan — Premium included with marketplace lessons

Status: agreed in principle, not built.
Last updated: 2026-08-20.

A student who takes a paid marketplace lesson gets the self-learning product
(Premium) free for 30 days. The lesson is the purchase; the app is what keeps
them between lessons.

## The decisions already made

| Question | Decision |
|---|---|
| Which plan | **Premium** — not Premium Plus |
| What earns it | A **completed, non-trial** booking |
| How long | **30 days** from that lesson's end, rolling |
| Trials | **No** — the discounted first lesson does not earn it |

Premium keeps the AI Tutor quota. Premium Plus stays purchasable, so there is
still something to upsell — and its unlimited AI Tutor stays behind a paywall,
which is where the real marginal cost lives.

Because trials do not qualify, a student's **first full lesson** is the gateway.
That is the pitch: *book a full lesson, get the whole app free for a month.*

## Why now

There are **zero paying Premium subscribers** — Stripe shows no subscriptions,
ever. So this gives away nothing that currently earns, and the cannibalisation
risk will never be lower. Doing it later means taking something away from
paying customers, which is materially harder.

For reference, margin per lesson against Premium at $7.99/mo:

| Tier | 25 min | 50 min |
|---|---|---|
| Community | $4.99 | $9.00 |
| Certified | $5.49 | $9.00 |
| Professional | $5.99 | $9.00 |

One 25-minute lesson a month earns less than Premium is priced at; two clear it
comfortably. But that framing only matters once Premium sells on its own. Today
the question is whether it increases bookings, not whether it displaces
subscription revenue.

## The principle: derive, do not store

**Do not write the granted plan into `users.subscription_plan`.** That column
means "what this person pays Stripe for" and must keep meaning that.

Compute an **effective plan** instead: `max(paid plan, lesson perk)`, where the
perk is derived from booking history at read time.

Three concrete reasons, not just tidiness:

1. **Commissions.** `src/app/api/commissions/route.ts` counts a referred user as
   paying via `.neq('subscription_plan', 'FREE')`. Writing a perk into that
   column would pay tutors referral commission on students who pay nothing.
2. **It closes an abuse hole for free.** Cancellation is free 12+ hours out with
   a refund. A stored grant means book → receive Premium → cancel → refund →
   keep the perk. A derived one never counts a cancelled booking. No revocation
   logic, no cleanup job.
3. **Provenance.** You can always answer "is this person a customer or a perk
   holder?" — which you cannot once the column is overwritten.

It also self-expires, and it reads the `completed` status the
`complete-bookings` sweeper already maintains.

## The module

New: `src/lib/entitlements.ts`

```ts
export type Plan = 'FREE' | 'PREMIUM' | 'PREMIUM_PLUS';

export interface Entitlement {
  plan: Plan;                              // effective
  paidPlan: Plan;                          // what they pay for
  source: 'paid' | 'lesson_perk' | 'none';
  perkUntil: Date | null;                  // for UI copy
}

export async function getEntitlement(supabase, userId): Promise<Entitlement>
```

The perk query:

```sql
select ends_at
  from bookings
 where student_id = $1
   and status     = 'completed'
   and is_trial   = false
   and coalesce(refund_status, 'none') <> 'full'
   and ends_at > now() - interval '30 days'
 order by ends_at desc
 limit 1;
```

`perkUntil = ends_at + 30 days`. Rank `FREE < PREMIUM < PREMIUM_PLUS` and take
the higher of paid and perk.

Note the `refund_status` guard: a lesson can be `completed` and later refunded,
and a refunded lesson must not keep granting access.

## Where it plugs in

The gates that should use the **effective** plan:

| File | What it drives |
|---|---|
| `src/lib/ai/tutor-access.ts:103` | AI Tutor access + quota. **The single chokepoint** — both the chat and usage routes go through it |
| `src/app/(student)/layout.tsx:192,201` | `MobileBottomNav`, `AITutorFab` |
| `src/app/(student)/dashboard/page.tsx:218` | `SubscribePrompt` |
| `src/app/(student)/student/ai-tutor/page.tsx` | Gate + upsell copy |
| `src/app/(student)/upgrade-plus/page.tsx:71` | Which upgrade to offer |

The reads that must **keep** using the raw `subscription_plan`, because they are
about revenue rather than access:

| File | Why |
|---|---|
| `src/app/api/commissions/route.ts:53` | Commission is owed on subscription revenue |
| `src/app/(tutor)/tutor/students/page.tsx:117` | "Paying students" is a revenue metric |
| `src/app/(tutor)/tutor/page.tsx:37` | Same |
| `src/app/(admin)/admin/payments`, `admin/page.tsx` | Revenue reporting |

Getting this split wrong in either direction is the main risk in the whole
feature, so it is worth a comment at each site.

## Prerequisite: settle the entitlement column first

Do not layer a third source of truth onto two that already disagree.

- `subscription_tier` → 1 PREMIUM
- `subscription_plan` → 2 PREMIUM
- Stripe → **0 subscriptions**

The app gates almost entirely on `subscription_plan`, so make that canonical,
reconcile the handful of rows, and reduce `subscription_tier` to a derived or
dropped column. This is small now and painful later.

## Rollout

**Phase 0 — prerequisite.** Reconcile `subscription_plan` / `subscription_tier`;
pick one. Confirm those Premium grants are intentional (neither corresponds to
a Stripe subscription).

**Phase 1 — the module.** `getEntitlement` + tests, no callers yet. Test:
completed non-trial grants; trial does not; cancelled does not; refunded does
not; expired (>30d) does not; paid Premium Plus outranks the perk; perk outranks
FREE. Follows the existing `scripts/test-*.mts` pattern.

**Phase 2 — wire the gates.** Start with `tutor-access.ts`, which covers the AI
Tutor everywhere in one edit. Then the four UI sites.

**Phase 3 — make it legible to the student.** This is not optional polish: a
student who sees "Premium" and later loses it without warning will read it as a
bug or a bait-and-switch.
- Badge reads *"Premium — included with your lessons"*, with the date.
- `SubscribePrompt` must not nag a perk holder to buy what they already have;
  invite them to Premium Plus, or to book again to extend.
- A clear lapse path: "your Premium ran out because your last lesson was over
  30 days ago — book a lesson, or subscribe."

**Phase 4 — sell it.** Say it on the tutor listing and checkout: the app is
included. This is the point of the exercise.

## Open questions

- **No-shows.** A student no-show becomes `no_show_student`, not `completed`, so
  it would not grant the perk — even though the student paid and the tutor was
  paid. Arguably it should grant. Decide before launch.
- **Performance.** One extra query per gate check. Fine at current volume. If it
  bites, cache into a `lesson_perk_until` column maintained by the
  `complete-bookings` sweeper — the read path stays identical.
- ~~**RLS.**~~ Resolved: the `participants read bookings` policy is
  `auth.uid() = student_id or auth.uid() = tutor_id`, so a student can read
  their own bookings and `getTutorAccess` works with its user-scoped client.
- **Does 30 days want to be configurable?** An `app_settings` row under
  `features` would allow tuning without a deploy. Probably yes, eventually.

## Inconsistencies found while planning — fixed

All resolved in `5efdad5`, against Stripe as the authority ($7.99/$59.99 and
$14.99/$119.99, matching what the pricing page already showed):

- Premium's price disagreed across four sources; `app_settings` yearly prices
  and the `pricing_plans` blob were corrected, as was the admin seed.
- Feature copy described a better product than the code delivers: "AI Tutor
  (5/day)" against a 300-message monthly pool, Free "5 lessons per day" against
  a limit of 1, and — worst — Premium advertised as "Unlimited" AI conversations.
  Nothing rendered those i18n rows, which is the only reason the last one was
  not already a support problem.
- `subscription_tier` and `subscription_plan` now agree on every row (one admin
  row differed; admins are privileged regardless, so no access changed).

Still true and worth knowing: the usage column is named `ai_minutes_used_today`
but counts **messages per month**.
