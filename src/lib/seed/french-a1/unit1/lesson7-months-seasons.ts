// Course: French A1
// Unit: 1 - First Steps
// Lesson: 7 - Months & Seasons

export const frenchA1U1L7 = {
  metadata: {
    course: "fr-a1",
    unit: 1,
    lesson: 7,
    title: "Months & Seasons",
    slug: "months-seasons",
    type: "VOCABULARY",
    estimatedMinutes: 15,
    xpReward: 20,
  },
  content: {
    introduction: {
      text: "You know the days of the week — now let's learn the months and seasons! Like the days, French months are not capitalized. Many French months look similar to English because both come from Latin, so this lesson should feel familiar. You'll also learn how to talk about dates and your birthday!",
      image: "/images/lessons/months-seasons.svg",
      culturalNote:
        "🇫🇷 The French write dates as day/month/year (not month/day/year). So 03/07/2024 means July 3rd, not March 7th! This catches many English speakers off guard.",
    },

    vocabulary: [
      {
        term: "janvier",
        translation: "January",
        pronunciation: "zhahn-VYAY",
        partOfSpeech: "noun",
        gender: "masculine",
        audio: "/audio/fr/janvier.mp3",
        exampleSentence: {
          original: "En janvier, il fait froid.",
          translation: "In January, it's cold.",
        },
        tip: "Like English 'January' — both from the Roman god Janus.",
      },
      {
        term: "février",
        translation: "February",
        pronunciation: "fay-VREE-yay",
        partOfSpeech: "noun",
        gender: "masculine",
        audio: "/audio/fr/fevrier.mp3",
        exampleSentence: {
          original: "La Saint-Valentin est en février.",
          translation: "Valentine's Day is in February.",
        },
        tip: "Similar to English. Note the accent on the 'e': février.",
      },
      {
        term: "mars",
        translation: "March",
        pronunciation: "mahrs",
        partOfSpeech: "noun",
        gender: "masculine",
        audio: "/audio/fr/mars.mp3",
        exampleSentence: {
          original: "Le printemps commence en mars.",
          translation: "Spring begins in March.",
        },
        tip: "Named after Mars, the Roman god of war. Same as English!",
      },
      {
        term: "avril",
        translation: "April",
        pronunciation: "ah-VREEL",
        partOfSpeech: "noun",
        gender: "masculine",
        audio: "/audio/fr/avril.mp3",
        exampleSentence: {
          original: "Le premier avril, c'est le poisson d'avril !",
          translation: "April 1st is April Fools' Day!",
        },
        tip: "'Poisson d'avril' (April fish) = April Fools! Kids stick paper fish on people's backs. 🐟",
      },
      {
        term: "mai",
        translation: "May",
        pronunciation: "meh",
        partOfSpeech: "noun",
        gender: "masculine",
        audio: "/audio/fr/mai.mp3",
        exampleSentence: {
          original: "En mai, fais ce qu'il te plaît.",
          translation: "In May, do as you please. (French proverb)",
        },
        tip: "One of the shortest months to spell! A famous French saying goes with it.",
      },
      {
        term: "juin",
        translation: "June",
        pronunciation: "zhwehn",
        partOfSpeech: "noun",
        gender: "masculine",
        audio: "/audio/fr/juin.mp3",
        exampleSentence: {
          original: "La Fête de la musique est le vingt-et-un juin.",
          translation: "The Music Festival is on June 21st.",
        },
        tip: "Don't confuse 'juin' (June) with 'juillet' (July) — they sound different!",
      },
      {
        term: "juillet",
        translation: "July",
        pronunciation: "zhwee-YEH",
        partOfSpeech: "noun",
        gender: "masculine",
        audio: "/audio/fr/juillet.mp3",
        exampleSentence: {
          original: "Le quatorze juillet est la fête nationale.",
          translation: "July 14th is the national holiday.",
        },
        tip: "Named after Julius Caesar. 'Le 14 juillet' = Bastille Day! 🎆",
      },
      {
        term: "août",
        translation: "August",
        pronunciation: "oot",
        partOfSpeech: "noun",
        gender: "masculine",
        audio: "/audio/fr/aout.mp3",
        exampleSentence: {
          original: "En août, beaucoup de Français sont en vacances.",
          translation: "In August, many French people are on vacation.",
        },
        tip: "Pronounced 'oot' (or sometimes 'oo'). August = vacation month in France!",
      },
      {
        term: "le printemps",
        translation: "Spring",
        pronunciation: "luh prahn-TAHN",
        partOfSpeech: "noun",
        gender: "masculine",
        audio: "/audio/fr/printemps.mp3",
        exampleSentence: {
          original: "Au printemps, les fleurs poussent.",
          translation: "In spring, flowers grow.",
        },
        tip: "Uses 'au' (not 'en'): 'au printemps.' Spring is the exception among seasons!",
      },
      {
        term: "l'été",
        translation: "Summer",
        pronunciation: "lay-TAY",
        partOfSpeech: "noun",
        gender: "masculine",
        audio: "/audio/fr/ete.mp3",
        exampleSentence: {
          original: "En été, il fait chaud.",
          translation: "In summer, it's hot.",
        },
        tip: "Uses 'en': 'en été.' The accent (é) makes it sound like 'ay-tay.'",
      },
    ],

    grammar: [
      {
        title: "Saying Dates and Using 'En' with Months",
        explanation:
          "To say 'in [month],' use 'en': 'en janvier' (in January). For seasons, use 'en' for most but 'au' for spring. To express a full date, use: 'le' + number + month: 'le 14 juillet' (July 14th). For the first of the month, use 'premier': 'le premier janvier' (January 1st).",
        examples: [
          {
            original: "Mon anniversaire est en mars.",
            translation: "My birthday is in March.",
            breakdown: "Mon anniversaire (my birthday) + est (is) + en mars (in March)",
          },
          {
            original: "Nous sommes le quinze février.",
            translation: "It is February 15th.",
            breakdown: "le (the) + quinze (15th) + février (February)",
          },
          {
            original: "Le premier janvier, c'est le Nouvel An.",
            translation: "January 1st is New Year's Day.",
            breakdown: "le premier (the first) + janvier (January)",
          },
        ],
        table: {
          headers: ["Season", "French", "Preposition"],
          rows: [
            ["Spring", "le printemps", "au printemps"],
            ["Summer", "l'été", "en été"],
            ["Autumn", "l'automne", "en automne"],
            ["Winter", "l'hiver", "en hiver"],
          ],
        },
        commonMistakes: [
          "❌ 'Dans janvier' — Don't use 'dans' for months!",
          "✅ 'En janvier' — Always use 'en' with months.",
          "❌ 'En printemps' — Spring is the exception!",
          "✅ 'Au printemps' — Spring uses 'au.'",
          "❌ 'Le 1 mars' — For the first of any month, say 'premier.'",
          "✅ 'Le premier mars' (March 1st).",
        ],
      },
    ],

    dialogue: {
      title: "When Is Your Birthday?",
      context:
        "Camille and Julien are getting to know each other and talk about their birthdays.",
      image: "/images/dialogues/birthday.svg",
      lines: [
        {
          speaker: "Camille",
          text: "Ton anniversaire, c'est quand ?",
          translation: "When is your birthday?",
        },
        {
          speaker: "Julien",
          text: "C'est le douze mars. Et toi ?",
          translation: "It's March 12th. And you?",
        },
        {
          speaker: "Camille",
          text: "Le premier septembre ! J'adore l'automne.",
          translation: "September 1st! I love autumn.",
        },
        {
          speaker: "Julien",
          text: "Moi, je préfère le printemps. Il fait beau en mars !",
          translation: "Me, I prefer spring. The weather is nice in March!",
        },
        {
          speaker: "Camille",
          text: "C'est vrai ! Le printemps est magnifique.",
          translation: "That's true! Spring is magnificent.",
        },
      ],
      comprehensionQuestions: [
        {
          question: "When is Julien's birthday?",
          options: ["March 1st", "March 12th", "September 1st", "September 12th"],
          correctIndex: 1,
        },
        {
          question: "Which season does Camille love?",
          options: ["Spring", "Summer", "Autumn", "Winter"],
          correctIndex: 2,
        },
      ],
    },

    culture: {
      title: "Les Grandes Vacances — The Great Vacation",
      text: "France is famous for its long summer vacation ('les grandes vacances'). Schools close for about two months (July and August), and many businesses slow down significantly in August. Paris can feel empty in August as Parisians flock to the coast or countryside. It's common for shops to post signs saying 'Fermé pour vacances' (Closed for vacation)!",
      image: "/images/culture/vacances.svg",
      funFact:
        "🏖️ French workers are legally entitled to 5 weeks of paid vacation per year — among the most generous in the world!",
    },

    summary: {
      keyPoints: [
        "Months are NOT capitalized in French: janvier, février, mars...",
        "Use 'en' + month: 'en janvier' (in January)",
        "Use 'au printemps' but 'en été / en automne / en hiver'",
        "Dates: 'le' + number + month: 'le 14 juillet'",
        "First of the month: 'le premier' + month: 'le premier mars'",
        "French date format: day/month/year (DD/MM/YYYY)",
      ],
      practicePrompt:
        "Say your birthday in French: 'Mon anniversaire est le [number] [month].' Then say the current month and season!",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What is 'avril' in English?",
      content: {
        options: ["March", "April", "August", "October"],
        correctIndex: 1,
      },
      explanation: "'Avril' means 'April.' Remember: 'poisson d'avril' = April Fools! 🐟",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "How do you say 'in January' in French?",
      content: {
        options: ["Dans janvier", "Au janvier", "En janvier", "Sur janvier"],
        correctIndex: 2,
      },
      explanation: "Use 'en' before all months: 'en janvier,' 'en mars,' 'en décembre,' etc.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the months to their English equivalents:",
      content: {
        pairs: [
          { left: "mars", right: "March" },
          { left: "juin", right: "June" },
          { left: "septembre", right: "September" },
          { left: "décembre", right: "December" },
          { left: "août", right: "August" },
        ],
      },
      explanation: "Most French months are similar to English — they share Latin roots.",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: 'My birthday is in March.'",
      content: {
        sentence: "Mon anniversaire est _____ mars.",
        answer: "en",
        options: ["en", "au", "dans", "le"],
        caseSensitive: false,
      },
      explanation: "Use 'en' before months: 'en mars' = 'in March.'",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "How do you say 'in spring' in French?",
      content: {
        options: ["En printemps", "Au printemps", "Dans le printemps", "Le printemps"],
        correctIndex: 1,
      },
      explanation: "Spring is the exception! Use 'au printemps' (not 'en'). All other seasons use 'en.'",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "How do you say 'January 1st' in French?",
      content: {
        sentence: "Le _____ janvier.",
        answer: "premier",
        options: ["premier", "un", "première", "one"],
        caseSensitive: false,
      },
      explanation: "For the 1st of any month, use 'le premier' (not 'le un'). All other dates use cardinal numbers.",
      hint: "Only the first day of the month uses an ordinal number.",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 6,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'My birthday is on September 5th.'",
      content: {
        correctAnswer: "Mon anniversaire est le cinq septembre.",
        acceptableAnswers: [
          "Mon anniversaire est le cinq septembre.",
          "Mon anniversaire est le cinq septembre",
          "Mon anniversaire est le 5 septembre.",
        ],
        direction: "to_target",
      },
      explanation: "'Mon anniversaire' (my birthday) + 'est le cinq septembre' (is September 5th). Note: 'le' + number + month.",
      difficulty: "HARD",
      xp_reward: 4,
      order_index: 7,
    },
    {
      exercise_type: "MATCHING",
      question: "Match each season to the correct preposition:",
      content: {
        pairs: [
          { left: "le printemps", right: "au" },
          { left: "l'été", right: "en" },
          { left: "l'automne", right: "en" },
          { left: "l'hiver", right: "en" },
        ],
      },
      explanation: "'Au printemps' is the exception. Summer, autumn, and winter all use 'en.'",
      difficulty: "HARD",
      xp_reward: 5,
      order_index: 8,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and select the month you hear:",
      content: {
        ttsText: "juillet",
        ttsLang: "fr-FR",
        options: ["Juin", "Juillet", "Janvier", "Août"],
        correctIndex: 1,
      },
      explanation: "'Juillet' (pronounced 'zhwee-YEH') means July. Don't confuse it with 'juin' (June)!",
      difficulty: "HARD",
      xp_reward: 5,
      order_index: 9,
    },
  ],
};