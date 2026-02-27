// Course: French A1
// Unit: 4 - Food & Drink
// Lesson: 4 - Partitive Articles

export const frenchA1U4L4 = {
  metadata: {
    course: "fr-a1",
    unit: 4,
    lesson: 4,
    title: "Partitive Articles",
    slug: "partitive-articles",
    type: "GRAMMAR",
    estimatedMinutes: 18,
    xpReward: 25,
  },

  content: {
    introduction: {
      text: "How do you say 'some bread' or 'some water' in French? You need partitive articles! These special articles express an unspecified quantity of something — some, any, a portion of. They're essential for talking about food and drink, and they don't exist in English!",
      culturalNote: "🇫🇷 Partitive articles are used constantly in French cooking and eating! When a recipe says 'Ajoutez du sel' (Add some salt) or when you say 'Je mange du fromage' (I eat cheese), you're using partitives. Mastering them is key to sounding natural when discussing food!",
    },

    vocabulary: [
      {
        term: "du",
        translation: "some (masculine)",
        pronunciation: "doo",
        partOfSpeech: "article",
        exampleSentence: {
          original: "Je mange du pain.",
          translation: "I eat (some) bread.",
        },
        tip: "'Du' = 'de + le' contracted. Used before masculine singular nouns.",
      },
      {
        term: "de la",
        translation: "some (feminine)",
        pronunciation: "duh lah",
        partOfSpeech: "article",
        exampleSentence: {
          original: "Je bois de la limonade.",
          translation: "I drink (some) lemonade.",
        },
        tip: "Used before feminine singular nouns starting with a consonant.",
      },
      {
        term: "de l'",
        translation: "some (before vowel)",
        pronunciation: "duh l",
        partOfSpeech: "article",
        exampleSentence: {
          original: "Je bois de l'eau.",
          translation: "I drink (some) water.",
        },
        tip: "Used before ANY noun (masculine or feminine) starting with a vowel or silent h.",
      },
      {
        term: "des",
        translation: "some (plural)",
        pronunciation: "day",
        partOfSpeech: "article",
        exampleSentence: {
          original: "Je mange des fruits.",
          translation: "I eat (some) fruits.",
        },
        tip: "Used before ALL plural nouns, regardless of gender.",
      },
      {
        term: "pas de / pas d'",
        translation: "no / not any",
        pronunciation: "pah duh / pah d",
        partOfSpeech: "article",
        exampleSentence: {
          original: "Je ne mange pas de viande.",
          translation: "I don't eat (any) meat.",
        },
        tip: "In negative sentences, ALL partitives become 'de' (or 'd'' before vowels)!",
      },
      {
        term: "le sucre",
        translation: "sugar",
        pronunciation: "luh sookr",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Tu veux du sucre dans ton café ?",
          translation: "Do you want (some) sugar in your coffee?",
        },
        tip: "Use 'du sucre' when offering/requesting some sugar.",
      },
      {
        term: "le lait",
        translation: "milk",
        pronunciation: "luh leh",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Je prends du lait dans mon thé.",
          translation: "I take (some) milk in my tea.",
        },
        tip: "Masculine → 'du lait' when talking about some milk.",
      },
      {
        term: "l'eau",
        translation: "water",
        pronunciation: "loh",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Je voudrais de l'eau, s'il vous plaît.",
          translation: "I would like some water, please.",
        },
        tip: "Starts with vowel → 'de l'eau' (not 'de la eau').",
      },
      {
        term: "la confiture",
        translation: "jam",
        pronunciation: "lah kon-fee-toor",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Tu veux de la confiture sur ta tartine ?",
          translation: "Do you want (some) jam on your toast?",
        },
        tip: "Feminine + consonant → 'de la confiture'.",
      },
      {
        term: "le beurre",
        translation: "butter",
        pronunciation: "luh buhr",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Je mets du beurre sur mon pain.",
          translation: "I put (some) butter on my bread.",
        },
        tip: "Essential breakfast vocab! 'Du beurre et de la confiture'.",
      },
      {
        term: "la soupe",
        translation: "soup",
        pronunciation: "lah soop",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Je mange de la soupe le soir.",
          translation: "I eat (some) soup in the evening.",
        },
        tip: "Feminine → 'de la soupe'.",
      },
      {
        term: "le sel",
        translation: "salt",
        pronunciation: "luh sell",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Ajoutez du sel et du poivre.",
          translation: "Add (some) salt and pepper.",
        },
        tip: "Common cooking instruction! 'Du sel' = some salt.",
      },
    ],

    grammar: [
      {
        title: "Partitive Articles: du, de la, de l', des",
        explanation: "Partitive articles express an unspecified quantity — 'some' or 'any'. Use them when you're talking about PART of something (not the whole thing) or an uncountable amount. They agree with the gender of the noun.",
        examples: [
          {
            original: "Je mange du fromage.",
            translation: "I eat (some) cheese.",
            breakdown: "'Fromage' is masculine → du (de + le contracted)",
          },
          {
            original: "Je bois de la bière.",
            translation: "I drink (some) beer.",
            breakdown: "'Bière' is feminine → de la",
          },
          {
            original: "Je bois de l'eau.",
            translation: "I drink (some) water.",
            breakdown: "'Eau' starts with a vowel → de l'",
          },
          {
            original: "Je mange des légumes.",
            translation: "I eat (some) vegetables.",
            breakdown: "Plural → des (regardless of gender)",
          },
        ],
        commonMistakes: [
          "❌ 'Je mange le fromage' (when meaning 'some cheese')",
          "✅ 'Je mange du fromage' — Use partitive for unspecified quantity.",
          "❌ 'Je bois de la eau' — Don't use 'de la' before vowels!",
          "✅ 'Je bois de l'eau' — Use 'de l'' before vowels.",
          "❌ 'Je ne mange pas du pain' — Wrong for negative!",
          "✅ 'Je ne mange pas de pain' — In negative, partitive → 'de/d''.",
        ],
      },
    ],

    dialogue: {
      title: "Au petit-déjeuner",
      context: "Thomas is having breakfast with his host family in France.",
      lines: [
        {
          speaker: "Maman",
          text: "Thomas, tu veux du café ou du thé ?",
          translation: "Thomas, do you want (some) coffee or tea?",
        },
        {
          speaker: "Thomas",
          text: "Du café, s'il vous plaît. Avec du lait.",
          translation: "Coffee, please. With (some) milk.",
        },
        {
          speaker: "Maman",
          text: "Bien sûr ! Tu veux du pain avec du beurre et de la confiture ?",
          translation: "Of course! Do you want (some) bread with butter and jam?",
        },
        {
          speaker: "Thomas",
          text: "Oui, merci ! J'adore la confiture française !",
          translation: "Yes, thank you! I love French jam!",
        },
        {
          speaker: "Maman",
          text: "Tu ne veux pas de jus d'orange ?",
          translation: "You don't want (any) orange juice?",
        },
        {
          speaker: "Thomas",
          text: "Non merci, je ne bois pas de jus le matin. Mais je voudrais de l'eau, s'il vous plaît.",
          translation: "No thank you, I don't drink (any) juice in the morning. But I would like some water, please.",
        },
      ],
      comprehensionQuestions: [
        {
          question: "What does Thomas want in his coffee?",
          options: ["Sugar", "Milk", "Nothing", "Cream"],
          correctIndex: 1,
        },
        {
          question: "What does Thomas NOT want?",
          options: ["Coffee", "Jam", "Orange juice", "Bread"],
          correctIndex: 2,
        },
      ],
    },

    culture: {
      title: "The French Breakfast",
      text: "The traditional French breakfast (le petit-déjeuner) is simple but delicious! It typically consists of: du pain ou des tartines (bread or toast), du beurre et de la confiture (butter and jam), and du café, du thé, ou du chocolat chaud (coffee, tea, or hot chocolate). Unlike American breakfasts, you won't find eggs, bacon, or cereal — that's considered too heavy for morning! The croissant is actually a weekend treat, not an everyday item.",
      funFact: "🥐 The croissant isn't even French! It's Austrian. The kipferl was brought to France by Marie Antoinette in the 1770s. French bakers perfected it with their puff pastry technique, creating the buttery, flaky croissant we know today!",
    },

    summary: {
      keyPoints: [
        "Partitive = 'some/any' of something (unspecified quantity)",
        "du = masculine (du pain, du fromage, du café)",
        "de la = feminine before consonant (de la viande, de la soupe)",
        "de l' = before vowels, any gender (de l'eau, de l'huile)",
        "des = plural (des fruits, des légumes)",
        "NEGATIVE: all become 'de' or 'd'' (pas de pain, pas d'eau)",
      ],
      practicePrompt: "Describe your breakfast in French! 'Le matin, je mange du pain avec du beurre. Je bois du café...' Make sure to use the right partitive for each item!",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "Which partitive article do you use with 'pain' (bread - masculine)?",
      content: {
        options: [
          "du",
          "de la",
          "de l'",
          "des",
        ],
        correctIndex: 0,
      },
      hint: "'Pain' is masculine and starts with a consonant",
      explanation: "'Pain' is masculine singular → 'du pain'. 'Du' = de + le contracted.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "Which partitive do you use with 'eau' (water)?",
      content: {
        options: [
          "de l'",
          "de la",
          "du",
          "des",
        ],
        correctIndex: 0,
      },
      hint: "'Eau' starts with a vowel",
      explanation: "Before a vowel, use 'de l'' regardless of gender → 'de l'eau'.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the foods with the correct partitive:",
      content: {
        pairs: [
          { left: "du", right: "fromage (m)" },
          { left: "de la", right: "confiture (f)" },
          { left: "de l'", right: "eau (f, vowel)" },
          { left: "des", right: "légumes (plural)" },
        ],
      },
      hint: "Think about gender and whether it starts with a vowel",
      explanation: "Partitives agree with gender and change before vowels!",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Je mange _____ pain tous les matins. (some bread)",
      content: {
        sentence: "Je mange _____ pain tous les matins.",
        answer: "du",
        options: ["du", "de la", "de l'", "des"],
        caseSensitive: false,
      },
      hint: "'Pain' is masculine",
      explanation: "'Pain' is masculine → 'du pain'.",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Je ne mange pas _____ viande. (any meat)",
      content: {
        sentence: "Je ne mange pas _____ viande.",
        answer: "de",
        options: ["de", "de la", "du", "des"],
        caseSensitive: false,
      },
      hint: "In NEGATIVE sentences, all partitives become 'de'",
      explanation: "Negative = 'pas de' + noun. Not 'pas de la' or 'pas du'!",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'I drink some milk.'",
      content: {
        correctAnswer: "Je bois du lait.",
        acceptableAnswers: [
          "Je bois du lait.",
          "Je bois du lait",
        ],
        direction: "to_target",
      },
      hint: "'Lait' is masculine, so use 'du'",
      explanation: "'Lait' is masculine → 'du lait'. 'Je bois du lait.'",
      difficulty: "EASY",
      xp_reward: 4,
      order_index: 6,
    },
    {
      exercise_type: "REORDER",
      question: "Put the words in order: bois / l' / de / je / eau",
      content: {
        words: ["bois", "l'", "de", "je", "eau"],
        correctOrder: ["je", "bois", "de", "l'", "eau"],
        translation: "I drink some water",
      },
      hint: "'De l'' stays together before the vowel word",
      explanation: "'De l'eau' — 'de l'' is the partitive before vowels.",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 7,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and identify what the person puts in their coffee:",
      content: {
        ttsText: "Je prends du sucre et du lait dans mon café.",
        ttsLang: "fr-FR",
        options: [
          "Sugar and milk",
          "Just sugar",
          "Just milk",
          "Nothing",
        ],
        correctIndex: 0,
      },
      hint: "Listen for 'sucre' and 'lait'",
      explanation: "'Du sucre et du lait' = (some) sugar and (some) milk.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 8,
    },
    {
      exercise_type: "SPEAK",
      question: "Say in French: 'I eat some cheese.'",
      content: {
        targetText: "Je mange du fromage.",
        targetTranslation: "I eat some cheese.",
        acceptableVariants: [
          "Je mange du fromage",
        ],
      },
      hint: "'Fromage' is masculine, so use 'du'",
      explanation: "'Du fromage' — masculine singular partitive.",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 9,
    },
    {
      exercise_type: "SPEAK",
      question: "Say in French: 'I don't eat meat.'",
      content: {
        targetText: "Je ne mange pas de viande.",
        targetTranslation: "I don't eat meat.",
        acceptableVariants: [
          "Je ne mange pas de viande",
          "Je mange pas de viande",
        ],
      },
      hint: "In negative, 'de la' becomes just 'de'",
      explanation: "Negative sentences: partitive → 'de'. 'Pas DE viande', not 'pas de la'.",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 10,
    },
  ],
};
