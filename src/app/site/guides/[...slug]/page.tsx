// Pillar guides. francolink.net/guides/**
//
// A catch-all, because the hierarchy is nested: /guides/french is the hub,
// /guides/french/grammar, /guides/french/speaking and /guides/french/levels are
// the sub-pillars (docs/seo-content-plan.md §2). Statically generated from
// content/guides/*.mdx.
//
// The URL prefix is /guides rather than the plan's original /learn, because
// /learn is in APP_ROUTES and would host-split the page off to the app domain.
// /guides is registered in SITE_ROUTES in src/middleware.ts; without that entry
// this route 404s on the marketing host.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Section } from "@/components/site/ui";
import { JsonLd } from "@/components/site/json-ld";
import { MdxContent } from "@/components/site/mdx-content";
import { PostCtaBlock } from "@/components/site/post-cta";
import { getAllGuides, getChildGuides, getGuide, type Guide } from "@/lib/blog/guides";
import { extractFaqs } from "@/lib/blog/posts";
import { articleSchema, personSchema, breadcrumbSchema, faqSchema } from "@/lib/site/schema";
import { SITE_URL } from "@/lib/site/hosts";

const OG_FALLBACK = "/og-image.png";

export function generateStaticParams() {
  return getAllGuides().map((g) => ({ slug: g.urlPath.split("/") }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const guide = getGuide(slug.join("/"));
  if (!guide) return {};

  const url = `/guides/${guide.urlPath}`;
  return {
    title: guide.title,
    description: guide.description,
    alternates: { canonical: url },
    openGraph: {
      title: guide.title,
      description: guide.description,
      url,
      type: "article",
      modifiedTime: guide.updated,
      authors: [guide.author.name],
      // Restated deliberately: a page-level openGraph replaces the site
      // layout's object rather than merging into it, so omitting images here
      // would ship the guide with no social card.
      images: [{ url: guide.image ?? OG_FALLBACK, width: 1200, height: 630, alt: guide.title }],
    },
  };
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/**
 * Breadcrumb trail from the URL path.
 *
 * Intermediate levels are included ONLY when a guide actually exists at that
 * path. /guides/french/grammar shipped before /guides/french was written, and
 * the naive version of this declared a "French" crumb pointing at a URL that
 * 404s: a structured-data claim about a page that does not exist, and a crawl
 * trap pointed at by every guide beneath it. Once the parent hub ships, the
 * crumb appears on its own with no change here.
 */
function trailFor(guide: { urlPath: string; title: string }) {
  const segments = guide.urlPath.split("/");
  const trail = [{ name: "FrancoLink", path: "/" }];

  segments.forEach((_, i) => {
    const urlPath = segments.slice(0, i + 1).join("/");
    const isLast = i === segments.length - 1;
    const parent = isLast ? null : getGuide(urlPath);
    if (!isLast && !parent) return;
    trail.push({
      name: isLast ? guide.title : parent!.navTitle,
      path: `/guides/${urlPath}`,
    });
  });

  return trail;
}

/**
 * Navigation within a multi-page guide such as TCF Canada: a hub lists its
 * parts, and a part links back to its hub and across to its siblings. Renders
 * nothing for a guide with neither, so single-page guides are unchanged.
 */
function GuideSectionNav({ guide }: { guide: Guide }) {
  const children = getChildGuides(guide.urlPath);
  const parentPath = guide.urlPath.split("/").slice(0, -1).join("/");
  const parent = parentPath ? getGuide(parentPath) : null;
  const siblings = parent ? getChildGuides(parent.urlPath) : [];

  if (children.length) {
    return (
      <nav aria-label={`${guide.navTitle} sections`} className="mt-16">
        <h2 className="font-heading font-extrabold text-2xl text-primary tracking-tight">
          The rest of the {guide.navTitle} guide
        </h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {children.map((c) => (
            <li key={c.urlPath}>
              <Link
                href={`/guides/${c.urlPath}`}
                className="block h-full rounded-2xl border border-primary-100 bg-white p-6 hover:border-secondary transition-colors"
              >
                <span className="font-heading font-bold text-lg text-primary">{c.navTitle}</span>
                <span className="mt-2 block text-gray-600 leading-relaxed">{c.description}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  if (!parent || siblings.length < 2) return null;

  return (
    <nav aria-label={`${parent.navTitle} sections`} className="mt-16 rounded-2xl border border-primary-100 p-6 sm:p-8">
      <Link
        href={`/guides/${parent.urlPath}`}
        className="text-sm font-bold uppercase tracking-[0.15em] text-secondary hover:underline underline-offset-4"
      >
        {parent.navTitle} guide
      </Link>
      <ul className="mt-4 space-y-2">
        {siblings.map((s) => (
          <li key={s.urlPath}>
            {s.urlPath === guide.urlPath ? (
              <span className="font-semibold text-gray-500" aria-current="page">
                {s.navTitle}
              </span>
            ) : (
              <Link
                href={`/guides/${s.urlPath}`}
                className="font-semibold text-primary underline underline-offset-4 decoration-secondary"
              >
                {s.navTitle}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default async function GuidePage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  const guide = getGuide(slug.join("/"));
  if (!guide) notFound();

  const faqs = extractFaqs(guide.body);
  const parentPath = guide.urlPath.split("/").slice(0, -1).join("/");
  const parent = parentPath ? getGuide(parentPath) : null;
  const url = `${SITE_URL}/guides/${guide.urlPath}`;

  return (
    <>
      <JsonLd
        schema={[
          {
            ...articleSchema({
              slug: guide.urlPath,
              title: guide.title,
              description: guide.description,
              // A guide has no separate publication date in its furniture, so
              // both schema dates carry the last revision. Claiming a
              // datePublished a hub never advertised would be inventing one.
              date: guide.updated,
              updated: guide.updated,
              authorSlug: guide.author.slug,
              image: guide.image ?? OG_FALLBACK,
            }),
            "@id": `${url}#article`,
            url,
            mainEntityOfPage: url,
          },
          personSchema(guide.author),
          ...(faqs.length
            ? [faqSchema(faqs.map((f) => [f.question, f.answer] as [string, string]))]
            : []),
          breadcrumbSchema(trailFor(guide)),
        ]}
      />

      <Section>
        <article className="max-w-3xl mx-auto">
          <header className="mb-10">
            {parent ? (
              <Link
                href={`/guides/${parent.urlPath}`}
                className="text-xs font-bold uppercase tracking-[0.15em] text-secondary hover:underline underline-offset-4"
              >
                {parent.navTitle} guide
              </Link>
            ) : (
              <span className="text-xs font-bold uppercase tracking-[0.15em] text-secondary">
                Guide
              </span>
            )}
            <h1 className="mt-4 font-heading font-extrabold text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.15] text-primary tracking-tight">
              {guide.title}
            </h1>
            <p className="mt-5 text-xl leading-relaxed text-gray-600">{guide.description}</p>

            <div className="mt-7 pt-6 border-t border-primary-100 text-sm text-gray-500">
              By{" "}
              <Link
                href={`/authors/${guide.author.slug}`}
                className="font-semibold text-primary hover:underline underline-offset-4"
              >
                {guide.author.name}
              </Link>
              , {guide.author.credential}
              {" · "}
              <time dateTime={guide.updated}>Updated {formatDate(guide.updated)}</time>
              {" · "}
              {guide.readingMinutes} min read
            </div>
          </header>

          <MdxContent source={guide.body} />
        </article>

        {/* Outside <article>, so the heading outline stays the guide's own
            questions. Same reason as the post route. */}
        <aside className="max-w-3xl mx-auto">
          <GuideSectionNav guide={guide} />

          <PostCtaBlock primary={guide.cta} />

          {/* The blog route carries this and guides did not, which left the
              pillar pages with a weaker author signal than the posts hanging
              off them. Backwards, for the pages meant to carry the topic. */}
          <div className="mt-12 pt-8 border-t border-primary-100">
            <h2 className="font-heading font-bold text-lg text-primary">About the author</h2>
            <p className="mt-2 text-gray-600 leading-relaxed">{guide.author.bio}</p>
            <Link
              href={`/authors/${guide.author.slug}`}
              className="mt-3 inline-block text-primary font-semibold underline underline-offset-4 decoration-secondary"
            >
              More from {guide.author.name}
            </Link>
          </div>
        </aside>
      </Section>
    </>
  );
}
