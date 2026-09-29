// Sales copy that sells the AI tutor ("300 AI Tutor messages a month", "AI
// conversation tutor") is dropped wherever the tutor is switched off in
// Admin → Settings → AI. Plain module, no "use client", so server pages and
// client components can both use it.

const TUTOR_COPY = /\bAI (conversation )?tutor(ing)?\b/i;

export function mentionsAiTutor(text: string): boolean {
  return TUTOR_COPY.test(text);
}

/** `items` minus the lines selling the tutor, unless the tutor is on. */
export function withoutTutorCopy<T>(items: T[], tutorEnabled: boolean, text: (item: T) => string = String): T[] {
  return tutorEnabled ? items : items.filter((item) => !mentionsAiTutor(text(item)));
}
