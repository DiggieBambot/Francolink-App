// The public "how to delete your account" page. Google Play requires a web
// link where users can request deletion without the app installed; this is the
// URL given in the Play Console's Data safety form. It must stay reachable
// signed-out, on the website host (listed in SITE_ROUTES in middleware.ts).
import type { Metadata } from "next";
import { Section } from "@/components/site/ui";
import { appUrl } from "@/lib/site/hosts";
import { getAppConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Delete your account",
  description:
    "How to permanently delete your FrancoLink account and personal data, from the app or by email, and what we keep for legal and accounting reasons.",
  alternates: { canonical: "/delete-account" },
};

export default async function DeleteAccountPage() {
  const config = await getAppConfig();
  const email = config.support_email;

  return (
    <>
      <div className="bg-primary-50 border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-primary tracking-tight">
            Delete your FrancoLink account
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto">
            You can permanently delete your account and personal data at any time, from the
            app or by email.
          </p>
        </div>
      </div>

      <Section>
        <div className="max-w-3xl mx-auto space-y-10 text-gray-700 leading-relaxed">
          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-3">Delete it yourself</h2>
            <ol className="list-decimal pl-6 space-y-2">
              <li>
                Sign in at{" "}
                <a href={appUrl("/settings")} className="text-primary underline underline-offset-4">
                  app.francolink.net
                </a>{" "}
                or in the FrancoLink app.
              </li>
              <li>
                Go to <strong>Settings</strong> and scroll to <strong>Danger Zone</strong>.
              </li>
              <li>
                Tap <strong>Delete Account</strong>, type <strong>DELETE</strong> and confirm.
              </li>
            </ol>
            <p className="mt-3">
              Your account is deleted immediately and you are signed out on every device. If you
              have a lesson booked that hasn&apos;t happened yet, you&apos;ll be asked to cancel
              it first so your tutor isn&apos;t left waiting.
            </p>
          </div>

          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-3">Or ask us to do it</h2>
            <p>
              Email{" "}
              <a href={`mailto:${email}?subject=Delete%20my%20account`} className="text-primary underline underline-offset-4">
                {email}
              </a>{" "}
              from the email address on your account with the subject &ldquo;Delete my
              account&rdquo;. We&apos;ll confirm and complete the deletion within 7 days. Tutor
              accounts are deleted this way, because payouts and students are attached to them.
            </p>
          </div>

          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-3">What is deleted</h2>
            <ul className="list-disc pl-6 space-y-1">
              <li>Your profile: name, email address, photo and preferences</li>
              <li>Your learning history: lesson progress, XP, streaks, vocabulary, game scores and achievements</li>
              <li>Homework, lesson reviews, notifications and AI tutor conversations</li>
              <li>Any unused lesson credits</li>
            </ul>
            <p className="mt-3">
              Any active subscription is cancelled immediately, so you won&apos;t be charged again.
            </p>
          </div>

          <div>
            <h2 className="font-heading font-bold text-2xl text-primary mb-3">What we keep</h2>
            <p>
              If you have paid for anything, we keep the record of those payments and of the lessons
              they paid for, as the law requires for accounting and tax, and because tutors&apos;
              earnings depend on them. These records have your name and email address removed and
              are no longer linked to anything that identifies you. Our payment processor, Stripe,
              keeps its own records of card payments under its own legal obligations.
            </p>
          </div>
        </div>
      </Section>
    </>
  );
}
