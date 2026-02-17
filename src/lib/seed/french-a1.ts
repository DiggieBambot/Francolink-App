// src/lib/seed/french-a1.ts

export const frenchA1Course = {
  course: {
    title: "French A1 - Foundations",
    slug: "french-a1",
    description: "Start your French journey! Learn essential vocabulary, basic grammar, and everyday expressions to begin communicating in French.",
    level: "A1" as const,
    course_type: "CORE" as const,
    image_url: "/images/courses/french-a1.jpg",
    estimated_hours: 25,
    total_lessons: 50,
    is_premium: false,
    is_published: true,
    order_index: 1,
  },

  units: [
    {
      title: "First Words",
      // REMOVED: slug - your units table doesn't have this column
      description: "Learn the French alphabet, basic sounds, and your first French words.",
      order_index: 1,
      is_premium: false,
      lessons: [
        {
          title: "The French Alphabet",
          slug: "french-alphabet",
          description: "Learn the 26 letters of the French alphabet and their sounds.",
          lesson_type: "VOCABULARY" as const,
          estimated_minutes: 10,
          xp_reward: 15,
          order_index: 1,
          is_premium: false,
          content: {
            introduction: "The French alphabet has the same 26 letters as English, but the pronunciation is different. Let's learn how each letter sounds!",
            key_points: [
              "French vowels (A, E, I, O, U) have pure sounds",
              "Some letters like H are silent",
              "R has a unique throaty sound"
            ]
          },
          exercises: [
            {
              exercise_type: "MULTIPLE_CHOICE" as const,
              difficulty: "EASY" as const,
              question: "How do you pronounce the letter 'E' in French?",
              content: {
                options: ["like 'ay' in 'say'", "like 'uh' in 'the'", "like 'ee' in 'see'", "like 'eh' in 'bed'"],
                correct_index: 1
              },
              explanation: "The French 'E' without an accent sounds like 'uh', similar to the 'e' in 'the'.",
              hint: "Think of a very short, neutral sound.",
              xp_reward: 5,
              order_index: 1,
              is_active: true
            },
            {
              exercise_type: "MULTIPLE_CHOICE" as const,
              difficulty: "EASY" as const,
              question: "Which letter is typically silent in French?",
              content: {
                options: ["R", "S", "H", "L"],
                correct_index: 2
              },
              explanation: "The letter H is almost always silent in French. For example, 'hôtel' is pronounced 'oh-tel'.",
              hint: "This letter is also sometimes silent at the start of English words.",
              xp_reward: 5,
              order_index: 2,
              is_active: true
            },
            {
              exercise_type: "MATCHING" as const,
              difficulty: "EASY" as const,
              question: "Match the French letters to their approximate sounds:",
              content: {
                pairs: [
                  { left: "A", right: "ah" },
                  { left: "E", right: "uh" },
                  { left: "I", right: "ee" },
                  { left: "O", right: "oh" },
                  { left: "U", right: "oo (with rounded lips)" }
                ]
              },
              explanation: "French vowels have consistent, pure sounds unlike English vowels which can vary.",
              hint: null,
              xp_reward: 10,
              order_index: 3,
              is_active: true
            }
          ]
        },
        {
          title: "Basic Pronunciation",
          slug: "basic-pronunciation",
          description: "Master the key French sounds that don't exist in English.",
          lesson_type: "VOCABULARY" as const,
          estimated_minutes: 12,
          xp_reward: 15,
          order_index: 2,
          is_premium: false,
          content: {
            introduction: "French has some unique sounds. Don't worry about perfection - focus on being understood!",
            key_points: [
              "The French 'R' comes from the throat",
              "Nasal vowels (an, en, on, un) are pronounced through the nose",
              "Final consonants are usually silent"
            ]
          },
          exercises: [
            {
              exercise_type: "MULTIPLE_CHOICE" as const,
              difficulty: "EASY" as const,
              question: "In the word 'croissant', which letters are silent?",
              content: {
                options: ["The 'c' and 'r'", "The final 'nt'", "The 'oi'", "Nothing is silent"],
                correct_index: 1
              },
              explanation: "In French, final consonants are typically silent. 'Croissant' is pronounced 'kwah-SAHN'.",
              hint: "Think about which letters you don't hear when a French person says this word.",
              xp_reward: 5,
              order_index: 1,
              is_active: true
            },
            {
              exercise_type: "MULTIPLE_CHOICE" as const,
              difficulty: "MEDIUM" as const,
              question: "What makes the French 'R' unique?",
              content: {
                options: [
                  "It's rolled like in Spanish",
                  "It's produced in the throat",
                  "It sounds like the English R",
                  "It's always silent"
                ],
                correct_index: 1
              },
              explanation: "The French R is a uvular sound, produced in the back of the throat. It sounds a bit like gargling!",
              hint: null,
              xp_reward: 5,
              order_index: 2,
              is_active: true
            },
            {
              exercise_type: "FILL_BLANK" as const,
              difficulty: "EASY" as const,
              question: "Complete: In French, final consonants are usually ___.",
              content: {
                sentence: "In French, final consonants are usually ___.",
                blanks: [
                  {
                    position: 0,
                    correct_answer: "silent",
                    acceptable_answers: ["silent", "Silent", "not pronounced"]
                  }
                ]
              },
              explanation: "This is one of the most important French pronunciation rules!",
              hint: null,
              xp_reward: 5,
              order_index: 3,
              is_active: true
            }
          ]
        },
        {
          title: "Greetings",
          slug: "greetings",
          description: "Learn to say hello, goodbye, and other essential greetings.",
          lesson_type: "VOCABULARY" as const,
          estimated_minutes: 10,
          xp_reward: 15,
          order_index: 3,
          is_premium: false,
          content: {
            introduction: "Greetings are your first step to speaking French! These phrases will help you start any conversation.",
            key_points: [
              "Bonjour (hello) is used until evening",
              "Bonsoir (good evening) is used after 6pm",
              "Au revoir (goodbye) is formal, Salut (bye) is casual"
            ]
          },
          vocabulary: [
            { french: "Bonjour", english: "Hello / Good morning", pronunciation: "bohn-ZHOOR" },
            { french: "Bonsoir", english: "Good evening", pronunciation: "bohn-SWAHR" },
            { french: "Salut", english: "Hi / Bye (informal)", pronunciation: "sah-LOO" },
            { french: "Au revoir", english: "Goodbye", pronunciation: "oh ruh-VWAHR" },
            { french: "Bonne nuit", english: "Good night", pronunciation: "bun NWEE" },
            { french: "À bientôt", english: "See you soon", pronunciation: "ah byaN-TOH" }
          ],
          exercises: [
            {
              exercise_type: "TRANSLATION" as const,
              difficulty: "EASY" as const,
              question: "Translate to French: Hello",
              content: {
                source_language: "en",
                target_language: "fr",
                correct_answers: ["Bonjour", "bonjour", "Salut", "salut"]
              },
              explanation: "'Bonjour' is the standard greeting. 'Salut' is more casual, like 'Hi'.",
              hint: null,
              xp_reward: 5,
              order_index: 1,
              is_active: true
            },
            {
              exercise_type: "MULTIPLE_CHOICE" as const,
              difficulty: "EASY" as const,
              question: "What greeting would you use at 8 PM?",
              content: {
                options: ["Bonjour", "Bonsoir", "Bonne nuit", "Salut"],
                correct_index: 1
              },
              explanation: "'Bonsoir' (good evening) is used from around 6 PM onwards.",
              hint: "Think about what time of day it is.",
              xp_reward: 5,
              order_index: 2,
              is_active: true
            },
            {
              exercise_type: "MATCHING" as const,
              difficulty: "EASY" as const,
              question: "Match the French greetings to their English meanings:",
              content: {
                pairs: [
                  { left: "Bonjour", right: "Hello" },
                  { left: "Au revoir", right: "Goodbye" },
                  { left: "Bonne nuit", right: "Good night" },
                  { left: "À bientôt", right: "See you soon" }
                ]
              },
              explanation: "These are the essential greetings you'll use every day!",
              hint: null,
              xp_reward: 10,
              order_index: 3,
              is_active: true
            },
            {
              exercise_type: "TRANSLATION" as const,
              difficulty: "EASY" as const,
              question: "Translate to English: Au revoir",
              content: {
                source_language: "fr",
                target_language: "en",
                correct_answers: ["Goodbye", "goodbye", "Bye", "bye"]
              },
              explanation: "'Au revoir' literally means 'until we see again'.",
              hint: null,
              xp_reward: 5,
              order_index: 4,
              is_active: true
            }
          ]
        },
        {
          title: "Numbers 1-10",
          slug: "numbers-1-10",
          description: "Count from one to ten in French.",
          lesson_type: "VOCABULARY" as const,
          estimated_minutes: 10,
          xp_reward: 15,
          order_index: 4,
          is_premium: false,
          content: {
            introduction: "Numbers are essential for everyday life - shopping, telling time, and more!",
            key_points: [
              "French numbers 1-10 are unique words to memorize",
              "Pay attention to pronunciation, especially 'six' and 'dix'",
              "These form the foundation for all French numbers"
            ]
          },
          vocabulary: [
            { french: "un", english: "one", pronunciation: "uhn" },
            { french: "deux", english: "two", pronunciation: "duh" },
            { french: "trois", english: "three", pronunciation: "twah" },
            { french: "quatre", english: "four", pronunciation: "katr" },
            { french: "cinq", english: "five", pronunciation: "sank" },
            { french: "six", english: "six", pronunciation: "sees" },
            { french: "sept", english: "seven", pronunciation: "set" },
            { french: "huit", english: "eight", pronunciation: "weet" },
            { french: "neuf", english: "nine", pronunciation: "nuhf" },
            { french: "dix", english: "ten", pronunciation: "dees" }
          ],
          exercises: [
            {
              exercise_type: "TRANSLATION" as const,
              difficulty: "EASY" as const,
              question: "Translate to French: three",
              content: {
                source_language: "en",
                target_language: "fr",
                correct_answers: ["trois", "Trois"]
              },
              explanation: "'Trois' is pronounced 'twah' - the 's' is silent!",
              hint: null,
              xp_reward: 5,
              order_index: 1,
              is_active: true
            },
            {
              exercise_type: "MULTIPLE_CHOICE" as const,
              difficulty: "EASY" as const,
              question: "What is 'sept' in English?",
              content: {
                options: ["six", "seven", "eight", "nine"],
                correct_index: 1
              },
              explanation: "'Sept' means seven. The 'p' is silent!",
              hint: null,
              xp_reward: 5,
              order_index: 2,
              is_active: true
            },
            {
              exercise_type: "MATCHING" as const,
              difficulty: "EASY" as const,
              question: "Match the French numbers to their English equivalents:",
              content: {
                pairs: [
                  { left: "un", right: "one" },
                  { left: "cinq", right: "five" },
                  { left: "huit", right: "eight" },
                  { left: "dix", right: "ten" }
                ]
              },
              explanation: "Practice these until they become automatic!",
              hint: null,
              xp_reward: 10,
              order_index: 3,
              is_active: true
            },
            {
              exercise_type: "FILL_BLANK" as const,
              difficulty: "MEDIUM" as const,
              question: "Complete the sequence: un, deux, ___, quatre, cinq",
              content: {
                sentence: "un, deux, ___, quatre, cinq",
                blanks: [
                  {
                    position: 0,
                    correct_answer: "trois",
                    acceptable_answers: ["trois", "Trois"]
                  }
                ]
              },
              explanation: "The sequence is: un (1), deux (2), trois (3), quatre (4), cinq (5)",
              hint: null,
              xp_reward: 5,
              order_index: 4,
              is_active: true
            }
          ]
        },
        {
          title: "Unit 1 Review",
          slug: "unit-1-review",
          description: "Practice everything you learned in Unit 1!",
          lesson_type: "REVIEW" as const,
          estimated_minutes: 15,
          xp_reward: 25,
          order_index: 5,
          is_premium: false,
          content: {
            introduction: "Let's review everything from Unit 1: the alphabet, pronunciation, greetings, and numbers 1-10!",
            key_points: [
              "Review the French vowel sounds",
              "Practice your greetings",
              "Make sure you know numbers 1-10"
            ]
          },
          exercises: [
            {
              exercise_type: "MULTIPLE_CHOICE" as const,
              difficulty: "EASY" as const,
              question: "Which greeting is appropriate for the morning?",
              content: {
                options: ["Bonsoir", "Bonne nuit", "Bonjour", "Au revoir"],
                correct_index: 2
              },
              explanation: "'Bonjour' is used from morning until evening.",
              hint: null,
              xp_reward: 5,
              order_index: 1,
              is_active: true
            },
            {
              exercise_type: "TRANSLATION" as const,
              difficulty: "EASY" as const,
              question: "Translate to French: seven",
              content: {
                source_language: "en",
                target_language: "fr",
                correct_answers: ["sept", "Sept"]
              },
              explanation: "'Sept' - remember the 'p' is silent!",
              hint: null,
              xp_reward: 5,
              order_index: 2,
              is_active: true
            },
            {
              exercise_type: "FILL_BLANK" as const,
              difficulty: "MEDIUM" as const,
              question: "Complete: Final consonants in French are usually ___.",
              content: {
                sentence: "Final consonants in French are usually ___.",
                blanks: [
                  {
                    position: 0,
                    correct_answer: "silent",
                    acceptable_answers: ["silent", "Silent", "not pronounced"]
                  }
                ]
              },
              explanation: "This is a key rule in French pronunciation!",
              hint: null,
              xp_reward: 5,
              order_index: 3,
              is_active: true
            },
            {
              exercise_type: "MATCHING" as const,
              difficulty: "MEDIUM" as const,
              question: "Match the greetings and numbers:",
              content: {
                pairs: [
                  { left: "Salut", right: "Hi (informal)" },
                  { left: "quatre", right: "four" },
                  { left: "Bonsoir", right: "Good evening" },
                  { left: "neuf", right: "nine" }
                ]
              },
              explanation: "Great job reviewing Unit 1!",
              hint: null,
              xp_reward: 10,
              order_index: 4,
              is_active: true
            }
          ]
        }
      ]
    },
    {
      title: "Meeting People",
      // REMOVED: slug - your units table doesn't have this column
      description: "Learn to introduce yourself and ask about others.",
      order_index: 2,
      is_premium: false,
      lessons: [
        {
          title: "Introductions",
          slug: "introductions",
          description: "Learn to introduce yourself in French.",
          lesson_type: "VOCABULARY" as const,
          estimated_minutes: 12,
          xp_reward: 15,
          order_index: 1,
          is_premium: false,
          content: {
            introduction: "Time to introduce yourself! These phrases will help you meet new people.",
            key_points: [
              "Je m'appelle... means 'My name is...'",
              "Comment vous appelez-vous? is formal",
              "Comment tu t'appelles? is informal"
            ]
          },
          vocabulary: [
            { french: "Je m'appelle...", english: "My name is...", pronunciation: "zhuh mah-PEL" },
            { french: "Enchanté(e)", english: "Nice to meet you", pronunciation: "ahn-shahn-TAY" },
            { french: "Je suis...", english: "I am...", pronunciation: "zhuh SWEE" },
            { french: "Et vous?", english: "And you? (formal)", pronunciation: "ay VOO" }
          ],
          exercises: [
            {
              exercise_type: "TRANSLATION" as const,
              difficulty: "EASY" as const,
              question: "Translate to French: My name is...",
              content: {
                source_language: "en",
                target_language: "fr",
                correct_answers: ["Je m'appelle", "Je m'appelle...", "je m'appelle"]
              },
              explanation: "'Je m'appelle' literally means 'I call myself'.",
              hint: null,
              xp_reward: 5,
              order_index: 1,
              is_active: true
            },
            {
              exercise_type: "MULTIPLE_CHOICE" as const,
              difficulty: "EASY" as const,
              question: "How do you say 'Nice to meet you' in French?",
              content: {
                options: ["Bonjour", "Merci", "Enchanté", "Au revoir"],
                correct_index: 2
              },
              explanation: "'Enchanté' (or 'Enchantée' for women) literally means 'enchanted'.",
              hint: null,
              xp_reward: 5,
              order_index: 2,
              is_active: true
            },
            {
              exercise_type: "MATCHING" as const,
              difficulty: "MEDIUM" as const,
              question: "Match introduction phrases:",
              content: {
                pairs: [
                  { left: "Je m'appelle", right: "My name is" },
                  { left: "Enchanté", right: "Nice to meet you" },
                  { left: "Et vous?", right: "And you?" },
                  { left: "Je suis", right: "I am" }
                ]
              },
              explanation: "These are the essential introduction phrases!",
              hint: null,
              xp_reward: 10,
              order_index: 3,
              is_active: true
            }
          ]
        },
        {
          title: "Tu vs Vous",
          slug: "tu-vs-vous",
          description: "Understand when to use formal vs informal 'you'.",
          lesson_type: "GRAMMAR" as const,
          estimated_minutes: 10,
          xp_reward: 15,
          order_index: 2,
          is_premium: false,
          content: {
            introduction: "French has two words for 'you' - knowing when to use each one is essential!",
            key_points: [
              "Tu = informal, singular (friends, family, children)",
              "Vous = formal OR plural (strangers, elders, multiple people)",
              "When in doubt, use 'vous' - it's more polite!"
            ]
          },
          exercises: [
            {
              exercise_type: "MULTIPLE_CHOICE" as const,
              difficulty: "EASY" as const,
              question: "You're meeting your friend's grandmother for the first time. Which do you use?",
              content: {
                options: ["Tu", "Vous", "Either is fine", "Neither"],
                correct_index: 1
              },
              explanation: "Use 'vous' with elders and people you've just met to show respect.",
              hint: null,
              xp_reward: 5,
              order_index: 1,
              is_active: true
            },
            {
              exercise_type: "MULTIPLE_CHOICE" as const,
              difficulty: "EASY" as const,
              question: "You're talking to your close friend. Which do you use?",
              content: {
                options: ["Tu", "Vous", "Either is fine", "Neither"],
                correct_index: 0
              },
              explanation: "Use 'tu' with close friends, family, and people your age in casual settings.",
              hint: null,
              xp_reward: 5,
              order_index: 2,
              is_active: true
            },
            {
              exercise_type: "MATCHING" as const,
              difficulty: "MEDIUM" as const,
              question: "Match the situation to the correct form:",
              content: {
                pairs: [
                  { left: "Your boss", right: "Vous" },
                  { left: "Your pet dog", right: "Tu" },
                  { left: "A group of friends", right: "Vous" },
                  { left: "Your sibling", right: "Tu" }
                ]
              },
              explanation: "Remember: 'vous' for formal/plural, 'tu' for informal/singular!",
              hint: null,
              xp_reward: 10,
              order_index: 3,
              is_active: true
            }
          ]
        },
        {
          title: "Numbers 11-20",
          slug: "numbers-11-20",
          description: "Expand your number vocabulary!",
          lesson_type: "VOCABULARY" as const,
          estimated_minutes: 10,
          xp_reward: 15,
          order_index: 3,
          is_premium: false,
          content: {
            introduction: "Now that you know 1-10, let's learn 11-20!",
            key_points: [
              "11-16 have unique names to memorize",
              "17-19 are formed with 'dix-' (ten) + the unit",
              "17 = dix-sept (ten-seven)"
            ]
          },
          vocabulary: [
            { french: "onze", english: "eleven", pronunciation: "OHNZ" },
            { french: "douze", english: "twelve", pronunciation: "DOOZ" },
            { french: "treize", english: "thirteen", pronunciation: "TREZ" },
            { french: "quatorze", english: "fourteen", pronunciation: "kah-TORZ" },
            { french: "quinze", english: "fifteen", pronunciation: "KANZ" },
            { french: "seize", english: "sixteen", pronunciation: "SEZ" },
            { french: "dix-sept", english: "seventeen", pronunciation: "dee-SET" },
            { french: "dix-huit", english: "eighteen", pronunciation: "deez-WEET" },
            { french: "dix-neuf", english: "nineteen", pronunciation: "deez-NUHF" },
            { french: "vingt", english: "twenty", pronunciation: "VAN" }
          ],
          exercises: [
            {
              exercise_type: "TRANSLATION" as const,
              difficulty: "EASY" as const,
              question: "Translate to French: fifteen",
              content: {
                source_language: "en",
                target_language: "fr",
                correct_answers: ["quinze", "Quinze"]
              },
              explanation: "'Quinze' - notice the 'qu' makes a 'k' sound!",
              hint: null,
              xp_reward: 5,
              order_index: 1,
              is_active: true
            },
            {
              exercise_type: "MULTIPLE_CHOICE" as const,
              difficulty: "EASY" as const,
              question: "What is 'dix-huit' in English?",
              content: {
                options: ["sixteen", "seventeen", "eighteen", "nineteen"],
                correct_index: 2
              },
              explanation: "'Dix-huit' = 'ten-eight' = eighteen!",
              hint: null,
              xp_reward: 5,
              order_index: 2,
              is_active: true
            },
            {
              exercise_type: "MATCHING" as const,
              difficulty: "EASY" as const,
              question: "Match the French numbers to English:",
              content: {
                pairs: [
                  { left: "onze", right: "eleven" },
                  { left: "treize", right: "thirteen" },
                  { left: "vingt", right: "twenty" },
                  { left: "dix-neuf", right: "nineteen" }
                ]
              },
              explanation: "Great job learning 11-20!",
              hint: null,
              xp_reward: 10,
              order_index: 3,
              is_active: true
            }
          ]
        },
        {
          title: "Unit 2 Review",
          slug: "unit-2-review",
          description: "Practice introductions, tu/vous, and numbers 11-20!",
          lesson_type: "REVIEW" as const,
          estimated_minutes: 15,
          xp_reward: 25,
          order_index: 4,
          is_premium: false,
          content: {
            introduction: "Let's review everything from Unit 2!",
            key_points: [
              "Introductions: Je m'appelle...",
              "Tu (informal) vs Vous (formal/plural)",
              "Numbers 11-20"
            ]
          },
          exercises: [
            {
              exercise_type: "TRANSLATION" as const,
              difficulty: "EASY" as const,
              question: "Translate to French: My name is...",
              content: {
                source_language: "en",
                target_language: "fr",
                correct_answers: ["Je m'appelle", "Je m'appelle...", "je m'appelle"]
              },
              explanation: "Perfect! 'Je m'appelle' is how you introduce yourself.",
              hint: null,
              xp_reward: 5,
              order_index: 1,
              is_active: true
            },
            {
              exercise_type: "MULTIPLE_CHOICE" as const,
              difficulty: "MEDIUM" as const,
              question: "You're at a job interview. Which form do you use?",
              content: {
                options: ["Tu", "Vous", "Either", "Neither"],
                correct_index: 1
              },
              explanation: "Always use 'vous' in professional/formal settings!",
              hint: null,
              xp_reward: 5,
              order_index: 2,
              is_active: true
            },
            {
              exercise_type: "MATCHING" as const,
              difficulty: "MEDIUM" as const,
              question: "Match the numbers:",
              content: {
                pairs: [
                  { left: "douze", right: "12" },
                  { left: "seize", right: "16" },
                  { left: "dix-huit", right: "18" },
                  { left: "vingt", right: "20" }
                ]
              },
              explanation: "Excellent work on Unit 2!",
              hint: null,
              xp_reward: 10,
              order_index: 3,
              is_active: true
            }
          ]
        }
      ]
    }
  ]
};

// Vocabulary for spaced repetition
export const frenchA1Vocabulary = [
  { word: "bonjour", translation: "hello", pronunciation: "bohn-ZHOOR", category: "greetings", difficulty: 1 },
  { word: "au revoir", translation: "goodbye", pronunciation: "oh ruh-VWAHR", category: "greetings", difficulty: 1 },
  { word: "merci", translation: "thank you", pronunciation: "mair-SEE", category: "greetings", difficulty: 1 },
  { word: "oui", translation: "yes", pronunciation: "wee", category: "basics", difficulty: 1 },
  { word: "non", translation: "no", pronunciation: "nohn", category: "basics", difficulty: 1 },
  { word: "un", translation: "one", pronunciation: "uhn", category: "numbers", difficulty: 1 },
  { word: "deux", translation: "two", pronunciation: "duh", category: "numbers", difficulty: 1 },
  { word: "trois", translation: "three", pronunciation: "twah", category: "numbers", difficulty: 1 },
  { word: "quatre", translation: "four", pronunciation: "katr", category: "numbers", difficulty: 1 },
  { word: "cinq", translation: "five", pronunciation: "sank", category: "numbers", difficulty: 1 },
];