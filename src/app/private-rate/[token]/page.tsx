// A private rate behind a secret link (20261002_private_pack_link.sql).
//
// Built for students moving from another platform: before it asks for money
// it has to answer "who, where, how". So, in order: the tutor they already
// know, the four steps, where lessons happen, the price, then the questions.
// English by default, French with ?lang=fr; the choice survives sign-up.
//
// Anyone with the URL sees the page, signed in or not. Buying still needs an
// account -- the lessons are credited to one -- so a signed-out visitor is sent
// to sign up and brought straight back here.
//
// A rotated or switched-off link 404s rather than explaining itself: a
// forwarded copy should look like nothing at all.

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronDown, Star } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getPrivatePackByToken } from "@/lib/credits/private-packs";
import { RATE_COPY, rateLang } from "@/lib/credits/private-rate-copy";
import { getPublicTutor, getPublicTutors } from "@/lib/site/queries";
import { siteUrl } from "@/lib/site/hosts";
import { PrivatePackPicker } from "@/components/student/private-pack-picker";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ lang?: string }>;
}

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { lang } = await searchParams;
  return {
    title: `${RATE_COPY[rateLang(lang)].title} | FrancoLink`,
    robots: { index: false, follow: false },
    // The token is the whole secret; don't hand it to every link they click.
    referrer: "no-referrer",
  };
}

export default async function PrivateRateLinkPage({ params, searchParams }: PageProps) {
  const [{ token }, { lang: langParam }] = await Promise.all([params, searchParams]);
  const lang = rateLang(langParam);
  const t = RATE_COPY[lang];

  const pack = await getPrivatePackByToken(token);
  if (!pack) notFound();

  const supabase = await createClient();
  const [{ data: { user } }, tutors] = await Promise.all([
    supabase.auth.getUser(),
    getPublicTutors(),
  ]);

  // Packs aren't tied to a tutor yet, because there is one. When there are
  // more, give starter_packs a tutor_id and read it here instead.
  const tutor = tutors[0] ? await getPublicTutor(tutors[0].slug) : null;
  const profileUrl = tutor ? siteUrl(`/tutors/${tutor.slug}`) : siteUrl("/tutors");

  const langQ = lang === "fr" ? "?lang=fr" : "";
  const here = `/private-rate/${token}${langQ}`;
  const next = `?next=${encodeURIComponent(here)}`;
  const other = lang === "fr" ? `/private-rate/${token}` : `/private-rate/${token}?lang=fr`;
  const days = pack.creditDays ?? 30;

  const rated = (tutor?.testimonials ?? []).filter((q) => q.rating != null);
  const quotes = (tutor?.testimonials ?? []).slice(0, 2);

  return (
    <div className="space-y-12">
      {/* Welcome */}
      <section>
        <div className="flex justify-end">
          <Link
            href={other}
            hrefLang={lang === "fr" ? "en" : "fr"}
            className="text-sm font-semibold text-secondary hover:underline"
          >
            {t.switchTo}
          </Link>
        </div>
        <h1 className="mt-2 font-heading font-extrabold text-3xl sm:text-4xl text-primary">
          {t.welcome}
        </h1>
        <p className="mt-3 text-gray-600 leading-relaxed">{t.welcomeBody}</p>

        {tutor && (
          <div className="mt-6 rounded-2xl bg-white border border-gray-100 p-5 flex gap-4 items-start">
            {tutor.photo_url ? (
              <Image
                src={tutor.photo_url}
                alt={tutor.name}
                width={80}
                height={80}
                className="w-20 h-20 rounded-2xl object-cover shrink-0"
                priority
              />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-primary flex items-center justify-center text-3xl font-heading font-extrabold text-white shrink-0">
                {tutor.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="min-w-0">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                {t.yourTutor}
              </div>
              <div className="font-heading font-bold text-lg text-primary">{tutor.name}</div>
              {tutor.headline && (
                <p className="text-sm text-gray-600 leading-snug">{tutor.headline}</p>
              )}
              <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-sm text-gray-500">
                {tutor.years_experience ? (
                  <span>{t.yearsTeaching(tutor.years_experience)}</span>
                ) : null}
                {rated.length > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    {(rated.reduce((s, q) => s + (q.rating ?? 0), 0) / rated.length).toFixed(1)}
                    {" · "}
                    {t.reviews(rated.length)}
                  </span>
                )}
                <a href={profileUrl} className="font-semibold text-secondary hover:underline">
                  {t.seeProfile}
                </a>
              </div>
            </div>
          </div>
        )}

        {quotes.length > 0 && (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {quotes.map((q) => (
              <figure key={q.id} className="rounded-2xl bg-white border border-gray-100 p-4">
                <blockquote className="text-sm text-gray-700 leading-relaxed line-clamp-4">
                  “{q.quote}”
                </blockquote>
                <figcaption className="mt-2 text-xs font-semibold text-gray-500">
                  {q.author_name}
                  {q.author_country ? `, ${q.author_country}` : ""}
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </section>

      {/* How it works */}
      <section>
        <h2 className="font-heading font-bold text-2xl text-primary">{t.howTitle}</h2>
        <ol className="mt-4 space-y-3">
          {t.steps.map((s, i) => (
            <li key={s.title} className="flex gap-4 rounded-2xl bg-white border border-gray-100 p-4">
              <span className="w-8 h-8 shrink-0 rounded-full bg-primary text-white font-heading font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <div>
                <div className="font-heading font-bold text-primary">{s.title}</div>
                <p className="text-sm text-gray-600 leading-relaxed">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Where lessons happen */}
      <section>
        <h2 className="font-heading font-bold text-2xl text-primary">{t.roomTitle}</h2>
        <p className="mt-2 text-gray-600 leading-relaxed">{t.roomBody}</p>

        {/* A sketch of the room, not a screenshot: a screenshot goes stale the
            first time the room changes, and this only has to say "lesson on
            the left, video on the right". */}
        <div
          aria-hidden
          className="mt-4 rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm"
        >
          <div className="flex items-center gap-1.5 px-3 py-2 border-b border-gray-100 bg-gray-50">
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            <span className="w-2.5 h-2.5 rounded-full bg-gray-300" />
            <span className="ml-2 h-4 flex-1 max-w-56 rounded bg-white border border-gray-200" />
          </div>
          <div className="grid grid-cols-[1fr_7rem] sm:grid-cols-[1fr_9rem] gap-3 p-3">
            <div className="rounded-xl bg-primary-50 p-3 space-y-2">
              <div className="h-3 w-2/3 rounded bg-primary/30" />
              <div className="h-2 w-full rounded bg-primary/15" />
              <div className="h-2 w-5/6 rounded bg-primary/15" />
              <div className="h-2 w-11/12 rounded bg-amber-300/70" />
              <div className="h-2 w-3/4 rounded bg-primary/15" />
              <div className="h-2 w-4/5 rounded bg-primary/15" />
            </div>
            <div className="space-y-2">
              <div className="aspect-video rounded-xl bg-gray-800" />
              <div className="aspect-video rounded-xl bg-gray-700" />
            </div>
          </div>
        </div>

        <ul className="mt-4 space-y-1.5 text-sm text-gray-700">
          {t.roomPoints.map((p) => (
            <li key={p} className="flex items-start gap-2">
              <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              {p}
            </li>
          ))}
        </ul>
      </section>

      {/* Price */}
      <section id="price">
        <h2 className="font-heading font-bold text-2xl text-primary">{t.priceTitle}</h2>
        <div className="mt-4">
          <PrivatePackPicker
            packs={[pack]}
            token={token}
            lang={lang}
            signupHref={user ? undefined : `/signup/student${next}`}
          />
        </div>
        {user ? (
          <p className="mt-4 text-sm text-gray-600">
            <a href={profileUrl} className="font-semibold text-secondary hover:underline">
              {t.bookNow}
            </a>
          </p>
        ) : (
          <p className="mt-4 text-sm text-gray-600">
            {t.haveAccount}{" "}
            <Link
              href={`/login/student${next}`}
              className="font-semibold text-secondary hover:underline"
            >
              {t.logIn}
            </Link>
          </p>
        )}
      </section>

      {/* Questions */}
      <section>
        <h2 className="font-heading font-bold text-2xl text-primary">{t.faqTitle}</h2>
        <div className="mt-4 divide-y divide-gray-100 rounded-2xl bg-white border border-gray-100">
          {t.faq(days).map((f) => (
            <details key={f.q} className="group p-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold text-primary">
                {f.q}
                <ChevronDown className="w-4 h-4 shrink-0 transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-2 text-sm text-gray-600 leading-relaxed">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  );
}
