// src/components/layout/navbar.tsx

"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, ChevronDown } from "lucide-react";
import { Logo } from "./logo";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

const navItems = [
  { label: "Home", href: "/" },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 md:h-20">
          <Logo />

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <div key={item.label} className="relative">
                {item.children ? (
                  <>
                    <button
                      className="flex items-center gap-1 text-primary-600 hover:text-primary transition-colors cursor-pointer"
                      onClick={() =>
                        setActiveDropdown(
                          activeDropdown === item.label ? null : item.label
                        )
                      }
                    >
                      {item.label}
                      <ChevronDown className="w-4 h-4" />
                    </button>

                    {activeDropdown === item.label && (
                      <div className="absolute top-full left-0 mt-2 w-48 bg-white rounded-xl shadow-medium py-2">
                        {item.children.map((child) => (
                          <Link
                            key={child.label}
                            href={child.href}
                            className="block px-4 py-2 text-primary-600 hover:bg-primary-50 transition-colors"
                            onClick={() => setActiveDropdown(null)}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    href={item.href}
                    className="text-primary-600 hover:text-primary transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </div>
            ))}

            <Link
              href="/login"
              className="text-primary-600 hover:text-primary transition-colors"
            >
              Log In
            </Link>

            <Link href="/signup">
              <Button>Start Here</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-primary-600 cursor-pointer"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-4">
              {navItems.map((item) => (
                <div key={item.label}>
                  {item.children ? (
                    <>
                      <button
                        className="flex items-center justify-between w-full py-2 text-primary-600 cursor-pointer"
                        onClick={() =>
                          setActiveDropdown(
                            activeDropdown === item.label ? null : item.label
                          )
                        }
                      >
                        {item.label}
                        <ChevronDown
                          className={cn(
                            "w-4 h-4 transition-transform",
                            activeDropdown === item.label && "rotate-180"
                          )}
                        />
                      </button>
                      {activeDropdown === item.label && (
                        <div className="pl-4 mt-2 flex flex-col gap-2">
                          {item.children.map((child) => (
                            <Link
                              key={child.label}
                              href={child.href}
                              className="py-2 text-primary-500"
                              onClick={() => setMobileMenuOpen(false)}
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link
                      href={item.href}
                      className="block py-2 text-primary-600"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Link>
                  )}
                </div>
              ))}

              <hr className="border-gray-100" />

              <Link href="/login" className="py-2 text-primary-600">
                Log In
              </Link>

              <Link href="/signup">
                <Button className="w-full">Start Here</Button>
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}