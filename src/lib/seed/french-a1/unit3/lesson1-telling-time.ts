// Course: French A1
// Unit: 3 - Daily Life
// Lesson: 1 - Telling Time

export const frenchA1U3L1 = {
  metadata: {
    course: "fr-a1",
    unit: 3,
    lesson: 1,
    title: "Telling Time",
    slug: "telling-time",
    type: "VOCABULARY",
    estimatedMinutes: 15,
    xpReward: 20,
  },

  content: {
    introduction: {
      text: "Knowing how to tell time is essential for everyday life in France — catching trains, making appointments, or simply asking when the bakery opens! In this lesson, you'll learn to ask for the time, tell the time, and understand the French approach to hours and minutes.",
      culturalNote: "🇫🇷 France uses the 24-hour clock (l'heure officielle) for schedules, train times, and formal situations. You'll see '15h00' instead of '3 PM' at train stations. However, in casual conversation, the 12-hour clock with context ('du matin', 'du soir') is perfectly normal!",
    },

    vocabulary: [
      {
        term: "l'heure",
        translation: "the hour / the time",
        pronunciation: "luhr",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Quelle heure est-il ?",
          translation: "What time is it?",
        },
        tip: "This word is feminine, so it's 'une heure' for 'one o'clock' — the only time you use 'une' instead of a number!",
      },
      {
        term: "la minute",
        translation: "the minute",
        pronunciation: "lah mee-noot",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Attends cinq minutes !",
          translation: "Wait five minutes!",
        },
        tip: "In casual speech, you often drop 'minutes' — just say 'Il est huit heures dix' (It's 8:10).",
      },
      {
        term: "midi",
        translation: "noon",
        pronunciation: "mee-dee",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Je déjeune à midi.",
          translation: "I have lunch at noon.",
        },
        tip: "No article needed: say 'à midi' not 'à le midi'. Midi is special!",
      },
      {
        term: "minuit",
        translation: "midnight",
        pronunciation: "mee-nwee",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Le film finit à minuit.",
          translation: "The movie ends at midnight.",
        },
        tip: "Like 'midi', use it without an article. Think of them as twins!",
      },
      {
        term: "et quart",
        translation: "quarter past",
        pronunciation: "ay kar",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Il est trois heures et quart.",
          translation: "It is quarter past three.",
        },
        tip: "Literally means 'and quarter' — you're adding 15 minutes to the hour.",
      },
      {
        term: "et demie",
        translation: "half past",
        pronunciation: "ay duh-mee",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Il est six heures et demie.",
          translation: "It is half past six.",
        },
        tip: "'Demie' has an 'e' because it agrees with 'heure' (feminine). Grammar in action!",
      },
      {
        term: "moins le quart",
        translation: "quarter to",
        pronunciation: "mwan luh kar",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Il est neuf heures moins le quart.",
          translation: "It is quarter to nine.",
        },
        tip: "Literally 'minus the quarter' — you're subtracting 15 minutes from the next hour.",
      },
      {
        term: "le matin",
        translation: "the morning",
        pronunciation: "luh mah-tan",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Je travaille le matin.",
          translation: "I work in the morning.",
        },
        tip: "Use 'du matin' to specify AM: 'huit heures du matin' = 8 AM.",
      },
      {
        term: "l'après-midi",
        translation: "the afternoon",
        pronunciation: "lah-preh-mee-dee",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Le cours est l'après-midi.",
          translation: "The class is in the afternoon.",
        },
        tip: "Can be masculine or feminine — both are accepted. French is flexible here!",
      },
      {
        term: "le soir",
        translation: "the evening",
        pronunciation: "luh swahr",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Je dîne à huit heures du soir.",
          translation: "I have dinner at 8 PM.",
        },
        tip: "Use 'du soir' to clarify PM in casual conversation.",
      },
    ],

    grammar: [
      {
        title: "Telling Time with 'Il est'",
        explanation: "In French, we use 'Il est...' followed by the hour to tell time. The word 'heures' (hours) is always included — except for midi and minuit. Think of 'Il est' as 'It is' for time.",
        examples: [
          {
            original: "Il est une heure.",
            translation: "It is one o'clock.",
            breakdown: "Il est (it is) + une (one, feminine) + heure (hour)",
          },
          {
            original: "Il est deux heures.",
            translation: "It is two o'clock.",
            breakdown: "Il est (it is) + deux (two) + heures (hours, plural)",
          },
          {
            original: "Il est midi.",
            translation: "It is noon.",
            breakdown: "Il est (it is) + midi (noon) — no 'heures' needed!",
          },
        ],
        commonMistakes: [
          "❌ 'Il est un heure' — Don't use 'un'! It's 'une heure' because 'heure' is feminine.",
          "✅ 'Il est une heure' — Use the feminine 'une' for one o'clock.",
          "❌ 'Il est trois heure' — Don't forget the 's'! It's 'heures' (plural) for 2+.",
          "✅ 'Il est trois heures' — Always plural for numbers 2 and above.",
        ],
      },
    ],

    dialogue: {
      title: "À la gare",
      context: "Marie asks a stranger for the time at a train station in Lyon.",
      lines: [
        {
          speaker: "Marie",
          text: "Excusez-moi, quelle heure est-il ?",
          translation: "Excuse me, what time is it?",
        },
        {
          speaker: "Pierre",
          text: "Il est neuf heures et quart.",
          translation: "It's quarter past nine.",
        },
        {
          speaker: "Marie",
          text: "Merci ! Le train arrive à quelle heure ?",
          translation: "Thank you! What time does the train arrive?",
        },
        {
          speaker: "Pierre",
          text: "Le train arrive à dix heures moins le quart.",
          translation: "The train arrives at quarter to ten.",
        },
        {
          speaker: "Marie",
          text: "Parfait, j'ai le temps !",
          translation: "Perfect, I have time!",
        },
        {
          speaker: "Pierre",
          text: "Bon voyage !",
          translation: "Have a good trip!",
        },
      ],
      comprehensionQuestions: [
        {
          question: "What time is it when Marie asks?",
          options: ["9:00", "9:15", "9:30", "9:45"],
          correctIndex: 1,
        },
        {
          question: "What time does the train arrive?",
          options: ["9:15", "9:30", "9:45", "10:00"],
          correctIndex: 2,
        },
      ],
    },

    culture: {
      title: "The 24-Hour Clock in France",
      text: "French train stations, airports, TV schedules, and official documents all use the 24-hour clock. Instead of '3 PM', you'll see '15h00' (quinze heures). This eliminates AM/PM confusion entirely! However, in everyday conversation with friends and family, people often use the 12-hour format with context clues like 'du matin' (in the morning), 'de l'après-midi' (in the afternoon), or 'du soir' (in the evening).",
      funFact: "🚂 French trains are famous for their punctuality. The TGV (high-speed train) departure times are announced to the minute — so knowing how to read '14h47' could save you from missing your train!",
    },

    summary: {
      keyPoints: [
        "Use 'Il est...' + number + 'heure(s)' to tell time",
        "'Une heure' for 1:00 (feminine!), 'heures' (plural) for 2+",
        "'Et quart' = quarter past (+15), 'et demie' = half past (+30)",
        "'Moins le quart' = quarter to (-15 from next hour)",
        "'Midi' = noon, 'minuit' = midnight (no article needed)",
        "France uses 24-hour time officially but 12-hour casually",
      ],
      practicePrompt: "Look at your phone or watch right now and say the time in French! Try it every hour today — you'll be a pro by bedtime.",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "How do you say 'It is 3 o'clock' in French?",
      content: {
        options: [
          "Il est trois heures",
          "Il est trois heure",
          "C'est trois heures",
          "Il a trois heures",
        ],
        correctIndex: 0,
      },
      hint: "Remember: 'Il est' + number + 'heures' (plural for 2+)",
      explanation: "'Il est' is used for telling time, and 'heures' is plural for all numbers except one.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What does 'Il est huit heures et demie' mean?",
      content: {
        options: [
          "It is 8:30",
          "It is 8:15",
          "It is 8:45",
          "It is half to eight",
        ],
        correctIndex: 0,
      },
      hint: "'Et demie' means 'and half'",
      explanation: "'Et demie' means 'half past', so 'huit heures et demie' is 8:30.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the French time expressions with their meanings:",
      content: {
        pairs: [
          { left: "midi", right: "noon" },
          { left: "minuit", right: "midnight" },
          { left: "et demie", right: "half past" },
          { left: "et quart", right: "quarter past" },
          { left: "moins le quart", right: "quarter to" },
        ],
      },
      hint: "Think about what you're adding or subtracting from the hour",
      explanation: "These are the essential building blocks for telling time in French!",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Il est six heures _____ quart. (quarter past six)",
      content: {
        sentence: "Il est six heures _____ quart.",
        answer: "et",
        options: ["et", "moins", "de", "à"],
        caseSensitive: false,
      },
      hint: "You're ADDING a quarter to the hour",
      explanation: "'Et quart' means 'quarter past' — you're adding 15 minutes.",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Il est dix heures _____ le quart. (quarter to ten)",
      content: {
        sentence: "Il est dix heures _____ le quart.",
        answer: "moins",
        options: ["moins", "et", "plus", "de"],
        caseSensitive: false,
      },
      hint: "You're SUBTRACTING a quarter from the hour",
      explanation: "'Moins le quart' literally means 'minus the quarter' — 15 minutes before.",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'What time is it?'",
      content: {
        correctAnswer: "Quelle heure est-il ?",
        acceptableAnswers: [
          "Quelle heure est-il ?",
          "Quelle heure est-il",
          "Il est quelle heure ?",
          "Il est quelle heure",
        ],
        direction: "to_target",
      },
      hint: "Start with 'Quelle' (what) + 'heure' (time/hour)",
      explanation: "'Quelle heure est-il?' is the standard way to ask for the time. 'Il est quelle heure?' is more casual.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 6,
    },
    {
      exercise_type: "REORDER",
      question: "Put the words in order to say 'It is nine o'clock':",
      content: {
        words: ["heures", "est", "neuf", "il"],
        correctOrder: ["il", "est", "neuf", "heures"],
        translation: "It is nine o'clock",
      },
      hint: "Start with the subject 'il'",
      explanation: "The correct sentence is 'Il est neuf heures' — Subject + verb + number + heures.",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 7,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and select what time you hear:",
      content: {
        ttsText: "Il est trois heures et quart.",
        ttsLang: "fr-FR",
        options: ["3:15", "3:30", "3:45", "4:15"],
        correctIndex: 0,
      },
      hint: "Listen for 'et quart' — what does that add?",
      explanation: "'Trois heures et quart' means 3:15 (quarter past three).",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 8,
    },
    {
      exercise_type: "SPEAK",
      question: "Say the following time in French: 7:30",
      content: {
        targetText: "Il est sept heures et demie.",
        targetTranslation: "It is half past seven.",
        acceptableVariants: [
          "Il est sept heures et demie",
          "Il est sept heures trente",
          "Sept heures et demie",
        ],
      },
      hint: "Use 'et demie' for half past",
      explanation: "Both 'et demie' (and half) and 'trente' (thirty) work for :30.",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 9,
    },
    {
      exercise_type: "SPEAK",
      question: "Ask someone what time it is in French.",
      content: {
        targetText: "Quelle heure est-il ?",
        targetTranslation: "What time is it?",
        acceptableVariants: [
          "Quelle heure est-il",
          "Il est quelle heure",
          "Il est quelle heure ?",
        ],
      },
      hint: "Start with 'Quelle heure...'",
      explanation: "'Quelle heure est-il?' is the go-to phrase for asking the time.",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 10,
    },
  ],
};
