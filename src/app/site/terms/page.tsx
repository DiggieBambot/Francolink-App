// The website and the app serve the same legal text — one source, two hosts.
import type { Metadata } from "next";
import TermsPage from "@/app/terms/page";

export const metadata: Metadata = {
  title: "Terms of service",
  description: "The terms that govern your use of FrancoLink.",
  alternates: { canonical: "/terms" },
};

export default function SiteTermsPage() {
  return (
    <div className="py-10">
      <TermsPage />
    </div>
  );
}
