// Blog posts: MDX files in content/blog, read at build time.
//
// Decided in docs/seo-content-plan.md §2: posts are MDX in the repo, statically
// rendered, version-controlled, no CMS. This module is the only thing that
// touches the filesystem, so the routes stay simple and everything that reads a
// post goes through one validated shape.
//
// Two deliberate choices:
//
//   1. A post with `draft: true`, or a future `date`, is invisible in
//      production but visible in development. That is how you preview a post
//      without publishing it, and why the sitemap and the index cannot
//      accidentally list something unfinished.
//   2. Missing frontmatter throws at build time rather than rendering a page
//      with an empty <title>. A build that fails loudly beats hundreds of
//      lesson pages' worth of title-only metadata, which is the exact defect
//      the SEO audit found on the app host.

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { DEFAULT_AUTHOR_SLUG, getAuthor, type Author } from "./authors";

const POSTS_DIR = path.join(process.cwd(), "content", "blog");
const IS_DEV = process.env.NODE_ENV === "development";

/** Where a post's CTA sends the reader. Every post must have a destination. */
export type PostCta = "workbook" | "subscription" | "tutors";

export interface PostMeta {
  slug: string;
  title: string;
  description: string;
  /** ISO date, first published. */
  date: string;
  /** ISO date, last meaningful edit. Falls back to `date`. */
  updated: string;
  author: Author;
  /** The keyword this post is the answer to, from 01-keyword-map.csv. */
  primaryKeyword: string;
  /** Cluster label from docs/seo-content-plan.md, e.g. "Grammar". */
  cluster: string;
  /**
   * Primary destination. The site brief (2026-09-10) makes the self-study
   * subscription a second exit on every grammar page, so this names the
   * *primary* CTA, not the only one.
   */
  cta: PostCta;
  draft: boolean;
  /** Minutes, computed from the body. Never hand-written. */
  readingMinutes: number;
  /**
   * Path to a real 1200x630 image in /public for this post, or null to fall
   * back to the site's own OG image. Never a made-up path: a broken og:image
   * renders a blank card, which is worse than the generic one.
   */
  image: string | null;
}

/** One question-headed section, lifted for FAQPage schema. */
export interface PostFaq {
  question: string;
  answer: string;
}

export interface Post extends PostMeta {
  /** Raw MDX body, compiled by the route. */
  body: string;
}

function required(value: unknown, field: string, slug: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(
      `content/blog/${slug}.mdx: frontmatter "${field}" is required and must be a non-empty string.`
    );
  }
  return value.trim();
}

function parse(slug: string, raw: string): Post {
  const { data, content } = matter(raw);

  const authorSlug = typeof data.author === "string" ? data.author : DEFAULT_AUTHOR_SLUG;
  const author = getAuthor(authorSlug);
  if (!author) {
    throw new Error(
      `content/blog/${slug}.mdx: unknown author "${authorSlug}". Add them to src/lib/blog/authors.ts first.`
    );
  }

  const cta = data.cta as PostCta;
  if (!["workbook", "subscription", "tutors"].includes(cta)) {
    throw new Error(
      `content/blog/${slug}.mdx: "cta" must be one of workbook, subscription, tutors. ` +
        `Content with no product destination does not get written (site-brief.md).`
    );
  }

  const date = required(data.date, "date", slug);

  return {
    slug,
    title: required(data.title, "title", slug),
    description: required(data.description, "description", slug),
    date,
    updated: typeof data.updated === "string" && data.updated.trim() ? data.updated.trim() : date,
    author,
    primaryKeyword: required(data.primaryKeyword, "primaryKeyword", slug),
    cluster: required(data.cluster, "cluster", slug),
    cta,
    draft: data.draft === true,
    image: typeof data.image === "string" && data.image.trim() ? data.image.trim() : null,
    readingMinutes: Math.max(1, Math.round(readingTime(content).minutes)),
    body: content,
  };
}

/**
 * Pulls the answer capsules out of a post body for FAQPage schema.
 *
 * Every H2 in these posts is a question with its answer in the paragraph
 * directly beneath it, which is the structure seo-content-writer enforces and
 * the structure answer engines lift from. Deriving the schema from the prose
 * rather than from a hand-maintained frontmatter list means the two can never
 * drift apart, and every future post gets FAQPage for free.
 *
 * Only headings that actually end in a question mark are included. A section
 * like "About the author" is not an FAQ entry and must not be claimed as one:
 * schema that does not match the visible page is spam.
 */
export function extractFaqs(body: string): PostFaq[] {
  const faqs: PostFaq[] = [];
  const lines = body.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const heading = /^##\s+(.*\?)\s*$/.exec(lines[i]);
    if (!heading) continue;

    // The capsule is the first non-empty block after the heading. Stop at the
    // next heading so a question with no answer beneath it is simply skipped.
    const answer: string[] = [];
    for (let j = i + 1; j < lines.length; j++) {
      const line = lines[j].trim();
      if (line.startsWith("#")) break;
      if (!line) {
        if (answer.length) break;
        continue;
      }
      answer.push(line);
    }
    if (!answer.length) continue;

    faqs.push({
      question: stripInline(heading[1]),
      answer: stripInline(answer.join(" ")),
    });
  }
  return faqs;
}

/** Markdown emphasis and links are markup, not answer text. */
function stripInline(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

/** True when a post should be visible on the live marketing site. */
function isPublished(post: Post): boolean {
  if (IS_DEV) return true;
  if (post.draft) return false;
  return new Date(post.date).getTime() <= Date.now();
}

function readAll(): Post[] {
  if (!fs.existsSync(POSTS_DIR)) return [];
  return fs
    .readdirSync(POSTS_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => parse(f.replace(/\.mdx$/, ""), fs.readFileSync(path.join(POSTS_DIR, f), "utf8")));
}

/** Published posts, newest first. */
export function getAllPosts(): Post[] {
  return readAll()
    .filter(isPublished)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

export function getPost(slug: string): Post | null {
  return getAllPosts().find((p) => p.slug === slug) ?? null;
}

export function getPostsByAuthor(authorSlug: string): Post[] {
  return getAllPosts().filter((p) => p.author.slug === authorSlug);
}

/**
 * Whether the blog has anything in it. /blog stays noindex while this is false:
 * an indexable empty index page is a thin-content URL, and the stub it replaced
 * was noindex for exactly that reason.
 */
export function hasPosts(): boolean {
  return getAllPosts().length > 0;
}
