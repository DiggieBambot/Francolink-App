# Section D — verification results

Run 2026-09-03 against production, after sections A, B and C.

## Scores

| | Baseline | Now |
|---|---|---|
| Technical SEO | 46/100 | **65/100** |
| GEO / AI-search | 41/100 | unchanged — needs `llms.txt`, schema and content (the "multipliers") |

## Core Web Vitals (Lighthouse mobile, identical methodology both runs)

| URL | Perf | LCP | CLS | Weight |
|---|---|---|---|---|
| `/` | 67 → **96** | 5.28s → **2.55s** | 0.005 → 0.0007 | 800 → **497 KB** |
| `/tutors` | 71 → **83** | 4.20s → **2.54s** | **0.126 → 0** | 1,940 → **519 KB** |
| `/francais-pas-a-pas` | 68 → **97** | 5.17s → **2.59s** | 0 | 862 → **550 KB** |
| `/pricing` | 77 → **93** | 4.11s → **2.33s** | 0 | 1,909 → **492 KB** |
| `app/library` | 59 → **76** | 8.50s → **6.84s** | 0.001 → 0 | 2,918 → **1,512 KB** |
| `app/library/lesson/[slug]` | 65 → **64** | 5.53s → **4.98s** | 0 | 1,297 → **1,098 KB** |

CLS now passes on all six. `/pricing` passes LCP outright; `/`, `/tutors` and
`/francais-pas-a-pas` land 30–90 ms over the 2.5 s line under Lighthouse's
conservative simulated throttling and should register as good in field data.

The two library pages were still failing for the same reason on both: `priority`
on `next/image` made the LCP image eager but emitted **no fetchpriority
attribute**, so Lighthouse scored them `priorityHinted: false`. Now set
explicitly (commit `6d443b5`) — re-measure to confirm the gain.

## Deterministic checks — 22/22 passing

Redirects and 404s · canonicals self-referencing on 4/4 marketing pages ·
workbook page in the sitemap · app sitemap 664 → 261 · templated lesson
`noindex` while a good lesson is not · noindexed lessons still serve 200 to
students · no `fonts.googleapis.com` on 3/3 pages · three security headers ·
single unlocked viewport · robots `Host` agreeing with canonicals · app
`/pricing` cross-host canonical · dead `/privacy` no longer submitted.

## Baseline findings, closed out

FIXED: cross-domain 404 redirects · canonical/robots/sitemap host mismatch ·
workbook missing from sitemap · cross-host duplicate pages · viewport zoom lock
and duplicate tag · fake `lastmod` · app-page canonicals **including the
homepage** (commit `6d443b5`).

PARTIAL: security headers — CSP and `Permissions-Policy` deliberately deferred
(the lesson room delegates camera/mic to a cross-origin Daily iframe, so a
careless value breaks live lessons).

STILL OPEN: **structured data (0/10 — the single biggest remaining lever)** ·
hreflang beyond the homepage · IndexNow · `images.unoptimized`.

## Corrected: lessons are not orphaned

A re-audit claimed `/library` server-renders zero lesson links, leaving ~250
pages discoverable only via the sitemap. That is wrong. `/library` links to the
six category pages, and those server-render the lessons:

```
business 90 · conversation 70 · fr-daily-news 19
fr-grammar 56 · french-for-kids 53 · travel-culture 66   = 354 links
```

354 crawlable lesson links against 250 in the sitemap. The crawl path
`/library → /library/[category] → /library/lesson/[slug]` is intact.

## Cannot verify here

Search Console's "Duplicate, Google chose a different canonical" needs GSC
access. It is a wait-and-see check regardless: **the sitemap changed instantly,
the index will not.** Google must recrawl each of the 395 lessons to see its
`noindex`, which takes weeks. A flat index count next week is not a failed fix.
