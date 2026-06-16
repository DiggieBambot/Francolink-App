import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  const sizes = {
    sm: { icon: 32, brand: "text-base" },
    md: { icon: 36, brand: "text-lg" },
    lg: { icon: 44, brand: "text-2xl" },
  };

  const s = sizes[size];

  return (
    <Link href="/" className={cn("flex items-center gap-2.5 group", className)}>
      <Image
        src="/logo-icon.png"
        alt="FrancoLink"
        width={s.icon}
        height={s.icon}
        className="group-hover:scale-105 transition-transform"
        priority
      />
      {showText && (
        <div>
          <span
            className={cn(
              s.brand,
              "font-heading font-extrabold text-primary leading-none"
            )}
          >
            franco
            <span className="text-secondary">link</span>
            <span className="text-secondary">.</span>
          </span>
          {size !== "sm" && (
            <span className="block text-[10px] text-gray-400 font-medium tracking-wide uppercase">
              Learn · Speak · Connect
            </span>
          )}
        </div>
      )}
    </Link>
  );
}