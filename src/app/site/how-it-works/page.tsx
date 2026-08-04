import type { Metadata } from "next";
import {
  Blocks,
  ClipboardCheck,
  Gamepad2,
  MessagesSquare,
  PencilRuler,
  Presentation,
  Search,
  TrendingUp,
} from "lucide-react";
import { Section, SectionHeading, CtaButton } from "@/components/site/ui";
import { appUrl } from "@/lib/site/hosts";

export const metadata: Metadata = {
  title: "How it works",
  description:
    "How learning with FrancoLink works: take a placement test, choose a vetted tutor, meet in a live lesson room with a shared whiteboard, then practise daily in the app with homework, lessons and games.",
  alternates: { canonical: "/how-it-works" },
};

const JOURNEY = [
  {
    Icon: ClipboardCheck,
    title: "Take the 90-second placement test",
    body: "Before anything else, we find out where you actually are. The test sets your CEFR level so your first lesson starts at the right place — not at 'bonjour' if you're already B1.",
  },
  {
    Icon: Search,
    title: "Choose a tutor",
    body: "Open the directory, filter by language and level, read profiles and check weekly availability. Every listed tutor has cleared our selection process.",
  },
  {
    Icon: Presentation,
    title: "Meet in your live lesson room",
    body: "Not a generic video call — a private room with a shared whiteboard, live exercises, chat and saved highlights. Only you and your tutor can enter it.",
  },
  {
    Icon: PencilRuler,
    title: "Get homework that's actually marked",
    body: "Your tutor assigns work from the same curriculum you're learning. You submit it in the app, they review it and reply with corrections.",
  },
  {
    Icon: Gamepad2,
    title: "Practise between lessons",
    body: "Guided lessons, vocabulary games and an AI conversation partner keep the language moving on the days you don't have a tutor.",
  },
  {
    Icon: TrendingUp,
    title: "Watch the level move",
    body: "Streaks, coverage reports and progress tracking show exactly which grammar and vocabulary you've covered — and what's next.",
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <div className="bg-primary-50 border-b border-primary-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <h1 className="font-heading font-extrabold text-4xl sm:text-5xl text-primary tracking-tight">
            How FrancoLink works
          </h1>
          <p className="mt-5 text-lg text-gray-600 max-w-2xl mx-auto">
            A live tutor teaches you. The app keeps you practising in between.
            Here&apos;s what that looks like week to week.
          </p>
        </div>
      </div>

      <Section>
        <ol className="max-w-3xl mx-auto space-y-10">
          {JOURNEY.map(({ Icon, title, body }, i) => (
            <li key={title} className="flex gap-6">
              <div className="flex flex-col items-center shrink-0">
                <span className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center font-heading font-extrabold">
                  {i + 1}
                </span>
                {i < JOURNEY.length - 1 && (
                  <span className="flex-1 w-px bg-primary-100 mt-3" />
                )}
              </div>
              <div className="pb-2">
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="w-5 h-5 text-secondary" />
                  <h2 className="font-heading font-bold text-xl text-primary">
                    {title}
                  </h2>
                </div>
                <p className="text-gray-600 leading-relaxed">{body}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Section tone="tint">
        <SectionHeading
          eyebrow="Inside the app"
          title="Everything lives in one place"
          subtitle="FrancoLink is app-first. Your lessons, homework, tutor messages and practice are all in the same place, on phone, tablet or desktop."
        />
        <div className="grid gap-6 sm:grid-cols-3">
          {[
            [Blocks, "A real curriculum", "CEFR A1–C2 grammar, vocabulary and pronunciation, sequenced as a syllabus."],
            [MessagesSquare, "Tutor in your pocket", "Messages, homework and lesson invites arrive as notifications."],
            [Gamepad2, "Practice that isn't boring", "Vocabulary games, flashcards and an AI partner to talk to."],
          ].map(([Icon, title, body]) => {
            const I = Icon as typeof Blocks;
            return (
              <div
                key={title as string}
                className="p-7 rounded-2xl bg-white border border-gray-100 shadow-soft"
              >
                <I className="w-6 h-6 text-primary mb-4" />
                <h3 className="font-heading font-bold text-lg text-primary mb-2">
                  {title as string}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {body as string}
                </p>
              </div>
            );
          })}
        </div>
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center">
          <CtaButton href={appUrl("/signup")} external>
            Start with the placement test
          </CtaButton>
          <CtaButton href="/tutors" variant="ghost">
            Browse tutors
          </CtaButton>
        </div>
      </Section>
    </>
  );
}
