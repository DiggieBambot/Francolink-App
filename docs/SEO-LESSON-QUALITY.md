# Lesson catalogue — quality lint results

Produced by `scripts/lint-lessons.mjs` against the 645 published lessons.
Read-only; nothing has been de-indexed yet.

```
node --env-file=.env.local scripts/lint-lessons.mjs            # report
node --env-file=.env.local scripts/lint-lessons.mjs --verbose  # list failures
node --env-file=.env.local scripts/lint-lessons.mjs --apply    # write verdicts
```

## Result

```
PASS 250   FAIL 395   (61% would be de-indexed)

  271  generator template prose
  248  vocab N% shared with an unrelated lesson
  127  under 150 unique words
   98  stub objective(s)
   23  all objectives identical
```

## The decisive finding: whole pages are templated, not just vocabulary

The vocabulary rule turned out to be a proxy for something larger. **266
lessons — 41% of the catalogue — contain the identical dialogue**, with only
the topic string substituted:

> **Teacher:** Let's talk about *{topic}*. What do you think?
> **Student:** I think *{topic}* is very interesting.

53 share the same reading passage opener ("*{topic}* is a topic that affects
many aspects of modern life…"). Section-by-section word counts are identical
across unrelated lessons: warmup 255, vocab-in-context 329, read-aloud 178.
These are not lessons with a bad vocabulary block — the whole page is one
template wearing a different topic's name.

271 lessons (42%) match at least one generator-template phrase. The lint now
checks these phrases directly: without that rule 27 templated lessons passed.

## Why this is a spam-policy question, not a quality-score question

Google's scaled content abuse policy covers generating many pages that add
little value, primarily to game search. 266 pages sharing one dialogue is a
central example. The exposure is a manual action or site-wide demotion — not
merely "these pages rank poorly".

## What the failures actually are

This is not a rendering bug. The vocabulary itself is placeholder content:

| Lesson | Level | Vocabulary taught |
|---|---|---|
| `a-day-at-the-zoo` | A2 kids | routine, schedule, habit, manage, day |
| `academic-writing-style` | **C1** | routine, schedule, habit, manage, academic, discuss |
| `adventure-and-risk` | B1 | routine, schedule, habit, manage, adventure, discuss |
| `a-phone-conversation` | A2 | routine, schedule, habit, manage, phone |
| `action-verbs` | A1 kids | routine, schedule, habit, manage |

The same four filler words, plus at most one or two topic words bolted on.
`action-verbs` — a lesson about verbs — teaches four nouns and nothing else.
A C1 academic-writing lesson teaches the vocabulary of an A1 daily-routine
lesson.

Measured across the catalogue:

| Check | Count | Share |
|---|---|---|
| Published lessons | 645 | |
| Contain all four filler words | **225** | 35% |
| …of which have ≤2 topic-specific words | **225** | 100% of the above |
| Vocabulary list duplicated within the page | **238** | 37% |
| No vocabulary at all | 57 | 9% |
| Objectives rendering as a bare "Vous" / repeated | 121 | 19% |

Filler lessons by level: A1 55 · A2 15 · **B1 123** · B2 24 · C1 8.

## Why this is bigger than SEO

These pages are served to paying students, not just to Googlebot. A B1 learner
opening "adventure and risk" is taught *routine, schedule, habit, manage*. The
SEO gate stops search engines indexing them; it does **not** fix the product.

The generation pipeline needs the real fix. The lint should then run as a CI
gate so this cannot silently return.

## Recommended sequence

1. Apply `supabase/migrations/20260908_lesson_seo_indexable.sql` (no-op on its
   own — the column defaults to true).
2. Run the lint with `--apply` to record verdicts.
3. Redeploy. The sitemap drops to ~277 lesson URLs and the 368 failures serve
   `noindex, follow` while staying fully available in the app.
4. Repair the generation pipeline, regenerate, re-run the lint. Lessons return
   to the index automatically as they start passing.

## Tuning

Thresholds are constants at the top of `scripts/lint-lessons.mjs`
(`MIN_SECTIONS`, `MIN_UNIQUE_WORDS`, `VOCAB_OVERLAP_LIMIT`). The vocabulary
check ignores lessons that share a topic tag, so legitimate overlap inside a
topic cluster is not penalised.
