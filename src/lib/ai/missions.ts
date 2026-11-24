// src/lib/ai/missions.ts
//
// Role-play missions: a structured class for any language, even one with no
// prepared live-class lessons (Spanish, German…). Each mission is a real-life
// scene with a goal and three things the student must manage to do. Léon plays
// the other person in the scene, writes useful phrases on the board, and ticks
// an objective off when the student has really done it.
//
// The list is language-neutral (English); Léon plays it out in the language
// being learned. Missions are stateless on the server: the page sends the
// chosen mission and the objectives already met with every turn.

export interface Mission {
  id: string;
  /** Short title, English. */
  title: string;
  /** One emoji for the scene card. */
  emoji: string;
  /** Lowest and highest CEFR level it suits. */
  levels: [string, string];
  /** Who Léon plays and where. */
  scene: string;
  /** What the student will be able to do by the end. */
  goal: string;
  /** Three can-do steps, ticked off one by one. */
  objectives: [string, string, string];
}

export const MISSIONS: Mission[] = [
  {
    id: "cafe-order",
    title: "Order at a café",
    emoji: "☕",
    levels: ["A1", "A2"],
    scene: "Léon is the waiter at a busy little café.",
    goal: "Order a drink and something to eat, and pay.",
    objectives: ["Greet the waiter and ask for a table or the menu", "Order a drink and a snack", "Ask for the bill and say thank you"],
  },
  {
    id: "introduce-yourself",
    title: "Meet someone new",
    emoji: "👋",
    levels: ["A1", "A1"],
    scene: "Léon is a friendly neighbour you meet for the first time.",
    goal: "Introduce yourself and get to know someone.",
    objectives: ["Say your name and where you are from", "Say what you do or study", "Ask the other person two questions about themselves"],
  },
  {
    id: "describe-home",
    title: "Show someone your home",
    emoji: "🏠",
    levels: ["A1", "A2"],
    scene: "Léon is a friend visiting your home for the first time.",
    goal: "Describe where you live, room by room.",
    objectives: ["Say what kind of home you have and where it is", "Describe two rooms with adjectives", "Say who you live with"],
  },
  {
    id: "directions",
    title: "Ask for directions",
    emoji: "🧭",
    levels: ["A1", "A2"],
    scene: "Léon is a local person on a street corner in a city you are visiting.",
    goal: "Find your way to a place you need to get to.",
    objectives: ["Politely stop someone and ask where a place is", "Understand and repeat back the directions", "Ask how far it is or how long it takes"],
  },
  {
    id: "market",
    title: "Shop at the market",
    emoji: "🍎",
    levels: ["A1", "A2"],
    scene: "Léon runs a fruit and vegetable stall at an outdoor market.",
    goal: "Buy what you need, in the right amounts.",
    objectives: ["Ask for two items with quantities", "Ask the price", "Pay and say goodbye"],
  },
  {
    id: "hotel-checkin",
    title: "Check into a hotel",
    emoji: "🏨",
    levels: ["A2", "B1"],
    scene: "Léon is the receptionist at a hotel.",
    goal: "Check in and sort out what you need for your stay.",
    objectives: ["Say you have a booking and give your name and dates", "Ask about breakfast or the Wi-Fi", "Report a small problem with the room"],
  },
  {
    id: "weekend-plans",
    title: "Make weekend plans",
    emoji: "📅",
    levels: ["A2", "B1"],
    scene: "Léon is a friend calling to make plans for the weekend.",
    goal: "Agree on a plan: what, where and when.",
    objectives: ["Suggest an activity", "Agree on a day and a time", "Talk about what you did last weekend"],
  },
  {
    id: "doctor",
    title: "See the doctor",
    emoji: "🩺",
    levels: ["A2", "B1"],
    scene: "Léon is a doctor at a walk-in clinic.",
    goal: "Explain how you feel and understand the advice.",
    objectives: ["Say what hurts and since when", "Answer two questions about your symptoms", "Repeat back what the doctor tells you to do"],
  },
  {
    id: "restaurant-complaint",
    title: "Sort out a problem at a restaurant",
    emoji: "🍽️",
    levels: ["B1", "B2"],
    scene: "Léon is a restaurant manager; your order arrived wrong.",
    goal: "Complain politely and get it fixed.",
    objectives: ["Explain the problem politely", "Say what you would like instead", "Accept or negotiate the solution"],
  },
  {
    id: "job-interview",
    title: "Job interview",
    emoji: "💼",
    levels: ["B1", "C1"],
    scene: "Léon is interviewing you for a job you want.",
    goal: "Present yourself well in an interview.",
    objectives: ["Describe your experience", "Give an example of a challenge you solved", "Ask the interviewer a good question"],
  },
  {
    id: "debate",
    title: "Friendly debate",
    emoji: "🗣️",
    levels: ["B2", "C2"],
    scene: "Léon is a colleague with the opposite opinion on a topic you choose.",
    goal: "Defend an opinion and react to the other side.",
    objectives: ["State your opinion with two reasons", "Disagree politely with one of Léon's points", "Find something you agree on and conclude"],
  },
  {
    id: "phone-booking",
    title: "Book something by phone",
    emoji: "📞",
    levels: ["A2", "B2"],
    scene: "Léon answers the phone at a restaurant, hairdresser or garage — you choose.",
    goal: "Make a booking over the phone.",
    objectives: ["Say what you want to book", "Agree on a day and time", "Spell your name and confirm the details"],
  },
];

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

function levelIndex(level: string): number {
  const i = LEVELS.indexOf(level.toUpperCase().slice(0, 2));
  return i < 0 ? 0 : i;
}

export function findMission(id: unknown): Mission | null {
  return typeof id === "string" ? MISSIONS.find((m) => m.id === id) ?? null : null;
}

/** Missions that suit a level, varied from class to class. */
export function missionsForLevel(level: string, count = 3, seed = Date.now()): Mission[] {
  const li = levelIndex(level);
  const fit = MISSIONS.filter((m) => levelIndex(m.levels[0]) <= li && li <= levelIndex(m.levels[1]));
  const pool = fit.length >= count ? fit : MISSIONS.filter((m) => levelIndex(m.levels[0]) <= li + 1);
  // Rotate by day so the offer changes but stays stable within a day.
  const start = Math.floor(seed / 86_400_000) % Math.max(1, pool.length);
  return [...pool.slice(start), ...pool.slice(0, start)].slice(0, count);
}

/** The client-facing shape of a mission (no prompt-only fields). */
export function missionCard(m: Mission) {
  return { id: m.id, title: m.title, emoji: m.emoji, goal: m.goal, objectives: m.objectives, level: m.levels[0] };
}

/** System-prompt block for a mission in progress. */
export function missionBlock(m: Mission, met: number[], targetLang: string, startsNow: boolean): string {
  const lines = m.objectives.map((o, i) => `${i + 1}. ${o} — ${met.includes(i) ? "DONE" : "not yet"}`);
  const next = m.objectives.findIndex((_, i) => !met.includes(i));
  return [
    `Today's class is a role-play mission: "${m.title}". ${m.scene} Play that person, in ${targetLang}, staying in character but helping like a teacher when the student is stuck.`,
    `Goal: ${m.goal}`,
    `Objectives:\n${lines.join("\n")}`,
    next >= 0
      ? `Steer the scene so the student can do objective ${next + 1} next. When the student has clearly done an objective themselves (in ${targetLang}, even with small mistakes), list its number in "objectivesMet".`
      : `All objectives are done: congratulate them warmly in one sentence, end the scene, and suggest one thing to practise next.`,
    startsNow
      ? `The student has just chosen this mission. In one or two short sentences set the scene and say what they need to do, then speak your first line in character.`
      : "",
  ]
    .filter(Boolean)
    .join("\n");
}
