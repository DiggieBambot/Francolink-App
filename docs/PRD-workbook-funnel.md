# PRD · *Le Français Pas à Pas* — $27 front-end funnel

**Version 2 (final).** Supersedes v1 of 2026-08-30.
Author: Diggie · Date: 2026-08-30 · Status: **decided, ready to build**

Companion documents:
- `content/workbook/AUDIT-parts-4-5.md` — CEFR audit of the B1/B2 half
- `content/workbook/AUDIT-parts-0-3-and-key.md` — answer key + Parts 0–3 audit
- `content/workbook/PART-6-B1-B2-expansion.md` — the 10,700-word expansion

---

## 1. Why this exists

FrancoLink has a supply of tutors, a credits system, a starter pack and a
subscription — and no cheap, self-serve way for a stranger to become a
customer. The current front door is a 40%-off first month, which asks a cold
visitor for a recurring commitment on the first click. That is a hard sale to
buy traffic against.

This project adds a **$27 digital product** as the cheapest possible first
transaction, and treats it as customer acquisition rather than as a revenue
line.

**The one sentence that governs every decision below:** the book is not the
product, the starter pack is. The book's job is to convert a stranger into a
FrancoLink account holder who has already paid us once.

### Success is measured as

| Metric | Target (first 100 buyers) | Why |
|---|---|---|
| Order-bump take rate | ≥ 30% | This is what makes paid traffic viable |
| Book → FrancoLink account | ≥ 90% | Below this the funnel has no upsell path and the project has failed regardless of book revenue |
| **Workbook opened ≥ 3 separate days** | **≥ 40%** | New in v2. The lead indicator for the metric below — see §6 |
| Book → starter pack (30d) | ≥ 8% | The actual return |
| Refund rate | ≤ 5% | Above this, the product is under-delivering |
| AOV | ≥ $37 | Threshold for buying cold traffic |

Book revenue is explicitly **not** a success metric. Break-even on ad spend is
the pass mark.

---

## 2. Audience and positioning

**Decided:** North American adult beginners and false beginners. Not the
African market — that is a separate page, a separate price, and a later
project. The manuscript's Douala examples need a pass for this.

Buyer: 25–55, has tried Duolingo and stalled, cannot explain when to use
*passé composé* vs *imparfait*, suspects an app alone will never get them
speaking. Willing to pay for explanation, not for gamification.

Positioning must name the pain, not the CEFR band. Working headline direction:

> The 45 French grammar rules that actually matter — explained, drilled, and
> answered.

---

## 3. Scope

### In scope
- Production-ready PDF (cover, layout, page numbers, per-buyer footer)
- **Interactive web workbook** — same content, self-grading exercises (§6)
- Audio pack as a paid order bump
- Sales page on the marketing host
- Checkout with order bump, and a post-purchase upsell / two downsells
- Delivery gated behind a FrancoLink account
- 5-email post-purchase sequence
- 14-day money-back guarantee, surfaced at all three touchpoints
- Analytics for the six metrics in §1

### Out of scope — say no to these now
- **A standalone app or a second login.** The interactive workbook lives inside
  FrancoLink. See §6 for why this is the load-bearing decision.
- Charging separately for the interactive version. It is included at $27.
- Video lessons · print fulfilment · affiliate program · regional editions

---

## 4. The ladder

| Step | Offer | Price | Notes |
|---|---|---|---|
| Front end | Workbook: PDF **+ interactive web version** | **$27** | New SKU |
| Order bump | Audio pack | **+$17** | New SKU. Near-zero marginal cost. **This is what pays for the ads.** |
| Upsell (immediate) | `starter_professional` — 3 lessons | **$54** | Already priced in `starter_packs` |
| Downsell 1 | `starter_community` — 3 lessons | **$24** | Already priced |
| Downsell 2 | Self-study / intro month | existing | Already built |
| The business | Subscription | existing | Everything above feeds this |

**Lessons are the upsell, self-study is the downsell — not the reverse.**
Someone who just bought a grammar book has self-selected as a self-studier;
selling them more self-study is selling them what they already have. Make the
harder, more valuable ask while the card is warm, and catch the decline.

The starter pack is capped at one per person ever (partial unique index in
`20260902_starter_pack.sql`). The upsell page must branch on
`hasUsedStarterPack` / `hasActivePlan` (`src/lib/credits/plans.ts`) so nobody is
sold something they already own.

**Only one order bump.** A second bump measurably suppresses the take rate of
both, and the audio slot is worth more than anything else that could sit there.

---

## 5. The manuscript

14,823 words as delivered, plus a **10,745-word expansion** that closes the
B1–B2 gap. Combined: ~25,500 words, ~95 pages. Three audits are complete and
every fix has replacement text already written.

### Blocking fixes before sale
1. **Cover.** Front cover, title page, copyright page. Currently none.
2. **Page numbers + working TOC.** The TOC is an unbuilt Word field.
3. **Remove production artifacts** — the "upload to Google Drive" instruction,
   and any language referring to class notes.
4. **Per-buyer footer** on every page: name + order ID.
5. **Merge the B1–B2 expansion.** Fourteen sections, exercises 31–45, answer
   key, fourteen dialogues with *Grammaire repérée* tables. Most urgent within
   it: **§4.6**, which supplies the plus-que-parfait that §5.2 currently uses
   without ever defining, and **§4.7**, which repairs the over-absolute
   avoir-agreement rule in §4.3.
6. **Four answer-key fixes** (`AUDIT-parts-0-3-and-key.md` §A). The key is
   otherwise clean — 26 of 30 exercises correct in full, including every
   conjugation table. This was the largest unknown in Phase 1 and it is closed.
7. **Four Part 1 prose defects** (§B) — most importantly the self-contradicting
   sentence opening §1.10 on grammatical gender, and the inside-out CaReFuL
   mnemonic in §1.4. Part 1 is the free sample; these are the first thing a
   prospect reads.
8. **Localise examples** for the North American buyer.

Exercises 31–45 in the expansion had the same audit pass: five defects found,
all already fixed in place (§C).

---

## 6. The interactive workbook — v2's central decision

### What it is
The same content as the PDF, rendered as a web page at
`app.francolink.net/workbook`, where **the exercises grade
themselves**. Type an answer, get instant right/wrong, see the correct form and
the section reference on a miss. Progress persists per section.

### Why this is nearly free
Decision §9.1 already makes **HTML the source of truth** — the PDF is rendered
*from* it. The interactive version is therefore not a second build; it is the
source document with an answer layer and about 200 lines of check-and-score
logic on top. Estimated 2–3 days beyond the HTML conversion that was already
required.

### Why it ships free, inside FrancoLink, and not as an upsell
Three separate arguments, all pointing the same way.

**A PDF is opened once.** That is the quiet killer in this funnel. Every day a
buyer does not open the book, the starter-pack offer decays. The metric the
whole project is judged on — book → starter pack ≥ 8% — is downstream of
whether they keep coming back. A self-grading workbook with saved progress
brings people back to a page **we control and can put a tutor CTA on**. An inert
PDF sitting in a Downloads folder cannot.

**Paywalling it suppresses the metric we are optimising.** Charging separately
means some buyers stay on the inert version and never return to the site. That
is precisely backwards. The interactive workbook is not a thing to sell — **it
is the mechanism by which the upsell gets seen.**

**The bump slot is taken.** Audio is higher margin, fixes a bigger weakness
(§7), and a second bump would cut both take rates.

Net effect on price: "PDF + audio + interactive online workbook" at $27 is a
materially stronger offer than a PDF at $27, and supports testing **$37** once
the baseline conversion rate is known.

### Why NOT standalone
A standalone interactive product means a second login, a second support
surface, a second thing to maintain, and — fatally — a buyer who never touches
FrancoLink. The entire value of this project is that the buyer lands *inside*
the app with an account. Standalone throws that away to save nothing, since the
content is shared either way.

**Ship both formats.** The PDF still ships, because people who buy a "workbook"
expect a file they own, and adults genuinely do print grammar drills to write on
by hand. Removing it invites refunds. Both come from the same HTML source, so
the cost of shipping two formats is close to zero.

### Design requirements
- **Accent tolerance.** Accept unaccented input, mark it correct, and show the
  properly accented form with a gentle "watch the accent" note. Your entire
  market is on US keyboards; punishing them for it is a support-ticket machine.
- **Multiple accepted answers** per blank, as the key already allows
  (*cependant / pourtant*, *vu / vues*).
- **Free-writing exercises route to a tutor.** A handful of items (Ex 7.1 and
  the model-answer tasks) cannot be machine-graded. Do not hide them — show the
  model answer, then: *"Want a person to check yours? Book a lesson."* **The
  exercises a machine cannot grade are exactly where a tutor is demonstrably
  worth paying for.** This is the most natural upsell placement in the product,
  and it is content-native rather than an ad.
- **Audio plays inline** at each audio-backed section (§7).
- Progress in the database, not `localStorage` — it is a signal we want, and
  §1's new engagement metric depends on it.
- Mobile-first. Fill-in-the-blank on a phone is the common case.

---

## 7. The audio pack

Highest-margin item in the funnel and the fix for the book's biggest weakness.
Sections 1.1–1.6 teach *sound* — nasal vowels, liaison, the French `u`, the
guttural `r` — entirely in text with « boñ-JOOR » respellings. That is the
number one refund trigger.

**Contents:** all dialogues (the fourteen new ones included), read at natural
speed and again slowly · the pronunciation drills from 1.1–1.6 · the 20
essential phrases from 0.1 · the conjugation tables read aloud.

**Requirements:** MP3, one file per section, numbered to the book's sections ·
playable inline in the interactive workbook, not download-only · a "hear it"
marker at every audio-backed section in the PDF · **every clip listened to
before it ships.**

---

## 8. Funnel and technical requirements

Host split: marketing pages live on `francolink.net` under `src/app/site/**`;
the app is `app.francolink.net`. Import from `src/lib/site/hosts.ts` — nothing
hardcodes hostnames.

### 8.1 Sales page — `francolink.net/francais-pas-a-pas`
New route under `src/app/site/`, using the existing site layout. Long-form:
promise, who it's for, what's inside (real spreads, and a **live demo of two or
three interactive exercises right on the sales page** — it demonstrates the
product better than any screenshot), the audio, author credibility, guarantee,
FAQ, price. Indexable, with OG image and Product schema.

Exit-intent discounting is deferred — do not complicate the price story before
the baseline conversion rate is known.

### 8.2 Checkout
- Stripe Checkout, `mode: 'payment'`, audio pack as an `optional_item` bump
- New route `src/app/api/checkout/workbook/route.ts`, modelled on
  `checkout/starter-pack/route.ts`. Same rule as everywhere in this codebase:
  **the client names a SKU, the server prices it.**
- New table `digital_products` (product_key, name, price_cents,
  stripe_price_id, active) plus `digital_product_purchases` with a price
  snapshot, mirroring how `starter_packs` is modelled
- **Guest checkout is allowed.** Requiring an account before payment costs more
  conversions than it saves. The account is created at delivery.

### 8.3 Webhook
`src/app/api/webhooks/stripe/route.ts` gains a `kind: 'workbook'` branch on
`checkout.session.completed`, alongside `lesson_booking`. Idempotent, and must
also handle `async_payment_succeeded` as the lesson path already does. On
success: record the purchase, mint a delivery token, send the delivery email.

### 8.4 Delivery — the critical step
The highest-risk requirement in this document. If the buyer ends up with a PDF
in their inbox and no FrancoLink account, **there is no funnel.**

- Delivery email links to `app.francolink.net/unlock?t=<token>`, never a raw file
  (`/library` was already taken by the existing content library, so the
  workbook lives at `/workbook` and the claim screen at `/unlock`)
- That page requires sign-in. If the email matches no account, it creates one
  with the Stripe email pre-filled — one field, framed as "create your password
  to unlock your workbook", never as "register"
- **Treat "already signed in with an existing account" as the common case, not
  the exception** — the launch list is existing non-paying FrancoLink users
- The workbook page hosts the interactive workbook, the PDF download, the audio,
  and the upsell
- Download links signed and expiring; the PDF is never a public URL
- Reuses the existing `src/lib/email/link-token.ts` pattern

### 8.5 Upsell / downsell
Immediately post-purchase, before the library page: `starter_professional` at
$54 → decline → `starter_community` at $24 → decline → intro-month self-study →
decline → library page with the offer repeated inline, plus the per-exercise
tutor CTAs described in §6. Reuse `/api/checkout/starter-pack` unchanged; the
account now exists, so its auth guard is satisfied.

### 8.6 Email sequence
Resend is wired (`src/lib/email/`), with a campaigns pattern in
`src/lib/email/campaigns/` and cron routes under `src/app/api/cron/`. Five
emails on that pattern:

1. **T+0** — delivery, library link, how to use the workbook
2. **T+1d** — "start here": Part 0 and the three dialogues
3. **T+3d** — the mistake you're already making (excerpt an ✗/✓ box)
4. **T+6d** — why grammar alone won't make you speak; a tutor's story
5. **T+9d** — starter pack, with a real deadline

Personalise 2–5 off actual progress where it exists ("you've finished Part 1").
Unsubscribe must not remove them from transactional lesson mail.

### 8.7 Analytics
Every metric in §1 needs an event **before** launch: book purchase, bump
attach, account created from delivery, **section opened, exercise attempted,
exercise completed**, upsell view, upsell purchase, refund. Without these the
launch teaches us nothing.

---

## 9. Decisions

1. **PDF toolchain: HTML + CSS Paged Media, rendered locally.** Source of truth
   is a semantic HTML file in the repo, styled with CSS Paged Media (Paged.js
   for `@page`, running heads, page numbers), rendered to a base PDF by
   Chromium as a **build script — not a runtime dependency**. The per-buyer
   footer is stamped onto that base PDF at delivery with `pdf-lib` (pure JS,
   milliseconds, no browser in the function). Keeps Chromium off Vercel
   entirely. InDesign is ruled out by the per-buyer footer; LaTeX by the ~40
   tables, colored callouts and emoji markers. `src/lib/pdf` runs the opposite
   direction (pdfjs, reading PDFs) and is not reusable. **This decision is what
   makes §6 cheap.**

2. **Audio: Inworld TTS.** ~20k characters, so under $5. **Gated on an
   acceptance test:** ~20 clips covering nasal vowels (*bon/vin/un*), liaison
   (*les_amis*, *vous_avez*), the `u`/`ou` contrast (*tu* vs *tout*), the
   guttural `r`, plus a slow-read pass — most TTS degrades badly when slowed,
   and the slow pass is half the product. Shipping a pronunciation product that
   teaches wrong pronunciation is worse than shipping no audio.

3. **Guarantee: 14 days, no questions.** On the sales page, in the delivery
   email, and in the Stripe checkout description. The refund window closes
   before the 30-day starter-pack window matures, so refund exposure settles
   before the upsell result is known.

4. **Expand rather than soften the B2 claim.** Parts 3–5 were 23% of the words
   and 5 of 30 exercises while carrying the harder 60% of the syllabus. The
   10,745-word expansion makes "A0 → B2" defensible and takes the book to ~95
   pages. Test $37 alongside $27 once it lands.

5. **Sell to the existing list**, understanding it is non-paying users. The
   "warm" launch is really this list's first monetization event, so 100 buyers
   may take longer than §1 implies — but book→account will run high, since many
   already have accounts.

6. **Interactive web workbook: yes, free, inside FrancoLink, both formats.**
   Full reasoning in §6. Not standalone, not an upsell, not instead of the PDF.

---

## 10. Go-to-market

**Do not start with paid ads.** $27 alone cannot survive a $20–40 Meta CPA;
only the AOV can, and the AOV is unproven.

1. **"Warm"** — existing FrancoLink students, tutors' own networks, the mailing
   list. Free, but see decision 9.5: this list has never paid us anything, so
   treat it as the first real test. It is also the gentlest possible ask — $27
   once, against a subscription.
2. **Organic** — Reels/TikTok built from the ✗/✓ error boxes, which are
   natively short-form-shaped.
3. **SEO, starting now because it compounds.** Publish 8–10 of the strongest
   sections as posts on `src/app/site/blog`: *passé composé vs imparfait*, *tu
   or vous*, *être or avoir*, *qui vs que*. High intent, beatable competition,
   same domain as the tutor directory so authority compounds into the
   marketplace pages. **Make the exercises on those posts interactive too** —
   the §6 machinery is already built, it lifts dwell time, and it is the
   cheapest possible demo of the paid product.
4. **Paid**, only once bump rate and starter-pack rate are known.

---

## 11. Build order

**Phase 1 — the product (no code, and the long pole).** Merge the B1–B2
expansion; apply the 12 specified manuscript fixes; convert to the HTML source
of truth; cover; run the Inworld acceptance test, then generate and listen to
the full audio pack. Answer key is already audited across all 45 exercises.

**Phase 2 — the plumbing.** `digital_products` schema, checkout route, webhook
branch, delivery/library page with account creation, signed downloads,
`pdf-lib` footer stamping.

**Phase 3 — the funnel.** Sales page with live exercise demo, interactive
workbook layer, upsell/downsell chain, email sequence, analytics events.

**Phase 4 — traffic.** Warm launch, measure against §1, then blog posts, then
paid.

Phases 2 and 3 are roughly a week and a half against a codebase that already
has Stripe, Resend, credits and the starter pack — the interactive layer adds
2–3 days to what was already planned. **Phase 1 is what decides the schedule.**

---

## 12. Open items

Two, both needing a person rather than a decision:

1. **A native-speaker read of the expansion's French** — particularly the
   *dont* constructions in §3.7 and the participle agreements in §4.7 and §5.8.
2. **The Inworld acceptance test** (decision 9.2). If it fails, the fallback is
   a human voice, which changes Phase 1's cost and schedule but nothing else in
   this document.
