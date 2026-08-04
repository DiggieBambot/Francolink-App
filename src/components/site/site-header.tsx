"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Menu, X } from "lucide-react";
import { appUrl } from "@/lib/site/hosts";

// Nav for the front-facing website. Every "app" destination is an absolute
// cross-host link — the app lives on a different domain now, so next/link
// prefetching would be wrong here.
const NAV = [
  { href: "/tutors", label: "Find a tutor" },
  { href: "/how-it-works", label: "How it works" },
  { href: "/pricing", label: "Pricing" },
  { href: "/testimonials", label: "Stories" },
  { href: "/faq", label: "FAQ" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-primary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Link href="/" className="flex items-center shrink-0">
            <Image
              src="/logo-new.png"
              alt="FrancoLink"
              width={200}
              height={44}
              className="h-9 md:h-11 w-auto"
              priority
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-7">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm font-semibold text-gray-600 hover:text-primary transition-colors"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-3">
            <a
              href={appUrl("/login")}
              className="text-sm font-semibold text-primary px-4 py-2 rounded-lg hover:bg-primary-50 transition-colors"
            >
              Log in
            </a>
            <a
              href={appUrl("/signup")}
              className="text-sm font-bold text-white bg-primary px-5 py-2.5 rounded-xl hover:bg-primary-800 transition-all shadow-lg shadow-primary/20 hover:-translate-y-0.5"
            >
              Open the app
            </a>
          </div>

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            className="lg:hidden p-2 -mr-2 text-primary"
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-primary-50 bg-white">
          <nav className="max-w-7xl mx-auto px-4 py-4 flex flex-col gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="py-3 text-base font-semibold text-gray-700 hover:text-primary"
              >
                {item.label}
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-4 mt-2 border-t border-gray-100">
              <a
                href={appUrl("/login")}
                className="py-3 text-center font-semibold text-primary rounded-xl border border-primary-100"
              >
                Log in
              </a>
              <a
                href={appUrl("/signup")}
                className="py-3 text-center font-bold text-white bg-primary rounded-xl"
              >
                Open the app
              </a>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
