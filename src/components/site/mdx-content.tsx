// MDX rendering for blog posts.
//
// The element map exists because unstyled MDX inherits nothing from Tailwind's
// preflight: without it every post renders as one undifferentiated wall of
// 16px text. It also does the AEO work that formatting alone decides —
// headings get stable ids and anchors so an answer engine can cite a passage
// rather than the whole page, and tables scroll inside their own container so
// a wide drill table never makes the body scroll sideways on a phone.

import Link from "next/link";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import type { MDXComponents } from "mdx/types";

const components: MDXComponents = {
  h2: (props) => (
    <h2
      className="font-heading font-extrabold text-2xl sm:text-3xl text-primary tracking-tight mt-14 mb-4 scroll-mt-24"
      {...props}
    />
  ),
  h3: (props) => (
    <h3
      className="font-heading font-bold text-xl sm:text-2xl text-primary tracking-tight mt-10 mb-3 scroll-mt-24"
      {...props}
    />
  ),
  p: (props) => <p className="text-lg leading-relaxed text-gray-700 mb-5" {...props} />,
  ul: (props) => (
    <ul className="list-disc pl-6 mb-5 space-y-2 text-lg leading-relaxed text-gray-700" {...props} />
  ),
  ol: (props) => (
    <ol
      className="list-decimal pl-6 mb-5 space-y-2 text-lg leading-relaxed text-gray-700"
      {...props}
    />
  ),
  strong: (props) => <strong className="font-bold text-primary" {...props} />,
  blockquote: (props) => (
    <blockquote
      className="border-l-4 border-secondary bg-primary-50 rounded-r-xl px-6 py-4 my-8 text-lg text-primary-900"
      {...props}
    />
  ),
  // Grammar tables are the asset of these posts, so they get real design rather
  // than default borders. Three things are doing the work:
  //
  //   * The table stays a real <table>. The AI visibility run on 2026-09-10
  //     showed answers being assembled out of extractable structure, and a grid
  //     of divs is not a table to a crawler or a model.
  //   * It scrolls inside its own container, so a wide contrast table never
  //     makes the page body scroll sideways on a phone.
  //   * The first column is sticky. On a narrow screen you scroll to read the
  //     second meaning and the term stays put, which is the whole point of a
  //     contrast table: you are comparing across the row, not down the column.
  //
  // Authors write a plain markdown table. No JSX in the content files, which
  // keeps posts portable and reviewable as prose.
  table: (props) => (
    <div className="my-10 overflow-x-auto rounded-2xl border border-primary-100 bg-white">
      {/* min-width as an inline style, not a Tailwind arbitrary value: this
          project's Tailwind build silently drops those (see the note in
          app/site/francais-pas-a-pas/page.tsx), and `min-w-[34rem]` was
          verified absent from the compiled stylesheet. */}
      <table
        className="w-full text-left border-collapse"
        style={{ minWidth: "34rem" }}
        {...props}
      />
    </div>
  ),
  thead: (props) => <thead className="bg-primary-50" {...props} />,
  th: (props) => (
    <th
      className="sticky left-0 z-10 bg-primary-50 text-primary font-bold text-xs uppercase tracking-wide px-4 py-3.5 border-b border-primary-100 [&:not(:first-child)]:static [&:not(:first-child)]:border-l"
      {...props}
    />
  ),
  // The first cell of each row carries the term being defined, so it gets the
  // heading treatment and stays visible while the rest of the row scrolls.
  // Its background must be opaque, not `bg-inherit`: a transparent sticky cell
  // lets the second column show through it during a horizontal scroll, which is
  // exactly when the sticky column is meant to be doing its job.
  td: (props) => (
    <td
      className="sticky left-0 z-10 bg-white px-4 py-3.5 align-top text-gray-700 border-b border-primary-50 font-heading font-bold text-primary [&:not(:first-child)]:static [&:not(:first-child)]:border-l [&:not(:first-child)]:border-l-primary-100 [&:not(:first-child)]:font-body [&:not(:first-child)]:font-normal [&:not(:first-child)]:text-gray-700"
      {...props}
    />
  ),
  code: (props) => (
    <code className="bg-primary-50 text-primary-900 rounded px-1.5 py-0.5 text-[0.95em]" {...props} />
  ),
  hr: () => <hr className="my-12 border-primary-100" />,
  // Internal links use next/link so client navigation works; anything absolute
  // (including the cross-host app links the plan requires) stays a plain <a>.
  a: ({ href = "", ...props }) => {
    const internal = href.startsWith("/");
    const className = "text-primary underline underline-offset-4 decoration-secondary hover:decoration-primary font-medium";
    return internal ? (
      <Link href={href} className={className} {...props} />
    ) : (
      <a href={href} className={className} {...props} />
    );
  },
};

export async function MdxContent({ source }: { source: string }) {
  const { content } = await compileMDX({
    source,
    components,
    options: {
      mdxOptions: {
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [rehypeAutolinkHeadings, { behavior: "wrap" }],
        ],
      },
    },
  });
  return <div className="mdx">{content}</div>;
}
