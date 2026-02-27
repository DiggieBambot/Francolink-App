// Course: French A1
// Unit: 4 - Food & Drink
// Lesson: 3 - At the Restaurant

export const frenchA1U4L3 = {
  metadata: {
    course: "fr-a1",
    unit: 4,
    lesson: 3,
    title: "At the Restaurant",
    slug: "at-the-restaurant",
    type: "CONVERSATION",
    estimatedMinutes: 18,
    xpReward: 25,
  },

  content: {
    introduction: {
      text: "Dining out in France is an experience! In this lesson, you'll learn essential restaurant phrases — from getting a table to ordering food to asking for the bill. Master these and you'll feel confident in any French restaurant.",
      culturalNote: "🇫🇷 French restaurants operate differently than many countries! Lunch service is usually 12-2 PM, dinner from 7:30-10 PM. Don't expect to walk in at 3 PM and order a full meal — the kitchen will be closed! Also, water and bread are free and will come automatically. Tipping isn't expected (service is included), but rounding up is appreciated.",
    },

    vocabulary: [
      {
        term: "une table pour deux",
        translation: "a table for two",
        pronunciation: "oon tahbl poor duh",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Bonjour, une table pour deux, s'il vous plaît.",
          translation: "Hello, a table for two, please.",
        },
        tip: "Change the number as needed: 'pour trois' (for 3), 'pour quatre' (for 4).",
      },
      {
        term: "la carte",
        translation: "the menu",
        pronunciation: "lah kart",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Est-ce que je peux avoir la carte ?",
          translation: "Can I have the menu?",
        },
        tip: "'La carte' is the full menu. 'Le menu' is actually a fixed-price set meal!",
      },
      {
        term: "le menu",
        translation: "set menu / fixed-price meal",
        pronunciation: "luh muh-noo",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Je prends le menu à 25 euros.",
          translation: "I'll have the 25 euro set menu.",
        },
        tip: "False friend alert! 'Le menu' = set meal with multiple courses at a fixed price.",
      },
      {
        term: "l'entrée",
        translation: "starter / appetizer",
        pronunciation: "lon-tray",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Comme entrée, je voudrais la soupe.",
          translation: "For starter, I would like the soup.",
        },
        tip: "False friend! In French, 'entrée' is the starter, NOT the main course!",
      },
      {
        term: "le plat principal",
        translation: "main course",
        pronunciation: "luh plah pran-see-pahl",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Le plat principal est excellent.",
          translation: "The main course is excellent.",
        },
        tip: "Often shortened to just 'le plat'. This is the main dish.",
      },
      {
        term: "le dessert",
        translation: "dessert",
        pronunciation: "luh day-sair",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Qu'est-ce que vous avez comme dessert ?",
          translation: "What do you have for dessert?",
        },
        tip: "Dessert comes AFTER the cheese course in a traditional French meal!",
      },
      {
        term: "je prends",
        translation: "I'll have / I'm taking",
        pronunciation: "zhuh prahn",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Je prends le poulet rôti.",
          translation: "I'll have the roast chicken.",
        },
        tip: "Common way to order. 'Prendre' (to take) is used like 'to have' for food.",
      },
      {
        term: "qu'est-ce que vous recommandez ?",
        translation: "what do you recommend?",
        pronunciation: "kess kuh voo ruh-koh-mahn-day",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Qu'est-ce que vous recommandez aujourd'hui ?",
          translation: "What do you recommend today?",
        },
        tip: "Great way to get insider tips on the best dishes!",
      },
      {
        term: "c'est délicieux",
        translation: "it's delicious",
        pronunciation: "say day-lee-syuh",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Ce plat est délicieux !",
          translation: "This dish is delicious!",
        },
        tip: "Compliment the chef! French people love hearing their food is appreciated.",
      },
      {
        term: "l'addition, s'il vous plaît",
        translation: "the bill, please",
        pronunciation: "lah-dee-syon seel voo pleh",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Excusez-moi, l'addition, s'il vous plaît.",
          translation: "Excuse me, the bill, please.",
        },
        tip: "You MUST ask — the waiter will never bring it automatically!",
      },
      {
        term: "est-ce que je peux... ?",
        translation: "can I... ? / may I... ?",
        pronunciation: "ess kuh zhuh puh",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Est-ce que je peux avoir de l'eau ?",
          translation: "Can I have some water?",
        },
        tip: "Polite way to make requests. Very useful in restaurants!",
      },
      {
        term: "réserver",
        translation: "to reserve / to book",
        pronunciation: "ray-zair-vay",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Je voudrais réserver une table pour ce soir.",
          translation: "I would like to reserve a table for tonight.",
        },
        tip: "Reservations are recommended for nice restaurants, especially on weekends.",
      },
    ],

    grammar: [
      {
        title: "Ordering Food: Key Structures",
        explanation: "When ordering in a restaurant, you have several polite options. 'Je voudrais' (I would like) is very polite, 'Je prends' (I'll have) is standard, and 'Pour moi' (For me) is casual but acceptable.",
        examples: [
          {
            original: "Je voudrais le steak, s'il vous plaît.",
            translation: "I would like the steak, please.",
            breakdown: "Je voudrais (very polite) + le steak + s'il vous plaît",
          },
          {
            original: "Je prends le poisson du jour.",
            translation: "I'll have the fish of the day.",
            breakdown: "Je prends (standard) + le poisson du jour (fish of the day)",
          },
          {
            original: "Pour moi, la salade niçoise.",
            translation: "For me, the niçoise salad.",
            breakdown: "Pour moi (for me) + the dish — casual but common",
          },
        ],
        commonMistakes: [
          "❌ 'Je veux le steak' — Sounds demanding!",
          "✅ 'Je voudrais le steak' — Polite and proper.",
          "❌ 'Donnez-moi le steak' — Very rude!",
          "✅ 'Je prends le steak, s'il vous plaît' — Standard and polite.",
          "❌ Forgetting 'Bonjour' — Always greet first!",
          "✅ 'Bonjour ! Je voudrais...' — Proper French etiquette.",
        ],
      },
    ],

    dialogue: {
      title: "Au restaurant",
      context: "Julie and Marc are having dinner at a French restaurant.",
      lines: [
        {
          speaker: "Serveur",
          text: "Bonsoir ! Vous avez réservé ?",
          translation: "Good evening! Do you have a reservation?",
        },
        {
          speaker: "Marc",
          text: "Oui, une réservation au nom de Dupont pour deux personnes.",
          translation: "Yes, a reservation under the name Dupont for two people.",
        },
        {
          speaker: "Serveur",
          text: "Parfait, suivez-moi. Voici la carte.",
          translation: "Perfect, follow me. Here's the menu.",
        },
        {
          speaker: "Julie",
          text: "Merci. Qu'est-ce que vous recommandez ?",
          translation: "Thank you. What do you recommend?",
        },
        {
          speaker: "Serveur",
          text: "Le poisson du jour est excellent. Et notre spécialité, c'est le canard.",
          translation: "The fish of the day is excellent. And our specialty is the duck.",
        },
        {
          speaker: "Julie",
          text: "Je prends le poisson, alors. Et comme entrée, la soupe à l'oignon.",
          translation: "I'll have the fish, then. And for starter, the onion soup.",
        },
        {
          speaker: "Marc",
          text: "Pour moi, le canard avec des légumes, s'il vous plaît.",
          translation: "For me, the duck with vegetables, please.",
        },
        {
          speaker: "Serveur",
          text: "Très bien. Et comme boisson ?",
          translation: "Very well. And to drink?",
        },
      ],
      comprehensionQuestions: [
        {
          question: "What is the restaurant's specialty?",
          options: ["Fish", "Duck", "Steak", "Chicken"],
          correctIndex: 1,
        },
        {
          question: "What does Julie order for her starter?",
          options: ["Salad", "Soup", "Bread", "Nothing"],
          correctIndex: 1,
        },
      ],
    },

    culture: {
      title: "French Restaurant Etiquette",
      text: "Dining in France follows unwritten rules! Always say 'Bonjour' or 'Bonsoir' when entering. Wait to be seated — don't grab a table yourself. Bread is for eating with your meal, not as an appetizer with butter (that's American!). Keep your hands on the table, not in your lap. And never ask for a 'doggy bag' — it's considered gauche, though attitudes are changing for environmental reasons.",
      funFact: "🍽️ The word 'restaurant' comes from French! In 1765, a Parisian soup vendor named Boulanger put up a sign saying his soups would 'restore' (restaurer) people. The first true restaurant, La Grande Taverne de Londres, opened in Paris in 1782 — with individual tables and a menu to choose from!",
    },

    summary: {
      keyPoints: [
        "'La carte' = the menu. 'Le menu' = set meal (false friend!)",
        "'L'entrée' = starter (not main course — another false friend!)",
        "Order politely: 'Je voudrais...' or 'Je prends...'",
        "Ask recommendations: 'Qu'est-ce que vous recommandez ?'",
        "Request the bill: 'L'addition, s'il vous plaît' — it won't come automatically!",
        "Always greet with 'Bonjour/Bonsoir' before anything else",
      ],
      practicePrompt: "Practice a full restaurant scenario: greeting, asking for a table, ordering a starter and main course, and asking for the bill. Say each phrase out loud!",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What does 'la carte' mean in a French restaurant?",
      content: {
        options: [
          "The menu (à la carte)",
          "The credit card",
          "The set meal",
          "The bill",
        ],
        correctIndex: 0,
      },
      hint: "It's what you read to choose your food",
      explanation: "'La carte' is the menu. 'Le menu' is actually a set meal — a common false friend!",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What is 'l'entrée' in French?",
      content: {
        options: [
          "The starter/appetizer",
          "The main course",
          "The entrance",
          "The dessert",
        ],
        correctIndex: 0,
      },
      hint: "This is a false friend compared to English!",
      explanation: "In French, 'l'entrée' is the starter, NOT the main course! The main course is 'le plat principal'.",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the French restaurant phrases with their meanings:",
      content: {
        pairs: [
          { left: "la carte", right: "the menu" },
          { left: "l'entrée", right: "starter" },
          { left: "le plat principal", right: "main course" },
          { left: "l'addition", right: "the bill" },
          { left: "je prends", right: "I'll have" },
        ],
      },
      hint: "Think about the order of a meal",
      explanation: "These are essential restaurant vocabulary words!",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Je _____ le poulet rôti, s'il vous plaît. (I'll have)",
      content: {
        sentence: "Je _____ le poulet rôti, s'il vous plaît.",
        answer: "prends",
        options: ["prends", "voudrais", "mange", "bois"],
        caseSensitive: false,
      },
      hint: "'Prendre' (to take) is commonly used when ordering",
      explanation: "'Je prends' (I'll have/I'm taking) is standard for ordering food.",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Qu'est-ce que vous _____ ? (What do you recommend?)",
      content: {
        sentence: "Qu'est-ce que vous _____ ?",
        answer: "recommandez",
        options: ["recommandez", "mangez", "prenez", "voulez"],
        caseSensitive: false,
      },
      hint: "Asking for the waiter's suggestion",
      explanation: "'Recommander' = to recommend. 'Qu'est-ce que vous recommandez?' is very useful!",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'A table for two, please.'",
      content: {
        correctAnswer: "Une table pour deux, s'il vous plaît.",
        acceptableAnswers: [
          "Une table pour deux, s'il vous plaît.",
          "Une table pour deux, s'il vous plaît",
          "Une table pour deux s'il vous plaît",
        ],
        direction: "to_target",
      },
      hint: "Table is feminine (une), and 'for' = 'pour'",
      explanation: "'Une table pour deux' — change the number as needed for your party size!",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 6,
    },
    {
      exercise_type: "REORDER",
      question: "Put the words in order to order food:",
      content: {
        words: ["s'il vous plaît", "le", "voudrais", "poisson", "je"],
        correctOrder: ["je", "voudrais", "le", "poisson", "s'il vous plaît"],
        translation: "I would like the fish, please",
      },
      hint: "Subject + voudrais + article + food + please",
      explanation: "'Je voudrais le poisson, s'il vous plaît' — polite ordering structure.",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 7,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and identify what the waiter recommends:",
      content: {
        ttsText: "Je vous recommande le canard, c'est notre spécialité.",
        ttsLang: "fr-FR",
        options: [
          "Duck, it's their specialty",
          "Fish, it's fresh today",
          "Chicken, it's popular",
          "Steak, it's the best",
        ],
        correctIndex: 0,
      },
      hint: "Listen for 'canard' and 'spécialité'",
      explanation: "'Le canard' = duck. 'C'est notre spécialité' = it's our specialty.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 8,
    },
    {
      exercise_type: "SPEAK",
      question: "Ask the waiter: 'What do you recommend?'",
      content: {
        targetText: "Qu'est-ce que vous recommandez ?",
        targetTranslation: "What do you recommend?",
        acceptableVariants: [
          "Qu'est-ce que vous recommandez",
          "Que recommandez-vous",
          "Vous recommandez quoi",
        ],
      },
      hint: "Start with 'Qu'est-ce que vous...'",
      explanation: "This phrase helps you discover the best dishes at any restaurant!",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 9,
    },
    {
      exercise_type: "SPEAK",
      question: "Order a main course: 'I'll have the chicken with vegetables.'",
      content: {
        targetText: "Je prends le poulet avec des légumes.",
        targetTranslation: "I'll have the chicken with vegetables.",
        acceptableVariants: [
          "Je prends le poulet avec des légumes",
          "Je voudrais le poulet avec des légumes",
          "Je prends le poulet avec les légumes",
        ],
      },
      hint: "Use 'je prends' and 'avec' (with)",
      explanation: "'Je prends... avec...' is the standard way to order a dish with sides.",
      difficulty: "HARD",
      xp_reward: 5,
      order_index: 10,
    },
  ],
};
