# FrancoLink — SEO Content Plan

> Goal: build organic search traffic that converts into signups, without trying
> to beat Duolingo/Babbel on head terms. Strategy = long-tail informational
> content (the engine) + commercial-intent pages (the conversion) + the lesson
> library (programmatic), all interlinked into topic clusters.

## 0. Targeting & ground rules

- **Audience:** English-speaking learners of **French** and **Spanish** first
  (largest demand, UI default is English), German/English-learners second.
- **Don't chase:** "learn french", "learn spanish", "language app" — owned by
  9-figure incumbents. We win the **specific questions** they under-serve.
- **Validate volumes** before writing at scale: Google Search Console (once
  live), Keyword Planner, or the DataForSEO extension. Difficulty below is an
  editorial estimate, not measured data.
- **Every article** ends with one contextual CTA into the product
  (placement test, the matching lesson, or pricing) — content earns the click,
  the CTA captures it.

## 1. Site architecture (hub-and-spoke)

Build a content hub. Recommended path: a `/learn` blog (or extend `/library`).
When the apex marketing site ships later, the **pillars** can move there;
keep product pages (pricing, library) on the app subdomain. Use canonicals so
the two domains never compete for the same query.

```
/learn/french           ← PILLAR (hub)
   ├── /learn/french/introduce-yourself
   ├── /learn/french/greetings
   ├── /learn/french/numbers
   └── …spokes link UP to the pillar + sideways to 2 siblings + into a lesson
/learn/spanish          ← PILLAR
   └── …spokes
/learn/cefr-levels      ← PILLAR (methodology, cross-language, product-aligned)
   └── …spokes
```

## 2. Cluster A — Learn French (English speakers)

| Target keyword | Intent | Diff | Stage | Suggested title | Primary CTA |
|---|---|---|---|---|---|
| how to learn french (beginner guide) | info | Med | TOFU | How to Learn French: A Step-by-Step Beginner's Guide | placement test |
| how to introduce yourself in french | info | Low | TOFU | How to Introduce Yourself in French (with audio) | A1 lesson |
| french greetings | info | Low | TOFU | 30 French Greetings for Every Situation | A1 lesson |
| 100 most common french words | info | Low | TOFU | The 100 Most Common French Words to Learn First | library |
| french numbers 1–100 | info | Low | TOFU | French Numbers 1–100: How to Count in French | A1 lesson |
| days of the week in french | info | Low | TOFU | Days of the Week & Months in French | A1 lesson |
| être and avoir conjugation | info | Low | MOFU | Être & Avoir: The Two French Verbs to Learn First | lesson |
| how long does it take to learn french | info | Med | MOFU | How Long Does It Really Take to Learn French? | placement test |
| french pronunciation guide | info | Med | TOFU | French Pronunciation for Beginners (sounds + rules) | AI partner |
| common french travel phrases | info | Low | TOFU | 50 French Phrases You Need for Travel | library |

## 3. Cluster B — Learn Spanish (English speakers)

| Target keyword | Intent | Diff | Stage | Suggested title | Primary CTA |
|---|---|---|---|---|---|
| how to learn spanish (beginner guide) | info | Med | TOFU | How to Learn Spanish: A Beginner's Roadmap | placement test |
| how to introduce yourself in spanish | info | Low | TOFU | How to Introduce Yourself in Spanish | A1 lesson |
| spanish greetings | info | Low | TOFU | Spanish Greetings: Hello, Goodbye & Beyond | A1 lesson |
| 100 most common spanish words | info | Low | TOFU | The 100 Most Common Spanish Words | library |
| ser vs estar | info | Med | MOFU | Ser vs Estar: The Rule That Finally Makes Sense | lesson |
| spanish numbers 1–100 | info | Low | TOFU | Spanish Numbers 1–100 | A1 lesson |
| how long to learn spanish | info | Med | MOFU | How Long Does It Take to Learn Spanish? | placement test |
| common spanish travel phrases | info | Low | TOFU | 50 Spanish Phrases for Travelers | library |

## 4. Cluster C — Method & CEFR (product-aligned, cross-language)

| Target keyword | Intent | Diff | Stage | Suggested title | Primary CTA |
|---|---|---|---|---|---|
| cefr levels explained | info | Med | MOFU | CEFR Levels Explained: A1 to C2 (with examples) | placement test |
| what is a1 level | info | Low | MOFU | What Is A1 Level? What You Can Actually Do | placement test |
| how to know my language level | info | Low | BOFU | How to Find Your Language Level (free test) | **placement test** |
| how to practice speaking a language alone | info | Med | MOFU | How to Practice Speaking When You Have No One to Talk To | **AI partner** |
| spaced repetition language learning | info | Med | MOFU | Spaced Repetition: Why You Forget Words & How to Fix It | signup |
| how many words to be fluent | info | Med | TOFU | How Many Words Do You Need to Be Fluent? | library |

## 5. Commercial / bottom-of-funnel pages (highest conversion)

| Target keyword | Intent | Diff | Suggested title | Notes |
|---|---|---|---|---|
| online french tutor | commercial | Med | Online French Tutors — Learn with Certified Teachers | tutor product page |
| online spanish tutor | commercial | Med | Online Spanish Tutors | tutor product page |
| best apps to learn french | commercial | High | 7 Best Apps to Learn French in 2026 | listicle, include FrancoLink honestly |
| duolingo alternatives | commercial | High | 8 Best Duolingo Alternatives | comparison; lean on tutors + AI speaking |
| babbel alternatives | commercial | Med | Babbel Alternatives Worth Trying | comparison |
| apps to practice speaking with ai | commercial | Med | Best Apps to Practice Speaking a Language with AI | your differentiator |

> Comparison/alternatives pages convert well but are competitive — write them
> *after* the cluster foundations give the domain some authority.

## 6. First 90 days — priority order

Pick quick wins (low difficulty, high intent) first to get early indexing
signals, then build pillars.

1. CEFR levels explained (pillar C) — strong product tie-in
2. How to find your language level → **placement test** (BOFU, easy)
3. How to introduce yourself in French (easy win)
4. How to introduce yourself in Spanish (easy win)
5. 100 most common French words
6. 100 most common Spanish words
7. How to learn French (pillar A)
8. How to learn Spanish (pillar B)
9. How to practice speaking alone → **AI partner**
10. French greetings
11. Spanish greetings
12. Online French tutor (first commercial page)

Cadence: 2 articles/week sustains momentum. Refresh top performers quarterly.

## 7. On-page checklist (every article)

- One H1 = the primary keyword phrased naturally; question-based H2s.
- First 100 words answer the query directly (AI Overview / featured-snippet bait).
- 800–1,500 words for spokes, 2,000+ for pillars; depth over padding.
- Unique title (≤60 chars) + meta description (≤155 chars) — set via the page's
  `generateMetadata` (the new `metadataBase`/OG defaults handle the rest).
- `Article` schema (author, datePublished); add `Course`/`LearningResource`
  schema on lesson pages.
- 1 contextual CTA into the product, plus the internal links below.
- Real audio/examples where relevant (you already have TTS — a differentiator).

## 8. Internal linking rules

- Every **spoke** links: ↑ to its pillar, → to 2 sibling spokes, → 1 lesson/product page.
- Every **pillar** links ↓ to all its spokes and → to the relevant product page.
- Use descriptive anchor text (the target keyword), never "click here".

## 9. Measurement

- **Google Search Console** (set up day 1): track impressions → clicks → position
  per cluster. Submit `sitemap.xml`.
- **GA4:** organic sessions → signup conversion rate per landing page.
- Leading indicator (weeks 2–6): pages indexed + first impressions.
- Lagging indicator (months 3–6): clicks, then signups from organic.

## 10. AI search (GEO) — low effort, growing upside

- Keep answers extractable (the "answer first" rule above) so ChatGPT/Perplexity/
  AI Overviews cite you.
- Add an `llms.txt` and ensure AI crawlers aren't blocked in `robots.ts`
  (they currently aren't).
- Brand-mention plays: get listed in "best apps to learn X" roundups.
