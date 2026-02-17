import { cn } from "@/lib/utils";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ className, label, error, type = "text", ...props }: InputProps) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-primary-600 mb-2">
          {label}
        </label>
      )}
      <input
        type={type}
        className={cn(
          "w-full px-4 py-3 bg-white border rounded-xl text-primary-700",
          "placeholder:text-gray-400",
          "focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20",
          "transition-all duration-200",
          error ? "border-error" : "border-gray-200",
          className
        )}
        {...props}
      />
      {error && <p className="mt-1 text-sm text-error">{error}</p>}
    </div>
  );
}