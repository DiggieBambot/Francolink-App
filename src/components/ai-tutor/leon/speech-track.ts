// Text-driven lip sync: turn the sentence Léon is saying into a timeline of
// mouth shapes and word timings, stretched to the clip's real length.
//
// This is what keeps his lips on the words when there is no audio analyser
// (iPhone Safari can refuse to route an <audio> element through Web Audio),
// and it drives the word-by-word highlight in his speech bubble. With an
// analyser too, the engine uses this for the *shape* of the mouth and the
// audio for *how wide* it opens.
//
// Spelling → sound rules are rough but per language (French drops final
// consonants and mute e, Spanish v is a b, English th puts the tongue out…).
// A cartoon only needs the visible beats right: lips closing on m/b/p, teeth
// on f/v, round lips on o/u, wide on i/e, open on a.

import type { Viseme } from "./mouth";

export interface SpeechWord {
  /** Index range in the sentence text. */
  start: number;
  end: number;
  /** When it is said, seconds from the start of the clip. */
  t0: number;
  t1: number;
}

export interface VisemeKey {
  t: number;
  v: Viseme;
  /** Stressed (first vowel of a word): opens a little wider. */
  stress?: boolean;
}

export interface SpeechTrack {
  text: string;
  words: SpeechWord[];
  keys: VisemeKey[];
  /** Total length the track was laid out over, seconds. */
  duration: number;
}

/** The clip being spoken, as the TTS hook reports it. */
export interface SpeechClip {
  text: string;
  startedAt: number;
  duration: number | null;
  /** Current playback position in seconds, when the audio element is known. */
  position?: () => number;
}

type Phone = { v: Viseme; w: number };

const VOWEL_W = 1;
const CONS_W = 0.62;
const LIP_W = 0.78; // closures and f/v need a beat to be seen

/** Typical speaking pace before the real clip length is known. */
const SECONDS_PER_WEIGHT = 0.085;
/** TTS clips start and end with a little silence. */
const LEAD = 0.06;
const TAIL = 0.14;

const isVowelChar = (c: string) => /[aeiouyàâäáéèêëíìîïóòôöúùûüœæ]/.test(c);

type Rule = [string, Viseme[] | null, number?];

// Multi-letter spellings first; null = silent. Checked longest first.
const RULES: Record<string, Rule[]> = {
  fr: [
    ["eaux", ["O"]], ["eau", ["O"]], ["aux", ["O"]], ["au", ["O"]],
    ["oin", ["U", "E"]], ["oi", ["U", "A"]], ["oy", ["U", "A"]], ["ou", ["U"]], ["où", ["U"]], ["oû", ["U"]],
    ["ain", ["E"]], ["ein", ["E"]], ["ai", ["E"]], ["ei", ["E"]], ["ay", ["E"]],
    ["œu", ["O"]], ["eu", ["O"]],
    ["ill", ["I"]], ["gn", ["C", "I"]], ["ch", ["SH"]], ["ph", ["FV"]], ["qu", ["C"]], ["gu", ["C"]],
    ["th", ["C"]], ["h", null],
  ],
  es: [
    ["ll", ["I"]], ["ch", ["SH"]], ["qu", ["C"]], ["gue", ["C", "E"]], ["gui", ["C", "I"]],
    ["rr", ["C"]], ["h", null], ["v", ["MBP"]], ["ñ", ["C", "I"]], ["j", ["C"]], ["y", ["I"]],
  ],
  en: [
    ["tch", ["SH"]], ["igh", ["A", "I"]], ["ough", ["O"]], ["augh", ["O"]],
    ["th", ["L"]], ["sh", ["SH"]], ["ch", ["SH"]], ["ph", ["FV"]], ["wh", ["U"]], ["ck", ["C"]], ["ng", ["C"]],
    ["qu", ["C", "U"]], ["oo", ["U"]], ["ee", ["I"]], ["ea", ["I"]], ["ie", ["I"]],
    ["ou", ["A", "U"]], ["ow", ["O", "U"]], ["oi", ["O", "I"]], ["oy", ["O", "I"]],
    ["ai", ["E", "I"]], ["ay", ["E", "I"]], ["ey", ["E", "I"]], ["ew", ["U"]], ["ue", ["U"]],
    ["er", ["E"]], ["ir", ["E"]], ["ur", ["E"]], ["or", ["O"]], ["ar", ["A"]],
    ["kn", ["C"]], ["wr", ["C"]], ["mb", ["MBP"]], ["gh", null],
  ],
};

const SINGLE: Record<string, Viseme> = {
  a: "A", à: "A", â: "A", á: "A", ä: "A", æ: "E",
  e: "E", é: "E", è: "E", ê: "E", ë: "E",
  i: "I", î: "I", ï: "I", í: "I", ì: "I", y: "I",
  o: "O", ô: "O", ó: "O", ò: "O", ö: "O", œ: "O",
  u: "U", ù: "U", û: "U", ü: "U", ú: "U",
  m: "MBP", b: "MBP", p: "MBP",
  f: "FV", v: "FV",
  l: "L",
  w: "U",
  j: "SH",
  s: "C", z: "C", c: "C", k: "C", g: "C", q: "C", x: "C", r: "C", t: "C", d: "C", n: "C", h: "C", ç: "C",
};

const langOf = (language: string) => (language === "es" || language === "en" ? language : "fr");

function weightOf(v: Viseme): number {
  if (v === "MBP" || v === "FV") return LIP_W;
  if (v === "A" || v === "E" || v === "I" || v === "O" || v === "U") return VOWEL_W;
  return CONS_W;
}

/** Sounds in one word, roughly, as mouth shapes. */
export function wordPhones(raw: string, language: string): Phone[] {
  const lang = langOf(language);
  let w = raw.toLowerCase().replace(/[^a-zà-ÿœæñç']/g, "");
  if (!w) return [];

  // French: elided articles keep their consonant ("l'", "j'", "qu'"), mute
  // final e/es/ent, and most final consonants are silent.
  if (lang === "fr") {
    w = w.replace(/'/g, "");
    if (w.length > 3) w = w.replace(/(ent|es|e)$/, "");
    if (w.length > 2 && /[stdxzp]$/.test(w) && !/(ç|c)$/.test(w)) w = w.slice(0, -1);
    // nasal vowels: the n/m isn't pronounced before a consonant or at the end
    w = w.replace(/([aeo])[nm](?=[^aeiouyéèênm]|$)/g, "$1");
    w = w.replace(/(?<![aeo])[iu]n(?=[^aeiouyéèên]|$)/g, "ain");
  } else {
    w = w.replace(/'/g, "");
  }
  if (lang === "en" && w.length > 3 && /[^aeiou]e$/.test(w)) w = w.slice(0, -1);

  const rules = RULES[lang];
  const out: Phone[] = [];
  let i = 0;
  while (i < w.length) {
    let matched = false;
    for (const [spell, vis] of rules) {
      if (w.startsWith(spell, i)) {
        if (vis) for (const v of vis) out.push({ v, w: weightOf(v) * (vis.length > 1 ? 0.7 : 1) });
        i += spell.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;
    const c = w[i];
    // doubled consonants are one sound
    if (i > 0 && c === w[i - 1] && !isVowelChar(c)) {
      i++;
      continue;
    }
    let v = SINGLE[c];
    if (lang === "en" && c === "u") v = "A"; // "but", "much"
    if (lang === "es" && c === "j") v = "C";
    if (v) out.push({ v, w: weightOf(v) });
    i++;
  }
  // Merge repeats so a run of consonants doesn't flicker.
  const merged: Phone[] = [];
  for (const p of out) {
    const last = merged[merged.length - 1];
    if (last && last.v === p.v) last.w += p.w * 0.5;
    else merged.push({ ...p });
  }
  return merged;
}

/** Pause after a word, in weight units, from its trailing punctuation. */
function pauseAfter(token: string): number {
  if (/(…|\.\.\.)\W*$/.test(token)) return 3.2;
  if (/[.!?]\W*$/.test(token)) return 2.4;
  if (/[,;:—–]\W*$/.test(token)) return 1.5;
  return 0.18;
}

/**
 * Lay out the mouth shapes and word timings for `text`. With no `duration`
 * yet, a natural pace is assumed; pass the clip length to stretch it.
 */
export function buildSpeechTrack(text: string, language: string, duration?: number | null): SpeechTrack {
  const tokens: { start: number; end: number; raw: string; phones: Phone[]; pause: number }[] = [];
  const re = /\S+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const raw = m[0];
    const prev = tokens[tokens.length - 1];
    // Bare punctuation (French "Bonjour !", a dash) joins the word before it:
    // it sets the pause, it isn't a word of its own.
    if (prev && !/[\p{L}\p{N}]/u.test(raw)) {
      prev.end = m.index + raw.length;
      prev.pause = Math.max(prev.pause, pauseAfter(raw));
      continue;
    }
    tokens.push({ start: m.index, end: m.index + raw.length, raw, phones: wordPhones(raw, language), pause: pauseAfter(raw) });
  }

  const wordWeight = (tk: (typeof tokens)[number]) =>
    tk.phones.reduce((s, p) => s + p.w, 0) || (/\w/.test(tk.raw) ? 1 : 0.3);
  const total = tokens.reduce((s, tk, i) => s + wordWeight(tk) + (i < tokens.length - 1 ? tk.pause : 0), 0);

  const speakTime = duration && duration > LEAD + TAIL + 0.1 ? duration - LEAD - TAIL : total * SECONDS_PER_WEIGHT;
  const scale = total > 0 ? speakTime / total : 0;
  const layoutDuration = duration ?? speakTime + LEAD + TAIL;

  const words: SpeechWord[] = [];
  const keys: VisemeKey[] = [{ t: 0, v: "rest" }];
  let t = LEAD;
  tokens.forEach((tk, i) => {
    const t0 = t;
    if (tk.phones.length === 0) {
      t += wordWeight(tk) * scale;
    } else {
      let firstVowel = true;
      for (const p of tk.phones) {
        const vowel = weightOf(p.v) === VOWEL_W;
        keys.push({ t, v: p.v, stress: vowel && firstVowel });
        if (vowel) firstVowel = false;
        t += p.w * scale;
      }
    }
    words.push({ start: tk.start, end: tk.end, t0, t1: t });
    if (i < tokens.length - 1) {
      const pause = tk.pause * scale;
      // Short gaps between words keep the mouth moving; real pauses close it.
      if (tk.pause > 1) keys.push({ t, v: "rest" });
      t += pause;
    }
  });
  keys.push({ t, v: "rest" });
  return { text, words, keys, duration: layoutDuration };
}

/** Index of the last key at or before `t` (keys are sorted). */
export function keyIndexAt(track: SpeechTrack, t: number, hint = 0): number {
  const k = track.keys;
  let i = Math.min(Math.max(0, hint), k.length - 1);
  if (k[i].t > t) i = 0;
  while (i + 1 < k.length && k[i + 1].t <= t) i++;
  return i;
}

/** Index of the word being said at `t`, or -1 before the first / after the last. */
export function wordIndexAt(track: SpeechTrack, t: number): number {
  const w = track.words;
  if (!w.length || t < w[0].t0) return -1;
  for (let i = w.length - 1; i >= 0; i--) if (t >= w[i].t0) return i;
  return -1;
}

/** Seconds into the clip: the audio element's clock when known, else wall time. */
export function clipTime(clip: SpeechClip): number {
  const p = clip.position?.();
  if (typeof p === "number" && Number.isFinite(p)) return p;
  return (performance.now() - clip.startedAt) / 1000;
}
