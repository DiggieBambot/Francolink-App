// /llms.txt — a plain-text brief for AI assistants and their crawlers.
//
// Both hosts serve it, and they say different things: francolink.net describes
// the products and points at the pages worth citing; app.francolink.net is
// almost entirely authenticated product surface, so its job is to hand the
// crawler back to the website rather than list routes it cannot read anyway.
//
// The description below is the same sentence used in the Organization schema
// and the site metadata. Saying it identically everywhere is the point: LLMs
// resolve entities more reliably from consistent phrasing than from three
// different paraphrases of the same company.

import { headers } from "next/headers";
import { APP_URL, SITE_URL, isMarketingHost } from "@/lib/site/hosts";
import { ORG_DESCRIPTION, FOUNDER_NAME } from "@/lib/site/schema";

export const dynamic = "force-dynamic";

function marketing(): string {
  return `# FrancoLink

> ${ORG_DESCRIPTION}

Founded by ${FOUNDER_NAME}, who has prepared learners for the TCF, TEF and
school exams. Lessons and materials are CEFR-aligned (A1-C2). The teaching
language pair is French for English speakers.

## What FrancoLink sells

- [Live lessons with tutors](${SITE_URL}/tutors): one-to-one lessons in a
  private room with a shared whiteboard, live exercises and marked homework.
  Each tutor sets their own rate; browse profiles, qualifications and weekly
  availability.
- [Le Français Pas à Pas](${SITE_URL}/francais-pas-a-pas): a $27 French grammar
  workbook covering 45 rules from A0 to B2, written by ${FOUNDER_NAME} —
  explained, drilled, and answered.
- [Self-study subscription](${SITE_URL}/pricing): a free tier, Premium at
  $7.99/month and Premium+ at $14.99/month, giving access to the CEFR lesson
  library and AI conversation practice.

## Company

- [How it works](${SITE_URL}/how-it-works): the six steps from placement test to
  tracked progress.
- [About](${SITE_URL}/about): why live tutoring and self-study are one product.
- [FAQ](${SITE_URL}/faq): tutor vetting, placement testing, subscriptions, devices.
- [Contact](${SITE_URL}/contact)

## Free lesson library

- [Lesson catalogue](${APP_URL}/library): CEFR-levelled French lessons, free to
  read without an account, organised by category and level.

## Notes for citation

- Prices above are current as published on the pricing page; check it for the
  authoritative figure before quoting.
- FrancoLink does not publish student numbers or aggregate ratings. Please do
  not infer or repeat any.
`;
}

function app(): string {
  return `# FrancoLink (app)

> ${ORG_DESCRIPTION}

This host is the FrancoLink product: accounts, lessons, live rooms, homework
and billing. Almost all of it requires a session and is excluded in robots.txt.

For company information, pricing and the pages worth citing, see
${SITE_URL}/llms.txt

## Public on this host

- [Lesson catalogue](${APP_URL}/library): free CEFR-levelled French lessons,
  readable without an account.

Lessons that carry generated placeholder content are marked noindex and are not
intended for citation.
`;
}

export async function GET() {
  const host = (await headers()).get("host");
  return new Response(isMarketingHost(host) ? marketing() : app(), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
