# FrancoLink — SEO/AEO Baseline Audit & Action Plan

**Date:** 2026-09-02 · Hosts audited: `www.francolink.net`, `app.francolink.net`
**Method:** 6 specialist audits (technical, schema, content/E-E-A-T, GEO, SXO,
performance) + first-hand verification of every Critical finding.

Companion: `docs/seo-content-plan.md` (the strategy and editorial calendar).

## Baseline scores

| Area | Score | Source |
|---|---|---|
| Technical SEO | 46/100 | measured |
| GEO / AI-search readiness | 41/100 | measured |
| Schema coverage | 1 of 8 key page types | measured |
| Editorial content | none — `/blog` is a noindexed stub | measured |

---

## P0 — Blockers. Fix before publishing any content.

### 0.1 Unsubstantiated trust claims are live (business risk, not just SEO)
`app.francolink.net/pricing` renders `🌍 5,000+ active learners ⭐ 4.9/5 student
rating`; both app hosts' default title is `Franco Link - #1 Best Online Language
Learning Platform`. Meanwhile `/testimonials` states there are no reviews yet and
`src/lib/workbook/reviews.ts` is empty by design.

Hardcoded at `src/lib/constants.ts:23` (`studentCount: '5,000+'`),
`src/app/(marketing)/pricing/page.tsx:299`, `src/app/(auth)/layout.tsx:38`,
plus the `#1 Best…` default title.

An unverifiable superlative plus invented counts and ratings is a consumer-
advertising exposure and destroys the E-E-A-T the whole content plan depends on.
**Remove or substantiate. Driving traffic at this page before fixing it is worse
than not marketing at all.**

### 0.2 Lesson-library template defects across ~650 indexed URLs
Verified live:
- `/library/lesson/cuisine` → "What you'll learn **Vous**"
- `/library/lesson/competences-avancees-affaires` → "**Vous Vous Vous**"
- `/library/lesson/board-games` and `/giving-directions` (unrelated topics) share
  the same filler vocabulary: `routine`, `schedule`, `habit`, `manage`.

All ~650 are in the sitemap at priority 0.6 and crawlable. Building authority
that points into this corpus is the fastest route to a sitewide quality problem.

**Gate before re-indexing:** fail any lesson whose objectives render as a bare
pronoun ("Vous"/"You") or repeat; fail any whose vocabulary block overlaps >50%
with a lesson outside its topic cluster; require ≥4 populated sections and ≥150
unique words. Grammar and Daily News lessons pass today and stay indexed —
`noindex` the failures until the generation pipeline is fixed.

### 0.3 Canonical/host contradiction, sitewide on the marketing host
`francolink.net` 308-redirects to `www.francolink.net`, but `SITE_URL` in
`src/lib/site/hosts.ts` is the non-www origin. So every canonical tag, every
sitemap `<loc>`, and robots.txt's `Host:`/`Sitemap:` point at a URL that
redirects away from itself. Nothing self-references its served URL.

Fix: set `SITE_URL` to `https://www.francolink.net` (or flip the Vercel redirect
to www→apex). Pick one and make code, redirect and sitemap agree.

### 0.4 Unmatched marketing URLs 307 cross-domain into a 404
Verified: `www.francolink.net/nonexistent-xyz` → 307 →
`app.francolink.net/nonexistent-xyz` → 404. Same for case variants (`/Tutors`).
Every typo, dead link and legacy URL burns a redirect hop and lands a 404 on the
wrong host. Scope the catch-all in `src/middleware.ts` to a real allowlist of
moved paths (301, one hop); everything else 404s on its own host.

---

## P1 — High. Week 1–2.

| # | Fix | File |
|---|---|---|
| 1.1 | Add `/francais-pas-a-pas` (the $27 product) and `/blog` to the marketing sitemap — a monetised page is currently absent | `src/app/sitemap.ts` |
| 1.2 | App host emits **no canonical tags at all** (verified: 0 on `/pricing`) — add self-referencing canonicals to every indexable app template | app layouts |
| 1.3 | App `/` and `/pricing` both serve the same default title; `og:url` is hardcoded to the wrong (non-www marketing) host — give each route real `generateMetadata` | `src/app/(marketing)/pricing/page.tsx` |
| 1.4 | `Organization` + `WebSite` JSON-LD sitewide. **Do not ship `SearchAction`** — `/search?q=` returns 307, it does not exist | root layout |
| 1.5 | Lesson pages: add description + canonical + `LearningResource` schema; replace `force-dynamic` with ISR | `src/app/library/lesson/[slug]/page.tsx` |
| 1.6 | Cross-host duplication: `/pricing`, `/how-it-works`, `/privacy`, `/terms` exist on both hosts with diverging copy and are in both sitemaps. Marketing host owns them; app host redirects or cross-host-canonicals | middleware + sitemap |
| 1.7 | Ship `llms.txt` on both hosts (drafts prepared) | `public/` or route |
| 1.8 | `Product.image` missing on the workbook JSON-LD — blocks Product rich-result eligibility | `francais-pas-a-pas/page.tsx` |
| 1.9 | `images.unoptimized: true` — remove; direct LCP cost sitewide | `next.config.ts` |

---

## P2 — Medium. Week 3–4.

- `ItemList` on `/tutors`, `Person` on tutor profiles. `AggregateRating` **only**
  computed live from real testimonials, omitted where count is 0 — never defaulted.
- `Course` + `Offer` on `/pricing` (real prices: Free $0, Premium $7.99/mo /
  $59.99/yr, Premium+ $14.99/mo / $119.99/yr). Inject from a server wrapper —
  the pricing page is `"use client"`.
- `HowTo` schema on `/how-it-works` (content already matches the shape 1:1).
- `BreadcrumbList` on tutor, workbook and lesson pages.
- Founder/author page for Njinu Precious Bambot with `Person` schema — currently
  the only credentialed human on the site, and there is no bio page to link to.
- Security headers (only HSTS present): `X-Content-Type-Options`,
  `Referrer-Policy`, `X-Frame-Options`/CSP.
- Viewport locks zoom (`user-scalable=no`) — WCAG 1.4.4 failure, and two
  competing viewport tags ship on every page.
- Sitemap `lastmod` is the request timestamp for every URL — always "now" is
  worse than absent. Source from real `updated_at`.
- hreflang is emitted only on the app homepage, as an HTTP header. Either extend
  it properly or stop promising alternates that don't exist for deeper routes.

---

## P3 — Low / backlog
IndexNow key + ping-on-publish. Decide an explicit robots policy on
training-only crawlers (CCBot etc. are currently allowed by default, not by
decision).

---

## Strategic correction from the SXO analysis

This changes `docs/seo-content-plan.md` and is the most important non-bug finding.

**The sales page cannot rank for the grammar queries.** SERPs for "passé composé
vs imparfait" and "french grammar rules" are 100% free explainer guides (Lawless
French, Lingolia, FrenchToday). Google will not rank a $27 checkout page above
ungated guides for those queries. The workbook page is correctly built and
correctly typed — for "best french grammar workbook", not for the grammar
questions themselves.

So the grammar cluster works only as originally designed: **free guides rank and
earn the click; the workbook is the CTA inside them.** That validates the plan's
Cluster A, but means the guides are prerequisites, not optional.

Two further page-type mismatches:
- **"duolingo alternative french" / "learn french online"** have no landing page
  at all. `/pricing` is a decision-stage page, and the app `/library` reads as a
  logged-in utility screen. A method/comparison page is missing entirely — it is
  the missing top-of-funnel page and should be built early.
- **"online french tutor"** — `/tutors` is the right page type (directory) but
  under-built: no count, no price anchor, no ratings in the SERP snippet, where
  every ranking competitor leads with exactly those. Also: the copy says "every
  profile below is a real teacher we selected and interviewed" while one tutor is
  live. Fix the copy or the roster.

Realistic targeting: skip head terms owned by Amazon, Routledge and Duolingo.
Win the long tail where the tutor + workbook + CEFR combination is a genuine
differentiator.

---

## What is genuinely working — keep and copy

- **Everything is server-rendered.** GPTBot, ClaudeBot, PerplexityBot,
  Google-Extended and CCBot all receive full HTML; no CDN interference. The AI
  crawler foundation is sound.
- **`/francais-pas-a-pas` is the best page on the site** — Product + Offer +
  FAQPage + Person, a named author with real credentials (TCF/TEF), specific
  claims ("45 rules"). It is the template for everything else.
- **`/faq`** answers are crisp and factual — the strongest citability asset.
- Marketing copy is original and specific, with none of the AI-slop phrasing that
  gets sites demoted. Grammar and Daily News lessons are genuinely good.
- Clean single-hop redirects, correct trailing-slash handling, HSTS configured,
  app robots.txt correctly walls off authenticated surfaces.

---

## Performance / Core Web Vitals (measured, Lighthouse mobile lab)

No CrUX field data exists — the domain is below the traffic threshold. Lab data
only; valid for relative prioritisation.

| URL | Perf | LCP | CLS | Weight |
|---|---|---|---|---|
| `/` | 67 | 5.28s POOR | 0.005 | 800 KB |
| `/tutors` | 71 | 4.20s POOR | 0.126 needs-work | 1,940 KB |
| `/francais-pas-a-pas` | 68 | 5.17s POOR | 0 | 862 KB |
| `/pricing` | 77 | 4.11s POOR | 0 | 1,909 KB |
| `app/library` | 59 | **8.50s POOR** | 0.001 | 2,918 KB |
| `app/library/lesson/[slug]` | 65 | 5.53s POOR | 0 | 1,297 KB |

**Every page fails LCP.** Main-thread work is not the problem — TBT is ≤122ms
everywhere. It is fonts and images.

### P1.10 — Google Fonts is loaded twice, once render-blocking (one-line fix)
`src/app/layout.tsx` correctly self-hosts Mulish and Roboto via
`next/font/google`. But `src/app/globals.css:3` **also** pulls the same two
families over a render-blocking `@import`:

```css
@import url('https://fonts.googleapis.com/css2?family=Mulish:...&family=Roboto:...');
```

A CSS `@import` on line 3 blocks rendering on a `fonts.googleapis.com` →
`fonts.gstatic.com` round trip that `next/font` already made unnecessary. Worth
**~1.4–1.6s** of the 3.4–5.0s render delay on every marketing page, where the LCP
element is a *text node* waiting on this. Deleting the line is the single
cheapest win in this audit. (`src/app/admin/login/page.tsx:68` has a second
stray `@import`; admin is noindexed, so cosmetic.)

### P1.11 — Logo files are 30× oversized
| File | Actual | Native px | Displayed |
|---|---|---|---|
| `public/dark-logo-transparent.png` | **1,122 KB** | 2169×725 | footer logo |
| `public/logo-new.png` | 296 KB | 1188×214 | 200×44 |
| `public/logo-wordmark.png` | 1,279 KB | — | — |
| `public/logo.png` | 917 KB | — | — |

`dark-logo-transparent.png` alone is **1.1 MB of the 1.9 MB** on `/pricing` and
`/tutors` — 37–59% of total page weight, for a footer logo. With
`images.unoptimized: true` (P1.9) nothing resizes it automatically. Re-export to
WebP at display size (target <30 KB) *and* re-enable the optimizer.

### P1.12 — The LCP image is explicitly deprioritised
On `/library` and lesson pages the LCP element is a Supabase-hosted image with
`loading="lazy"` and no `fetchpriority="high"`. Lighthouse confirms
`eagerlyLoaded: false`, `priorityHinted: false`. On `/library` this produces
3.9s of load *delay* before 4.0s of load *duration* — an 8.5s LCP. Remove the
lazy attribute from the LCP candidate, add `fetchpriority="high"`, preload the
lesson hero. **Expected ~3–4s improvement — the largest single win measured.**

### Correction to the earlier ISR estimate
`force-dynamic` on lesson pages is real but **secondary**: cold TTFB 805–890ms
vs 444ms for a static page on the same host, so ~350–450ms. The deprioritised
image costs 5–10× more. Fix images first, ISR second.

`/tutors` CLS 0.126 is caused by the same unsized logo plus font swap — fixed
incidentally by P1.10 and P1.11.
