import type { ReactNode } from "react";
import { Navbar } from "./navbar";
import { Footer } from "./footer";
import { EmbedChrome } from "./embed-chrome";

/**
 * Wraps public / marketing pages with the site navbar + footer. The navbar is
 * fixed, so we pad the top to clear it (h-16 mobile, h-20 desktop).
 *
 * When embedded in an iframe (the in-room lesson picker), EmbedChrome hides the
 * navbar + footer so only the catalogue content shows.
 */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <>
      <EmbedChrome />
      <div data-site-chrome>
        <Navbar />
      </div>
      <main data-public-main className="pt-16 md:pt-20">{children}</main>
      <div data-site-chrome>
        <Footer />
      </div>
    </>
  );
}
