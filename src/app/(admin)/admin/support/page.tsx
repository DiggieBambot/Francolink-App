// Support inbox — shared by admins and community managers.

import { redirect } from "next/navigation";
import Link from "next/link";
import { LifeBuoy, TrendingUp, Inbox, ExternalLink, MessageCircle } from "lucide-react";
import { getDashboardUser, isAdmin } from "@/lib/admin/access";
import {
  listTickets,
  ticketCounts,
  listContactMessages,
  contactCounts,
  CONTACT_STATUSES,
} from "@/lib/admin/support";
import { ContactMessagesInbox } from "@/components/admin/contact-messages-inbox";

// Live chats (website bubble, in-app Help & support) are answered in DiggieChat.
const DIGGIECHAT_INBOX = "https://chat.diggiestack.com/";

export const dynamic = "force-dynamic";

const STATUS_STYLE: Record<string, string> = {
  open: "bg-amber-100 text-amber-700",
  pending: "bg-blue-100 text-blue-700",
  resolved: "bg-emerald-100 text-emerald-700",
  closed: "bg-gray-100 text-gray-500",
};
const SOURCE_STYLE: Record<string, string> = {
  in_app: "bg-primary-50 text-primary", dashboard: "bg-primary-50 text-primary",
  digistack: "bg-fuchsia-50 text-fuchsia-700", live_map: "bg-emerald-50 text-emerald-700",
  email: "bg-slate-100 text-slate-600",
};

function ago(iso: string) {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 60) return `${m}m`;
  if (m < 1440) return `${Math.floor(m / 60)}h`;
  return `${Math.floor(m / 1440)}d`;
}

export default async function SupportInboxPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; view?: string }>;
}) {
  const me = await getDashboardUser();
  if (!me) redirect("/admin/login");

  const params = await searchParams;
  const view = params.view === "tickets" ? "tickets" : "messages";
  const status = params.status || (view === "messages" ? "new" : "open");

  const [tickets, counts, messages, msgCounts] = await Promise.all([
    view === "tickets" ? listTickets(status) : Promise.resolve([]),
    ticketCounts(),
    view === "messages" ? listContactMessages(status) : Promise.resolve([]),
    contactCounts(),
  ]);

  const tabs = view === "messages" ? [...CONTACT_STATUSES, "all"] : ["open", "pending", "resolved", "closed", "all"];
  const tabCounts = view === "messages" ? msgCounts : counts;

  return (
    <div className="mx-auto max-w-5xl p-4 md:p-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-heading text-2xl font-bold text-primary md:text-3xl">
            <LifeBuoy className="h-6 w-6" /> Support
          </h1>
          <p className="text-sm text-gray-500">
            {me.role === "ADMIN" ? "Admin" : "Community manager"} · respond to tickets & questions
          </p>
        </div>
        {isAdmin(me) ? (
          <Link href="/admin/growth" className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-primary hover:bg-gray-50">
            <TrendingUp className="h-4 w-4" /> Growth
          </Link>
        ) : (
          <Link href="/admin/moderation" className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-3.5 py-2 text-sm font-semibold text-primary hover:bg-gray-50">
            Moderation
          </Link>
        )}
      </div>

      {/* Where questions come from */}
      <div className="mb-4 flex flex-wrap gap-2 border-b border-gray-200 pb-3">
        <Link
          href="/admin/support?view=messages"
          className={`rounded-lg px-3.5 py-2 text-sm font-semibold ${view === "messages" ? "bg-primary-50 text-primary" : "text-gray-600 hover:bg-gray-50"}`}
        >
          Website messages
          {msgCounts.new ? <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 text-[11px] font-bold text-white">{msgCounts.new}</span> : null}
        </Link>
        <Link
          href="/admin/support?view=tickets"
          className={`rounded-lg px-3.5 py-2 text-sm font-semibold ${view === "tickets" ? "bg-primary-50 text-primary" : "text-gray-600 hover:bg-gray-50"}`}
        >
          Tickets
          {counts.open ? <span className="ml-1.5 rounded-full bg-gray-200 px-1.5 text-[11px] font-bold text-gray-600">{counts.open}</span> : null}
        </Link>
        <a
          href={DIGGIECHAT_INBOX}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
        >
          <MessageCircle className="h-4 w-4" /> Live chats (DiggieChat) <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Status tabs */}
      <div className="mb-5 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t}
            href={`/admin/support?view=${view}&status=${t}`}
            className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-sm font-semibold capitalize transition ${
              status === t ? "bg-primary text-white" : "bg-white text-gray-600 ring-1 ring-gray-200 hover:bg-gray-50"
            }`}
          >
            {t}
            <span className={`rounded-full px-1.5 text-[11px] font-bold ${status === t ? "bg-white/20" : "bg-gray-100 text-gray-500"}`}>
              {tabCounts[t] || 0}
            </span>
          </Link>
        ))}
      </div>

      {view === "messages" ? (
        messages.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
            <Inbox className="mx-auto mb-3 h-8 w-8 text-gray-300" />
            <p className="font-semibold text-gray-700">No {status === "all" ? "" : `${status} `}website messages</p>
          </div>
        ) : (
          <ContactMessagesInbox messages={messages} />
        )
      ) : tickets.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-12 text-center">
          <Inbox className="mx-auto mb-3 h-8 w-8 text-gray-300" />
          <p className="font-semibold text-gray-700">No {status} tickets</p>
        </div>
      ) : (
        <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-soft">
          {tickets.map((t) => (
            <Link key={t.id} href={`/admin/support/${t.id}`} className="flex items-center gap-4 px-5 py-4 hover:bg-gray-50">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="truncate font-semibold text-gray-900">{t.subject}</p>
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${SOURCE_STYLE[t.source] || "bg-gray-100 text-gray-500"}`}>
                    {t.source.replace("_", " ")}
                  </span>
                </div>
                <p className="truncate text-sm text-gray-500">
                  {t.requesterName || t.requesterEmail || "Unknown"} · {ago(t.lastMessageAt)} ago
                </p>
              </div>
              <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_STYLE[t.status] || "bg-gray-100"}`}>
                {t.status}
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
