// This page also exists on the marketing site, which is its canonical home.
// Both hosts used to serve it and both sitemaps used to list it, leaving Google
// to pick an owner. The cross-host canonical below settles it: the app keeps
// serving the page, francolink.net gets the ranking signal.
//
// Every processor and data category below is taken from what the code does
// (src/lib/stripe, src/lib/ai, src/app/api/tts, src/lib/video/daily.ts, Resend,
// web-push, Google Analytics in src/app/layout.tsx, the signup attribution and
// risk columns on users). When a new service starts receiving user data, add it
// here and bump LAST_UPDATED — Google Play checks this page against the app's
// Data safety form.

import type { Metadata } from "next";
import Link from "next/link";
import { siteUrl } from "@/lib/site/hosts";
import { getAppConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Privacy Policy | FrancoLink",
  description: "How FrancoLink collects, uses and protects your personal information, and how to delete your account.",
  alternates: { canonical: siteUrl("/privacy") },
};

const LAST_UPDATED = "30 September 2026";

const h2 = "text-2xl font-semibold mt-8 mb-3";
const h3 = "text-lg font-semibold mt-5 mb-2";

export default async function PrivacyPage() {
  const { company_name: company, support_email: email } = await getAppConfig();

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <div className="prose max-w-none text-gray-700 leading-relaxed space-y-3">
        <p>Last updated: {LAST_UPDATED}</p>

        <p>
          This policy explains what personal information {company} (&ldquo;FrancoLink&rdquo;,
          &ldquo;we&rdquo;) collects when you use our website, web app and mobile app, why we
          collect it, who we share it with, and the choices you have — including how to delete
          your account.
        </p>

        <h2 className={h2}>1. Information we collect</h2>

        <h3 className={h3}>Information you give us</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Account details:</strong> your name, email address and password (stored only in encrypted, hashed form). If you sign in with Google, we receive your name, email address and profile picture from Google.</li>
          <li><strong>Profile and preferences:</strong> profile photo, native language, the languages you are learning, learning goals, daily goal, time zone and notification preferences.</li>
          <li><strong>Placement and learning activity:</strong> placement test results, lessons started and completed, exercise answers, XP, streaks, vocabulary, game scores and achievements.</li>
          <li><strong>AI tutor conversations:</strong> the messages you send to the AI tutor and its replies, and the corrections it makes.</li>
          <li><strong>Lessons with tutors:</strong> bookings, lesson notes and messages, homework you submit, and reviews you write.</li>
          <li><strong>Payments:</strong> which plan or lessons you bought and when. Card details are entered directly with our payment processor, Stripe; we never see or store your full card number.</li>
          <li><strong>Support:</strong> messages you send us through the contact form, support chat or email.</li>
        </ul>

        <h3 className={h3}>Information collected automatically</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Usage and device information:</strong> pages visited, features used, when you were last active, browser and device type, and IP address (in our hosting provider&apos;s logs).</li>
          <li><strong>How you found us:</strong> the page you arrived on, the referring website and campaign tags (such as utm_source) in the link you followed.</li>
          <li><strong>Sign-up protection:</strong> when you register we score the sign-up for signs of automated or fake accounts, to keep spam off the platform.</li>
          <li><strong>Cookies and similar technologies:</strong> cookies that keep you signed in, and Google Analytics cookies that help us understand how the site is used.</li>
        </ul>

        <h3 className={h3}>Voice</h3>
        <p>
          Speaking exercises use your device&apos;s built-in speech recognition (for example, the
          one provided by your browser). Your voice is processed by that service to produce text;
          we receive only the resulting text to check your answer and do not record or store your
          voice.
        </p>

        <h2 className={h2}>2. How we use your information</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>To create and run your account and provide lessons, exercises, audio, games and progress tracking.</li>
          <li>To provide the AI tutor, when it is available on your plan.</li>
          <li>To arrange live lessons with tutors, including scheduling, video calls, homework and reviews.</li>
          <li>To process payments and manage subscriptions.</li>
          <li>To send you service emails (such as receipts, lesson reminders and account notices) and, if you have not opted out, occasional emails about your learning and new features.</li>
          <li>To send push notifications you have allowed.</li>
          <li>To understand how FrancoLink is used, fix problems and improve lessons.</li>
          <li>To prevent fraud, spam and abuse, and to meet our legal obligations.</li>
        </ul>

        <h2 className={h2}>3. Who we share it with</h2>
        <p>
          We do not sell your personal information and we do not show third-party advertising. We
          share information only with service providers that help us run FrancoLink, only for that
          purpose:
        </p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Supabase</strong> — database, sign-in and file storage.</li>
          <li><strong>Vercel</strong> — website and app hosting.</li>
          <li><strong>Stripe</strong> — payment processing and subscriptions.</li>
          <li><strong>OpenAI</strong> — the AI tutor, and generating the audio for lesson content. AI tutor messages are sent to OpenAI to produce replies.</li>
          <li><strong>Daily.co</strong> — video for live lessons with tutors.</li>
          <li><strong>Resend</strong> — sending emails.</li>
          <li><strong>Google</strong> — Google sign-in (if you choose it) and Google Analytics.</li>
          <li><strong>Your browser or device vendor</strong> — push notification delivery and speech recognition.</li>
        </ul>
        <p>
          When you book a lesson, your tutor sees your name, your profile photo, your level and the
          information needed to teach the lesson. We may also disclose information if required by
          law, or to protect the rights and safety of our users and FrancoLink.
        </p>
        <p>
          These providers may process data in countries other than your own, including the United
          States. We rely on their contractual and security commitments to protect it.
        </p>

        <h2 className={h2}>4. How long we keep it</h2>
        <p>
          We keep your information for as long as your account is open. When you delete your
          account, we delete your profile and learning data straight away. Records of payments and
          of lessons that were paid for are kept as long as the law requires for accounting and
          tax, with your name and email address removed. Data may remain in encrypted backups for a
          limited period before those backups are overwritten.
        </p>

        <h2 className={h2}>5. Deleting your account</h2>
        <p>
          You can permanently delete your account at any time in <strong>Settings → Danger
          Zone → Delete Account</strong>, in the app or on the web, or by emailing us. See{" "}
          <Link href={siteUrl("/delete-account")} className="text-primary underline underline-offset-4">
            how to delete your account
          </Link>{" "}
          for exactly what is deleted and what is kept.
        </p>

        <h2 className={h2}>6. Your choices and rights</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Access and correction:</strong> you can see and edit most of your information in Settings, or ask us for a copy of the data we hold about you.</li>
          <li><strong>Deletion:</strong> see section 5.</li>
          <li><strong>Marketing emails:</strong> use the unsubscribe link in any marketing email. Service emails about your account will still be sent.</li>
          <li><strong>Push notifications:</strong> turn them off in your browser or device settings.</li>
          <li><strong>Cookies:</strong> you can block or delete cookies in your browser; you may need to sign in again.</li>
        </ul>
        <p>
          Depending on where you live, you may have further rights under local law, such as
          objecting to or restricting some processing. To exercise any of these rights, contact us
          at the address below.
        </p>

        <h2 className={h2}>7. Children</h2>
        <p>
          FrancoLink is not directed at children under 13, and we do not knowingly collect personal
          information from them. If you believe a child under 13 has given us personal information,
          contact us and we will delete it.
        </p>

        <h2 className={h2}>8. Security</h2>
        <p>
          Data is encrypted in transit (HTTPS), passwords are hashed, and access to personal data
          is limited to the people and services that need it to run FrancoLink. No system is
          perfectly secure, but we work to protect your information and will notify you if a breach
          affects you as the law requires.
        </p>

        <h2 className={h2}>9. Changes to this policy</h2>
        <p>
          We will update this page when our practices change and change the date at the top. If a
          change is significant, we will tell you by email or in the app.
        </p>

        <h2 className={h2}>10. Contact us</h2>
        <p>
          Questions about this policy or your data:{" "}
          <a href={`mailto:${email}`} className="text-primary underline underline-offset-4">
            {email}
          </a>
          .
        </p>
      </div>
    </div>
  );
}
