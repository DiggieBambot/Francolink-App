"use client";

// Ways to show a certificate off, on its public page.
//
//   images     square (Instagram/Facebook posts) and story (Stories, Status),
//              rendered by ./image. "Share image" hands the file itself to
//              the phone's share sheet where the browser allows it; the
//              download buttons work everywhere.
//   LinkedIn   "Add to profile" files it under Licenses & certifications,
//              with this page as the credential URL -- the one place a
//              certificate keeps working for the student long after the post.
//   links      the usual share intents; each unfurls with the wide image.

import { useEffect, useState } from "react";
import { Check, Download, Link2, Share2 } from "lucide-react";
import {
  certificateImageUrl,
  publicCertificateUrl,
  type CertificateImageFormat,
} from "@/components/learning/certificate-card";

interface Props {
  number: string;
  holderName: string;
  /** "French A1" */
  title: string;
  levelName: string;
  issuedAt: string;
}

export function ShareCertificate({ number, holderName, title, levelName, issuedAt }: Props) {
  const url = publicCertificateUrl(number);
  const text = `I just earned my ${title} (${levelName}) certificate on FrancoLink! 🎓`;
  const [copied, setCopied] = useState(false);
  const [canShareFiles, setCanShareFiles] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    // Feature-detect once on the client: navigator doesn't exist on the server.
    const probe = new File([""], "x.png", { type: "image/png" });
    setCanShareFiles(!!navigator.canShare?.({ files: [probe] }));
  }, []);

  const issued = new Date(issuedAt);
  const linkedInAdd =
    "https://www.linkedin.com/profile/add?" +
    new URLSearchParams({
      startTask: "CERTIFICATION_NAME",
      name: `${title} (${levelName}) — Certificate of Completion`,
      organizationName: "FrancoLink",
      issueYear: String(issued.getUTCFullYear()),
      issueMonth: String(issued.getUTCMonth() + 1),
      certUrl: url,
      certId: number,
    }).toString();

  const enc = encodeURIComponent;
  const links = [
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${enc(url)}`, color: "bg-[#0a66c2]" },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${enc(url)}`, color: "bg-[#1877f2]" },
    { name: "X", href: `https://twitter.com/intent/tweet?text=${enc(text)}&url=${enc(url)}`, color: "bg-black" },
    { name: "WhatsApp", href: `https://wa.me/?text=${enc(`${text} ${url}`)}`, color: "bg-[#25d366]" },
  ];

  async function shareImage(format: CertificateImageFormat) {
    setBusy(true);
    try {
      const blob = await (await fetch(certificateImageUrl(number, format))).blob();
      const file = new File([blob], `francolink-${number}-${format}.png`, { type: "image/png" });
      await navigator.share({ files: [file], text: `${text} ${url}` });
    } catch {
      // Cancelled, or the browser refused the file: fall back to saving it.
      window.location.href = certificateImageUrl(number, format, true);
    } finally {
      setBusy(false);
    }
  }

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const btn =
    "inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors";

  return (
    <section className="no-print max-w-4xl mx-auto mt-8 rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="font-heading font-bold text-lg text-primary">Share it</h2>
      <p className="mt-1 text-sm text-gray-600">
        {holderName.split(" ")[0]} earned this. Post the picture, or add it to a LinkedIn profile.
      </p>

      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        {canShareFiles ? (
          <button type="button" onClick={() => shareImage("square")} disabled={busy}
            className={`${btn} bg-primary text-white hover:bg-primary-600 disabled:opacity-60`}>
            <Share2 className="w-4 h-4" />
            Share image
          </button>
        ) : (
          <a href={certificateImageUrl(number, "square", true)} className={`${btn} bg-primary text-white hover:bg-primary-600`}>
            <Download className="w-4 h-4" />
            Image for a post
          </a>
        )}
        <a href={certificateImageUrl(number, "story", true)} className={`${btn} border-2 border-gray-200 text-primary hover:bg-gray-50`}>
          <Download className="w-4 h-4" />
          Image for a Story
        </a>
        <a href={linkedInAdd} target="_blank" rel="noopener noreferrer"
          className={`${btn} border-2 border-[#0a66c2] text-[#0a66c2] hover:bg-[#0a66c2]/5`}>
          Add to LinkedIn profile
        </a>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {links.map((l) => (
          <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer"
            className={`${btn} ${l.color} text-white hover:opacity-90`}>
            {l.name}
          </a>
        ))}
        <button type="button" onClick={copy} className={`${btn} border-2 border-gray-200 text-gray-700 hover:bg-gray-50`}>
          {copied ? <Check className="w-4 h-4 text-green-600" /> : <Link2 className="w-4 h-4" />}
          {copied ? "Copied" : "Copy link"}
        </button>
      </div>
    </section>
  );
}
