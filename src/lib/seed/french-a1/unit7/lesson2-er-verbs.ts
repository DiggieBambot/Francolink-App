export const frenchA1U7L2 = {
  metadata: {
    course: "fr-a1",
    unit: 7,
    lesson: 2,
    title: "Present Tense -er Verbs Review",
    slug: "er-verbs-review",
    type: "GRAMMAR",
    estimatedMinutes: 15,
    xpReward: 25,
  },

  content: {
    introduction: {
      text: "In this lesson, you'll review and solidify your knowledge of regular -er verb conjugation in the present tense. About 90% of French verbs follow the -er pattern, so mastering this is essential. We'll focus on work-related verbs to connect with the unit theme.",
      culturalNote: "🇫🇷 French verb conjugation may seem complex, but the good news is that many forms sound the same even though they're spelled differently. 'Je travaille', 'tu travailles', 'il travaille', and 'ils travaillent' all sound identical!",
    },

    vocabulary: [
      {
        term: "travailler",
        translation: "to work",
        pronunciation: "trah-vah-YAY",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Je travaille dans un bureau.",
          translation: "I work in an office.",
        },
        tip: "The most important work verb. Regular -er conjugation.",
      },
      {
        term: "commencer",
        translation: "to start / to begin",
        pronunciation: "koh-mahn-SAY",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Je commence à huit heures.",
          translation: "I start at eight o'clock.",
        },
        tip: "Note: 'nous commençons' — the 'c' gets a cedilla (ç) before 'o' to keep the soft 's' sound.",
      },
      {
        term: "terminer",
        translation: "to finish / to end",
        pronunciation: "tehr-mee-NAY",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Je termine à dix-sept heures.",
          translation: "I finish at five o'clock.",
        },
        tip: "Regular -er verb. 'Finir' also means 'to finish' but is an -ir verb.",
      },
      {
        term: "déjeuner",
        translation: "to have lunch",
        pronunciation: "day-zhuh-NAY",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "On déjeune à midi.",
          translation: "We have lunch at noon.",
        },
        tip: "Also a noun: 'le déjeuner' = lunch. Le petit déjeuner = breakfast.",
      },
      {
        term: "arriver",
        translation: "to arrive",
        pronunciation: "ah-ree-VAY",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "J'arrive au bureau à neuf heures.",
          translation: "I arrive at the office at nine.",
        },
        tip: "Regular -er verb. Very useful for daily routine descriptions.",
      },
      {
        term: "quitter",
        translation: "to leave (a place)",
        pronunciation: "kee-TAY",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Je quitte le bureau à dix-huit heures.",
          translation: "I leave the office at six.",
        },
        tip: "Takes a direct object — 'quitter le bureau' (no preposition needed).",
      },
      {
        term: "chercher",
        translation: "to look for / to search",
        pronunciation: "shehr-SHAY",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Je cherche un nouveau travail.",
          translation: "I'm looking for a new job.",
        },
        tip: "No preposition needed: 'chercher quelque chose' (not 'chercher pour').",
      },
      {
        term: "gagner",
        translation: "to earn / to win",
        pronunciation: "gah-NYAY",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Il gagne bien sa vie.",
          translation: "He earns a good living.",
        },
        tip: "Two meanings: 'gagner de l'argent' (earn money), 'gagner un match' (win a game).",
      },
      {
        term: "téléphoner",
        translation: "to phone / to call",
        pronunciation: "tay-lay-foh-NAY",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Elle téléphone à ses clients.",
          translation: "She phones her clients.",
        },
        tip: "Use 'à' before the person: 'téléphoner à quelqu'un'.",
      },
    ],

    grammar: [
      {
        title: "Regular -er Verb Conjugation Review",
        explanation: "To conjugate a regular -er verb: remove the -er ending to get the stem, then add the present tense endings: -e, -es, -e, -ons, -ez, -ent. Remember: je/tu/il/ils endings are all silent — they sound the same!",
        examples: [
          {
            original: "Travailler: je travaille, tu travailles, il/elle travaille, nous travaillons, vous travaillez, ils/elles travaillent",
            translation: "To work: I work, you work, he/she works, we work, you work, they work",
            breakdown: "Stem: travaill- + endings: -e, -es, -e, -ons, -ez, -ent",
          },
          {
            original: "Je commence à huit heures et je termine à cinq heures.",
            translation: "I start at eight and I finish at five.",
            breakdown: "commenc-e (I start) + termin-e (I finish) — both regular -er",
          },
        ],
        commonMistakes: [
          "❌ Je travailles (wrong — 'je' takes -e, not -es)",
          "✅ Je travaille (correct — 'je' ending is -e)",
          "❌ Nous travaillent (wrong — 'nous' takes -ons)",
          "✅ Nous travaillons (correct — 'nous' ending is always -ons)",
        ],
      },
      {
        title: "Describing Your Workday",
        explanation: "Combine -er verbs with time expressions to describe a typical workday. Use 'à' for specific times and 'de...à...' for time ranges.",
        examples: [
          {
            original: "Je travaille de neuf heures à cinq heures.",
            translation: "I work from nine to five.",
            breakdown: "de (from) + neuf heures (9:00) + à (to) + cinq heures (5:00)",
          },
          {
            original: "J'arrive au bureau, je déjeune à midi, et je quitte à six heures.",
            translation: "I arrive at the office, I have lunch at noon, and I leave at six.",
            breakdown: "Three -er verbs describing a daily sequence",
          },
        ],
        commonMistakes: [
          "❌ Je travaille depuis neuf heures à cinq heures (wrong preposition pattern)",
          "✅ Je travaille de neuf heures à cinq heures (correct — de...à... for time ranges)",
        ],
      },
    ],

    dialogue: {
      title: "A Typical Workday",
      image: "/images/dialogues/typical-workday.svg",
      context: "Hugo describes his workday to Léa.",
      lines: [
        {
          speaker: "léa",
          text: "Tu commences à quelle heure, Hugo ?",
          translation: "What time do you start, Hugo?",
        },
        {
          speaker: "hugo",
          text: "Je commence à huit heures. J'arrive au bureau à sept heures trente.",
          translation: "I start at eight. I arrive at the office at seven thirty.",
        },
        {
          speaker: "léa",
          text: "Tu déjeunes où ?",
          translation: "Where do you have lunch?",
        },
        {
          speaker: "hugo",
          text: "Je déjeune au restaurant avec mes collègues. On mange ensemble.",
          translation: "I have lunch at the restaurant with my colleagues. We eat together.",
        },
        {
          speaker: "léa",
          text: "Et tu termines à quelle heure ?",
          translation: "And what time do you finish?",
        },
        {
          speaker: "hugo",
          text: "Je termine à dix-sept heures. Je quitte le bureau et je rentre à la maison.",
          translation: "I finish at five. I leave the office and go home.",
        },
        {
          speaker: "léa",
          text: "Tu travailles le samedi ?",
          translation: "Do you work on Saturdays?",
        },
        {
          speaker: "hugo",
          text: "Non, jamais ! Je travaille du lundi au vendredi seulement.",
          translation: "No, never! I work from Monday to Friday only.",
        },
      ],
      comprehensionQuestions: [
        {
          question: "What time does Hugo arrive at the office?",
          options: ["At 7:00", "At 7:30", "At 8:00", "At 8:30"],
          correctIndex: 1,
        },
        {
          question: "Where does Hugo have lunch?",
          options: ["At home", "At his desk", "At a restaurant", "He doesn't eat lunch"],
          correctIndex: 2,
        },
      ],
    },

    culture: {
      title: "The French Lunch Break",
      text: "In France, the lunch break is sacred. Most workers take at least an hour, and many take up to two hours in some regions. Eating at your desk is frowned upon — the French prefer to leave the office, sit at a restaurant or café, and enjoy a proper meal. Many companies have subsidized meal vouchers called 'tickets restaurant' that employees use at local restaurants. This midday break is seen as essential for productivity and well-being.",
      funFact: "🎉 The French 'ticket restaurant' system was created in 1967. Today, about 4 million French workers use these meal vouchers daily. They can be used at restaurants, bakeries, and even some supermarkets!",
    },

    summary: {
      keyPoints: [
        "Regular -er endings: -e, -es, -e, -ons, -ez, -ent",
        "je/tu/il/ils forms all sound the same (silent endings)",
        "Work verbs: travailler, commencer, terminer, arriver, quitter",
        "Time ranges: 'de...à...' (from...to...)",
        "Specific times: 'à huit heures' (at eight o'clock)",
        "No preposition with 'chercher' and 'quitter' + direct object",
      ],
      practicePrompt: "Describe your typical workday or school day using -er verbs. Try: 'Je commence à... Je déjeune à... Je termine à... Je quitte...'",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What is the correct 'je' form of 'travailler'?",
      content: {
        options: ["Je travailles", "Je travaille", "Je travaillons", "Je travailler"],
        correctIndex: 1,
      },
      hint: "The 'je' ending for -er verbs is -e",
      explanation: "'Je travaille' — remove -er, add -e for the 'je' form.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "Which is the correct 'nous' form of 'commencer'?",
      content: {
        options: ["Nous commencent", "Nous commencons", "Nous commençons", "Nous commencer"],
        correctIndex: 2,
      },
      hint: "The 'c' needs a special mark to keep the soft sound before 'o'",
      explanation: "'Nous commençons' — the cedilla (ç) keeps the soft 's' sound before 'o'.",
      difficulty: "MEDIUM",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the verb forms with their subjects:",
      content: {
        pairs: [
          { left: "je travaille", right: "I work" },
          { left: "nous déjeunons", right: "we have lunch" },
          { left: "vous terminez", right: "you (formal) finish" },
          { left: "ils arrivent", right: "they arrive" },
        ],
      },
      hint: "Look at the verb endings to identify the subject",
      explanation: "-e = je, -ons = nous, -ez = vous, -ent = ils/elles.",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete the sentence:",
      content: {
        sentence: "Nous ___ à midi au restaurant.",
        answer: "déjeunons",
        options: ["déjeune", "déjeunes", "déjeunons", "déjeunent"],
        caseSensitive: false,
      },
      hint: "'Nous' takes the -ons ending",
      explanation: "'Nous déjeunons' — the 'nous' form always ends in -ons for -er verbs.",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete the sentence:",
      content: {
        sentence: "Elle ___ le bureau à dix-huit heures.",
        answer: "quitte",
        options: ["quitte", "quittes", "quittent", "quitter"],
        caseSensitive: false,
      },
      hint: "'Elle' takes the same ending as 'il' — third person singular",
      explanation: "'Elle quitte le bureau' — third person singular ending is -e.",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'I work from nine to five.'",
      content: {
        correctAnswer: "Je travaille de neuf heures à cinq heures.",
        acceptableAnswers: [
          "Je travaille de neuf heures à cinq heures",
          "je travaille de neuf heures à cinq heures",
          "Je travaille de 9h à 17h.",
          "Je travaille de 9h à 17h",
        ],
        direction: "to_target",
      },
      hint: "Use 'de...à...' for time ranges",
      explanation: "'Je travaille de neuf heures à cinq heures.' — 'de...à...' for from...to...",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 6,
    },
    {
      exercise_type: "REORDER",
      question: "Put the words in order:",
      content: {
        words: ["heures", "à", "commence", "je", "huit"],
        correctOrder: ["je", "commence", "à", "huit", "heures"],
        translation: "I start at eight o'clock",
      },
      hint: "Subject first, then verb, then time",
      explanation: "Correct order: Je commence à huit heures. (I start at eight o'clock.)",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 7,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and select the correct answer:",
      content: {
        ttsText: "Nous travaillons du lundi au vendredi. Nous commençons à neuf heures.",
        ttsLang: "fr-FR",
        options: [
          "We work Monday to Friday. We start at nine.",
          "We work Saturday and Sunday. We start at eight.",
          "They work Monday to Friday. They start at ten.",
          "We work every day. We finish at nine.",
        ],
        correctIndex: 0,
      },
      hint: "Listen for 'lundi au vendredi' and 'neuf heures'",
      explanation: "'Nous travaillons du lundi au vendredi. Nous commençons à neuf heures.' = Monday to Friday, starting at nine.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 8,
    },
    {
      exercise_type: "SPEAK",
      question: "Say this sentence out loud:",
      content: {
        targetText: "Je commence à huit heures et je termine à cinq heures.",
        targetTranslation: "I start at eight and I finish at five.",
        acceptableVariants: ["je commence à huit heures et je termine à cinq heures"],
      },
      hint: "Two -er verbs: commencer and terminer",
      explanation: "Great! You described your work schedule using two regular -er verbs.",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 9,
    },
    {
      exercise_type: "SPEAK",
      question: "Say this sentence out loud:",
      content: {
        targetText: "Nous déjeunons au restaurant avec nos collègues.",
        targetTranslation: "We have lunch at the restaurant with our colleagues.",
        acceptableVariants: ["nous déjeunons au restaurant avec nos collègues"],
      },
      hint: "Focus on the 'nous' form: déjeunons",
      explanation: "Excellent! 'Nous déjeunons' — perfect use of the 'nous' form of an -er verb.",
      difficulty: "HARD",
      xp_reward: 5,
      order_index: 10,
    },
  ],
};
