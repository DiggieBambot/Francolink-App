import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Award,
  Clock,
  Globe,
  GraduationCap,
  MapPin,
  PlayCircle,
  Quote,
  Sparkles,
  Star,
} from "lucide-react";
import { CtaButton } from "@/components/site/ui";
import { AvailabilityTable } from "@/components/site/availability-table";
import { SlotPicker } from "@/components/site/slot-picker";
import { TutorTabs } from "@/components/site/tutor-tabs";
import { Collapsible } from "@/components/site/collapsible";
import { getPublicTutor, getPublicTutorSlugs } from "@/lib/site/queries";
import { getBookableSlots } from "@/lib/booking/availability";
import { LANGUAGE_LABEL, embedVideoUrl } from "@/lib/site/format";
import { TIER_BLURB, TIER_LABEL, getPricingByTier } from "@/lib/site/pricing";
import { appUrl, siteUrl } from "@/lib/site/hosts";

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return (await getPublicTutorSlugs()).map((slug) => ({ slug }));
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tutor = await getPublicTutor(slug);
  if (!tutor) return { title: "Tutor not found" };

  const languages = tutor.teaches
    .map((c) => LANGUAGE_LABEL[c] ?? c.toUpperCase())
    .join(", ");

  return {
    title: `${tutor.name} — ${languages} tutor`,
    description:
      tutor.headline ||
      `Book a lesson with ${tutor.name}, a certified ${languages} tutor on FrancoLink. See qualifications, specialities and weekly availability.`,
    alternates: { canonical: `/tutors/${tutor.slug}` },
    openGraph: {
      type: "profile",
      title: `${tutor.name} — ${languages} tutor | FrancoLink`,
      description: tutor.headline ?? undefined,
      url: siteUrl(`/tutors/${tutor.slug}`),
      images: tutor.photo_url ? [tutor.photo_url] : undefined,
    },
  };
}

export default async function TutorProfilePage({ params }: PageProps) {
  const { slug } = await params;
  const [tutor, allPricing] = await Promise.all([
    getPublicTutor(slug),
    getPricingByTier(),
  ]);
  if (!tutor) notFound();
  // Prices are still needed by the slot picker — the visitor sees what a slot
  // costs at the moment they book it, and nowhere else on the profile.
  const pricing = allPricing[tutor.tier];

  // Real bookable slots, not just the weekly rules — excludes time off,
  // existing bookings and the minimum notice.
  const availability = await getBookableSlots(tutor.user_id);

  const languages = tutor.teaches.map((c) => LANGUAGE_LABEL[c] ?? c.toUpperCase());
  // Average of the ratings students actually left. No ratings, no stars.
  const rated = tutor.testimonials
    .map((t) => t.rating)
    .filter((r): r is number => typeof r === "number");
  const rating = rated.length
    ? {
        average: rated.reduce((sum, r) => sum + r, 0) / rated.length,
        count: rated.length,
      }
    : null;

  // Tutors paste share links; YouTube won't frame those. Normalise or skip.
  const videoUrl = embedVideoUrl(tutor.intro_video_url);
  // Joining a tutor's class happens in the app, via their invite code.
  const bookHref = tutor.invite_code
    ? appUrl(`/join/${tutor.invite_code}`)
    : appUrl("/signup");

  // Rich result for the tutor as a person offering a service.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: tutor.name,
    jobTitle: `${languages.join(" / ")} tutor`,
    description: tutor.headline || tutor.bio || undefined,
    image: tutor.photo_url || undefined,
    url: siteUrl(`/tutors/${tutor.slug}`),
    knowsLanguage: [...tutor.teaches, ...tutor.speaks],
    worksFor: { "@type": "Organization", name: "FrancoLink", url: siteUrl("/") },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ------------------------------------------------------------- HEADER */}
      {/* The profile reads as a stack of panels rather than a flowing page:
          the header is its own white card sitting on the tinted band, the way
          NativeCamp's tutor detail page frames the tutor before anything else. */}
      <div className="bg-primary-50 border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 sm:pt-10 sm:pb-14">
          <Link
            href="/tutors"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            All tutors
          </Link>

          <div className="p-6 sm:p-8 rounded-3xl bg-white border border-gray-100 shadow-medium flex flex-col lg:flex-row gap-7 lg:gap-9 items-start">
            <div className="flex flex-col sm:flex-row gap-7 items-start flex-1 min-w-0 w-full">
            <div className="shrink-0">
              {tutor.photo_url ? (
                <Image
                  src={tutor.photo_url}
                  alt={tutor.name}
                  width={144}
                  height={144}
                  className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl object-cover shadow-medium"
                  priority
                />
              ) : (
                <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-primary flex items-center justify-center text-5xl font-heading font-extrabold text-white">
                  {tutor.name.charAt(0).toUpperCase()}
                </div>
              )}

              {/* Only shown when real students have actually rated lessons —
                  this page used to carry a hardcoded 5.0 for everyone, and an
                  invented score is worse than no score. */}
              {rating && (
                <div className="mt-3 w-32 sm:w-36 text-center">
                  <div
                    className="relative inline-block"
                    role="img"
                    aria-label={`Rated ${rating.average.toFixed(1)} out of 5 from ${rating.count} ${rating.count === 1 ? "review" : "reviews"}`}
                  >
                    <div className="flex gap-0.5 text-gray-200">
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Star key={i} className="w-4 h-4 fill-current" />
                      ))}
                    </div>
                    {/* Gold layer clipped to the score, so 4.3 reads as 4.3. */}
                    <div
                      className="absolute inset-0 flex gap-0.5 overflow-hidden text-secondary"
                      style={{ width: `${(rating.average / 5) * 100}%` }}
                    >
                      {[0, 1, 2, 3, 4].map((i) => (
                        <Star key={i} className="w-4 h-4 shrink-0 fill-current" />
                      ))}
                    </div>
                  </div>
                  <p className="mt-1 text-sm">
                    <span className="font-heading font-extrabold text-primary">
                      {rating.average.toFixed(1)}
                    </span>
                    <span className="text-gray-500">
                      {" "}
                      ({rating.count})
                    </span>
                  </p>
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-primary tracking-tight">
                  {tutor.name}
                </h1>
                <span className="px-2.5 py-1 rounded-lg bg-primary-50 text-primary text-[11px] font-bold uppercase tracking-wide">
                  {TIER_LABEL[tutor.tier]}
                </span>
                {tutor.trial_available && (
                  <span className="px-2.5 py-1 rounded-lg bg-success-light text-green-700 text-[11px] font-bold">
                    Takes first lessons
                  </span>
                )}
              </div>
              {tutor.headline && (
                <p className="mt-3 text-lg text-gray-600 leading-relaxed">
                  {tutor.headline}
                </p>
              )}

              <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm text-gray-600">
                {tutor.country && (
                  <span className="inline-flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-secondary" />
                    {tutor.country}
                  </span>
                )}
                {tutor.years_experience != null && (
                  <span className="inline-flex items-center gap-1.5">
                    <Award className="w-4 h-4 text-secondary" />
                    {tutor.years_experience} years teaching
                  </span>
                )}
                {tutor.speaks.length > 0 && (
                  <span className="inline-flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-secondary" />
                    Speaks{" "}
                    {tutor.speaks
                      .map((c) => LANGUAGE_LABEL[c] ?? c.toUpperCase())
                      .join(", ")}
                  </span>
                )}
                {tutor.timezone && (
                  <span className="inline-flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-secondary" />
                    {tutor.timezone}
                  </span>
                )}
              </div>

              <div className="mt-7 flex flex-col sm:flex-row items-stretch gap-3">
                <a
                  href="#book"
                  className="text-center px-6 py-3.5 rounded-xl bg-primary text-white font-heading font-bold hover:bg-primary-600 transition-colors"
                >
                  Reserve a lesson
                </a>
                <a
                  href={bookHref}
                  className="text-center px-6 py-3.5 rounded-xl border-2 border-primary-100 text-primary font-heading font-bold hover:bg-primary-50 transition-colors"
                >
                  Register free
                </a>
              </div>
            </div>
            </div>

            {/* The introduction sits inside the card, not in a section further
                down: a tutor's video is the thing that decides the booking, and
                it was below the fold on every screen we tried. */}
            {videoUrl && (
              // ~60% wider than it was, capped at 45% of the card so the name
              // and CTAs keep a usable column next to it.
              <div className="w-full lg:w-[34rem] lg:max-w-[45%] shrink-0">
                <div className="aspect-video rounded-2xl overflow-hidden bg-gray-100 border border-gray-100">
                  <iframe
                    src={videoUrl}
                    title={`${tutor.name} introduction video`}
                    allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
                <p className="mt-2 flex items-center gap-1.5 text-xs font-semibold text-gray-500">
                  <PlayCircle className="w-4 h-4 text-secondary" />
                  Meet {tutor.name.split(" ")[0]} in 60 seconds
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------- BODY */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid gap-8 lg:grid-cols-3 items-start">
        <div className="lg:col-span-2 space-y-6">
          {/* Four things a visitor might have come for, one click apart. Each
              tab is always present — an empty one says "nothing here yet",
              which is information too, and keeps the profile shape stable. */}
          <TutorTabs
            tabs={[
              {
                id: "about",
                label: `About ${tutor.name.split(" ")[0]}`,
                content: tutor.bio ? (
                  <Collapsible moreLabel="Read full bio">
                    <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                      {tutor.bio}
                    </div>
                  </Collapsible>
                ) : (
                  <p className="text-gray-500">
                    {tutor.name.split(" ")[0]} hasn&apos;t written a biography
                    yet. Book a first lesson and ask them directly.
                  </p>
                ),
              },
              {
                id: "certifications",
                label: "Certifications",
                badge: tutor.qualifications.length || undefined,
                content:
                  tutor.qualifications.length > 0 ? (
                    <ul className="space-y-4">
                      {tutor.qualifications.map((q, i) => (
                        <li
                          key={`${q.title}-${i}`}
                          className="flex gap-4 p-5 rounded-2xl bg-primary-50/60 border border-primary-100"
                        >
                          <GraduationCap className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
                          <div>
                            <p className="font-heading font-bold text-primary">
                              {q.title}
                            </p>
                            {(q.issuer || q.year) && (
                              <p className="text-sm text-gray-500 mt-0.5">
                                {[q.issuer, q.year].filter(Boolean).join(" · ")}
                              </p>
                            )}
                          </div>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-gray-500">
                      No teaching certificate is on file for{" "}
                      {tutor.name.split(" ")[0]} — which is why they teach in the{" "}
                      {TIER_LABEL[tutor.tier].toLowerCase()} tier.
                    </p>
                  ),
              },
              {
                id: "experience",
                label: "Experience",
                content: (
                  <div className="space-y-6">
                    <dl className="grid gap-4 sm:grid-cols-3">
                      {[
                        {
                          icon: <Award className="w-4 h-4 text-secondary" />,
                          term: "Teaching experience",
                          value:
                            tutor.years_experience != null
                              ? `${tutor.years_experience} years`
                              : "Not stated",
                        },
                        {
                          icon: <Globe className="w-4 h-4 text-secondary" />,
                          term: "Speaks",
                          value:
                            tutor.speaks.length > 0
                              ? tutor.speaks
                                  .map((c) => LANGUAGE_LABEL[c] ?? c.toUpperCase())
                                  .join(", ")
                              : "Not stated",
                        },
                        {
                          icon: <Clock className="w-4 h-4 text-secondary" />,
                          term: "Teaches from",
                          value: tutor.timezone ?? "Not stated",
                        },
                      ].map((f) => (
                        <div
                          key={f.term}
                          className="p-4 rounded-2xl bg-gray-50 border border-gray-100"
                        >
                          <dt className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-gray-500">
                            {f.icon}
                            {f.term}
                          </dt>
                          <dd className="mt-1.5 font-heading font-bold text-primary">
                            {f.value}
                          </dd>
                        </div>
                      ))}
                    </dl>

                    <div>
                      <h3 className="font-heading font-bold text-primary mb-2">
                        {TIER_LABEL[tutor.tier]}
                      </h3>
                      <p className="text-gray-600 leading-relaxed">
                        {TIER_BLURB[tutor.tier]}
                      </p>
                    </div>

                    <div>
                      <h3 className="font-heading font-bold text-primary mb-3">
                        Usual teaching week
                      </h3>
                      <AvailabilityTable
                        slots={tutor.availability}
                        timezone={tutor.timezone}
                      />
                    </div>
                  </div>
                ),
              },
              {
                id: "subjects",
                label: "Subjects",
                badge: tutor.specialties.length || undefined,
                content: (
                  <div className="space-y-6">
                    <div>
                      <h3 className="font-heading font-bold text-primary mb-3">
                        Teaches
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {languages.map((label) => (
                          <span
                            key={label}
                            className="px-3 py-1.5 rounded-lg bg-primary-50 text-primary text-sm font-semibold"
                          >
                            {label}
                          </span>
                        ))}
                      </div>
                    </div>

                    {tutor.levels.length > 0 && (
                      <div>
                        <h3 className="font-heading font-bold text-primary mb-3">
                          Levels
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {tutor.levels.map((l) => (
                            <span
                              key={l}
                              className="px-3 py-1.5 rounded-lg bg-secondary-50 text-secondary-700 text-sm font-semibold"
                            >
                              {l}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h3 className="font-heading font-bold text-primary mb-3">
                        Specialities
                      </h3>
                      {tutor.specialties.length > 0 ? (
                        <ul className="grid gap-2 sm:grid-cols-2">
                          {tutor.specialties.map((sp) => (
                            <li
                              key={sp}
                              className="flex items-start gap-2 text-sm text-gray-600 p-3 rounded-xl bg-gray-50 border border-gray-100"
                            >
                              <Sparkles className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                              {sp}
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-gray-500">
                          General lessons, no declared speciality.
                        </p>
                      )}
                    </div>
                  </div>
                ),
              },
              {
                id: "reviews",
                label: "Reviews",
                badge: tutor.testimonials.length || undefined,
                content:
                  tutor.testimonials.length > 0 ? (
                    <div className="space-y-5">
                      {tutor.testimonials.map((t) => (
                        <figure
                          key={t.id}
                          className="p-6 rounded-2xl bg-primary-50 border border-primary-100"
                        >
                          <Quote className="w-6 h-6 text-secondary mb-3" />
                          <blockquote className="text-gray-700 leading-relaxed">
                            {t.quote}
                          </blockquote>
                          <figcaption className="mt-4 text-sm font-bold text-primary">
                            {t.author_name}
                            {t.author_role && (
                              <span className="font-normal text-gray-500">
                                {" "}
                                · {t.author_role}
                              </span>
                            )}
                          </figcaption>
                        </figure>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      No student review yet. Reviews here come from real,
                      completed lessons — we don&apos;t write them ourselves.
                    </p>
                  ),
              },
            ]}
          />

          <section
            id="book"
            className="p-6 sm:p-8 rounded-2xl bg-white border border-gray-100 shadow-soft scroll-mt-28"
          >
            <h2 className="font-heading font-extrabold text-2xl text-primary mb-5">
              Pick a time
            </h2>
            {availability.slots.length > 0 ? (
              <SlotPicker
                slots={availability.slots}
                tutorTimezone={availability.timezone}
                tutorName={tutor.name}
                tutorSlug={tutor.slug}
                prices={pricing.lessons}
                trial={pricing.trial}
                trialAvailable={tutor.trial_available}
                appUrl={appUrl("")}
                profileUrl={siteUrl(`/tutors/${tutor.slug}`)}
              />
            ) : (
              // No open slots — fall back to showing the weekly pattern so the
              // profile still says something useful about when they teach.
              <AvailabilityTable
                slots={tutor.availability}
                timezone={tutor.timezone}
              />
            )}
          </section>
        </div>

        {/* ------------------------------------------------------------ ASIDE */}
        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-soft">
            <h3 className="font-heading font-bold text-primary mb-1">
              Reserve a lesson
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-5">
              Pick any open time below — you&apos;ll create your account as you
              book.
            </p>
            <a
              href="#book"
              className="block text-center px-5 py-3 rounded-xl bg-primary text-white font-heading font-bold hover:bg-primary-600 transition-colors"
            >
              See open times
            </a>
            <a
              href={bookHref}
              className="block mt-2.5 text-center px-5 py-3 rounded-xl border-2 border-primary-100 text-primary font-heading font-bold hover:bg-primary-50 transition-colors"
            >
              Register free
            </a>
          </div>

          <div className="p-6 rounded-2xl bg-primary text-white">
            <h3 className="font-heading font-bold text-lg mb-2">
              Lessons happen in the app
            </h3>
            <p className="text-sm text-primary-100 leading-relaxed mb-5">
              Create your free FrancoLink account, join {tutor.name.split(" ")[0]}
              &apos;s class, and your first lesson room is ready — whiteboard,
              exercises and homework included.
            </p>
            <CtaButton
              href={bookHref}
              variant="secondary"
              external
              className="w-full"
            >
              Register free
            </CtaButton>
          </div>
        </aside>
      </div>
    </>
  );
}
