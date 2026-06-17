// src/lib/learn/speaker-voice.ts
//
// Pick a TTS voice that matches a dialogue speaker's apparent gender so a
// "Juan" line is spoken by a male voice and a "María" line by a female one.
//
// Voice IDs are Inworld TTS voice IDs (catalogue probed from
// https://api.inworld.ai/tts/v1/voices). Each (language, gender) pair has a
// small roster; speakers within a single dialogue are deterministically
// assigned to a slot in the roster (by name) so the same character keeps the
// same voice every time they speak.

type Gender = "female" | "male";
type LangCode = "fr" | "es" | "en" | "de";

const VOICES: Record<LangCode, Record<Gender, string[]>> = {
  fr: {
    female: ["Hélène"],
    male: ["Alain", "Étienne", "Mathieu"],
  },
  es: {
    female: ["Sofia", "Lupita", "Camila", "Inmaculada"],
    male: ["Diego", "Miguel", "Mateo", "Joaquin"],
  },
  en: {
    female: ["Olivia", "Ashley", "Sarah", "Wendy"],
    male: ["Mark", "Alex", "Shaun", "Timothy"],
  },
  de: {
    female: ["Johanna", "Annika", "Birgit", "Carina"],
    male: ["Josef", "Kilian", "Tobias", "Matthias"],
  },
};

// Default per-language voices (used outside of multi-speaker dialogues).
// Picked to be definitely supported by the language (no cross-lang voices).
export const DEFAULT_VOICES: Record<LangCode, string> = {
  fr: "Hélène",
  es: "Sofia",
  en: "Olivia",
  de: "Johanna", // was "Julia" which is en-only — German TTS was silently failing
};

// Names known to be female or male, across the 4 supported languages. Lowercased
// without accents. Names that appear in BOTH genders (e.g. "Andrea" in some
// cultures) are left out; the regex heuristic below will then make a guess.
const FEMALE_NAMES = new Set([
  // Spanish
  "maria", "sofia", "lucia", "ana", "carmen", "isabel", "marta", "laura", "sara",
  "paula", "daniela", "camila", "lupita", "carla", "elena", "pilar", "inmaculada",
  "mercedes", "itzel", "ximena", "guadalupe", "paloma", "rocio", "valeria",
  "alejandra", "patricia", "raquel", "monica", "lorena", "natalia", "claudia",
  "veronica", "silvia", "teresa", "rosa", "esperanza", "dolores", "beatriz",
  "cristina", "gabriela", "fernanda", "andrea", "victoria", "adriana", "marisa",
  // French
  "sophie", "marie", "emma", "chloe", "lea", "camille", "clara", "anne", "julie",
  "lucie", "helene", "manon", "charlotte", "amelie", "celine", "isabelle",
  "catherine", "nathalie", "stephanie", "valerie", "sandrine", "florence",
  "caroline", "delphine", "aurelie", "elodie", "audrey", "juliette",
  // English
  "sarah", "olivia", "sophia", "ashley", "wendy", "lily", "anna", "mary",
  "linda", "patricia", "barbara", "susan", "jessica", "jennifer", "lisa",
  "nancy", "karen", "betty", "helen", "sandra", "donna", "carol", "ruth",
  "michelle", "laura", "emily", "kimberly", "amy", "anna", "olivia", "emma",
  // German
  "lena", "sofie", "lina", "mia", "hannah", "lara", "johanna", "annika",
  "birgit", "heike", "sabine", "carina", "franziska", "heidi", "steffi",
  "anja", "petra", "susanne", "monika", "claudia", "kerstin", "andrea",
  "ute", "gabi", "ingrid",
]);

const MALE_NAMES = new Set([
  // Spanish
  "juan", "diego", "miguel", "jose", "carlos", "antonio", "manuel", "pedro",
  "francisco", "pablo", "javier", "mateo", "joaquin", "rafael", "sergio",
  "mauricio", "alejandro", "andres", "eduardo", "salvador", "santiago", "luis",
  "alberto", "ricardo", "fernando", "jorge", "raul", "roberto", "marco", "ivan",
  "victor", "hector", "oscar", "alvaro", "ignacio", "gonzalo", "ruben", "borja",
  "nacho", "inigo", "cuauhtemoc", "maximiliano", "bruno",
  // French
  "pierre", "jean", "lucas", "hugo", "marc", "thomas", "julien", "paul",
  "nicolas", "antoine", "francois", "louis", "etienne", "mathieu", "alain",
  "philippe", "michel", "olivier", "stephane", "patrick", "laurent", "yves",
  "guillaume", "vincent", "alexandre", "sebastien", "fabrice", "remi", "henri",
  // English
  "john", "james", "mark", "michael", "william", "david", "richard", "joseph",
  "thomas", "charles", "alex", "tim", "tom", "bob", "robert", "daniel", "matthew",
  "anthony", "donald", "steven", "paul", "andrew", "joshua", "kenneth", "kevin",
  "brian", "george", "edward", "ronald", "ethan",
  // German
  "lukas", "leon", "jonas", "felix", "maximilian", "hans", "klaus", "peter",
  "stefan", "andreas", "josef", "kilian", "tobias", "fabian", "matthias",
  "hendrik", "reinhard", "bastian", "thomas", "michael", "wolfgang", "jurgen",
  "manfred", "dieter", "uwe", "rainer",
]);

// Some professions / generic roles imply a gender hint in our content; tolerate
// both common forms.
const ROLE_HINTS: Record<string, Gender> = {
  vendeur: "male", vendeuse: "female",
  serveur: "male", serveuse: "female",
  boulanger: "male", boulangere: "female",
  professeur: "male", professeure: "female",
  // Spanish
  vendedor: "male", vendedora: "female",
  camarero: "male", camarera: "female",
  panadero: "male", panadera: "female",
  profesor: "male", profesora: "female",
  // English
  waiter: "male", waitress: "female",
  salesman: "male", saleswoman: "female",
};

function normalize(name: string): string {
  return (name || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "") // strip diacritics
    .replace(/[^a-z]/g, "");
}

/** Best-effort gender guess. Returns `undefined` when nothing matches; the
 *  caller should then fall back to a default voice slot. */
export function guessGender(rawName: string): Gender | undefined {
  const name = normalize(rawName);
  if (!name) return undefined;
  if (FEMALE_NAMES.has(name)) return "female";
  if (MALE_NAMES.has(name)) return "male";
  if (ROLE_HINTS[name]) return ROLE_HINTS[name];

  // Heuristic for Spanish/Italian-style endings — only when no name-list hit.
  // (Doesn't apply cleanly to French/English/German; using only on -a/-o.)
  if (/(a|ina|ita|ela)$/.test(name)) return "female";
  if (/(o|on|or|ando|endo)$/.test(name)) return "male";

  return undefined;
}

function langCodeFromLocale(locale: string): LangCode {
  const code = (locale || "").split("-")[0].toLowerCase();
  if (code === "fr" || code === "es" || code === "en" || code === "de") return code;
  return "fr";
}

// Stable, tiny hash so the same name always lands on the same voice slot.
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/**
 * Pick a TTS voice for a dialogue speaker.
 *
 * @param speaker  Display name of the speaker, e.g. "María" or "Juan".
 * @param locale   TTS locale, e.g. "es-ES" or "fr-FR".
 * @returns Voice ID to pass to the TTS API, or `undefined` to let the API
 *          use its language default.
 */
export function pickVoiceForSpeaker(
  speaker: string | undefined,
  locale: string
): string | undefined {
  const lang = langCodeFromLocale(locale);
  const roster = VOICES[lang];
  if (!speaker || !roster) return DEFAULT_VOICES[lang];

  const gender = guessGender(speaker) || "female";
  const slots = roster[gender];
  if (!slots || slots.length === 0) return DEFAULT_VOICES[lang];

  const idx = hash(normalize(speaker)) % slots.length;
  return slots[idx];
}
