import Image from "next/image";
import { Logo } from "@/components/layout";
import Link from "next/link";
import { Shield, CheckCircle, Users } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      {/* ============================================
          LEFT SIDE — Branding Panel (hidden on mobile)
          ============================================ */}
      <div className="hidden lg:flex lg:w-[480px] xl:w-[540px] bg-gradient-to-br from-primary via-primary to-primary-800 relative overflow-hidden">
        {/* Background decorations */}
        <div className="absolute inset-0 pointer-events-none opacity-50">
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
        </div>

        <div className="relative flex flex-col justify-between p-10 w-full">
          {/* Logo */}
          <div>
            <Link href="/" className="flex items-center gap-2.5">
              <Image src="/logo-icon.png" alt="Francolink" width={40} height={40} className="rounded-xl" />
              <div>
                <span className="text-xl font-heading font-extrabold text-white leading-none">
                  franco<span className="text-white/70">link</span><span className="text-white/70">.</span>
                </span>
                <span className="block text-[10px] text-white/50 font-medium tracking-wide uppercase">
                  Learn · Speak · Connect
                </span>
              </div>
            </Link>
          </div>

          {/* Value Props */}
          <div className="space-y-8">
            <div>
              <h2 className="text-3xl xl:text-4xl font-heading font-extrabold text-white leading-tight mb-4">
                Start learning a new language today
              </h2>
              <p className="text-white/60 text-lg leading-relaxed">
                Join 5,000+ students learning with certified expert tutors.
              </p>
            </div>

            <div className="space-y-4">
              {[
                {
                  icon: CheckCircle,
                  text: "Free to start — no credit card required",
                },
                {
                  icon: Users,
                  text: "120+ certified, bilingual tutors",
                },
                {
                  icon: Shield,
                  text: "Structured curriculum from A0 to B2",
                },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-3 bg-white/8 rounded-xl p-4 border border-white/5"
                >
                  <div className="w-9 h-9 bg-secondary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <item.icon className="w-4 h-4 text-secondary" />
                  </div>
                  <span className="text-white/80 text-sm font-medium">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <p className="text-white/30 text-xs">
            © {new Date().getFullYear()} Francolink. All rights reserved.
          </p>
        </div>
      </div>

      {/* ============================================
          RIGHT SIDE — Auth Form
          ============================================ */}
      <div className="flex-1 flex flex-col bg-gray-50 min-h-screen">
        {/* Mobile Header */}
        <header className="lg:hidden p-4 bg-white border-b border-gray-100">
          <Logo size="md" />
        </header>

        {/* Form Area */}
        <main className="flex-1 flex items-center justify-center p-6 sm:p-8">
          {children}
        </main>

        {/* Mobile Footer */}
        <footer className="lg:hidden p-4 text-center text-xs text-gray-400">
          © {new Date().getFullYear()} Francolink. All rights reserved.
        </footer>
      </div>
    </div>
  );
}