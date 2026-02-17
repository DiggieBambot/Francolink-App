export type SubscriptionTier = "FREE" | "PREMIUM";
export type UserRole = "USER" | "ADMIN";
export type CEFRLevel = "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
export type CourseType = "CORE" | "SPECIALIZED";
export type LessonType =
  | "VOCABULARY"
  | "GRAMMAR"
  | "READING"
  | "LISTENING"
  | "SPEAKING"
  | "CONVERSATION"
  | "CULTURE"
  | "REVIEW";
export type ExerciseType =
  | "MULTIPLE_CHOICE"
  | "FILL_BLANK"
  | "MATCHING"
  | "TRANSLATION"
  | "REORDER";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type ProgressStatus = "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  nativeLanguage: string;
  dailyGoalMinutes: number;
  totalXp: number;
  currentStreak: number;
  longestStreak: number;
  subscriptionTier: SubscriptionTier;
  role: UserRole;
  createdAt: Date;
}

export interface Language {
  id: string;
  code: string;
  name: string;
  nativeName: string;
  flagEmoji: string;
  isActive: boolean;
}

export interface Course {
  id: string;
  languageId: string;
  language?: Language;
  title: string;
  slug: string;
  description: string;
  level: CEFRLevel;
  type: CourseType;
  imageUrl?: string;
  estimatedHours: number;
  totalLessons: number;
  isPremium: boolean;
  isPublished: boolean;
}

export interface Unit {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  orderIndex: number;
  lessons?: Lesson[];
}

export interface Lesson {
  id: string;
  unitId: string;
  title: string;
  slug: string;
  type: LessonType;
  estimatedMinutes: number;
  xpReward: number;
  orderIndex: number;
  isPremium: boolean;
}

export interface Exercise {
  id: string;
  lessonId: string;
  type: ExerciseType;
  difficulty: Difficulty;
  question: string;
  content: Record<string, unknown>;
  explanation?: string;
  hint?: string;
  xpReward: number;
}

export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  course?: Course;
  currentUnitIndex: number;
  currentLessonIndex: number;
  startedAt: Date;
  completedAt?: Date;
}

export interface LessonProgress {
  id: string;
  userId: string;
  lessonId: string;
  status: ProgressStatus;
  score?: number;
  xpEarned: number;
  completedAt?: Date;
}

export interface DashboardStats {
  totalXp: number;
  currentStreak: number;
  lessonsCompleted: number;
  wordsLearned: number;
  minutesLearned: number;
}