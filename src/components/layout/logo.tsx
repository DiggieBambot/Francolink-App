import Link from "next/link";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

export function Logo({ className }: LogoProps) {
  return (
    <Link href="/" className={cn("flex items-center gap-2", className)}>
      <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
        <span className="text-white font-heading font-bold text-xl">F</span>
      </div>
      <span className="font-heading font-bold text-xl text-primary">
        FRANCO<span className="text-secondary">LINK</span>
      </span>
    </Link>
  );
}