// Pillar guides: MDX in content/guides, served under /guides/**.
//
// A guide is not a blog post. A post answers one question and is dated; a guide
// is the hub for a topic, it links down to the posts beneath it, and it is
// meant to be revised rather than superseded. That difference is why guides get
// their own loader and their own route instead of being posts with a flag:
//
//   * The URL is a path, not a slug. `french/grammar` renders at
//     /guides/french/grammar, so the hierarchy in docs/seo-content-plan.md
//     survives as real URLs.
//   * There is no author byline in the header and no publication date in the
//     furniture. A hub that shouts "written in September 2026" reads stale in
//     January; `updated` is what matters and it is the only date shown.
//
// Everything else is deliberately shared with posts: the same MDX renderer, the
// same Article and FAQPage schema, the same frontmatter validation. A second
// content system would be a second set of metadata bugs.

import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { DEFAULT_AUTHOR_SLUG, getAuthor, type Author } from "./authors";
import type { PostCta } from "./posts";

const GUIDES_DIR = path.join(process.cwd(), "content", "guides");
const IS_DEV = process.env.NODE_ENV === "development";

export interface Guide {
  /** URL path under /guides, e.g. "french/grammar". No leading slash. */
  urlPath: string;
  title: string;
  description: string;
  /** ISO date of the last meaningful revision. The only date a guide shows. */
  updated: string;
  author: Author;
  primaryKeyword: string;
  cta: PostCta;
  draft: boolean;
  image: string | null;
  readingMinutes: number;
  body: string;
}

function required(value: unknown, field: string, file: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(
      `content/guides/${file}.mdx: frontmatter "${field}" is required and must be a non-empty string.`
    );
  }
  return value.trim();
}

function parse(file: string, raw: string): Guide {
  const { data, content } = matter(raw);

  const authorSlug = typeof data.author === "string" ? data.author : DEFAULT_AUTHOR_SLUG;
  const author = getAuthor(authorSlug);
  if (!author) {
    throw new Error(
      `content/guides/${file}.mdx: unknown author "${authorSlug}". Add them to src/lib/blog/authors.ts first.`
    );
  }

  const cta = data.cta as PostCta;
  if (!["workbook", "subscription", "tutors"].includes(cta)) {
    throw new Error(
      `content/guides/${file}.mdx: "cta" must be one of workbook, subscription, tutors.`
    );
  }

  // The path is explicit rather than derived from the filename, because the
  // filename cannot carry a slash and the hierarchy is the point.
  const urlPath = required(data.path, "path", file).replace(/^\/+|\/+$/g, "");

  return {
    urlPath,
    title: required(data.title, "title", file),
    description: required(data.description, "description", file),
    updated: required(data.updated, "updated", file),
    author,
    primaryKeyword: required(data.primaryKeyword, "primaryKeyword", file),
    cta,
    draft: data.draft === true,
    image: typeof data.image === "string" && data.image.trim() ? data.image.trim() : null,
    readingMinutes: Math.max(1, Math.round(readingTime(content).minutes)),
    body: content,
  };
}

function readAll(): Guide[] {
  if (!fs.existsSync(GUIDES_DIR)) return [];
  return fs
    .readdirSync(GUIDES_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => parse(f.replace(/\.mdx$/, ""), fs.readFileSync(path.join(GUIDES_DIR, f), "utf8")));
}

/** Published guides. Drafts stay visible in development only, as with posts. */
export function getAllGuides(): Guide[] {
  return readAll()
    .filter((g) => IS_DEV || !g.draft)
    .sort((a, b) => a.urlPath.localeCompare(b.urlPath));
}

export function getGuide(urlPath: string): Guide | null {
  return getAllGuides().find((g) => g.urlPath === urlPath) ?? null;
}
