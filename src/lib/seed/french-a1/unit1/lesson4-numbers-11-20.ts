// Course: French A1
// Unit: 1 - First Steps
// Lesson: 4 - Numbers 11-20

export const frenchA1U1L4 = {
  metadata: {
    course: "fr-a1",
    unit: 1,
    lesson: 4,
    title: "Numbers 11-20",
    slug: "numbers-11-20",
    type: "VOCABULARY",
    estimatedMinutes: 12,
    xpReward: 20,
  },
  content: {
    introduction: {
      text: "Great work with 1–10! Now let's tackle 11–20. Some of these numbers follow a pattern, while others need to be memorized individually. Pay attention to 11–16 (unique words) and 17–19 (which are formed by combining numbers you already know). Let's go!",
      image: "/images/lessons/numbers-teen.svg",
      culturalNote:
        "🇫🇷 In France, prices at markets are often given as a quick stream of numbers. Being able to recognize 11–20 instantly will save you from buying 17 croissants when you only wanted 7!",
    },

    vocabulary: [
      {
        term: "Onze",
        translation: "Eleven (11)",
        pronunciation: "ohnz",
        partOfSpeech: "noun",
        audio: "/audio/fr/onze.mp3",
        exampleSentence: {
          original: "Le match commence à onze heures.",
          translation: "The match starts at eleven o'clock.",
        },
        tip: "Unique word — just memorize it. Note: no liaison or elision before 'onze' ('le onze,' not 'l'onze').",
      },
      {
        term: "Douze",
        translation: "Twelve (12)",
        pronunciation: "dooz",
        partOfSpeech: "noun",
        audio: "/audio/fr/douze.mp3",
        exampleSentence: {
          original: "Il y a douze mois dans l'année.",
          translation: "There are twelve months in the year.",
        },
        tip: "Think 'a dozen' — 'une douzaine' in French!",
      },
      {
        term: "Treize",
        translation: "Thirteen (13)",
        pronunciation: "trehz",
        partOfSpeech: "noun",
        audio: "/audio/fr/treize.mp3",
        exampleSentence: {
          original: "J'ai treize ans.",
          translation: "I am thirteen years old.",
        },
        tip: "You can hear 'trois' (three) hiding inside 'treize.'",
      },
      {
        term: "Quatorze",
        translation: "Fourteen (14)",
        pronunciation: "kah-TORZ",
        partOfSpeech: "noun",
        audio: "/audio/fr/quatorze.mp3",
        exampleSentence: {
          original: "Le quatorze juillet est la fête nationale.",
          translation: "July 14th is the national holiday.",
        },
        tip: "Contains 'quatre' (four). 'Le 14 juillet' = Bastille Day! 🎆",
      },
      {
        term: "Quinze",
        translation: "Fifteen (15)",
        pronunciation: "kahnz",
        partOfSpeech: "noun",
        audio: "/audio/fr/quinze.mp3",
        exampleSentence: {
          original: "Le train part dans quinze minutes.",
          translation: "The train leaves in fifteen minutes.",
        },
        tip: "Contains 'cinq' (five). 'Quinze' is also used in tennis scoring!",
      },
      {
        term: "Seize",
        translation: "Sixteen (16)",
        pronunciation: "sehz",
        partOfSpeech: "noun",
        audio: "/audio/fr/seize.mp3",
        exampleSentence: {
          original: "Ma fille a seize ans.",
          translation: "My daughter is sixteen years old.",
        },
        tip: "Last of the unique numbers. Contains 'six' (six). From 17 on, the pattern changes!",
      },
      {
        term: "Dix-sept",
        translation: "Seventeen (17)",
        pronunciation: "dee-SET",
        partOfSpeech: "noun",
        audio: "/audio/fr/dix-sept.mp3",
        exampleSentence: {
          original: "Nous sommes dix-sept étudiants.",
          translation: "We are seventeen students.",
        },
        tip: "Literally 'ten-seven.' From here, numbers are formed by combining: dix + unit.",
      },
      {
        term: "Dix-huit",
        translation: "Eighteen (18)",
        pronunciation: "deez-WEET",
        partOfSpeech: "noun",
        audio: "/audio/fr/dix-huit.mp3",
        exampleSentence: {
          original: "À dix-huit ans, on est majeur en France.",
          translation: "At eighteen, you're an adult in France.",
        },
        tip: "Literally 'ten-eight.' In France, 18 is the legal age of adulthood.",
      },
      {
        term: "Dix-neuf",
        translation: "Nineteen (19)",
        pronunciation: "deez-NUHF",
        partOfSpeech: "noun",
        audio: "/audio/fr/dix-neuf.mp3",
        exampleSentence: {
          original: "Le restaurant ferme à dix-neuf heures.",
          translation: "The restaurant closes at 7 PM (19:00).",
        },
        tip: "Literally 'ten-nine.' France uses 24-hour time, so 19h = 7 PM.",
      },
      {
        term: "Vingt",
        translation: "Twenty (20)",
        pronunciation: "vahn",
        partOfSpeech: "noun",
        audio: "/audio/fr/vingt.mp3",
        exampleSentence: {
          original: "J'ai vingt euros.",
          translation: "I have twenty euros.",
        },
        tip: "The 'g' and 't' are silent when alone. Important base number for counting higher!",
      },
    ],

    grammar: [
      {
        title: "The Pattern Behind 11–20",
        explanation:
          "Numbers 11–16 have unique forms that evolved from Latin and must be memorized. Numbers 17–19 follow a transparent pattern: 'dix' (10) + unit number. Twenty ('vingt') is another unique base number.",
        examples: [
          {
            original: "11–16: Unique words",
            translation: "onze, douze, treize, quatorze, quinze, seize",
            breakdown: "Each has roots in Latin numbers — just memorize them",
          },
          {
            original: "17–19: Compound words",
            translation: "dix-sept (10+7), dix-huit (10+8), dix-neuf (10+9)",
            breakdown: "Simply combine 'dix' with the unit — joined by a hyphen",
          },
        ],
        table: {
          headers: ["Number", "French", "Literal Meaning"],
          rows: [
            ["11", "Onze", "(unique)"],
            ["12", "Douze", "(unique)"],
            ["13", "Treize", "(unique)"],
            ["14", "Quatorze", "(unique)"],
            ["15", "Quinze", "(unique)"],
            ["16", "Seize", "(unique)"],
            ["17", "Dix-sept", "Ten-seven"],
            ["18", "Dix-huit", "Ten-eight"],
            ["19", "Dix-neuf", "Ten-nine"],
            ["20", "Vingt", "(unique base)"],
          ],
        },
        commonMistakes: [
          "❌ 'Dix-six' — There is no 'dix-six'! Sixteen is 'seize.'",
          "✅ The compound pattern (dix + unit) only starts at 17.",
          "❌ 'Vingt' is NOT pronounced 'vingt' — the 'g' and 't' are silent: say 'vahn.'",
        ],
      },
    ],

    dialogue: {
      title: "Buying Train Tickets",
      context:
        "Marc is at the train station ticket window, buying tickets for a group trip.",
      image: "/images/dialogues/train-station.svg",
      lines: [
        {
          speaker: "Marc",
          text: "Bonjour ! Quinze billets pour Lyon, s'il vous plaît.",
          translation: "Hello! Fifteen tickets for Lyon, please.",
        },
        {
          speaker: "Guichetière",
          text: "Quinze billets... Le train part à quatorze heures.",
          translation: "Fifteen tickets... The train departs at 2 PM (14:00).",
        },
        {
          speaker: "Marc",
          text: "Parfait. C'est combien ?",
          translation: "Perfect. How much is it?",
        },
        {
          speaker: "Guichetière",
          text: "C'est dix-huit euros par billet.",
          translation: "It's eighteen euros per ticket.",
        },
        {
          speaker: "Marc",
          text: "Dix-huit euros... d'accord. Voilà.",
          translation: "Eighteen euros... okay. Here you go.",
        },
      ],
      comprehensionQuestions: [
        {
          question: "How many tickets does Marc buy?",
          options: ["12", "14", "15", "18"],
          correctIndex: 2,
        },
        {
          question: "At what time does the train depart?",
          options: ["12:00", "14:00", "15:00", "18:00"],
          correctIndex: 1,
        },
      ],
    },

    culture: {
      title: "Le 14 Juillet — Bastille Day",
      text: "The 14th of July ('le quatorze juillet') is France's national day, celebrating the storming of the Bastille prison in 1789, a turning point in the French Revolution. It features military parades on the Champs-Élysées, fireworks at the Eiffel Tower, and public dances called 'bals des pompiers' (firefighters' balls).",
      image: "/images/culture/bastille-day.svg",
      funFact:
        "🎆 The Bastille Day military parade is the oldest and largest regular military parade in Europe, held annually since 1880!",
    },

    summary: {
      keyPoints: [
        "11–16 are unique words: onze, douze, treize, quatorze, quinze, seize",
        "17–19 follow a pattern: dix-sept, dix-huit, dix-neuf (ten + unit)",
        "20 = vingt (the 'g' and 't' are silent)",
        "France uses 24-hour time: quatorze heures = 2 PM",
        "'Le 14 juillet' (July 14th) is France's national holiday",
      ],
      practicePrompt:
        "Practice counting 1–20 in French. Then try saying random numbers between 11 and 20 — quiz yourself!",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What is 'douze' in English?",
      content: {
        options: ["Ten", "Eleven", "Twelve", "Thirteen"],
        correctIndex: 2,
      },
      explanation: "'Douze' means 'twelve.' Think of 'a dozen' (une douzaine)!",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "How do you say '17' in French?",
      content: {
        options: ["Sept", "Dix-sept", "Dix-six", "Seize"],
        correctIndex: 1,
      },
      explanation: "'Dix-sept' literally means 'ten-seven' = 17. The compound pattern starts at 17.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the French numbers to the digits:",
      content: {
        pairs: [
          { left: "Onze", right: "11" },
          { left: "Quinze", right: "15" },
          { left: "Dix-huit", right: "18" },
          { left: "Vingt", right: "20" },
          { left: "Treize", right: "13" },
        ],
      },
      explanation: "These are key numbers between 11 and 20. Repeat them out loud!",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete the sequence: treize, quatorze, _____, seize",
      content: {
        sentence: "treize, quatorze, _____, seize",
        answer: "quinze",
        options: ["quinze", "onze", "douze", "vingt"],
        caseSensitive: false,
      },
      explanation: "13, 14, 15, 16 — the missing number is 'quinze' (fifteen).",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "How do you say 'I am 19 years old'?",
      content: {
        sentence: "J'ai _____ ans.",
        answer: "dix-neuf",
        options: ["dix-neuf", "neuf", "dix-huit", "vingt"],
        caseSensitive: false,
      },
      explanation: "'Dix-neuf' = 19. 'J'ai dix-neuf ans' = 'I am 19 years old.'",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "Which of these numbers does NOT follow the 'dix + unit' pattern?",
      content: {
        options: ["Dix-sept (17)", "Dix-huit (18)", "Seize (16)", "Dix-neuf (19)"],
        correctIndex: 2,
      },
      explanation: "'Seize' (16) is a unique word, not 'dix-six.' The compound pattern only starts at 17.",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 6,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'I have fourteen books.'",
      content: {
        correctAnswer: "J'ai quatorze livres.",
        acceptableAnswers: [
          "J'ai quatorze livres.",
          "J'ai quatorze livres",
        ],
        direction: "to_target",
      },
      explanation: "'J'ai' (I have) + 'quatorze' (fourteen) + 'livres' (books).",
      hint: "'Quatorze' — you can hear 'quatre' (four) inside it.",
      difficulty: "HARD",
      xp_reward: 4,
      order_index: 7,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What is 8 + 9 in French?",
      content: {
        options: ["Quinze", "Seize", "Dix-sept", "Dix-huit"],
        correctIndex: 2,
      },
      explanation: "Huit (8) + neuf (9) = dix-sept (17).",
      difficulty: "HARD",
      xp_reward: 4,
      order_index: 8,
    },
    {
      exercise_type: "REORDER",
      question: "Put these numbers in order from smallest to largest:",
      content: {
        words: ["vingt", "onze", "seize", "treize", "dix-huit"],
        correctOrder: ["onze", "treize", "seize", "dix-huit", "vingt"],
        translation: "11, 13, 16, 18, 20",
      },
      explanation: "Onze (11), treize (13), seize (16), dix-huit (18), vingt (20).",
      difficulty: "HARD",
      xp_reward: 5,
      order_index: 9,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and select the number you hear:",
      content: {
        ttsText: "quinze",
        ttsLang: "fr-FR",
        options: ["Quatorze (14)", "Quinze (15)", "Cinq (5)", "Seize (16)"],
        correctIndex: 1,
      },
      explanation: "'Quinze' (pronounced 'kahnz') means fifteen.",
      difficulty: "HARD",
      xp_reward: 5,
      order_index: 10,
    },
  ],
};