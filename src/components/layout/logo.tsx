import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  const sizes = {
    sm: { box: "w-8 h-8", text: "text-sm", brand: "text-base" },
    md: { box: "w-9 h-9", text: "text-sm", brand: "text-lg" },
    lg: { box: "w-11 h-11", text: "text-lg", brand: "text-2xl" },
  };

  const s = sizes[size];

  return (
    <Link href="/" className={cn("flex items-center gap-2.5 group", className)}>
      <div
        className={cn(
          s.box,
          "bg-primary rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow"
        )}
      >
        <span
          className={cn(
            s.text,
            "text-white font-heading font-extrabold tracking-tight"
          )}
        >
          FL
        </span>
      </div>
      {showText && (
        <div>
          <span
            className={cn(
              s.brand,
              "font-heading font-extrabold text-primary leading-none"
            )}
          >
            Franco{" "}
            <span className="text-secondary">Link</span>
          </span>
          {size !== "sm" && (
            <span className="block text-[10px] text-gray-400 font-medium tracking-wide uppercase">
              Language Learning
            </span>
          )}
        </div>
      )}
    </Link>
  );
}