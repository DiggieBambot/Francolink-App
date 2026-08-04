import Link from "next/link";
import { cn } from "@/lib/utils";

/** Standard vertical rhythm for a marketing section. */
export function Section({
  children,
  className,
  tone = "white",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  tone?: "white" | "tint" | "navy";
  id?: string;
}) {
  const tones = {
    white: "bg-white",
    tint: "bg-primary-50",
    navy: "bg-primary text-white",
  };
  return (
    <section id={id} className={cn(tones[tone], "py-16 sm:py-24", className)}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">{children}</div>
    </section>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  inverted = false,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  inverted?: boolean;
}) {
  return (
    <div
      className={cn(
        "mb-12",
        align === "center" ? "text-center max-w-3xl mx-auto" : "max-w-2xl"
      )}
    >
      {eyebrow && (
        <span className="inline-block text-xs font-bold uppercase tracking-[0.15em] text-secondary mb-3">
          {eyebrow}
        </span>
      )}
      <h2
        className={cn(
          "font-heading font-extrabold tracking-tight text-3xl sm:text-4xl lg:text-[2.75rem] leading-[1.15]",
          inverted ? "text-white" : "text-primary"
        )}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className={cn(
            "mt-4 text-lg leading-relaxed",
            inverted ? "text-primary-100" : "text-gray-600"
          )}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  className?: string;
  /** Cross-host links (to the app) must be plain anchors, not next/link. */
  external?: boolean;
};

export function CtaButton({
  href,
  children,
  variant = "primary",
  className,
  external,
}: ButtonProps) {
  const variants = {
    primary:
      "bg-primary text-white hover:bg-primary-800 shadow-lg shadow-primary/20",
    secondary:
      "bg-secondary text-primary-900 hover:bg-secondary-400 shadow-lg shadow-secondary/20",
    ghost:
      "bg-white text-primary border border-primary-100 hover:border-primary-300",
  };
  const classes = cn(
    "inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-base font-bold transition-all hover:-translate-y-0.5 active:translate-y-0",
    variants[variant],
    className
  );

  if (external) {
    return (
      <a href={href} className={classes}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={classes}>
      {children}
    </Link>
  );
}
