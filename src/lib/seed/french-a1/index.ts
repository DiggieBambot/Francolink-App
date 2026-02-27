// Course: French A1 - Beginner
// Complete course structure — ALL 8 UNITS

import { frenchA1Unit1 } from "./unit1";
import { frenchA1Unit2 } from "./unit2";
import { frenchA1Unit3 } from "./unit3";
import { frenchA1Unit4 } from "./unit4";
import { frenchA1Unit5 } from "./unit5";
import { frenchA1Unit6 } from "./unit6";
import { frenchA1Unit7 } from "./unit7";
import { frenchA1Unit8 } from "./unit8";

export const frenchA1Course = {
  course: {
    title: "French A1 - Beginner",
    slug: "fr-a1",
    description:
      "Start your French journey! Learn essential vocabulary, basic grammar, and everyday expressions for complete beginners. Master greetings, daily routines, food, navigation, making plans, describing people, work, hobbies, health, and emergencies.",
    language: "French",
    level: "A1",
    is_published: true,
    is_premium: false,
    estimated_hours: 80,
    total_lessons: 64,
    image_url: "/images/courses/french-a1.jpg",
  },
  units: [
    frenchA1Unit1,
    frenchA1Unit2,
    frenchA1Unit3,
    frenchA1Unit4,
    frenchA1Unit5,
    frenchA1Unit6,
    frenchA1Unit7,
    frenchA1Unit8,
  ],
};

export { frenchA1Unit1, frenchA1Unit2, frenchA1Unit3, frenchA1Unit4, frenchA1Unit5, frenchA1Unit6, frenchA1Unit7, frenchA1Unit8 };
