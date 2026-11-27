// On/off switches for automated marketing email, kept in app_settings
// (category 'features') so an admin can flip them from /admin/settings with no
// redeploy. Both default to OFF when the row is missing: a switch that fails
// open would send marketing mail nobody decided to send.
//
// Only marketing mail is behind these. Transactional mail (bookings, lesson
// reminders, "a student joined", class requests, messages, application
// replies) never reads them.

import { getSetting } from "@/lib/config/settings";

/**
 * Tutor engagement/marketing emails from the engagement cron (win-back,
 * "assign homework", and the rotating newsletter themes). Paused 2026-11-26.
 * The `requests` email ("students are waiting to join your class") is not
 * behind this switch: it is about real students waiting on that tutor.
 */
export async function tutorMarketingEmailsEnabled(): Promise<boolean> {
  return getSetting("features", "tutor_marketing_emails", false);
}

/**
 * The student "speak" sequence (live lessons with tutors, practice with Léon).
 * Off until the owner gives the go-ahead; dry runs work either way.
 */
export async function speakEmailsEnabled(): Promise<boolean> {
  return getSetting("features", "student_speak_emails", false);
}
