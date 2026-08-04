// The website and the app serve the same legal text — one source, two hosts.
import type { Metadata } from "next";
import PrivacyPage from "@/app/privacy/page";

export const metadata: Metadata = {
  title: "Privacy policy",
  description: "How FrancoLink collects, uses and protects your personal data.",
  alternates: { canonical: "/privacy" },
};

export default function SitePrivacyPage() {
  return (
    <div className="py-10">
      <PrivacyPage />
    </div>
  );
}
