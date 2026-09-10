// Generate the same French phrases on every TTS provider we have a key for,
// so the choice is made by listening rather than by reading a pricing table.
//
//   npx tsx scripts/tts-compare.mts                 # every provider with a key
//   npx tsx scripts/tts-compare.mts --only google
//   npx tsx scripts/tts-compare.mts --out ~/Desktop/tts
//
// Writes <out>/<phrase-slug>/<provider>-<voice>.mp3 so the same line sits
// side by side across providers, and prints a cost estimate for the real
// backlog at each provider's rate.
//
// The phrases are chosen to stress what French TTS actually gets wrong, and
// what this catalogue depends on: elision (l'école vs le héros), liaison,
// nasal vowels, and the articles the lesson worker spent a week adding.

/* eslint-disable @typescript-eslint/no-explicit-any */

import { config } from "dotenv";
config({ path: ".env.local" });
import { mkdirSync, writeFileSync } from "fs";
import { join } from "path";

const argv = process.argv.slice(2);
const val = (f: string) => {
  const i = argv.indexOf(f);
  return i >= 0 ? argv[i + 1] : undefined;
};
const only = val("--only");
const OUT = val("--out") ?? "/tmp/tts-compare";

/** Characters the real backlog needs, from warm-tts-cache.mjs. */
const BACKLOG_CHARS = 397_861;

const EXTRA: { slug: string; text: string; why: string }[] = [
  { slug: "liaison-chain", text: "Les enfants ont attendu un an et demi.", why: "three liaisons in a row" },
  { slug: "r-and-u", text: "Une rue rurale, très étroite.", why: "French r and u — the classic English-accent tell" },
  { slug: "eu-sound", text: "Ma sœur peut le faire un peu mieux.", why: "the eu/œu vowels" },
  { slug: "silent-endings", text: "Ils parlent beaucoup trop vite.", why: "silent final consonants" },
  { slug: "e-muet", text: "Je ne le sais pas encore.", why: "e muet and elision in speech" },
  { slug: "dialogue-line", text: "Bonjour, je voudrais réserver une table pour deux personnes, s'il vous plaît.", why: "a natural dialogue line" },
  { slug: "counting", text: "un, deux, trois, quatre, cinq, six, sept, huit, neuf, dix", why: "counting — every learner hears this" },
];

const PHRASES: { slug: string; text: string; why: string }[] = [
  { slug: "elision-ecole", text: "l'école", why: "elision before a vowel" },
  { slug: "aspirate-heros", text: "le héros", why: "aspirate h — must NOT elide" },
  { slug: "elision-hotel", text: "l'hôtel", why: "mute h — must elide" },
  { slug: "article-natation", text: "la natation", why: "a real vocabulary card" },
  { slug: "article-football", text: "le football", why: "a real vocabulary card" },
  { slug: "plural-vacances", text: "les vacances", why: "plural-only noun" },
  { slug: "liaison-vous-avez", text: "Vous avez un instant ?", why: "liaison + question intonation" },
  { slug: "nasal-vowels", text: "Un bon vin blanc.", why: "the four nasal vowels" },
  { slug: "question-preferes", text: "Quels plats préfères-tu ?", why: "inversion question, from a word-order drill" },
  { slug: "numbers", text: "quatre-vingt-dix-sept euros", why: "French number handling" },
  { slug: "passage", text: "La Slovénie est un pays souvent méconnu, situé entre l'Italie, la Hongrie, la Croatie et la mer Adriatique. Ce joyau européen se distingue par ses montagnes majestueuses.", why: "passage prose, from a real lesson" },
];

interface Provider {
  name: string;
  rate: number; // USD per 1M characters
  voices: string[];
  enabled: boolean;
  synth: (text: string, voice: string) => Promise<Buffer>;
  ext: string;
}

/** Gemini TTS returns raw little-endian PCM, not a container. Wrap it so the
 *  file is playable by double-clicking it. */
function pcmToWav(pcm: Buffer, sampleRate = 24000, channels = 1, bits = 16): Buffer {
  const header = Buffer.alloc(44);
  const byteRate = (sampleRate * channels * bits) / 8;
  header.write("RIFF", 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write("WAVE", 8);
  header.write("fmt ", 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE((channels * bits) / 8, 32);
  header.writeUInt16LE(bits, 34);
  header.write("data", 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

const googleKey = process.env.GOOGLE_API_KEY;
const geminiKey = process.env.GEMINI_API_KEY;
const openaiKey = process.env.OPENAI_API_KEY;
const inworldKey = process.env.INWORLD_API_KEY;
const azureKey = process.env.AZURE_SPEECH_KEY;
const azureRegion = process.env.AZURE_SPEECH_REGION;

const providers: Provider[] = [
  {
    // The one you listened to and liked. Note this is a generative model told
    // to speak, not a plain TTS endpoint: the instruction below pins it to
    // reading the text verbatim, because left to itself it will happily
    // introduce or comment on the line.
    name: "gemini-3.1-flash-tts",
    rate: 0,
    voices: ["Kore", "Puck"],
    enabled: !!geminiKey,
    ext: "wav",
    synth: async (text, voice) => {
      const res = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent",
        {
          method: "POST",
          headers: { "x-goog-api-key": geminiKey!, "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `Read this French text aloud exactly as written, in a clear neutral French accent, and say nothing else: ${text}` }] }],
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } } },
            },
          }),
        }
      );
      const json: any = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
      const part = json?.candidates?.[0]?.content?.parts?.[0]?.inlineData;
      if (!part?.data) throw new Error("no audio returned");
      return pcmToWav(Buffer.from(part.data, "base64"));
    },
  },
  {
    name: "google-chirp3",
    rate: 30,
    voices: ["fr-FR-Chirp3-HD-Aoede", "fr-FR-Chirp3-HD-Charon"],
    enabled: !!googleKey,
    ext: "mp3",
    synth: async (text, voice) => {
      const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: "fr-FR", name: voice },
          audioConfig: { audioEncoding: "MP3" },
        }),
      });
      const json: any = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
      return Buffer.from(json.audioContent, "base64");
    },
  },
  {
    name: "google-neural2",
    rate: 16,
    voices: ["fr-FR-Neural2-A"],
    enabled: !!googleKey,
    ext: "mp3",
    synth: async (text, voice) => {
      const res = await fetch(`https://texttospeech.googleapis.com/v1/text:synthesize?key=${googleKey}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: { languageCode: "fr-FR", name: voice },
          audioConfig: { audioEncoding: "MP3" },
        }),
      });
      const json: any = await res.json();
      if (!res.ok) throw new Error(json?.error?.message ?? `HTTP ${res.status}`);
      return Buffer.from(json.audioContent, "base64");
    },
  },
  {
    name: "openai",
    rate: 15,
    // Worth auditioning several: these are English-first voices speaking
    // French, and how much English accent survives differs a lot per voice.
    voices: (val("--voices") ?? "nova,shimmer,alloy,sage,coral,ash,echo,fable").split(",").map((v) => v.trim()),
    enabled: !!openaiKey,
    ext: "mp3",
    synth: async (text, voice) => {
      const res = await fetch("https://api.openai.com/v1/audio/speech", {
        method: "POST",
        headers: { Authorization: `Bearer ${openaiKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: "gpt-4o-mini-tts", voice, input: text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 120)}`);
      return Buffer.from(await res.arrayBuffer());
    },
  },
  {
    name: "inworld-current",
    rate: 25,
    // The voice this app ships with today — the baseline to beat.
    voices: ["Hélène"],
    enabled: !!inworldKey,
    ext: "wav",
    synth: async (text, voice) => {
      const res = await fetch("https://api.inworld.ai/tts/v1/voice", {
        method: "POST",
        headers: { Authorization: `Basic ${inworldKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          voice_id: voice,
          model_id: "inworld-tts-1",
          audioConfig: { speakingRate: 1.0 },
        }),
      });
      const json: any = await res.json();
      if (!res.ok) throw new Error(json?.message ?? `HTTP ${res.status}`);
      return Buffer.from(json.audioContent ?? json.result?.audioContent, "base64");
    },
  },
  {
    name: "azure",
    rate: 16,
    voices: ["fr-FR-DeniseNeural"],
    enabled: !!azureKey && !!azureRegion,
    ext: "mp3",
    synth: async (text, voice) => {
      const res = await fetch(`https://${azureRegion}.tts.speech.microsoft.com/cognitiveservices/v1`, {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": azureKey!,
          "Content-Type": "application/ssml+xml",
          "X-Microsoft-OutputFormat": "audio-24khz-48kbitrate-mono-mp3",
        },
        body: `<speak version='1.0' xml:lang='fr-FR'><voice name='${voice}'>${text.replace(/&/g, "&amp;").replace(/</g, "&lt;")}</voice></speak>`,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${(await res.text()).slice(0, 120)}`);
      return Buffer.from(await res.arrayBuffer());
    },
  },
];

PHRASES.push(...EXTRA);

const active = providers.filter((p) => p.enabled && (!only || p.name.includes(only)));

console.log(`\nWriting to ${OUT}\n`);
for (const p of providers) {
  const why = p.enabled ? (only && !p.name.includes(only) ? "skipped (--only)" : "will run") : "no key configured";
  console.log(`  ${p.name.padEnd(18)} $${String(p.rate).padStart(3)}/1M  backlog $${((BACKLOG_CHARS / 1e6) * p.rate).toFixed(2).padStart(6)}   ${why}`);
}
console.log();

if (active.length === 0) {
  console.log("Nothing to run — no provider keys available.\n");
  process.exit(0);
}

mkdirSync(OUT, { recursive: true });
let ok = 0, failed = 0;

for (const phrase of PHRASES) {
  const dir = join(OUT, phrase.slug);
  mkdirSync(dir, { recursive: true });
  console.log(`${phrase.text}`);
  console.log(`  ${phrase.why}`);
  for (const p of active) {
    for (const voice of p.voices) {
      try {
        const buf = await p.synth(phrase.text, voice);
        const file = join(dir, `${p.name}-${voice.replace(/[^\w-]/g, "")}.${p.ext}`);
        writeFileSync(file, buf);
        console.log(`    ok    ${p.name}/${voice}  ${(buf.length / 1024).toFixed(0)} KB`);
        ok++;
      } catch (err) {
        console.log(`    FAIL  ${p.name}/${voice}  ${err instanceof Error ? err.message.slice(0, 90) : err}`);
        failed++;
      }
    }
  }
  console.log();
}

console.log(`${ok} clips written, ${failed} failed.`);
console.log(`Listen:  open ${OUT}\n`);
