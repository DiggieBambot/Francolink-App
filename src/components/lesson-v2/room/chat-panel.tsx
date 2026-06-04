"use client";

import { useEffect, useRef, useState } from "react";
import { Send } from "lucide-react";
import { useLessonRoom } from "../lesson-room-context";
import { Avatar } from "../avatar";

export function ChatPanel() {
  const room = useLessonRoom();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [room?.chatMessages.length]);

  if (!room) return null;

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {room.chatMessages.length === 0 ? (
          <p className="mt-6 text-center text-xs text-slate-400">
            No messages yet. Say bonjour 👋
          </p>
        ) : (
          room.chatMessages.map((m) => {
            const mine = m.from === room.currentUserId;
            return (
              <div key={m.id} className={`flex items-start gap-2 ${mine ? "flex-row-reverse" : ""}`}>
                <Avatar seed={m.name} size={28} />
                <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"} flex flex-col`}>
                  <span className="mb-0.5 text-[10px] font-semibold text-slate-500">
                    {m.name}
                    <span className={m.role === "tutor" ? "text-emerald-600" : "text-blue-600"}>
                      {" "}· {m.role}
                    </span>
                  </span>
                  <div
                    className={`rounded-2xl px-3 py-1.5 text-sm ${
                      mine ? "rounded-tr-sm bg-blue-600 text-white" : "rounded-tl-sm bg-slate-100 text-slate-900"
                    }`}
                  >
                    {m.text}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          room.sendChat(text);
          setText("");
        }}
        className="flex items-center gap-2 border-t p-2"
      >
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          className="flex-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
