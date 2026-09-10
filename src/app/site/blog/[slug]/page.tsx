// A blog post. francolink.net/blog/[slug]
//
// Statically generated from content/blog/*.mdx. Three things here are the
// reason this route exists at all, and none of them are the prose:
//
//   * Article + Person JSON-LD, with the author as an @id reference rather than
//     an inline string, so every post resolves to one credentialed human.
//   * A real canonical, description and OG block per post. The audit's finding
//     on the app host was hundreds of pages with title-only metadata; this is
//     the pattern that does not repeat it.
//   * The two-exit CTA required by site-brief.md, rendered from the post's own
//     frontmatter rather than hand-written per post and forgotten.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Section } from "@/components/site/ui";
import { JsonLd } from "@/components/site/json-ld";
import { MdxContent } from "@/components/site/mdx-content";
import { PostCtaBlock } from "@/components/site/post-cta";
import { getAllPosts, getPost } from "@/lib/blog/posts";
import { articleSchema, personSchema, breadcrumbSchema } from "@/lib/site/schema";

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `/blog/${post.slug}`,
      type: "article",
      publishedTime: post.date,
      modifiedTime: post.updated,
      authors: [post.author.name],
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

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <>
      <JsonLd
        schema={[
          articleSchema({
            slug: post.slug,
            title: post.title,
            description: post.description,
            date: post.date,
            updated: post.updated,
            authorSlug: post.author.slug,
          }),
          personSchema(post.author),
          breadcrumbSchema([
            { name: "FrancoLink", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
        ]}
      />

      <Section>
        <article className="max-w-3xl mx-auto">
          <header className="mb-10">
            <Link
              href="/blog"
              className="text-xs font-bold uppercase tracking-[0.15em] text-secondary hover:underline underline-offset-4"
            >
              {post.cluster}
            </Link>
            <h1 className="mt-4 font-heading font-extrabold text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.15] text-primary tracking-tight">
              {post.title}
            </h1>
            <p className="mt-5 text-xl leading-relaxed text-gray-600">{post.description}</p>

            <div className="mt-7 pt-6 border-t border-primary-100 text-sm text-gray-500">
              By{" "}
              <Link
                href={`/authors/${post.author.slug}`}
                className="font-semibold text-primary hover:underline underline-offset-4"
              >
                {post.author.name}
              </Link>
              , {post.author.credential}
              <br />
              <time dateTime={post.date}>Published {formatDate(post.date)}</time>
              {post.updated !== post.date && (
                <>
                  {" · "}
                  <time dateTime={post.updated}>Updated {formatDate(post.updated)}</time>
                </>
              )}
              {" · "}
              {post.readingMinutes} min read
            </div>
          </header>

          <MdxContent source={post.body} />

          <PostCtaBlock primary={post.cta} />

          <footer className="mt-12 pt-8 border-t border-primary-100">
            <h2 className="font-heading font-bold text-lg text-primary">
              About the author
            </h2>
            <p className="mt-2 text-gray-600 leading-relaxed">{post.author.bio}</p>
            <Link
              href={`/authors/${post.author.slug}`}
              className="mt-3 inline-block text-primary font-semibold underline underline-offset-4 decoration-secondary"
            >
              More from {post.author.name}
            </Link>
          </footer>
        </article>
      </Section>
    </>
  );
}
