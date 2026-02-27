// Course: French A1
// Unit: 4 - Food & Drink
// Lesson: 2 - Food Vocabulary

export const frenchA1U4L2 = {
  metadata: {
    course: "fr-a1",
    unit: 4,
    lesson: 2,
    title: "Food Vocabulary",
    slug: "food-vocabulary",
    type: "VOCABULARY",
    estimatedMinutes: 15,
    xpReward: 20,
  },

  content: {
    introduction: {
      text: "Food is central to French culture — and learning food vocabulary opens up a delicious world! In this lesson, you'll learn essential food words for everyday eating: fruits, vegetables, bread, cheese, meat, and more. Bon appétit!",
      culturalNote: "🇫🇷 The French take food seriously! Meals are structured events, not just fuel. Even a simple lunch has courses. And bread? It's on every table at every meal — the baguette is practically a national symbol. Fun fact: the French eat about 30 million baguettes EVERY DAY!",
    },

    vocabulary: [
      {
        term: "le pain",
        translation: "bread",
        pronunciation: "luh pan",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Je mange du pain tous les jours.",
          translation: "I eat bread every day.",
        },
        tip: "No French meal is complete without bread! 'Une baguette' is the classic long loaf.",
      },
      {
        term: "le fromage",
        translation: "cheese",
        pronunciation: "luh froh-mahzh",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "La France a plus de 400 fromages !",
          translation: "France has more than 400 cheeses!",
        },
        tip: "Cheese is often served as its own course after the main dish, before dessert!",
      },
      {
        term: "la viande",
        translation: "meat",
        pronunciation: "lah vyahnd",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Je ne mange pas de viande.",
          translation: "I don't eat meat.",
        },
        tip: "Common types: 'le bœuf' (beef), 'le poulet' (chicken), 'le porc' (pork).",
      },
      {
        term: "le poulet",
        translation: "chicken",
        pronunciation: "luh poo-leh",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Le poulet rôti est délicieux.",
          translation: "Roast chicken is delicious.",
        },
        tip: "'Poulet rôti' (roast chicken) is a classic French Sunday dish!",
      },
      {
        term: "le poisson",
        translation: "fish",
        pronunciation: "luh pwah-son",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "J'aime le poisson grillé.",
          translation: "I like grilled fish.",
        },
        tip: "In France, fish is often served whole — head and all!",
      },
      {
        term: "les légumes",
        translation: "vegetables",
        pronunciation: "lay lay-goom",
        partOfSpeech: "noun",
        gender: "masculine plural",
        exampleSentence: {
          original: "Je mange beaucoup de légumes.",
          translation: "I eat a lot of vegetables.",
        },
        tip: "Common ones: 'la carotte' (carrot), 'la tomate' (tomato), 'les haricots verts' (green beans).",
      },
      {
        term: "les fruits",
        translation: "fruits",
        pronunciation: "lay frwee",
        partOfSpeech: "noun",
        gender: "masculine plural",
        exampleSentence: {
          original: "Les fruits sont bons pour la santé.",
          translation: "Fruits are good for health.",
        },
        tip: "Common ones: 'la pomme' (apple), 'l'orange' (orange), 'la banane' (banana).",
      },
      {
        term: "la pomme",
        translation: "apple",
        pronunciation: "lah pom",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Je mange une pomme chaque matin.",
          translation: "I eat an apple every morning.",
        },
        tip: "'Pomme de terre' literally means 'apple of the earth' — that's a potato!",
      },
      {
        term: "l'œuf",
        translation: "egg",
        pronunciation: "luhf",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Je voudrais deux œufs, s'il vous plaît.",
          translation: "I would like two eggs, please.",
        },
        tip: "Singular: 'l'œuf' (luhf). Plural: 'les œufs' (lay-zuh) — the 'f' becomes silent!",
      },
      {
        term: "le riz",
        translation: "rice",
        pronunciation: "luh ree",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Je préfère le riz aux pâtes.",
          translation: "I prefer rice to pasta.",
        },
        tip: "The 'z' is silent — just say 'ree'.",
      },
      {
        term: "les pâtes",
        translation: "pasta",
        pronunciation: "lay paht",
        partOfSpeech: "noun",
        gender: "feminine plural",
        exampleSentence: {
          original: "Les enfants adorent les pâtes.",
          translation: "Children love pasta.",
        },
        tip: "Always plural in French! 'Les pâtes', never 'la pâte' (that means dough).",
      },
      {
        term: "la salade",
        translation: "salad / lettuce",
        pronunciation: "lah sah-lahd",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Une salade verte, s'il vous plaît.",
          translation: "A green salad, please.",
        },
        tip: "Can mean the dish (salad) or the lettuce itself. Context tells you which!",
      },
    ],

    grammar: [
      {
        title: "Food Vocabulary: Gender Patterns",
        explanation: "Food vocabulary follows normal French gender rules — you must learn each word's gender. However, there are some patterns: most fruits ending in '-e' are feminine (la pomme, la fraise, l'orange), while most meats are masculine (le poulet, le bœuf, le porc).",
        examples: [
          {
            original: "Je mange une pomme.",
            translation: "I eat an apple.",
            breakdown: "'Pomme' is feminine → 'une pomme'",
          },
          {
            original: "Je mange du fromage.",
            translation: "I eat (some) cheese.",
            breakdown: "'Fromage' is masculine → 'du fromage' (partitive, more on this soon!)",
          },
          {
            original: "J'adore les fruits et les légumes.",
            translation: "I love fruits and vegetables.",
            breakdown: "Both use 'les' for plural (general category)",
          },
        ],
        commonMistakes: [
          "❌ 'La fromage' — Wrong gender!",
          "✅ 'Le fromage' — Fromage is masculine.",
          "❌ 'Le tomate' — Wrong gender!",
          "✅ 'La tomate' — Tomate is feminine.",
          "❌ 'La œuf' — Don't forget elision!",
          "✅ 'L'œuf' — Vowel → use l'",
        ],
      },
    ],

    dialogue: {
      title: "Qu'est-ce que tu manges ?",
      context: "Thomas and Marie discuss what they're eating for lunch.",
      lines: [
        {
          speaker: "Thomas",
          text: "Qu'est-ce que tu manges à midi ?",
          translation: "What are you eating for lunch?",
        },
        {
          speaker: "Marie",
          text: "Je mange une salade avec du poulet. Et toi ?",
          translation: "I'm eating a salad with chicken. And you?",
        },
        {
          speaker: "Thomas",
          text: "Moi, je mange un sandwich au fromage.",
          translation: "Me, I'm eating a cheese sandwich.",
        },
        {
          speaker: "Marie",
          text: "Tu ne manges pas de légumes ?",
          translation: "You're not eating any vegetables?",
        },
        {
          speaker: "Thomas",
          text: "Si, il y a de la salade et des tomates dans mon sandwich !",
          translation: "Yes I am, there's lettuce and tomatoes in my sandwich!",
        },
        {
          speaker: "Marie",
          text: "Ah, bon appétit alors !",
          translation: "Ah, enjoy your meal then!",
        },
      ],
      comprehensionQuestions: [
        {
          question: "What is Marie eating?",
          options: ["A sandwich", "A salad with chicken", "Just vegetables", "Pasta"],
          correctIndex: 1,
        },
        {
          question: "What kind of sandwich does Thomas have?",
          options: ["Chicken", "Ham", "Cheese", "Fish"],
          correctIndex: 2,
        },
      ],
    },

    culture: {
      title: "French Food Culture",
      text: "In France, food is an art form! Meals follow a structure: l'entrée (starter), le plat principal (main course), le fromage (cheese course), and le dessert. Lunch breaks are sacred — many businesses close from 12-2 PM. And shopping for food is a daily ritual: the boulangerie for bread, the fromagerie for cheese, the boucherie for meat. Supermarkets exist, but small specialty shops are treasured!",
      funFact: "🥖 The French government actually regulates baguettes! A 'baguette tradition' must contain only flour, water, yeast, and salt — no additives. And the annual 'Best Baguette in Paris' winner gets to supply bread to the French President for a year!",
    },

    summary: {
      keyPoints: [
        "Essential foods: le pain, le fromage, la viande, le poulet, le poisson",
        "Fruits and vegetables: les fruits, les légumes, la pomme, la tomate",
        "Carbs: le riz (rice), les pâtes (pasta) — pâtes is always plural!",
        "Learn gender with each word: le fromage (m), la viande (f)",
        "'L'œuf' (singular) → 'les œufs' (plural) — pronunciation changes!",
        "'Bon appétit!' = Enjoy your meal! (said before eating)",
      ],
      practicePrompt: "Open your fridge or pantry and name 5 things in French! 'Du fromage, du pain, des œufs...' Try to include the correct article.",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What is 'bread' in French?",
      content: {
        options: [
          "le pain",
          "le vin",
          "le poisson",
          "la viande",
        ],
        correctIndex: 0,
      },
      hint: "It's on every French table at every meal!",
      explanation: "'Le pain' is bread. Essential French vocabulary — no meal is complete without it!",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "Which word is feminine?",
      content: {
        options: [
          "la viande",
          "le fromage",
          "le poulet",
          "le pain",
        ],
        correctIndex: 0,
      },
      hint: "Look at the articles — which one has 'la'?",
      explanation: "'La viande' (meat) is feminine. The others are masculine (le fromage, le poulet, le pain).",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the French foods with their translations:",
      content: {
        pairs: [
          { left: "le fromage", right: "cheese" },
          { left: "le poulet", right: "chicken" },
          { left: "les légumes", right: "vegetables" },
          { left: "les fruits", right: "fruits" },
          { left: "l'œuf", right: "egg" },
        ],
      },
      hint: "Think about food categories",
      explanation: "These are essential food vocabulary words for daily life!",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: J'adore _____ fromage français. (the)",
      content: {
        sentence: "J'adore _____ fromage français.",
        answer: "le",
        options: ["le", "la", "les", "un"],
        caseSensitive: false,
      },
      hint: "'Fromage' is masculine, and we're talking about cheese in general",
      explanation: "'Fromage' is masculine → 'le fromage'. Use definite article for general likes!",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Je mange _____ pomme. (an)",
      content: {
        sentence: "Je mange _____ pomme.",
        answer: "une",
        options: ["une", "un", "la", "le"],
        caseSensitive: false,
      },
      hint: "'Pomme' is feminine, and we're talking about ONE apple",
      explanation: "'Pomme' is feminine → 'une pomme'. One specific apple = indefinite article.",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'I love chicken.'",
      content: {
        correctAnswer: "J'adore le poulet.",
        acceptableAnswers: [
          "J'adore le poulet.",
          "J'adore le poulet",
          "J'aime le poulet.",
          "J'aime le poulet",
        ],
        direction: "to_target",
      },
      hint: "Use 'le' for general likes, and 'poulet' is masculine",
      explanation: "General preference = definite article. 'J'adore LE poulet' (not 'un poulet').",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 6,
    },
    {
      exercise_type: "REORDER",
      question: "Put the words in order: mange / je / tous / pain / jours / du / les",
      content: {
        words: ["mange", "je", "tous", "pain", "jours", "du", "les"],
        correctOrder: ["je", "mange", "du", "pain", "tous", "les", "jours"],
        translation: "I eat bread every day",
      },
      hint: "Subject first, then verb, then what you eat, then 'tous les jours'",
      explanation: "'Je mange du pain tous les jours' — we'll learn about 'du' (partitive) soon!",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 7,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and identify what the person likes:",
      content: {
        ttsText: "J'adore les fruits, surtout les pommes et les oranges.",
        ttsLang: "fr-FR",
        options: [
          "Fruits, especially apples and oranges",
          "Vegetables, especially carrots",
          "Cheese and bread",
          "Chicken and fish",
        ],
        correctIndex: 0,
      },
      hint: "Listen for 'fruits', 'pommes', and 'oranges'",
      explanation: "'Les fruits, surtout les pommes et les oranges' = fruits, especially apples and oranges.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 8,
    },
    {
      exercise_type: "SPEAK",
      question: "Say in French: 'I eat bread every day.'",
      content: {
        targetText: "Je mange du pain tous les jours.",
        targetTranslation: "I eat bread every day.",
        acceptableVariants: [
          "Je mange du pain tous les jours",
          "Je mange le pain tous les jours",
        ],
      },
      hint: "'Du pain' means 'some bread' — we'll learn more about this!",
      explanation: "'Du pain' (some bread) is the partitive article. Coming up in a future lesson!",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 9,
    },
    {
      exercise_type: "SPEAK",
      question: "Say 'Enjoy your meal!' in French:",
      content: {
        targetText: "Bon appétit !",
        targetTranslation: "Enjoy your meal!",
        acceptableVariants: [
          "Bon appétit",
          "Bon appétit !",
        ],
      },
      hint: "This phrase is used before eating",
      explanation: "'Bon appétit!' is said before a meal — similar to 'Enjoy your meal!' but more common.",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 10,
    },
  ],
};
