"use client";

// Who is in the room, plus the two things people look for while a class is
// running: change the lesson, and get someone else in.
//
// Extracted from the old ToolsRail so the shell can compose rail tabs without
// that component owning the layout as well as the content.

import { useState } from "react";
import { BookOpen, Check, Copy } from "lucide-react";
import { useLessonRoom } from "../lesson-room-context";
import { Avatar } from "../avatar";

export function PeoplePanel() {
  const room = useLessonRoom();
  const [linkCopied, setLinkCopied] = useState(false);

  if (!room) return null;

  async function copyRoomLink() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      /* clipboard refused — nothing useful to say */
    }
  }

  return (
    <div className="space-y-4 p-4">
      <button
        type="button"
        onClick={() => room.openLessonPicker()}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-primary-700"
      >
        <BookOpen className="h-4 w-4" /> Change lesson
      </button>

      <div className="rounded-lg border border-secondary-200 bg-secondary-50/60 p-3">
        <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-secondary-700">
          Invite to this room
        </p>
        <p className="mb-2 text-xs text-slate-500">Send this link to bring someone in.</p>
        <button
          type="button"
          onClick={copyRoomLink}
          className="flex w-full items-center justify-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-white hover:bg-secondary-600"
        >
          {linkCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {linkCopied ? "Link copied!" : "Copy room link"}
        </button>
      </div>

      <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-400">
        In this room
      </h3>
      {room.presence.length === 0 ? (
        <p className="text-sm text-slate-400">Connecting…</p>
      ) : (
        room.presence.map((p) => (
          <div key={p.user_id} className="flex items-center gap-2 rounded-lg border p-2">
            <Avatar seed={p.avatar_seed || p.name} size={32} />
            <div>
              <div className="text-sm font-medium text-slate-900">{p.name}</div>
              <div
                className={`text-xs ${
                  p.role === "tutor" ? "text-emerald-600" : "text-blue-600"
                }`}
              >
                {p.role}
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
