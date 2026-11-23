"use client";

// In the app, DiggieChat never floats over the UI: no launcher bubble, no
// proactive pop-ups, no floating panel. It only appears where a page docks it
// (DiggieChatPanel — the Help & support page, the lesson room's AI tab).
//
// The widget script stays loaded after you leave a docked page, and on
// unmount it hands the panel back to its floating launcher — so the floating
// pieces are hidden here, for the whole app, rather than per page.

export function DiggieChat() {
  return (
    <style>{`
      #_dc_fab, #_dc_proactive { display: none !important; }
      #_dc_win:not(._dc_docked) { display: none !important; }
    `}</style>
  );
}
