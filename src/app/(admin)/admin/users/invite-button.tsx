// "Invite to apply" button, shared by the Users table and the user detail page.
// Renders nothing for a tutor who is already listed or a demo account, and
// "Invited <date>" while the 14-day cooldown runs.
import { Send } from "lucide-react";
import { inviteToApply } from "./invite-actions";
import { APPLY_INVITE_COOLDOWN_DAYS, type ListingStatus } from "@/lib/analytics/tutor-funnel";
import { isDemoEmail } from "@/lib/demo";

export function InviteToApplyButton({
  userId,
  email,
  role,
  listing,
  lastInvitedAt,
  size = "sm",
}: {
  userId: string;
  email: string | null;
  role: string | null;
  listing: ListingStatus;
  lastInvitedAt: string | null;
  size?: "sm" | "md";
}) {
  const r = (role || "USER").toUpperCase();
  if (r === "ADMIN" || r === "COMMUNITY_MANAGER") return null;
  if (listing === "listed" || isDemoEmail(email)) return null;

  const cooling =
    lastInvitedAt && Date.now() - Date.parse(lastInvitedAt) < APPLY_INVITE_COOLDOWN_DAYS * 86400_000;
  if (cooling) {
    return (
      <span className="text-xs text-gray-400 whitespace-nowrap" title="You can resend after 14 days">
        Invited {new Date(lastInvitedAt!).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
      </span>
    );
  }

  return (
    <form action={inviteToApply}>
      <input type="hidden" name="user_id" value={userId} />
      <button
        type="submit"
        className={
          size === "md"
            ? "inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700"
            : "inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs font-medium hover:bg-emerald-100 whitespace-nowrap"
        }
        title={r === "TUTOR" ? "Email them a link to apply to be listed" : "Email them a link to apply to teach"}
      >
        <Send className={size === "md" ? "w-4 h-4" : "w-3 h-3"} />
        {lastInvitedAt ? "Invite again" : "Invite to apply"}
      </button>
    </form>
  );
}
