"use client";

// Website contact-form messages in the Support inbox: read the full message,
// reply (email + notification bell), or file it as read / spam.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContactMessageRow } from "@/lib/admin/support";

const STATUS_STYLE: Record<string, string> = {
  new: "bg-amber-100 text-amber-700",
  read: "bg-blue-100 text-blue-700",
  replied: "bg-emerald-100 text-emerald-700",
  spam: "bg-gray-100 text-gray-500",
};

function when(iso: string) {
  return new Date(iso).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}

export function ContactMessagesInbox({ messages }: { messages: ContactMessageRow[] }) {
  const [openId, setOpenId] = useState<string | null>(messages.find((m) => m.status === "new")?.id ?? null);

  return (
    <div className="divide-y divide-gray-100 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-soft">
      {messages.map((m) => (
        <ContactMessageItem
          key={m.id}
          message={m}
          open={openId === m.id}
          onToggle={() => setOpenId(openId === m.id ? null : m.id)}
        />
      ))}
    </div>
  );
}

function ContactMessageItem({
  message: m,
  open,
  onToggle,
}: {
  message: ContactMessageRow;
  open: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState<"reply" | "status" | null>(null);
  const [note, setNote] = useState<{ ok: boolean; text: string } | null>(null);

  async function post(body: Record<string, unknown>, kind: "reply" | "status") {
    setBusy(kind);
    setNote(null);
    try {
      const res = await fetch(`/api/admin/contact-messages/${m.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "That didn't work.");
      if (kind === "reply") {
        setReply("");
        setNote({ ok: true, text: "Sent — emailed, and added to their notifications if they have an account." });
      }
      router.refresh();
    } catch (err) {
      setNote({ ok: false, text: err instanceof Error ? err.message : "That didn't work." });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className={cn(m.status === "new" && "bg-amber-50/40")}>
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center gap-4 px-5 py-4 text-left hover:bg-gray-50"
      >
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate font-semibold text-gray-900">{m.topic || "Website message"}</p>
            <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-slate-600">
              contact form
            </span>
          </div>
          <p className="truncate text-sm text-gray-500">
            {m.name} · {m.email} · {when(m.createdAt)}
          </p>
          {!open && <p className="mt-0.5 truncate text-sm text-gray-600">{m.message}</p>}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold capitalize ${STATUS_STYLE[m.status] || "bg-gray-100"}`}>
          {m.status}
        </span>
      </button>

      {open && (
        <div className="space-y-4 px-5 pb-5">
          <p className="whitespace-pre-line rounded-xl bg-gray-50 p-4 text-sm text-gray-800">{m.message}</p>

          {m.lastReply && (
            <div className="rounded-xl border-l-4 border-emerald-400 bg-emerald-50 p-4 text-sm">
              <p className="mb-1 text-xs font-semibold text-emerald-700">
                Your last reply{m.repliedAt ? ` · ${when(m.repliedAt)}` : ""}
              </p>
              <p className="whitespace-pre-line text-gray-800">{m.lastReply}</p>
            </div>
          )}

          <div>
            <textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              rows={5}
              maxLength={5000}
              placeholder={`Reply to ${m.name}… it goes to ${m.email} and, if they have an account, their notification bell.`}
              className="w-full rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm"
            />
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => post({ action: "reply", message: reply }, "reply")}
                disabled={busy !== null || !reply.trim()}
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white disabled:opacity-60"
              >
                {busy === "reply" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                Send reply
              </button>
              <a
                href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.topic || "Your message to FrancoLink"}`)}`}
                className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 px-3 py-2.5 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                <Mail className="h-4 w-4" /> Email instead
              </a>
              {m.status === "new" && (
                <button
                  type="button"
                  onClick={() => post({ action: "status", status: "read" }, "status")}
                  disabled={busy !== null}
                  className="rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 disabled:opacity-60"
                >
                  Mark read
                </button>
              )}
              {m.status !== "spam" && (
                <button
                  type="button"
                  onClick={() => post({ action: "status", status: "spam" }, "status")}
                  disabled={busy !== null}
                  className="rounded-xl px-3 py-2.5 text-sm font-semibold text-gray-500 hover:bg-gray-50 disabled:opacity-60"
                >
                  Mark spam
                </button>
              )}
              {note && <p className={cn("text-sm", note.ok ? "text-emerald-700" : "text-red-600")}>{note.text}</p>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
