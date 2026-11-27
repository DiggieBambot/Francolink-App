"use client";

import { useRef, useState } from "react";
import type { Lesson } from "@/lib/lessons/types";
import { TutoringSession } from "@/components/ai-tutor/tutoring-session";
import { primeLessonCache } from "@/components/ai-tutor/class-lesson";

const recorder = {
  start: async () => {},
  stop: () => {},
  cancel: () => {},
  isRecording: false,
  level: 0,
  supported: true,
};

export function AIClassPreview({ id, lesson }: { id: string; lesson: Lesson }) {
  primeLessonCache(id, lesson);
  const [step, setStep] = useState(0);
  const [line, setLine] = useState("Bienvenue ! Regarde l'étape 1 : on apprend les mots de la cuisine. Répète après moi : une fourchette.");
  const answers = useRef<Record<string, unknown>>({});
  const voice = useRef(0);
  return (
    <TutoringSession
      language={lesson.language || "fr"}
      mood="idle"
      studentLine="Une fourchette."
      tutorLine={line}
      tutorStreaming={false}
      board={[{ original: "un fourchette", corrected: "une fourchette", explanation: "Fourchette is feminine." }]}
      isLoading={false}
      isTranscribing={false}
      isSpeaking={false}
      nowPlaying={null}
      voiceLevel={voice}
      recorder={recorder}
      prefetchClip={async () => null}
      playClip={() => {}}
      onInterrupt={() => {}}
      onEnd={() => {}}
      ending={false}
      timeLabel="12 min left"
      outOfTime={false}
      outOfTimePanel={null}
      error={null}
      lesson={{ id, title: lesson.title, sectionIndex: step, totalSections: lesson.sections.length, finished: step >= lesson.sections.length }}
      lessonAnswers={answers}
      onLessonStep={(i) => {
        setStep(i);
        setLine(`(step event → ${i + 1})`);
      }}
      onLessonCheck={() => setLine(`(check event) answers: ${JSON.stringify(answers.current)}`)}
    />
  );
}
