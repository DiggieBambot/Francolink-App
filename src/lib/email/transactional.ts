// Transactional (account) email: welcome, "a student joined your class", and
// "your tutor confirmed you". Unlike the drip campaign these carry NO
// List-Unsubscribe header and ignore email_marketing_opt_out — they're
// account/relationship mail, not marketing.

import { createClient } from "@supabase/supabase-js";
import { getResend, DEFAULT_FROM } from "@/lib/email/resend";
import { emailShell, escapeHtml, APP_URL } from "@/lib/email/shell";

const REPLY_TO = "support@francolink.net";

function svc() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}

function firstNameOf(name?: string | null, email?: string | null): string {
  return (name || (email || "").split("@")[0] || "there").split(/\s+/)[0];
}

async function send(to: string, subject: string, html: string, text: string): Promise<void> {
  try {
    const { error } = await getResend().emails.send({
      from: DEFAULT_FROM,
      to,
      subject,
      html,
      text,
      replyTo: REPLY_TO,
    });
    if (error) console.error("[transactional] send failed:", error.message);
  } catch (e) {
    console.error("[transactional] send threw:", (e as Error).message);
  }
}

// ── Pure renderers (also used by the no-send preview route) ─────────────────
export interface RenderedEmail { subject: string; html: string; text: string; }

export function renderWelcome(firstName: string, isTutor: boolean): RenderedEmail {
  const subject = isTutor ? "Welcome to Francolink 👋" : "Welcome to Francolink — let's learn French 🇫🇷";
  const bodyHtml = isTutor
    ? `<p style="margin:0 0 16px 0;font-size:16px;">Welcome aboard! Your teaching space is ready.</p>
       <p style="margin:0 0 16px 0;font-size:16px;">Two quick things to get going: open your <b>live classroom</b> and share the link with a student, and copy your <b>invite link</b> from the Students tab so learners can join your class. When a student joins, you'll get an email.</p>`
    : `<p style="margin:0 0 16px 0;font-size:16px;">Great to have you! You can browse the whole lesson library for free and learn live with a tutor.</p>
       <p style="margin:0 0 16px 0;font-size:16px;">Jump into your dashboard to pick up where you left off — and if your tutor sends you homework, it'll show up right on the lesson.</p>`;
  const ctaHref = isTutor ? `${APP_URL}/tutor/students` : `${APP_URL}/dashboard`;
  const ctaText = isTutor ? "Open my classroom" : "Go to my dashboard";
  const text = isTutor
    ? `Hi ${firstName}, welcome to Francolink! Open your live classroom and share your invite link from the Students tab. ${ctaHref}`
    : `Hi ${firstName}, welcome to Francolink! Browse the lesson library and learn live with a tutor. ${ctaHref}`;
  return { subject, html: emailShell({ firstName, bodyHtml, ctaHref, ctaText }), text };
}

export function renderNewStudent(firstName: string, studentName?: string | null): RenderedEmail {
  const who = escapeHtml(studentName || "A new student");
  const bodyHtml =
    `<p style="margin:0 0 16px 0;font-size:16px;"><b>${who}</b> asked to join your class on Francolink.</p>
     <p style="margin:0 0 16px 0;font-size:16px;">Head to your Students tab to confirm them — then you can send lessons and homework their way.</p>`;
  const text = `${studentName || "A new student"} asked to join your class on Francolink. Confirm them: ${APP_URL}/tutor/students`;
  return {
    subject: "You have a new student request 🎉",
    html: emailShell({ firstName, bodyHtml, ctaHref: `${APP_URL}/tutor/students`, ctaText: "Review the request" }),
    text,
  };
}

export function renderConfirmed(firstName: string, tutorName?: string | null): RenderedEmail {
  const tutor = escapeHtml(tutorName || "Your tutor");
  const bodyHtml =
    `<p style="margin:0 0 16px 0;font-size:16px;"><b>${tutor}</b> confirmed you as their student. You're all set!</p>
     <p style="margin:0 0 16px 0;font-size:16px;">You'll now get lessons and homework from them, and your progress is tracked automatically.</p>`;
  const text = `${tutorName || "Your tutor"} confirmed you as their student on Francolink. ${APP_URL}/dashboard`;
  return {
    subject: "You're connected with your tutor 🎉",
    html: emailShell({ firstName, bodyHtml, ctaHref: `${APP_URL}/dashboard`, ctaText: "Go to my dashboard" }),
    text,
  };
}

export function renderClassRequest(
  firstName: string,
  studentName?: string | null,
  message?: string | null,
  preferredTime?: string | null
): RenderedEmail {
  const who = escapeHtml(studentName || "A student");
  const extras = [
    preferredTime ? `<p style="margin:0 0 8px 0;font-size:15px;color:#475569;"><b>Preferred time:</b> ${escapeHtml(preferredTime)}</p>` : "",
    message ? `<p style="margin:0 0 8px 0;font-size:15px;color:#475569;"><b>Note:</b> ${escapeHtml(message)}</p>` : "",
  ].join("");
  const bodyHtml =
    `<p style="margin:0 0 16px 0;font-size:16px;"><b>${who}</b> would like to book a class with you.</p>${extras}
     <p style="margin:16px 0 0 0;font-size:16px;">Open your classroom to start a live session, or reply to arrange a time.</p>`;
  const text = `${studentName || "A student"} wants to book a class.${preferredTime ? ` Preferred time: ${preferredTime}.` : ""}${message ? ` Note: ${message}` : ""} Open your classroom: ${APP_URL}/tutor/students`;
  return {
    subject: "A student wants to book a class 📅",
    html: emailShell({ firstName, bodyHtml, ctaHref: `${APP_URL}/tutor/students`, ctaText: "Open my classroom" }),
    text,
  };
}

export function renderHomeworkAssigned(
  firstName: string,
  lessonSlug: string,
  homeworkTitle: string,
  tutorName?: string | null
): RenderedEmail {
  const tutor = escapeHtml(tutorName || "Your tutor");
  const title = escapeHtml(homeworkTitle);
  const ctaHref = `${APP_URL}/library/lesson/${lessonSlug}#homework`;
  const bodyHtml =
    `<p style="margin:0 0 16px 0;font-size:16px;"><b>${tutor}</b> sent you homework: <b>${title}</b>.</p>
     <p style="margin:0 0 16px 0;font-size:16px;">Complete it on the lesson page, then submit it back to your tutor.</p>`;
  const text = `${tutorName || "Your tutor"} sent you homework: ${homeworkTitle}. Complete it here: ${ctaHref}`;
  return {
    subject: "New homework from your tutor 📝",
    html: emailShell({ firstName, bodyHtml, ctaHref, ctaText: "Open the homework" }),
    text,
  };
}

// ── Senders ─────────────────────────────────────────────────────────────────
export async function sendWelcomeOnce(userId: string): Promise<void> {
  const s = svc();

  // Idempotency via the existing send ledger (campaign 'welcome', step 0).
  const { data: already } = await s
    .from("email_campaign_sends")
    .select("id")
    .eq("user_id", userId)
    .eq("campaign", "welcome")
    .eq("step", 0)
    .maybeSingle();
  if (already) return;

  const { data: u } = await s.from("users").select("email, name, role").eq("id", userId).maybeSingle();
  if (!u?.email) return;

  const { subject, html, text } = renderWelcome(
    firstNameOf(u.name, u.email),
    (u.role || "").toUpperCase() === "TUTOR"
  );
  await send(u.email, subject, html, text);
  await s.from("email_campaign_sends").insert({ user_id: userId, campaign: "welcome", step: 0 });
}

export async function notifyTutorNewStudent(tutorId: string, studentName?: string | null): Promise<void> {
  const s = svc();
  const { data: t } = await s.from("users").select("email, name").eq("id", tutorId).maybeSingle();
  if (!t?.email) return;
  const { subject, html, text } = renderNewStudent(firstNameOf(t.name, t.email), studentName);
  await send(t.email, subject, html, text);
}

export async function notifyStudentConfirmed(studentId: string, tutorName?: string | null): Promise<void> {
  const s = svc();
  const { data: st } = await s.from("users").select("email, name").eq("id", studentId).maybeSingle();
  if (!st?.email) return;
  const { subject, html, text } = renderConfirmed(firstNameOf(st.name, st.email), tutorName);
  await send(st.email, subject, html, text);
}

export async function notifyTutorClassRequest(
  tutorId: string,
  studentName?: string | null,
  message?: string | null,
  preferredTime?: string | null
): Promise<void> {
  const s = svc();
  const { data: t } = await s.from("users").select("email, name").eq("id", tutorId).maybeSingle();
  if (!t?.email) return;
  const { subject, html, text } = renderClassRequest(firstNameOf(t.name, t.email), studentName, message, preferredTime);
  await send(t.email, subject, html, text);
}

export async function notifyStudentHomeworkAssigned(
  studentId: string,
  lessonSlug: string,
  homeworkTitle: string,
  tutorName?: string | null
): Promise<void> {
  const s = svc();
  const { data: st } = await s.from("users").select("email, name").eq("id", studentId).maybeSingle();
  if (!st?.email) return;
  const { subject, html, text } = renderHomeworkAssigned(
    firstNameOf(st.name, st.email),
    lessonSlug,
    homeworkTitle,
    tutorName
  );
  await send(st.email, subject, html, text);
}
