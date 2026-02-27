// Course: French A1
// Unit: 6 - People & Relationships
// Lesson: 1 - Family Members

export const frenchA1U6L1 = {
  metadata: {
    course: "fr-a1",
    unit: 6,
    lesson: 1,
    title: "Family Members",
    slug: "family-members",
    type: "VOCABULARY",
    estimatedMinutes: 15,
    xpReward: 20,
  },

  content: {
    introduction: {
      text: "Family is an important part of life in France. In this lesson, you'll learn how to talk about your family members — parents, siblings, grandparents, and children. Get ready to introduce your famille !",
      culturalNote: "🇫🇷 Family gatherings are very important in France. Sunday lunch with grandparents is a tradition in many families. Meals can last for hours and include several courses — it's about spending time together.",
    },

    vocabulary: [
      {
        term: "la famille",
        translation: "the family",
        pronunciation: "lah fah-mee",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Ma famille est très importante pour moi.",
          translation: "My family is very important to me.",
        },
        tip: "Notice it's feminine: 'la famille'.",
      },
      {
        term: "le père",
        translation: "the father",
        pronunciation: "luh pair",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Mon père travaille en ville.",
          translation: "My father works in town.",
        },
        tip: "The accent changes the meaning. 'Pere' without accent is incorrect.",
      },
      {
        term: "la mère",
        translation: "the mother",
        pronunciation: "lah mair",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Ma mère adore cuisiner.",
          translation: "My mother loves cooking.",
        },
        tip: "Very similar pronunciation to 'père' — listen carefully!",
      },
      {
        term: "les parents",
        translation: "parents",
        pronunciation: "lay pah-rahn",
        partOfSpeech: "noun",
        gender: "masculine plural",
        exampleSentence: {
          original: "Mes parents habitent à Paris.",
          translation: "My parents live in Paris.",
        },
        tip: "Always plural. Includes both mother and father.",
      },
      {
        term: "le frère",
        translation: "the brother",
        pronunciation: "luh frair",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Mon frère est étudiant.",
          translation: "My brother is a student.",
        },
        tip: "Accent grave like 'père' and 'mère'.",
      },
      {
        term: "la sœur",
        translation: "the sister",
        pronunciation: "lah suhr",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Ma sœur a dix ans.",
          translation: "My sister is ten years old.",
        },
        tip: "Special spelling with 'œ'.",
      },
      {
        term: "le grand-père",
        translation: "the grandfather",
        pronunciation: "luh grahn-pair",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Mon grand-père vit à la campagne.",
          translation: "My grandfather lives in the countryside.",
        },
        tip: "'Grand-' often indicates older family members.",
      },
      {
        term: "la grand-mère",
        translation: "the grandmother",
        pronunciation: "lah grahn-mair",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Ma grand-mère fait un gâteau délicieux.",
          translation: "My grandmother makes a delicious cake.",
        },
        tip: "Very common in French culture — grandmothers cook amazing food!",
      },
      {
        term: "le fils",
        translation: "the son",
        pronunciation: "luh fees",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Le fils de Marc est très gentil.",
          translation: "Marc's son is very kind.",
        },
        tip: "The 's' is silent.",
      },
      {
        term: "la fille",
        translation: "the daughter",
        pronunciation: "lah fee-yuh",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Sa fille est à l'école.",
          translation: "His/Her daughter is at school.",
        },
        tip: "Also means 'girl' depending on context.",
      },
      {
        term: "le mari",
        translation: "the husband",
        pronunciation: "luh mah-ree",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Son mari travaille à la banque.",
          translation: "Her husband works at the bank.",
        },
        tip: "Masculine noun — don't confuse with 'mariée' (bride).",
      },
      {
        term: "la femme",
        translation: "the wife / woman",
        pronunciation: "lah fam",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "C'est la femme de Paul.",
          translation: "She is Paul's wife.",
        },
        tip: "Can mean 'woman' or 'wife' depending on context.",
      },
    ],

    grammar: [
      {
        title: "Talking About Family",
        explanation: "To talk about family members, use possessive adjectives (mon, ma, mes) and 'de' for relationships.",
        examples: [
          {
            original: "C'est le frère de Sophie.",
            translation: "He is Sophie's brother.",
            breakdown: "Le frère + de + Sophie",
          },
          {
            original: "Voici mes parents.",
            translation: "Here are my parents.",
            breakdown: "Mes = my (plural noun)",
          },
        ],
        commonMistakes: [
          "❌ 'Le mère' — Wrong gender!",
          "✅ 'La mère' — 'Mère' is feminine.",
          "❌ 'Les parent' — Missing plural!",
          "✅ 'Les parents' — Always plural.",
        ],
      },
    ],

    dialogue: {
      title: "Ma famille",
      context: "Julie talks about her family to Marc.",
      lines: [
        { speaker: "Julie", text: "Marc, tu as des frères ou des sœurs ?", translation: "Marc, do you have brothers or sisters?" },
        { speaker: "Marc", text: "Oui, j'ai un frère et une sœur. Et toi ?", translation: "Yes, I have a brother and a sister. And you?" },
        { speaker: "Julie", text: "Moi, j'ai une sœur. Elle s'appelle Emma.", translation: "I have a sister. Her name is Emma." },
        { speaker: "Marc", text: "Tes parents habitent ici ?", translation: "Do your parents live here?" },
        { speaker: "Julie", text: "Non, mes parents habitent à Lyon.", translation: "No, my parents live in Lyon." },
        { speaker: "Marc", text: "Ah d'accord ! Tu vois souvent ta famille ?", translation: "Oh okay! Do you see your family often?" },
        { speaker: "Julie", text: "Oui, surtout le week-end.", translation: "Yes, especially on weekends." },
      ],
      comprehensionQuestions: [
        { question: "How many siblings does Marc have?", options: ["One", "Two", "Three", "None"], correctIndex: 1 },
        { question: "Where do Julie's parents live?", options: ["Paris", "Nice", "Lyon", "Marseille"], correctIndex: 2 },
      ],
    },

    culture: {
      title: "Family Life in France",
      text: "French families often gather for Sunday lunch (le déjeuner du dimanche). It's a time for grandparents, parents, and children to share a long meal together. Family bonds are strong, and it's common for adult children to visit their parents regularly.",
      funFact: "👵 In France, it's common to call grandparents 'Papi' and 'Mamie' — affectionate nicknames used by children.",
    },

    summary: {
      keyPoints: [
        "Family vocabulary: père, mère, frère, sœur, parents",
        "Grandparents: grand-père, grand-mère",
        "Children: fils, fille",
        "Use 'de' to show relationships (le frère de Marc)",
        "Pay attention to gender and plural forms",
      ],
      practicePrompt: "Describe your family in French! Say: 'J'ai un frère et une sœur. Mes parents habitent...' Practice aloud!",
    },
  },

  exercises: [
    { exercise_type: "MULTIPLE_CHOICE", question: "What is 'mother' in French?", content: { options: ["la mère", "le mère", "la sœur", "le père"], correctIndex: 0 }, hint: "It is feminine.", explanation: "'La mère' means mother.", difficulty: "EASY", xp_reward: 2, order_index: 1 },
    { exercise_type: "MULTIPLE_CHOICE", question: "What does 'le frère' mean?", content: { options: ["father", "brother", "son", "husband"], correctIndex: 1 }, hint: "It sounds like 'frair'.", explanation: "'Le frère' means brother.", difficulty: "EASY", xp_reward: 2, order_index: 2 },
    { exercise_type: "MATCHING", question: "Match the French words with their meanings:", content: { pairs: [ { left: "la sœur", right: "sister" }, { left: "le fils", right: "son" }, { left: "la fille", right: "daughter" }, { left: "le mari", right: "husband" }, { left: "la femme", right: "wife" } ] }, hint: "Family members!", explanation: "These are key family vocabulary words.", difficulty: "EASY", xp_reward: 5, order_index: 3 },
    { exercise_type: "FILL_BLANK", question: "Complete: Mon _____ est étudiant. (brother)", content: { sentence: "Mon _____ est étudiant.", answer: "frère", options: ["frère", "sœur", "mère", "fille"], caseSensitive: false }, hint: "'Frère' means brother.", explanation: "'Mon frère' means my brother.", difficulty: "EASY", xp_reward: 3, order_index: 4 },
    { exercise_type: "FILL_BLANK", question: "Complete: Ma _____ adore cuisiner. (mother)", content: { sentence: "Ma _____ adore cuisiner.", answer: "mère", options: ["mère", "père", "frère", "fils"], caseSensitive: false }, hint: "Feminine noun.", explanation: "'Ma mère' means my mother.", difficulty: "EASY", xp_reward: 3, order_index: 5 },
    { exercise_type: "TRANSLATION", question: "Translate: 'I have two sisters.'", content: { correctAnswer: "J'ai deux sœurs.", acceptableAnswers: ["J'ai deux sœurs.", "J'ai deux soeurs."], direction: "to_target" }, hint: "'Deux' = two, 'sœurs' = sisters.", explanation: "'J'ai deux sœurs' is correct.", difficulty: "MEDIUM", xp_reward: 4, order_index: 6 },
    { exercise_type: "REORDER", question: "Put in order: parents / mes / habitent / Lyon / à", content: { words: ["parents", "mes", "habitent", "Lyon", "à"], correctOrder: ["mes", "parents", "habitent", "à", "Lyon"], translation: "My parents live in Lyon" }, hint: "Possessive first.", explanation: "'Mes parents habitent à Lyon.'", difficulty: "MEDIUM", xp_reward: 4, order_index: 7 },
    { exercise_type: "LISTENING", question: "Listen and select the correct meaning:", content: { ttsText: "J'ai un frère et une sœur.", ttsLang: "fr-FR", options: ["I have one brother and one sister", "I have two brothers", "I have two sisters", "I have no siblings"], correctIndex: 0 }, hint: "Listen for 'frère' and 'sœur'.", explanation: "'Un frère et une sœur' means one brother and one sister.", difficulty: "MEDIUM", xp_reward: 4, order_index: 8 },
    { exercise_type: "SPEAK", question: "Say: 'My father lives in Paris.'", content: { targetText: "Mon père habite à Paris.", targetTranslation: "My father lives in Paris.", acceptableVariants: ["Mon père habite à Paris"] }, hint: "'Father' = père.", explanation: "Use 'mon père' for my father.", difficulty: "MEDIUM", xp_reward: 5, order_index: 9 },
    { exercise_type: "SPEAK", question: "Introduce your family in one sentence.", content: { targetText: "J'ai une grande famille.", targetTranslation: "I have a big family.", acceptableVariants: ["J'ai une grande famille", "J'ai un frère et une sœur"] }, hint: "Use 'J'ai...'", explanation: "Describe your family with 'J'ai...'.", difficulty: "HARD", xp_reward: 5, order_index: 10 },
  ],
};
