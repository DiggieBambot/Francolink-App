// src/components/layout/navbar.tsx

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Menu, X, ChevronDown, LogOut, LayoutDashboard } from "lucide-react";
import { Logo } from "./logo";
import { Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "/" },
  { label: "Lesson Materials", href: "/library" },
  { label: "How it works", href: "/how-it-works" },
  {
    label: "Learning Resources",
    href: "#",
    children: [
      { label: "🇫🇷 French", href: "/learn/fr/a1" },
      { label: "🇪🇸 Spanish", href: "/learn/es/a1" },
      { label: "🇬🇧 English", href: "/learn/en/a1" },
      { label: "🇩🇪 German", href: "/learn/de/a1" },
    ],
  },
];

export function Navbar() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [authed, setAuthed] = useState<boolean | null>(null);
  const [dashHref, setDashHref] = useState("/dashboard");

  useEffect(() => {
    const supabase = createClient();
    let active = true;
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!active) return;
      if (!user) {
        setAuthed(false);
        return;
      }
      const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).maybeSingle();
      const role = (profile?.role || "").toUpperCase();
      setDashHref(role === "TUTOR" ? "/tutor" : role === "ADMIN" ? "/admin" : "/dashboard");
      setAuthed(true);
    })();
    return () => {
      active = false;
    };
  }, []);

  async function logout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    setAuthed(false);
    window.location.href = "/";
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-gray-100 bg-white/95 backdrop-blur-sm">
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between md:h-20">
          <Logo />

          {/* Desktop Navigation */}
          <div className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <div key={item.label} className="relative">
                {item.children ? (
                  <>
                    <button
                      className="flex cursor-pointer items-center gap-1 text-primary-600 transition-colors hover:text-primary"
                      onClick={() => setActiveDropdown(activeDropdown === item.label ? null : item.label)}
                    >
                      {item.label}
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    {activeDropdown === item.label && (
                      <div className="absolute left-0 top-full mt-2 w-48 rounded-xl bg-white py-2 shadow-medium">
                        {item.children.map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            className="block px-4 py-2 text-primary-600 transition-colors hover:bg-primary-50"
                            onClick={() => setActiveDropdown(null)}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link href={item.href} className="text-primary-600 transition-colors hover:text-primary">
                    {item.label}
                  </Link>
                )}
              </div>
            ))}

            {authed ? (
              <>
                <Link href={dashHref} className="inline-flex items-center gap-1.5 text-primary-600 transition-colors hover:text-primary">
                  <LayoutDashboard className="h-4 w-4" /> Dashboard
                </Link>
                <button onClick={logout} className="inline-flex items-center gap-1.5 text-gray-500 transition-colors hover:text-primary">
                  <LogOut className="h-4 w-4" /> Log out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-primary-600 transition-colors hover:text-primary">
                  Log In
                </Link>
                <Link href="/signup">
                  <Button>Start Here</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            className="cursor-pointer p-2 text-primary-600 md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="border-t border-gray-100 py-4 md:hidden">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <div key={item.label}>
                  {item.children ? (
                    <>
                      <button
                        className="flex w-full cursor-pointer items-center justify-between py-2 text-primary-600"
                        onClick={() => setActiveDropdown(activeDropdown === item.label ? null : item.label)}
                      >
                        {item.label}
                        <ChevronDown className={cn("h-4 w-4 transition-transform", activeDropdown === item.label && "rotate-180")} />
                      </button>
                      {activeDropdown === item.label && (
                        <div className="mt-2 flex flex-col gap-2 pl-4">
                          {item.children.map((child) => (
                            <Link key={child.label} href={child.href} className="py-2 text-primary-500" onClick={() => setMobileMenuOpen(false)}>
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link href={item.href} className="block py-2 text-primary-600" onClick={() => setMobileMenuOpen(false)}>
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}

              <hr className="border-gray-100" />

              {authed ? (
                <>
                  <Link href={dashHref} className="py-2 text-primary-600" onClick={() => setMobileMenuOpen(false)}>
                    Dashboard
                  </Link>
                  <button onClick={logout} className="py-2 text-left text-gray-500">
                    Log out
                  </button>
                </>
              ) : (
                <>
                  <Link href="/login" className="py-2 text-primary-600" onClick={() => setMobileMenuOpen(false)}>
                    Log In
                  </Link>
                  <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                    <Button className="w-full">Start Here</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
