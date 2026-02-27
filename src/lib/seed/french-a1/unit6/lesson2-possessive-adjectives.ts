// Course: French A1
// Unit: 6 - People & Relationships
// Lesson: 2 - Possessive Adjectives (mon, ma, mes)

export const frenchA1U6L2 = {
  metadata: {
    course: "fr-a1",
    unit: 6,
    lesson: 2,
    title: "Possessive Adjectives (mon, ma, mes)",
    slug: "possessive-adjectives",
    type: "GRAMMAR",
    estimatedMinutes: 18,
    xpReward: 25,
  },

  content: {
    introduction: {
      text: "How do you say 'my mother', 'my brother', or 'my parents' in French? You need possessive adjectives! In this lesson, you'll learn how to use 'mon', 'ma', and 'mes' correctly. The important rule: they agree with the noun — not the person!",
      culturalNote: "🇫🇷 In French, possessive adjectives depend on the gender and number of the noun, not the speaker. So even a woman says 'mon frère' (my brother) — because 'frère' is masculine!",
    },

    vocabulary: [
      {
        term: "mon",
        translation: "my (masculine singular)",
        pronunciation: "mon",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Mon frère est étudiant.",
          translation: "My brother is a student.",
        },
        tip: "Use 'mon' before masculine singular nouns.",
      },
      {
        term: "ma",
        translation: "my (feminine singular)",
        pronunciation: "mah",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Ma sœur est professeure.",
          translation: "My sister is a teacher.",
        },
        tip: "Use 'ma' before feminine singular nouns.",
      },
      {
        term: "mes",
        translation: "my (plural)",
        pronunciation: "may",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Mes parents habitent à Lyon.",
          translation: "My parents live in Lyon.",
        },
        tip: "Use 'mes' for ALL plural nouns — masculine or feminine.",
      },
      {
        term: "ton / ta / tes",
        translation: "your (informal)",
        pronunciation: "ton / tah / tay",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Ton frère est sympa.",
          translation: "Your brother is nice.",
        },
        tip: "Same pattern as mon/ma/mes but for 'tu'.",
      },
      {
        term: "son / sa / ses",
        translation: "his/her (singular)",
        pronunciation: "son / sah / say",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Sa mère travaille ici.",
          translation: "His/Her mother works here.",
        },
        tip: "Important: 'son/sa/ses' depend on the noun, NOT on whether it's his or her.",
      },
      {
        term: "notre / nos",
        translation: "our",
        pronunciation: "notr / noh",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Notre maison est grande.",
          translation: "Our house is big.",
        },
        tip: "Singular noun → notre. Plural noun → nos.",
      },
      {
        term: "votre / vos",
        translation: "your (formal/plural)",
        pronunciation: "votr / voh",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Votre famille est ici ?",
          translation: "Is your family here?",
        },
        tip: "Used for 'vous' (formal singular or plural).",
      },
      {
        term: "leur / leurs",
        translation: "their",
        pronunciation: "luhr / luhr",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Leurs enfants sont à l'école.",
          translation: "Their children are at school.",
        },
        tip: "Singular noun → leur. Plural noun → leurs.",
      },
    ],

    grammar: [
      {
        title: "Agreement of Possessive Adjectives",
        explanation: "Possessive adjectives agree with the noun they describe — NOT with the person who owns it.",
        examples: [
          {
            original: "Mon frère",
            translation: "My brother",
            breakdown: "'Frère' is masculine → use 'mon'",
          },
          {
            original: "Ma sœur",
            translation: "My sister",
            breakdown: "'Sœur' is feminine → use 'ma'",
          },
          {
            original: "Mes parents",
            translation: "My parents",
            breakdown: "'Parents' is plural → use 'mes'",
          },
        ],
        commonMistakes: [
          "❌ 'Ma frère' — Wrong gender agreement!",
          "✅ 'Mon frère' — 'Frère' is masculine.",
          "❌ 'Mon sœur' — Wrong form!",
          "✅ 'Ma sœur' — 'Sœur' is feminine.",
          "❌ 'Mon parents' — Wrong plural form!",
          "✅ 'Mes parents' — Plural always uses 'mes'.",
        ],
      },
    ],

    dialogue: {
      title: "Ta famille",
      context: "Lucas asks Sophie about her family.",
      lines: [
        { speaker: "Lucas", text: "Sophie, ta famille habite ici ?", translation: "Sophie, does your family live here?" },
        { speaker: "Sophie", text: "Non, mes parents habitent à Bordeaux.", translation: "No, my parents live in Bordeaux." },
        { speaker: "Lucas", text: "Et ton frère ?", translation: "And your brother?" },
        { speaker: "Sophie", text: "Mon frère est à Paris. Sa femme travaille là-bas.", translation: "My brother is in Paris. His wife works there." },
        { speaker: "Lucas", text: "Vous voyez souvent vos parents ?", translation: "Do you see your parents often?" },
        { speaker: "Sophie", text: "Oui, nous visitons notre famille le week-end.", translation: "Yes, we visit our family on weekends." },
      ],
      comprehensionQuestions: [
        { question: "Where do Sophie's parents live?", options: ["Paris", "Lyon", "Bordeaux", "Nice"], correctIndex: 2 },
        { question: "Who works in Paris?", options: ["Her parents", "Her brother's wife", "Her sister", "Lucas"], correctIndex: 1 },
      ],
    },

    culture: {
      title: "Family Titles in France",
      text: "French children often call their parents 'Maman' and 'Papa'. Grandparents are commonly called 'Papi' and 'Mamie'. These affectionate names are widely used in everyday conversation.",
      funFact: "👨‍👩‍👧 In France, it's common for adult children to keep close contact with their parents — weekly visits or phone calls are typical.",
    },

    summary: {
      keyPoints: [
        "Mon = masculine singular",
        "Ma = feminine singular",
        "Mes = plural (both genders)",
        "Agreement depends on the noun, not the owner",
        "Same pattern for ton/ta/tes and son/sa/ses",
        "Notre/nos, votre/vos, leur/leurs follow singular/plural rule",
      ],
      practicePrompt: "Describe your family using possessive adjectives: 'Mon père..., ma mère..., mes parents...' Say them aloud!",
    },
  },

  exercises: [
    { exercise_type: "MULTIPLE_CHOICE", question: "Which form is correct for 'my sister'?", content: { options: ["ma sœur", "mon sœur", "mes sœur", "ma sœurs"], correctIndex: 0 }, hint: "'Sœur' is feminine.", explanation: "'Ma sœur' is correct because 'sœur' is feminine.", difficulty: "EASY", xp_reward: 2, order_index: 1 },
    { exercise_type: "MULTIPLE_CHOICE", question: "Which form is correct for 'my brother'?", content: { options: ["mon frère", "ma frère", "mes frère", "mon frères"], correctIndex: 0 }, hint: "'Frère' is masculine.", explanation: "'Mon frère' is correct.", difficulty: "EASY", xp_reward: 2, order_index: 2 },
    { exercise_type: "MATCHING", question: "Match the possessive adjective with its use:", content: { pairs: [ { left: "mon", right: "masculine singular" }, { left: "ma", right: "feminine singular" }, { left: "mes", right: "plural" } ] }, hint: "Think about gender and number.", explanation: "Mon = masculine, Ma = feminine, Mes = plural.", difficulty: "EASY", xp_reward: 5, order_index: 3 },
    { exercise_type: "FILL_BLANK", question: "Complete: _____ parents habitent ici. (my)", content: { sentence: "_____ parents habitent ici.", answer: "Mes", options: ["Mes", "Mon", "Ma", "Me"], caseSensitive: false }, hint: "'Parents' is plural.", explanation: "'Mes parents' because plural nouns use 'mes'.", difficulty: "EASY", xp_reward: 3, order_index: 4 },
    { exercise_type: "FILL_BLANK", question: "Complete: _____ mère travaille ici. (my)", content: { sentence: "_____ mère travaille ici.", answer: "Ma", options: ["Ma", "Mon", "Mes", "Me"], caseSensitive: false }, hint: "'Mère' is feminine.", explanation: "'Ma mère' because 'mère' is feminine singular.", difficulty: "EASY", xp_reward: 3, order_index: 5 },
    { exercise_type: "TRANSLATION", question: "Translate: 'My parents live in Paris.'", content: { correctAnswer: "Mes parents habitent à Paris.", acceptableAnswers: ["Mes parents habitent à Paris."], direction: "to_target" }, hint: "'Mes' for plural.", explanation: "'Mes parents habitent à Paris.'", difficulty: "MEDIUM", xp_reward: 4, order_index: 6 },
    { exercise_type: "REORDER", question: "Put in order: frère / mon / étudiant / est", content: { words: ["frère", "mon", "étudiant", "est"], correctOrder: ["mon", "frère", "est", "étudiant"], translation: "My brother is a student" }, hint: "Possessive comes before noun.", explanation: "'Mon frère est étudiant.'", difficulty: "MEDIUM", xp_reward: 4, order_index: 7 },
    { exercise_type: "LISTENING", question: "Listen and choose the correct sentence:", content: { ttsText: "Ma sœur est médecin.", ttsLang: "fr-FR", options: ["My sister is a doctor", "My brother is a doctor", "My sister is a student", "My mother is a doctor"], correctIndex: 0 }, hint: "Listen for 'sœur'.", explanation: "'Ma sœur est médecin.' = My sister is a doctor.", difficulty: "MEDIUM", xp_reward: 4, order_index: 8 },
    { exercise_type: "SPEAK", question: "Say: 'My mother is very kind.'", content: { targetText: "Ma mère est très gentille.", targetTranslation: "My mother is very kind.", acceptableVariants: ["Ma mère est très gentille"] }, hint: "'Mother' = mère.", explanation: "Use 'ma' because 'mère' is feminine.", difficulty: "MEDIUM", xp_reward: 5, order_index: 9 },
    { exercise_type: "SPEAK", question: "Say: 'My parents are at home.'", content: { targetText: "Mes parents sont à la maison.", targetTranslation: "My parents are at home.", acceptableVariants: ["Mes parents sont à la maison"] }, hint: "'Parents' is plural.", explanation: "Use 'mes' with plural nouns.", difficulty: "MEDIUM", xp_reward: 5, order_index: 10 },
  ],
};
