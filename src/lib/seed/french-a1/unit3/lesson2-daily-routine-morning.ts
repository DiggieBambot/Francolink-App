// Course: French A1
// Unit: 3 - Daily Life
// Lesson: 2 - Daily Routine (Morning)

export const frenchA1U3L2 = {
  metadata: {
    course: "fr-a1",
    unit: 3,
    lesson: 2,
    title: "Daily Routine – Morning",
    slug: "daily-routine-morning",
    type: "GRAMMAR",
    estimatedMinutes: 18,
    xpReward: 25,
  },

  content: {
    introduction: {
      text: "How do you start your day? In this lesson, you'll learn to describe your morning routine using reflexive verbs — special verbs where you do something to yourself. Waking up, washing, getting dressed... these everyday actions are your first step to thinking in French!",
      culturalNote: "🇫🇷 French mornings often start with 'un petit-déjeuner' (breakfast) of coffee, bread, butter, and jam. Croissants? Those are more of a weekend treat picked up fresh from the boulangerie! Don't expect eggs and bacon — that's very anglo-saxon.",
    },

    vocabulary: [
      {
        term: "se réveiller",
        translation: "to wake up",
        pronunciation: "suh ray-vay-yay",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Je me réveille à sept heures.",
          translation: "I wake up at seven o'clock.",
        },
        tip: "The 'se' changes based on who's doing it: je ME réveille, tu TE réveilles, il SE réveille.",
      },
      {
        term: "se lever",
        translation: "to get up",
        pronunciation: "suh luh-vay",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Elle se lève tôt.",
          translation: "She gets up early.",
        },
        tip: "Different from 'se réveiller'! You can wake up (réveiller) but still be in bed. 'Se lever' means actually getting out of bed.",
      },
      {
        term: "se laver",
        translation: "to wash (oneself)",
        pronunciation: "suh lah-vay",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Il se lave le visage.",
          translation: "He washes his face.",
        },
        tip: "Use THE article with body parts, not possessive: 'le visage', not 'son visage'. French knows whose face it is!",
      },
      {
        term: "se doucher",
        translation: "to shower",
        pronunciation: "suh doo-shay",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Je me douche le matin.",
          translation: "I shower in the morning.",
        },
        tip: "Alternative: 'prendre une douche' (to take a shower) — both are common.",
      },
      {
        term: "s'habiller",
        translation: "to get dressed",
        pronunciation: "sah-bee-yay",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Tu t'habilles vite.",
          translation: "You get dressed quickly.",
        },
        tip: "The 'se' becomes 's'' before a vowel. Same pattern: je m'habille, tu t'habilles.",
      },
      {
        term: "se brosser les dents",
        translation: "to brush one's teeth",
        pronunciation: "suh broh-say lay don",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Nous nous brossons les dents.",
          translation: "We brush our teeth.",
        },
        tip: "Again, use 'les dents' (THE teeth), not 'mes dents'. French reflexive verbs + body parts = definite article.",
      },
      {
        term: "le petit-déjeuner",
        translation: "breakfast",
        pronunciation: "luh puh-tee day-zhuh-nay",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Je prends le petit-déjeuner à huit heures.",
          translation: "I have breakfast at eight o'clock.",
        },
        tip: "Literally 'the small lunch'! 'Déjeuner' means lunch in France (but breakfast in Belgium/Canada).",
      },
      {
        term: "tôt",
        translation: "early",
        pronunciation: "toh",
        partOfSpeech: "adverb",
        exampleSentence: {
          original: "Je me lève tôt.",
          translation: "I get up early.",
        },
        tip: "Opposite of 'tard' (late). Both are super useful for routines!",
      },
      {
        term: "tard",
        translation: "late",
        pronunciation: "tar",
        partOfSpeech: "adverb",
        exampleSentence: {
          original: "Il se réveille tard le dimanche.",
          translation: "He wakes up late on Sundays.",
        },
        tip: "The 'd' is silent — just say 'tar'.",
      },
      {
        term: "d'abord",
        translation: "first / at first",
        pronunciation: "dah-bohr",
        partOfSpeech: "adverb",
        exampleSentence: {
          original: "D'abord, je me douche.",
          translation: "First, I shower.",
        },
        tip: "Perfect for sequencing your routine: d'abord... ensuite... enfin...",
      },
      {
        term: "ensuite",
        translation: "then / next",
        pronunciation: "on-sweet",
        partOfSpeech: "adverb",
        exampleSentence: {
          original: "Ensuite, je m'habille.",
          translation: "Then, I get dressed.",
        },
        tip: "Also 'puis' (then) — slightly more casual.",
      },
      {
        term: "enfin",
        translation: "finally",
        pronunciation: "on-fan",
        partOfSpeech: "adverb",
        exampleSentence: {
          original: "Enfin, je pars au travail.",
          translation: "Finally, I leave for work.",
        },
        tip: "Marks the last item in your sequence. Very satisfying to use!",
      },
    ],

    grammar: [
      {
        title: "Reflexive Verbs (Les verbes pronominaux)",
        explanation: "Reflexive verbs describe actions you do to yourself. They always have a reflexive pronoun (me, te, se, nous, vous, se) that matches the subject. In the infinitive form, you'll see 'se' before the verb: se laver, se réveiller.",
        examples: [
          {
            original: "Je me lave.",
            translation: "I wash (myself).",
            breakdown: "Je (I) + me (myself) + lave (wash) — the action reflects back to 'je'",
          },
          {
            original: "Tu te réveilles à quelle heure ?",
            translation: "What time do you wake up?",
            breakdown: "Tu (you) + te (yourself) + réveilles (wake) — the pronoun matches the subject",
          },
          {
            original: "Elle se brosse les cheveux.",
            translation: "She brushes her hair.",
            breakdown: "Elle (she) + se (herself) + brosse (brushes) + les cheveux (THE hair, not 'her hair')",
          },
        ],
        commonMistakes: [
          "❌ 'Je lève à sept heures' — Don't forget the reflexive pronoun!",
          "✅ 'Je me lève à sept heures' — Always include 'me' with 'je'.",
          "❌ 'Je se réveille' — The pronoun must match the subject!",
          "✅ 'Je me réveille' — 'Je' goes with 'me', always.",
          "❌ 'Je me lave mes mains' — Don't double up with possessive!",
          "✅ 'Je me lave les mains' — Use 'les' (the), not 'mes' (my).",
        ],
      },
    ],

    dialogue: {
      title: "La routine de Lucas",
      context: "Lucas describes his morning routine to his new roommate, Thomas.",
      lines: [
        {
          speaker: "Thomas",
          text: "Tu te réveilles à quelle heure le matin ?",
          translation: "What time do you wake up in the morning?",
        },
        {
          speaker: "Lucas",
          text: "Je me réveille à six heures et demie.",
          translation: "I wake up at 6:30.",
        },
        {
          speaker: "Thomas",
          text: "C'est tôt ! Et après, qu'est-ce que tu fais ?",
          translation: "That's early! And then, what do you do?",
        },
        {
          speaker: "Lucas",
          text: "D'abord, je me douche. Ensuite, je m'habille.",
          translation: "First, I shower. Then, I get dressed.",
        },
        {
          speaker: "Thomas",
          text: "Tu prends le petit-déjeuner ?",
          translation: "Do you have breakfast?",
        },
        {
          speaker: "Lucas",
          text: "Oui ! Je prends un café et une tartine. Et toi ?",
          translation: "Yes! I have a coffee and toast. And you?",
        },
      ],
      comprehensionQuestions: [
        {
          question: "What time does Lucas wake up?",
          options: ["6:00", "6:30", "7:00", "7:30"],
          correctIndex: 1,
        },
        {
          question: "What does Lucas do FIRST in the morning?",
          options: ["Gets dressed", "Has breakfast", "Showers", "Brushes teeth"],
          correctIndex: 2,
        },
      ],
    },

    culture: {
      title: "Le petit-déjeuner français",
      text: "The traditional French breakfast is surprisingly light compared to American or English breakfasts. It typically consists of bread (a baguette or tartines), butter, jam, and coffee or hot chocolate. Croissants and pains au chocolat are special treats for weekends or picked up fresh from the boulangerie on the way to work. You won't find eggs, bacon, or pancakes — that's considered very 'anglo-saxon'!",
      funFact: "☕ The French drink their coffee from bowls (un bol) at breakfast! This tradition allows for easy bread-dipping. Don't be surprised if grandma serves your café au lait in what looks like a soup bowl.",
    },

    summary: {
      keyPoints: [
        "Reflexive verbs use pronouns: me, te, se, nous, vous, se",
        "The pronoun MUST match the subject: je → me, tu → te, il/elle → se",
        "Use definite articles with body parts: 'les dents', not 'mes dents'",
        "Sequence words: d'abord (first) → ensuite (then) → enfin (finally)",
        "Common morning verbs: se réveiller, se lever, se doucher, s'habiller",
      ],
      practicePrompt: "Tomorrow morning, narrate your routine in French as you do it! 'Je me réveille... je me lève... je me douche...' — it's the best way to make it stick.",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "Which reflexive pronoun goes with 'je'?",
      content: {
        options: ["me", "te", "se", "nous"],
        correctIndex: 0,
      },
      hint: "The pronoun must match the subject",
      explanation: "With 'je', always use 'me': je ME réveille, je ME lave, je ME lève.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "How do you say 'She gets dressed' in French?",
      content: {
        options: [
          "Elle s'habille",
          "Elle se habille",
          "Elle m'habille",
          "Elle habille",
        ],
        correctIndex: 0,
      },
      hint: "'Se' becomes 's'' before a vowel",
      explanation: "Before a vowel, 'se' contracts to 's''. So it's 's'habille', not 'se habille'.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the reflexive verbs with their meanings:",
      content: {
        pairs: [
          { left: "se réveiller", right: "to wake up" },
          { left: "se lever", right: "to get up" },
          { left: "se doucher", right: "to shower" },
          { left: "s'habiller", right: "to get dressed" },
          { left: "se brosser les dents", right: "to brush teeth" },
        ],
      },
      hint: "Think about what you do each morning",
      explanation: "These are the essential reflexive verbs for describing your morning routine.",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Je _____ réveille à sept heures.",
      content: {
        sentence: "Je _____ réveille à sept heures.",
        answer: "me",
        options: ["me", "te", "se", "nous"],
        caseSensitive: false,
      },
      hint: "What pronoun matches 'je'?",
      explanation: "With 'je', the reflexive pronoun is 'me'. Je me réveille = I wake (myself) up.",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Nous _____ brossons les dents.",
      content: {
        sentence: "Nous _____ brossons les dents.",
        answer: "nous",
        options: ["nous", "me", "se", "vous"],
        caseSensitive: false,
      },
      hint: "What pronoun matches 'nous'?",
      explanation: "With 'nous', the reflexive pronoun is also 'nous'. Nous nous brossons = We brush (ourselves).",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'I wash my face.'",
      content: {
        correctAnswer: "Je me lave le visage.",
        acceptableAnswers: [
          "Je me lave le visage.",
          "Je me lave le visage",
        ],
        direction: "to_target",
      },
      hint: "Use 'le visage' (THE face), not 'mon visage'",
      explanation: "With reflexive verbs + body parts, use the definite article: 'le visage', not 'mon visage'.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 6,
    },
    {
      exercise_type: "REORDER",
      question: "Put the words in order: me / tôt / je / lève",
      content: {
        words: ["me", "tôt", "je", "lève"],
        correctOrder: ["je", "me", "lève", "tôt"],
        translation: "I get up early",
      },
      hint: "Start with the subject, then the reflexive pronoun",
      explanation: "'Je me lève tôt' — Subject (je) + reflexive pronoun (me) + verb (lève) + adverb (tôt).",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 7,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and select what you hear:",
      content: {
        ttsText: "Elle se réveille à six heures.",
        ttsLang: "fr-FR",
        options: [
          "She wakes up at 6:00",
          "She goes to bed at 6:00",
          "She wakes up at 7:00",
          "She gets up at 6:00",
        ],
        correctIndex: 0,
      },
      hint: "Listen for 'se réveille' — what does that mean?",
      explanation: "'Se réveiller' means to wake up. 'Six heures' is 6 o'clock.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 8,
    },
    {
      exercise_type: "SPEAK",
      question: "Say in French: 'I wake up at seven o'clock.'",
      content: {
        targetText: "Je me réveille à sept heures.",
        targetTranslation: "I wake up at seven o'clock.",
        acceptableVariants: [
          "Je me réveille à sept heures",
          "Je me réveille à 7 heures",
        ],
      },
      hint: "Start with 'Je me réveille...'",
      explanation: "'Je me réveille' uses the reflexive pronoun 'me' with 'je'.",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 9,
    },
    {
      exercise_type: "SPEAK",
      question: "Describe your morning: 'First, I shower. Then, I get dressed.'",
      content: {
        targetText: "D'abord, je me douche. Ensuite, je m'habille.",
        targetTranslation: "First, I shower. Then, I get dressed.",
        acceptableVariants: [
          "D'abord je me douche ensuite je m'habille",
          "D'abord, je me douche, ensuite, je m'habille",
          "D'abord je me douche. Ensuite je m'habille",
        ],
      },
      hint: "Use 'd'abord' and 'ensuite' to sequence",
      explanation: "Sequencing words + reflexive verbs = describing routines like a native!",
      difficulty: "HARD",
      xp_reward: 5,
      order_index: 10,
    },
  ],
};
