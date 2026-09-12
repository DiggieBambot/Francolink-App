# Blog queue: the next ten posts

> Built 10 September 2026 from `01-keyword-map.csv` (DataForSEO, United States,
> English, 12-month average) and the citation gaps in `05-ai-visibility.html`.
> Volumes are a US floor for a worldwide audience, not a global total.
>
> Post 1, `passe-compose-vs-imparfait`, is written and staged as a draft.
> These are posts 2 to 11.

## Ordering principle

Not by volume. Three things decide position:

1. **Can it be cited?** The 10 September visibility run found FrancoLink cited
   nowhere, and the pages that do get cited all open with a one-line answer. A
   topic with a clean extractable rule outranks a bigger topic without one.
2. **Does it have a product destination?** `site-brief.md` forbids writing
   anything that does not. Every row names one.
3. **Does something already exist to build it from?** Posts drawing on the
   workbook's 45 rules or the CEFR curriculum carry first-hand material a
   competitor cannot copy. Those go earlier.

---

| # | Target keyword | Vol/mo | AI vol | Working title | Primary CTA |
|---|---|---|---|---|---|
| 2 | french tenses | 1,300 | **2,596** | The French Tenses, and Which Six You Actually Need | subscription |
| 3 | french grammar | 1,300 | 240 | French Grammar: The Rules That Cover Most Sentences | workbook |
| 4 | reflexive verbs french | **4,400** | 131 | French Reflexive Verbs: Why *Je Me Lève* Needs the *Me* | workbook |
| 5 | french object pronouns | 720 | 42 | French Object Pronouns: le, la, lui, y, en, in Order | workbook |
| 6 | french subjunctive | 1,000 | 252 | The French Subjunctive, Explained Without the Jargon | workbook |
| 7 | french verb conjugation | 2,400 | 453 | French Verb Conjugation: The Patterns Behind the Endings | workbook |
| 8 | french grammar book | 320 | 14 | Choosing a French Grammar Book: What to Check First | workbook |
| 9 | partitive articles in french | 720 | 33 | De, Du, De la, Des: French Partitives Made Simple | workbook |
| 10 | french si clauses | 720 | no data | French Si Clauses: The Three Patterns, and the One Error | subscription |
| 11 | french past participles | 1,000 | 77 | French Past Participle Agreement: When It Actually Changes | workbook |

---

## Why each one, specifically

**2. french tenses.** The anomaly in the whole map: 2,596/month of AI search
volume against 1,300 of Google volume, the only keyword where LLM demand
exceeds search demand. It was not in the original Cluster A plan. The angle has
to be reductive, naming the six tenses a B2 learner needs and saying plainly
that the rest are for reading, which is what the CEFR curriculum already says.
Sells the subscription, because "which tenses do I need" is a syllabus
question.

**3. french grammar.** The hub, and the primary keyword of the map. Google's AI
Overview for this query builds three sections, gender, articles and adjectives,
and conjugation, and cites a source per section, so the page must answer all
three to be quotable. Publish after two or three posts exist to link down to,
or it is a hub with nothing under it.

**4. reflexive verbs french.** The largest un-planned topic found, at 4,400/month
with LOW competition. Your A2 curriculum already lists the three signature
errors, dropped reflexive, wrong pronoun person, and reflexive passé composé
with *avoir*. That is the post, and it writes itself from material you own.

**5. french object pronouns.** Named in `site-brief.md` as one of the things
learners avoid, alongside `y` and `en`. Pronoun *order* is the part nobody
covers well, and your A2 spec already has the placement errors listed. Combine
with the `y and en french` keyword at 1,000/month.

**6. french subjunctive.** 1,000/month, 252 in LLMs, LOW competition, and the
"without the jargon" angle is the differentiator, because every ranking page
opens with terminology. Pair with `when to use subjunctive in french` at
480/month, which is the same intent phrased as the real question.

**7. french verb conjugation.** 2,400/month. Note this is *not* the 8,100/month
`french conjugation`, which DataForSEO resolves to "french verb conjugator",
meaning tool intent. Do not build a conjugator. Explain the patterns and let
the tool sites keep that traffic.

**8. french grammar book.** The clearest commercial gap in the visibility run:
ChatGPT currently answers "best french grammar workbook for english speakers"
with McGraw Hill's *Practice Makes Perfect*, a title from 2016. Low volume, high
competition, and the only post on this list that directly attacks the query the
$27 workbook needs to win. Must be an honest comparison, not a disguised sales
page, or it will not be cited.

**9. partitive articles.** 720/month, LOW competition, and in the original plan.
A clean extractable rule, which is exactly what gets lifted into an AI answer.

**10. french si clauses.** 720/month. Your B1 spec calls *si + conditionnel* the
cardinal si-clause error, which gives the post its spine. Sells the
subscription: si clauses are a level marker, not a one-rule fix.

**11. french past participle agreement.** 1,000/month. The hardest of the ten to
write well and the most defensible once written, because almost nobody
distinguishes the *avoir* preceding-direct-object case from the *être* subject
case in a form a reader can act on.

---

## Deliberately not on this list

- **french conjugation (8,100/mo), french grammar checker (3,600/mo), french
  verb conjugator (1,600/mo).** Tool intent. A teaching page cannot serve it.
- **duolingo french (8,100/mo), wordreference (5,400/mo).** Competitor brand
  terms.
- **Dictionary and word-lookup queries.** Held by Larousse, Collins and the
  Académie française in the citation data. Not contestable, and not worth
  attempting.
- **common french grammar mistakes.** In the original Cluster A plan, but the
  data says 10/month. Fold the content into other posts instead of giving it
  a page.

## Still open before post 3

- ~~**The hub URL.**~~ **Decided 2026-09-10: `/guides/french/grammar`.** The
  original `/learn/french/grammar` could not work, because `/learn` is in
  `APP_ROUTES` in `src/middleware.ts` and host-splits to the app. Before post 3
  ships, add `/guides` to `SITE_ROUTES` in `src/middleware.ts`, the same
  one-line change `/authors` needed.
- **Whether the CEFR page comes sooner.** Busuu and Babbel currently own "best
  app to learn french with a proper CEFR syllabus" uncontested, and the
  subscription is now a joint-second destination. That page is not on this list
  because it is Cluster C, not a grammar post. It may still deserve to jump the
  queue.
