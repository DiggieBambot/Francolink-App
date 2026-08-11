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
  Quote,
  Sparkles,
} from "lucide-react";
import { CtaButton } from "@/components/site/ui";
import { AvailabilityTable } from "@/components/site/availability-table";
import { getPublicTutor, getPublicTutorSlugs } from "@/lib/site/queries";
import { LANGUAGE_LABEL } from "@/lib/site/format";
import {
  TIER_BLURB,
  TIER_LABEL,
  formatPrice,
  getPricingByTier,
} from "@/lib/site/pricing";
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
  const pricing = allPricing[tutor.tier];

  const languages = tutor.teaches.map((c) => LANGUAGE_LABEL[c] ?? c.toUpperCase());
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
      <div className="bg-primary-50 border-b border-primary-100">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
          <Link
            href="/tutors"
            className="inline-flex items-center gap-2 text-sm font-semibold text-gray-600 hover:text-primary mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            All tutors
          </Link>

          <div className="flex flex-col sm:flex-row gap-7 items-start">
            {tutor.photo_url ? (
              <Image
                src={tutor.photo_url}
                alt={tutor.name}
                width={144}
                height={144}
                className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl object-cover shadow-medium shrink-0"
                priority
              />
            ) : (
              <div className="w-32 h-32 sm:w-36 sm:h-36 rounded-3xl bg-primary flex items-center justify-center text-5xl font-heading font-extrabold text-white shrink-0">
                {tutor.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-primary tracking-tight">
                {tutor.name}
              </h1>
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

              <div className="mt-7 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <CtaButton href={bookHref} external>
                  {tutor.trial_available && pricing.trial
                    ? `Book a first lesson — ${formatPrice(pricing.trial.priceCents, pricing.trial.currency)}`
                    : "Book a lesson"}
                </CtaButton>
                {pricing.lessons.length > 0 && (
                  <span className="text-gray-600 self-center text-sm">
                    {pricing.lessons
                      .map(
                        (l) =>
                          `${formatPrice(l.priceCents, l.currency)} / ${l.durationMinutes} min`
                      )
                      .join("  ·  ")}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------- BODY */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-12">
          {tutor.bio && (
            <section>
              <h2 className="font-heading font-extrabold text-2xl text-primary mb-4">
                About {tutor.name.split(" ")[0]}
              </h2>
              <div className="text-gray-600 leading-relaxed whitespace-pre-line">
                {tutor.bio}
              </div>
            </section>
          )}

          {tutor.intro_video_url && (
            <section>
              <h2 className="font-heading font-extrabold text-2xl text-primary mb-4">
                Introduction
              </h2>
              <div className="aspect-video rounded-2xl overflow-hidden bg-gray-100 shadow-soft">
                <iframe
                  src={tutor.intro_video_url}
                  title={`${tutor.name} introduction video`}
                  allow="accelerometer; clipboard-write; encrypted-media; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full"
                />
              </div>
            </section>
          )}

          {tutor.qualifications.length > 0 && (
            <section>
              <h2 className="font-heading font-extrabold text-2xl text-primary mb-5">
                Qualifications
              </h2>
              <ul className="space-y-4">
                {tutor.qualifications.map((q, i) => (
                  <li
                    key={`${q.title}-${i}`}
                    className="flex gap-4 p-5 rounded-2xl bg-white border border-gray-100 shadow-soft"
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
            </section>
          )}

          <section>
            <h2 className="font-heading font-extrabold text-2xl text-primary mb-5">
              Weekly availability
            </h2>
            <AvailabilityTable
              slots={tutor.availability}
              timezone={tutor.timezone}
            />
          </section>

          {tutor.testimonials.length > 0 && (
            <section>
              <h2 className="font-heading font-extrabold text-2xl text-primary mb-5">
                What their students say
              </h2>
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
            </section>
          )}
        </div>

        {/* ------------------------------------------------------------ ASIDE */}
        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-soft">
            <h3 className="font-heading font-bold text-primary mb-2">
              {TIER_LABEL[tutor.tier]}
            </h3>
            <p className="text-sm text-gray-600 leading-relaxed mb-4">
              {TIER_BLURB[tutor.tier]}
            </p>
            <div className="pb-4 mb-4 border-b border-gray-50 space-y-1">
              {pricing.lessons.map((l) => (
                <p key={l.durationMinutes} className="text-sm">
                  <span className="font-heading font-extrabold text-primary">
                    {formatPrice(l.priceCents, l.currency)}
                  </span>
                  <span className="text-gray-500"> / {l.durationMinutes} min</span>
                </p>
              ))}
              {pricing.trial && (
                <p className="text-xs text-green-700 font-semibold pt-1">
                  First lesson {formatPrice(pricing.trial.priceCents, pricing.trial.currency)}
                </p>
              )}
            </div>
            <h3 className="font-heading font-bold text-primary mb-4">Teaches</h3>
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

            {tutor.levels.length > 0 && (
              <>
                <h3 className="font-heading font-bold text-primary mt-6 mb-3">
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
              </>
            )}

            {tutor.specialties.length > 0 && (
              <>
                <h3 className="font-heading font-bold text-primary mt-6 mb-3">
                  Specialities
                </h3>
                <ul className="space-y-2">
                  {tutor.specialties.map((s) => (
                    <li
                      key={s}
                      className="flex items-start gap-2 text-sm text-gray-600"
                    >
                      <Sparkles className="w-4 h-4 text-secondary shrink-0 mt-0.5" />
                      {s}
                    </li>
                  ))}
                </ul>
              </>
            )}
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
              Get started
            </CtaButton>
          </div>
        </aside>
      </div>
    </>
  );
}
