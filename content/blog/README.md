# Blog posts

One MDX file per post. The filename is the slug: `passe-compose-vs-imparfait.mdx`
is served at `/blog/passe-compose-vs-imparfait`.

## Frontmatter

Every field below is required except `updated` and `draft`. A missing or
malformed field throws at build time rather than shipping a page with an empty
`<title>`.

```yaml
---
title: "Passé Composé vs Imparfait: The Rule That Finally Sticks"
description: "One sentence. Used as the meta description, the OG description and the standfirst under the H1."
date: "2026-09-15"          # ISO. A future date keeps the post unpublished.
updated: "2026-09-20"       # Optional. Defaults to `date`.
author: "njinu-precious-bambot"   # Must exist in src/lib/blog/authors.ts
primaryKeyword: "passe compose vs imparfait"   # From 01-keyword-map.csv
cluster: "Tenses"           # Label shown above the H1
cta: "workbook"             # workbook | subscription | tutors
draft: false                # Optional. true hides it in production.
---
```

`cta` names the *primary* exit. The reader always gets a second one as well:
the workbook and a free app account are both offered on every post, per
`site-brief.md` (2026-09-10).

## Drafts

`draft: true`, or a `date` in the future, hides a post in production but leaves
it visible in `npm run dev`. That is how you preview before publishing. Neither
the blog index nor the sitemap can list an unpublished post.

## Writing rules

Read `site-brief.md` before writing. The rules that get broken most often:

- **No em dashes.** Break the sentence, or use a colon or comma.
- No invented statistics, learner counts, ratings or testimonials.
- Never sell on "native speakers". The differentiator is qualified teachers.
- Answer-first: open with the answer, then the reason. The AI visibility run on
  2026-09-10 found every cited competitor doing exactly this.
- Start `## ` headings at h2. The h1 is rendered from `title`.
