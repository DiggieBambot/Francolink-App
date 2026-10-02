// A certificate's public page: francolink.net/certificates/<number>.
//
// This is the link a student shares on LinkedIn or sends an employer, and
// the one the app opens for "Print / PDF". It works signed out, shows the
// certificate exactly as the student sees it, and says plainly that FrancoLink
// issued it -- which is the whole point of a verification link.
//
// Not indexed: it carries a person's name, and a search engine has no
// business listing who holds which certificate. It is reachable only by
// someone who was given the number (verify_certificate in
// 20261005_certificates.sql; numbers carry 40 random bits).

import type { Metadata } from "next";
import { cache } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BadgeCheck } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import {
  CertificateCard,
  LANGUAGE_NAMES,
  LEVEL_NAMES,
  publicCertificateUrl,
} from "@/components/learning/certificate-card";
import { appUrl } from "@/lib/site/hosts";
import { PrintButton } from "./print-button";

export const dynamic = "force-dynamic";

interface Verified {
  certificate_number: string;
  holder_name: string;
  language: string;
  level: string;
  course_title: string | null;
  score: number | null;
  total_xp: number | null;
  issued_at: string;
}

// Called by both generateMetadata and the page; cache() makes it one query.
const verify = cache(async (number: string): Promise<Verified | null> => {
  if (!/^[A-Z0-9-]{6,40}$/.test(number)) return null;
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
  const { data } = await db.rpc("verify_certificate", { p_number: number });
  return (Array.isArray(data) ? data[0] : data) ?? null;
});

interface PageProps {
  params: Promise<{ number: string }>;
}

function describe(c: Verified) {
  const language = LANGUAGE_NAMES[c.language] || c.language;
  const level = c.level.toUpperCase();
  return { language, level, levelName: LEVEL_NAMES[level] || level };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { number } = await params;
  const c = await verify(decodeURIComponent(number));
  if (!c) return { title: "Certificate not found", robots: { index: false, follow: false } };

  const { language, level, levelName } = describe(c);
  const title = `${c.holder_name}: ${language} ${level} certificate`;
  const description = `${c.holder_name} completed FrancoLink's ${language} ${level} (${levelName}) course. Verified certificate ${c.certificate_number}.`;
  return {
    title,
    description,
    robots: { index: false, follow: false },
    alternates: { canonical: publicCertificateUrl(c.certificate_number) },
    openGraph: { title, description, url: publicCertificateUrl(c.certificate_number) },
  };
}

export default async function PublicCertificatePage({ params }: PageProps) {
  const { number } = await params;
  const c = await verify(decodeURIComponent(number));
  if (!c) notFound();

  const { language, level, levelName } = describe(c);
  const issued = new Date(c.issued_at).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric", timeZone: "UTC",
  });

  return (
    <>
      <style>{`
        @media print {
          header, footer, .no-print { display: none !important; }
          .cert-wrapper { padding: 0 !important; background: white !important; }
          .cert-card { box-shadow: none !important; border-radius: 0 !important; }
          @page { margin: 0.5cm; size: landscape; }
        }
      `}</style>

      <div className="cert-wrapper bg-gray-100 py-8 sm:py-12 px-4">
        <div className="no-print max-w-4xl mx-auto mb-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <BadgeCheck className="w-8 h-8 text-green-600 shrink-0" />
            <div>
              <p className="font-heading font-bold text-primary">Verified certificate</p>
              <p className="text-sm text-gray-600">
                Issued by FrancoLink to {c.holder_name} on {issued}.
              </p>
            </div>
          </div>
          <PrintButton />
        </div>

        <CertificateCard
          userName={c.holder_name}
          language={c.language}
          level={c.level}
          certificateNumber={c.certificate_number}
          courseTitle={c.course_title ?? `${language} ${level}`}
          score={c.score ?? 0}
          totalXp={c.total_xp ?? 0}
          issuedAt={c.issued_at}
        />

        <div className="no-print max-w-4xl mx-auto mt-8 grid gap-6 sm:grid-cols-2">
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="font-heading font-bold text-lg text-primary">What this certificate means</h2>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              {c.holder_name} passed every lesson of FrancoLink&apos;s {language} {level} course,
              scoring at least 70% on each, with an average of {c.score ?? 0}%. The course follows
              the CEFR {level} ({levelName}) syllabus.
            </p>
            <p className="mt-3 text-xs text-gray-500">
              A FrancoLink course certificate records completion of our course. It is not an
              official CEFR exam result such as DELF, DELE or Goethe.
            </p>
          </div>
          <div className="rounded-2xl bg-primary-50 p-6">
            <h2 className="font-heading font-bold text-lg text-primary">Earn yours</h2>
            <p className="mt-2 text-sm text-gray-600 leading-relaxed">
              Learn {language} with short daily lessons and certified tutors, from A1 to B2.
            </p>
            <Link
              href={appUrl("/signup/student")}
              className="mt-4 inline-flex px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary-600"
            >
              Start learning free
            </Link>
          </div>
        </div>
      </div>
    </>
  );
}
