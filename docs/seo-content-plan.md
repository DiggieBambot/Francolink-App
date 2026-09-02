# FrancoLink — SEO & AEO Growth Plan (French-first)

> Supersedes the 2026 draft (French + Spanish, app-subdomain assumptions).
> Goal: organic search + AI-answer visibility that converts into paid customers
> for the three revenue lines. French only until the engine proves itself.

## 0. What we are actually selling

| # | Product | Price shape | Page today | Search intent that buys it |
|---|---|---|---|---|
| 1 | **Live lessons** with tutors | per-lesson, tutor-priced | `francolink.net/tutors`, `/tutors/[slug]` | "online french tutor", "french conversation practice", "french tutor near me" — commercial, BOFU |
| 2 | **Le Français Pas à Pas** (grammar book) | $27 one-off | `francolink.net/francais-pas-a-pas` | grammar questions — "passé composé vs imparfait", "french grammar rules" — informational, huge volume, cheap conversion |
| 3 | **Self-learning platform** (Premium / Premium+) | subscription | `/pricing`, `app/library` | "learn french on my own", "duolingo alternative", "french a1 lessons", CEFR queries |

Every piece of content below is assigned to exactly one of these. Content with
no product destination does not get written.

---

## 1. The structural problems to fix before writing anything

These are worth more than the first ten articles.

1. **The blog is a `robots: index:false` stub** (`src/app/site/blog/page.tsx`).
   There is no post system at all — no MDX, no CMS, no `Article` schema, no
   author pages, no tag pages, no RSS. This is build work, not writing work.
2. **Authority is split across two hosts.** `francolink.net` (marketing) and
   `app.francolink.net` (product + the whole public lesson library). The
   library is our largest existing indexable asset and it sits on the weaker
   subdomain. Links earned by blog posts on the apex do not pass full weight
   to it.
3. **`/library/lesson/[slug]` is `force-dynamic`** with no ISR — every crawl is
   a cold DB round-trip. Bad for crawl budget and for Core Web Vitals, which
   are a ranking input.
4. **Lesson pages have title-only metadata** — no description, no canonical, no
   OG, no `Course` / `LearningResource` schema. Hundreds of pages leaving their
   entire SERP presentation on the table.
5. **No `llms.txt`, no FAQ schema, no answer-first formatting** anywhere. That
   is the whole AEO surface, unbuilt.
6. **Sitemap omits the money pages** — `/francais-pas-a-pas` is not in
   `marketingSitemap()`, nor is `/blog`. Fix immediately, it is a 5-line diff.
7. **`images.unoptimized: true`** in `next.config.ts` — every image ships at
   full weight. Direct LCP damage sitewide.
8. **E-E-A-T is thin.** Google rewards named, credentialed authors for
   educational content. No author entity, no `Person` schema, no about-the-
   teacher signals on lesson or article pages.

---

## 2. Architecture decisions (settled 2026-09-02)

- **Library stays on `app.francolink.net`** and gets fixed in place (§6). We
  accept the split-authority cost rather than take on a mass-301 migration.
- **Blog is MDX in the repo** (`content/blog/*.mdx`), statically rendered, with
  custom components for audio players and drill tables. Version-controlled, no
  CMS.
- Editorial and pillars live on the apex; product functionality stays on the app.

### Content lives on the apex

```
francolink.net/                     ← home, brand
francolink.net/blog                 ← index, paginated
francolink.net/blog/[slug]          ← posts, Article schema, named author
francolink.net/learn/french         ← PILLAR hub (2,500+ words)
francolink.net/learn/french/grammar ← sub-pillar → sells the BOOK
francolink.net/learn/french/speaking← sub-pillar → sells LIVE LESSONS
francolink.net/learn/french/levels  ← sub-pillar (CEFR) → sells the PLATFORM
francolink.net/authors/[slug]       ← E-E-A-T
francolink.net/tutors, /francais-pas-a-pas, /pricing   ← money pages
app.francolink.net/library/**       ← the lesson catalogue (stays, gets fixed)
```

Rules: pillars and all editorial on the apex. Product/app functionality stays
on the subdomain. Cross-host links are plain `<a>` with descriptive anchors —
no canonical tricks, the two hosts never target the same query.

---

## 3. Cluster A — Grammar → sells the $27 book

Highest-leverage cluster. Grammar queries have volume, low commercial
competition, and the book *is* the literal answer. The book's own content is
the moat: we can answer better than any generic blog because we have 45
drilled rules and audio.

| Target query | Diff | Title | CTA |
|---|---|---|---|
| passé composé vs imparfait | Med | Passé Composé vs Imparfait: The Rule That Finally Sticks | book |
| french verb conjugation rules | Med | French Verb Conjugation: The 6 Patterns That Cover 80% of Verbs | book |
| être vs avoir | Low | Être or Avoir? How to Pick the Right Auxiliary Every Time | book |
| french subjunctive explained | Med | The French Subjunctive, Explained Without the Jargon | book |
| french pronouns (le/la/lui/y/en) | Med | French Object Pronouns: le, la, lui, y, en | book |
| when to use "de" vs "du" | Low | De, Du, De la, Des: French Partitives Made Simple | book |
| french adjective agreement | Low | French Adjective Agreement: Rules and the Exceptions | book |
| most common french grammar mistakes | Low | 15 French Grammar Mistakes English Speakers Always Make | book |

Each post: answer in the first 60 words, one worked table, 3–5 drilled
examples with audio, then "these 45 rules, drilled, in one book" → sales page.

## 4. Cluster B — Speaking & tutoring → sells live lessons

| Target query | Intent | Title | CTA |
|---|---|---|---|
| online french tutor | commercial | Online French Tutors — Certified, from $X/hour | `/tutors` |
| french conversation practice online | commercial | Where to Practise French Conversation Online | `/tutors` |
| how to practise speaking french alone | info | How to Practise Speaking French With Nobody to Talk To | `/tutors` |
| how much does a french tutor cost | commercial | What a French Tutor Actually Costs in 2026 | `/tutors` |
| italki alternatives / preply alternatives | commercial | Preply Alternatives for French Learners | `/tutors` |
| french accent pronunciation help | info | French Pronunciation: The 8 Sounds English Speakers Get Wrong | `/tutors` |

## 5. Cluster C — Self-study & CEFR → sells the platform

| Target query | Intent | Title | CTA |
|---|---|---|---|
| cefr levels explained | info | CEFR Levels A1–C2 Explained, With What You Can Actually Do | placement test |
| what is a1 french level | info | A1 French: What It Means and How Long It Takes | placement test |
| how long does it take to learn french | Med | How Long Does It Really Take to Learn French? | placement test |
| how to learn french on your own | Med | How to Learn French On Your Own (Without Stalling at A2) | pricing |
| duolingo alternatives for french | High | 7 Duolingo Alternatives for Learning French | pricing |
| best way to learn french | High | The Best Way to Learn French, Honestly | pricing |
| 100 most common french words | Low | The 100 Most Common French Words | library |
| french phrases for travel | Low | 50 French Phrases You Need for Travel | library |

## 6. Programmatic layer — the lesson library

Hundreds of URLs already exist and are underbuilt. Per lesson page, add:
full `generateMetadata` (unique description, canonical, OG), `LearningResource`
+ `Course` schema, a 100-word unique intro rendered above the fold, related
lessons, and ISR (`revalidate`) instead of `force-dynamic`. Quality gate:
lessons with < 3 sections stay out of the sitemap — thin pages at scale are a
sitewide penalty risk, which is precisely the outcome we are avoiding.

---

## 7. AEO / GEO — being the cited answer

The whole point: an AI answer that names FrancoLink is worth more than position
4. Concretely:

- **Answer-first blocks.** Every post opens with a 40–60 word direct answer in
  its own element. That block is the extractable passage.
- **`FAQPage` schema** on every post (3–5 real questions), `HowTo` where the
  content is procedural, `Article` + `Person` author everywhere.
- **`/llms.txt`** at both hosts: what FrancoLink is, the three products, the
  canonical URLs, licensing note.
- **Stable definitional sentences.** "FrancoLink is a French-learning platform
  that combines live tutors, a CEFR lesson library, and a grammar workbook."
  Repeated verbatim in about, llms.txt, and schema `description`. LLMs cite
  consistent phrasing.
- **Entity building.** Named author with credentials, `sameAs` links, an
  `Organization` node with `founder` / `foundingDate`. AI answers prefer
  resolvable entities.
- **Third-party mentions.** Get FrancoLink into "best apps to learn French"
  roundups, Reddit r/French threads (honestly, as participants), and a
  Wikidata entry. LLM answers lean on consensus across sources, not our site.
- Verify AI crawlers (`GPTBot`, `PerplexityBot`, `ClaudeBot`, `Google-Extended`)
  are allowed in `robots.ts`. They currently are — keep it that way.

---

## 8. Not getting penalised

Non-negotiable, because "rich content at volume" is exactly how sites get hit:

- No unedited AI-generated bulk. Every post gets a human pass, a named author,
  and something no competitor has: our audio, our drills, our tutors' answers.
- No publishing faster than we can make each post genuinely best-in-SERP.
  2/week beats 10/week of the same thing.
- No thin programmatic pages (see §6 gate). No doorway pages per city.
- No keyword-stuffed duplicates across the two hosts.
- Original media: our TTS audio, our own screenshots, our own example
  sentences. First-hand experience is the "E" that is hardest to fake.

---

## 9. Sequence

**Phase 0 — foundations (week 1–2, engineering).** Blog post system + `Article`
schema + author pages; `/francais-pas-a-pas` and `/blog` into the sitemap;
lesson-page metadata + schema + ISR; `images.unoptimized` off; `llms.txt`;
FAQ schema on the money pages; GSC + GA4 verified on **both** hosts. Run
`/seo-audit` against both hosts first to get a baseline health score.

**Phase 1 — money pages (week 2–3).** SXO pass on `/tutors`,
`/francais-pas-a-pas`, `/pricing`. These already get traffic; making them rank
and convert is cheaper than any new article.

**Phase 2 — first 12 posts (week 3–10, 2/week).** Order chosen for fastest
indexing signal and clearest revenue line:
1. Passé composé vs imparfait *(book)*
2. CEFR levels explained *(platform)*
3. Être or avoir *(book)*
4. Online French tutors *(lessons)*
5. How long does it take to learn French *(platform)*
6. 15 French grammar mistakes *(book)*
7. How to practise speaking French alone *(lessons)*
8. French object pronouns *(book)*
9. A1 French level *(platform)*
10. What a French tutor costs *(lessons)*
11. The French subjunctive *(book)*
12. 100 most common French words *(library)*

**Phase 3 — pillars + comparisons (week 10+).** `/learn/french` hub and the
three sub-pillars once the spokes exist to link up into them. Then the
competitive comparison pages (`duolingo alternatives`, `preply alternatives`),
which need domain authority to land.

**Phase 4 — second language.** Only after French clears ~1,000 organic
sessions/month. The architecture above is language-namespaced so Spanish drops
in without a rebuild.

---

## 10. Measurement

- Week 0: GSC + GA4 on both hosts, sitemaps submitted, `/seo-audit` baseline
  saved for drift comparison.
- Weeks 2–6 (leading): pages indexed, first impressions per cluster.
- Months 2–4: clicks per cluster, position for target queries.
- Months 3–6 (lagging): **the only metric that matters** — organic → book
  purchases, organic → first tutor booking, organic → subscription. Tracked per
  landing page in GA4.
- AEO tracking: monthly manual check of the 12 target queries in ChatGPT,
  Perplexity and Google AI Overviews — are we named?
