"use client";

// Dev-only preview of the class screen with sample data: a mission in
// progress, board notes, corrections, "say it again", hint chips, "Help me",
// typing and the "did you say…?" check. Nothing talks to the server.

import { notFound } from "next/navigation";
import { useRef, useState } from "react";
import { TutoringSession, type MissionCard } from "@/components/ai-tutor/tutoring-session";
import { silentBands } from "@/components/ai-tutor/leon";
import type { SupportLevel, CorrectionStyle } from "@/lib/ai/tutor-coach";

const MISSIONS: MissionCard[] = [
  { id: "cafe-order", title: "Order at a café", emoji: "☕", level: "A1", goal: "Order a drink and something to eat, and pay.", objectives: ["Greet the waiter and ask for a table or the menu", "Order a drink and a snack", "Ask for the bill and say thank you"] },
  { id: "describe-home", title: "Show someone your home", emoji: "🏠", level: "A1", goal: "Describe where you live, room by room.", objectives: ["Say what kind of home you have and where it is", "Describe two rooms with adjectives", "Say who you live with"] },
  { id: "directions", title: "Ask for directions", emoji: "🧭", level: "A1", goal: "Find your way to a place you need to get to.", objectives: ["Politely stop someone and ask where a place is", "Understand and repeat back the directions", "Ask how far it is or how long it takes"] },
];

export default function LeonClassPreview() {
  if (process.env.NODE_ENV === "production") notFound();
  return <Preview />;
}

function Preview() {
  const [scene, setScene] = useState<"offer" | "mission">("mission");
  const [studentLine, setStudentLine] = useState("Mi casa es pequeno y tengo un jardin.");
  const [unsure, setUnsure] = useState<string | null>(null);
  const [support, setSupport] = useState<SupportLevel>("balanced");
  const [style, setStyle] = useState<CorrectionStyle>("all");
  const [log, setLog] = useState<string[]>([]);
  const voiceLevel = useRef(0);
  const voiceBands = useRef(silentBands());
  const recorder = { start: async () => {}, stop: () => {}, cancel: () => {}, isRecording: false, level: 0, supported: true };

  return (
    <>
      <TutoringSession
        language="es"
        mood="idle"
        studentLine={studentLine}
        tutorLine={
          scene === "offer"
            ? "¡Hola, Njinu! Hoy tengo tres misiones para ti. ¿Cuál prefieres?"
            : "¡Muy bien! Tu casa es pequeña. ¿Puedes repetirlo? «Mi casa es pequeña»."
        }
        tutorStreaming={false}
        tutorTranslation={scene === "offer" ? "Hi Njinu! Today I have three missions for you. Which one do you prefer?" : "Very good! Your house is small. Can you say it again?"}
        board={scene === "offer" ? [] : [{ original: "Mi casa es pequeno", corrected: "Mi casa es pequeña", explanation: "The adjective agrees with 'casa' (feminine)." }]}
        isLoading={false}
        isTranscribing={false}
        isSpeaking={false}
        nowPlaying={null}
        voiceLevel={voiceLevel}
        voiceBands={voiceBands}
        recorder={recorder}
        prefetchClip={async () => null}
        playClip={() => {}}
        onInterrupt={() => {}}
        onEnd={() => setLog((l) => [...l, "end"])}
        ending={false}
        timeLabel={null}
        outOfTime={false}
        outOfTimePanel={null}
        error={null}
        level="A1"
        hints={[
          { text: "Mi casa es pequeña.", en: "My house is small." },
          { text: "Tengo un jardín con flores.", en: "I have a garden with flowers." },
        ]}
        onSend={(t) => {
          setLog((l) => [...l, `send: ${t}`]);
          setStudentLine(t);
        }}
        onHelp={() => setLog((l) => [...l, "help"])}
        onSpeak={(t) => setLog((l) => [...l, `speak: ${t}`])}
        missions={scene === "offer" ? MISSIONS : []}
        onPickMission={(m) => {
          setLog((l) => [...l, `mission: ${m.id}`]);
          setScene("mission");
        }}
        mission={scene === "mission" ? { ...MISSIONS[1], met: [0] } : null}
        notes={
          scene === "mission"
            ? [{ title: "ser vs estar", lines: ["ser → what something is: Mi casa es pequeña", "estar → where / how it is now: Estoy en el jardín"] }]
            : []
        }
        support={support}
        onSupport={setSupport}
        correctionStyle={style}
        onCorrectionStyle={setStyle}
        unsure={unsure}
        onUnsure={(send) => {
          setLog((l) => [...l, `unsure: ${send}`]);
          setUnsure(null);
        }}
      />
      {/* Test controls, above the class layer */}
      <div className="fixed left-2 bottom-2 z-[200] flex flex-col gap-1 text-xs">
        <button className="rounded bg-black/80 px-2 py-1 text-white" onClick={() => setScene(scene === "offer" ? "mission" : "offer")}>
          scene: {scene}
        </button>
        <button className="rounded bg-black/80 px-2 py-1 text-white" onClick={() => setStudentLine("Mi casa es pequeña")}>
          attempt: good
        </button>
        <button className="rounded bg-black/80 px-2 py-1 text-white" onClick={() => setStudentLine("Mi casa pequeno")}>
          attempt: partial
        </button>
        <button className="rounded bg-black/80 px-2 py-1 text-white" onClick={() => setUnsure("La casa")}>
          unsure
        </button>
        <pre data-testid="log" className="max-w-[16rem] whitespace-pre-wrap rounded bg-white/90 p-1 text-[10px]">{log.slice(-4).join("\n")}</pre>
      </div>
    </>
  );
}
