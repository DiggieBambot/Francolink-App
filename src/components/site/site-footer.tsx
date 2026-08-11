import Image from "next/image";
import Link from "next/link";
import { Facebook, Instagram, Linkedin, Mail, Youtube } from "lucide-react";
import { getAppConfig } from "@/lib/config";
import { appUrl } from "@/lib/site/hosts";

const COLUMNS = [
  {
    title: "Learn",
    links: [
      { href: "/tutors", label: "Find a tutor" },
      { href: "/how-it-works", label: "How it works" },
      { href: "/pricing", label: "Pricing" },
      { href: "/testimonials", label: "Student stories" },
    ],
  },
  {
    title: "Earning opportunities",
    links: [
      { href: "/teach", label: "Become a tutor" },
      { href: "/teach#tiers", label: "Tutor pay and tiers" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/faq", label: "FAQ" },
      { href: "/contact", label: "Contact" },
      { href: "/blog", label: "Blog" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/privacy", label: "Privacy policy" },
      { href: "/terms", label: "Terms of service" },
    ],
  },
];

export async function SiteFooter() {
  const config = await getAppConfig();

  const socials = [
    { url: config.facebook_url, Icon: Facebook, label: "Facebook" },
    { url: config.instagram_url, Icon: Instagram, label: "Instagram" },
    { url: config.twitter_url, Icon: Linkedin, label: "LinkedIn" },
    { url: process.env.NEXT_PUBLIC_YOUTUBE_URL || "", Icon: Youtube, label: "YouTube" },
  ].filter((s) => s.url);

  return (
    <footer className="bg-primary text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-6">
          <div className="lg:col-span-2">
            <Image
              src="/dark-logo-transparent.png"
              alt="FrancoLink"
              width={200}
              height={56}
              className="h-12 w-auto"
            />
            <p className="mt-5 text-primary-100 text-sm leading-relaxed max-w-sm">
              {config.app_tagline}. Structured CEFR lessons, certified tutors and
              daily practice — all in one app.
            </p>
            <a
              href={appUrl("/signup")}
              className="mt-6 inline-flex items-center gap-2 bg-secondary text-primary-900 font-bold px-5 py-3 rounded-xl hover:bg-secondary-400 transition-colors"
            >
              Open the app
            </a>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h3 className="font-heading font-bold text-sm uppercase tracking-wider text-secondary mb-4">
                {col.title}
              </h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-primary-100 hover:text-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="text-primary-100 text-sm">
            © {new Date().getFullYear()} {config.company_name}. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <a
              href={`mailto:${config.support_email}`}
              aria-label="Email us"
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
            >
              <Mail className="w-4 h-4" />
            </a>
            {socials.map(({ url, Icon, label }) => (
              <a
                key={label}
                href={url}
                aria-label={label}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
