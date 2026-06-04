import type { ReactNode } from "react";
import { Navbar } from "./navbar";
import { Footer } from "./footer";

/**
 * Wraps public / marketing pages with the site navbar + footer. The navbar is
 * fixed, so we pad the top to clear it (h-16 mobile, h-20 desktop).
 */
export function PublicShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <main className="pt-16 md:pt-20">{children}</main>
      <Footer />
    </>
  );
}
