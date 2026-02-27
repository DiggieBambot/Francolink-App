// Course: French A1
// Unit: 6 - People & Relationships
// Lesson: 3 - Physical Descriptions

export const frenchA1U6L3 = {
  metadata: {
    course: "fr-a1",
    unit: 6,
    lesson: 3,
    title: "Physical Descriptions",
    slug: "physical-descriptions",
    type: "VOCABULARY",
    estimatedMinutes: 15,
    xpReward: 20,
  },

  content: {
    introduction: {
      text: "How do you describe someone in French? In this lesson, you'll learn vocabulary to talk about hair, eyes, height, and general appearance. You'll be able to describe your friends, family, and even yourself!",
      culturalNote: "🇫🇷 In France, describing someone's appearance is common in everyday conversation. But remember: politeness matters. Focus on neutral descriptions like hair color and height rather than sensitive topics.",
    },

    vocabulary: [
      {
        term: "grand / grande",
        translation: "tall",
        pronunciation: "grahn / grahnd",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Il est grand.",
          translation: "He is tall.",
        },
        tip: "Add 'e' for feminine: grande.",
      },
      {
        term: "petit / petite",
        translation: "short / small",
        pronunciation: "puh-tee / puh-teet",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Elle est petite.",
          translation: "She is short.",
        },
        tip: "Masculine: petit, feminine: petite.",
      },
      {
        term: "jeune",
        translation: "young",
        pronunciation: "zhuhn",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Il est jeune.",
          translation: "He is young.",
        },
        tip: "Same form for masculine and feminine.",
      },
      {
        term: "vieux / vieille",
        translation: "old",
        pronunciation: "vyuh / vyay",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Ma grand-mère est vieille.",
          translation: "My grandmother is old.",
        },
        tip: "Irregular feminine form: vieux → vieille.",
      },
      {
        term: "brun / brune",
        translation: "brown-haired / dark-haired",
        pronunciation: "bruhn / broon",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Il est brun.",
          translation: "He has brown hair.",
        },
        tip: "Used mainly for hair color.",
      },
      {
        term: "blond / blonde",
        translation: "blond",
        pronunciation: "blon / blond",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Elle est blonde.",
          translation: "She is blonde.",
        },
        tip: "Add 'e' for feminine.",
      },
      {
        term: "les cheveux",
        translation: "hair",
        pronunciation: "lay shuh-vuh",
        partOfSpeech: "noun",
        gender: "masculine plural",
        exampleSentence: {
          original: "Il a les cheveux noirs.",
          translation: "He has black hair.",
        },
        tip: "Always plural in French!",
      },
      {
        term: "les yeux",
        translation: "eyes",
        pronunciation: "lay zuh",
        partOfSpeech: "noun",
        gender: "masculine plural",
        exampleSentence: {
          original: "Elle a les yeux bleus.",
          translation: "She has blue eyes.",
        },
        tip: "Also always plural.",
      },
      {
        term: "les lunettes",
        translation: "glasses",
        pronunciation: "lay loo-net",
        partOfSpeech: "noun",
        gender: "feminine plural",
        exampleSentence: {
          original: "Il porte des lunettes.",
          translation: "He wears glasses.",
        },
        tip: "Always plural.",
      },
      {
        term: "porter",
        translation: "to wear",
        pronunciation: "por-tay",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Elle porte une robe rouge.",
          translation: "She is wearing a red dress.",
        },
        tip: "Used for clothing and accessories.",
      },
      {
        term: "mince",
        translation: "thin",
        pronunciation: "mans",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Il est mince.",
          translation: "He is thin.",
        },
        tip: "Same form for masculine and feminine.",
      },
      {
        term: "fort / forte",
        translation: "strong / heavy",
        pronunciation: "for / fort",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Il est fort.",
          translation: "He is strong.",
        },
        tip: "Add 'e' for feminine.",
      },
    ],

    grammar: [
      {
        title: "Describing Physical Appearance",
        explanation: "Use 'être' (to be) for general descriptions and 'avoir' (to have) for features like hair and eyes.",
        examples: [
          {
            original: "Elle est grande.",
            translation: "She is tall.",
            breakdown: "Être + adjective",
          },
          {
            original: "Il a les yeux bleus.",
            translation: "He has blue eyes.",
            breakdown: "Avoir + les + noun + adjective",
          },
        ],
        commonMistakes: [
          "❌ 'Il est les cheveux noirs' — Wrong verb!",
          "✅ 'Il a les cheveux noirs' — Use 'avoir' for hair and eyes.",
          "❌ 'Elle a grande' — Wrong structure!",
          "✅ 'Elle est grande' — Use 'être' for height.",
        ],
      },
    ],

    dialogue: {
      title: "À quoi il ressemble ?",
      context: "Emma describes her brother to Julie.",
      lines: [
        { speaker: "Emma", text: "Julie, tu connais mon frère ?", translation: "Julie, do you know my brother?" },
        { speaker: "Julie", text: "Non, il est comment ?", translation: "No, what is he like?" },
        { speaker: "Emma", text: "Il est grand et brun.", translation: "He is tall and dark-haired." },
        { speaker: "Julie", text: "Il a les yeux bleus ?", translation: "Does he have blue eyes?" },
        { speaker: "Emma", text: "Non, il a les yeux marron.", translation: "No, he has brown eyes." },
        { speaker: "Julie", text: "Il porte des lunettes ?", translation: "Does he wear glasses?" },
        { speaker: "Emma", text: "Oui, il porte des lunettes noires.", translation: "Yes, he wears black glasses." },
      ],
      comprehensionQuestions: [
        { question: "Is Emma's brother tall?", options: ["Yes", "No"], correctIndex: 0 },
        { question: "What color are his eyes?", options: ["Blue", "Brown", "Green", "Black"], correctIndex: 1 },
      ],
    },

    culture: {
      title: "Describing People in France",
      text: "In France, it's common to describe someone by their hair color or glasses when identifying them. For example: 'C'est la fille blonde avec des lunettes.' (It's the blonde girl with glasses.) Keep descriptions neutral and respectful.",
      funFact: "👓 French opticians are everywhere! Glasses are very common in France — and stylish frames are a big fashion trend.",
    },

    summary: {
      keyPoints: [
        "Use 'être' for general description (Il est grand)",
        "Use 'avoir' for hair and eyes (Il a les cheveux noirs)",
        "Hair and eyes are always plural in French",
        "Adjectives change form for masculine/feminine",
      ],
      practicePrompt: "Describe someone you know in French. Include height, hair, and eye color!",
    },
  },

  exercises: [
    { exercise_type: "MULTIPLE_CHOICE", question: "How do you say 'He is tall'?", content: { options: ["Il est grand", "Il a grand", "Il est grande", "Il a grande"], correctIndex: 0 }, hint: "Use 'être'.", explanation: "Use 'être' + adjective: Il est grand.", difficulty: "EASY", xp_reward: 2, order_index: 1 },
    { exercise_type: "MULTIPLE_CHOICE", question: "Which is correct for 'She has blue eyes'?", content: { options: ["Elle a les yeux bleus", "Elle est les yeux bleus", "Elle a les yeux bleu", "Elle est bleus yeux"], correctIndex: 0 }, hint: "Use 'avoir' for eyes.", explanation: "Use 'avoir' + les yeux + adjective.", difficulty: "EASY", xp_reward: 2, order_index: 2 },
    { exercise_type: "MATCHING", question: "Match the adjectives:", content: { pairs: [ { left: "grand", right: "tall (m)" }, { left: "petite", right: "short (f)" }, { left: "blonde", right: "blond (f)" } ] }, hint: "Check gender.", explanation: "Adjectives change form based on gender.", difficulty: "EASY", xp_reward: 5, order_index: 3 },
    { exercise_type: "FILL_BLANK", question: "Complete: Elle est _____. (short)", content: { sentence: "Elle est _____.", answer: "petite", options: ["petite", "petit", "grand", "grande"], caseSensitive: false }, hint: "Feminine form.", explanation: "Petite is feminine.", difficulty: "EASY", xp_reward: 3, order_index: 4 },
    { exercise_type: "FILL_BLANK", question: "Complete: Il a les cheveux _____. (black)", content: { sentence: "Il a les cheveux _____.", answer: "noirs", options: ["noirs", "noir", "noire", "noires"], caseSensitive: false }, hint: "Cheveux is plural.", explanation: "Plural adjective → noirs.", difficulty: "MEDIUM", xp_reward: 3, order_index: 5 },
    { exercise_type: "TRANSLATION", question: "Translate: 'She has brown eyes.'", content: { correctAnswer: "Elle a les yeux marron.", acceptableAnswers: ["Elle a les yeux marron."], direction: "to_target" }, hint: "Use 'avoir'.", explanation: "Elle a les yeux marron.", difficulty: "MEDIUM", xp_reward: 4, order_index: 6 },
    { exercise_type: "REORDER", question: "Put in order: est / il / brun", content: { words: ["est", "il", "brun"], correctOrder: ["il", "est", "brun"], translation: "He is dark-haired" }, hint: "Subject first.", explanation: "Il est brun.", difficulty: "MEDIUM", xp_reward: 4, order_index: 7 },
    { exercise_type: "LISTENING", question: "Listen and choose:", content: { ttsText: "Elle est grande et blonde.", ttsLang: "fr-FR", options: ["She is tall and blonde", "She is short and blonde", "She is tall and brunette", "She has glasses"], correctIndex: 0 }, hint: "Listen for 'grande' and 'blonde'.", explanation: "Grande = tall, blonde = blonde.", difficulty: "MEDIUM", xp_reward: 4, order_index: 8 },
    { exercise_type: "SPEAK", question: "Say: 'He has green eyes.'", content: { targetText: "Il a les yeux verts.", targetTranslation: "He has green eyes.", acceptableVariants: ["Il a les yeux verts"] }, hint: "Plural adjective.", explanation: "Yeux = plural → verts.", difficulty: "MEDIUM", xp_reward: 5, order_index: 9 },
    { exercise_type: "SPEAK", question: "Describe someone in one sentence.", content: { targetText: "Il est grand et il a les yeux bleus.", targetTranslation: "He is tall and has blue eyes.", acceptableVariants: ["Il est grand et il a les yeux bleus"] }, hint: "Use être and avoir.", explanation: "Combine both structures.", difficulty: "HARD", xp_reward: 5, order_index: 10 },
  ],
};
