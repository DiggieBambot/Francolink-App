import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Shared layout + heading primitives for the "clean & premium" system.
 * Use these instead of re-inventing max-w wrappers and eyebrow/heading markup,
 * so every public surface (landing, library, auth, lessons) matches by default.
 *
 * Convention: brand scale only — primary (navy) / secondary (orange) / gray.
 * Avoid slate-* for new work.
 */

export function Container({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return <div className={cn("mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8", className)}>{children}</div>;
}

export function Section({
  className,
  children,
  id,
}: {
  className?: string;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={id} className={cn("py-16 sm:py-24", className)}>
      {children}
    </section>
  );
}

/** Small uppercase orange label that sits above a heading. */
export function Eyebrow({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <span className={cn("inline-block text-sm font-bold uppercase tracking-wider text-secondary", className)}>
      {children}
    </span>
  );
}

/** Eyebrow + heading + optional subtitle, centered by default. */
export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = "center",
  className,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  align?: "center" | "left";
  className?: string;
}) {
  return (
    <div className={cn(align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-2xl", className)}>
      {eyebrow ? <div className="mb-3">{eyebrow}</div> : null}
      <h2 className="font-heading text-3xl font-extrabold leading-tight text-primary sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {subtitle ? <p className="mt-4 text-lg leading-relaxed text-gray-600">{subtitle}</p> : null}
    </div>
  );
}
