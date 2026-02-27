// Course: French A1
// Unit: 3 - Daily Life
// Lesson: 3 - Daily Routine (Evening)

export const frenchA1U3L3 = {
  metadata: {
    course: "fr-a1",
    unit: 3,
    lesson: 3,
    title: "Daily Routine – Evening",
    slug: "daily-routine-evening",
    type: "GRAMMAR",
    estimatedMinutes: 18,
    xpReward: 25,
  },

  content: {
    introduction: {
      text: "After a long day, how do you wind down? In this lesson, you'll learn to describe your evening routine — coming home, having dinner, relaxing, and going to bed. You'll also master the important difference between 'avant' (before) and 'après' (after) to sequence your activities.",
      culturalNote: "🇫🇷 In France, dinner (le dîner) is typically eaten between 7:30 PM and 9:00 PM — much later than in many other countries! It's often a more substantial, sit-down meal and an important time for family conversation. Eating dinner at 6 PM would be considered très américain!",
    },

    vocabulary: [
      {
        term: "rentrer",
        translation: "to return home / to come back",
        pronunciation: "ron-tray",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Je rentre à la maison à dix-huit heures.",
          translation: "I come home at 6 PM.",
        },
        tip: "Use 'rentrer chez moi' or 'rentrer à la maison' — both mean 'go home'.",
      },
      {
        term: "dîner",
        translation: "to have dinner / dinner",
        pronunciation: "dee-nay",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Nous dînons à vingt heures.",
          translation: "We have dinner at 8 PM.",
        },
        tip: "It's both a verb AND a noun! 'Je dîne' (I dine) / 'le dîner' (the dinner).",
      },
      {
        term: "se reposer",
        translation: "to rest",
        pronunciation: "suh ruh-poh-zay",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Je me repose après le travail.",
          translation: "I rest after work.",
        },
        tip: "Reflexive verb — don't forget your pronoun! Je ME repose.",
      },
      {
        term: "regarder la télé",
        translation: "to watch TV",
        pronunciation: "ruh-gar-day lah tay-lay",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Elle regarde la télé le soir.",
          translation: "She watches TV in the evening.",
        },
        tip: "'La télé' is short for 'la télévision' — everyone uses the short form!",
      },
      {
        term: "lire",
        translation: "to read",
        pronunciation: "leer",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "J'aime lire avant de dormir.",
          translation: "I like to read before sleeping.",
        },
        tip: "Irregular verb: je lis, tu lis, il lit, nous lisons, vous lisez, ils lisent.",
      },
      {
        term: "se coucher",
        translation: "to go to bed",
        pronunciation: "suh koo-shay",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Je me couche à vingt-deux heures.",
          translation: "I go to bed at 10 PM.",
        },
        tip: "Different from 'dormir' (to sleep)! You can be in bed but not sleeping yet.",
      },
      {
        term: "s'endormir",
        translation: "to fall asleep",
        pronunciation: "son-dor-meer",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Il s'endort vite.",
          translation: "He falls asleep quickly.",
        },
        tip: "Conjugates like 'dormir': je m'endors, tu t'endors, il s'endort...",
      },
      {
        term: "se déshabiller",
        translation: "to undress / to get undressed",
        pronunciation: "suh day-zah-bee-yay",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Je me déshabille avant de me coucher.",
          translation: "I undress before going to bed.",
        },
        tip: "The opposite of 's'habiller' (to get dressed). Easy to remember!",
      },
      {
        term: "faire la vaisselle",
        translation: "to do the dishes",
        pronunciation: "fair lah veh-sell",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Je fais la vaisselle après le dîner.",
          translation: "I do the dishes after dinner.",
        },
        tip: "One of many 'faire' expressions for household chores!",
      },
      {
        term: "avant",
        translation: "before",
        pronunciation: "ah-von",
        partOfSpeech: "preposition",
        exampleSentence: {
          original: "Avant le dîner, je me repose.",
          translation: "Before dinner, I rest.",
        },
        tip: "Use 'avant de + infinitive' for actions: 'avant de dormir' (before sleeping).",
      },
      {
        term: "après",
        translation: "after",
        pronunciation: "ah-preh",
        partOfSpeech: "preposition",
        exampleSentence: {
          original: "Après le dîner, je regarde la télé.",
          translation: "After dinner, I watch TV.",
        },
        tip: "Use 'après + noun' for things: 'après le travail' (after work).",
      },
      {
        term: "puis",
        translation: "then",
        pronunciation: "pwee",
        partOfSpeech: "adverb",
        exampleSentence: {
          original: "Je dîne, puis je regarde un film.",
          translation: "I have dinner, then I watch a movie.",
        },
        tip: "More casual alternative to 'ensuite'. Very common in spoken French!",
      },
    ],

    grammar: [
      {
        title: "Sequencing with 'Avant de' and 'Après'",
        explanation: "To describe the order of your activities, use 'avant' (before) and 'après' (after). Important: 'avant de' is followed by an infinitive verb, while 'après' is typically followed by a noun.",
        examples: [
          {
            original: "Avant de me coucher, je lis.",
            translation: "Before going to bed, I read.",
            breakdown: "Avant de (before) + me coucher (going to bed, infinitive) + je lis (I read)",
          },
          {
            original: "Après le dîner, je fais la vaisselle.",
            translation: "After dinner, I do the dishes.",
            breakdown: "Après (after) + le dîner (dinner, noun) + je fais la vaisselle (I do the dishes)",
          },
          {
            original: "Je me repose, puis je dîne.",
            translation: "I rest, then I have dinner.",
            breakdown: "Je me repose (I rest) + puis (then) + je dîne (I have dinner)",
          },
        ],
        commonMistakes: [
          "❌ 'Avant dormir' — Don't forget 'de' before the infinitive!",
          "✅ 'Avant de dormir' — Always use 'avant DE + infinitive'.",
          "❌ 'Je couche à dix heures' — Don't forget the reflexive pronoun!",
          "✅ 'Je me couche à dix heures' — 'Se coucher' needs 'me' with 'je'.",
          "❌ Confusing 'se coucher' with 'dormir' — they're different!",
          "✅ 'Se coucher' = go to bed, 'dormir' = sleep, 's'endormir' = fall asleep.",
        ],
      },
    ],

    dialogue: {
      title: "La soirée de Sophie",
      context: "Sophie describes her typical evening to her colleague Marc during lunch break.",
      lines: [
        {
          speaker: "Marc",
          text: "Tu rentres à quelle heure le soir ?",
          translation: "What time do you come home in the evening?",
        },
        {
          speaker: "Sophie",
          text: "Je rentre vers dix-huit heures trente.",
          translation: "I come home around 6:30 PM.",
        },
        {
          speaker: "Marc",
          text: "Et qu'est-ce que tu fais après ?",
          translation: "And what do you do after?",
        },
        {
          speaker: "Sophie",
          text: "D'abord, je me repose un peu. Puis, je prépare le dîner.",
          translation: "First, I rest a bit. Then, I prepare dinner.",
        },
        {
          speaker: "Marc",
          text: "Tu dînes à quelle heure ?",
          translation: "What time do you have dinner?",
        },
        {
          speaker: "Sophie",
          text: "Je dîne à vingt heures. Après, je regarde la télé ou je lis. Et je me couche vers vingt-deux heures.",
          translation: "I have dinner at 8 PM. After, I watch TV or I read. And I go to bed around 10 PM.",
        },
      ],
      comprehensionQuestions: [
        {
          question: "What time does Sophie come home?",
          options: ["6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM"],
          correctIndex: 1,
        },
        {
          question: "What does Sophie do before preparing dinner?",
          options: ["Watches TV", "Reads", "Rests", "Does the dishes"],
          correctIndex: 2,
        },
      ],
    },

    culture: {
      title: "Les soirées françaises",
      text: "French evenings are often centered around food and family. Dinner is typically a multi-course affair, even on weekdays: an entrée (starter), a plat principal (main course), and often cheese or dessert. Unlike grab-and-go dinners, the French sit down together and take their time — often an hour or more. After dinner, it's common to relax with television, reading, or simply conversation. This evening rhythm is considered essential to 'l'art de vivre' (the art of living).",
      funFact: "📺 The French evening news (le journal de 20 heures) airs at exactly 8 PM and is watched by millions. Many families plan dinner around it — eating while watching 'le 20 heures' is a national tradition!",
    },

    summary: {
      keyPoints: [
        "Evening reflexive verbs: se reposer, se coucher, s'endormir, se déshabiller",
        "'Avant de + infinitive' = before doing something (avant de dormir)",
        "'Après + noun' = after something (après le dîner)",
        "Three different verbs: se coucher (go to bed) ≠ dormir (sleep) ≠ s'endormir (fall asleep)",
        "Sequence words: d'abord → puis/ensuite → enfin",
        "French dinner is typically between 7:30 and 9 PM",
      ],
      practicePrompt: "Tonight, describe your evening routine out loud in French as you do it: 'Je rentre... je me repose... je dîne...' Tomorrow, try writing it down!",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What does 'se coucher' mean?",
      content: {
        options: [
          "to go to bed",
          "to fall asleep",
          "to sleep",
          "to wake up",
        ],
        correctIndex: 0,
      },
      hint: "Think about what you do BEFORE actually sleeping",
      explanation: "'Se coucher' = to go to bed. 'Dormir' = to sleep. 'S'endormir' = to fall asleep. Three different things!",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "How do you say 'before sleeping' in French?",
      content: {
        options: [
          "avant de dormir",
          "avant dormir",
          "après dormir",
          "avant le dormir",
        ],
        correctIndex: 0,
      },
      hint: "'Avant' needs something extra before a verb...",
      explanation: "Use 'avant DE + infinitive'. Don't forget the 'de'!",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the French phrases with their meanings:",
      content: {
        pairs: [
          { left: "se coucher", right: "to go to bed" },
          { left: "s'endormir", right: "to fall asleep" },
          { left: "se reposer", right: "to rest" },
          { left: "se déshabiller", right: "to undress" },
          { left: "faire la vaisselle", right: "to do the dishes" },
        ],
      },
      hint: "Think about what you do each evening",
      explanation: "These are essential verbs for describing your evening routine.",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Je _____ couche à dix heures.",
      content: {
        sentence: "Je _____ couche à dix heures.",
        answer: "me",
        options: ["me", "te", "se", "le"],
        caseSensitive: false,
      },
      hint: "What reflexive pronoun goes with 'je'?",
      explanation: "'Se coucher' with 'je' requires 'me': Je me couche.",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Avant _____ me coucher, je lis.",
      content: {
        sentence: "Avant _____ me coucher, je lis.",
        answer: "de",
        options: ["de", "à", "le", "du"],
        caseSensitive: false,
      },
      hint: "'Avant' + ??? + infinitive verb",
      explanation: "'Avant de + infinitive' is the correct structure. Always 'de' before a verb!",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'I rest after work.'",
      content: {
        correctAnswer: "Je me repose après le travail.",
        acceptableAnswers: [
          "Je me repose après le travail.",
          "Je me repose après le travail",
          "Après le travail, je me repose.",
          "Après le travail je me repose",
        ],
        direction: "to_target",
      },
      hint: "'Se reposer' is reflexive, and 'after work' = 'après le travail'",
      explanation: "'Se reposer' needs 'me' with 'je'. 'After work' = 'après le travail'.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 6,
    },
    {
      exercise_type: "REORDER",
      question: "Put the words in order: couche / à / je / heures / me / vingt-deux",
      content: {
        words: ["couche", "à", "je", "heures", "me", "vingt-deux"],
        correctOrder: ["je", "me", "couche", "à", "vingt-deux", "heures"],
        translation: "I go to bed at 10 PM",
      },
      hint: "Start with subject + reflexive pronoun + verb",
      explanation: "'Je me couche à vingt-deux heures' — Subject + pronoun + verb + time.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 7,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and select what Sophie does:",
      content: {
        ttsText: "Après le dîner, je me repose.",
        ttsLang: "fr-FR",
        options: [
          "She rests after dinner",
          "She prepares dinner",
          "She goes to bed after dinner",
          "She watches TV after dinner",
        ],
        correctIndex: 0,
      },
      hint: "Listen for 'après' (after) and 'se reposer' (to rest)",
      explanation: "'Après le dîner, je me repose' = After dinner, I rest.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 8,
    },
    {
      exercise_type: "SPEAK",
      question: "Say in French: 'I go to bed at 10 PM.'",
      content: {
        targetText: "Je me couche à vingt-deux heures.",
        targetTranslation: "I go to bed at 10 PM.",
        acceptableVariants: [
          "Je me couche à vingt-deux heures",
          "Je me couche à dix heures du soir",
          "Je me couche à 22 heures",
        ],
      },
      hint: "Use 'se coucher' with the 24-hour time",
      explanation: "22h00 (vingt-deux heures) is 10 PM in 24-hour format.",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 9,
    },
    {
      exercise_type: "SPEAK",
      question: "Say in French: 'Before sleeping, I read.'",
      content: {
        targetText: "Avant de dormir, je lis.",
        targetTranslation: "Before sleeping, I read.",
        acceptableVariants: [
          "Avant de dormir je lis",
          "Avant de dormir, je lis",
          "Je lis avant de dormir",
        ],
      },
      hint: "Use 'avant de + infinitive'",
      explanation: "'Avant de dormir, je lis' — perfect use of 'avant de + infinitive'!",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 10,
    },
  ],
};
