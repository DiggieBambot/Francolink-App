import Link from "next/link";
import { BookOpen, GraduationCap, ArrowRight } from "lucide-react";

/**
 * Entry screen for /login and /signup: pick Student or Tutor, then go to the
 * role-specific page. Renders inside the (auth) split-screen layout.
 */
export function RoleChooser({ mode }: { mode: "login" | "signup" }) {
  const isSignup = mode === "signup";
  const options = [
    {
      role: "student" as const,
      icon: BookOpen,
      title: "I'm a student",
      desc: isSignup
        ? "Browse lessons free and learn live with a tutor."
        : "Log in to continue learning.",
      href: `/${mode}/student`,
      accent: "primary",
    },
    {
      role: "tutor" as const,
      icon: GraduationCap,
      title: "I'm a tutor",
      desc: isSignup
        ? "Teach, bring your students, and earn commission."
        : "Log in to your teaching dashboard.",
      href: `/${mode}/tutor`,
      accent: "secondary",
    },
  ];

  return (
    <div className="w-full max-w-md">
      <div className="mb-8 text-center">
        <h1 className="font-heading text-2xl font-bold text-primary">
          {isSignup ? "Join FrancoLink" : "Welcome back"}
        </h1>
        <p className="mt-1 text-gray-600">
          {isSignup ? "How would you like to get started?" : "How would you like to log in?"}
        </p>
      </div>

      <div className="space-y-4">
        {options.map((o) => {
          const navy = o.accent === "primary";
          return (
            <Link
              key={o.role}
              href={o.href}
              className="group flex items-center gap-4 rounded-2xl border-2 border-gray-100 bg-white p-5 shadow-soft transition hover:-translate-y-0.5 hover:border-gray-200 hover:shadow-medium"
            >
              <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl ${navy ? "bg-primary-100 text-primary" : "bg-secondary-100 text-secondary-700"}`}>
                <o.icon className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-heading font-bold text-primary">{o.title}</h2>
                <p className="text-sm text-gray-500">{o.desc}</p>
              </div>
              <ArrowRight className="h-5 w-5 flex-shrink-0 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-gray-500" />
            </Link>
          );
        })}
      </div>

      <p className="mt-8 text-center text-gray-600">
        {isSignup ? (
          <>Already have an account? <Link href="/login" className="font-semibold text-secondary hover:underline">Log in</Link></>
        ) : (
          <>New to FrancoLink? <Link href="/signup" className="font-semibold text-secondary hover:underline">Sign up</Link></>
        )}
      </p>
    </div>
  );
}
