// src/lib/demo.ts
//
// Demo accounts (used to film the student and tutor dashboards for social
// videos) live in the real database, marked by a reserved email domain rather
// than a column, so no migration is needed. Everything that counts users, lists
// tutors publicly or sends email must ignore them.
//
// Seed them with: npx tsx scripts/seed-demo-accounts.mts

export const DEMO_EMAIL_DOMAIN = "demo.francolink.net";

/** For PostgREST filters: `.not("email", "ilike", DEMO_EMAIL_PATTERN)`. */
export const DEMO_EMAIL_PATTERN = `%@${DEMO_EMAIL_DOMAIN}`;

export function isDemoEmail(email: string | null | undefined): boolean {
  return !!email && email.trim().toLowerCase().endsWith(`@${DEMO_EMAIL_DOMAIN}`);
}
