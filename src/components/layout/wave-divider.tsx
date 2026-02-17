import { cn } from "@/lib/utils";

interface WaveDividerProps {
  position?: "top" | "bottom";
  color?: string;
  className?: string;
}

export function WaveDivider({
  position = "bottom",
  color = "#ffffff",
  className,
}: WaveDividerProps) {
  return (
    <div
      className={cn(
        "absolute left-0 right-0 overflow-hidden leading-none",
        position === "bottom" ? "bottom-0" : "top-0 rotate-180",
        className
      )}
    >
      <svg
        className="relative block w-full h-16 md:h-24"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <path
          d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"
          fill={color}
        />
      </svg>
    </div>
  );
}