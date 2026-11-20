// Checking a chat attachment before anyone else can open it.
//
// The browser's word for what a file is counts for nothing: a file name and a
// MIME type are both just strings the sender typed. Everything here is decided
// from the BYTES, and every file that is published is one this module either
// rebuilt itself or inspected end to end.
//
//   images  Decoded and re-encoded from pixels. Whatever rode along -- EXIF
//           (which also carries the sender's GPS position), comments, a script
//           or an archive glued on after the image data, a polyglot that is a
//           valid PNG and a valid HTML page at once -- does not survive being
//           turned into pixels and back.
//   PDF     Parsed, including compressed object streams, and refused if
//           anything in it can act: JavaScript, launching programs, embedded
//           files, forms that submit, 3D/Flash/media, links that open other
//           files. Encrypted PDFs are refused because they cannot be
//           inspected. The accepted document is re-written from its parsed
//           objects, which drops anything appended after it.
//   audio   Cannot be re-encoded here (no ffmpeg on the platform), so it must
//           start with a real audio signature and carry no executable,
//           archive or markup anywhere inside it.
//   text    Must be clean UTF-8 with no binary in it, and is always served as
//           plain text so a browser can never treat it as a page.
//
// Kept free of app imports so it can be tested directly with node.

import sharp from "sharp";
import { PDFDocument, PDFArray, PDFDict, PDFName, PDFRef, PDFStream } from "pdf-lib";

export interface CleanFile {
  bytes: Buffer;
  /** The type it will be SERVED as -- decided here, never by the sender. */
  type: string;
  ext: string;
}

export class RejectedFile extends Error {}

const reject = (why: string): never => {
  throw new RejectedFile(why);
};

// ---------------------------------------------------------------- sniffing

type Kind =
  | { kind: "image"; format: "png" | "jpeg" | "gif" | "webp" }
  | { kind: "pdf" }
  | { kind: "audio"; type: string; ext: string };

const startsWith = (b: Buffer, sig: number[], at = 0) =>
  b.length >= at + sig.length && sig.every((v, i) => b[at + i] === v);
const ascii = (b: Buffer, from: number, to: number) => b.subarray(from, to).toString("latin1");

/** What the file actually is, from its first bytes. Null = nothing we accept. */
function sniff(b: Buffer): Kind | null {
  if (startsWith(b, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return { kind: "image", format: "png" };
  if (startsWith(b, [0xff, 0xd8, 0xff])) return { kind: "image", format: "jpeg" };
  if (ascii(b, 0, 6) === "GIF87a" || ascii(b, 0, 6) === "GIF89a") return { kind: "image", format: "gif" };
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WEBP") return { kind: "image", format: "webp" };
  if (ascii(b, 0, 5) === "%PDF-") return { kind: "pdf" };
  if (ascii(b, 0, 4) === "RIFF" && ascii(b, 8, 12) === "WAVE") return { kind: "audio", type: "audio/wav", ext: "wav" };
  if (startsWith(b, [0x1a, 0x45, 0xdf, 0xa3])) return { kind: "audio", type: "audio/webm", ext: "webm" };
  if (ascii(b, 4, 8) === "ftyp" && /^(M4A |M4B |mp42|isom|iso2|dash)$/.test(ascii(b, 8, 12))) {
    return { kind: "audio", type: "audio/mp4", ext: "m4a" };
  }
  if (ascii(b, 0, 3) === "ID3" || (b[0] === 0xff && (b[1] & 0xe0) === 0xe0)) {
    return { kind: "audio", type: "audio/mpeg", ext: "mp3" };
  }
  return null;
}

/** Signatures of things that run, or that hide other files. Checked at offset 0. */
function looksExecutable(b: Buffer): boolean {
  return (
    startsWith(b, [0x4d, 0x5a]) || // Windows .exe/.dll ("MZ")
    startsWith(b, [0x7f, 0x45, 0x4c, 0x46]) || // Linux ELF
    startsWith(b, [0xca, 0xfe, 0xba, 0xbe]) || // Mach-O fat / Java class
    startsWith(b, [0xfe, 0xed, 0xfa, 0xce]) ||
    startsWith(b, [0xfe, 0xed, 0xfa, 0xcf]) ||
    startsWith(b, [0xcf, 0xfa, 0xed, 0xfe]) ||
    startsWith(b, [0xce, 0xfa, 0xed, 0xfe]) ||
    startsWith(b, [0x50, 0x4b, 0x03, 0x04]) || // ZIP (also .docx, .jar, .apk)
    startsWith(b, [0x52, 0x61, 0x72, 0x21]) || // RAR
    startsWith(b, [0x37, 0x7a, 0xbc, 0xaf]) || // 7z
    startsWith(b, [0x23, 0x21]) // "#!" script
  );
}

/**
 * Markup, scripts or embedded programs ANYWHERE in a file we cannot rebuild.
 * Audio data is compressed noise; these strings do not occur in it by chance.
 */
const HIDDEN_PAYLOAD = [
  /<\s*script/i,
  /<\s*html/i,
  /<\s*svg/i,
  /<\s*iframe/i,
  /<\?php/i,
  /javascript:/i,
  /This program cannot be run in DOS mode/,
  /PK\x03\x04/,
];

function hasHiddenPayload(b: Buffer): boolean {
  const s = b.toString("latin1");
  return HIDDEN_PAYLOAD.some((re) => re.test(s));
}

// ------------------------------------------------------------------- images

const MAX_PIXELS = 40_000_000; // ~ 7000x5700; refuses decompression bombs

async function cleanImage(b: Buffer, format: "png" | "jpeg" | "gif" | "webp"): Promise<CleanFile> {
  const animated = format === "gif" || format === "webp";
  try {
    // .rotate() bakes in the EXIF orientation before the metadata is dropped,
    // so a phone photo is not suddenly sideways. Metadata is not copied to the
    // output unless asked for, which this never does.
    let img = sharp(b, { animated, limitInputPixels: MAX_PIXELS, failOn: "error" }).rotate();
    if (format === "png") img = img.png();
    else if (format === "jpeg") img = img.jpeg({ quality: 88, mozjpeg: true });
    else if (format === "gif") img = img.gif();
    else img = img.webp({ quality: 88 });
    const bytes = await img.toBuffer();
    return { bytes, type: `image/${format}`, ext: format === "jpeg" ? "jpg" : format };
  } catch {
    return reject("That image looks damaged or unsafe, so it wasn't sent.");
  }
}

// ---------------------------------------------------------------------- PDF

/** Dictionary keys that only exist to make a PDF do something. */
const ACTIVE_KEYS = new Set([
  "JS",
  "JavaScript",
  "Launch",
  "EmbeddedFile",
  "EmbeddedFiles",
  "EF",
  "RichMedia",
  "RichMediaContent",
  "XFA",
  "AA",
  "Sound",
  "Movie",
  "3DD",
]);

/** Action types (/S) that run something, send something, or open elsewhere. */
const ACTIVE_ACTIONS = new Set([
  "JavaScript",
  "Launch",
  "SubmitForm",
  "ImportData",
  "GoToR",
  "GoToE",
  "RichMediaExecute",
  "Rendition",
  "Sound",
  "Movie",
]);

function nameOf(o: unknown): string | null {
  return o instanceof PDFName ? o.decodeText() : null;
}

function findActiveContent(pdf: PDFDocument): string | null {
  const seen = new Set<unknown>();
  const visit = (o: unknown): string | null => {
    if (!o || seen.has(o)) return null;
    seen.add(o);
    if (o instanceof PDFRef) return visit(pdf.context.lookup(o));
    if (o instanceof PDFStream) return visit(o.dict);
    if (o instanceof PDFArray) {
      for (let i = 0; i < o.size(); i++) {
        const hit = visit(o.get(i));
        if (hit) return hit;
      }
      return null;
    }
    if (o instanceof PDFDict) {
      const s = nameOf(o.get(PDFName.of("S")));
      if (s && ACTIVE_ACTIONS.has(s)) return s;
      for (const [key, value] of o.entries()) {
        const k = key.decodeText();
        if (ACTIVE_KEYS.has(k)) return k;
        const hit = visit(value);
        if (hit) return hit;
      }
    }
    return null;
  };
  // Every object in the file, referenced or not -- unreferenced objects are a
  // classic place to park a payload for a lenient reader to find.
  for (const [, obj] of pdf.context.enumerateIndirectObjects()) {
    const hit = visit(obj);
    if (hit) return hit;
  }
  return visit(pdf.catalog);
}

async function cleanPdf(b: Buffer): Promise<CleanFile> {
  let pdf: PDFDocument;
  try {
    // ignoreEncryption is left false: an encrypted PDF throws here, and one we
    // cannot read is one we cannot vouch for.
    pdf = await PDFDocument.load(b, { updateMetadata: false, throwOnInvalidObject: true });
  } catch {
    return reject("That PDF is encrypted or damaged, so it wasn't sent.");
  }
  const active = findActiveContent(pdf);
  if (active) {
    return reject("That PDF contains scripts, attachments or actions, so it wasn't sent.");
  }
  // Re-written from the parsed objects: trailing data after the real document
  // (where polyglots keep their second personality) is not carried over.
  const bytes = Buffer.from(await pdf.save({ useObjectStreams: false }));
  return { bytes, type: "application/pdf", ext: "pdf" };
}

// --------------------------------------------------------------------- text

function cleanText(b: Buffer): CleanFile {
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(b);
  } catch {
    return reject("That text file isn't plain text, so it wasn't sent.");
  }
  // Tabs and line breaks only; any other control character means binary.
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]/.test(text)) {
    return reject("That text file isn't plain text, so it wasn't sent.");
  }
  return { bytes: Buffer.from(text, "utf-8"), type: "text/plain; charset=utf-8", ext: "txt" };
}

// --------------------------------------------------------------------- entry

/**
 * Inspect and rebuild one uploaded file. Throws RejectedFile (with a message
 * fit to show the sender) for anything that is not demonstrably harmless.
 *
 * `claimedType` is used for ONE thing: a file that claims to be text is
 * checked as text. It never makes a file count as an image, PDF or audio.
 */
export async function sanitizeUpload(b: Buffer, claimedType: string): Promise<CleanFile> {
  if (b.length === 0) reject("That file is empty.");
  if (looksExecutable(b)) reject("Programs and archives can't be shared in class.");

  const kind = sniff(b);
  if (!kind) {
    if (claimedType === "text/plain") {
      if (hasHiddenPayload(b)) reject("That text file contains code, so it wasn't sent.");
      return cleanText(b);
    }
    return reject("Share an image, PDF, audio clip or text file.");
  }

  if (kind.kind === "image") return cleanImage(b, kind.format);
  if (kind.kind === "pdf") return cleanPdf(b);

  if (hasHiddenPayload(b)) reject("That audio file contains hidden content, so it wasn't sent.");
  return { bytes: b, type: kind.type, ext: kind.ext };
}
