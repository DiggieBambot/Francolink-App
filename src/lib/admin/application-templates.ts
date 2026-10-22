// Reply templates for tutor applications (Admin → Website → Applications).
//
// The email already opens with "Hi <first name>," and signs off as the
// FrancoLink team, so templates are the body only. They fill the reply box and
// stay fully editable before sending.

import { APP_URL } from "@/lib/site/hosts";

export interface TemplateContext {
  firstName: string;
  email: string;
  /** The application came from a signed-in account (they can open the form directly). */
  hasAccount: boolean;
}

export interface ApplicationTemplate {
  key: string;
  label: string;
  /** Status to move the application to when this reply is sent. */
  status: "reviewing" | "interviewing" | "accepted" | "rejected";
  body: (c: TemplateContext) => string;
  /**
   * Accept the application for real (Admin → Tutors "Accept & invite / list")
   * instead of only setting the status: creates the account and sends its
   * invite, or the draft listing for an existing account.
   */
  acceptOnSend?: boolean;
}

export const APPLICATION_TEMPLATES: ApplicationTemplate[] = [
  {
    key: "pre_approval",
    label: "Pre-approval — invite to complete the tutor form",
    status: "interviewing",
    body: (c) => {
      const steps = c.hasAccount
        ? `Please complete your FrancoLink tutor application here:\n${APP_URL}/tutor/apply`
        : [
            "Here's how to complete your FrancoLink tutor application:",
            `1. Create your tutor account at ${APP_URL}/signup/tutor using this email address (${c.email}).`,
            `2. Once you're signed in, open "Become a FrancoLink tutor" from your dashboard, or go to ${APP_URL}/tutor/apply.`,
          ].join("\n");
      return [
        "Thank you for applying to teach with FrancoLink. We enjoyed reading about your experience, and we'd like to invite you to the next step.",
        steps,
        "It takes about 10 minutes. Please include your teaching experience, qualifications, the levels you teach and your weekly availability. Once it's in, we'll review it and get back to you within a few days.",
        "We look forward to learning more about you.",
      ].join("\n\n");
    },
  },
  {
    key: "accepted",
    label: "Accepted — complete your public tutor profile",
    status: "accepted",
    acceptOnSend: true,
    body: (c) => {
      const signIn = c.hasAccount
        ? "Sign in to FrancoLink with your existing account and you'll see a new \"FrancoLink tutor\" section in your dashboard."
        : `When you sign in to FrancoLink you'll see a new "FrancoLink tutor" section in your dashboard. If you don't have a FrancoLink account yet, we've sent a separate email to ${c.email} so you can set one up.`;
      return [
        "Congratulations — we're delighted to welcome you as a FrancoLink tutor! 🎉",
        signIn,
        "The next step is to complete your public profile, which is what students see before booking you:",
        `${APP_URL}/tutor/public-profile`,
        [
          "Please add:",
          "• A clear, friendly profile photo (face visible, good light)",
          "• A short intro video (1–2 minutes, YouTube or Vimeo) saying who you are and how you teach",
          "• A headline and a bio about your teaching style and experience",
          "• The languages and levels you teach",
          "• Your qualifications and certifications (title, issuer and year)",
          "• Your lesson rate",
        ].join("\n"),
        `Then set the times you're available to teach each week:\n${APP_URL}/tutor/availability`,
        "Please also reply to this email with copies of your certificates (PDF or photos), so we can verify them for your profile.",
        "Once your profile is complete, we'll review it and publish your listing on francolink.net so students can start booking you.",
        "Welcome aboard — we're excited to have you on the team.",
      ].join("\n\n");
    },
  },
  {
    key: "more_info",
    label: "More information needed — background & qualifications",
    status: "reviewing",
    body: () =>
      [
        "Thank you for applying to teach with FrancoLink. Before we can make a decision, we'd like to know a little more about your background. Could you reply to this email with:",
        [
          "• Your teaching experience — how many years, which levels (A1–C2), and whether online, in person or both",
          "• Your qualifications or certifications (for example DELF/DALF, TEFL/TESOL/CELTA, or a teaching or language degree), with copies if you can",
          "• Any exams or goals you've prepared students for (for example TCF Canada, TEF, DELF or IELTS)",
          "• The languages you teach and your own level in each",
          "• Your weekly availability and time zone",
          "• Optionally, a link to a short video introducing yourself",
        ].join("\n"),
        "Once we have this, we'll get back to you quickly.",
      ].join("\n\n"),
  },
  {
    key: "rejection",
    label: "Not right now — keep on file for the future",
    status: "rejected",
    body: () =>
      [
        "Thank you for your interest in teaching with FrancoLink, and for the time you put into your application.",
        "After careful review, we've decided not to move forward with your application at this time. This isn't a judgement on your teaching — right now we're looking for a specific tutor profile to match our current students' needs, and yours isn't the closest fit at the moment.",
        "With your permission, we'll keep your application on file and reach out if our needs change. You're also very welcome to apply again in the future.",
        "We wish you every success in your teaching.",
      ].join("\n\n"),
  },
];
