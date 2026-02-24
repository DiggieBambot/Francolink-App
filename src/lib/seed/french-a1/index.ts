import { frenchA1Unit1 } from "./unit1";

export const frenchA1Course = {
  course: {
    title: "French A1 - Foundations",
    slug: "fr-a1",
    description:
      "Start your French journey from zero. Learn greetings, introductions, everyday vocabulary, basic grammar, and French culture.",
    level: "A1",
    estimated_hours: 20,
    total_lessons: 60,
    image_url: "/images/courses/french-a1.svg",
    is_published: true,
    is_premium: false,
  },
  units: [
    frenchA1Unit1,
  ],
};
