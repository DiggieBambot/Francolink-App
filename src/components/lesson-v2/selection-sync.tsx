"use client";

// Sharing a mouse selection of lesson text.
//
// <Highlightable> only wraps phrases in three section types, so selecting a
// sentence anywhere else (explanations, grammar tables, reading passages) made
// a native browser selection that existed on one screen only -- the tutor
// "highlighted" and the student saw nothing. Here the selection itself is the
// highlight: whatever either person selects inside a lesson section is
// broadcast as (section, quoted text, a little context before it) and painted
// on the other screens with the CSS Custom Highlight API, in the same colours
// <Highlightable> uses.
//
// Located by quote rather than by character offset: the tutor's DOM carries
// notes and revealed translations the student's does not, so offsets diverge
// and a quote does not. Both ends read text the same way -- the section's raw
// text nodes joined -- never Selection.toString(), which inserts line breaks
// between blocks that the receiver's text does not contain.

import { useEffect } from "react";
import { useLessonRoom, type SharedSelection } from "./lesson-room-context";

const MAX_LEN = 400;
const PREFIX_LEN = 24;
const DEBOUNCE_MS = 200;

// Same hues as <Highlightable>: amber for the tutor, sky for the student.
// Rendered from here rather than globals.css because Turbopack's CSS parser
// rejects ::highlight() and fails the whole stylesheet, taking every page
// down with it. A runtime <style> reaches the browser unparsed.
const HIGHLIGHT_CSS = `
::highlight(shared-tutor) { background-color: #fcd34d; color: #0f172a; }
::highlight(shared-student) { background-color: #7dd3fc; color: #0f172a; }
`;

type HighlightCtor = new (...ranges: Range[]) => unknown;
interface HighlightRegistry {
  set(name: string, h: unknown): void;
  delete(name: string): void;
}

function highlightApi(): { reg: HighlightRegistry; Highlight: HighlightCtor } | null {
  if (typeof window === "undefined") return null;
  const reg = (window.CSS as unknown as { highlights?: HighlightRegistry } | undefined)?.highlights;
  const Highlight = (window as unknown as { Highlight?: HighlightCtor }).Highlight;
  return reg && Highlight ? { reg, Highlight } : null;
}

function sectionOf(node: Node | null): HTMLElement | null {
  const el = node instanceof Element ? node : node?.parentElement;
  return (el?.closest?.("[data-section-idx]") as HTMLElement | null) ?? null;
}

/** A section's text nodes and where each starts in their concatenation. */
function textIndex(section: HTMLElement) {
  const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
  const nodes: { node: Text; start: number }[] = [];
  let full = "";
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    nodes.push({ node: n as Text, start: full.length });
    full += (n as Text).data;
  }
  return { nodes, full };
}

/** Position of a DOM boundary point in the section's concatenated text. */
function offsetOf(
  index: ReturnType<typeof textIndex>,
  container: Node,
  offset: number
): number | null {
  if (container.nodeType === Node.TEXT_NODE) {
    const hit = index.nodes.find((n) => n.node === container);
    return hit ? hit.start + offset : null;
  }
  // An element boundary never falls inside a text node, so every text node is
  // wholly before it or wholly after it: sum the ones that end at or before.
  const at = document.createRange();
  try {
    at.setStart(container, offset);
  } catch {
    return null;
  }
  at.collapse(true);
  let total = 0;
  for (const { node } of index.nodes) {
    if (at.comparePoint(node, node.data.length) <= 0) total += node.data.length;
    else break;
  }
  return total;
}

/** The DOM Range on THIS screen for a selection made on another one. */
function rangeFor(section: HTMLElement, sel: SharedSelection): Range | null {
  const index = textIndex(section);
  let at = sel.prefix ? index.full.indexOf(sel.prefix + sel.text) : -1;
  if (at >= 0) at += sel.prefix.length;
  else at = index.full.indexOf(sel.text);
  if (at < 0) return null;
  const end = at + sel.text.length;

  let startNode: { node: Text; offset: number } | null = null;
  let endNode: { node: Text; offset: number } | null = null;
  for (const { node, start } of index.nodes) {
    const stop = start + node.data.length;
    if (!startNode && at >= start && at < stop) startNode = { node, offset: at - start };
    if (end > start && end <= stop) {
      endNode = { node, offset: end - start };
      break;
    }
  }
  if (!startNode || !endNode) return null;
  const r = document.createRange();
  r.setStart(startNode.node, startNode.offset);
  r.setEnd(endNode.node, endNode.offset);
  return r;
}

export function SelectionSync() {
  const room = useLessonRoom();
  const shareSelection = room?.shareSelection;
  const remoteSelections = room?.remoteSelections;
  const presence = room?.presence;

  // ── Outgoing: my selection → everyone else ────────────────────────────────
  useEffect(() => {
    if (!shareSelection) return;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let last = "";

    const send = (sel: SharedSelection | null) => {
      const key = sel ? `${sel.s}|${sel.prefix}|${sel.text}` : "";
      if (key === last) return; // nothing changed; do not spam the channel
      last = key;
      shareSelection(sel);
    };

    const onChange = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        const sel = window.getSelection();
        if (!sel || sel.isCollapsed || sel.rangeCount === 0) return send(null);
        const range = sel.getRangeAt(0);
        const section = sectionOf(range.startContainer);
        if (!section || section !== sectionOf(range.endContainer)) return send(null);
        const index = textIndex(section);
        if (index.nodes.length === 0) return send(null);
        const a = offsetOf(index, range.startContainer, range.startOffset);
        const b = offsetOf(index, range.endContainer, range.endOffset);
        if (a == null || b == null || b <= a) return send(null);
        const text = index.full.slice(a, b);
        if (!text.trim() || text.length > MAX_LEN) return send(null);
        send({
          s: Number(section.dataset.sectionIdx),
          text,
          prefix: index.full.slice(Math.max(0, a - PREFIX_LEN), a),
        });
      }, DEBOUNCE_MS);
    };

    document.addEventListener("selectionchange", onChange);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("selectionchange", onChange);
      if (last) shareSelection(null); // leaving the room clears my mark
    };
  }, [shareSelection]);

  // ── Incoming: paint everyone else's selections ────────────────────────────
  useEffect(() => {
    const api = highlightApi();
    if (!api || !remoteSelections) return;

    // Someone who has left the room keeps no mark on the page.
    const here = new Set((presence ?? []).map((p) => p.user_id));
    const active = Object.entries(remoteSelections).filter(([id]) => here.has(id));

    const paint = () => {
      const byRole: Record<"tutor" | "student", Range[]> = { tutor: [], student: [] };
      for (const [, { role, sel }] of active) {
        const section = document.querySelector<HTMLElement>(`[data-section-idx="${sel.s}"]`);
        const r = section ? rangeFor(section, sel) : null;
        if (r) byRole[role].push(r);
      }
      for (const role of ["tutor", "student"] as const) {
        const name = `shared-${role}`;
        if (byRole[role].length) api.reg.set(name, new api.Highlight(...byRole[role]));
        else api.reg.delete(name);
      }
    };
    paint();

    // The lesson re-renders under us (answers typed, a stage switched, a
    // section mounted late), which detaches the ranges. Repaint after DOM
    // changes, at most once a frame, and only while there is something to show.
    let frame = 0;
    const observer = active.length
      ? new MutationObserver(() => {
          if (frame) return;
          frame = requestAnimationFrame(() => {
            frame = 0;
            paint();
          });
        })
      : null;
    observer?.observe(document.body, { childList: true, subtree: true, characterData: true });

    return () => {
      observer?.disconnect();
      if (frame) cancelAnimationFrame(frame);
      api.reg.delete("shared-tutor");
      api.reg.delete("shared-student");
    };
  }, [remoteSelections, presence]);

  return <style>{HIGHLIGHT_CSS}</style>;
}
