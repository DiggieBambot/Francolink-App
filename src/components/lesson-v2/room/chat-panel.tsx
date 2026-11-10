"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Paperclip, FileText, Loader2, X } from "lucide-react";
import { useLessonRoom } from "../lesson-room-context";
import { Avatar } from "../avatar";
import type { ChatAttachment } from "../lesson-room-context";
import { createBrowserClient } from "@/lib/supabase/client";
import { ROOM_CHAT_INCOMING_BUCKET, ROOM_CHAT_MAX_BYTES, ROOM_CHAT_TYPES } from "@/lib/storage/room-chat";

function AttachmentView({ a, mine }: { a: ChatAttachment; mine: boolean }) {
  if (a.type.startsWith("image/")) {
    return (
      <a href={a.url} target="_blank" rel="noopener noreferrer">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={a.url} alt={a.name} className="max-h-56 max-w-full rounded-lg object-contain" />
      </a>
    );
  }
  if (a.type.startsWith("audio/")) {
    return <audio controls src={a.url} className="max-w-full" />;
  }
  return (
    <a
      href={a.url}
      target="_blank"
      rel="noopener noreferrer"
      className={`inline-flex items-center gap-2 text-sm underline ${mine ? "text-white" : "text-slate-900"}`}
    >
      <FileText className="h-4 w-4 shrink-0" /> <span className="break-all">{a.name}</span>
    </a>
  );
}

export function ChatPanel() {
  const room = useLessonRoom();
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<ChatAttachment | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [room?.chatMessages.length]);

  if (!room) return null;

  async function onPickFile(file: File | undefined) {
    if (!file || !room) return;
    setUploading(true);
    setUploadError(null);
    try {
      if (!ROOM_CHAT_TYPES[file.type]) {
        setUploadError("Share an image, PDF, audio clip or text file.");
        return;
      }
      if (file.size > ROOM_CHAT_MAX_BYTES) {
        setUploadError("Files can be up to 10 MB.");
        return;
      }
      // 1. A signed slot in quarantine. 2. The bytes, straight to storage.
      // 3. The server inspects them and publishes a cleaned copy -- or says no.
      const res = await fetch(`/api/space/${room.sessionId}/chat/upload`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: file.type, size: file.size }),
      });
      const slot = await res.json().catch(() => ({}));
      if (!res.ok) {
        setUploadError(slot.error || "Couldn't upload that file.");
        return;
      }
      const { error } = await createBrowserClient()
        .storage.from(ROOM_CHAT_INCOMING_BUCKET)
        .uploadToSignedUrl(slot.path, slot.token, file, { contentType: "application/octet-stream" });
      if (error) {
        setUploadError("Couldn't upload that file.");
        return;
      }
      const done = await fetch(`/api/space/${room.sessionId}/chat/upload/finalize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ path: slot.path, name: file.name, type: file.type }),
      });
      const checked = await done.json().catch(() => ({}));
      if (!done.ok) {
        setUploadError(checked.error || "Couldn't upload that file.");
        return;
      }
      setPending({ url: checked.url, name: checked.name, type: checked.type });
    } catch {
      setUploadError("Couldn't upload that file.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  // The marketing demo has no real room to upload into.
  const canAttach = room.sessionId !== "demo";

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
                    <span className={m.role === "tutor" ? "text-primary-600" : "text-secondary-600"}>
                      {" "}· {m.role}
                    </span>
                  </span>
                  <div
                    className={`rounded-2xl px-3 py-1.5 text-sm ${
                      mine ? "rounded-tr-sm bg-blue-600 text-white" : "rounded-tl-sm bg-slate-100 text-slate-900"
                    }`}
                  >
                    {m.attachment ? (
                      <div className={m.text ? "mb-1.5" : ""}>
                        <AttachmentView a={m.attachment} mine={mine} />
                      </div>
                    ) : null}
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
          room.sendChat(text, pending ?? undefined);
          setText("");
          setPending(null);
        }}
        className="flex flex-wrap items-center gap-2 border-t p-2"
      >
        {pending || uploadError ? (
          <div className="flex w-full items-center gap-2 text-xs text-slate-600">
            {pending ? (
              <>
                <FileText className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">{pending.name}</span>
                <button type="button" onClick={() => setPending(null)} aria-label="Remove attachment">
                  <X className="h-3.5 w-3.5" />
                </button>
              </>
            ) : (
              <span className="text-red-600">{uploadError}</span>
            )}
          </div>
        ) : null}
        {canAttach ? (
          <>
            <input
              ref={fileRef}
              type="file"
              // An explicit list, not image/*: given image/*, iOS hands over
              // HEIC photos, which we do not accept; listed types make Safari
              // convert them to JPEG first.
              accept={Object.keys(ROOM_CHAT_TYPES).join(",")}
              className="hidden"
              onChange={(e) => onPickFile(e.target.files?.[0])}
            />
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-500 hover:bg-slate-100 disabled:opacity-40"
              aria-label="Share an image or file"
              title={uploading ? "Checking the file…" : "Share an image, PDF, audio or text file"}
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Paperclip className="h-4 w-4" />}
            </button>
          </>
        ) : null}
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          className="flex-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!text.trim() && !pending}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40"
          aria-label="Send"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
