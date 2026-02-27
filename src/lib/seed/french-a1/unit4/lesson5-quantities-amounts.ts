// Course: French A1
// Unit: 4 - Food & Drink
// Lesson: 5 - Quantities & Amounts

export const frenchA1U4L5 = {
  metadata: {
    course: "fr-a1",
    unit: 4,
    lesson: 5,
    title: "Quantities & Amounts",
    slug: "quantities-amounts",
    type: "VOCABULARY",
    estimatedMinutes: 15,
    xpReward: 20,
  },

  content: {
    introduction: {
      text: "How much do you want? A kilo of apples? A bottle of water? A slice of cake? In this lesson, you'll learn to express quantities and amounts — essential for shopping and cooking! Plus, there's a simple grammar rule that makes this easy.",
      culturalNote: "🇫🇷 France uses the metric system! Everything is measured in kilos (kg), grammes (g), and litres (L). At the market, you'll ask for 'un kilo de pommes' or '500 grammes de fromage'. Don't worry — vendors are patient with tourists, and most prices are per kilo.",
    },

    vocabulary: [
      {
        term: "un kilo de",
        translation: "a kilo of",
        pronunciation: "uhn kee-loh duh",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Un kilo de pommes, s'il vous plaît.",
          translation: "A kilo of apples, please.",
        },
        tip: "1 kilo ≈ 2.2 pounds. Use 'de' after quantity words, not partitive articles!",
      },
      {
        term: "une livre de",
        translation: "a pound of (500g)",
        pronunciation: "oon leevr duh",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Une livre de cerises, s'il vous plaît.",
          translation: "A pound of cherries, please.",
        },
        tip: "French 'livre' = 500 grams, not the same as an English pound (454g)!",
      },
      {
        term: "un litre de",
        translation: "a liter of",
        pronunciation: "uhn leetr duh",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Un litre de lait, s'il vous plaît.",
          translation: "A liter of milk, please.",
        },
        tip: "1 liter ≈ about 4 cups or 1 quart.",
      },
      {
        term: "une bouteille de",
        translation: "a bottle of",
        pronunciation: "oon boo-tay duh",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Une bouteille d'eau, s'il vous plaît.",
          translation: "A bottle of water, please.",
        },
        tip: "Note: 'bouteille d'eau' — 'de' becomes 'd'' before a vowel.",
      },
      {
        term: "un verre de",
        translation: "a glass of",
        pronunciation: "uhn vair duh",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Un verre de vin rouge, s'il vous plaît.",
          translation: "A glass of red wine, please.",
        },
        tip: "Used for drinks: 'un verre d'eau', 'un verre de jus'.",
      },
      {
        term: "une tasse de",
        translation: "a cup of",
        pronunciation: "oon tahss duh",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Une tasse de café, s'il vous plaît.",
          translation: "A cup of coffee, please.",
        },
        tip: "For hot drinks: 'une tasse de thé', 'une tasse de chocolat'.",
      },
      {
        term: "un morceau de",
        translation: "a piece of",
        pronunciation: "uhn mor-soh duh",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Un morceau de fromage, s'il vous plaît.",
          translation: "A piece of cheese, please.",
        },
        tip: "For solid foods: cheese, bread, chocolate, etc.",
      },
      {
        term: "une tranche de",
        translation: "a slice of",
        pronunciation: "oon trahnsh duh",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Deux tranches de jambon, s'il vous plaît.",
          translation: "Two slices of ham, please.",
        },
        tip: "For sliced items: ham, bread, cake, pizza.",
      },
      {
        term: "un paquet de",
        translation: "a packet/pack of",
        pronunciation: "uhn pah-keh duh",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Un paquet de biscuits.",
          translation: "A pack of cookies.",
        },
        tip: "For packaged goods: cookies, pasta, rice, etc.",
      },
      {
        term: "une douzaine de",
        translation: "a dozen (of)",
        pronunciation: "oon doo-zehn duh",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Une douzaine d'œufs, s'il vous plaît.",
          translation: "A dozen eggs, please.",
        },
        tip: "Note: 'douzaine d'œufs' — remember 'd'' before vowels!",
      },
      {
        term: "beaucoup de",
        translation: "a lot of / many",
        pronunciation: "boh-koo duh",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Il y a beaucoup de fruits au marché.",
          translation: "There are a lot of fruits at the market.",
        },
        tip: "'Beaucoup de' — always 'de', never 'des'!",
      },
      {
        term: "un peu de",
        translation: "a little (of)",
        pronunciation: "uhn puh duh",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Je voudrais un peu de sucre.",
          translation: "I would like a little sugar.",
        },
        tip: "For small quantities: 'un peu de sel', 'un peu de lait'.",
      },
    ],

    grammar: [
      {
        title: "Quantities + 'de' (NOT partitives!)",
        explanation: "After quantity expressions, ALWAYS use 'de' (or 'd'' before vowels) — never du, de la, or des! This is because you're specifying an exact amount, not an unspecified 'some'.",
        examples: [
          {
            original: "Un kilo de tomates.",
            translation: "A kilo of tomatoes.",
            breakdown: "Quantity (un kilo) + de + noun — not 'de les tomates'!",
          },
          {
            original: "Une bouteille d'eau.",
            translation: "A bottle of water.",
            breakdown: "Quantity + d' (before vowel) + noun — 'd'eau' not 'de l'eau'",
          },
          {
            original: "Beaucoup de fromage.",
            translation: "A lot of cheese.",
            breakdown: "Beaucoup + de + noun — not 'beaucoup du fromage'!",
          },
        ],
        commonMistakes: [
          "❌ 'Un kilo des pommes' — Don't use 'des' after quantities!",
          "✅ 'Un kilo de pommes' — Always 'de' after quantity words.",
          "❌ 'Beaucoup du fromage' — Don't use 'du' after 'beaucoup'!",
          "✅ 'Beaucoup de fromage' — 'Beaucoup de', always.",
          "❌ 'Une bouteille de eau' — Missing elision!",
          "✅ 'Une bouteille d'eau' — 'De' + vowel = 'd''.",
        ],
      },
    ],

    dialogue: {
      title: "À la boulangerie",
      context: "Claire is buying bread and pastries at the bakery.",
      lines: [
        {
          speaker: "Boulanger",
          text: "Bonjour ! Qu'est-ce que je vous sers ?",
          translation: "Hello! What can I get you?",
        },
        {
          speaker: "Claire",
          text: "Bonjour ! Je voudrais une baguette et deux croissants, s'il vous plaît.",
          translation: "Hello! I would like a baguette and two croissants, please.",
        },
        {
          speaker: "Boulanger",
          text: "Très bien. Autre chose ?",
          translation: "Very well. Anything else?",
        },
        {
          speaker: "Claire",
          text: "Oui, je voudrais aussi un morceau de tarte aux pommes.",
          translation: "Yes, I would also like a piece of apple pie.",
        },
        {
          speaker: "Boulanger",
          text: "Une part de tarte... voilà ! C'est tout ?",
          translation: "A slice of pie... here you go! Is that all?",
        },
        {
          speaker: "Claire",
          text: "C'est tout. Ça fait combien ?",
          translation: "That's all. How much is it?",
        },
        {
          speaker: "Boulanger",
          text: "Alors, ça fait six euros cinquante.",
          translation: "So, that's six euros fifty.",
        },
        {
          speaker: "Claire",
          text: "Voilà. Merci, au revoir !",
          translation: "Here you go. Thank you, goodbye!",
        },
      ],
      comprehensionQuestions: [
        {
          question: "How many croissants does Claire order?",
          options: ["One", "Two", "Three", "Four"],
          correctIndex: 1,
        },
        {
          question: "How much does Claire pay in total?",
          options: ["€5.50", "€6.50", "€7.50", "€8.00"],
          correctIndex: 1,
        },
      ],
    },

    culture: {
      title: "Shopping at French Markets",
      text: "French markets (les marchés) are a delight! Vendors sell by weight (usually per kilo), and it's normal to ask for specific amounts: 'Un kilo de pommes', '500 grammes de fraises'. If you're unsure, you can point and say 'Ça suffit' (that's enough) or 'Un peu plus' (a little more). Most vendors are happy to let you taste before buying — just ask 'Je peux goûter?' (Can I taste?).",
      funFact: "🛒 French law requires supermarkets to donate unsold food to charity! Since 2016, it's illegal for large grocery stores to throw away edible food. France was the first country in the world to pass such a law!",
    },

    summary: {
      keyPoints: [
        "After quantities, ALWAYS use 'de' (not du/de la/des)",
        "'De' becomes 'd'' before vowels: 'une bouteille d'eau'",
        "Common quantities: un kilo de, une bouteille de, un verre de, une tranche de",
        "'Beaucoup de' = a lot of, 'un peu de' = a little of",
        "France uses metric: kilos (kg), grammes (g), litres (L)",
        "'Ça fait combien ?' = How much is it? (for paying)",
      ],
      practicePrompt: "Imagine you're at a French market. Practice ordering: 'Je voudrais un kilo de pommes, 500 grammes de fromage, et une bouteille d'eau, s'il vous plaît.'",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "How do you say 'a kilo of apples' in French?",
      content: {
        options: [
          "un kilo de pommes",
          "un kilo des pommes",
          "un kilo du pommes",
          "un kilo les pommes",
        ],
        correctIndex: 0,
      },
      hint: "After quantity words, you use just 'de'",
      explanation: "After quantities, always use 'de' (not 'des' or 'du'). 'Un kilo de pommes'.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What happens to 'de' before 'eau'?",
      content: {
        options: [
          "It becomes d' (une bouteille d'eau)",
          "It stays de (une bouteille de eau)",
          "It becomes du (une bouteille du eau)",
          "It's omitted completely",
        ],
        correctIndex: 0,
      },
      hint: "What always happens before vowels in French?",
      explanation: "'De' + vowel = 'd''. So it's 'une bouteille d'eau', not 'de eau'.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the containers/measures with their translations:",
      content: {
        pairs: [
          { left: "une bouteille de", right: "a bottle of" },
          { left: "un verre de", right: "a glass of" },
          { left: "une tasse de", right: "a cup of" },
          { left: "une tranche de", right: "a slice of" },
          { left: "un morceau de", right: "a piece of" },
        ],
      },
      hint: "Think about what container each drink or food comes in",
      explanation: "These quantity expressions all take 'de' after them!",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Je voudrais une bouteille _____ vin. (of wine)",
      content: {
        sentence: "Je voudrais une bouteille _____ vin.",
        answer: "de",
        options: ["de", "du", "de la", "des"],
        caseSensitive: false,
      },
      hint: "After 'une bouteille', you use just 'de'",
      explanation: "After quantity words, always use 'de'. 'Une bouteille de vin'.",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Il y a beaucoup _____ fruits. (a lot of fruits)",
      content: {
        sentence: "Il y a beaucoup _____ fruits.",
        answer: "de",
        options: ["de", "des", "du", "les"],
        caseSensitive: false,
      },
      hint: "'Beaucoup' is a quantity expression — what comes after it?",
      explanation: "'Beaucoup de' — never 'beaucoup des' or 'beaucoup du'!",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'A glass of water, please.'",
      content: {
        correctAnswer: "Un verre d'eau, s'il vous plaît.",
        acceptableAnswers: [
          "Un verre d'eau, s'il vous plaît.",
          "Un verre d'eau, s'il vous plaît",
          "Un verre d'eau s'il vous plaît",
        ],
        direction: "to_target",
      },
      hint: "'Eau' starts with a vowel, so 'de' becomes 'd''",
      explanation: "'Un verre d'eau' — 'de' + vowel = 'd''.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 6,
    },
    {
      exercise_type: "REORDER",
      question: "Put the words in order: de / kilo / je / pommes / voudrais / un",
      content: {
        words: ["de", "kilo", "je", "pommes", "voudrais", "un"],
        correctOrder: ["je", "voudrais", "un", "kilo", "de", "pommes"],
        translation: "I would like a kilo of apples",
      },
      hint: "Subject + voudrais + quantity + de + noun",
      explanation: "'Je voudrais un kilo de pommes' — standard ordering structure for quantities.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 7,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and identify what the person wants:",
      content: {
        ttsText: "Je voudrais deux tranches de jambon et une douzaine d'œufs.",
        ttsLang: "fr-FR",
        options: [
          "Two slices of ham and a dozen eggs",
          "Two pieces of cheese and a dozen eggs",
          "Two bottles of milk and some bread",
          "Two kilos of ham and some eggs",
        ],
        correctIndex: 0,
      },
      hint: "Listen for 'tranches', 'jambon', 'douzaine', and 'œufs'",
      explanation: "'Deux tranches de jambon et une douzaine d'œufs' = two slices of ham and a dozen eggs.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 8,
    },
    {
      exercise_type: "SPEAK",
      question: "Order at a bakery: 'A baguette and two croissants, please.'",
      content: {
        targetText: "Une baguette et deux croissants, s'il vous plaît.",
        targetTranslation: "A baguette and two croissants, please.",
        acceptableVariants: [
          "Une baguette et deux croissants, s'il vous plaît",
          "Je voudrais une baguette et deux croissants, s'il vous plaît",
          "Une baguette et deux croissants s'il vous plaît",
        ],
      },
      hint: "Baguette is feminine (une), croissant is masculine (deux croissants)",
      explanation: "Simple items don't need 'de' — just say 'une baguette, deux croissants'!",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 9,
    },
    {
      exercise_type: "SPEAK",
      question: "Ask: 'How much is it?' (when paying)",
      content: {
        targetText: "Ça fait combien ?",
        targetTranslation: "How much is it?",
        acceptableVariants: [
          "Ça fait combien",
          "C'est combien",
          "Combien ça fait",
          "Combien ça coûte",
        ],
      },
      hint: "'Ça fait combien?' is the most common way to ask for the total",
      explanation: "'Ça fait combien?' = How much is it? / What's the total? Essential shopping phrase!",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 10,
    },
  ],
};
