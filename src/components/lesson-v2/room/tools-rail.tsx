"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { MessageSquare, PenTool, Users, X, PanelRightOpen } from "lucide-react";
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
  if (!room) return null;

  const unread = room.chatMessages.length;

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
    <aside className="fixed right-0 top-0 z-40 flex h-screen w-[340px] max-w-[88vw] flex-col border-l bg-white shadow-xl">
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
          <div className="space-y-2 p-4">
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
