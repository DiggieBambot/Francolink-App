// Support ticket thread (admin + community manager).

import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { getDashboardUser } from "@/lib/admin/access";
import { getTicket } from "@/lib/admin/support";
import { TicketReply } from "@/components/admin/ticket-reply";

export const dynamic = "force-dynamic";

export default async function TicketThreadPage({ params }: { params: Promise<{ id: string }> }) {
  const me = await getDashboardUser();
  if (!me) redirect("/admin/login");

  const { id } = await params;
  const data = await getTicket(id);
  if (!data) notFound();
  const { ticket, messages } = data;

  return (
    <div className="mx-auto max-w-3xl p-4 md:p-8">
      <Link href="/admin/support" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-gray-600 hover:text-primary">
        <ArrowLeft className="h-4 w-4" /> Inbox
      </Link>

      <div className="mb-5 rounded-2xl border border-gray-100 bg-white p-5 shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h1 className="font-heading text-xl font-bold text-gray-900">{ticket.subject}</h1>
          <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-bold capitalize text-gray-600">{ticket.status}</span>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          {ticket.requesterName || "Unknown"}
          {ticket.requesterEmail ? ` · ${ticket.requesterEmail}` : ""} · via {ticket.source.replace("_", " ")}
        </p>
      </div>

      <div className="mb-5 space-y-3">
        {messages.map((m) => {
          const agent = m.senderRole === "agent";
          return (
            <div key={m.id} className={`flex ${agent ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${agent ? "bg-primary text-white" : "bg-white text-gray-800 ring-1 ring-gray-100"}`}>
                <p className={`mb-1 text-[11px] font-semibold ${agent ? "text-primary-100" : "text-gray-400"}`}>
                  {agent ? m.senderName || "Support" : m.senderName || "Requester"}
                </p>
                <p className="whitespace-pre-wrap">{m.body}</p>
              </div>
            </div>
          );
        })}
      </div>

      <TicketReply ticketId={ticket.id} currentStatus={ticket.status} />
    </div>
  );
}
