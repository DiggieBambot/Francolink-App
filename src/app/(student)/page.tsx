// src/app/(student)/page.tsx

import Link from "next/link";
import { Navbar, Footer, WaveDivider } from "@/components/layout";
import { Button, Card } from "@/components/ui";
import {
  GraduationCap,
  Users,
  Heart,
  Sparkles,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

const languages = [
  { name: "English", flag: "🇬🇧", code: "en", href: "/learn/en/a1", coming: false },
  { name: "Spanish", flag: "🇪🇸", code: "es", href: "/learn/es/a1", coming: false },
  { name: "French", flag: "🇫🇷", code: "fr", href: "/learn/fr/a1", coming: false },
  { name: "German", flag: "🇩🇪", code: "de", href: "/learn/de/a1", coming: false },
  { name: "Italian", flag: "🇮🇹", code: "it", href: "/learn/it/a1", coming: true },
  { name: "Portuguese", flag: "🇵🇹", code: "pt", href: "/learn/pt/a1", coming: true },
];

const features = [
  {
    icon: GraduationCap,
    title: "Expert Curriculum",
    description:
      "Language coaches supporting your journey with professionally designed lessons.",
  },
  {
    icon: Users,
    title: "Group Live Lessons",
    description:
      "Private and group classes available with certified tutors.",
  },
  {
    icon: Heart,
    title: "Personal Approach",
    description:
      "Enrich your life with another language through personalized learning paths.",
  },
];

const benefits = [
  "Helping engage remote employees",
  "Flexible delivery options (1:1 or group, online/face-to-face)",
  "Courses in English, French, Spanish, German (others on request)",
  "Timetabled approach with flexible scheduling",
];

export default function HomePage() {
  return (
    <>
      <Navbar />

      <main className="flex-1">
        {/* ===== HERO SECTION ===== */}
        <section className="relative bg-white pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold mb-6 text-primary">
                  Highly Trained and Certified Tutors
                </h1>
                <p className="text-2xl md:text-3xl text-secondary font-heading font-semibold mb-4">
                  Learn any Language for free!!
                </p>
                <p className="text-lg text-gray-600 mb-8">
                  Join 500+ students online and start your language learning
                  journey today.
                </p>
                <Link href="#languages">
                  <Button size="lg">
                    Choose your language
                    <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </Link>
              </div>

              <div className="relative aspect-video rounded-2xl overflow-hidden shadow-hard bg-primary">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Sparkles className="w-16 h-16 text-secondary animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          <WaveDivider position="bottom" color="#f9fafb" />
        </section>

        {/* ===== LANGUAGE SELECTION ===== */}
        <section id="languages" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary mb-4">
                Which language do you want to learn?
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
                Choose from our selection of languages and start learning today.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {languages.map((language) => (
                <Link
                  key={language.name}
                  href={language.coming ? "#" : language.href}
                  className={`
                    relative p-6 bg-white border-2 rounded-2xl text-center
                    transition-all duration-300
                    ${
                      language.coming
                        ? "border-gray-200 opacity-60 cursor-not-allowed"
                        : "border-gray-200 hover:border-secondary hover:shadow-medium hover:-translate-y-1"
                    }
                  `}
                >
                  <span className="text-5xl mb-3 block">{language.flag}</span>
                  <span className="font-heading font-semibold text-primary">
                    {language.name}
                  </span>
                  {language.coming && (
                    <span className="absolute top-2 right-2 text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-full">
                      Soon
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* ===== FEATURES ===== */}
        <section className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary mb-4">
                Why We&apos;re Different
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {features.map((feature) => (
                <Card key={feature.title} className="text-center">
                  <div className="w-16 h-16 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                    <feature.icon className="w-8 h-8 text-secondary" />
                  </div>
                  <h3 className="text-xl font-heading font-bold text-primary mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ===== WHY LEARN WITH US ===== */}
        <section className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary mb-8">
                  Why Learn With Us?
                </h2>
                <ul className="space-y-4">
                  {benefits.map((benefit) => (
                    <li key={benefit} className="flex items-start gap-3">
                      <CheckCircle className="w-6 h-6 text-secondary flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{benefit}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-8">
                  <Link href="/signup">
                    <Button>Start Learning Free</Button>
                  </Link>
                </div>
              </div>

              <div className="space-y-4">
                <Card className="border-l-4 border-secondary">
                  <p className="text-gray-700 italic mb-4">
                    &quot;The lessons have been incredible. I went from
                    knowing nothing to having real conversations in just 3
                    months!&quot;
                  </p>
                  <p className="font-semibold text-primary">— Jo, Onfido</p>
                </Card>
                <Card className="border-l-4 border-secondary">
                  <p className="text-gray-700 italic mb-4">
                    &quot;The teaching ability and patience of the tutors is
                    remarkable. Highly recommended.&quot;
                  </p>
                  <p className="font-semibold text-primary">
                    — Sule, Community Matters CEO
                  </p>
                </Card>
                <Card className="border-l-4 border-secondary">
                  <p className="text-gray-700 italic mb-4">
                    &quot;I finally have the confidence to use my new language in my
                    professional life.&quot;
                  </p>
                  <p className="font-semibold text-primary">
                    — Roland, JP Morgan
                  </p>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* ===== CTA SECTION ===== */}
        <section className="relative py-20 gradient-orange overflow-hidden">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-white mb-6">
              Ready to Start Your Language Journey?
            </h2>
            <p className="text-white/90 text-lg mb-8 max-w-2xl mx-auto">
              Join thousands of learners who are already achieving their
              language goals with FrancoLink.
            </p>
            <Link href="/signup">
              <Button
                variant="secondary"
                size="lg"
                className="bg-white text-secondary border-0 hover:bg-gray-100 hover:text-secondary-600"
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}