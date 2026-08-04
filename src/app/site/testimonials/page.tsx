import type { Metadata } from "next";
import Image from "next/image";
import { Quote, Star } from "lucide-react";
import { Section, CtaButton } from "@/components/site/ui";
import { getTestimonials } from "@/lib/site/queries";
import { appUrl } from "@/lib/site/hosts";

export const revalidate = 3600;

export const metadata: Metadata = {
  title: "Student stories",
  description:
    "Real feedback from FrancoLink learners — what changed, how long it took, and which tutor got them there.",
  alternates: { canonical: "/testimonials" },
};

export default async function TestimonialsPage() {
  const testimonials = await getTestimonials(60);

  return (
    <>
      <div className="bg-primary-50 border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-primary tracking-tight">
            Student stories
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto">
            Every quote here comes from a FrancoLink learner. No stock photos, no
            invented names.
          </p>
        </div>
      </div>

      <Section>
        {testimonials.length > 0 ? (
          <div className="columns-1 md:columns-2 lg:columns-3 gap-6 [column-fill:_balance]">
            {testimonials.map((t) => (
              <figure
                key={t.id}
                className="break-inside-avoid mb-6 p-7 rounded-2xl bg-white border border-gray-100 shadow-soft"
              >
                <Quote className="w-7 h-7 text-secondary mb-4" />
                <blockquote className="text-gray-700 leading-relaxed">
                  {t.quote}
                </blockquote>

                {t.rating != null && (
                  <div className="mt-4 flex gap-0.5" aria-label={`${t.rating} out of 5`}>
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={
                          i < t.rating!
                            ? "w-4 h-4 text-secondary fill-secondary"
                            : "w-4 h-4 text-gray-200 fill-gray-200"
                        }
                      />
                    ))}
                  </div>
                )}

                <figcaption className="mt-5 pt-5 border-t border-gray-50 flex items-center gap-3">
                  {t.author_photo ? (
                    <Image
                      src={t.author_photo}
                      alt={t.author_name}
                      width={40}
                      height={40}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <span className="w-10 h-10 rounded-full bg-primary-50 text-primary flex items-center justify-center font-heading font-bold">
                      {t.author_name.charAt(0).toUpperCase()}
                    </span>
                  )}
                  <span>
                    <span className="block font-heading font-bold text-primary text-sm">
                      {t.author_name}
                    </span>
                    {(t.author_role || t.author_country) && (
                      <span className="block text-xs text-gray-500">
                        {[t.author_role, t.author_country]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>
        ) : (
          <p className="py-16 text-center text-gray-500">
            We&apos;re collecting stories from our first cohort of learners —
            check back shortly.
          </p>
        )}
      </Section>

      <Section tone="navy">
        <div className="text-center max-w-2xl mx-auto">
          <h2 className="font-heading font-extrabold text-3xl text-white tracking-tight">
            Write your own
          </h2>
          <p className="mt-4 text-primary-100 text-lg">
            Take the placement test, meet a tutor, and see where you are in three
            months.
          </p>
          <div className="mt-8">
            <CtaButton href={appUrl("/signup")} variant="secondary" external>
              Start free
            </CtaButton>
          </div>
        </div>
      </Section>
    </>
  );
}
