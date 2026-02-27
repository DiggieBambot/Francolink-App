// Course: French A1
// Unit: 5 - Around Town
// Lesson: 2 - Asking for Directions

export const frenchA1U5L2 = {
  metadata: {
    course: "fr-a1",
    unit: 5,
    lesson: 2,
    title: "Asking for Directions",
    slug: "asking-directions",
    type: "CONVERSATION",
    estimatedMinutes: 18,
    xpReward: 25,
  },

  content: {
    introduction: {
      text: "Lost in a French town? No problem! In this lesson, you'll learn how to ask for directions and understand the answers. From 'turn left' to 'go straight', you'll navigate like a local in no time!",
      culturalNote: "🇫🇷 The French are generally helpful with directions, but always start with 'Excusez-moi' or 'Pardon' and a greeting! If someone seems rushed, try asking 'Vous avez deux minutes?' (Do you have two minutes?). Hand gestures are common — watch for pointing!",
    },

    vocabulary: [
      {
        term: "tout droit",
        translation: "straight ahead",
        pronunciation: "too drwah",
        partOfSpeech: "adverb",
        exampleSentence: {
          original: "Allez tout droit pendant 100 mètres.",
          translation: "Go straight ahead for 100 meters.",
        },
        tip: "The most common direction! 'Tout' intensifies it — 'completely straight'.",
      },
      {
        term: "à gauche",
        translation: "to the left / on the left",
        pronunciation: "ah gohsh",
        partOfSpeech: "adverb",
        exampleSentence: {
          original: "Tournez à gauche au feu.",
          translation: "Turn left at the traffic light.",
        },
        tip: "Remember: 'gauche' sounds like 'goosh'. Think 'gauche = left out'.",
      },
      {
        term: "à droite",
        translation: "to the right / on the right",
        pronunciation: "ah drwaht",
        partOfSpeech: "adverb",
        exampleSentence: {
          original: "La banque est à droite.",
          translation: "The bank is on the right.",
        },
        tip: "'Droite' sounds like 'right' — helps to remember!",
      },
      {
        term: "tourner",
        translation: "to turn",
        pronunciation: "toor-nay",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Tournez à droite après le pont.",
          translation: "Turn right after the bridge.",
        },
        tip: "Conjugation: je tourne, tu tournes, vous tournez.",
      },
      {
        term: "continuer",
        translation: "to continue",
        pronunciation: "kon-tee-noo-ay",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Continuez tout droit jusqu'au rond-point.",
          translation: "Continue straight until the roundabout.",
        },
        tip: "Often used with 'tout droit' — keep going straight!",
      },
      {
        term: "prendre",
        translation: "to take",
        pronunciation: "prahndr",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Prenez la première rue à gauche.",
          translation: "Take the first street on the left.",
        },
        tip: "Irregular verb! Je prends, tu prends, vous prenez.",
      },
      {
        term: "le coin",
        translation: "the corner",
        pronunciation: "luh kwan",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "La boulangerie est au coin de la rue.",
          translation: "The bakery is at the corner of the street.",
        },
        tip: "'Au coin de' = at the corner of.",
      },
      {
        term: "le feu",
        translation: "the traffic light",
        pronunciation: "luh fuh",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Tournez à gauche au feu rouge.",
          translation: "Turn left at the red light.",
        },
        tip: "'Le feu' also means 'fire'. 'Les feux' = traffic lights (plural).",
      },
      {
        term: "le carrefour",
        translation: "the intersection / crossroads",
        pronunciation: "luh kar-foor",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Au carrefour, prenez à droite.",
          translation: "At the intersection, go right.",
        },
        tip: "Carrefour is also the name of a famous French supermarket chain!",
      },
      {
        term: "le rond-point",
        translation: "the roundabout",
        pronunciation: "luh ron-pwan",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Au rond-point, prenez la deuxième sortie.",
          translation: "At the roundabout, take the second exit.",
        },
        tip: "France has lots of roundabouts! 'Une sortie' = an exit.",
      },
      {
        term: "en face de",
        translation: "across from / opposite",
        pronunciation: "ahn fahs duh",
        partOfSpeech: "preposition",
        exampleSentence: {
          original: "La poste est en face de la mairie.",
          translation: "The post office is across from the town hall.",
        },
        tip: "Very useful for locating places relative to each other.",
      },
      {
        term: "entre",
        translation: "between",
        pronunciation: "ahntr",
        partOfSpeech: "preposition",
        exampleSentence: {
          original: "La pharmacie est entre la banque et la boulangerie.",
          translation: "The pharmacy is between the bank and the bakery.",
        },
        tip: "Simple and useful: 'entre A et B' = between A and B.",
      },
    ],

    grammar: [
      {
        title: "Giving Directions: Imperative Form",
        explanation: "When giving directions, French uses the imperative (command) form. For polite directions to strangers, use the 'vous' form. Drop the subject — just use the verb directly!",
        examples: [
          {
            original: "Allez tout droit.",
            translation: "Go straight ahead.",
            breakdown: "'Allez' = go (vous form of 'aller'). No 'vous' needed!",
          },
          {
            original: "Tournez à gauche.",
            translation: "Turn left.",
            breakdown: "'Tournez' = turn (vous form of 'tourner').",
          },
          {
            original: "Prenez la première rue.",
            translation: "Take the first street.",
            breakdown: "'Prenez' = take (vous form of 'prendre').",
          },
        ],
        commonMistakes: [
          "❌ 'Vous allez tout droit' — Too formal for directions!",
          "✅ 'Allez tout droit' — Imperative: drop the 'vous'.",
          "❌ 'Tourne à gauche' — Too informal with a stranger!",
          "✅ 'Tournez à gauche' — Use 'vous' form with people you don't know.",
          "❌ 'À le coin' — Don't forget contraction!",
          "✅ 'Au coin' — à + le = au.",
        ],
      },
    ],

    dialogue: {
      title: "Comment aller à la gare ?",
      context: "Marie asks a passerby for directions to the train station.",
      lines: [
        {
          speaker: "Marie",
          text: "Excusez-moi, pour aller à la gare, s'il vous plaît ?",
          translation: "Excuse me, how do I get to the train station, please?",
        },
        {
          speaker: "Passant",
          text: "La gare ? Alors, allez tout droit jusqu'au feu.",
          translation: "The train station? So, go straight ahead until the traffic light.",
        },
        {
          speaker: "Marie",
          text: "D'accord, tout droit jusqu'au feu.",
          translation: "Okay, straight ahead until the light.",
        },
        {
          speaker: "Passant",
          text: "Ensuite, tournez à gauche. La gare est au bout de la rue, sur votre droite.",
          translation: "Then, turn left. The station is at the end of the street, on your right.",
        },
        {
          speaker: "Marie",
          text: "C'est loin ?",
          translation: "Is it far?",
        },
        {
          speaker: "Passant",
          text: "Non, c'est à dix minutes à pied environ.",
          translation: "No, it's about ten minutes on foot.",
        },
        {
          speaker: "Marie",
          text: "Super, merci beaucoup !",
          translation: "Great, thank you very much!",
        },
        {
          speaker: "Passant",
          text: "Je vous en prie !",
          translation: "You're welcome!",
        },
      ],
      comprehensionQuestions: [
        {
          question: "What direction does Marie turn at the traffic light?",
          options: ["Right", "Left", "Straight", "She doesn't turn"],
          correctIndex: 1,
        },
        {
          question: "How long does it take to walk to the station?",
          options: ["5 minutes", "10 minutes", "15 minutes", "20 minutes"],
          correctIndex: 1,
        },
      ],
    },

    culture: {
      title: "Navigating French Streets",
      text: "French streets are named after famous people, historical events, or local features. 'Rue Victor Hugo' and 'Avenue Charles de Gaulle' are everywhere! Street signs are usually blue plaques on building walls, not on poles. French cities often have pedestrian zones (zones piétonnes) in the center. When driving, yield to cars already in a roundabout — unless there's a sign saying 'cédez le passage'!",
      funFact: "🗺️ France has over 4,000 roundabouts — more than any other country! They're so common that there's even a French word for someone who loves them: 'gira-tophile'. Some roundabouts have elaborate decorations or sculptures in the center!",
    },

    summary: {
      keyPoints: [
        "Key directions: tout droit (straight), à gauche (left), à droite (right)",
        "Imperative for directions: Allez, Tournez, Prenez, Continuez",
        "Use 'vous' forms with strangers: 'Tournez' not 'Tourne'",
        "Landmarks: le feu (traffic light), le rond-point (roundabout), le carrefour (intersection)",
        "Location words: en face de (opposite), entre (between), au coin de (at corner of)",
        "Ask politely: 'Excusez-moi, pour aller à..., s'il vous plaît ?'",
      ],
      practicePrompt: "Give yourself directions from your current location to somewhere nearby — in French! 'Je sors de chez moi, je vais tout droit, puis je tourne à gauche...'",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "How do you say 'straight ahead' in French?",
      content: {
        options: [
          "tout droit",
          "à gauche",
          "à droite",
          "en face",
        ],
        correctIndex: 0,
      },
      hint: "'Droit' is related to 'direct' or 'straight'",
      explanation: "'Tout droit' = straight ahead. 'Tout' adds emphasis — completely straight!",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What does 'Tournez à gauche' mean?",
      content: {
        options: [
          "Turn left",
          "Turn right",
          "Go straight",
          "Stop here",
        ],
        correctIndex: 0,
      },
      hint: "'Gauche' is the opposite of 'droite'",
      explanation: "'Tournez à gauche' = Turn left. 'Tournez à droite' = Turn right.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the French directions with their translations:",
      content: {
        pairs: [
          { left: "tout droit", right: "straight ahead" },
          { left: "à gauche", right: "to the left" },
          { left: "à droite", right: "to the right" },
          { left: "le feu", right: "traffic light" },
          { left: "le rond-point", right: "roundabout" },
        ],
      },
      hint: "Think about navigation vocabulary",
      explanation: "These are the essential direction words you'll hear constantly!",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: _____ tout droit. (Go straight)",
      content: {
        sentence: "_____ tout droit.",
        answer: "Allez",
        options: ["Allez", "Aller", "Vous allez", "Allons"],
        caseSensitive: false,
      },
      hint: "Use the imperative (command) form with 'vous'",
      explanation: "'Allez' is the imperative form of 'aller' for 'vous'. Drop the subject!",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: La banque est _____ face de la poste. (opposite)",
      content: {
        sentence: "La banque est _____ face de la poste.",
        answer: "en",
        options: ["en", "à", "au", "de"],
        caseSensitive: false,
      },
      hint: "The expression is 'en face de' (across from)",
      explanation: "'En face de' = opposite/across from. A very useful location phrase!",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'Turn right at the traffic light.'",
      content: {
        correctAnswer: "Tournez à droite au feu.",
        acceptableAnswers: [
          "Tournez à droite au feu.",
          "Tournez à droite au feu",
          "Au feu, tournez à droite.",
          "Au feu tournez à droite",
        ],
        direction: "to_target",
      },
      hint: "Use imperative 'tournez' and remember 'au feu' (at the light)",
      explanation: "'Tournez à droite au feu' — perfect directions!",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 6,
    },
    {
      exercise_type: "REORDER",
      question: "Put the words in order: gauche / à / feu / au / tournez",
      content: {
        words: ["gauche", "à", "feu", "au", "tournez"],
        correctOrder: ["tournez", "à", "gauche", "au", "feu"],
        translation: "Turn left at the traffic light",
      },
      hint: "Verb first (command), then direction, then location",
      explanation: "'Tournez à gauche au feu' — imperative + direction + landmark.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 7,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and identify the directions:",
      content: {
        ttsText: "Allez tout droit, puis tournez à droite au carrefour.",
        ttsLang: "fr-FR",
        options: [
          "Straight, then turn right at the intersection",
          "Straight, then turn left at the intersection",
          "Turn right, then go straight",
          "Turn left at the roundabout",
        ],
        correctIndex: 0,
      },
      hint: "Listen for 'tout droit', 'droite', and 'carrefour'",
      explanation: "'Tout droit' (straight), 'à droite' (right), 'au carrefour' (at the intersection).",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 8,
    },
    {
      exercise_type: "SPEAK",
      question: "Ask for directions: 'How do I get to the train station, please?'",
      content: {
        targetText: "Pour aller à la gare, s'il vous plaît ?",
        targetTranslation: "How do I get to the train station, please?",
        acceptableVariants: [
          "Pour aller à la gare, s'il vous plaît",
          "Comment aller à la gare, s'il vous plaît",
          "Excusez-moi, pour aller à la gare",
        ],
      },
      hint: "Use 'pour aller à...' (to get to...)",
      explanation: "'Pour aller à la gare?' — the classic way to ask for directions!",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 9,
    },
    {
      exercise_type: "SPEAK",
      question: "Give directions: 'Go straight, then turn left.'",
      content: {
        targetText: "Allez tout droit, puis tournez à gauche.",
        targetTranslation: "Go straight, then turn left.",
        acceptableVariants: [
          "Allez tout droit puis tournez à gauche",
          "Allez tout droit, tournez à gauche",
          "Tout droit, puis à gauche",
        ],
      },
      hint: "Use imperative forms: 'Allez' and 'Tournez'",
      explanation: "'Allez tout droit, puis tournez à gauche' — clear, simple directions!",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 10,
    },
  ],
};
