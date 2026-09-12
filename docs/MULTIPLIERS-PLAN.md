# Multipliers — the content plan (planning only, nothing written yet)

Supersedes the cluster tables in `docs/seo-content-plan.md`, which were drafted
before the audit. The strategy there held up; what changed is *what has to exist
first* and *which pages can rank at all*.

The defensive work is done: technical 46 → 65, every page fixed on LCP, 395
templated lessons out of the index, schema and `llms.txt` shipped. This is the
part that actually brings people in.

---

## 1. What the audit changed about the plan

**The workbook sales page cannot rank for grammar queries.** SERPs for "passé
composé vs imparfait" and "french grammar rules" are 100% free explainer guides
(Lawless French, Lingolia, FrenchToday). Google will not rank a $27 checkout
page above ungated guides. So the free guides are not a nice-to-have that
supports the workbook — **they are the only route to selling it through search.**
The sales page stays the *destination*, not the ranking page.

**There is no top-of-funnel page at all.** "duolingo alternative french" and
"learn french online" have nowhere to land: `/pricing` is a decision-stage page
and `/library` reads as a logged-in utility screen. This is the single biggest
missing page on the site.

**E-E-A-T is the constraint, not word count.** One credentialed human is named
anywhere on the site (Njinu Precious Bambot, on the workbook page) and there is
no bio page to link to. `/about` names nobody. For paid education content that
is the ceiling on everything else.

**Internal link targets are now known and finite:**

| | count |
|---|---|
| Indexable lessons | 250 (238 French, 12 English) |
| Grammar lessons linkable from posts | **56** |
| A1 + A2 lessons | **35** |
| B1 lessons | 166 |

That last row is a planning constraint: blog traffic will skew beginner, but
beginner lessons are the thinnest part of what survived the lint. Posts aimed at
A1/A2 have few good lessons to link into.

---

## 2. Build before writing (this is engineering, not content)

Nothing can be published until these exist. Roughly a week.

| # | Thing | Why |
|---|---|---|
| 2.1 | **MDX post system** — `content/blog/*.mdx`, index, post route, tags | `/blog` is a `noindex` placeholder; there is no post system at all |
| 2.2 | **`Article` + `FAQPage` schema per post**, author → `Person` | Slots into `lib/site/schema.ts`, which already exists |
| 2.3 | **Author page** `/authors/njinu-precious-bambot` with credentials + `sameAs` | The workbook already declares him as `Person`; there is nowhere to link. This is the highest-leverage E-E-A-T fix available |
| 2.4 | **Post OG images** — generated per post, same generator as `og-image.png` | Social preview per post; the site-wide card already works |
| 2.5 | **Remove `noindex` from `/blog`**, add blog + author to sitemap and `llms.txt` | Currently excluded by design |
| 2.6 | **MDX components** — audio player, drill table, conjugation table | The differentiator: we have TTS audio nobody else has |
| 2.7 | **Publish/updated dates rendered** | No freshness signal exists anywhere on the site today |

---

## 3. Page architecture

```
francolink.net/
├── learn-french-online/          ← NEW. The missing top-of-funnel page.
│   └── (also targets "duolingo alternative french")
├── blog/
│   ├── passe-compose-vs-imparfait
│   ├── ...
├── authors/njinu-precious-bambot ← E-E-A-T anchor
└── [money pages: /tutors, /francais-pas-a-pas, /pricing]
```

Pillars come later (§6), once spokes exist to link up into them. Building a hub
with nothing to hub is a common way to waste a month.

---

## 4. The three clusters, each tied to one product

### A. Grammar → sells the $27 workbook
The strongest cluster: real volume, low commercial competition, and we can
answer better than a generic blog because we have 45 drilled rules, real audio,
and 56 grammar lessons to link into.

1. Passé composé vs imparfait
2. Être or avoir — picking the auxiliary
3. French object pronouns (le, la, lui, y, en)
4. The subjunctive, without the jargon
5. De / du / de la / des
6. 15 French grammar mistakes English speakers make

### B. Speaking & tutoring → sells live lessons
7. How to practise speaking French with nobody to talk to
8. What a French tutor actually costs in 2026
9. French pronunciation: the 8 sounds English speakers get wrong

### C. Self-study & CEFR → sells the subscription
10. CEFR levels A1–C2 explained
11. A1 French: what it means and how long it takes
12. How long does it really take to learn French?

Plus, as its own build: **`/learn-french-online`** — the method/comparison page
that names Duolingo explicitly, shows the CEFR path, and funnels to all three
products.

---

## 5. The editorial standard (this is the part that protects us)

We just de-indexed 395 lessons for being template prose with the topic swapped
in. **Publishing AI-written blog posts at volume would repeat exactly that
mistake, at the exact moment the site can least afford it.** So every post:

- **Named, credentialed byline** linking to the author page. No "FrancoLink Team".
- **One thing no competitor has**: our TTS audio, a real correction the author
  has made in lessons, an original example set, a mistake pattern actually seen
  in students. If a post has none, it does not ship.
- **Answer-first**: a 40–60 word direct answer as the first element, quotable
  with no other context on the page. This is the AI-citation unit.
- Question-phrased H2s; each section self-contained (no "as mentioned above").
- `Article` + `FAQPage` schema, visible publish + updated dates.
- Links: ↑ pillar, → 2 siblings, → 1 lesson, → 1 product page.
- **Depth over length.** 900 words with one original insight beats 1,800 generic.
- Every post read end-to-end by a human before publish.

---

## 6. Sequence

**Phase 0 — build (week 1).** §2 in full. Nothing publishes yet.

**Phase 1 — the two pages that matter most (week 2).**
`/learn-french-online` (missing top-of-funnel) and the author page (E-E-A-T
ceiling). Both unblock everything after them.

**Phase 2 — posts 1–12 (weeks 3–10, 2/week)**, ordered by revenue line:
grammar first (workbook), because the cluster is strongest and the product is
cheapest to buy.

**Phase 3 — pillars + comparisons (week 10+).** `/learn/french` hub once spokes
exist. Then "duolingo alternatives", "preply alternatives" — these need domain
authority, so they come last, not first.

**Phase 4 — Spanish.** Only after French clears ~1,000 organic sessions/month.

---

## 7. Off-site — the half that is not on our site

GEO scored 41/100 and schema alone will not move it. LLM answers lean on
consensus across sources, not on our own markup:

- **`sameAs` is an empty array right now.** Create the real profiles (LinkedIn
  company page, YouTube channel), then populate it. Highest-leverage entity fix.
- 3–5 genuine third-party placements: a YouTube demo, honest participation in
  r/French and r/languagelearning, a listing in a "best apps to learn French"
  roundup.
- Get the workbook *into* the comparison listicles rather than trying to
  outrank them — that SERP slot structurally favours third-party roundups.

---

## 8. Measurement

Leading (weeks 2–6): pages indexed, first impressions per cluster.
Lagging (months 3–6), and the only numbers that matter: organic → workbook
purchase, organic → first tutor booking, organic → subscription.
Monthly: check the 12 target queries in ChatGPT, Perplexity and AI Overviews —
are we named?

---

## 9. Open questions

1. **Who writes?** See §5. This decides whether the plan is safe or a repeat of
   the lesson-library problem.
2. Cadence — 2/week is the plan; 1/week is fine and safer.
3. Does the author want a photo and real credentials published on the author
   page? E-E-A-T is much weaker without them.
