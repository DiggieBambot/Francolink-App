// Course: French A1
// Unit: 3 - Daily Life
// Lesson: 6 - Colors

export const frenchA1U3L6 = {
  metadata: {
    course: "fr-a1",
    unit: 3,
    lesson: 6,
    title: "Colors",
    slug: "colors",
    type: "VOCABULARY",
    estimatedMinutes: 15,
    xpReward: 20,
  },

  content: {
    introduction: {
      text: "Colors are everywhere — and knowing them opens up a world of description! In this lesson, you'll learn the main colors in French and discover how they change to match the nouns they describe. It's your first real taste of French adjective agreement!",
      culturalNote: "🇫🇷 The French flag (le drapeau français) is 'bleu, blanc, rouge' — blue, white, and red. These colors are deeply symbolic: blue and red were the colors of Paris, and white represented the monarchy. Together, they symbolize the unity of the French people after the Revolution.",
    },

    vocabulary: [
      {
        term: "rouge",
        translation: "red",
        pronunciation: "roozh",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "La pomme est rouge.",
          translation: "The apple is red.",
        },
        tip: "Same form for masculine AND feminine — easy! 'Un sac rouge, une robe rouge.'",
      },
      {
        term: "bleu / bleue",
        translation: "blue",
        pronunciation: "bluh",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Le ciel est bleu.",
          translation: "The sky is blue.",
        },
        tip: "Add 'e' for feminine: 'un stylo bleu' → 'une voiture bleue'.",
      },
      {
        term: "vert / verte",
        translation: "green",
        pronunciation: "vair / vairt",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "L'herbe est verte.",
          translation: "The grass is green.",
        },
        tip: "The 't' is silent in 'vert' but pronounced in 'verte'! Listen carefully.",
      },
      {
        term: "jaune",
        translation: "yellow",
        pronunciation: "zhohn",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Le soleil est jaune.",
          translation: "The sun is yellow.",
        },
        tip: "Same form for masculine and feminine — another easy one!",
      },
      {
        term: "orange",
        translation: "orange",
        pronunciation: "oh-rahnzh",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "La carotte est orange.",
          translation: "The carrot is orange.",
        },
        tip: "INVARIABLE — never changes! 'Un sac orange, une robe orange, des chaussures orange.'",
      },
      {
        term: "noir / noire",
        translation: "black",
        pronunciation: "nwahr",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Le chat est noir.",
          translation: "The cat is black.",
        },
        tip: "Add 'e' for feminine: 'un chat noir' → 'une voiture noire'.",
      },
      {
        term: "blanc / blanche",
        translation: "white",
        pronunciation: "blon / blonsh",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "La neige est blanche.",
          translation: "The snow is white.",
        },
        tip: "BIG change for feminine! 'Blanc' → 'blanche'. Pronunciation changes too!",
      },
      {
        term: "gris / grise",
        translation: "gray",
        pronunciation: "gree / greez",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Le ciel est gris aujourd'hui.",
          translation: "The sky is gray today.",
        },
        tip: "The 's' is silent in 'gris' but pronounced in 'grise' (sounds like 'greez').",
      },
      {
        term: "marron",
        translation: "brown",
        pronunciation: "mah-ron",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Ses yeux sont marron.",
          translation: "His/Her eyes are brown.",
        },
        tip: "INVARIABLE — never changes! Used especially for eyes and natural things.",
      },
      {
        term: "rose",
        translation: "pink",
        pronunciation: "rohz",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Elle porte une jupe rose.",
          translation: "She's wearing a pink skirt.",
        },
        tip: "Same form for masculine and feminine. Also means 'rose' (the flower)!",
      },
      {
        term: "violet / violette",
        translation: "purple",
        pronunciation: "vee-oh-lay / vee-oh-let",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Les fleurs sont violettes.",
          translation: "The flowers are purple.",
        },
        tip: "Adds 'te' for feminine: 'violet' → 'violette'. The 't' sound appears!",
      },
      {
        term: "clair / foncé",
        translation: "light / dark",
        pronunciation: "klair / fon-say",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "J'aime le bleu clair.",
          translation: "I like light blue.",
        },
        tip: "Put AFTER the color: 'bleu foncé' (dark blue), 'rose clair' (light pink).",
      },
    ],

    grammar: [
      {
        title: "Color Agreement with Nouns",
        explanation: "In French, colors are adjectives and must agree in gender (masculine/feminine) and number (singular/plural) with the noun they describe. Most colors add 'e' for feminine and 's' for plural. BUT some colors are invariable and never change!",
        examples: [
          {
            original: "Un sac noir → une robe noire",
            translation: "A black bag → a black dress",
            breakdown: "'Noir' adds 'e' for feminine 'robe'",
          },
          {
            original: "Des chaussures vertes",
            translation: "Green shoes",
            breakdown: "'Vert' → 'verte' (feminine) → 'vertes' (feminine plural)",
          },
          {
            original: "Une voiture orange",
            translation: "An orange car",
            breakdown: "'Orange' is INVARIABLE — stays 'orange' even with feminine 'voiture'",
          },
        ],
        commonMistakes: [
          "❌ 'Une robe orangee' — Don't add 'e' to invariable colors!",
          "✅ 'Une robe orange' — 'Orange' and 'marron' never change.",
          "❌ 'Une voiture vert' — Don't forget feminine agreement!",
          "✅ 'Une voiture verte' — 'Voiture' is feminine → 'verte'.",
          "❌ 'Le ciel est verte' — Check the noun's gender!",
          "✅ 'Le ciel est vert' — 'Ciel' is masculine → 'vert'.",
        ],
      },
    ],

    dialogue: {
      title: "Dans le magasin de vêtements",
      context: "Claire is shopping for clothes with her friend Léa.",
      lines: [
        {
          speaker: "Claire",
          text: "Qu'est-ce que tu penses de cette robe ?",
          translation: "What do you think of this dress?",
        },
        {
          speaker: "Léa",
          text: "Elle est jolie ! J'adore le bleu.",
          translation: "It's pretty! I love the blue.",
        },
        {
          speaker: "Claire",
          text: "Tu préfères le bleu clair ou le bleu foncé ?",
          translation: "Do you prefer light blue or dark blue?",
        },
        {
          speaker: "Léa",
          text: "Le bleu foncé, c'est plus élégant !",
          translation: "Dark blue, it's more elegant!",
        },
        {
          speaker: "Claire",
          text: "D'accord ! Et cette jupe noire, elle va bien avec ?",
          translation: "Okay! And this black skirt, does it go well with it?",
        },
        {
          speaker: "Léa",
          text: "Oui, parfait ! Le noir va avec tout !",
          translation: "Yes, perfect! Black goes with everything!",
        },
      ],
      comprehensionQuestions: [
        {
          question: "What color does Léa prefer?",
          options: ["Light blue", "Dark blue", "Black", "Pink"],
          correctIndex: 1,
        },
        {
          question: "According to Léa, what goes with everything?",
          options: ["Blue", "White", "Black", "Gray"],
          correctIndex: 2,
        },
      ],
    },

    culture: {
      title: "Colors in French Culture",
      text: "Colors carry cultural significance in France! 'Les Bleus' is the beloved nickname of the French national football team. 'Voir la vie en rose' (to see life in pink) means to be optimistic — made famous by Édith Piaf's iconic song. 'Être vert de rage' (to be green with rage) expresses extreme anger. The French also have specific color terms like 'bordeaux' (burgundy) named after the famous wine region!",
      funFact: "🍷 Wine colors are serious business in France! 'Vin rouge' (red wine), 'vin blanc' (white wine), and 'vin rosé' (rosé wine) each have their own glass shape, serving temperature, and food pairings. Never put ice in wine unless you want shocked looks!",
    },

    summary: {
      keyPoints: [
        "Most colors agree with nouns: add 'e' for feminine, 's' for plural",
        "Regular pattern: bleu/bleue, noir/noire, vert/verte, gris/grise",
        "Special feminine forms: blanc → blanche, violet → violette",
        "INVARIABLE colors (never change): orange, marron",
        "Same form for M/F: rouge, jaune, rose",
        "Use 'clair' (light) and 'foncé' (dark) AFTER the color",
      ],
      practicePrompt: "Look around you right now and describe 5 things with their colors in French: 'Mon téléphone est noir. La fenêtre est blanche...' Pay attention to gender!",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What is 'green' in French (masculine form)?",
      content: {
        options: ["vert", "verte", "verts", "vertes"],
        correctIndex: 0,
      },
      hint: "The masculine singular form is the basic form",
      explanation: "'Vert' is masculine singular. Add 'e' for feminine (verte), 's' for plural.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "Which color NEVER changes form (is invariable)?",
      content: {
        options: ["orange", "bleu", "vert", "noir"],
        correctIndex: 0,
      },
      hint: "Some colors borrowed from objects (like fruits!) stay the same",
      explanation: "'Orange' and 'marron' are invariable — they never add 'e' or 's'!",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the French colors with their translations:",
      content: {
        pairs: [
          { left: "blanc", right: "white" },
          { left: "noir", right: "black" },
          { left: "rouge", right: "red" },
          { left: "jaune", right: "yellow" },
          { left: "rose", right: "pink" },
        ],
      },
      hint: "Think of things associated with each color",
      explanation: "These basic colors are essential for describing anything!",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: La robe est _____ (blue, feminine).",
      content: {
        sentence: "La robe est _____.",
        answer: "bleue",
        options: ["bleue", "bleu", "bleus", "bleues"],
        caseSensitive: false,
      },
      hint: "'Robe' is feminine, so the color needs an 'e'",
      explanation: "'Robe' is feminine → 'bleu' becomes 'bleue'. Add 'e' for feminine!",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Les chaussures sont _____ (black, feminine plural).",
      content: {
        sentence: "Les chaussures sont _____.",
        answer: "noires",
        options: ["noires", "noir", "noire", "noirs"],
        caseSensitive: false,
      },
      hint: "'Chaussures' is feminine AND plural — two changes needed!",
      explanation: "'Noir' → 'noire' (feminine) → 'noires' (feminine plural). Double change!",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'The car is white.' (voiture = feminine)",
      content: {
        correctAnswer: "La voiture est blanche.",
        acceptableAnswers: [
          "La voiture est blanche.",
          "La voiture est blanche",
        ],
        direction: "to_target",
      },
      hint: "'Voiture' is feminine, so 'blanc' becomes...?",
      explanation: "'Blanc' has a special feminine form: 'blanche'. The pronunciation changes too!",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 6,
    },
    {
      exercise_type: "REORDER",
      question: "Put the words in order: sont / les / vertes / pommes",
      content: {
        words: ["sont", "les", "vertes", "pommes"],
        correctOrder: ["les", "pommes", "sont", "vertes"],
        translation: "The apples are green",
      },
      hint: "Start with the subject (les pommes), then verb, then color",
      explanation: "'Les pommes sont vertes' — Subject + verb + adjective (agreeing with feminine plural).",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 7,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and identify the color mentioned:",
      content: {
        ttsText: "J'aime le bleu foncé.",
        ttsLang: "fr-FR",
        options: [
          "dark blue",
          "light blue",
          "dark green",
          "light green",
        ],
        correctIndex: 0,
      },
      hint: "Listen for 'bleu' and what comes after it",
      explanation: "'Bleu foncé' = dark blue. 'Foncé' means dark, 'clair' means light.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 8,
    },
    {
      exercise_type: "SPEAK",
      question: "Say in French: 'The sky is blue.'",
      content: {
        targetText: "Le ciel est bleu.",
        targetTranslation: "The sky is blue.",
        acceptableVariants: [
          "Le ciel est bleu",
        ],
      },
      hint: "'Ciel' (sky) is masculine, so use the masculine form of blue",
      explanation: "'Le ciel' is masculine → 'bleu' (not 'bleue').",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 9,
    },
    {
      exercise_type: "SPEAK",
      question: "Describe in French: 'a white house' (maison = feminine)",
      content: {
        targetText: "une maison blanche",
        targetTranslation: "a white house",
        acceptableVariants: [
          "une maison blanche",
          "la maison blanche",
          "la maison est blanche",
        ],
      },
      hint: "'Maison' is feminine, so 'blanc' becomes...?",
      explanation: "'Maison' is feminine → 'blanc' becomes 'blanche'.",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 10,
    },
  ],
};
