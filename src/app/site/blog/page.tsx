// The blog index. francolink.net/blog
//
// Was a permanent noindex stub with no post system behind it. It now lists real
// MDX posts from content/blog.
//
// The noindex is not removed outright, it is made conditional: an index page
// with nothing on it is a thin-content URL, which is why the stub was noindex
// in the first place. The moment the first post ships, this page becomes
// indexable on its own, and until then it keeps the honest "on its way" state
// rather than rendering an empty list.

import type { Metadata } from "next";
import Link from "next/link";
import { PenLine } from "lucide-react";
import { Section, SectionHeading, CtaButton } from "@/components/site/ui";
import { JsonLd } from "@/components/site/json-ld";
import { getAllPosts, hasPosts } from "@/lib/blog/posts";
import { breadcrumbSchema } from "@/lib/site/schema";

const TITLE = "French learning guides and grammar explainers";
const DESCRIPTION =
  "Grammar explainers, level-by-level study guides and honest advice about learning French as an adult. " +
  "Written by Njinu Precious Bambot, Certified Bilingual Language Expert and Coach.";

export function generateMetadata(): Metadata {
  const live = hasPosts();
  return {
    title: live ? TITLE : "Blog",
    description: live
      ? DESCRIPTION
      : "Language-learning guides, grammar explainers and study tips from FrancoLink. Launching soon.",
    alternates: { canonical: "/blog" },
    openGraph: { title: TITLE, description: DESCRIPTION, url: "/blog", type: "website" },
    robots: live ? undefined : { index: false, follow: true },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function BlogPage() {
  const posts = getAllPosts();

  if (posts.length === 0) {
    return (
      <Section>
        <div className="max-w-xl mx-auto text-center py-10">
          <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center mx-auto mb-6">
            <PenLine className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-primary tracking-tight">
            The blog is on its way
          </h1>
          <p className="mt-5 text-gray-600 leading-relaxed">
            We&apos;re writing grammar explainers, level-by-level study guides and honest advice
            about learning a language as an adult. Until then, the FAQ answers most of what people
            ask us.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <CtaButton href="/faq">Read the FAQ</CtaButton>
            <CtaButton href="/tutors" variant="ghost">
              Browse tutors
            </CtaButton>
          </div>
        </div>
      </Section>
    );
  }

  return (
    <>
      <JsonLd
        schema={breadcrumbSchema([
          { name: "FrancoLink", path: "/" },
          { name: "Blog", path: "/blog" },
        ])}
      />
      <Section>
        <SectionHeading eyebrow="Blog" title={TITLE} subtitle={DESCRIPTION} align="left" />

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <article
              key={post.slug}
              className="rounded-2xl border border-primary-100 bg-white p-6 flex flex-col hover:border-primary-300 transition-colors"
            >
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-secondary">
                {post.cluster}
              </span>
              <h2 className="mt-3 font-heading font-bold text-xl text-primary tracking-tight leading-snug">
                <Link href={`/blog/${post.slug}`} className="hover:underline underline-offset-4">
                  {post.title}
                </Link>
              </h2>
              <p className="mt-3 text-gray-600 leading-relaxed flex-1">{post.description}</p>
              <p className="mt-5 text-sm text-gray-500">
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                {" · "}
                {post.readingMinutes} min read
              </p>
            </article>
          ))}
        </div>
      </Section>
    </>
  );
}
