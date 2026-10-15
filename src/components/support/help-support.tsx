// Help & support: DiggieChat docked into the page (it never floats in the
// app), with the other ways to reach us alongside. Shared by the student and
// tutor areas.

import Link from "next/link";
import { Bell, LifeBuoy, Mail, MessageCircle } from "lucide-react";
import { DiggieChatPanel } from "@/components/shared/diggie-chat-panel";

const SUPPORT_EMAIL = "support@francolink.net";

export function HelpSupport({
  name,
  email,
  notificationsHref,
}: {
  name?: string | null;
  email?: string | null;
  /** Where this area lists notifications; omitted where there is no page. */
  notificationsHref?: string;
}) {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-primary">
          <LifeBuoy className="w-6 h-6" /> Help &amp; support
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Ask our assistant anything about FrancoLink. If it can&apos;t help, someone from our team
          picks up the same conversation.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_18rem]">
        <section
          aria-label="Chat with FrancoLink support"
          className="h-[70dvh] min-h-[28rem] overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm"
        >
          <DiggieChatPanel visitorName={name} visitorEmail={email} />
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-heading text-sm font-bold text-gray-900">
              <MessageCircle className="w-4 h-4 text-primary" /> How this chat works
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              The assistant answers straight away. Ask for a person any time and the conversation
              goes to our team — you&apos;ll see their reply right here.
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="flex items-center gap-2 font-heading text-sm font-bold text-gray-900">
              <Mail className="w-4 h-4 text-primary" /> Prefer email?
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Write to{" "}
              <a href={`mailto:${SUPPORT_EMAIL}`} className="font-semibold text-primary underline underline-offset-4">
                {SUPPORT_EMAIL}
              </a>
              . We usually reply within a day.
            </p>
          </div>

          {notificationsHref && (
            <Link
              href={notificationsHref}
              className="flex items-center gap-2 rounded-2xl border border-gray-200 bg-white p-5 text-sm font-semibold text-primary shadow-sm hover:bg-gray-50"
            >
              <Bell className="w-4 h-4" /> Replies from our team also land in your notifications
            </Link>
          )}
        </aside>
      </div>
    </div>
  );
}
