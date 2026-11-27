export interface LeonPalette {
  body: string;
  dark: string;
  light: string;
  bg: string;
  outfit: string;
  accent: string;
}

export const PALETTES: Record<string, LeonPalette> = {
  // Country colours. France and the UK share red/white/blue, so each language
  // leads with a different one to stay distinguishable.
  // French: French blue skin, tricolour scarf
  fr: { body: "#2F6FD6", dark: "#1C3F8A", light: "#DCE7FB", bg: "#EAF1FD", outfit: "#E1353A", accent: "#FFFFFF" },
  // Spanish: Spanish gold skin, red-gold-red neckerchief
  es: { body: "#F5BE1E", dark: "#A9780A", light: "#FFF1C2", bg: "#FFF8E1", outfit: "#C8102E", accent: "#FFD54A" },
  // English: British red skin, Union Jack bow tie
  en: { body: "#D7263D", dark: "#8E1424", light: "#FBD7DC", bg: "#FDECEE", outfit: "#012169", accent: "#FFFFFF" },
};

export function leonPalette(language: string): LeonPalette {
  return PALETTES[language] ?? PALETTES.fr;
}

const GREETINGS: Record<string, string> = { fr: "bonjour", es: "hola", en: "hello" };

export function leonGreeting(language: string): string {
  return GREETINGS[language] ?? "hello";
}
