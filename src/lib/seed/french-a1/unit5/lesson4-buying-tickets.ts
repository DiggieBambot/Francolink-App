// Course: French A1
// Unit: 5 - Around Town
// Lesson: 4 - Buying Tickets

export const frenchA1U5L4 = {
  metadata: {
    course: "fr-a1",
    unit: 5,
    lesson: 4,
    title: "Buying Tickets",
    slug: "buying-tickets",
    type: "CONVERSATION",
    estimatedMinutes: 18,
    xpReward: 25,
  },

  content: {
    introduction: {
      text: "Need a train ticket to Lyon? A metro pass for the week? In this lesson, you'll learn how to buy tickets for all types of transport — at the counter, at a machine, or online. Essential vocabulary for any French journey!",
      culturalNote: "🇫🇷 In France, you can buy tickets at the 'guichet' (counter), from machines ('bornes automatiques'), or online/apps. Always validate ('composter') your train ticket before boarding! Metro tickets are validated at the turnstiles. For long-distance trains, booking in advance online (on SNCF Connect app) often saves money!",
    },

    vocabulary: [
      {
        term: "un billet",
        translation: "a ticket",
        pronunciation: "uhn bee-yay",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Un billet pour Paris, s'il vous plaît.",
          translation: "A ticket to Paris, please.",
        },
        tip: "For trains and planes. 'Un ticket' is for metro/bus.",
      },
      {
        term: "un ticket",
        translation: "a ticket (metro/bus)",
        pronunciation: "uhn tee-keh",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Je voudrais un carnet de tickets, s'il vous plaît.",
          translation: "I would like a book of tickets, please.",
        },
        tip: "'Un carnet' = a book of 10 tickets (cheaper than buying individually!).",
      },
      {
        term: "un aller simple",
        translation: "a one-way ticket",
        pronunciation: "uhn ah-lay sampl",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Un aller simple pour Marseille.",
          translation: "A one-way ticket to Marseille.",
        },
        tip: "'Aller' = to go. 'Simple' = single/one-way.",
      },
      {
        term: "un aller-retour",
        translation: "a round-trip ticket",
        pronunciation: "uhn ah-lay ruh-toor",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Un aller-retour Paris-Lyon, s'il vous plaît.",
          translation: "A round-trip ticket Paris-Lyon, please.",
        },
        tip: "Often cheaper than two single tickets!",
      },
      {
        term: "première classe",
        translation: "first class",
        pronunciation: "pruh-myair klahs",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Deux billets en première classe.",
          translation: "Two tickets in first class.",
        },
        tip: "More space, quieter, more expensive. Sometimes includes meals on TGV.",
      },
      {
        term: "deuxième classe / seconde classe",
        translation: "second class",
        pronunciation: "duh-zyem klahs / suh-gond klahs",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Un billet en seconde classe, c'est combien ?",
          translation: "How much is a ticket in second class?",
        },
        tip: "Most people travel in second class — perfectly comfortable!",
      },
      {
        term: "le guichet",
        translation: "the ticket counter",
        pronunciation: "luh gee-shay",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Je vais acheter mon billet au guichet.",
          translation: "I'm going to buy my ticket at the counter.",
        },
        tip: "Where you speak to a person. Machines are 'les bornes automatiques'.",
      },
      {
        term: "le quai",
        translation: "the platform",
        pronunciation: "luh kay",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Le train part du quai numéro 5.",
          translation: "The train leaves from platform 5.",
        },
        tip: "Check the departure boards ('le tableau des départs') for your platform!",
      },
      {
        term: "la voie",
        translation: "the track",
        pronunciation: "lah vwah",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Attention, le train arrive voie 3.",
          translation: "Attention, the train arrives on track 3.",
        },
        tip: "'Quai' and 'voie' are often used interchangeably for platforms.",
      },
      {
        term: "composter",
        translation: "to validate (a ticket)",
        pronunciation: "kom-pos-tay",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "N'oubliez pas de composter votre billet !",
          translation: "Don't forget to validate your ticket!",
        },
        tip: "Yellow machines at station entrances. Essential for regional trains!",
      },
      {
        term: "le tarif",
        translation: "the fare / the price",
        pronunciation: "luh tah-reef",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Quel est le tarif pour les enfants ?",
          translation: "What is the fare for children?",
        },
        tip: "'Tarif réduit' = reduced fare (for students, seniors, etc.).",
      },
      {
        term: "une correspondance",
        translation: "a connection / transfer",
        pronunciation: "oon kor-res-pon-dahns",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Il y a une correspondance à Lyon.",
          translation: "There's a connection in Lyon.",
        },
        tip: "Also used for metro transfers between lines!",
      },
    ],

    grammar: [
      {
        title: "Buying Tickets: Key Structures",
        explanation: "When buying tickets, you'll use 'Je voudrais' (I would like) for polite requests, specify the type (aller simple/aller-retour), and indicate the destination with 'pour' (for/to).",
        examples: [
          {
            original: "Je voudrais un billet pour Lyon, s'il vous plaît.",
            translation: "I would like a ticket to Lyon, please.",
            breakdown: "Je voudrais + un billet + pour + destination",
          },
          {
            original: "Un aller-retour pour Marseille en seconde classe.",
            translation: "A round-trip to Marseille in second class.",
            breakdown: "Type + pour + destination + en + class",
          },
          {
            original: "C'est combien, l'aller-retour ?",
            translation: "How much is the round-trip?",
            breakdown: "C'est combien + the item you're asking about",
          },
        ],
        commonMistakes: [
          "❌ 'Un billet à Lyon' — Wrong preposition!",
          "✅ 'Un billet pour Lyon' — Use 'pour' for destination.",
          "❌ 'Je veux un billet' — Too direct!",
          "✅ 'Je voudrais un billet' — Polite form.",
          "❌ Forgetting to validate: fine of €50+!",
          "✅ Always 'composter' regional train tickets before boarding.",
        ],
      },
    ],

    dialogue: {
      title: "Au guichet de la gare",
      context: "Claire buys a train ticket at the station counter.",
      lines: [
        {
          speaker: "Agent",
          text: "Bonjour ! Je peux vous aider ?",
          translation: "Hello! Can I help you?",
        },
        {
          speaker: "Claire",
          text: "Bonjour ! Je voudrais un billet pour Bordeaux, s'il vous plaît.",
          translation: "Hello! I would like a ticket to Bordeaux, please.",
        },
        {
          speaker: "Agent",
          text: "Aller simple ou aller-retour ?",
          translation: "One-way or round-trip?",
        },
        {
          speaker: "Claire",
          text: "Un aller-retour, s'il vous plaît. Je reviens dimanche.",
          translation: "A round-trip, please. I'm coming back Sunday.",
        },
        {
          speaker: "Agent",
          text: "Première ou deuxième classe ?",
          translation: "First or second class?",
        },
        {
          speaker: "Claire",
          text: "Deuxième classe. C'est combien ?",
          translation: "Second class. How much is it?",
        },
        {
          speaker: "Agent",
          text: "Ça fait 89 euros. Le train part à 10h15, quai 7.",
          translation: "That's 89 euros. The train leaves at 10:15, platform 7.",
        },
        {
          speaker: "Claire",
          text: "Parfait. Voilà. Merci beaucoup !",
          translation: "Perfect. Here you go. Thank you very much!",
        },
      ],
      comprehensionQuestions: [
        {
          question: "What type of ticket does Claire buy?",
          options: ["One-way, first class", "One-way, second class", "Round-trip, first class", "Round-trip, second class"],
          correctIndex: 3,
        },
        {
          question: "What platform does the train leave from?",
          options: ["Platform 5", "Platform 6", "Platform 7", "Platform 8"],
          correctIndex: 2,
        },
      ],
    },

    culture: {
      title: "French Train Travel",
      text: "Train travel is beloved in France! The SNCF (national railway) offers various services: TGV (high-speed), Intercités, and TER (regional). Book TGV tickets early for the best prices on SNCF Connect. 'Ouigo' is the budget TGV option. For regional trains (TER), you can often buy tickets on the day. Always check if your ticket needs 'compostage' (validation) — electronic tickets don't, but paper tickets for regional trains do!",
      funFact: "🎫 French train tickets used to require 'compostage' (validation by punching) in orange machines. If you forgot, inspectors could fine you! Now, most TGV tickets are electronic, but the yellow machines still exist for regional trains. The fine for not validating? Up to €50!",
    },

    summary: {
      keyPoints: [
        "'Un billet' for trains/planes, 'un ticket' for metro/bus",
        "'Aller simple' = one-way, 'Aller-retour' = round-trip",
        "Use 'pour' + destination: 'un billet pour Lyon'",
        "Classes: première classe, deuxième/seconde classe",
        "'Le guichet' = counter, 'le quai' = platform, 'la voie' = track",
        "'Composter' = validate (required for regional paper tickets!)",
      ],
      practicePrompt: "Imagine you're at a French train station. Practice buying a ticket: 'Bonjour, je voudrais un aller-retour pour Nice en seconde classe, s'il vous plaît.'",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "How do you say 'a round-trip ticket' in French?",
      content: {
        options: [
          "un aller-retour",
          "un aller simple",
          "un billet simple",
          "un ticket retour",
        ],
        correctIndex: 0,
      },
      hint: "'Aller' = go, 'retour' = return",
      explanation: "'Un aller-retour' = round-trip. 'Un aller simple' = one-way.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What does 'composter' mean?",
      content: {
        options: [
          "to validate a ticket",
          "to buy a ticket",
          "to cancel a ticket",
          "to lose a ticket",
        ],
        correctIndex: 0,
      },
      hint: "You do this with regional train tickets before boarding",
      explanation: "'Composter' = to validate/stamp your ticket. Required for regional trains!",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the French terms with their translations:",
      content: {
        pairs: [
          { left: "le guichet", right: "ticket counter" },
          { left: "le quai", right: "platform" },
          { left: "un aller simple", right: "one-way ticket" },
          { left: "un aller-retour", right: "round-trip ticket" },
          { left: "la correspondance", right: "connection/transfer" },
        ],
      },
      hint: "Think about the train station layout",
      explanation: "Essential vocabulary for navigating French train stations!",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Je voudrais un billet _____ Paris. (to Paris)",
      content: {
        sentence: "Je voudrais un billet _____ Paris.",
        answer: "pour",
        options: ["pour", "à", "en", "de"],
        caseSensitive: false,
      },
      hint: "Which preposition means 'to' when talking about destinations for tickets?",
      explanation: "Use 'pour' + destination when buying tickets: 'un billet pour Paris'.",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Le train part du _____ numéro 5. (platform)",
      content: {
        sentence: "Le train part du _____ numéro 5.",
        answer: "quai",
        options: ["quai", "guichet", "billet", "train"],
        caseSensitive: false,
      },
      hint: "Where do you stand to board a train?",
      explanation: "'Le quai' = the platform. Check 'le tableau des départs' for your platform!",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'I would like a round-trip ticket to Lyon, please.'",
      content: {
        correctAnswer: "Je voudrais un aller-retour pour Lyon, s'il vous plaît.",
        acceptableAnswers: [
          "Je voudrais un aller-retour pour Lyon, s'il vous plaît.",
          "Je voudrais un aller-retour pour Lyon, s'il vous plaît",
          "Un aller-retour pour Lyon, s'il vous plaît.",
        ],
        direction: "to_target",
      },
      hint: "Je voudrais + type + pour + destination",
      explanation: "Perfect ticket-buying structure! 'Aller-retour' + 'pour' + city.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 6,
    },
    {
      exercise_type: "REORDER",
      question: "Put the words in order: classe / en / pour / billet / seconde / un / Marseille",
      content: {
        words: ["classe", "en", "pour", "billet", "seconde", "un", "Marseille"],
        correctOrder: ["un", "billet", "pour", "Marseille", "en", "seconde", "classe"],
        translation: "A ticket to Marseille in second class",
      },
      hint: "Article + billet + pour + destination + en + class",
      explanation: "'Un billet pour Marseille en seconde classe' — complete ticket request!",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 7,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and identify the ticket type requested:",
      content: {
        ttsText: "Je voudrais deux allers-retours pour Bordeaux en première classe.",
        ttsLang: "fr-FR",
        options: [
          "Two round-trips to Bordeaux, first class",
          "One round-trip to Bordeaux, second class",
          "Two one-ways to Bordeaux, first class",
          "One one-way to Lyon, first class",
        ],
        correctIndex: 0,
      },
      hint: "Listen for 'deux', 'allers-retours', the destination, and the class",
      explanation: "'Deux allers-retours' = two round-trips. 'Première classe' = first class.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 8,
    },
    {
      exercise_type: "SPEAK",
      question: "Buy a ticket: 'A one-way ticket to Nice, please.'",
      content: {
        targetText: "Un aller simple pour Nice, s'il vous plaît.",
        targetTranslation: "A one-way ticket to Nice, please.",
        acceptableVariants: [
          "Un aller simple pour Nice, s'il vous plaît",
          "Je voudrais un aller simple pour Nice, s'il vous plaît",
          "Un aller simple pour Nice s'il vous plaît",
        ],
      },
      hint: "'One-way' = 'aller simple'",
      explanation: "'Un aller simple pour Nice' — buying a one-way ticket!",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 9,
    },
    {
      exercise_type: "SPEAK",
      question: "Ask: 'How much is a round-trip?'",
      content: {
        targetText: "C'est combien, l'aller-retour ?",
        targetTranslation: "How much is the round-trip?",
        acceptableVariants: [
          "C'est combien l'aller-retour",
          "L'aller-retour, c'est combien",
          "Combien coûte l'aller-retour",
          "Ça coûte combien, l'aller-retour",
        ],
      },
      hint: "Use 'C'est combien' to ask the price",
      explanation: "'C'est combien, l'aller-retour?' — essential price-checking question!",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 10,
    },
  ],
};
