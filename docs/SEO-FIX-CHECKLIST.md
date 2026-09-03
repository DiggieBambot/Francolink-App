# FrancoLink — Pre-Content Fix Checklist

Everything here is defensive: remove penalty risk and fix slowdowns. **No new
content, no new pages.** The growth work in `docs/seo-content-plan.md` starts
only after this list is green — publishing into these problems multiplies them.

Source: `docs/SEO-ACTION-PLAN.md` (six specialist audits, findings verified live).

---

> **Status 2026-09-03. A2–A7 are DONE and verified in production** (merged to
> main, commit `3fb1b18`). Migration applied, lint verdicts written (250 index /
> 395 noindex), sitemap 664 → 261, canonicals self-referencing, unmatched paths
> 404 on their own host, workbook page in the sitemap.
>
> Still open: **A1** (your decision), the generation-pipeline repair and the CI
> lint gate under A2, and all of section B.
> Findings: `docs/SEO-LESSON-QUALITY.md`.

## A. Penalty & trust risk — do these first

### A1. Remove unsubstantiated claims  ⚠️ decision needed from you
The site advertises numbers it cannot support, while its own testimonials page
says there are no reviews yet.

- [ ] `src/lib/constants.ts:23` — `studentCount: '5,000+'`
- [ ] `src/app/(marketing)/pricing/page.tsx:299` — `"🌍 5,000+ active learners"` and `"⭐ 4.9/5 student rating"`
- [ ] `src/app/(auth)/layout.tsx:38` — `"Join 5,000+ students…"`
- [ ] Default title `"Franco Link - #1 Best Online Language Learning Platform"` — unverifiable superlative, currently the title on app `/` **and** `/pricing`
- [ ] `src/app/site/tutors/page.tsx` — "every profile below is a real teacher we selected, interviewed and approved" while one tutor is live. Fix the copy or the roster.
- [ ] Decide: delete the claims, or replace with real figures pulled live from the DB

> Not just SEO. Invented user counts, star ratings and a "#1 Best" superlative
> are a consumer-advertising exposure, and they contradict the honest tone
> everywhere else on the site.

### A2. Gate the broken lesson pages out of the index
~650 `/library/lesson/*` URLs are in the sitemap at priority 0.6. Verified
defects: `cuisine` → "What you'll learn **Vous**";
`competences-avancees-affaires` → "**Vous Vous Vous**"; `board-games` and
`giving-directions` share filler vocab (`routine`, `schedule`, `habit`, `manage`).

- [x] Write a lint script over all published lessons that fails a page when:
  - objectives render as a bare pronoun (`Vous` / `You`) or repeat
  - vocabulary overlaps >50% with a lesson outside its topic cluster
  - fewer than 4 populated sections, or under 150 unique non-boilerplate words
- [x] Run it; record how many of the ~650 fail (spot check hit 2 in 10)
- [x] `noindex` + drop from sitemap every failing lesson (`src/app/sitemap.ts`)
- [x] Keep grammar + Daily News lessons indexed — they pass and are genuinely good
- [ ] Fix the generation pipeline so regenerated lessons can't ship blank fields
- [ ] Re-run the lint as a build/CI gate so this cannot regress

### A3. Fix the canonical/host contradiction
`francolink.net` 308s to `www.francolink.net`, but every canonical, sitemap
`<loc>` and robots directive names the **non-www** origin. Nothing
self-references the URL it is actually served from.

- [x] Set `SITE_URL` in `src/lib/site/hosts.ts` to `https://www.francolink.net` (or flip the Vercel redirect to www→apex — pick one)
- [x] Verify canonicals, `robots.txt` `Host:`/`Sitemap:`, and every sitemap `<loc>` all agree with the host that serves 200
- [ ] Confirm `metadataBase` / `NEXT_PUBLIC_SITE_URL` in the Vercel env match

### A4. Stop unmatched URLs redirecting cross-domain into a 404
Verified: `www.francolink.net/nonexistent-xyz` → 307 →
`app.francolink.net/nonexistent-xyz` → 404. Same for case variants (`/Tutors`).

- [x] In `src/middleware.ts`, scope the catch-all app-host forward to an explicit allowlist of genuinely moved paths (301, one hop)
- [x] Everything else 404s on its own host
- [x] Spot-check: a typo'd marketing URL returns a direct 404 with no redirect

### A5. Resolve cross-host duplication
`/pricing`, `/how-it-works`, `/privacy`, `/terms` exist on **both** hosts with
diverging copy, and both are in both sitemaps.

- [x] Marketing host owns all four
- [x] App host redirects them, or sets a cross-host canonical to the marketing URL
- [x] Remove the losing copies from the app sitemap
- [ ] Reconcile the contradictory product descriptions (app claims "280+ free lessons" and commission rates the marketing site never mentions)

### A6. App host emits no canonical tags at all
Verified: 0 canonical tags on app `/pricing`.

- [x] Add self-referencing canonicals to every indexable app template
- [x] Give app `/pricing`, `/get-started`, `/pricing/tutors` real `generateMetadata` — right now `/` and `/pricing` share one title
- [ ] Fix `og:url`, hardcoded to the wrong (non-www marketing) host

### A7. Sitemap accuracy
- [x] Add `/francais-pas-a-pas` — **the $27 product page is missing entirely** (`src/app/sitemap.ts`)
- [ ] Add `/blog` once it has real posts (leave out while it's a noindexed stub)
- [x] Replace `lastmod: new Date()` with real `updated_at` values — "now" on every URL on every fetch is worse than omitting it

---

## B. Speed — every page currently fails LCP

Main-thread work is fine (TBT ≤122ms everywhere). It is fonts and images.

### B1. Delete the duplicate font load  ← cheapest win in the audit
`src/app/layout.tsx` already self-hosts Mulish + Roboto via `next/font/google`.
`src/app/globals.css:3` loads **the same two families again** over a
render-blocking `@import`.

- [x] Delete line 3 of `src/app/globals.css`
- [ ] (cosmetic) same stray `@import` at `src/app/admin/login/page.tsx:68` — admin is noindexed
- [x] Expected: **~1.4–1.6s off LCP on every marketing page**

### B2. Fix the oversized logos
| File | Now | Native | Shown at |
|---|---|---|---|
| `public/dark-logo-transparent.png` | **1,122 KB** | 2169×725 | footer |
| `public/logo-new.png` | 296 KB | 1188×214 | 200×44 |
| `public/logo-wordmark.png` | 1,279 KB | — | — |
| `public/logo.png` | 917 KB | — | — |

- [x] Re-export each to WebP at display size (footer logo target <30 KB)
- [ ] Set explicit `width`/`height` on every logo `<img>` (also fixes `/tutors` CLS 0.126)
- [x] Expected: removes ~1.1 MB from `/pricing` and `/tutors` — 37–59% of their weight

### B3. Stop deprioritising the LCP image  ← biggest single win
On `/library` and lesson pages the LCP image has `loading="lazy"` and no
`fetchpriority`. Lighthouse: `eagerlyLoaded: false`, `priorityHinted: false`.

- [x] Remove `loading="lazy"` from the LCP-candidate image (`src/app/library/page.tsx`, `src/app/library/lesson/[slug]/page.tsx`)
- [ ] Add `fetchpriority="high"` and preload the lesson hero
- [x] Expected: **~3–4s off `/library`'s 8.5s LCP**

### B4. Re-enable image optimization — ⚠️ needs your decision
`images.unoptimized: true` was set deliberately in commit `6915e6e` ("Disable
Vercel image optimization") with no stated reason — most likely to avoid
Vercel's per-transformation billing. Turning it back on has a cost implication,
so it is left as-is rather than flipped silently.

Note the B2 re-export above already banks most of the win without it: the local
assets are now correctly sized, so the optimizer would mainly help the
Supabase-hosted lesson images (54–340 KB each, served at native size).

- [ ] Decide: accept the Vercel image-optimization cost, or keep it off and
      resize Supabase lesson images at upload time instead
- [ ] If enabling: remove `images.unoptimized: true` from `next.config.ts`
- [ ] Confirm the Supabase remote pattern still resolves through the optimizer (library/lesson images are served at native size today, 54–340 KB each)
- [ ] Re-measure — this is what stops B2 from regressing

### B5. ISR on lesson pages — ✗ NOT DONE, and should not be done as written
Converting this page to ISR would cache personalised output. The page reads the
session to pick the view: tutors and admins get scaffolding, tips and **answers**;
students and guests get the clean view. It also renders per-user homework
assignments and submissions. Caching it would serve one visitor's page to
everyone — worst case a cached tutor view, answers included, served to guests,
which is precisely what the file's header comment says must never happen.

`force-dynamic` is correct here. The measured prize was only ~350–450ms TTFB,
against a real risk of leaking answers.

- [ ] *(optional, larger)* If that TTFB is worth reclaiming: cache the public
      lesson body and move the role-dependent parts behind their own dynamic
      boundary (`<Suspense>` islands), so the shell is static and only the
      personalised fragments are rendered per request.

---

## C. Hygiene — cheap, do while you're in there

- [x] Remove `user-scalable=no, maximum-scale=1` from the viewport meta (WCAG 1.4.4 failure) and de-duplicate — two viewport tags ship on every page
- [x] Add security headers — `nosniff`, `SAMEORIGIN`, `Referrer-Policy`. CSP and `Permissions-Policy` deliberately deferred: the lesson room delegates camera/mic to a cross-origin Daily iframe, so a careless value breaks live lessons. Needs its own change, with the room tested.
- [x] `purged-accounts-*.json` (178 real user records) added to `.gitignore` — untracked only by luck before this
- [ ] 🔴 **SECURITY — see `docs/SECURITY-git-history.md`.** The repo is public and
      its history still exposes a live Stripe `sk_live_*`, Supabase service-role
      keys and two SSH private keys. Rotation is required; a history rewrite is
      a separate decision.
- [ ] hreflang is emitted only on the app homepage, as an HTTP header. Either extend it to real localized routes or drop the promise
- [ ] Decide an explicit robots policy for training-only crawlers (CCBot etc. are allowed by default, not by decision)

---

## D. Verify before declaring done

> **Done 2026-09-03 — results in `docs/SEO-VERIFICATION.md`.** 22/22
> deterministic checks pass. Technical 46 → 65/100. LCP: four of six pages went
> from failing to passing (or within 90ms of it); the two library pages improved
> but still fail and got a follow-up fix in `6d443b5` awaiting re-measure.

- [x] `curl -I` a typo'd marketing URL → direct 404, no cross-host redirect
- [x] Canonical on `www.francolink.net/pricing` points at itself
- [x] `/francais-pas-a-pas` present in `sitemap.xml`
- [x] Sitemap URL count dropped by the number of lessons the lint failed
- [x] Lighthouse mobile re-run on all six audited URLs — 4 of 6 now pass or are within 90ms; `app/library` and lesson pages still fail (fetchpriority fix shipped, needs re-measure)
- [x] No `fonts.googleapis.com` request in the network tab
- [ ] Google Search Console: no new "Duplicate, Google chose a different canonical" — *needs your GSC access; wait weeks, not days, for recrawl*
- [x] Re-run `/seo-audit` and compare — technical baseline was **46/100**, GEO **41/100**

---

## Suggested order

1. **B1** — one line, ~1.5s, zero risk. Do it now.
2. **A7 + A3** — sitemap and canonical, small diffs, high value.
3. **A1** — needs your decision.
4. **A2** — the largest job; the lint script is the real work.
5. **B2 → B4 → B3** — images.
6. **A4, A5, A6** — routing and metadata.
7. **B5, C** — cleanup.

Only then: schema, `llms.txt`, and the content plan.
