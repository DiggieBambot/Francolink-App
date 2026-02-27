// Course: French A1
// Unit: 5 - Around Town
// Lesson: 3 - Transportation

export const frenchA1U5L3 = {
  metadata: {
    course: "fr-a1",
    unit: 5,
    lesson: 3,
    title: "Transportation",
    slug: "transportation",
    type: "VOCABULARY",
    estimatedMinutes: 15,
    xpReward: 20,
  },

  content: {
    introduction: {
      text: "Getting around in France is easy once you know the vocabulary! From the famous Paris Métro to high-speed TGV trains, France has excellent public transportation. In this lesson, you'll learn essential transport vocabulary to help you move around like a local.",
      culturalNote: "🇫🇷 France has one of the best public transport systems in Europe! The Paris Métro is over 120 years old and has 16 lines. The TGV (Train à Grande Vitesse) can reach speeds of 320 km/h. Most French cities also have excellent bus and tram networks. Having a car isn't necessary in most urban areas!",
    },

    vocabulary: [
      {
        term: "le métro",
        translation: "the subway / metro",
        pronunciation: "luh may-troh",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Je prends le métro pour aller au travail.",
          translation: "I take the metro to go to work.",
        },
        tip: "Short for 'métropolitain'. Paris has 16 metro lines, each with a number and color!",
      },
      {
        term: "le bus",
        translation: "the bus",
        pronunciation: "luh boos",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Le bus numéro 42 va à la gare.",
          translation: "Bus number 42 goes to the train station.",
        },
        tip: "Pronounce the 's'! In French, it's 'boos', not 'buh'.",
      },
      {
        term: "le train",
        translation: "the train",
        pronunciation: "luh tran",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Le train pour Lyon part à 14h30.",
          translation: "The train to Lyon leaves at 2:30 PM.",
        },
        tip: "The TGV (Train à Grande Vitesse) is the high-speed train.",
      },
      {
        term: "le tramway / le tram",
        translation: "the tram / streetcar",
        pronunciation: "luh tram-way / luh tram",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Le tram est très pratique en ville.",
          translation: "The tram is very practical in the city.",
        },
        tip: "Many French cities have modern tram systems — Lyon, Bordeaux, Strasbourg, Nice...",
      },
      {
        term: "le taxi",
        translation: "the taxi",
        pronunciation: "luh tak-see",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Je prends un taxi pour aller à l'aéroport.",
          translation: "I take a taxi to go to the airport.",
        },
        tip: "French taxis are usually beige or dark colors. Look for the 'Taxi' light on top!",
      },
      {
        term: "le vélo",
        translation: "the bicycle",
        pronunciation: "luh vay-loh",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Je vais au bureau à vélo.",
          translation: "I go to the office by bike.",
        },
        tip: "Many cities have bike-sharing: Vélib' in Paris, Vélo'v in Lyon.",
      },
      {
        term: "la voiture",
        translation: "the car",
        pronunciation: "lah vwah-toor",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Je n'ai pas de voiture, je prends les transports en commun.",
          translation: "I don't have a car, I take public transport.",
        },
        tip: "'En voiture' = by car. 'Conduire' = to drive.",
      },
      {
        term: "l'avion",
        translation: "the airplane",
        pronunciation: "lah-vyon",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "L'avion pour Paris part à 8 heures.",
          translation: "The plane to Paris leaves at 8 o'clock.",
        },
        tip: "'Prendre l'avion' = to take a flight. 'L'aéroport' = the airport.",
      },
      {
        term: "à pied",
        translation: "on foot / walking",
        pronunciation: "ah pyay",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "La boulangerie est à cinq minutes à pied.",
          translation: "The bakery is five minutes on foot.",
        },
        tip: "Very common expression! 'J'y vais à pied' = I'm going there on foot.",
      },
      {
        term: "la station",
        translation: "the station (metro/bus stop)",
        pronunciation: "lah stah-syon",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "La station de métro est au coin de la rue.",
          translation: "The metro station is at the corner of the street.",
        },
        tip: "'La station de métro' or 'la station de bus'. 'La gare' is for trains.",
      },
      {
        term: "l'arrêt de bus",
        translation: "the bus stop",
        pronunciation: "lah-reh duh boos",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "L'arrêt de bus est devant le supermarché.",
          translation: "The bus stop is in front of the supermarket.",
        },
        tip: "'Arrêt' comes from 'arrêter' (to stop). Also used for trams.",
      },
      {
        term: "les transports en commun",
        translation: "public transportation",
        pronunciation: "lay trans-por ahn koh-muhn",
        partOfSpeech: "noun",
        gender: "masculine plural",
        exampleSentence: {
          original: "Les transports en commun sont excellents à Paris.",
          translation: "Public transportation is excellent in Paris.",
        },
        tip: "Literally 'common transports' — shared by everyone!",
      },
    ],

    grammar: [
      {
        title: "Means of Transportation: 'En' vs 'À'",
        explanation: "To express how you travel, use 'en' for enclosed vehicles (car, bus, train, plane) and 'à' for open ones or on top of (foot, bike, horse). This is a key distinction!",
        examples: [
          {
            original: "Je vais au travail en métro.",
            translation: "I go to work by metro.",
            breakdown: "En + métro (enclosed vehicle)",
          },
          {
            original: "Elle va à l'école à vélo.",
            translation: "She goes to school by bike.",
            breakdown: "À + vélo (you sit ON it, not inside)",
          },
          {
            original: "Nous allons à la plage à pied.",
            translation: "We go to the beach on foot.",
            breakdown: "À + pied (walking = on your feet)",
          },
        ],
        commonMistakes: [
          "❌ 'Je vais en vélo' — Wrong preposition!",
          "✅ 'Je vais à vélo' — Use 'à' for bike (you're ON it).",
          "❌ 'Je vais à bus' — Wrong preposition!",
          "✅ 'Je vais en bus' — Use 'en' for bus (you're INSIDE).",
          "❌ 'Je vais en pied' — Wrong preposition!",
          "✅ 'Je vais à pied' — Always 'à pied' for walking.",
        ],
      },
    ],

    dialogue: {
      title: "Comment tu vas au travail ?",
      context: "Sophie and Marc discuss their daily commute.",
      lines: [
        {
          speaker: "Sophie",
          text: "Marc, comment tu vas au travail ?",
          translation: "Marc, how do you go to work?",
        },
        {
          speaker: "Marc",
          text: "Je prends le métro. La station est juste à côté de chez moi.",
          translation: "I take the metro. The station is right next to my place.",
        },
        {
          speaker: "Sophie",
          text: "C'est pratique ! Moi, je prends le bus puis le tram.",
          translation: "That's convenient! Me, I take the bus then the tram.",
        },
        {
          speaker: "Marc",
          text: "Ça prend combien de temps ?",
          translation: "How long does it take?",
        },
        {
          speaker: "Sophie",
          text: "Environ 45 minutes. Et toi ?",
          translation: "About 45 minutes. And you?",
        },
        {
          speaker: "Marc",
          text: "Seulement 20 minutes en métro. Mais parfois, quand il fait beau, j'y vais à vélo.",
          translation: "Only 20 minutes by metro. But sometimes, when the weather is nice, I go by bike.",
        },
        {
          speaker: "Sophie",
          text: "À vélo ! C'est super pour la santé !",
          translation: "By bike! That's great for your health!",
        },
        {
          speaker: "Marc",
          text: "Oui, et c'est gratuit !",
          translation: "Yes, and it's free!",
        },
      ],
      comprehensionQuestions: [
        {
          question: "How does Marc usually go to work?",
          options: ["By bus", "By metro", "By bike", "On foot"],
          correctIndex: 1,
        },
        {
          question: "How long does Sophie's commute take?",
          options: ["20 minutes", "30 minutes", "45 minutes", "1 hour"],
          correctIndex: 2,
        },
      ],
    },

    culture: {
      title: "French Public Transport",
      text: "The French love their public transport! The SNCF (Société Nationale des Chemins de fer Français) runs all national trains, including the famous TGV. In Paris, the RATP manages the metro, buses, and trams. Most cities use integrated ticketing — one ticket for bus, tram, and metro. Look for 'Navigo' cards in Paris or city-specific passes elsewhere. Strikes (grèves) do happen, especially in transport — always check for 'perturbations'!",
      funFact: "🚄 The TGV holds the world speed record for conventional trains at 574.8 km/h (set in 2007)! In regular service, it travels at 320 km/h. Paris to Lyon (450 km) takes only 2 hours by TGV!",
    },

    summary: {
      keyPoints: [
        "Enclosed vehicles use 'en': en métro, en bus, en train, en voiture, en avion",
        "Open/on-top vehicles use 'à': à vélo, à pied, à moto",
        "Key transport: le métro, le bus, le train, le tram, le taxi, le vélo",
        "'La station' for metro/bus, 'la gare' for trains, 'l'aéroport' for planes",
        "'Les transports en commun' = public transportation",
        "'Prendre' is the verb for taking transport: 'Je prends le bus'",
      ],
      practicePrompt: "Describe how you get to different places! 'Je vais au travail en bus. Je vais au supermarché à pied. Je vais chez mes parents en voiture...'",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "Which preposition do you use with 'vélo' (bike)?",
      content: {
        options: [
          "à vélo",
          "en vélo",
          "par vélo",
          "avec vélo",
        ],
        correctIndex: 0,
      },
      hint: "You sit ON a bike, not INSIDE it",
      explanation: "Use 'à' for open vehicles you sit on: à vélo, à moto, à cheval. Use 'en' for enclosed vehicles.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "How do you say 'I take the bus' in French?",
      content: {
        options: [
          "Je prends le bus",
          "Je vais le bus",
          "Je fais le bus",
          "J'ai le bus",
        ],
        correctIndex: 0,
      },
      hint: "The verb 'prendre' is used for taking transport",
      explanation: "'Prendre' (to take) is the verb for transport: Je prends le bus/métro/train.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the transport with the correct preposition:",
      content: {
        pairs: [
          { left: "en", right: "métro, bus, train, voiture" },
          { left: "à", right: "pied, vélo, moto" },
        ],
      },
      hint: "'En' for inside, 'à' for on/walking",
      explanation: "'En' = enclosed vehicles. 'À' = on foot or on open vehicles!",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Je vais au travail _____ métro. (by metro)",
      content: {
        sentence: "Je vais au travail _____ métro.",
        answer: "en",
        options: ["en", "à", "par", "avec"],
        caseSensitive: false,
      },
      hint: "Metro is an enclosed vehicle",
      explanation: "Enclosed vehicles use 'en': en métro, en bus, en train.",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: La boulangerie est à cinq minutes _____ pied. (on foot)",
      content: {
        sentence: "La boulangerie est à cinq minutes _____ pied.",
        answer: "à",
        options: ["à", "en", "de", "par"],
        caseSensitive: false,
      },
      hint: "Walking always uses 'à pied'",
      explanation: "'À pied' is a fixed expression — always 'à', never 'en'!",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'I go to school by bus.'",
      content: {
        correctAnswer: "Je vais à l'école en bus.",
        acceptableAnswers: [
          "Je vais à l'école en bus.",
          "Je vais à l'école en bus",
          "Je prends le bus pour aller à l'école.",
        ],
        direction: "to_target",
      },
      hint: "Use 'en' for bus (enclosed vehicle) and remember 'à l'école'",
      explanation: "'En bus' because bus is enclosed. 'À l'école' because école starts with vowel.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 6,
    },
    {
      exercise_type: "REORDER",
      question: "Put the words in order: prends / le / travail / je / pour / métro / aller / au",
      content: {
        words: ["prends", "le", "travail", "je", "pour", "métro", "aller", "au"],
        correctOrder: ["je", "prends", "le", "métro", "pour", "aller", "au", "travail"],
        translation: "I take the metro to go to work",
      },
      hint: "Subject + prends + le métro + pour + aller + au + place",
      explanation: "'Je prends le métro pour aller au travail' — describing your commute!",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 7,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and identify the means of transport:",
      content: {
        ttsText: "Je prends le train pour aller à Lyon. C'est très rapide !",
        ttsLang: "fr-FR",
        options: [
          "Train",
          "Bus",
          "Car",
          "Plane",
        ],
        correctIndex: 0,
      },
      hint: "Listen for the transport word after 'Je prends'",
      explanation: "'Je prends le train' = I take the train. 'Rapide' = fast!",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 8,
    },
    {
      exercise_type: "SPEAK",
      question: "Say: 'I go to work by metro.'",
      content: {
        targetText: "Je vais au travail en métro.",
        targetTranslation: "I go to work by metro.",
        acceptableVariants: [
          "Je vais au travail en métro",
          "Je prends le métro pour aller au travail",
        ],
      },
      hint: "Use 'en métro' (enclosed vehicle)",
      explanation: "'En métro' because you're inside the metro. 'Au travail' = to work.",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 9,
    },
    {
      exercise_type: "SPEAK",
      question: "Ask: 'How do you go to work?'",
      content: {
        targetText: "Comment tu vas au travail ?",
        targetTranslation: "How do you go to work?",
        acceptableVariants: [
          "Comment tu vas au travail",
          "Comment vas-tu au travail",
          "Tu vas au travail comment",
          "Comment est-ce que tu vas au travail",
        ],
      },
      hint: "Start with 'Comment' (how)",
      explanation: "'Comment tu vas au travail?' — asking about someone's commute!",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 10,
    },
  ],
};
