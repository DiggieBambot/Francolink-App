// Course: French A1
// Unit: 6 - People & Relationships
// Lesson: 4 - Adjective Agreement

export const frenchA1U6L4 = {
  metadata: {
    course: "fr-a1",
    unit: 6,
    lesson: 4,
    title: "Adjective Agreement",
    slug: "adjective-agreement",
    type: "GRAMMAR",
    estimatedMinutes: 18,
    xpReward: 25,
  },

  content: {
    introduction: {
      text: "In French, adjectives must agree with the noun they describe. This means they change depending on gender (masculine/feminine) and number (singular/plural). In this lesson, you'll master this essential rule!",
      culturalNote: "🇫🇷 French grammar requires agreement everywhere! Adjectives must match the noun. Once you learn the patterns, it becomes natural — and it's one of the key differences between French and English.",
    },

    vocabulary: [
      {
        term: "gentil / gentille",
        translation: "kind / nice",
        pronunciation: "zhahn-tee / zhahn-teey",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Elle est gentille.",
          translation: "She is kind.",
        },
        tip: "Add -le for feminine: gentil → gentille.",
      },
      {
        term: "intelligent / intelligente",
        translation: "intelligent",
        pronunciation: "ahn-te-lee-zhahn",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Il est intelligent.",
          translation: "He is intelligent.",
        },
        tip: "Add -e for feminine.",
      },
      {
        term: "amusant / amusante",
        translation: "funny",
        pronunciation: "ah-mu-zahn",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "C'est une histoire amusante.",
          translation: "It's a funny story.",
        },
        tip: "Add -e for feminine.",
      },
      {
        term: "sportif / sportive",
        translation: "athletic",
        pronunciation: "spor-teef",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Elle est sportive.",
          translation: "She is athletic.",
        },
        tip: "Change -if to -ive for feminine.",
      },
      {
        term: "sympathique",
        translation: "nice / friendly",
        pronunciation: "sam-pah-teek",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Il est sympathique.",
          translation: "He is friendly.",
        },
        tip: "Same form for masculine and feminine.",
      },
      {
        term: "heureux / heureuse",
        translation: "happy",
        pronunciation: "uh-ruh / uh-ruhzz",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Elle est heureuse.",
          translation: "She is happy.",
        },
        tip: "Irregular feminine: heureux → heureuse.",
      },
    ],

    grammar: [
      {
        title: "Adjective Agreement Rules",
        explanation: "Adjectives agree with the noun in gender and number. Masculine singular is the base form. Add -e for feminine, add -s for plural.",
        examples: [
          {
            original: "Un garçon gentil",
            translation: "A kind boy",
            breakdown: "Masculine singular → gentil",
          },
          {
            original: "Une fille gentille",
            translation: "A kind girl",
            breakdown: "Add -e for feminine → gentille",
          },
          {
            original: "Des garçons gentils",
            translation: "Kind boys",
            breakdown: "Add -s for plural → gentils",
          },
          {
            original: "Des filles gentilles",
            translation: "Kind girls",
            breakdown: "Add -e and -s → gentilles",
          },
        ],
        commonMistakes: [
          "❌ 'Une fille gentil' — Missing feminine ending!",
          "✅ 'Une fille gentille' — Add -e for feminine.",
          "❌ 'Des garçons gentil' — Missing plural -s!",
          "✅ 'Des garçons gentils' — Add -s for plural.",
          "❌ 'Une femme sportif' — Wrong form!",
          "✅ 'Une femme sportive' — -if becomes -ive.",
        ],
      },
    ],

    dialogue: {
      title: "Description des amis",
      context: "Sophie describes her friends to Lucas.",
      lines: [
        { speaker: "Lucas", text: "Tes amis sont comment ?", translation: "What are your friends like?" },
        { speaker: "Sophie", text: "Ils sont très sympathiques et amusants.", translation: "They are very friendly and funny." },
        { speaker: "Lucas", text: "Et ton amie Claire ?", translation: "And your friend Claire?" },
        { speaker: "Sophie", text: "Elle est intelligente et sportive.", translation: "She is intelligent and athletic." },
        { speaker: "Lucas", text: "Et Marc ?", translation: "And Marc?" },
        { speaker: "Sophie", text: "Marc est gentil et très heureux en ce moment.", translation: "Marc is kind and very happy at the moment." },
      ],
      comprehensionQuestions: [
        { question: "How are Sophie's friends (plural)?", options: ["Serious", "Friendly and funny", "Tall", "Athletic"], correctIndex: 1 },
        { question: "How is Claire described?", options: ["Kind", "Funny", "Intelligent and athletic", "Short"], correctIndex: 2 },
      ],
    },

    culture: {
      title: "Compliments in French",
      text: "Compliments are common in France, especially about personality: 'Tu es très gentil !' (You're very kind!). However, exaggerated compliments may feel unnatural. Simple, sincere descriptions are preferred.",
      funFact: "😊 The word 'sympa' is a casual short form of 'sympathique'. It's extremely common in everyday French!",
    },

    summary: {
      keyPoints: [
        "Adjectives agree with noun gender and number",
        "Masculine singular = base form",
        "Add -e for feminine",
        "Add -s for plural",
        "-if → -ive for feminine (sportif → sportive)",
        "Some irregular forms (heureux → heureuse)",
      ],
      practicePrompt: "Describe two people you know: one man and one woman. Use correct adjective agreement!",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "Which is correct?",
      content: {
        options: [
          "Une fille intelligente",
          "Une fille intelligent",
          "Un garçon intelligente",
          "Un garçon intelligentes",
        ],
        correctIndex: 0,
      },
      hint: "Feminine noun → add -e",
      explanation: "Intelligente is the feminine form.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "Which is correct for plural masculine?",
      content: {
        options: [
          "Des garçons gentils",
          "Des garçons gentil",
          "Des garçons gentille",
          "Des garçons gentilles",
        ],
        correctIndex: 0,
      },
      hint: "Add -s for plural masculine.",
      explanation: "Masculine plural adds -s: gentils.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the adjective forms:",
      content: {
        pairs: [
          { left: "sportif", right: "sportive" },
          { left: "heureux", right: "heureuse" },
          { left: "gentil", right: "gentille" },
        ],
      },
      hint: "Feminine forms change.",
      explanation: "Many adjectives change spelling in feminine form.",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Une femme _____. (athletic)",
      content: {
        sentence: "Une femme _____.",
        answer: "sportive",
        options: ["sportive", "sportif", "sportives", "sportifs"],
        caseSensitive: false,
      },
      hint: "Feminine singular.",
      explanation: "Sportif → sportive.",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Des filles _____. (kind)",
      content: {
        sentence: "Des filles _____.",
        answer: "gentilles",
        options: ["gentilles", "gentils", "gentille", "gentil"],
        caseSensitive: false,
      },
      hint: "Feminine plural.",
      explanation: "Add -e and -s → gentilles.",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate: 'She is happy.'",
      content: {
        correctAnswer: "Elle est heureuse.",
        acceptableAnswers: ["Elle est heureuse."],
        direction: "to_target",
      },
      hint: "Heureux → heureuse.",
      explanation: "Irregular feminine form.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 6,
    },
    {
      exercise_type: "REORDER",
      question: "Put in order: sont / ils / amusants",
      content: {
        words: ["sont", "ils", "amusants"],
        correctOrder: ["ils", "sont", "amusants"],
        translation: "They are funny",
      },
      hint: "Subject first.",
      explanation: "Ils sont amusants.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 7,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and choose:",
      content: {
        ttsText: "Elle est intelligente et sportive.",
        ttsLang: "fr-FR",
        options: [
          "She is intelligent and athletic",
          "She is tall and athletic",
          "She is intelligent and funny",
          "She is young and kind",
        ],
        correctIndex: 0,
      },
      hint: "Listen for two adjectives.",
      explanation: "Intelligente + sportive.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 8,
    },
    {
      exercise_type: "SPEAK",
      question: "Say: 'They are kind.' (masculine plural)",
      content: {
        targetText: "Ils sont gentils.",
        targetTranslation: "They are kind.",
        acceptableVariants: ["Ils sont gentils"],
      },
      hint: "Masculine plural adds -s.",
      explanation: "Gentils = masculine plural.",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 9,
    },
    {
      exercise_type: "SPEAK",
      question: "Say: 'She is very friendly.'",
      content: {
        targetText: "Elle est très sympathique.",
        targetTranslation: "She is very friendly.",
        acceptableVariants: ["Elle est très sympathique"],
      },
      hint: "Sympathique doesn't change.",
      explanation: "Same form for masculine and feminine.",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 10,
    },
  ],
};
