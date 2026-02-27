// Course: French A1
// Unit: 5 - Around Town
// Lesson: 1 - Places in Town

export const frenchA1U5L1 = {
  metadata: {
    course: "fr-a1",
    unit: 5,
    lesson: 1,
    title: "Places in Town",
    slug: "places-in-town",
    type: "VOCABULARY",
    estimatedMinutes: 15,
    xpReward: 20,
  },

  content: {
    introduction: {
      text: "Every town has its essential places — the bakery, the pharmacy, the train station. In this lesson, you'll learn vocabulary for common places around town, so you can find what you need and give directions. Let's explore une ville française!",
      culturalNote: "🇫🇷 French towns are often centered around 'la place' (the square) or 'la mairie' (town hall). Small shops line the streets: la boulangerie for bread, la pharmacie with its green cross, le tabac for newspapers and stamps. Many shops close between 12-2 PM for lunch and all day Sunday!",
    },

    vocabulary: [
      {
        term: "la ville",
        translation: "the city / the town",
        pronunciation: "lah veel",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "J'habite dans une grande ville.",
          translation: "I live in a big city.",
        },
        tip: "'En ville' means 'in town' or 'downtown'. 'Je vais en ville' = I'm going into town.",
      },
      {
        term: "la rue",
        translation: "the street",
        pronunciation: "lah roo",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "La boulangerie est dans cette rue.",
          translation: "The bakery is on this street.",
        },
        tip: "For addresses: '12, rue de Paris' — the number comes first!",
      },
      {
        term: "la place",
        translation: "the square / the plaza",
        pronunciation: "lah plahs",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Il y a un marché sur la place.",
          translation: "There's a market in the square.",
        },
        tip: "Many French towns have 'la Place de la Mairie' or 'la Place du Marché'.",
      },
      {
        term: "la boulangerie",
        translation: "the bakery",
        pronunciation: "lah boo-lahnzh-ree",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "J'achète du pain à la boulangerie.",
          translation: "I buy bread at the bakery.",
        },
        tip: "For bread and pastries. 'La pâtisserie' specializes in fancy cakes.",
      },
      {
        term: "la pharmacie",
        translation: "the pharmacy",
        pronunciation: "lah far-mah-see",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "La pharmacie est ouverte jusqu'à 20 heures.",
          translation: "The pharmacy is open until 8 PM.",
        },
        tip: "Look for the green cross (croix verte)! French pharmacists give health advice too.",
      },
      {
        term: "la banque",
        translation: "the bank",
        pronunciation: "lah bahnk",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Je vais à la banque retirer de l'argent.",
          translation: "I'm going to the bank to withdraw money.",
        },
        tip: "ATMs are called 'un distributeur' or 'un DAB' (distributeur automatique de billets).",
      },
      {
        term: "la poste",
        translation: "the post office",
        pronunciation: "lah post",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "J'envoie une lettre à la poste.",
          translation: "I send a letter at the post office.",
        },
        tip: "Also called 'le bureau de poste'. Look for the yellow 'La Poste' sign.",
      },
      {
        term: "le supermarché",
        translation: "the supermarket",
        pronunciation: "luh soo-pair-mar-shay",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Je fais les courses au supermarché.",
          translation: "I do the shopping at the supermarket.",
        },
        tip: "Bigger than 'l'épicerie' (small grocery store). 'L'hypermarché' is even bigger!",
      },
      {
        term: "la gare",
        translation: "the train station",
        pronunciation: "lah gar",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Le train part de la gare à 10 heures.",
          translation: "The train leaves from the station at 10 o'clock.",
        },
        tip: "'La gare routière' is the bus station.",
      },
      {
        term: "l'hôpital",
        translation: "the hospital",
        pronunciation: "loh-pee-tal",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "L'hôpital est près du centre-ville.",
          translation: "The hospital is near downtown.",
        },
        tip: "For emergencies: 'les urgences'. The emergency number is 15 (SAMU) or 112.",
      },
      {
        term: "l'église",
        translation: "the church",
        pronunciation: "lay-gleez",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "L'église est sur la place principale.",
          translation: "The church is on the main square.",
        },
        tip: "Many French villages are built around 'l'église'. It's often the oldest building!",
      },
      {
        term: "le parc",
        translation: "the park",
        pronunciation: "luh park",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Les enfants jouent dans le parc.",
          translation: "The children play in the park.",
        },
        tip: "'Le jardin public' is another word for a public park/garden.",
      },
    ],

    grammar: [
      {
        title: "Preposition 'À' with Places (Contractions)",
        explanation: "To say 'at' or 'to' a place, use 'à'. But 'à' contracts with 'le' and 'les': à + le = au, à + les = aux. With 'la' and 'l'', there's no contraction.",
        examples: [
          {
            original: "Je vais à la boulangerie.",
            translation: "I'm going to the bakery.",
            breakdown: "à + la (feminine) = à la — no contraction",
          },
          {
            original: "Je vais au supermarché.",
            translation: "I'm going to the supermarket.",
            breakdown: "à + le (masculine) = au — contraction!",
          },
          {
            original: "Je vais à l'hôpital.",
            translation: "I'm going to the hospital.",
            breakdown: "à + l' (vowel) = à l' — no contraction",
          },
        ],
        commonMistakes: [
          "❌ 'Je vais à le supermarché' — Never 'à le'!",
          "✅ 'Je vais au supermarché' — Always contract à + le = au.",
          "❌ 'Je vais au boulangerie' — Wrong gender!",
          "✅ 'Je vais à la boulangerie' — 'Boulangerie' is feminine.",
          "❌ 'Je vais à la hôpital' — Don't forget elision!",
          "✅ 'Je vais à l'hôpital' — Words starting with 'h' often use l'.",
        ],
      },
    ],

    dialogue: {
      title: "Où est la pharmacie ?",
      context: "Thomas is new in town and asks a local for directions.",
      lines: [
        {
          speaker: "Thomas",
          text: "Excusez-moi, où est la pharmacie, s'il vous plaît ?",
          translation: "Excuse me, where is the pharmacy, please?",
        },
        {
          speaker: "Local",
          text: "La pharmacie ? Elle est sur la place, à côté de la boulangerie.",
          translation: "The pharmacy? It's on the square, next to the bakery.",
        },
        {
          speaker: "Thomas",
          text: "Et c'est loin d'ici ?",
          translation: "And is it far from here?",
        },
        {
          speaker: "Local",
          text: "Non, c'est à cinq minutes à pied. Vous allez tout droit, puis à gauche.",
          translation: "No, it's five minutes on foot. You go straight, then left.",
        },
        {
          speaker: "Thomas",
          text: "Tout droit, puis à gauche. D'accord, merci beaucoup !",
          translation: "Straight, then left. Okay, thank you very much!",
        },
        {
          speaker: "Local",
          text: "De rien ! Bonne journée !",
          translation: "You're welcome! Have a good day!",
        },
      ],
      comprehensionQuestions: [
        {
          question: "Where is the pharmacy?",
          options: ["Next to the bank", "Next to the bakery", "Next to the hospital", "Next to the park"],
          correctIndex: 1,
        },
        {
          question: "How far is the pharmacy?",
          options: ["2 minutes", "5 minutes", "10 minutes", "15 minutes"],
          correctIndex: 1,
        },
      ],
    },

    culture: {
      title: "French Town Layout",
      text: "French towns have a distinct character! The center (le centre-ville) usually has a main square (la place) with the town hall (la mairie), a church, and outdoor cafés. Small shops line the nearby streets — each with its specialty: la boucherie (butcher), la charcuterie (deli meats), la fromagerie (cheese shop). Many shops close for lunch (12-2 PM) and on Sundays. 'Le tabac' sells tobacco, newspapers, lottery tickets, and even stamps!",
      funFact: "🏪 The green cross of French pharmacies is actually a legal requirement! Pharmacies must display it, and it often flashes or changes color. Some even show the temperature and time. French pharmacists are highly trusted for medical advice — they'll even look at your rash!",
    },

    summary: {
      keyPoints: [
        "Key places: la boulangerie, la pharmacie, la banque, la poste, la gare",
        "'À' = to/at a place. Contracts: à + le = au, à + les = aux",
        "No contraction with 'la' or 'l'': à la boulangerie, à l'hôpital",
        "'La place' = town square — often the heart of French towns",
        "Many shops close 12-2 PM for lunch and all day Sunday",
        "'Où est...?' = Where is...? Essential for asking directions",
      ],
      practicePrompt: "Think about your neighborhood. How would you say where you go? 'Je vais au supermarché, à la banque, à la poste...' Practice with real places near you!",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What is 'the bakery' in French?",
      content: {
        options: [
          "la boulangerie",
          "la banque",
          "la pharmacie",
          "la boucherie",
        ],
        correctIndex: 0,
      },
      hint: "This is where you buy bread and croissants",
      explanation: "'La boulangerie' is the bakery — for bread and pastries!",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "How do you say 'to the supermarket' in French?",
      content: {
        options: [
          "au supermarché",
          "à le supermarché",
          "à la supermarché",
          "aux supermarché",
        ],
        correctIndex: 0,
      },
      hint: "'Supermarché' is masculine, and 'à + le' contracts",
      explanation: "'À + le' always contracts to 'au'. So it's 'au supermarché'.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the French places with their translations:",
      content: {
        pairs: [
          { left: "la gare", right: "train station" },
          { left: "la poste", right: "post office" },
          { left: "l'hôpital", right: "hospital" },
          { left: "la pharmacie", right: "pharmacy" },
          { left: "le parc", right: "park" },
        ],
      },
      hint: "Think about what you do at each place",
      explanation: "These are essential places you'll need to find in any French town!",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Je vais _____ boulangerie. (to the bakery)",
      content: {
        sentence: "Je vais _____ boulangerie.",
        answer: "à la",
        options: ["à la", "au", "à l'", "aux"],
        caseSensitive: false,
      },
      hint: "'Boulangerie' is feminine",
      explanation: "'Boulangerie' is feminine → 'à la boulangerie'. No contraction with 'la'!",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Je vais _____ hôpital. (to the hospital)",
      content: {
        sentence: "Je vais _____ hôpital.",
        answer: "à l'",
        options: ["à l'", "au", "à la", "à le"],
        caseSensitive: false,
      },
      hint: "'Hôpital' starts with a vowel sound",
      explanation: "Before vowels, use 'à l''. 'Hôpital' → 'à l'hôpital'.",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'Where is the train station?'",
      content: {
        correctAnswer: "Où est la gare ?",
        acceptableAnswers: [
          "Où est la gare ?",
          "Où est la gare",
          "La gare est où ?",
          "Elle est où, la gare ?",
        ],
        direction: "to_target",
      },
      hint: "'Where' = 'où', 'train station' = 'la gare'",
      explanation: "'Où est la gare?' — the essential question for finding places!",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 6,
    },
    {
      exercise_type: "REORDER",
      question: "Put the words in order: vais / je / supermarché / au",
      content: {
        words: ["vais", "je", "supermarché", "au"],
        correctOrder: ["je", "vais", "au", "supermarché"],
        translation: "I'm going to the supermarket",
      },
      hint: "Subject + verb + preposition + place",
      explanation: "'Je vais au supermarché' — subject + aller + au + place.",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 7,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and identify where the person is going:",
      content: {
        ttsText: "Je vais à la pharmacie acheter des médicaments.",
        ttsLang: "fr-FR",
        options: [
          "To the pharmacy",
          "To the bakery",
          "To the supermarket",
          "To the hospital",
        ],
        correctIndex: 0,
      },
      hint: "Listen for the place name after 'à la'",
      explanation: "'À la pharmacie' — the pharmacy. 'Acheter des médicaments' = to buy medicine.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 8,
    },
    {
      exercise_type: "SPEAK",
      question: "Ask: 'Where is the pharmacy, please?'",
      content: {
        targetText: "Où est la pharmacie, s'il vous plaît ?",
        targetTranslation: "Where is the pharmacy, please?",
        acceptableVariants: [
          "Où est la pharmacie, s'il vous plaît",
          "Où est la pharmacie s'il vous plaît",
          "La pharmacie, c'est où, s'il vous plaît",
        ],
      },
      hint: "Start with 'Où est...' and end with 's'il vous plaît'",
      explanation: "'Où est la pharmacie, s'il vous plaît?' — polite way to ask for directions!",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 9,
    },
    {
      exercise_type: "SPEAK",
      question: "Say: 'I'm going to the bakery.'",
      content: {
        targetText: "Je vais à la boulangerie.",
        targetTranslation: "I'm going to the bakery.",
        acceptableVariants: [
          "Je vais à la boulangerie",
        ],
      },
      hint: "'Boulangerie' is feminine, so use 'à la'",
      explanation: "'Je vais à la boulangerie' — 'à la' because boulangerie is feminine.",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 10,
    },
  ],
};
