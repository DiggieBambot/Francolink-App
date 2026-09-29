// src/lib/context/ai-tutor-context.tsx
'use client';

import { createContext, useContext, ReactNode } from 'react';

// Whether the AI tutor may be shown or sold. The student layout reads the
// Admin → Settings → AI switch (ai_tutor_enabled) on the server and provides it
// here, so client components (plan cards, upgrade prompts) can drop tutor
// copy without fetching the setting themselves.
//
// Defaults to true outside a provider: a component rendered somewhere nobody
// has wired up keeps today's behaviour rather than silently losing copy.
const AiTutorContext = createContext(true);

export function AiTutorProvider({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  return <AiTutorContext.Provider value={enabled}>{children}</AiTutorContext.Provider>;
}

export function useAiTutorEnabled(): boolean {
  return useContext(AiTutorContext);
}
