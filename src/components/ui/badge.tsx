import { cn } from "@/lib/utils";

interface BadgeProps {
  variant?: "primary" | "secondary" | "success" | "warning" | "error" | "premium";
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant = "primary", children, className }: BadgeProps) {
  const variants = {
    primary: "bg-primary-100 text-primary-700",
    secondary: "bg-secondary-100 text-secondary-700",
    success: "bg-success-light text-green-700",
    warning: "bg-warning-light text-amber-700",
    error: "bg-error-light text-red-700",
    premium: "bg-purple-100 text-purple-700",
  };

  return (
    <span className={cn("inline-flex items-center px-2.5 py-1 rounded-full text-sm font-medium", variants[variant], className)}>
      {children}
    </span>
  );
}