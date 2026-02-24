// Course: French A1
// Unit: 1 - First Steps
// Lesson: 3 - Numbers 1-10

export const frenchA1U1L3 = {
  metadata: {
    course: "fr-a1",
    unit: 1,
    lesson: 3,
    title: "Numbers 1-10",
    slug: "numbers-1-10",
    type: "VOCABULARY",
    estimatedMinutes: 12,
    xpReward: 20,
  },
  content: {
    introduction: {
      text: "Numbers are everywhere — prices, phone numbers, addresses, and ages. In this lesson, you'll master the French numbers from 1 to 10. French numbers are straightforward at this stage, but pronunciation is key. Let's count!",
      image: "/images/lessons/numbers.svg",
      culturalNote:
        "🇫🇷 The French count on their fingers starting with the thumb! If you hold up your index finger to order 'one' coffee, a French waiter might bring you two — because the index finger signals 'two' in France.",
    },

    vocabulary: [
      {
        term: "Un",
        translation: "One (1)",
        pronunciation: "uhn",
        partOfSpeech: "noun",
        gender: "masculine",
        audio: "/audio/fr/un.mp3",
        exampleSentence: {
          original: "Un café, s'il vous plaît.",
          translation: "One coffee, please.",
        },
        tip: "'Un' is also the masculine indefinite article meaning 'a/an.'",
      },
      {
        term: "Deux",
        translation: "Two (2)",
        pronunciation: "duh",
        partOfSpeech: "noun",
        audio: "/audio/fr/deux.mp3",
        exampleSentence: {
          original: "J'ai deux frères.",
          translation: "I have two brothers.",
        },
        tip: "The 'x' is silent! Just say 'duh.'",
      },
      {
        term: "Trois",
        translation: "Three (3)",
        pronunciation: "twah",
        partOfSpeech: "noun",
        audio: "/audio/fr/trois.mp3",
        exampleSentence: {
          original: "Il y a trois chats.",
          translation: "There are three cats.",
        },
        tip: "The 'oi' in French always makes a 'wah' sound.",
      },
      {
        term: "Quatre",
        translation: "Four (4)",
        pronunciation: "KAH-truh",
        partOfSpeech: "noun",
        audio: "/audio/fr/quatre.mp3",
        exampleSentence: {
          original: "Quatre saisons dans l'année.",
          translation: "Four seasons in the year.",
        },
        tip: "The final 'e' is barely pronounced — it's almost 'katr.'",
      },
      {
        term: "Cinq",
        translation: "Five (5)",
        pronunciation: "sahnk",
        partOfSpeech: "noun",
        audio: "/audio/fr/cinq.mp3",
        exampleSentence: {
          original: "Cinq minutes, s'il vous plaît.",
          translation: "Five minutes, please.",
        },
        tip: "The 'q' is pronounced when the number stands alone, but silent before a consonant.",
      },
      {
        term: "Six",
        translation: "Six (6)",
        pronunciation: "sees",
        partOfSpeech: "noun",
        audio: "/audio/fr/six.mp3",
        exampleSentence: {
          original: "Il est six heures.",
          translation: "It is six o'clock.",
        },
        tip: "Pronounce the final 'x' as 's' when the number is alone. Before a consonant, the 'x' is silent.",
      },
      {
        term: "Sept",
        translation: "Seven (7)",
        pronunciation: "set",
        partOfSpeech: "noun",
        audio: "/audio/fr/sept.mp3",
        exampleSentence: {
          original: "Sept jours dans une semaine.",
          translation: "Seven days in a week.",
        },
        tip: "The 'p' is silent! Pronounce it like 'set.'",
      },
      {
        term: "Huit",
        translation: "Eight (8)",
        pronunciation: "weet",
        partOfSpeech: "noun",
        audio: "/audio/fr/huit.mp3",
        exampleSentence: {
          original: "J'ai huit ans.",
          translation: "I am eight years old.",
        },
        tip: "Starts with a 'w' sound. Think 'wheat' without the 'h.'",
      },
      {
        term: "Neuf",
        translation: "Nine (9)",
        pronunciation: "nuhf",
        partOfSpeech: "noun",
        audio: "/audio/fr/neuf.mp3",
        exampleSentence: {
          original: "Le bus numéro neuf.",
          translation: "Bus number nine.",
        },
        tip: "'Neuf' also means 'new' (brand new). Context tells you which meaning applies.",
      },
      {
        term: "Dix",
        translation: "Ten (10)",
        pronunciation: "dees",
        partOfSpeech: "noun",
        audio: "/audio/fr/dix.mp3",
        exampleSentence: {
          original: "Dix euros, s'il vous plaît.",
          translation: "Ten euros, please.",
        },
        tip: "Like 'six,' the 'x' sounds like 's' when alone, but is silent before a consonant.",
      },
    ],

    grammar: [
      {
        title: "Using Numbers in Everyday French",
        explanation:
          "French numbers 1–10 work similarly to English. Use them for counting, telling your age, stating prices, and giving phone numbers. One key difference: for age, French uses 'avoir' (to have), not 'être' (to be).",
        examples: [
          {
            original: "J'ai cinq livres.",
            translation: "I have five books.",
            breakdown: "J'ai (I have) + cinq (five) + livres (books)",
          },
          {
            original: "C'est trois euros.",
            translation: "It's three euros.",
            breakdown: "C'est (it is) + trois (three) + euros",
          },
          {
            original: "J'ai dix ans.",
            translation: "I am ten years old.",
            breakdown:
              "J'ai (I have) + dix (ten) + ans (years) — literally 'I have ten years'",
          },
        ],
        commonMistakes: [
          "❌ 'Je suis dix ans' — Don't use 'être' for age!",
          "✅ 'J'ai dix ans' — French 'has' years, not 'is' years old.",
        ],
      },
    ],

    dialogue: {
      title: "At the Market",
      context:
        "Clara is buying apples at a local market in Marseille.",
      image: "/images/dialogues/market.svg",
      lines: [
        {
          speaker: "Clara",
          text: "Bonjour ! Six pommes, s'il vous plaît.",
          translation: "Hello! Six apples, please.",
        },
        {
          speaker: "Vendeur",
          text: "Six pommes... voilà ! Trois euros.",
          translation: "Six apples... here you go! Three euros.",
        },
        {
          speaker: "Clara",
          text: "Et quatre oranges aussi, s'il vous plaît.",
          translation: "And four oranges too, please.",
        },
        {
          speaker: "Vendeur",
          text: "Quatre oranges, deux euros. Donc cinq euros en tout.",
          translation: "Four oranges, two euros. So five euros total.",
        },
        {
          speaker: "Clara",
          text: "Voilà cinq euros. Merci !",
          translation: "Here are five euros. Thank you!",
        },
        {
          speaker: "Vendeur",
          text: "Merci, bonne journée !",
          translation: "Thank you, have a nice day!",
        },
      ],
      comprehensionQuestions: [
        {
          question: "How many apples does Clara buy?",
          options: ["Four", "Five", "Six", "Eight"],
          correctIndex: 2,
        },
        {
          question: "How much does Clara pay in total?",
          options: ["Three euros", "Four euros", "Five euros", "Six euros"],
          correctIndex: 2,
        },
      ],
    },

    culture: {
      title: "French Numbers & Finger Counting",
      text: "Unlike many cultures that start counting with the index finger, the French start with the thumb. So 'one' is the thumb, 'two' is thumb + index finger, and so on. This can cause amusing misunderstandings — if you hold up your index finger to order one beer, you might get two!",
      image: "/images/culture/finger-counting.svg",
      funFact:
        "🖐️ This finger-counting difference was famously used as a plot point in the movie 'Inglourious Basterds' to identify a non-German spy!",
    },

    summary: {
      keyPoints: [
        "French numbers 1–10: un, deux, trois, quatre, cinq, six, sept, huit, neuf, dix",
        "Many final consonants are silent: 'sept' → 'set,' 'deux' → 'duh'",
        "Use 'J'ai... ans' (I have... years) for age, NOT 'Je suis... ans'",
        "'Un' doubles as both the number 'one' and the article 'a/an'",
        "Numbers 6 and 10 change pronunciation depending on what follows",
      ],
      practicePrompt:
        "Count from 1 to 10 in French five times today. Then try counting backwards! Time yourself and try to get faster.",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What is 'sept' in English?",
      content: {
        options: ["Six", "Seven", "Eight", "Nine"],
        correctIndex: 1,
      },
      explanation: "'Sept' (pronounced 'set') means 'seven.' The 'p' is silent.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "How do you say 'four' in French?",
      content: {
        options: ["Trois", "Cinq", "Quatre", "Quatorze"],
        correctIndex: 2,
      },
      explanation: "'Quatre' means 'four.' Don't confuse it with 'quatorze' which means 'fourteen.'",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the French numbers to the digits:",
      content: {
        pairs: [
          { left: "Trois", right: "3" },
          { left: "Sept", right: "7" },
          { left: "Un", right: "1" },
          { left: "Neuf", right: "9" },
          { left: "Cinq", right: "5" },
        ],
      },
      explanation: "Keep practicing until you can recognize these instantly!",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete the sequence: un, deux, _____, quatre, cinq",
      content: {
        sentence: "un, deux, _____, quatre, cinq",
        answer: "trois",
        options: ["trois", "six", "sept", "dix"],
        caseSensitive: false,
      },
      explanation: "The sequence is 1, 2, 3, 4, 5 — the missing number is 'trois' (three).",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "How would you say you are 8 years old?",
      content: {
        sentence: "J'ai _____ ans.",
        answer: "huit",
        options: ["huit", "six", "dix", "neuf"],
        caseSensitive: false,
      },
      explanation: "'J'ai huit ans' means 'I am eight years old.' Remember: French uses 'avoir' (to have) for age.",
      hint: "Which French number sounds like 'weet'?",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "How do you say 'I am 10 years old' in French?",
      content: {
        options: [
          "Je suis dix ans.",
          "J'ai dix ans.",
          "J'ai dix.",
          "Je suis dix.",
        ],
        correctIndex: 1,
      },
      explanation: "In French, you 'have' years, not 'are' years old. 'J'ai dix ans' — literally 'I have ten years.'",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 6,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'Five coffees, please.'",
      content: {
        correctAnswer: "Cinq cafés, s'il vous plaît.",
        acceptableAnswers: [
          "Cinq cafés, s'il vous plaît.",
          "Cinq cafés, s'il vous plaît",
          "Cinq cafés s'il vous plaît",
          "Cinq cafés, s'il vous plait.",
          "Cinq cafés, s'il te plaît.",
        ],
        direction: "to_target",
      },
      explanation: "'Cinq' (five) + 'cafés' (coffees) + 's'il vous plaît' (please).",
      hint: "Remember: 'cinq' = five, 'café' → 'cafés' (plural).",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 7,
    },
    {
      exercise_type: "REORDER",
      question: "Put the numbers in order from smallest to largest:",
      content: {
        words: ["sept", "deux", "neuf", "cinq", "un"],
        correctOrder: ["un", "deux", "cinq", "sept", "neuf"],
        translation: "1, 2, 5, 7, 9",
      },
      explanation: "Un (1), deux (2), cinq (5), sept (7), neuf (9).",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 8,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What is 3 + 4 in French?",
      content: {
        options: ["Six", "Sept", "Huit", "Cinq"],
        correctIndex: 1,
      },
      explanation: "Trois (3) + quatre (4) = sept (7).",
      difficulty: "HARD",
      xp_reward: 4,
      order_index: 9,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and select the number you hear:",
      content: {
        ttsText: "huit",
        ttsLang: "fr-FR",
        options: ["Cinq (5)", "Six (6)", "Huit (8)", "Neuf (9)"],
        correctIndex: 2,
      },
      explanation: "'Huit' (pronounced 'weet') means 'eight.'",
      difficulty: "HARD",
      xp_reward: 5,
      order_index: 10,
    },
  ],
};