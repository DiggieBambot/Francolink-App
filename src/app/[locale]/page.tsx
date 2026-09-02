export const dynamic = 'force-dynamic';
import { useTranslations } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LanguageSwitcher } from "@/components/language-switcher";
import { CurrencySwitcher } from "@/components/currency-switcher";
import Image from "next/image";
import Link from "next/link";
import {
  GraduationCap, Users, Sparkles, BookOpen, BarChart3, Globe,
  CheckCircle, ArrowRight, Star, Zap, Award, Building2, ChevronRight,
  Shield, Clock, MessageCircle,
} from "lucide-react";
import { LANGUAGES } from "@/lib/constants";
import { Navbar } from "@/components/layout/navbar";

interface PageProps {
  params: Promise<{ locale: string }>;
}

export default async function LocaleHomePage({ params }: PageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  // Logged-in users land on their dashboard, not the marketing page — this is
  // what a reopened PWA (start_url "/") shows. Logged-out visitors see the page.
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) {
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const role = (profile?.role || "").toUpperCase();
    if (role === "TUTOR") redirect("/tutor");
    if (role === "ADMIN") redirect("/admin");
    redirect("/dashboard");
  }

  return <HomeContent />;
}

function HomeContent() {
  const t = useTranslations();

  return (
    <div className="min-h-screen bg-white font-body">
      <Navbar />
      {/* Spacer to push content below the fixed navbar */}
      <div className="h-16 md:h-20" />

      {/* HERO SECTION */}
      <section className="relative bg-primary-50 overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-[500px] h-[500px] bg-secondary/5 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-primary-100/60 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/40 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-24 sm:pb-32">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white border border-primary-100 rounded-full px-5 py-2 mb-8 shadow-sm">
              <Award className="w-4 h-4 text-secondary" />
              <span className="text-sm font-semibold text-primary">{t("landing.badge")}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-heading font-extrabold text-primary leading-[1.1] mb-6 tracking-tight">
              {t("landing.hero_title")}
            </h1>

            <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto mb-10 leading-relaxed">
              {t("landing.hero_subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
              <Link href="/signup/student" className="inline-flex items-center justify-center gap-2.5 bg-primary text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-primary-800 transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
                <BookOpen className="w-5 h-5" />
                Start learning
              </Link>
              <Link href="/signup/tutor" className="inline-flex items-center justify-center gap-2.5 bg-secondary text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-secondary-600 transition-all shadow-lg shadow-secondary/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
                <GraduationCap className="w-5 h-5" />
                Sign up as a Tutor
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6 max-w-3xl mx-auto">
              {[
                { value: t("landing.stats_students"), label: t("landing.stats_students_label"), icon: Users },
                { value: t("landing.stats_tutors"), label: t("landing.stats_tutors_label"), icon: GraduationCap },
                { value: t("landing.stats_languages"), label: t("landing.stats_languages_label"), icon: Globe },
                { value: t("landing.stats_rating"), label: t("landing.stats_rating_label"), icon: Star },
              ].map((stat) => (
                <div key={stat.label} className="bg-white rounded-2xl p-5 shadow-soft border border-gray-100/80 hover:shadow-medium transition-shadow">
                  <stat.icon className="w-5 h-5 text-secondary mx-auto mb-2.5" />
                  <div className="text-2xl sm:text-3xl font-heading font-extrabold text-primary">{stat.value}</div>
                  <div className="text-xs font-medium text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full" preserveAspectRatio="none">
            <path d="M0,40 C480,80 960,0 1440,40 L1440,80 L0,80 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* LANGUAGE SELECTION */}
      <section id="languages" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <span className="inline-block text-sm font-bold text-secondary uppercase tracking-wider mb-3">{t("nav.languages")}</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-primary mb-5">{t("landing.languages_title")}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">{t("landing.languages_subtitle")}</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-3xl mx-auto mb-12">
            {LANGUAGES.available.map((lang) => (
              <Link key={lang.code} href="/signup" className="group relative bg-white border-2 border-gray-100 rounded-2xl p-8 text-center hover:border-secondary transition-all hover:-translate-y-1 hover:shadow-medium">
                <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-50 text-green-600 px-2.5 py-1 rounded-full">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-[10px] font-bold uppercase tracking-wide">Live</span>
                </div>
                <div className="text-6xl mb-5">{lang.flag}</div>
                <h3 className="text-xl font-heading font-bold text-primary mb-2">{lang.name}</h3>
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-secondary opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  {t("landing.cta")}
                  <ChevronRight className="w-4 h-4" />
                </span>
              </Link>
            ))}
          </div>

          <div className="max-w-4xl mx-auto">
            <p className="text-center text-sm font-medium text-gray-400 uppercase tracking-wider mb-4">{t("landing.coming_soon")}</p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
              {LANGUAGES.comingSoon.slice(0, 6).map((lang) => (
                <div key={lang.code} className="bg-gray-50 rounded-xl p-4 text-center border border-gray-100 opacity-70 hover:opacity-90 transition-opacity">
                  <div className="text-3xl mb-2">{lang.flag}</div>
                  <p className="text-xs font-semibold text-gray-500">{lang.name}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="py-20 sm:py-28 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-bold text-secondary uppercase tracking-wider mb-3">Features</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-primary mb-5">{t("landing.features_title")}</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">{t("landing.features_subtitle")}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
            {[
              { icon: Shield, title: t("landing.feature_certified"), desc: t("landing.feature_certified_desc"), iconBg: "bg-primary-100", iconColor: "text-primary" },
              { icon: Users, title: t("landing.feature_live"), desc: t("landing.feature_live_desc"), iconBg: "bg-secondary-100", iconColor: "text-secondary-700" },
              { icon: Zap, title: t("landing.feature_free"), desc: t("landing.feature_free_desc"), iconBg: "bg-green-50", iconColor: "text-green-600" },
              { icon: BookOpen, title: t("landing.feature_curriculum"), desc: t("landing.feature_curriculum_desc"), iconBg: "bg-primary-100", iconColor: "text-primary" },
              { icon: MessageCircle, title: t("landing.feature_ai"), desc: t("landing.feature_ai_desc"), iconBg: "bg-secondary-100", iconColor: "text-secondary-700" },
              { icon: BarChart3, title: t("landing.feature_track"), desc: t("landing.feature_track_desc"), iconBg: "bg-green-50", iconColor: "text-green-600" },
            ].map((feature) => (
              <div key={feature.title} className="group bg-white rounded-2xl p-8 border border-gray-100 hover:border-transparent hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
                <div className={`w-14 h-14 ${feature.iconBg} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className={`w-7 h-7 ${feature.iconColor}`} />
                </div>
                <h3 className="text-lg font-heading font-bold text-primary mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed text-[15px]">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-bold text-secondary uppercase tracking-wider mb-3">Getting Started</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-primary mb-5">{t("landing.how_it_works")}</h2>
            <p className="text-lg text-gray-600">{t("landing.how_it_works_subtitle")}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 lg:gap-12 max-w-5xl mx-auto relative">
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 bg-gradient-to-r from-secondary/20 via-secondary to-secondary/20" />
            {[
              { step: "1", title: t("landing.step_1"), desc: t("landing.step_1_desc"), icon: GraduationCap },
              { step: "2", title: t("landing.step_2"), desc: t("landing.step_2_desc"), icon: Users },
              { step: "3", title: t("landing.step_3"), desc: t("landing.step_3_desc"), icon: Sparkles },
            ].map((item) => (
              <div key={item.step} className="relative text-center group">
                <div className="relative z-10 w-24 h-24 mx-auto mb-8">
                  <div className="absolute inset-0 bg-secondary/10 rounded-3xl rotate-6 group-hover:rotate-12 transition-transform duration-300" />
                  <div className="relative w-full h-full bg-white border-2 border-secondary rounded-3xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
                    <item.icon className="w-10 h-10 text-secondary" />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center text-sm font-bold shadow-md">{item.step}</div>
                </div>
                <h3 className="text-xl font-heading font-bold text-primary mb-3">{item.title}</h3>
                <p className="text-gray-600 leading-relaxed max-w-xs mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center mt-14">
            <Link href="/signup" className="inline-flex items-center justify-center gap-2.5 bg-primary text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-primary-800 transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5">
              {t("landing.cta")}
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="py-20 sm:py-28 bg-primary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-16">
            <span className="inline-block text-sm font-bold text-secondary uppercase tracking-wider mb-3">Testimonials</span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-primary mb-5">{t("landing.social_proof_title")}</h2>
            <p className="text-lg text-gray-600">{t("landing.social_proof_subtitle")}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-8 shadow-soft border border-gray-100/80 hover:shadow-medium transition-all duration-300 hover:-translate-y-1">
                <div className="flex gap-0.5 mb-5">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-secondary text-secondary" />
                  ))}
                </div>
                <blockquote className="text-gray-700 leading-relaxed mb-6 text-[15px]">&ldquo;{t(`landing.testimonial_${i}_text`)}&rdquo;</blockquote>
                <div className="flex items-center gap-3 pt-5 border-t border-gray-100">
                  <div className="w-11 h-11 bg-gradient-to-br from-primary to-primary-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                    {t(`landing.testimonial_${i}_name`).charAt(0)}
                  </div>
                  <div>
                    <div className="font-heading font-bold text-primary text-sm">{t(`landing.testimonial_${i}_name`)}</div>
                    <div className="text-xs text-gray-500 font-medium">{t(`landing.testimonial_${i}_role`)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CORPORATE */}
      <section className="py-20 sm:py-28 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-primary rounded-3xl p-10 sm:p-16 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-80 h-80 bg-secondary/8 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-3xl pointer-events-none" />
            <div className="relative grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
              <div>
                <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6 border border-white/10">
                  <Building2 className="w-4 h-4 text-secondary" />
                  <span className="text-sm font-semibold text-white/80">For Business</span>
                </div>
                <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-white mb-5 leading-tight">{t("landing.corporate_title")}</h2>
                <p className="text-lg text-white/70 mb-8 leading-relaxed">{t("landing.corporate_subtitle")}</p>
                <Link href="/contact" className="inline-flex items-center gap-2.5 bg-secondary text-white px-7 py-3.5 rounded-xl font-bold hover:bg-secondary-600 transition-all shadow-lg shadow-secondary/30 hover:shadow-xl hover:-translate-y-0.5">
                  {t("landing.corporate_cta")}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
              <div className="space-y-4">
                {[
                  { text: t("landing.corporate_benefit_1"), icon: Clock },
                  { text: t("landing.corporate_benefit_2"), icon: BarChart3 },
                  { text: t("landing.corporate_benefit_3"), icon: BookOpen },
                  { text: t("landing.corporate_benefit_4"), icon: Users },
                ].map((benefit) => (
                  <div key={benefit.text} className="flex items-center gap-4 bg-white/8 hover:bg-white/12 rounded-xl p-5 transition-colors border border-white/5">
                    <div className="w-10 h-10 bg-secondary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <benefit.icon className="w-5 h-5 text-secondary" />
                    </div>
                    <span className="text-white font-medium text-[15px]">{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="py-20 sm:py-28 bg-gray-50 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute -top-20 -left-20 w-80 h-80 bg-primary-100/50 rounded-full blur-3xl" />
          <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-secondary-100/40 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="w-16 h-16 bg-secondary-100 rounded-2xl flex items-center justify-center mx-auto mb-8">
            <Sparkles className="w-8 h-8 text-secondary" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-heading font-extrabold text-primary mb-6 leading-tight">{t("landing.final_cta_title")}</h2>
          <p className="text-lg sm:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">{t("landing.final_cta_subtitle")}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/signup" className="inline-flex items-center justify-center gap-2.5 bg-primary text-white px-8 py-4 rounded-xl text-lg font-bold hover:bg-primary-800 transition-all shadow-lg shadow-primary/20 hover:shadow-xl hover:-translate-y-0.5 active:translate-y-0">
              {t("landing.final_cta_button")}
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link href="/tutors" className="inline-flex items-center justify-center gap-2.5 bg-white text-primary px-8 py-4 rounded-xl text-lg font-semibold border border-gray-200 hover:border-primary-200 hover:bg-primary-50 transition-all shadow-sm">
              {t("landing.final_cta_tutor")}
            </Link>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-gray-400 text-sm">
            <div className="flex items-center gap-2"><Shield className="w-4 h-4" /><span>Free to start</span></div>
            <div className="flex items-center gap-2"><CheckCircle className="w-4 h-4" /><span>No credit card required</span></div>
            <div className="flex items-center gap-2"><Clock className="w-4 h-4" /><span>Setup in 30 seconds</span></div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-primary-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12 mb-12">
            <div className="col-span-2 md:col-span-1">
              <div className="mb-5">
                <Image
                  src="/dark-logo-transparent.webp"
                  alt="Francolink"
                  width={180}
                  height={60}
                  className="h-12 w-auto"
                />
              </div>
              <p className="text-sm text-white/50 leading-relaxed max-w-xs">{t("footer.description")}</p>
            </div>
            <div>
              <h4 className="font-heading font-bold text-sm mb-5 text-white/80 uppercase tracking-wider">{t("footer.product")}</h4>
              <ul className="space-y-3">
                {[{ href: "#languages", label: t("nav.languages") }, { href: "/pricing", label: t("nav.pricing") }, { href: "/tutors", label: t("nav.tutors") }].map((link) => (
                  <li key={link.href}><a href={link.href} className="text-sm text-white/50 hover:text-secondary transition-colors">{link.label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-bold text-sm mb-5 text-white/80 uppercase tracking-wider">{t("footer.company")}</h4>
              <ul className="space-y-3">
                {[{ href: "#", label: t("nav.about") }, { href: "#", label: t("nav.contact") }, { href: "#", label: t("nav.blog") }, { href: "#", label: t("footer.faq") }].map((link) => (
                  <li key={link.label}><a href={link.href} className="text-sm text-white/50 hover:text-secondary transition-colors">{link.label}</a></li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-heading font-bold text-sm mb-5 text-white/80 uppercase tracking-wider">{t("footer.legal")}</h4>
              <ul className="space-y-3">
                {[{ href: "#", label: t("footer.terms") }, { href: "#", label: t("footer.privacy") }, { href: "#", label: t("footer.cookies") }].map((link) => (
                  <li key={link.label}><a href={link.href} className="text-sm text-white/50 hover:text-secondary transition-colors">{link.label}</a></li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-white/30">{t("footer.copyright", { year: new Date().getFullYear() })}</p>
            <div className="flex items-center gap-2"><CurrencySwitcher /><LanguageSwitcher /></div>
          </div>
        </div>
      </footer>
    </div>
  );
}
