"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { MessageSquare, PenTool, Users, X, PanelRightOpen, BookOpen, Copy, Check } from "lucide-react";
import { useLessonRoom } from "../lesson-room-context";
import { Avatar } from "../avatar";
import { ChatPanel } from "./chat-panel";

// tldraw is heavy + browser-only → load it client-side only when the tab opens.
const WhiteboardPanel = dynamic(
  () => import("./whiteboard-panel").then((m) => m.WhiteboardPanel),
  { ssr: false, loading: () => <div className="p-4 text-sm text-slate-400">Loading whiteboard…</div> }
);

type Tab = "chat" | "whiteboard" | "people";

export function ToolsRail() {
  const room = useLessonRoom();
  const [open, setOpen] = useState(true);
  const [tab, setTab] = useState<Tab>("chat");
  const [linkCopied, setLinkCopied] = useState(false);
  if (!room) return null;

  const unread = room.chatMessages.length;

  async function copyRoomLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-20 right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg hover:bg-blue-700"
        aria-label="Open tools"
      >
        <PanelRightOpen className="h-5 w-5" />
      </button>
    );
  }

  return (
    <aside
      className="fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l bg-white shadow-xl sm:w-[340px] sm:max-w-[88vw]"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {/* Tabs */}
      <div className="flex items-center border-b">
        {([
          { id: "chat", label: "Chat", Icon: MessageSquare },
          { id: "whiteboard", label: "Board", Icon: PenTool },
          { id: "people", label: "People", Icon: Users },
        ] as const).map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`flex flex-1 items-center justify-center gap-1.5 py-3 text-sm font-medium transition ${
              tab === id ? "border-b-2 border-blue-600 text-blue-700" : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {id === "chat" && unread > 0 && tab !== "chat" ? (
              <span className="ml-0.5 rounded-full bg-blue-600 px-1.5 text-[10px] text-white">{unread}</span>
            ) : null}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="px-3 text-slate-400 hover:text-slate-700"
          aria-label="Close tools"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Panels */}
      <div className="relative flex-1 overflow-hidden">
        {tab === "chat" ? <ChatPanel /> : null}
        {tab === "whiteboard" ? (
          <WhiteboardPanel sessionId={room.sessionId} userId={room.currentUserId} />
        ) : null}
        {tab === "people" ? (
          <div className="space-y-4 overflow-y-auto p-4">
            {/* Change the lesson (either side) */}
            <button
              type="button"
              onClick={() => room.openLessonPicker()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
            >
              <BookOpen className="h-4 w-4" /> Change lesson
            </button>

            {/* Invite link for this room */}
            <div className="rounded-lg border border-secondary-200 bg-secondary-50/60 p-3">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-secondary-700">
                Invite to this room
              </p>
              <p className="mb-2 text-xs text-slate-500">
                Send this link to bring someone in.
              </p>
              <button
                type="button"
                onClick={copyRoomLink}
                className="flex w-full items-center justify-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-white hover:bg-secondary-600"
              >
                {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {linkCopied ? "Link copied!" : "Copy room link"}
              </button>
            </div>

            <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">In this room</h3>
            {room.presence.length === 0 ? (
              <p className="text-sm text-slate-400">Connecting…</p>
            ) : (
              room.presence.map((p) => (
                <div key={p.user_id} className="flex items-center gap-2 rounded-lg border p-2">
                  <Avatar seed={p.avatar_seed || p.name} size={32} />
                  <div>
                    <div className="text-sm font-medium text-slate-900">{p.name}</div>
                    <div className={`text-xs ${p.role === "tutor" ? "text-emerald-600" : "text-blue-600"}`}>
                      {p.role}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
