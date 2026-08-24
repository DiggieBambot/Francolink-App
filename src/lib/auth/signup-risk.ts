// Signup risk scoring — one place that decides whether a new account looks real.
//
// Why this exists: the signup forms talk to Supabase Auth directly from the
// browser (see components/auth/turnstile.tsx), so a bot never has to touch this
// app to create a user. Turnstile stops the dumb floods; what gets through is
// scripted-but-human-solved signups whose *content* is the giveaway — names
// like "Wnzvb Qzrbbq" and burner mailboxes.
//
// Two gates use these rules, and they must agree:
//   1. The Postgres `before-user-created` auth hook (supabase/migrations/
//      20260821_signup_risk.sql) — the only true pre-registration block, since
//      it runs inside Supabase where the browser POST actually lands.
//   2. This module, on our own server routes (student-setup, join-tutor), which
//      decides whether a join reaches a tutor as `active`, as `pending`, or not
//      at all.
//
// Keep the two in sync: if you change a rule here, mirror it in the SQL.

export type SignupVerdict = "allow" | "review" | "block";

export interface SignupRisk {
  /** 0 = clean. Higher is worse. */
  score: number;
  verdict: SignupVerdict;
  /** Machine-readable rule ids that fired, for logging and tuning. */
  reasons: string[];
}

/** Score at which a signup stops reaching tutors and waits for approval. */
export const REVIEW_THRESHOLD = 4;
/** Score at which we refuse outright. */
export const BLOCK_THRESHOLD = 7;

// Burner/disposable mailbox providers. Not exhaustive by design — this is the
// tail that shows up in our logs, and the scoring below catches novel domains
// through their shape rather than their name.
const DISPOSABLE_DOMAINS = new Set([
  "mailinator.com", "guerrillamail.com", "guerrillamail.net", "sharklasers.com",
  "10minutemail.com", "tempmail.com", "temp-mail.org", "throwawaymail.com",
  "yopmail.com", "yopmail.fr", "trashmail.com", "getnada.com", "nada.email",
  "dispostable.com", "fakeinbox.com", "maildrop.cc", "mailnesia.com",
  "tempinbox.com", "spamgourmet.com", "mytemp.email", "moakt.com",
  "emailondeck.com", "tempmailo.com", "mail-temp.com", "inboxkitten.com",
  "harakirimail.com", "grr.la", "spam4.me", "byom.de", "einrot.com",
  "cuvox.de", "dayrep.com", "armyspy.com", "teleworm.us", "rhyta.com",
  "jourrapide.com", "superrito.com", "gustr.com", "fleckens.hu",
]);

// Free providers are fine — most real students use one. We only note it so that
// it can combine with other weak signals.
const FREE_DOMAINS = new Set([
  "gmail.com", "googlemail.com", "yahoo.com", "yahoo.fr", "hotmail.com",
  "hotmail.fr", "outlook.com", "outlook.fr", "live.com", "live.fr",
  "icloud.com", "me.com", "aol.com", "proton.me", "protonmail.com",
  "gmx.com", "gmx.de", "mail.com", "orange.fr", "free.fr", "laposte.net",
  "wanadoo.fr", "sfr.fr", "hotmail.co.uk", "yandex.ru", "mail.ru",
]);

/** Strip accents and lowercase, so "Émile" and "emile" score alike. */
function normalize(s: string): string {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/**
 * How much a word looks like keyboard noise, 0..1. Real names in every script
 * we serve alternate vowels and consonants; random strings do not.
 */
export function gibberishScore(rawWord: string): number {
  const w = normalize(rawWord).replace(/[^a-z]/g, "");
  if (w.length < 3) return 0;

  let score = 0;
  const vowelCount = (w.match(/[aeiouy]/g) || []).length;
  const vowelRatio = vowelCount / w.length;

  // No vowels at all in a 3+ letter word is decisive ("Wnzvb", "Qzrbbq").
  if (vowelCount === 0) score += 1;
  else if (vowelRatio < 0.2) score += 0.6;
  else if (vowelRatio > 0.8) score += 0.4; // "aeiaeia"

  // Long consonant runs. French and English tolerate 3 ("strong"), not 4.
  if (/[bcdfghjklmnpqrstvwxz]{4,}/.test(w)) score += 0.5;

  // 'q' without 'u' after it is near-impossible in the languages we serve.
  if (/q(?!u)/.test(w)) score += 0.4;

  // Same letter three times running.
  if (/(.)\1{2,}/.test(w)) score += 0.4;

  // Digits inside a name word.
  if (/\d/.test(normalize(rawWord))) score += 0.3;

  return Math.min(1, score);
}

/** Gmail-style aliasing collapsed away, so a+1@ and a.b@ resolve to one identity. */
export function canonicalEmail(email: string): string {
  const [rawLocal = "", domain = ""] = normalize(email).trim().split("@");
  const local = rawLocal.split("+")[0];
  const isGoogle = domain === "gmail.com" || domain === "googlemail.com";
  return `${isGoogle ? local.replace(/\./g, "") : local}@${isGoogle ? "gmail.com" : domain}`;
}

export interface SignupInput {
  email: string;
  name?: string | null;
  /** Recent signups seen from the same IP, if the caller can count them. */
  ipSignupsLastHour?: number;
}

/**
 * Score a signup. Pure and synchronous — no I/O, so it is safe to call from
 * anywhere and easy to unit-test.
 */
export function assessSignup({ email, name, ipSignupsLastHour }: SignupInput): SignupRisk {
  const reasons: string[] = [];
  let score = 0;

  const add = (points: number, reason: string) => {
    score += points;
    reasons.push(reason);
  };

  const cleanEmail = normalize(email || "").trim();
  const [local = "", domain = ""] = cleanEmail.split("@");

  if (!cleanEmail.includes("@") || !domain.includes(".")) {
    add(10, "email_malformed");
    return finish(score, reasons);
  }

  // --- Email domain ---------------------------------------------------------
  if (DISPOSABLE_DOMAINS.has(domain)) add(8, "email_disposable_domain");

  // A domain whose own name is noise is a throwaway we haven't listed yet.
  const domainLabel = domain.split(".")[0];
  if (gibberishScore(domainLabel) >= 0.6 && !FREE_DOMAINS.has(domain)) {
    add(4, "email_domain_gibberish");
  }

  // --- Email local part -----------------------------------------------------
  // Drop a leading initial first: "jsmith" and "m.alrashid" are how half the
  // world writes a real address, and they read as vowel-poor noise otherwise.
  const localCore = local.replace(/[._+-]/g, "").replace(/^[bcdfghjklmnpqrstvwxz](?=[a-z]{4,})/, "");
  if (gibberishScore(localCore) >= 0.8) add(3, "email_local_gibberish");

  // Long digit tails ("john48810293") and mostly-numeric locals are generated.
  const digits = (local.match(/\d/g) || []).length;
  if (digits >= 6) add(2, "email_local_digit_heavy");
  if (local.length >= 6 && digits / local.length > 0.5) add(2, "email_local_mostly_digits");

  // Plus-aliasing is legitimate for one user but is how one bot becomes fifty.
  if (local.includes("+")) add(1, "email_plus_alias");

  // --- Display name ---------------------------------------------------------
  const trimmedName = (name || "").trim();
  if (!trimmedName) {
    add(2, "name_missing");
  } else {
    const words = trimmedName.split(/\s+/).filter(Boolean);
    const wordScores = words.map(gibberishScore);
    const worst = Math.max(0, ...wordScores);
    const everyWordNoise = words.length > 0 && wordScores.every((s) => s >= 0.6);

    if (everyWordNoise) add(6, "name_all_words_gibberish");
    else if (worst >= 0.9) add(4, "name_word_gibberish");
    else if (worst >= 0.6) add(2, "name_word_suspicious");

    if (/https?:\/\/|www\.|\.(com|net|ru|xyz|top)\b/i.test(trimmedName)) {
      add(6, "name_contains_url");
    }
    if (trimmedName.length > 60) add(2, "name_too_long");
  }

  // --- Velocity -------------------------------------------------------------
  if (typeof ipSignupsLastHour === "number") {
    if (ipSignupsLastHour >= 10) add(6, "ip_burst_severe");
    else if (ipSignupsLastHour >= 4) add(3, "ip_burst");
  }

  return finish(score, reasons);
}

function finish(score: number, reasons: string[]): SignupRisk {
  const verdict: SignupVerdict =
    score >= BLOCK_THRESHOLD ? "block" : score >= REVIEW_THRESHOLD ? "review" : "allow";
  return { score, verdict, reasons };
}
