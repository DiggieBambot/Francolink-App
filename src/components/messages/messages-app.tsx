"use client";

// Conversation list + thread view for /messages.
//
// New messages arrive over Supabase Realtime (INSERTs on `messages`; RLS limits
// the stream to conversations I'm in). Polling is the safety net for a dead
// socket or a project where realtime isn't enabled for the table.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Loader2, MessageSquare, Send, AlertTriangle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface Person {
  id: string;
  name: string | null;
  avatar_url: string | null;
}

interface Summary {
  otherUser: Person;
  otherRole: "tutor" | "student";
  conversationId: string | null;
  lastMessageAt: string | null;
  lastMessagePreview: string | null;
  lastSenderIsMe: boolean;
  unread: number;
  active: boolean;
}

interface Message {
  id: string;
  sender_id: string;
  body: string;
  created_at: string;
  /** Optimistic message not yet confirmed by the server. */
  pending?: boolean;
}

interface Thread {
  other: Person;
  otherRole: "tutor" | "student";
  active: boolean;
  conversationId: string | null;
  messages: Message[];
}

const LIST_POLL_MS = 30_000;
const THREAD_POLL_MS = 15_000;
const MAX_LEN = 4000;

function Avatar({ person, size = 40 }: { person: Person; size?: number }) {
  const initial = (person.name || "?").charAt(0).toUpperCase();
  return (
    <div
      className="rounded-full bg-gradient-to-br from-primary to-primary-600 flex items-center justify-center text-white font-semibold overflow-hidden shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {person.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={person.avatar_url} alt="" className="w-full h-full object-cover" />
      ) : (
        initial
      )}
    </div>
  );
}

function shortTime(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  const days = Math.floor((now.getTime() - d.getTime()) / 86_400_000);
  if (days < 7) return d.toLocaleDateString([], { weekday: "short" });
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return "Today";
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (d.toDateString() === y.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { weekday: "long", month: "long", day: "numeric" });
}

export function MessagesApp({ meId, initialWith }: { meId: string; initialWith: string | null }) {
  const supabase = useMemo(() => createClient(), []);

  const [list, setList] = useState<Summary[] | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [listError, setListError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(initialWith);
  const [thread, setThread] = useState<Thread | null>(null);
  const [threadError, setThreadError] = useState<string | null>(null);
  const [threadLoading, setThreadLoading] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const activeIdRef = useRef(activeId);
  activeIdRef.current = activeId;
  const threadConvRef = useRef<string | null>(null);
  threadConvRef.current = thread?.conversationId ?? null;

  const loadList = useCallback(async () => {
    try {
      const res = await fetch("/api/messages", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't load messages.");
      setSetupRequired(Boolean(data.setupRequired));
      setList(data.conversations);
      setListError(null);
    } catch (e) {
      setListError((e as Error).message);
      setList((prev) => prev ?? []);
    }
  }, []);

  const loadThread = useCallback(async (otherId: string, opts: { quiet?: boolean } = {}) => {
    if (!opts.quiet) setThreadLoading(true);
    try {
      const res = await fetch(`/api/messages/thread?with=${otherId}`, { cache: "no-store" });
      const data = await res.json();
      if (activeIdRef.current !== otherId) return;
      if (data.setupRequired) {
        setSetupRequired(true);
        return;
      }
      if (!res.ok) throw new Error(data.error || "Couldn't load this conversation.");
      setThread((prev) => {
        // Keep optimistic messages still in flight.
        const pending = prev && prev.other.id === otherId ? prev.messages.filter((m) => m.pending) : [];
        return { ...data, messages: [...data.messages, ...pending] };
      });
      setThreadError(null);
      // Opening the thread marked it read.
      setList((prev) => prev?.map((c) => (c.otherUser.id === otherId ? { ...c, unread: 0 } : c)) ?? prev);
    } catch (e) {
      if (activeIdRef.current === otherId) setThreadError((e as Error).message);
    } finally {
      if (activeIdRef.current === otherId) setThreadLoading(false);
    }
  }, []);

  // Initial + periodic list refresh.
  useEffect(() => {
    loadList();
    const t = setInterval(() => {
      if (document.visibilityState === "visible") loadList();
    }, LIST_POLL_MS);
    return () => clearInterval(t);
  }, [loadList]);

  // Open / switch thread.
  useEffect(() => {
    setThread(null);
    setThreadError(null);
    setSendError(null);
    setDraft("");
    if (!activeId) return;
    loadThread(activeId);
    const t = setInterval(() => {
      if (document.visibilityState === "visible") loadThread(activeId, { quiet: true });
    }, THREAD_POLL_MS);
    return () => clearInterval(t);
  }, [activeId, loadThread]);

  // Realtime: any new message in one of my conversations.
  useEffect(() => {
    if (setupRequired) return;
    const channel = supabase
      .channel(`messages:${meId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const m = payload.new as Message & { conversation_id: string };
        if (m.sender_id === meId) return; // my own sends are already shown
        // Refetch the open thread if it's this one (that also marks it read).
        if (activeIdRef.current && threadConvRef.current === m.conversation_id) {
          loadThread(activeIdRef.current, { quiet: true });
        }
        loadList();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase, meId, setupRequired, loadList, loadThread]);

  // Keep the newest message in view.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread?.messages.length, thread?.other.id]);

  const open = (otherId: string) => {
    setActiveId(otherId);
    // Shallow URL update (no server round trip) so the thread is linkable.
    window.history.replaceState(null, "", `/messages?with=${otherId}`);
  };

  const back = () => {
    setActiveId(null);
    window.history.replaceState(null, "", "/messages");
    loadList();
  };

  const send = async () => {
    const body = draft.trim();
    if (!body || !activeId || sending) return;
    const tempId = `tmp-${Date.now()}`;
    const optimistic: Message = {
      id: tempId,
      sender_id: meId,
      body,
      created_at: new Date().toISOString(),
      pending: true,
    };
    setThread((prev) => (prev ? { ...prev, messages: [...prev.messages, optimistic] } : prev));
    setDraft("");
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch("/api/messages/thread", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ to: activeId, body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't send your message.");
      setThread((prev) =>
        prev
          ? {
              ...prev,
              conversationId: data.conversationId,
              messages: prev.messages.map((m) => (m.id === tempId ? data.message : m)),
            }
          : prev
      );
      setList((prev) => {
        if (!prev) return prev;
        const updated = prev.map((c) =>
          c.otherUser.id === activeId
            ? {
                ...c,
                conversationId: data.conversationId,
                lastMessageAt: data.message.created_at,
                lastMessagePreview: body.slice(0, 140),
                lastSenderIsMe: true,
              }
            : c
        );
        return sortSummaries(updated);
      });
    } catch (e) {
      setThread((prev) => (prev ? { ...prev, messages: prev.messages.filter((m) => m.id !== tempId) } : prev));
      setDraft(body);
      setSendError((e as Error).message);
    } finally {
      setSending(false);
      inputRef.current?.focus();
    }
  };

  const activeSummary = list?.find((c) => c.otherUser.id === activeId) || null;
  const header: Person | null = thread?.other || activeSummary?.otherUser || null;
  const headerRole = thread?.otherRole || activeSummary?.otherRole;

  if (setupRequired) {
    return (
      <div className="m-4 md:m-0 bg-white rounded-2xl border border-amber-200 p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Messages aren&apos;t switched on yet</h2>
        <p className="text-sm text-gray-500 max-w-md mx-auto">
          The messaging tables haven&apos;t been created in the database. An admin needs to run the
          migration <code className="text-xs bg-gray-100 rounded px-1">20261123_tutor_student_messages.sql</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="h-[calc(100dvh-3.5rem)] md:h-[calc(100dvh-5.5rem)] bg-white md:rounded-2xl md:border md:border-gray-200 md:shadow-soft overflow-hidden flex">
      {/* Conversation list */}
      <aside
        className={`${activeId ? "hidden md:flex" : "flex"} w-full md:w-80 shrink-0 flex-col border-r border-gray-100`}
      >
        <div className="px-4 py-3 border-b border-gray-100">
          <h1 className="font-heading font-bold text-lg text-primary">Messages</h1>
        </div>
        <div className="flex-1 overflow-y-auto">
          {list === null ? (
            <div className="flex justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
            </div>
          ) : list.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-3" />
              <p className="text-sm text-gray-500">
                {listError || "No one to message yet. Once you're connected with a tutor or student, they'll show up here."}
              </p>
            </div>
          ) : (
            <ul>
              {list.map((c) => {
                const selected = c.otherUser.id === activeId;
                return (
                  <li key={c.otherUser.id}>
                    <button
                      onClick={() => open(c.otherUser.id)}
                      className={`w-full text-left flex items-center gap-3 px-4 py-3 border-b border-gray-50 transition-colors ${
                        selected ? "bg-primary-50" : "hover:bg-gray-50"
                      }`}
                    >
                      <Avatar person={c.otherUser} size={44} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2">
                          <span className={`truncate ${c.unread ? "font-bold text-gray-900" : "font-semibold text-gray-800"}`}>
                            {c.otherUser.name || (c.otherRole === "tutor" ? "Your tutor" : "Student")}
                          </span>
                          <span className="ml-auto text-xs text-gray-400 shrink-0">{shortTime(c.lastMessageAt)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`truncate text-sm ${c.unread ? "text-gray-800" : "text-gray-500"}`}>
                            {c.lastMessagePreview
                              ? `${c.lastSenderIsMe ? "You: " : ""}${c.lastMessagePreview}`
                              : c.otherRole === "tutor"
                                ? "Your tutor · say bonjour 👋"
                                : "Your student · start a conversation"}
                          </span>
                          {c.unread > 0 && !selected && (
                            <span className="ml-auto shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-secondary text-white text-xs font-bold flex items-center justify-center">
                              {c.unread > 99 ? "99+" : c.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </aside>

      {/* Thread */}
      <section className={`${activeId ? "flex" : "hidden md:flex"} flex-1 min-w-0 flex-col`}>
        {!activeId ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <MessageSquare className="w-12 h-12 text-gray-200 mb-3" />
            <p className="text-gray-500">Pick a conversation to start messaging.</p>
          </div>
        ) : (
          <>
            <div className="h-14 px-3 md:px-4 border-b border-gray-100 flex items-center gap-3 shrink-0">
              <button onClick={back} className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-gray-100" aria-label="Back">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              {header && <Avatar person={header} size={36} />}
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{header?.name || (headerRole ? (headerRole === "tutor" ? "Your tutor" : "Student") : "")}</p>
                {headerRole && <p className="text-xs text-gray-400">{headerRole === "tutor" ? "Your tutor" : "Your student"}</p>}
              </div>
            </div>

            <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 md:px-6 py-4 bg-gray-50/60">
              {threadLoading && !thread ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-gray-300" />
                </div>
              ) : threadError && !thread ? (
                <p className="text-center text-sm text-red-600 py-12">{threadError}</p>
              ) : thread && thread.messages.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-sm">
                    No messages yet. Say bonjour to {thread.other.name?.split(" ")[0] || "them"} 👋
                  </p>
                </div>
              ) : (
                thread?.messages.map((m, i) => {
                  const mine = m.sender_id === meId;
                  const prev = thread.messages[i - 1];
                  const newDay = !prev || new Date(prev.created_at).toDateString() !== new Date(m.created_at).toDateString();
                  return (
                    <div key={m.id}>
                      {newDay && (
                        <div className="text-center my-3">
                          <span className="text-xs text-gray-400 bg-white border border-gray-100 rounded-full px-3 py-1">
                            {dayLabel(m.created_at)}
                          </span>
                        </div>
                      )}
                      <div className={`flex mb-1.5 ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[80%] md:max-w-[65%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug whitespace-pre-wrap break-words ${
                            mine
                              ? "bg-primary text-white rounded-br-md"
                              : "bg-white text-gray-900 border border-gray-100 rounded-bl-md"
                          } ${m.pending ? "opacity-60" : ""}`}
                        >
                          {m.body}
                          <div className={`text-[11px] mt-0.5 text-right ${mine ? "text-white/70" : "text-gray-400"}`}>
                            {m.pending ? "Sending…" : new Date(m.created_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {thread && !thread.active ? (
              <div className="px-4 py-3 border-t border-gray-100 text-sm text-gray-500 text-center">
                You&apos;re no longer connected, so you can&apos;t send new messages here.
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  send();
                }}
                className="border-t border-gray-100 p-3 flex items-end gap-2 shrink-0"
              >
                <div className="flex-1">
                  {sendError && <p className="text-xs text-red-600 mb-1">{sendError}</p>}
                  <textarea
                    ref={inputRef}
                    value={draft}
                    onChange={(e) => setDraft(e.target.value.slice(0, MAX_LEN))}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                        e.preventDefault();
                        send();
                      }
                    }}
                    rows={1}
                    placeholder="Write a message…"
                    disabled={!thread}
                    className="w-full resize-none max-h-40 rounded-xl border border-gray-200 px-3.5 py-2.5 text-[15px] focus:outline-none focus:ring-2 focus:ring-secondary/40 focus:border-secondary disabled:bg-gray-50"
                    style={{ fieldSizing: "content" } as React.CSSProperties}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!draft.trim() || !thread || sending}
                  className="h-11 w-11 shrink-0 rounded-xl bg-primary text-white flex items-center justify-center hover:bg-primary-800 disabled:opacity-40 transition-colors"
                  aria-label="Send"
                >
                  <Send className="w-5 h-5" />
                </button>
              </form>
            )}
          </>
        )}
      </section>
    </div>
  );
}

function sortSummaries(list: Summary[]): Summary[] {
  return [...list].sort((a, b) => {
    if (a.lastMessageAt && b.lastMessageAt) return b.lastMessageAt.localeCompare(a.lastMessageAt);
    if (a.lastMessageAt) return -1;
    if (b.lastMessageAt) return 1;
    return 0;
  });
}
