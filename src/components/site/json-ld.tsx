// Renders JSON-LD. A server component, so the markup is in the initial HTML —
// AI crawlers that do not execute JavaScript still see it.

export function JsonLd({ schema }: { schema: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      // Schema objects are built from our own data in lib/site/schema.ts, not
      // from user input. JSON.stringify escapes the values; the `<` guard stops
      // a stray "</script>" in any DB-sourced string from closing the tag early.
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema).replace(/</g, "\\u003c"),
      }}
    />
  );
}
