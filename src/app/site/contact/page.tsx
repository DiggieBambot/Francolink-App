import type { Metadata } from "next";
import { Clock, Mail, MessageSquare, Users } from "lucide-react";
import { Section } from "@/components/site/ui";
import { ContactForm } from "@/components/site/contact-form";
import { getAppConfig } from "@/lib/config";

export const metadata: Metadata = {
  title: "Contact us",
  description:
    "Get in touch with the FrancoLink team — questions about lessons, tutors, billing, or teaching with us. We reply within one working day.",
  alternates: { canonical: "/contact" },
};

export default async function ContactPage() {
  const config = await getAppConfig();

  return (
    <>
      <div className="bg-primary-50 border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-primary tracking-tight">
            Get in touch
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto">
            Questions about lessons, tutors or billing — or you want to teach
            with us. Either way, we read everything.
          </p>
        </div>
      </div>

      <Section>
        <div className="grid gap-12 lg:grid-cols-5 max-w-5xl mx-auto">
          <div className="lg:col-span-3">
            <ContactForm />
          </div>

          <aside className="lg:col-span-2 space-y-6">
            <div className="p-6 rounded-2xl bg-primary-50 border border-primary-100">
              <Mail className="w-5 h-5 text-primary mb-3" />
              <h2 className="font-heading font-bold text-primary mb-1">Email</h2>
              <a
                href={`mailto:${config.support_email}`}
                className="text-sm text-gray-600 hover:text-primary underline underline-offset-4 break-all"
              >
                {config.support_email}
              </a>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-soft">
              <Clock className="w-5 h-5 text-secondary mb-3" />
              <h2 className="font-heading font-bold text-primary mb-1">
                Response time
              </h2>
              <p className="text-sm text-gray-600">
                Within one working day, Monday to Friday.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-soft">
              <Users className="w-5 h-5 text-secondary mb-3" />
              <h2 className="font-heading font-bold text-primary mb-1">
                Want to teach?
              </h2>
              <p className="text-sm text-gray-600">
                Pick &ldquo;Teaching with FrancoLink&rdquo; in the form and tell
                us what you teach and where you qualified.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-gray-100 shadow-soft">
              <MessageSquare className="w-5 h-5 text-secondary mb-3" />
              <h2 className="font-heading font-bold text-primary mb-1">
                Already a student?
              </h2>
              <p className="text-sm text-gray-600">
                Message your tutor directly in the app — it&apos;s faster than
                going through us.
              </p>
            </div>
          </aside>
        </div>
      </Section>
    </>
  );
}
