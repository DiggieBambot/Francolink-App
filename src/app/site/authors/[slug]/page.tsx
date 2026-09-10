// Author page. francolink.net/authors/[slug]
//
// The E-E-A-T anchor the site did not have. Google rewards named, credentialed
// authors for educational content, and an LLM needs a single resolvable URL to
// attach a credential to. Every post's Article schema points its `author` at
// the Person @id this page declares.
//
// The page is indexable even with no posts yet: it is a real biography of a
// real person, not a generated listing, so it is not thin content.

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Section } from "@/components/site/ui";
import { JsonLd } from "@/components/site/json-ld";
import { allAuthorSlugs, getAuthor } from "@/lib/blog/authors";
import { getPostsByAuthor } from "@/lib/blog/posts";
import { personSchema, breadcrumbSchema } from "@/lib/site/schema";

export function generateStaticParams() {
  return allAuthorSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const author = getAuthor(slug);
  if (!author) return {};

  // No em dash: site-brief.md forbids them in published copy, and a <title> is
  // as published as copy gets.
  const title = `${author.name}, ${author.credential}`;
  return {
    title,
    description: author.bio,
    alternates: { canonical: `/authors/${author.slug}` },
    openGraph: { title, description: author.bio, url: `/authors/${author.slug}`, type: "profile" },
  };
}

export default async function AuthorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const author = getAuthor(slug);
  if (!author) notFound();

  const posts = getPostsByAuthor(author.slug);

  return (
    <>
      <JsonLd
        schema={[
          personSchema(author),
          breadcrumbSchema([
            { name: "FrancoLink", path: "/" },
            { name: author.name, path: `/authors/${author.slug}` },
          ]),
        ]}
      />

      <Section>
        <div className="max-w-3xl mx-auto">
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl text-primary tracking-tight">
            {author.name}
          </h1>
          <p className="mt-3 text-lg font-semibold text-secondary">{author.credential}</p>
          <p className="mt-6 text-lg leading-relaxed text-gray-700">{author.bio}</p>

          {posts.length > 0 && (
            <div className="mt-12 pt-8 border-t border-primary-100">
              <h2 className="font-heading font-bold text-xl text-primary">
                Posts by {author.name}
              </h2>
              <ul className="mt-5 space-y-4">
                {posts.map((post) => (
                  <li key={post.slug}>
                    <Link
                      href={`/blog/${post.slug}`}
                      className="font-semibold text-primary hover:underline underline-offset-4"
                    >
                      {post.title}
                    </Link>
                    <p className="text-gray-600 leading-relaxed mt-1">{post.description}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </Section>
    </>
  );
}
