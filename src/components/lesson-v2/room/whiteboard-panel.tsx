"use client";

import { useCallback, useEffect, useRef } from "react";
import { Tldraw, type Editor, type TLRecord, type RecordsDiff } from "tldraw";
import "tldraw/tldraw.css";
import { createBrowserClient } from "@/lib/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

/**
 * Collaborative whiteboard. Both participants share one tldraw document, synced
 * over a dedicated Supabase Realtime channel (whiteboard:<sessionId>). We
 * broadcast local store diffs and merge remote ones. Good for 2-person rooms.
 */
export function WhiteboardPanel({ sessionId, userId }: { sessionId: string; userId: string }) {
  const editorRef = useRef<Editor | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);
  const applyingRemote = useRef(false);

  const onMount = useCallback(
    (editor: Editor) => {
      editorRef.current = editor;
      const supabase = createBrowserClient();
      const channel = supabase.channel(`whiteboard:${sessionId}`, {
        config: { broadcast: { self: false } },
      });
      channelRef.current = channel;

      // Apply remote diffs into the local store.
      channel.on("broadcast", { event: "wb:diff" }, ({ payload }) => {
        const p = payload as { from?: string; diff?: RecordsDiff<TLRecord> };
        if (!p?.diff || p.from === userId) return;
        applyingRemote.current = true;
        try {
          editor.store.mergeRemoteChanges(() => {
            const { added, updated, removed } = p.diff!;
            const puts: TLRecord[] = [];
            for (const r of Object.values(added)) puts.push(r as TLRecord);
            for (const pair of Object.values(updated)) puts.push((pair as [TLRecord, TLRecord])[1]);
            if (puts.length) editor.store.put(puts);
            const removeIds = Object.values(removed).map((r) => (r as TLRecord).id);
            if (removeIds.length) editor.store.remove(removeIds);
          });
        } finally {
          applyingRemote.current = false;
        }
      });

      // When a new peer joins, send them the full snapshot so they catch up.
      channel.on("broadcast", { event: "wb:request_snapshot" }, ({ payload }) => {
        if ((payload as { from?: string })?.from === userId) return;
        const records = editor.store.allRecords();
        void channel.send({ type: "broadcast", event: "wb:snapshot", payload: { from: userId, records } });
      });
      channel.on("broadcast", { event: "wb:snapshot" }, ({ payload }) => {
        const p = payload as { from?: string; records?: TLRecord[] };
        if (!p?.records || p.from === userId) return;
        applyingRemote.current = true;
        try {
          editor.store.mergeRemoteChanges(() => {
            editor.store.put(p.records!);
          });
        } finally {
          applyingRemote.current = false;
        }
      });

      channel.subscribe((status) => {
        if (status === "SUBSCRIBED") {
          void channel.send({ type: "broadcast", event: "wb:request_snapshot", payload: { from: userId } });
        }
      });

      // Broadcast local user changes.
      const unlisten = editor.store.listen(
        (entry) => {
          if (applyingRemote.current) return;
          void channel.send({ type: "broadcast", event: "wb:diff", payload: { from: userId, diff: entry.changes } });
        },
        { source: "user", scope: "document" }
      );

      return () => {
        unlisten();
        void channel.unsubscribe();
      };
    },
    [sessionId, userId]
  );

  useEffect(() => {
    return () => {
      void channelRef.current?.unsubscribe();
    };
  }, []);

  return (
    <div className="absolute inset-0">
      <Tldraw onMount={onMount} persistenceKey={`francolink-wb-${sessionId}`} />
    </div>
  );
}
