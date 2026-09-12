# Site Brief — FrancoLink

> Read by: keyword-fanout-map · seo-content-writer · onpage-optimizer ·
> internal-link-architect · ai-visibility-checker
>
> Anything marked ⚠️ verify was inferred from the website and needs a human to
> confirm it. Anything marked ⚠️ NEEDS INPUT could not be determined at all.
>
> Last updated: 2026-09-08

---

## Part 1 — Business

- **Business name:** FrancoLink
- **Domain:** www.francolink.net (marketing) · app.francolink.net (product + public lesson library)
- **Industry / niche:** Online language learning — French-first, with English, Spanish and German listed; live tutoring marketplace + self-study app + a paid grammar workbook.
- **What they actually sell (one sentence):** ⚠️ verify — Three revenue lines: live lessons with vetted tutors (tutor-priced, per lesson), a $27 French grammar workbook ("Le Français Pas à Pas"), and a Premium/Premium+ subscription to the self-study CEFR app.
- **Price positioning:** ⚠️ verify — accessible/mid: free tier, $7/mo Premium ($5 billed yearly), $14/mo Premium+ ($10 yearly), $27 one-off workbook; lesson prices set by each tutor.

### Services or products

1. **Live lessons with certified tutors** — browse profiles, weekly availability, most offer a free trial lesson. `/tutors`, `/tutors/[slug]`
2. **Le Français Pas à Pas** — 95-page A0→B2 French grammar workbook, PDF + self-marking interactive version, $27. `/francais-pas-a-pas`
3. **Self-study platform subscription** — CEFR A1–C2 lessons, games, homework, placement test, AI conversation tutor, streaks. `/pricing`, `app.francolink.net/library`

**Money pages:**
- https://www.francolink.net/francais-pas-a-pas
- https://www.francolink.net/tutors
- https://www.francolink.net/pricing

### Service area

- **Primary location(s):** ⚠️ verify — none; fully remote/online, no physical location published.
- **Towns / suburbs / regions that matter:** None. No geo-targeting — do not write location pages or "french tutor near me" content.
- **Country for search data:** Worldwide — pull global volumes, no country filter.
- **Language for search data:** English.
- **Audience direction:** English speakers learning French, only. The `fr` and `ar` locales exist in the app but are **not** a content target; do not write Arabic-audience or French-speaker-learning-English content unless asked.

> These last two are load-bearing. Wrong values return wrong search volumes in
> every skill, with no error message.

### Competitors

**Primary set — grammar SERPs, the workbook's battleground:**
1. kwiziq.com
2. lawlessfrench.com
3. francaisauthentique.com

**Secondary — tutor marketplace (`/tutors`):**
4. italki.com
5. preply.com

**Secondary — subscription (`/pricing`):**
6. duolingo.com
7. babbel.com
8. busuu.com

### Goals

- **Primary goal:** Organic + AI-answer visibility that converts to paid customers. **Priority revenue line: the $27 workbook.** Grammar-intent content (Cluster A in `docs/seo-content-plan.md`) comes first. Content with no product destination does not get written.
- **Second destination, added 2026-09-10: the self-study subscription.** Every Cluster A page carries two exits, not one: the workbook for the reader who wants the rules drilled on paper, and a free account on the self-study app for the reader who wants the syllabus. Do not make the subscription the only CTA on a grammar page, and do not bury it either. Cluster C (CEFR and self-study) is promoted from third priority to joint second alongside tutors.
- **Stated target, set 2026-09-10:** 1,000 paying subscribers within 6 months, i.e. by 2027-03-10. Organic and AI visibility alone will not deliver this in that window; see the funnel arithmetic recorded on 2026-09-10. The SEO work is a compounding 12 to 24 month asset and should be judged on leading indicators (pages indexed, keywords ranking, free signups from organic), not on the subscriber count at month 6.
- **What a customer is worth, roughly:** Not established. Use the list price as the floor when judging whether a keyword is worth writing for: $27 for the workbook, $7/mo or $14/mo for a subscription, tutor-set for lessons.
- **What this business will NOT do:** ⚠️ verify — will not let tutors create student accounts on their behalf (GDPR/PECR); will not claim to be a native-speaker-only marketplace ("being a native speaker doesn't make someone a teacher").

### Proof and assets

- **Real numbers the business can claim:** ⚠️ verify — 48 published French grammar lessons (A1–B2); 95-page workbook with 45 rules, 45 graded exercises and a full answer key; six-part A0→B2 progression; CEFR A1–C2 lesson library; 5 kids' vocab games; free trial lesson from most tutors.
  **⚠️ DO NOT USE:** `5,000+ active learners`, `120+ tutors`, `50,000+ lessons delivered` and `4.9/5 student rating`. These were hardcoded placeholders contradicted by `/testimonials`. **Removed from the codebase on 2026-09-08** (the `STATS` constant, the `/pricing` trust badges and the auth-page line). Never reintroduce them in copy.
- **Case studies / results that actually exist:** None. `/testimonials` states there are no reviews yet; `src/lib/workbook/reviews.ts` is empty by design.
- **Certifications, awards, associations, memberships:** None at the business level. Founder-level: Njinu Precious Bambot is a Certified Bilingual Language Expert and Coach. Tutor-level: every tutor is checked for a teaching qualification, proven experience and a live teaching demo before their profile goes live.
- **Years in business / team size:** Not stated, and deliberately not to be claimed. Do not write "founded in", "X years of experience" or team-size copy.

### Author identity (for author bios and E-E-A-T)

- **Who is credited as author:** Njinu Precious Bambot
- **Their credentials, in one line:** Certified Bilingual Language Expert and Coach.
- **Build required:** no author entity, no `Person` schema and no `/authors/[slug]` page exist yet. The first post should ship with one.
- **Author page URL:** planned: `https://www.francolink.net/authors/[slug]` — not built

### The call to action

- **Primary CTA:** ⚠️ verify — differs by page: "Create a free account" (subscription), "Browse tutors" / book a free trial lesson (live lessons), buy the workbook ($27).
- **Where it points:** app.francolink.net signup · /tutors · /francais-pas-a-pas
- **What happens after the click:** ⚠️ verify — signup → onboarding (currently a live 50/50 A/B test: fast lesson-first flow vs. the 4-step flow) → placement test and dashboard. Tutor booking → tutor profile with rate and weekly availability.
- **Phone:** none published
- **Address (exactly as it should appear everywhere):** ⚠️ NEEDS INPUT — no address published. Contact is support@francolink.net, "we reply within one working day".

---

## Part 2 — Voice

### Tone in three words

Plain, structured, un-hyped.

### The reader

- **Who is reading:** ⚠️ verify — adult self-taught learners of French (roughly A0–B2) who have used apps and YouTube and still can't build a sentence; plus parents and exam candidates (TCF/TEF is answered in the workbook FAQ).
- **Reading level:** General adult, non-academic. Short paragraphs, concrete examples, French terms used in-line and explained.
- **What they are afraid of:** In the site's own words — freezing when it's time to build the sentence; forgetting a rule a month later; translating from English in their head; avoiding `y`, `en` and object pronouns; answers scattered across ten YouTube tabs and three apps. Also: paying for a tutor who turns out to be a chatty native speaker rather than a teacher.
- **What would make them trust this business:** A real syllabus with CEFR levels rather than a pile of exercises; explained answers, not just scores; verifiable tutor qualifications; being able to answer "what have I actually learned, and what's next?"

### Say / don't say

| Always | Never |
|--------|-------|
| CEFR levels (A1–C2), named and specific | Invented learner counts, ratings or "50,000+ lessons" |
| "certified tutors", "teaching qualification and a live teaching demo" | "native speakers" as the selling point |
| The rule *and the reason behind it* | "#1", "best", "world-class", any unearned superlative |
| Concrete French examples (`y`, `en`, `dont`, passé composé vs imparfait) | "Unlock your potential" / "language journey" filler |
| "practise" (British spelling as verb), plain verbs | Fake urgency, countdowns, "limited spots" |
| Name the gap and then fix it, side by side | Testimonials or star ratings until real ones exist |
| Say what the thing does | "journey", "unlock", "master (your) French" |
| Plain punctuation: full stops, commas, colons | **Em dashes ( — ) anywhere in published copy** |
| Honest timelines, or none | "effortless", "fluent in X weeks", "in just minutes a day" |

### Sentence style

- **Person:** First person plural for the business ("we select, interview and approve"), second person for the reader ("you freeze when it is time to build the sentence").
- **Contractions:** Yes, but sparingly — "doesn't", "you'll", "what's next" appear; long copy often stays uncontracted for emphasis.
- **Humour:** None. Dry at most.
- **Sentence length:** Short to medium. Frequent one-clause sentences used as a hammer ("Both, for one price.").
- **Punctuation — hard rule:** **no em dashes.** The existing site copy uses them heavily; new and rewritten copy must not. Break the sentence in two, or use a colon or a comma. Avoid the other AI tells too: no "It's not just X, it's Y", no "In today's world", no three-item rule-of-three in every paragraph, no bolded lead-ins on every bullet.
- **Anything structural to always do or never do:** Answer-first (the FAQ answers open with the answer, then the reason). Claims are always followed by their mechanism. Never open with a definition or a preamble.

### Words from the business's own mouth

> "Being a native speaker doesn't make someone a teacher."

> "A1 to C2 grammar, vocabulary and pronunciation built as a proper syllabus — not a random pile of exercises."

> "The answer key tells you why you were right or wrong — the part every app skips."

> "Live teaching and daily self-study are two halves of the same thing. We built both, and made them talk to each other."

> "Placement tests, coverage reports and progress tracking exist so you can answer one question at any moment: what have I actually learned, and what's next?"

> "Live rooms, not video calls."

---

## Technical state (as of 2026-09-08, from docs/SEO-ACTION-PLAN.md + live checks)

- Sitemap at `https://www.francolink.net/sitemap.xml` — **live, 200, valid XML**. `llms.txt` — **live, 200**.
- Canonical host is `https://www.francolink.net` (apex 308-redirects to www; `SITE_URL` now matches).
- Authority is split across two hosts: editorial on the apex, the ~650-URL public lesson library on `app.francolink.net`. Cross-host links are plain `<a>` with descriptive anchors — never canonical tricks, the two hosts never target the same query.
- `/blog` was a `noindex` stub with no post system; the plan is MDX at `content/blog/*.mdx` (directory is empty today). ⚠️ verify current state before recommending posts.
- Known open defects worth respecting: hundreds of library lesson pages have title-only metadata and generated objectives that render as a bare "Vous"; `images.unoptimized: true` in `next.config.ts`.

---

## Hard content rules

Things no skill may ever do on this site:

- Never use the hardcoded stats (`5,000+ learners`, `120+ tutors`, `50,000+ lessons`, `4.9/5`) or the phrase "#1 Best Online Language Learning Platform". They are unsubstantiated and are being removed.
- Never write or imply a testimonial, review count or star rating — there are none yet.
- Never sell on "native speakers"; FrancoLink's differentiator is *qualified teachers* and a CEFR syllabus.
- Never claim a learner count, a tutor count, a lessons-delivered figure, a star rating, a founding year or a team size. None of these are established.
- Never use "journey", "unlock", "master your French", "effortless", or "fluent in X weeks". (Removed from the codebase on 2026-09-08.)
- Never use an em dash in published copy.
- Never write location-targeted content. There is no service area.
- Never invent statistics, results, reviews or credentials.
- Never cite a source that was not fetched and confirmed in that run.
