// Course: French A1
// Unit: 1 - First Steps
// Lesson: 6 - Days of the Week

export const frenchA1U1L6 = {
  metadata: {
    course: "fr-a1",
    unit: 1,
    lesson: 6,
    title: "Days of the Week",
    slug: "days-of-the-week",
    type: "VOCABULARY",
    estimatedMinutes: 12,
    xpReward: 20,
  },
  content: {
    introduction: {
      text: "Days of the week come up in every conversation — making plans, scheduling appointments, talking about your routine. In French, the days are not capitalized (unlike English!), and the week starts on Monday, not Sunday. Let's learn all seven days!",
      image: "/images/lessons/days-week.svg",
      culturalNote:
        "🇫🇷 In France, the work week is traditionally Monday to Friday, but many small shops and bakeries close on Mondays instead of Sundays. Sunday is family day — many businesses are closed!",
    },

    vocabulary: [
      {
        term: "lundi",
        translation: "Monday",
        pronunciation: "luhn-DEE",
        partOfSpeech: "noun",
        gender: "masculine",
        audio: "/audio/fr/lundi.mp3",
        exampleSentence: {
          original: "Le cours commence lundi.",
          translation: "The class starts on Monday.",
        },
        tip: "Named after the Moon (la Lune). 'Lundi' = Moon-day, just like 'Monday'!",
      },
      {
        term: "mardi",
        translation: "Tuesday",
        pronunciation: "mahr-DEE",
        partOfSpeech: "noun",
        gender: "masculine",
        audio: "/audio/fr/mardi.mp3",
        exampleSentence: {
          original: "Mardi, j'ai un rendez-vous.",
          translation: "On Tuesday, I have an appointment.",
        },
        tip: "Named after Mars, the Roman god of war. Think 'Mardi Gras' (Fat Tuesday)!",
      },
      {
        term: "mercredi",
        translation: "Wednesday",
        pronunciation: "mehr-kruh-DEE",
        partOfSpeech: "noun",
        gender: "masculine",
        audio: "/audio/fr/mercredi.mp3",
        exampleSentence: {
          original: "Mercredi est au milieu de la semaine.",
          translation: "Wednesday is in the middle of the week.",
        },
        tip: "Named after Mercury. French kids traditionally have no school on Wednesday afternoons!",
      },
      {
        term: "jeudi",
        translation: "Thursday",
        pronunciation: "zhuh-DEE",
        partOfSpeech: "noun",
        gender: "masculine",
        audio: "/audio/fr/jeudi.mp3",
        exampleSentence: {
          original: "Jeudi, nous allons au cinéma.",
          translation: "On Thursday, we're going to the movies.",
        },
        tip: "Named after Jupiter (Jove). 'Jeu-di' → 'Jove's day.'",
      },
      {
        term: "vendredi",
        translation: "Friday",
        pronunciation: "vahn-druh-DEE",
        partOfSpeech: "noun",
        gender: "masculine",
        audio: "/audio/fr/vendredi.mp3",
        exampleSentence: {
          original: "Vendredi soir, on sort !",
          translation: "Friday evening, we're going out!",
        },
        tip: "Named after Venus, goddess of love. TGIF = 'Vive le vendredi !'",
      },
      {
        term: "samedi",
        translation: "Saturday",
        pronunciation: "sahm-DEE",
        partOfSpeech: "noun",
        gender: "masculine",
        audio: "/audio/fr/samedi.mp3",
        exampleSentence: {
          original: "Samedi, je fais les courses.",
          translation: "On Saturday, I do the shopping.",
        },
        tip: "From Latin 'Sambati dies' (Sabbath day). Saturday = market day in France!",
      },
      {
        term: "dimanche",
        translation: "Sunday",
        pronunciation: "dee-MAHNSH",
        partOfSpeech: "noun",
        gender: "masculine",
        audio: "/audio/fr/dimanche.mp3",
        exampleSentence: {
          original: "Dimanche, les magasins sont fermés.",
          translation: "On Sunday, the stores are closed.",
        },
        tip: "From Latin 'dies dominica' (Lord's day). Most shops close on Sundays in France.",
      },
      {
        term: "aujourd'hui",
        translation: "Today",
        pronunciation: "oh-zhoor-DWEE",
        partOfSpeech: "adverb",
        audio: "/audio/fr/aujourdhui.mp3",
        exampleSentence: {
          original: "Aujourd'hui, c'est lundi.",
          translation: "Today is Monday.",
        },
        tip: "One of the longest common French words! Literally means 'on the day of today.'",
      },
      {
        term: "demain",
        translation: "Tomorrow",
        pronunciation: "duh-MEHN",
        partOfSpeech: "adverb",
        audio: "/audio/fr/demain.mp3",
        exampleSentence: {
          original: "Demain, c'est mardi.",
          translation: "Tomorrow is Tuesday.",
        },
        tip: "Related to 'matin' (morning) — 'de matin' → 'demain.'",
      },
    ],

    grammar: [
      {
        title: "Days of the Week — Grammar Rules",
        explanation:
          "In French: (1) Days of the week are NOT capitalized. (2) They are all masculine. (3) No preposition needed to say 'on Monday' — just say 'lundi.' (4) Add 'le' before a day to mean 'every [day]': 'le lundi' = 'every Monday / on Mondays.'",
        examples: [
          {
            original: "Je travaille lundi.",
            translation: "I work on Monday. (this Monday)",
            breakdown: "No preposition needed — just the day name",
          },
          {
            original: "Je travaille le lundi.",
            translation: "I work on Mondays. (every Monday)",
            breakdown: "'Le' + day = habitual/recurring",
          },
          {
            original: "Nous sommes mercredi.",
            translation: "It is Wednesday. (Today is Wednesday.)",
            breakdown:
              "'Nous sommes' is used idiomatically for 'Today is...' with days",
          },
        ],
        table: {
          headers: ["French", "Meaning", "Note"],
          rows: [
            ["lundi", "on Monday (this one)", "No article"],
            ["le lundi", "on Mondays (every week)", "With article 'le'"],
            ["lundi prochain", "next Monday", "'Prochain' = next"],
            ["lundi dernier", "last Monday", "'Dernier' = last"],
          ],
        },
        commonMistakes: [
          "❌ 'Sur lundi' or 'En lundi' — Don't add a preposition!",
          "✅ 'Je pars lundi.' (I'm leaving on Monday.)",
          "❌ Writing 'Lundi' with a capital L (only capitalize at the start of a sentence).",
          "✅ 'Aujourd'hui, c'est lundi.' (lowercase 'l')",
        ],
      },
    ],

    dialogue: {
      title: "Making Plans",
      context:
        "Léa and Hugo are planning their week over coffee.",
      image: "/images/dialogues/cafe-plans.svg",
      lines: [
        {
          speaker: "Léa",
          text: "Tu fais quoi cette semaine ?",
          translation: "What are you doing this week?",
        },
        {
          speaker: "Hugo",
          text: "Lundi et mardi, je travaille. Mercredi, je suis libre.",
          translation: "Monday and Tuesday, I'm working. Wednesday, I'm free.",
        },
        {
          speaker: "Léa",
          text: "Parfait ! On va au cinéma mercredi soir ?",
          translation: "Perfect! Shall we go to the movies Wednesday evening?",
        },
        {
          speaker: "Hugo",
          text: "Oui, bonne idée ! Et samedi ?",
          translation: "Yes, good idea! And Saturday?",
        },
        {
          speaker: "Léa",
          text: "Samedi, je fais les courses le matin. L'après-midi, je suis libre.",
          translation: "Saturday, I'm shopping in the morning. In the afternoon, I'm free.",
        },
        {
          speaker: "Hugo",
          text: "Super, on se voit mercredi et samedi alors !",
          translation: "Great, we'll see each other Wednesday and Saturday then!",
        },
      ],
      comprehensionQuestions: [
        {
          question: "When is Hugo free?",
          options: ["Monday", "Tuesday", "Wednesday", "Thursday"],
          correctIndex: 2,
        },
        {
          question: "What does Léa do on Saturday morning?",
          options: [
            "Goes to the movies",
            "Works",
            "Does the shopping",
            "Sleeps in",
          ],
          correctIndex: 2,
        },
      ],
    },

    culture: {
      title: "The French Weekend & 'Le Pont'",
      text: "The French love their weekends! When a public holiday falls on a Thursday or Tuesday, many French people take the connecting Friday or Monday off too — this is called 'faire le pont' (making the bridge). It creates a long weekend and is a beloved French tradition.",
      image: "/images/culture/weekend.svg",
      funFact:
        "🌉 France has 11 public holidays per year. When they fall right, 'le pont' can give workers nearly a full week off!",
    },

    summary: {
      keyPoints: [
        "The 7 days: lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche",
        "Days are NOT capitalized in French (except at the start of a sentence)",
        "No preposition: 'lundi' = 'on Monday'",
        "'Le lundi' (with article) = 'every Monday / on Mondays'",
        "The French week starts on Monday (lundi)",
        "'Aujourd'hui' = today, 'Demain' = tomorrow",
      ],
      practicePrompt:
        "Every day this week, say what day it is in French: 'Aujourd'hui, c'est [day].' Bonus: say what day tomorrow will be!",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What is 'mercredi' in English?",
      content: {
        options: ["Monday", "Tuesday", "Wednesday", "Thursday"],
        correctIndex: 2,
      },
      explanation: "'Mercredi' means 'Wednesday.' It's named after Mercury.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "Which day starts the French week?",
      content: {
        options: ["Dimanche", "Lundi", "Samedi", "Mardi"],
        correctIndex: 1,
      },
      explanation: "In France, the week begins on Monday (lundi), not Sunday.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the French days to English:",
      content: {
        pairs: [
          { left: "lundi", right: "Monday" },
          { left: "vendredi", right: "Friday" },
          { left: "dimanche", right: "Sunday" },
          { left: "jeudi", right: "Thursday" },
          { left: "samedi", right: "Saturday" },
        ],
      },
      explanation: "All seven days end in '-di' except 'dimanche' which ends in '-che.'",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete the sequence: lundi, mardi, _____, jeudi",
      content: {
        sentence: "lundi, mardi, _____, jeudi",
        answer: "mercredi",
        options: ["mercredi", "vendredi", "samedi", "dimanche"],
        caseSensitive: false,
      },
      explanation: "The sequence is Monday, Tuesday, Wednesday, Thursday. The answer is 'mercredi.'",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What does 'le lundi' (with 'le') mean?",
      content: {
        options: [
          "This Monday",
          "Last Monday",
          "Every Monday / On Mondays",
          "Next Monday",
        ],
        correctIndex: 2,
      },
      explanation: "Adding 'le' before a day means it's habitual: 'le lundi' = 'every Monday' or 'on Mondays.'",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "How do you say 'Today is Friday' in French?",
      content: {
        sentence: "Aujourd'hui, c'est _____.",
        answer: "vendredi",
        options: ["vendredi", "samedi", "jeudi", "dimanche"],
        caseSensitive: false,
      },
      explanation: "'Aujourd'hui, c'est vendredi' means 'Today is Friday.'",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 6,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'I work on Tuesdays.'",
      content: {
        correctAnswer: "Je travaille le mardi.",
        acceptableAnswers: [
          "Je travaille le mardi.",
          "Je travaille le mardi",
        ],
        direction: "to_target",
      },
      explanation: "'Je travaille' (I work) + 'le mardi' (on Tuesdays — habitual). The article 'le' makes it recurring.",
      hint: "Remember: 'le' + day = every week.",
      difficulty: "HARD",
      xp_reward: 4,
      order_index: 7,
    },
    {
      exercise_type: "REORDER",
      question: "Put the days in the correct French week order (Mon → Sun):",
      content: {
        words: ["samedi", "mercredi", "lundi", "vendredi", "dimanche"],
        correctOrder: ["lundi", "mercredi", "vendredi", "samedi", "dimanche"],
        translation: "Monday, Wednesday, Friday, Saturday, Sunday",
      },
      explanation: "The French week order: lundi, mardi, mercredi, jeudi, vendredi, samedi, dimanche.",
      difficulty: "HARD",
      xp_reward: 5,
      order_index: 8,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and select the day you hear:",
      content: {
        ttsText: "jeudi",
        ttsLang: "fr-FR",
        options: ["Lundi", "Mardi", "Jeudi", "Samedi"],
        correctIndex: 2,
      },
      explanation: "'Jeudi' (pronounced 'zhuh-DEE') means 'Thursday.'",
      difficulty: "HARD",
      xp_reward: 5,
      order_index: 9,
    },
  ],
};