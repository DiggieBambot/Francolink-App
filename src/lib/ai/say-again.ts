// src/lib/ai/say-again.ts
//
// "Say it again": after Léon corrects a sentence, the student's next attempt
// is compared word by word with the corrected version, so they see which words
// came out right. It compares what the speech recogniser heard, so it checks
// that the words were said clearly enough to be understood, not accent detail.

export interface WordMark {
  word: string;
  ok: boolean;
}

function fold(w: string): string {
  return w
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\p{L}\p{N}']/gu, "");
}

/**
 * Words match when they are the same once accents and case are ignored. No
 * "one letter off" tolerance: pequeno vs pequeña is exactly the mistake being
 * checked.
 */
function close(a: string, b: string): boolean {
  return a === b;
}

/** Mark each word of `target` as heard (in order) in `said`. */
export function markSaid(target: string, said: string): { marks: WordMark[]; score: number } {
  const words = target.split(/\s+/).filter(Boolean);
  const heard = said.split(/\s+/).map(fold).filter(Boolean);
  let from = 0;
  const marks = words.map((word) => {
    const f = fold(word);
    if (!f) return { word, ok: true };
    for (let k = from; k < heard.length; k++) {
      if (close(heard[k], f)) {
        from = k + 1;
        return { word, ok: true };
      }
    }
    return { word, ok: false };
  });
  const counted = marks.filter((m) => fold(m.word));
  const score = counted.length ? counted.filter((m) => m.ok).length / counted.length : 0;
  return { marks, score };
}
