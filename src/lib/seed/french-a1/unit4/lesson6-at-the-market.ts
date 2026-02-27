// Course: French A1
// Unit: 4 - Food & Drink
// Lesson: 6 - At the Market

export const frenchA1U4L6 = {
  metadata: {
    course: "fr-a1",
    unit: 4,
    lesson: 6,
    title: "At the Market",
    slug: "at-the-market",
    type: "CONVERSATION",
    estimatedMinutes: 18,
    xpReward: 25,
  },

  content: {
    introduction: {
      text: "French markets (les marchés) are a feast for the senses — colorful produce, fragrant cheeses, and lively vendors! In this lesson, you'll learn how to shop at a market: asking prices, requesting quantities, and interacting with vendors. It's where all your food vocabulary comes together!",
      culturalNote: "🇫🇷 Most French towns have a weekly market, and many cities have daily ones. Markets are social events — people chat, taste samples, and take their time. Vendors often remember regular customers! It's considered polite to greet with 'Bonjour', wait your turn, and not touch the produce unless invited.",
    },

    vocabulary: [
      {
        term: "le marché",
        translation: "the market",
        pronunciation: "luh mar-shay",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Je vais au marché le samedi matin.",
          translation: "I go to the market on Saturday morning.",
        },
        tip: "'Au marché' = at/to the market. Most markets are outdoors!",
      },
      {
        term: "le vendeur / la vendeuse",
        translation: "the vendor (m/f)",
        pronunciation: "luh vahn-duhr / lah vahn-duhz",
        partOfSpeech: "noun",
        gender: "masculine/feminine",
        exampleSentence: {
          original: "Le vendeur est très sympa.",
          translation: "The vendor is very nice.",
        },
        tip: "Use 'vendeur' for men, 'vendeuse' for women.",
      },
      {
        term: "c'est combien ?",
        translation: "how much is it?",
        pronunciation: "say kom-byan",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "C'est combien, les tomates ?",
          translation: "How much are the tomatoes?",
        },
        tip: "Most casual way to ask the price. Point and ask!",
      },
      {
        term: "ça coûte combien ?",
        translation: "how much does it cost?",
        pronunciation: "sah koot kom-byan",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Ça coûte combien, le kilo ?",
          translation: "How much does it cost per kilo?",
        },
        tip: "Slightly more formal than 'C'est combien?'",
      },
      {
        term: "... euros le kilo",
        translation: "... euros per kilo",
        pronunciation: "... uh-roh luh kee-loh",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Les pommes, c'est deux euros le kilo.",
          translation: "Apples are two euros per kilo.",
        },
        tip: "Most produce is priced by the kilo at markets.",
      },
      {
        term: "je voudrais...",
        translation: "I would like...",
        pronunciation: "zhuh voo-dreh",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Je voudrais un kilo de carottes.",
          translation: "I would like a kilo of carrots.",
        },
        tip: "The polite way to ask for something.",
      },
      {
        term: "je vais prendre...",
        translation: "I'll take...",
        pronunciation: "zhuh vay prahndr",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Je vais prendre deux kilos d'oranges.",
          translation: "I'll take two kilos of oranges.",
        },
        tip: "Casual but polite. Common after looking at options.",
      },
      {
        term: "et avec ceci ?",
        translation: "and with this? / anything else?",
        pronunciation: "ay ah-vek suh-see",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Et avec ceci ? — C'est tout, merci.",
          translation: "Anything else? — That's all, thank you.",
        },
        tip: "The vendor asks this to see if you want more. Also 'Et avec ça?'",
      },
      {
        term: "c'est tout",
        translation: "that's all",
        pronunciation: "say too",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "C'est tout, merci.",
          translation: "That's all, thank you.",
        },
        tip: "Say this when you're done ordering.",
      },
      {
        term: "ça fait...",
        translation: "that comes to... / that's...",
        pronunciation: "sah fay",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Ça fait cinq euros cinquante.",
          translation: "That's five euros fifty.",
        },
        tip: "Vendors use this to tell you the total.",
      },
      {
        term: "frais / fraîche",
        translation: "fresh (m/f)",
        pronunciation: "freh / fresh",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Ces légumes sont très frais.",
          translation: "These vegetables are very fresh.",
        },
        tip: "Masculine: frais. Feminine: fraîche. Important quality word!",
      },
      {
        term: "mûr / mûre",
        translation: "ripe (m/f)",
        pronunciation: "moor",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Ces bananes sont bien mûres.",
          translation: "These bananas are nice and ripe.",
        },
        tip: "You can ask: 'C'est mûr?' (Is it ripe?)",
      },
    ],

    grammar: [
      {
        title: "Shopping Dialogue Structure",
        explanation: "A market transaction follows a predictable pattern: greeting → asking what you want → specifying quantity → asking if you want more → telling the price → thanking and leaving. Knowing this flow makes shopping easy!",
        examples: [
          {
            original: "Bonjour ! Je voudrais un kilo de pommes.",
            translation: "Hello! I would like a kilo of apples.",
            breakdown: "Greeting + request with quantity",
          },
          {
            original: "Et avec ceci ? — C'est tout, merci.",
            translation: "Anything else? — That's all, thank you.",
            breakdown: "Vendor's question + your response",
          },
          {
            original: "Ça fait trois euros. — Voilà, merci !",
            translation: "That's three euros. — Here you go, thanks!",
            breakdown: "Price + payment + thanks",
          },
        ],
        commonMistakes: [
          "❌ Starting without 'Bonjour' — Very rude!",
          "✅ Always say 'Bonjour' before anything else.",
          "❌ Touching produce without asking",
          "✅ Ask first or let the vendor choose for you.",
          "❌ 'Donnez-moi...' — Sounds demanding!",
          "✅ 'Je voudrais...' or 'Je vais prendre...' — Polite requests.",
        ],
      },
    ],

    dialogue: {
      title: "Au marché",
      context: "Sophie is buying fruits and vegetables at her local market.",
      lines: [
        {
          speaker: "Vendeur",
          text: "Bonjour madame ! Qu'est-ce que je vous sers ?",
          translation: "Hello ma'am! What can I get you?",
        },
        {
          speaker: "Sophie",
          text: "Bonjour ! C'est combien, les fraises ?",
          translation: "Hello! How much are the strawberries?",
        },
        {
          speaker: "Vendeur",
          text: "Les fraises, c'est quatre euros la barquette. Elles sont très fraîches !",
          translation: "Strawberries are four euros per container. They're very fresh!",
        },
        {
          speaker: "Sophie",
          text: "D'accord. Je vais prendre une barquette. Et je voudrais aussi un kilo de tomates.",
          translation: "Okay. I'll take one container. And I would also like a kilo of tomatoes.",
        },
        {
          speaker: "Vendeur",
          text: "Voilà, un kilo de tomates. Et avec ceci ?",
          translation: "Here you go, a kilo of tomatoes. Anything else?",
        },
        {
          speaker: "Sophie",
          text: "Euh... oui, une salade verte, s'il vous plaît.",
          translation: "Um... yes, a head of lettuce, please.",
        },
        {
          speaker: "Vendeur",
          text: "Voilà ! C'est tout ?",
          translation: "Here you go! Is that all?",
        },
        {
          speaker: "Sophie",
          text: "Oui, c'est tout. Ça fait combien ?",
          translation: "Yes, that's all. How much is it?",
        },
        {
          speaker: "Vendeur",
          text: "Alors... ça fait sept euros cinquante.",
          translation: "So... that comes to seven euros fifty.",
        },
        {
          speaker: "Sophie",
          text: "Voilà. Merci, bonne journée !",
          translation: "Here you go. Thank you, have a good day!",
        },
      ],
      comprehensionQuestions: [
        {
          question: "How much are the strawberries?",
          options: ["€3 per container", "€4 per container", "€5 per kilo", "€4 per kilo"],
          correctIndex: 1,
        },
        {
          question: "What is the total amount Sophie pays?",
          options: ["€6.50", "€7.00", "€7.50", "€8.00"],
          correctIndex: 2,
        },
      ],
    },

    culture: {
      title: "French Market Etiquette",
      text: "Markets have unwritten rules! Always say 'Bonjour' before speaking. Don't touch the produce — vendors will select items for you (they're experts at choosing the best!). If you want to taste, ask 'Je peux goûter?' Wait your turn patiently — sometimes there's a line system with numbers. Bring your own bag (un sac) — plastic bags are mostly banned in France. And don't haggle — prices are fixed, unlike in some countries!",
      funFact: "🍅 The most famous market in Paris is the Marché d'Aligre, dating back to 1779! It's one of the cheapest markets in Paris and runs every day except Monday. Parisians wake up early to get the best produce before it sells out!",
    },

    summary: {
      keyPoints: [
        "Always start with 'Bonjour !' — never skip the greeting",
        "'C'est combien ?' or 'Ça coûte combien ?' — asking prices",
        "'Je voudrais...' or 'Je vais prendre...' — making requests",
        "'Et avec ceci ?' — vendor asking if you want more",
        "'C'est tout, merci' — when you're done ordering",
        "'Ça fait...' — the total price",
        "Don't touch produce — let the vendor choose for you!",
      ],
      practicePrompt: "Role-play a market scene! Practice the full dialogue: greeting, asking prices, ordering quantities, and paying. Try to do the whole transaction smoothly!",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What should you ALWAYS say first when approaching a vendor?",
      content: {
        options: [
          "Bonjour !",
          "C'est combien ?",
          "Je voudrais...",
          "Merci",
        ],
        correctIndex: 0,
      },
      hint: "This is essential French politeness",
      explanation: "ALWAYS say 'Bonjour !' first. Starting without a greeting is considered very rude in France!",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "How do you ask 'How much is it?' in French?",
      content: {
        options: [
          "C'est combien ?",
          "C'est comment ?",
          "C'est quoi ?",
          "C'est où ?",
        ],
        correctIndex: 0,
      },
      hint: "'Combien' relates to quantity/price",
      explanation: "'C'est combien?' = How much is it? Essential for shopping!",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the French market phrases with their meanings:",
      content: {
        pairs: [
          { left: "C'est combien ?", right: "How much is it?" },
          { left: "Et avec ceci ?", right: "Anything else?" },
          { left: "C'est tout", right: "That's all" },
          { left: "Ça fait...", right: "That comes to..." },
          { left: "Je vais prendre", right: "I'll take" },
        ],
      },
      hint: "Think about the flow of a market conversation",
      explanation: "These phrases follow the natural order of a market transaction!",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Les tomates, c'est deux euros _____ kilo. (per)",
      content: {
        sentence: "Les tomates, c'est deux euros _____ kilo.",
        answer: "le",
        options: ["le", "la", "un", "de"],
        caseSensitive: false,
      },
      hint: "How do you express 'per' in French?",
      explanation: "'... euros le kilo' = per kilo. 'Le' is used to mean 'per' with quantities.",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Et avec _____ ? — C'est tout, merci. (this)",
      content: {
        sentence: "Et avec _____ ? — C'est tout, merci.",
        answer: "ceci",
        options: ["ceci", "cela", "ça", "ce"],
        caseSensitive: false,
      },
      hint: "The vendor uses a formal word for 'this'",
      explanation: "'Et avec ceci ?' is the formal way vendors ask if you want anything else. 'Et avec ça ?' is more casual.",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'I would like a kilo of apples, please.'",
      content: {
        correctAnswer: "Je voudrais un kilo de pommes, s'il vous plaît.",
        acceptableAnswers: [
          "Je voudrais un kilo de pommes, s'il vous plaît.",
          "Je voudrais un kilo de pommes, s'il vous plaît",
          "Je voudrais un kilo de pommes s'il vous plaît",
        ],
        direction: "to_target",
      },
      hint: "Use 'je voudrais' + quantity + 'de' + fruit",
      explanation: "Perfect market ordering structure: 'Je voudrais + un kilo de + pommes'.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 6,
    },
    {
      exercise_type: "REORDER",
      question: "Put the words in order: combien / fait / ça / ?",
      content: {
        words: ["combien", "fait", "ça", "?"],
        correctOrder: ["ça", "fait", "combien", "?"],
        translation: "How much is it? (total)",
      },
      hint: "'Ça fait...' is how the vendor tells you the price",
      explanation: "'Ça fait combien ?' = How much is it? / What's the total?",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 7,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and identify the price:",
      content: {
        ttsText: "Alors, ça fait six euros vingt-cinq.",
        ttsLang: "fr-FR",
        options: [
          "€6.25",
          "€6.50",
          "€5.25",
          "€7.25",
        ],
        correctIndex: 0,
      },
      hint: "Listen for 'six euros' and 'vingt-cinq' (25)",
      explanation: "'Six euros vingt-cinq' = €6.25. 'Vingt-cinq' means 25 (centimes).",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 8,
    },
    {
      exercise_type: "SPEAK",
      question: "Ask the vendor: 'How much are the tomatoes?'",
      content: {
        targetText: "C'est combien, les tomates ?",
        targetTranslation: "How much are the tomatoes?",
        acceptableVariants: [
          "C'est combien les tomates",
          "Les tomates, c'est combien",
          "Ça coûte combien, les tomates",
        ],
      },
      hint: "Use 'C'est combien' and specify what you're asking about",
      explanation: "'C'est combien, les tomates ?' — point and ask!",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 9,
    },
    {
      exercise_type: "SPEAK",
      question: "Tell the vendor: 'That's all, thank you.'",
      content: {
        targetText: "C'est tout, merci.",
        targetTranslation: "That's all, thank you.",
        acceptableVariants: [
          "C'est tout merci",
          "C'est tout, merci",
          "Merci, c'est tout",
        ],
      },
      hint: "This phrase signals you're done ordering",
      explanation: "'C'est tout, merci' — essential for ending your order politely!",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 10,
    },
  ],
};
