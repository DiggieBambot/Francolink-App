"use client";

// The heart on a tutor card.
//
// On the marketing host this writes to a local shortlist, not the database —
// see src/lib/site/shortlist.ts for why that is the only option here. The
// visual state is identical either way, so a visitor never has to know that
// their shortlist is not yet an account thing.

import { Heart } from "lucide-react";
import { useShortlist } from "@/lib/site/shortlist";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  slug,
  name,
  className,
}: {
  slug: string;
  name: string;
  className?: string;
}) {
  const { has, toggle } = useShortlist();
  const saved = has(slug);

  return (
    <button
      type="button"
      onClick={(e) => {
        // The card is wrapped in links; a heart click must not navigate.
        e.preventDefault();
        e.stopPropagation();
        toggle(slug);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${name} from your shortlist` : `Save ${name}`}
      title={saved ? "Saved" : "Save for later"}
      className={cn(
        "inline-flex items-center justify-center w-9 h-9 rounded-full transition-colors",
        saved
          ? "bg-red-50 text-red-500 hover:bg-red-100"
          : "bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-red-400",
        className
      )}
    >
      <Heart className={cn("w-4.5 h-4.5", saved && "fill-current")} />
    </button>
  );
}
