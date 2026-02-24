// Course: French A1
// Unit: 1 - First Steps
// Lesson: 8 - Unit 1 Review

export const frenchA1U1L8 = {
  metadata: {
    course: "fr-a1",
    unit: 1,
    lesson: 8,
    title: "Unit 1 Review",
    slug: "unit-1-review",
    type: "REVIEW",
    estimatedMinutes: 20,
    xpReward: 30,
  },
  content: {
    introduction: {
      text: "Congratulations on completing Unit 1: First Steps! 🎉 You've learned greetings, introductions, numbers 1–20, the alphabet, days of the week, and months & seasons. This review lesson will test everything you've learned. Take your time, and remember — making mistakes is part of learning!",
      image: "/images/lessons/review-celebration.svg",
      culturalNote:
        "🇫🇷 Fun fact: You now know enough French to walk into a bakery, greet the baker, introduce yourself, order by number, spell your name, and make plans for the week. That's real progress!",
    },

    vocabulary: [
      {
        term: "Bravo !",
        translation: "Well done! / Bravo!",
        pronunciation: "brah-VOH",
        partOfSpeech: "phrase",
        audio: "/audio/fr/bravo.mp3",
        exampleSentence: {
          original: "Bravo, tu as bien travaillé !",
          translation: "Well done, you worked hard!",
        },
        tip: "The French use 'bravo' the same way as English. It's from Italian!",
      },
      {
        term: "Bonne chance !",
        translation: "Good luck!",
        pronunciation: "bun SHAHNSS",
        partOfSpeech: "phrase",
        audio: "/audio/fr/bonne-chance.mp3",
        exampleSentence: {
          original: "Bonne chance pour l'examen !",
          translation: "Good luck on the exam!",
        },
        tip: "Some French people say 'Merde !' (literally a rude word) instead of 'Bonne chance' — it's considered good luck, like 'Break a leg!'",
      },
      {
        term: "Je comprends",
        translation: "I understand",
        pronunciation: "zhuh kohm-PRAHN",
        partOfSpeech: "phrase",
        audio: "/audio/fr/je-comprends.mp3",
        exampleSentence: {
          original: "Oui, je comprends. Merci !",
          translation: "Yes, I understand. Thank you!",
        },
        tip: "Useful review phrase. If you don't understand, say 'Je ne comprends pas' (I don't understand).",
      },
      {
        term: "Je ne comprends pas",
        translation: "I don't understand",
        pronunciation: "zhuh nuh kohm-PRAHN pah",
        partOfSpeech: "phrase",
        audio: "/audio/fr/je-ne-comprends-pas.mp3",
        exampleSentence: {
          original: "Excusez-moi, je ne comprends pas.",
          translation: "Excuse me, I don't understand.",
        },
        tip: "Don't be afraid to use this! French people appreciate the effort and will help you.",
      },
      {
        term: "Répétez, s'il vous plaît",
        translation: "Please repeat (formal)",
        pronunciation: "ray-pay-TAY seel voo PLEH",
        partOfSpeech: "phrase",
        audio: "/audio/fr/repetez-svp.mp3",
        exampleSentence: {
          original: "Répétez, s'il vous plaît. Plus lentement.",
          translation: "Please repeat. More slowly.",
        },
        tip: "A learner's best friend! 'Plus lentement' (plü lahnt-MAHN) = 'more slowly.'",
      },
    ],

    grammar: [
      {
        title: "Unit 1 Grammar Review",
        explanation:
          "Let's review the key grammar points from this unit: formal vs. informal register, the verb 'être' (je suis), reflexive introductions (je m'appelle), no articles before professions, days without prepositions, 'en' with months, and 'au' with spring.",
        examples: [
          {
            original: "Bonjour, je m'appelle Marie. Je suis étudiante.",
            translation: "Hello, my name is Marie. I am a student.",
            breakdown: "Greeting + name introduction + profession (no article!)",
          },
          {
            original: "Mon anniversaire est le quatorze juillet. C'est en été.",
            translation: "My birthday is July 14th. It's in summer.",
            breakdown: "Date format (le + number + month) + season (en été)",
          },
          {
            original: "Le lundi, je travaille. Le samedi, je suis libre.",
            translation: "On Mondays, I work. On Saturdays, I'm free.",
            breakdown: "'Le' + day = habitual. No preposition before day names.",
          },
        ],
        table: {
          headers: ["Topic", "Rule", "Example"],
          rows: [
            ["Greetings", "Bonjour (day) / Bonsoir (evening)", "Bonjour, madame !"],
            ["Name", "Je m'appelle + name", "Je m'appelle Pierre."],
            ["Being", "Je suis + adjective/noun", "Je suis français."],
            ["Age", "J'ai + number + ans", "J'ai vingt ans."],
            ["Days", "No preposition; 'le' = habitual", "Je travaille le lundi."],
            ["Months", "'en' + month", "Mon anniversaire est en mars."],
            ["Seasons", "'au printemps' but 'en' for others", "Au printemps, il fait beau."],
          ],
        },
        commonMistakes: [
          "❌ 'Je suis vingt ans' → ✅ 'J'ai vingt ans' (use 'avoir' for age)",
          "❌ 'Dans janvier' → ✅ 'En janvier' (use 'en' for months)",
          "❌ 'Je suis un étudiant' → ✅ 'Je suis étudiant' (drop the article)",
          "❌ 'Sur lundi' → ✅ 'lundi' or 'le lundi' (no preposition for days)",
        ],
      },
    ],

    dialogue: {
      title: "New Neighbors",
      context:
        "Sophie just moved into a new apartment. She meets her neighbor, Marc, for the first time.",
      image: "/images/dialogues/neighbors.svg",
      lines: [
        {
          speaker: "Sophie",
          text: "Bonjour ! Je m'appelle Sophie. Je suis votre nouvelle voisine.",
          translation: "Hello! My name is Sophie. I'm your new neighbor.",
        },
        {
          speaker: "Marc",
          text: "Bonjour, Sophie ! Enchanté ! Je suis Marc. Bienvenue !",
          translation: "Hello, Sophie! Nice to meet you! I'm Marc. Welcome!",
        },
        {
          speaker: "Sophie",
          text: "Merci beaucoup ! J'ai emménagé samedi.",
          translation: "Thank you very much! I moved in on Saturday.",
        },
        {
          speaker: "Marc",
          text: "Ah, samedi ? Bienvenue dans l'immeuble ! Vous êtes d'où ?",
          translation: "Ah, Saturday? Welcome to the building! Where are you from?",
        },
        {
          speaker: "Sophie",
          text: "Je suis de Lyon. Et vous ?",
          translation: "I'm from Lyon. And you?",
        },
        {
          speaker: "Marc",
          text: "Je suis parisien ! Si vous avez besoin de quelque chose, n'hésitez pas !",
          translation: "I'm Parisian! If you need anything, don't hesitate!",
        },
        {
          speaker: "Sophie",
          text: "Merci, c'est très gentil. Au revoir, Marc !",
          translation: "Thank you, that's very kind. Goodbye, Marc!",
        },
        {
          speaker: "Marc",
          text: "Au revoir, Sophie ! Bonne journée !",
          translation: "Goodbye, Sophie! Have a nice day!",
        },
      ],
      comprehensionQuestions: [
        {
          question: "When did Sophie move in?",
          options: ["Friday", "Saturday", "Sunday", "Monday"],
          correctIndex: 1,
        },
        {
          question: "Where is Sophie from?",
          options: ["Paris", "Marseille", "Lyon", "Nice"],
          correctIndex: 2,
        },
      ],
    },

    culture: {
      title: "What You Can Now Do in France!",
      text: "With the skills from Unit 1, you can now: greet people properly (earning French respect!), introduce yourself at hotels and events, understand prices and times, spell your name for reservations, discuss schedules and dates, and navigate basic social situations. You're officially not a 'complete beginner' anymore!",
      image: "/images/culture/progress.svg",
      funFact:
        "🌟 Studies show that the first 100 words of any language cover about 50% of daily conversation. You've already learned many of them!",
    },

    summary: {
      keyPoints: [
        "GREETINGS: Bonjour, Bonsoir, Salut, Au revoir, Merci, S'il vous plaît",
        "INTRODUCTIONS: Je m'appelle..., Enchanté(e), Je suis...",
        "NUMBERS: 1–20 (un to vingt)",
        "ALPHABET: 26 letters + accents (é, è, ê, ç)",
        "DAYS: lundi → dimanche (no capital, no preposition)",
        "MONTHS: janvier → décembre (use 'en' + month)",
        "SEASONS: au printemps, en été, en automne, en hiver",
        "KEY GRAMMAR: Tu vs. Vous, 'avoir' for age, no article before professions",
      ],
      practicePrompt:
        "Write a mini self-introduction in French using everything from Unit 1: greeting, name, a number (your age), and your birthday month. Say it out loud 3 times!",
    },
  },

  exercises: [
    // Greetings review
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "You enter a shop at 7 PM. What do you say?",
      content: {
        options: ["Bonjour", "Bonsoir", "Salut", "Bonne nuit"],
        correctIndex: 1,
      },
      explanation: "After approximately 6 PM, use 'Bonsoir' (Good evening) instead of 'Bonjour.'",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    // Introductions review
    {
      exercise_type: "FILL_BLANK",
      question: "Complete the introduction:",
      content: {
        sentence: "Bonjour, je _____ Marie. Enchantée !",
        answer: "m'appelle",
        options: ["m'appelle", "suis appelle", "appelle", "nom"],
        caseSensitive: false,
      },
      explanation: "'Je m'appelle' = 'My name is' (literally: I call myself).",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 2,
    },
    // Numbers review
    {
      exercise_type: "MATCHING",
      question: "Match the numbers:",
      content: {
        pairs: [
          { left: "Treize", right: "13" },
          { left: "Huit", right: "8" },
          { left: "Vingt", right: "20" },
          { left: "Quinze", right: "15" },
          { left: "Quatre", right: "4" },
        ],
      },
      explanation: "These span 1–20. Practice until recognition is instant!",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 3,
    },
    // Alphabet review
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "Which accent is in the word 'français'?",
      content: {
        options: ["accent aigu (é)", "accent grave (è)", "cédille (ç)", "accent circonflexe (ê)"],
        correctIndex: 2,
      },
      explanation: "The 'ç' in 'français' is a cédille. It makes 'c' sound like 's' before 'a.'",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 4,
    },
    // Days review
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: 'I work every Monday.'",
      content: {
        sentence: "Je travaille _____ lundi.",
        answer: "le",
        options: ["le", "en", "au", "sur"],
        caseSensitive: false,
      },
      explanation: "'Le' + day = habitual action. 'Le lundi' = 'every Monday / on Mondays.'",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 5,
    },
    // Months review
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "How do you say 'in spring' in French?",
      content: {
        options: ["En printemps", "Au printemps", "Dans le printemps", "Le printemps"],
        correctIndex: 1,
      },
      explanation: "Spring is the only season that uses 'au': 'au printemps.' All others use 'en.'",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 6,
    },
    // Age review
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'I am 18 years old.'",
      content: {
        correctAnswer: "J'ai dix-huit ans.",
        acceptableAnswers: [
          "J'ai dix-huit ans.",
          "J'ai dix-huit ans",
          "J'ai 18 ans.",
        ],
        direction: "to_target",
      },
      explanation: "French uses 'avoir' (to have) for age: 'J'ai dix-huit ans' = literally 'I have 18 years.'",
      hint: "Remember: French 'has' years, not 'is' years old.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 7,
    },
    // Cross-topic exercise
    {
      exercise_type: "REORDER",
      question: "Arrange the words to introduce yourself:",
      content: {
        words: ["Enchanté", "m'appelle", "!", "Bonjour", "Je", "Pierre", "."],
        correctOrder: ["Bonjour", ",", "Je", "m'appelle", "Pierre", ".", "Enchanté", "!"],
        // Note: simplified for the exercise engine
        translation: "Hello, my name is Pierre. Nice to meet you!",
      },
      explanation: "Standard introduction format: Greeting + name + pleased to meet you.",
      difficulty: "HARD",
      xp_reward: 5,
      order_index: 8,
    },
    // Comprehensive fill-blank
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: 'My birthday is on July 14th.'",
      content: {
        sentence: "Mon anniversaire est _____ quatorze juillet.",
        answer: "le",
        options: ["le", "en", "au", "la"],
        caseSensitive: false,
      },
      explanation: "Dates use 'le' + number + month: 'le quatorze juillet' = July 14th.",
      difficulty: "HARD",
      xp_reward: 4,
      order_index: 9,
    },
    // Comprehensive translation
    {
      exercise_type: "TRANSLATION",
      question:
        "Translate to French: 'Hello, my name is Sophie. I am French. My birthday is in May.'",
      content: {
        correctAnswer:
          "Bonjour, je m'appelle Sophie. Je suis française. Mon anniversaire est en mai.",
        acceptableAnswers: [
          "Bonjour, je m'appelle Sophie. Je suis française. Mon anniversaire est en mai.",
          "Bonjour, je m'appelle Sophie. Je suis française. Mon anniversaire est en mai",
        ],
        direction: "to_target",
      },
      explanation:
        "This combines greetings (Bonjour), introductions (je m'appelle), identity (je suis française — feminine!), and dates (en mai).",
      hint: "Three sentences: greeting + name, nationality, birthday month.",
      difficulty: "HARD",
      xp_reward: 5,
      order_index: 10,
    },
    // Listening challenge
    {
      exercise_type: "LISTENING",
      question: "Listen and select what you hear:",
      content: {
        ttsText: "Je m'appelle Marie. Mon anniversaire est le premier mars.",
        ttsLang: "fr-FR",
        options: [
          "My name is Marie. My birthday is March 1st.",
          "My name is Marie. My birthday is May 1st.",
          "My name is Marie. I work on Mondays.",
          "My name is Marie. I am 13 years old.",
        ],
        correctIndex: 0,
      },
      explanation:
        "'Le premier mars' = March 1st. 'Premier' is used for the 1st of any month.",
      difficulty: "HARD",
      xp_reward: 5,
      order_index: 11,
    },
    // Final comprehensive question
    {
      exercise_type: "MULTIPLE_CHOICE",
      question:
        "Which sentence has a MISTAKE?",
      content: {
        options: [
          "Bonjour, je m'appelle Pierre.",
          "J'ai vingt ans.",
          "Je suis un professeur.",
          "Mon anniversaire est en septembre.",
        ],
        correctIndex: 2,
      },
      explanation:
        "'Je suis un professeur' should be 'Je suis professeur' — in French, drop the article before professions after 'être.'",
      difficulty: "HARD",
      xp_reward: 5,
      order_index: 12,
    },
  ],
};