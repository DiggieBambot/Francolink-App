import {
  BookOpen,
  Newspaper,
  MessageCircle,
  MessageSquareDashed,
  MessageSquare,
  MessagesSquare,
  Shuffle,
  ListOrdered,
  ImageIcon,
  PenLine,
  Users,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import type { LessonView } from "@/lib/lessons/types";
import type { LevelTheme } from "@/lib/lessons/level-theme";

interface SectionHeaderProps {
  view: LessonView;
  number: number;
  kind: string;
  title?: string;
  student_instruction?: string;
  theme?: LevelTheme;
}

const KIND_ICONS: Record<string, LucideIcon> = {
  warmup_vocabulary: BookOpen,
  vocabulary_with_examples: BookOpen,
  fill_in_blank_dialogue: MessageSquareDashed,
  fill_in_blank_dialogue_extended: MessageSquareDashed,
  dialogue_read_aloud: MessageCircle,
  reading_comprehension: Newspaper,
  matching_qa: Shuffle,
  word_order: ListOrdered,
  image_question_prompts: ImageIcon,
  free_response: MessageSquare,
  discussion: MessagesSquare,
  writing: PenLine,
  debate: MessagesSquare,
  conversation: MessageCircle,
  role_play: Users,
};

const KIND_LABELS: Record<string, string> = {
  warmup_vocabulary: "Warm-up",
  vocabulary_with_examples: "Vocabulary",
  fill_in_blank_dialogue: "Fill the blanks",
  fill_in_blank_dialogue_extended: "Fill the blanks",
  dialogue_read_aloud: "Read aloud",
  reading_comprehension: "Reading",
  matching_qa: "Q&A drill",
  word_order: "Word order",
  image_question_prompts: "Picture prompts",
  free_response: "Speak freely",
  discussion: "Discussion",
  writing: "Writing",
  debate: "Debate",
  conversation: "Conversation",
  role_play: "Role play",
};

export function SectionHeader({
  view,
  number,
  kind,
  title,
  student_instruction,
  theme,
}: SectionHeaderProps) {
  const badgeBg = theme?.accentBg ?? "bg-blue-600";
  const softText = theme?.softText ?? "text-slate-600";
  const Icon = KIND_ICONS[kind] ?? Sparkles;
  const niceKind = KIND_LABELS[kind] ?? kind.replace(/_/g, " ");

  return (
    <header className="mb-4">
      <div className="mb-2 flex items-center gap-2">
        <span
          className={`inline-flex h-8 min-w-[2.5rem] items-center justify-center rounded-md px-2 text-sm font-semibold text-white shadow-sm ${badgeBg}`}
        >
          {number}
        </span>
        <Icon className={`h-4 w-4 ${softText}`} />
        <span className={`text-[11px] font-semibold uppercase tracking-wide ${softText}`}>
          {niceKind}
        </span>
        {view === "tutor" ? (
          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-wide text-slate-500">
            {kind}
          </span>
        ) : null}
      </div>
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {student_instruction ? (
        <p className="mt-1 text-sm text-slate-600">{student_instruction}</p>
      ) : null}
    </header>
  );
}
