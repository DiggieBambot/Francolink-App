// Course: French A1
// Unit: 3 - Daily Life
// Lesson: 4 - At Home (Rooms)

export const frenchA1U3L4 = {
  metadata: {
    course: "fr-a1",
    unit: 3,
    lesson: 4,
    title: "At Home – Rooms",
    slug: "at-home-rooms",
    type: "VOCABULARY",
    estimatedMinutes: 15,
    xpReward: 20,
  },

  content: {
    introduction: {
      text: "Home is where the heart is — and where a lot of French vocabulary lives! In this lesson, you'll learn the names of rooms in a French home and how to describe what's in them using the essential phrase 'il y a' (there is/there are). Get ready to give a virtual tour of your place!",
      culturalNote: "🇫🇷 French apartments often have a separate toilet room (les toilettes) from the bathroom (la salle de bains). The toilet and shower being in different rooms is very common! Also, many French homes have shutters (les volets) that are closed every night — it's a tradition for privacy and temperature control.",
    },

    vocabulary: [
      {
        term: "la maison",
        translation: "the house",
        pronunciation: "lah meh-zon",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Ma maison a trois chambres.",
          translation: "My house has three bedrooms.",
        },
        tip: "Use 'à la maison' to mean 'at home'. Very useful phrase!",
      },
      {
        term: "l'appartement",
        translation: "the apartment",
        pronunciation: "lah-par-tuh-mon",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "J'habite dans un appartement.",
          translation: "I live in an apartment.",
        },
        tip: "Very common in French cities! Informally shortened to 'l'appart'.",
      },
      {
        term: "la cuisine",
        translation: "the kitchen",
        pronunciation: "lah kwee-zeen",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Je prépare le dîner dans la cuisine.",
          translation: "I prepare dinner in the kitchen.",
        },
        tip: "Also means 'cooking' or 'cuisine' (food style). Double duty word!",
      },
      {
        term: "le salon",
        translation: "the living room",
        pronunciation: "luh sah-lon",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Nous regardons la télé dans le salon.",
          translation: "We watch TV in the living room.",
        },
        tip: "Sometimes called 'la salle de séjour' or just 'le séjour'. 'Salon' is most common.",
      },
      {
        term: "la chambre",
        translation: "the bedroom",
        pronunciation: "lah shom-bruh",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Ma chambre est au premier étage.",
          translation: "My bedroom is on the first floor.",
        },
        tip: "'La chambre' always means bedroom. For hotel room, say 'une chambre d'hôtel'.",
      },
      {
        term: "la salle de bains",
        translation: "the bathroom",
        pronunciation: "lah sahl duh ban",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "La salle de bains est à côté de la chambre.",
          translation: "The bathroom is next to the bedroom.",
        },
        tip: "Often does NOT contain the toilet in French homes! Just the bath/shower and sink.",
      },
      {
        term: "les toilettes",
        translation: "the toilet / restroom",
        pronunciation: "lay twah-let",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Où sont les toilettes, s'il vous plaît ?",
          translation: "Where is the restroom, please?",
        },
        tip: "Always PLURAL in French, even for a single toilet! 'Les toilettes', never 'la toilette'.",
      },
      {
        term: "la salle à manger",
        translation: "the dining room",
        pronunciation: "lah sahl ah mon-zhay",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Nous mangeons dans la salle à manger.",
          translation: "We eat in the dining room.",
        },
        tip: "Literally 'room for eating'. Many apartments combine this with the salon.",
      },
      {
        term: "l'entrée",
        translation: "the entrance / hallway",
        pronunciation: "lon-tray",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Les clés sont dans l'entrée.",
          translation: "The keys are in the hallway.",
        },
        tip: "The area just inside the front door. Every French home has one!",
      },
      {
        term: "le jardin",
        translation: "the garden",
        pronunciation: "luh zhar-dan",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Les enfants jouent dans le jardin.",
          translation: "The children play in the garden.",
        },
        tip: "More common with houses than apartments, obviously!",
      },
      {
        term: "le balcon",
        translation: "the balcony",
        pronunciation: "luh bal-kon",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Je prends mon café sur le balcon.",
          translation: "I have my coffee on the balcony.",
        },
        tip: "Very common in French apartments. Perfect for morning coffee!",
      },
      {
        term: "le garage",
        translation: "the garage",
        pronunciation: "luh gah-rahzh",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "La voiture est dans le garage.",
          translation: "The car is in the garage.",
        },
        tip: "Pronounced with a French 'r' and soft 'g'. Not like English!",
      },
    ],

    grammar: [
      {
        title: "Using 'Il y a' (There is / There are)",
        explanation: "'Il y a' is a magical phrase — it works for BOTH 'there is' (singular) and 'there are' (plural). It never changes! Use it to describe what exists in a room or place.",
        examples: [
          {
            original: "Il y a une table dans la cuisine.",
            translation: "There is a table in the kitchen.",
            breakdown: "Il y a (there is) + une table (a table) + dans (in) + la cuisine (the kitchen)",
          },
          {
            original: "Il y a trois chambres dans ma maison.",
            translation: "There are three bedrooms in my house.",
            breakdown: "Il y a (there are) + trois chambres (three bedrooms) — same 'il y a' for plural!",
          },
          {
            original: "Il n'y a pas de jardin.",
            translation: "There is no garden.",
            breakdown: "Il n'y a pas (there isn't) + de (any) + jardin (garden) — 'de' replaces article in negative",
          },
        ],
        commonMistakes: [
          "❌ 'Il y sont trois chambres' — Don't change 'il y a' for plural!",
          "✅ 'Il y a trois chambres' — Always 'il y a', singular or plural.",
          "❌ 'Il n'y a pas un garage' — Don't use 'un/une' in negative!",
          "✅ 'Il n'y a pas de garage' — Use 'de' (not un/une) after 'pas'.",
          "❌ 'Il y a le salon' — Don't use for something specific already known!",
          "✅ 'Le salon est grand' — Use 'il y a' to introduce new information only.",
        ],
      },
    ],

    dialogue: {
      title: "La visite de l'appartement",
      context: "Marc shows his new apartment to his friend Julie.",
      lines: [
        {
          speaker: "Marc",
          text: "Bienvenue ! Ici, c'est l'entrée.",
          translation: "Welcome! Here's the entrance.",
        },
        {
          speaker: "Julie",
          text: "C'est joli ! Il y a combien de pièces ?",
          translation: "It's nice! How many rooms are there?",
        },
        {
          speaker: "Marc",
          text: "Il y a quatre pièces : un salon, deux chambres, et une cuisine.",
          translation: "There are four rooms: a living room, two bedrooms, and a kitchen.",
        },
        {
          speaker: "Julie",
          text: "Et la salle de bains, elle est où ?",
          translation: "And the bathroom, where is it?",
        },
        {
          speaker: "Marc",
          text: "La salle de bains est là, à côté de la chambre. Et il y a un petit balcon avec une belle vue !",
          translation: "The bathroom is there, next to the bedroom. And there's a small balcony with a beautiful view!",
        },
        {
          speaker: "Julie",
          text: "Super ! J'adore ton appartement !",
          translation: "Great! I love your apartment!",
        },
      ],
      comprehensionQuestions: [
        {
          question: "How many rooms does Marc's apartment have?",
          options: ["Three", "Four", "Five", "Six"],
          correctIndex: 1,
        },
        {
          question: "What special feature does the balcony have?",
          options: ["A garden", "A beautiful view", "A garage", "A dining table"],
          correctIndex: 1,
        },
      ],
    },

    culture: {
      title: "French Housing Vocabulary",
      text: "In France, apartments are measured in square meters (mètres carrés, abbreviated m²) and described by room count. A 'T3' or 'F3' apartment has 3 main rooms (usually a living room and 2 bedrooms), plus kitchen and bathroom. The ground floor is called 'le rez-de-chaussée', and what Americans call the 'second floor' is 'le premier étage' (first floor) in France. Many buildings have a concierge (gardien/gardienne) who manages the property and accepts packages.",
      funFact: "🏠 In French real estate listings, you'll see 'pièces' (rooms) which counts main rooms only — kitchen and bathroom don't count! So a '3 pièces' might actually have 5 rooms total.",
    },

    summary: {
      keyPoints: [
        "Main rooms: la cuisine, le salon, la chambre, la salle de bains, les toilettes",
        "'Il y a' = there is/there are (never changes, works for singular AND plural!)",
        "Negative: 'Il n'y a pas DE + noun' (use 'de', not 'un/une')",
        "Question: 'Est-ce qu'il y a...?' or 'Il y a...?' with rising intonation",
        "Les toilettes are often in a SEPARATE room from la salle de bains",
        "Always use 'les toilettes' (plural) even for one toilet!",
      ],
      practicePrompt: "Walk around your home right now and name each room in French! Then try 'Il y a...' sentences: 'Dans ma cuisine, il y a un frigo, une table...'",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What is 'the kitchen' in French?",
      content: {
        options: ["la cuisine", "le salon", "la chambre", "le jardin"],
        correctIndex: 0,
      },
      hint: "It's also the word for 'cooking' or 'cuisine'",
      explanation: "'La cuisine' is the kitchen — and also means 'cooking' or 'cuisine'!",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "How do you say 'There are three bedrooms' in French?",
      content: {
        options: [
          "Il y a trois chambres",
          "Il y sont trois chambres",
          "Ils ont trois chambres",
          "Ce sont trois chambres",
        ],
        correctIndex: 0,
      },
      hint: "'Il y a' works for both singular AND plural",
      explanation: "'Il y a' never changes — use it for 'there is' AND 'there are'!",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the French rooms with their English translations:",
      content: {
        pairs: [
          { left: "la chambre", right: "bedroom" },
          { left: "la cuisine", right: "kitchen" },
          { left: "le salon", right: "living room" },
          { left: "les toilettes", right: "restroom/toilet" },
          { left: "le balcon", right: "balcony" },
        ],
      },
      hint: "Think about what you do in each room",
      explanation: "These are essential room names for describing any home!",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Il _____ a un jardin derrière la maison.",
      content: {
        sentence: "Il _____ a un jardin derrière la maison.",
        answer: "y",
        options: ["y", "est", "a", "va"],
        caseSensitive: false,
      },
      hint: "The fixed expression is 'Il _____ a'",
      explanation: "'Il y a' is the complete expression meaning 'there is/there are'.",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Il n'y a pas _____ garage. (There is no garage)",
      content: {
        sentence: "Il n'y a pas _____ garage.",
        answer: "de",
        options: ["de", "un", "le", "du"],
        caseSensitive: false,
      },
      hint: "In negative sentences, 'un/une' becomes '___'",
      explanation: "After 'pas', use 'de' instead of 'un/une'. 'Pas de garage', not 'pas un garage'.",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'Is there a balcony?'",
      content: {
        correctAnswer: "Est-ce qu'il y a un balcon ?",
        acceptableAnswers: [
          "Est-ce qu'il y a un balcon ?",
          "Est-ce qu'il y a un balcon",
          "Il y a un balcon ?",
          "Il y a un balcon",
          "Y a-t-il un balcon ?",
        ],
        direction: "to_target",
      },
      hint: "Use 'Est-ce qu'il y a...?' or just 'Il y a...?' with question intonation",
      explanation: "Both 'Est-ce qu'il y a...?' (formal) and 'Il y a...?' (casual) work!",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 6,
    },
    {
      exercise_type: "REORDER",
      question: "Put the words in order: a / il / chambres / y / deux",
      content: {
        words: ["a", "il", "chambres", "y", "deux"],
        correctOrder: ["il", "y", "a", "deux", "chambres"],
        translation: "There are two bedrooms",
      },
      hint: "'Il y a' is a fixed expression — keep those words together",
      explanation: "'Il y a deux chambres' — 'il y a' stays together, then the quantity and noun.",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 7,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and select what Marc describes:",
      content: {
        ttsText: "Il y a un salon et deux chambres dans mon appartement.",
        ttsLang: "fr-FR",
        options: [
          "A living room and two bedrooms",
          "A kitchen and two bedrooms",
          "A living room and three bedrooms",
          "Two living rooms and a bedroom",
        ],
        correctIndex: 0,
      },
      hint: "Listen for 'salon' and 'chambres' — how many of each?",
      explanation: "'Un salon et deux chambres' = a living room and two bedrooms.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 8,
    },
    {
      exercise_type: "SPEAK",
      question: "Say in French: 'There is a kitchen in my house.'",
      content: {
        targetText: "Il y a une cuisine dans ma maison.",
        targetTranslation: "There is a kitchen in my house.",
        acceptableVariants: [
          "Il y a une cuisine dans ma maison",
          "Dans ma maison il y a une cuisine",
          "Dans ma maison, il y a une cuisine",
        ],
      },
      hint: "Use 'Il y a' + 'une cuisine' (feminine) + 'dans ma maison'",
      explanation: "'Il y a' introduces what exists. 'Cuisine' is feminine → 'une cuisine'.",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 9,
    },
    {
      exercise_type: "SPEAK",
      question: "Ask: 'How many rooms are there?'",
      content: {
        targetText: "Il y a combien de pièces ?",
        targetTranslation: "How many rooms are there?",
        acceptableVariants: [
          "Il y a combien de pièces",
          "Combien de pièces il y a",
          "Combien de pièces est-ce qu'il y a",
          "Combien de pièces y a-t-il",
        ],
      },
      hint: "Use 'combien de' (how many) with 'il y a'",
      explanation: "'Il y a combien de...?' or 'Combien de...il y a?' both work perfectly!",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 10,
    },
  ],
};
