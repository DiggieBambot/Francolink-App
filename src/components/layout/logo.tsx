import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
  showText?: boolean;
}

export function Logo({ className, size = "md", showText = true }: LogoProps) {
  const heights = { sm: 32, md: 44, lg: 56 };
  const h = heights[size];

  return (
    <Link href="/" className={cn("flex items-center group", className)}>
      <Image
        src={showText ? "/logo-new.png" : "/logo-icon.png"}
        alt="Francolink"
        width={showText ? Math.round(h * 5.5) : h}
        height={h}
        className="group-hover:scale-[1.02] transition-transform"
        priority
      />
    </Link>
  );
}