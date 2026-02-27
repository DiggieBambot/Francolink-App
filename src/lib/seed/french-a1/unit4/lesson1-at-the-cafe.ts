// Course: French A1
// Unit: 4 - Food & Drink
// Lesson: 1 - At the Café

export const frenchA1U4L1 = {
  metadata: {
    course: "fr-a1",
    unit: 4,
    lesson: 1,
    title: "At the Café",
    slug: "at-the-cafe",
    type: "VOCABULARY",
    estimatedMinutes: 15,
    xpReward: 20,
  },

  content: {
    introduction: {
      text: "The café is the heart of French social life! Whether it's a morning espresso, an afternoon drink with friends, or people-watching from a terrace, knowing how to order at a café is essential. In this lesson, you'll learn drink vocabulary and basic ordering phrases.",
      culturalNote: "🇫🇷 In France, cafés are more than just coffee shops — they're living rooms! It's perfectly normal to sit for hours with just one coffee. The price is often higher if you sit on the terrace (la terrasse) versus standing at the bar (le comptoir). And never rush — the waiter won't bring the bill until you ask!",
    },

    vocabulary: [
      {
        term: "un café",
        translation: "a coffee (espresso)",
        pronunciation: "uhn kah-fay",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Un café, s'il vous plaît.",
          translation: "A coffee, please.",
        },
        tip: "In France, 'un café' means espresso by default — small and strong! For American-style, ask for 'un café allongé'.",
      },
      {
        term: "un café crème",
        translation: "a coffee with cream/milk",
        pronunciation: "uhn kah-fay krem",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Je voudrais un café crème.",
          translation: "I would like a coffee with cream.",
        },
        tip: "The French morning coffee! Similar to a latte. Also called 'un crème' for short.",
      },
      {
        term: "un thé",
        translation: "a tea",
        pronunciation: "uhn tay",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Un thé au citron, s'il vous plaît.",
          translation: "A tea with lemon, please.",
        },
        tip: "Common variations: 'thé au citron' (lemon), 'thé au lait' (milk), 'thé vert' (green).",
      },
      {
        term: "un chocolat chaud",
        translation: "a hot chocolate",
        pronunciation: "uhn shoh-koh-lah shoh",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Les enfants adorent le chocolat chaud.",
          translation: "Children love hot chocolate.",
        },
        tip: "French hot chocolate is thick and rich — often made with real melted chocolate!",
      },
      {
        term: "un jus d'orange",
        translation: "an orange juice",
        pronunciation: "uhn zhoo doh-rahnzh",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Un jus d'orange pressé, s'il vous plaît.",
          translation: "A fresh-squeezed orange juice, please.",
        },
        tip: "'Pressé' means fresh-squeezed. Without it, you might get juice from concentrate.",
      },
      {
        term: "une eau minérale",
        translation: "a mineral water",
        pronunciation: "oon oh mee-nay-rahl",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Une eau minérale, plate ou gazeuse ?",
          translation: "A mineral water, still or sparkling?",
        },
        tip: "'Plate' = still water, 'gazeuse' = sparkling. You'll always be asked!",
      },
      {
        term: "une bière",
        translation: "a beer",
        pronunciation: "oon byair",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Une bière pression, s'il vous plaît.",
          translation: "A draft beer, please.",
        },
        tip: "'Pression' = draft/on tap, 'en bouteille' = bottled. 'Un demi' = a half-pint.",
      },
      {
        term: "un verre de vin",
        translation: "a glass of wine",
        pronunciation: "uhn vair duh van",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Un verre de vin rouge, s'il vous plaît.",
          translation: "A glass of red wine, please.",
        },
        tip: "'Vin rouge' = red, 'vin blanc' = white, 'vin rosé' = rosé.",
      },
      {
        term: "l'addition",
        translation: "the bill/check",
        pronunciation: "lah-dee-syon",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "L'addition, s'il vous plaît.",
          translation: "The bill, please.",
        },
        tip: "The waiter will NEVER bring this automatically. You must ask!",
      },
      {
        term: "s'il vous plaît",
        translation: "please (formal)",
        pronunciation: "seel voo pleh",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Un café, s'il vous plaît.",
          translation: "A coffee, please.",
        },
        tip: "Essential politeness! Use 's'il te plaît' with friends/family (informal).",
      },
      {
        term: "je voudrais",
        translation: "I would like",
        pronunciation: "zhuh voo-dreh",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Je voudrais un thé, s'il vous plaît.",
          translation: "I would like a tea, please.",
        },
        tip: "More polite than 'je veux' (I want). Always use this when ordering!",
      },
      {
        term: "c'est combien ?",
        translation: "how much is it?",
        pronunciation: "say kom-byan",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Un café, c'est combien ?",
          translation: "How much is a coffee?",
        },
        tip: "Useful for checking prices before ordering or paying.",
      },
    ],

    grammar: [
      {
        title: "Ordering with 'Je voudrais' + Un/Une",
        explanation: "When ordering, use 'Je voudrais' (I would like) followed by the indefinite article 'un' (masculine) or 'une' (feminine) and the item. This is polite and natural.",
        examples: [
          {
            original: "Je voudrais un café.",
            translation: "I would like a coffee.",
            breakdown: "Je voudrais (I would like) + un (a, masc.) + café (coffee)",
          },
          {
            original: "Je voudrais une bière.",
            translation: "I would like a beer.",
            breakdown: "Je voudrais (I would like) + une (a, fem.) + bière (beer)",
          },
          {
            original: "Je voudrais un verre de vin blanc.",
            translation: "I would like a glass of white wine.",
            breakdown: "Un verre de (a glass of) + vin blanc (white wine)",
          },
        ],
        commonMistakes: [
          "❌ 'Je veux un café' — Sounds demanding/rude!",
          "✅ 'Je voudrais un café' — Polite and proper for ordering.",
          "❌ 'Un café' (alone, no greeting) — Too abrupt!",
          "✅ 'Bonjour ! Un café, s'il vous plaît.' — Always greet first!",
          "❌ 'Je voudrais le café' — 'Le' is wrong here!",
          "✅ 'Je voudrais un café' — Use 'un/une' when ordering one of something.",
        ],
      },
    ],

    dialogue: {
      title: "Au café",
      context: "Sophie stops at a café terrace in Paris for a morning coffee.",
      lines: [
        {
          speaker: "Serveur",
          text: "Bonjour ! Qu'est-ce que je vous sers ?",
          translation: "Hello! What can I get you?",
        },
        {
          speaker: "Sophie",
          text: "Bonjour ! Je voudrais un café crème, s'il vous plaît.",
          translation: "Hello! I would like a coffee with cream, please.",
        },
        {
          speaker: "Serveur",
          text: "Un café crème. Et avec ça ?",
          translation: "A coffee with cream. And with that?",
        },
        {
          speaker: "Sophie",
          text: "C'est tout, merci.",
          translation: "That's all, thank you.",
        },
        {
          speaker: "Serveur",
          text: "Très bien. Je vous apporte ça tout de suite.",
          translation: "Very well. I'll bring that right away.",
        },
        {
          speaker: "Sophie",
          text: "Merci ! ... Excusez-moi, l'addition, s'il vous plaît.",
          translation: "Thank you! ... Excuse me, the bill, please.",
        },
      ],
      comprehensionQuestions: [
        {
          question: "What does Sophie order?",
          options: ["A tea", "A black coffee", "A coffee with cream", "An orange juice"],
          correctIndex: 2,
        },
        {
          question: "What does Sophie say when she's finished ordering?",
          options: ["Et avec ça ?", "C'est tout, merci", "L'addition", "Je voudrais"],
          correctIndex: 1,
        },
      ],
    },

    culture: {
      title: "French Café Culture",
      text: "The café is central to French life! Parisians often start their day with 'un petit café' at the zinc counter (le comptoir). Sitting on the terrace to watch the world go by is a beloved tradition — you're paying for the experience, not just the coffee! Tipping isn't expected (service is included), but rounding up or leaving small change is appreciated. And remember: the waiter isn't ignoring you, they're giving you space to enjoy!",
      funFact: "☕ French café culture is so important that Les Deux Magots and Café de Flore in Paris were the 'offices' of famous writers like Hemingway, Sartre, and Simone de Beauvoir. A coffee bought you a seat for hours of writing!",
    },

    summary: {
      keyPoints: [
        "Use 'Je voudrais + un/une + item' to order politely",
        "Always say 'Bonjour!' before ordering — it's essential!",
        "'Un café' = espresso (small, strong). For American-style: 'un café allongé'",
        "Water options: 'plate' (still) or 'gazeuse' (sparkling)",
        "Ask for the bill: 'L'addition, s'il vous plaît' — it won't come automatically!",
        "'C'est tout, merci' = That's all, thank you (when done ordering)",
      ],
      practicePrompt: "Imagine you're at a Parisian café. Practice ordering out loud: 'Bonjour ! Je voudrais un café crème, s'il vous plaît.' Then try ordering different drinks!",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "How do you politely say 'I would like' when ordering?",
      content: {
        options: [
          "Je voudrais",
          "Je veux",
          "Je prends",
          "Je demande",
        ],
        correctIndex: 0,
      },
      hint: "One option is more polite and conditional...",
      explanation: "'Je voudrais' (I would like) is the polite form for ordering. 'Je veux' (I want) sounds demanding.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What is 'a beer' in French?",
      content: {
        options: [
          "une bière",
          "un bière",
          "une café",
          "un vin",
        ],
        correctIndex: 0,
      },
      hint: "'Bière' is feminine, so it needs 'une'",
      explanation: "'Bière' is feminine → 'une bière'. Gender matters with articles!",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the French drinks with their translations:",
      content: {
        pairs: [
          { left: "un café", right: "a coffee (espresso)" },
          { left: "un thé", right: "a tea" },
          { left: "une bière", right: "a beer" },
          { left: "un jus d'orange", right: "an orange juice" },
          { left: "une eau minérale", right: "a mineral water" },
        ],
      },
      hint: "Think about what you'd order at a café",
      explanation: "These are essential café drinks vocabulary!",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Je _____ un café, s'il vous plaît.",
      content: {
        sentence: "Je _____ un café, s'il vous plaît.",
        answer: "voudrais",
        options: ["voudrais", "veux", "suis", "ai"],
        caseSensitive: false,
      },
      hint: "Use the polite conditional form",
      explanation: "'Je voudrais' is the polite way to order. Essential for cafés and restaurants!",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: L'_____, s'il vous plaît. (The bill, please)",
      content: {
        sentence: "L'_____, s'il vous plaît.",
        answer: "addition",
        options: ["addition", "café", "eau", "bière"],
        caseSensitive: false,
      },
      hint: "What do you ask for when you're ready to pay?",
      explanation: "'L'addition' is the bill. You must ask for it — it won't come automatically!",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'I would like a tea, please.'",
      content: {
        correctAnswer: "Je voudrais un thé, s'il vous plaît.",
        acceptableAnswers: [
          "Je voudrais un thé, s'il vous plaît.",
          "Je voudrais un thé, s'il vous plaît",
          "Je voudrais un thé s'il vous plaît",
        ],
        direction: "to_target",
      },
      hint: "'Tea' is masculine (un thé), and use 'je voudrais' for politeness",
      explanation: "'Je voudrais' + 'un thé' (masculine) + 's'il vous plaît' = perfect order!",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 6,
    },
    {
      exercise_type: "REORDER",
      question: "Put the words in order to make an order:",
      content: {
        words: ["s'il vous plaît", "un", "voudrais", "café", "je"],
        correctOrder: ["je", "voudrais", "un", "café", "s'il vous plaît"],
        translation: "I would like a coffee, please",
      },
      hint: "Start with the subject, then the verb, then what you want, then please",
      explanation: "'Je voudrais un café, s'il vous plaît' — the standard ordering structure.",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 7,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and select what the person orders:",
      content: {
        ttsText: "Je voudrais un café crème et un jus d'orange, s'il vous plaît.",
        ttsLang: "fr-FR",
        options: [
          "A coffee with cream and an orange juice",
          "A tea and a beer",
          "A black coffee and water",
          "A hot chocolate and a coffee",
        ],
        correctIndex: 0,
      },
      hint: "Listen for 'café crème' and 'jus d'orange'",
      explanation: "'Un café crème et un jus d'orange' = a coffee with cream and an orange juice.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 8,
    },
    {
      exercise_type: "SPEAK",
      question: "Order a coffee at a café (include greeting and please):",
      content: {
        targetText: "Bonjour ! Je voudrais un café, s'il vous plaît.",
        targetTranslation: "Hello! I would like a coffee, please.",
        acceptableVariants: [
          "Bonjour, je voudrais un café, s'il vous plaît",
          "Bonjour ! Un café, s'il vous plaît",
          "Bonjour, un café s'il vous plaît",
        ],
      },
      hint: "Always start with 'Bonjour!' in France",
      explanation: "Starting with 'Bonjour!' is essential French politeness. Never skip it!",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 9,
    },
    {
      exercise_type: "SPEAK",
      question: "Ask for the bill in French:",
      content: {
        targetText: "L'addition, s'il vous plaît.",
        targetTranslation: "The bill, please.",
        acceptableVariants: [
          "L'addition, s'il vous plaît",
          "L'addition s'il vous plaît",
          "Je voudrais l'addition, s'il vous plaît",
        ],
      },
      hint: "Use 'l'addition' for the bill",
      explanation: "'L'addition, s'il vous plaît' — you'll use this every time you eat out!",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 10,
    },
  ],
};
