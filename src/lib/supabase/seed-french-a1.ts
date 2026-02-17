// src/lib/supabase/seed-french-a1.ts

// This file contains seed data for French A1 course
// Run via Supabase SQL Editor or a seed script

export const frenchA1Seed = {
  course: {
    id: "550e8400-e29b-41d4-a716-446655440001",
    language_id: null, // We'll get this from the languages table
    title: "French A1 - Foundations",
    slug: "french-a1",
    description: "Start your French journey! Learn essential vocabulary, basic grammar, and everyday phrases to build a solid foundation.",
    level: "A1",
    course_type: "CORE",
    image_url: "/images/courses/french-a1.jpg",
    estimated_hours: 20,
    total_lessons: 50,
    is_premium: false,
    is_published: true,
    order_index: 1
  },
  
  units: [
    {
      id: "550e8400-e29b-41d4-a716-446655440010",
      title: "First Words",
      slug: "first-words",
      description: "Learn the French alphabet, basic sounds, greetings, and your first numbers.",
      order_index: 1,
      is_premium: false
    },
    {
      id: "550e8400-e29b-41d4-a716-446655440020",
      title: "Meeting People",
      slug: "meeting-people", 
      description: "Introduce yourself, ask questions, and learn about formal vs informal French.",
      order_index: 2,
      is_premium: false
    }
  ],
  
  // Lessons and exercises defined below
};