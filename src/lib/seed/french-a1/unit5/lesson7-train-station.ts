// Course: French A1
// Unit: 5 - Around Town
// Lesson: 7 - At the Train Station

export const frenchA1U5L7 = {
  metadata: {
    course: "fr-a1",
    unit: 5,
    lesson: 7,
    title: "At the Train Station",
    slug: "train-station",
    type: "CONVERSATION",
    estimatedMinutes: 18,
    xpReward: 25,
  },

  content: {
    introduction: {
      text: "French train stations are bustling hubs of activity! In this lesson, you'll put together everything you've learned — asking for information, buying tickets, understanding announcements, and finding your way. Get ready for your journey!",
      culturalNote: "🇫🇷 French train stations (les gares) are architectural marvels — Paris Gare du Nord is the busiest in Europe! Arrive early to find your platform (quai), which is usually announced 20 minutes before departure. Look for the yellow 'Départ' boards. And remember: 'composter' your paper tickets!",
    },

    vocabulary: [
      {
        term: "le hall",
        translation: "the main hall",
        pronunciation: "luh ahl",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Je t'attends dans le hall de la gare.",
          translation: "I'll wait for you in the station hall.",
        },
        tip: "The main open area when you enter the station.",
      },
      {
        term: "le tableau des départs",
        translation: "departure board",
        pronunciation: "luh tah-bloh day day-par",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Regarde le tableau des départs pour trouver le quai.",
          translation: "Look at the departure board to find the platform.",
        },
        tip: "Also 'le tableau des arrivées' for arrivals.",
      },
      {
        term: "l'horaire",
        translation: "the schedule / timetable",
        pronunciation: "loh-rair",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Tu as vérifié l'horaire du train ?",
          translation: "Did you check the train schedule?",
        },
        tip: "Also means 'hours' as in business hours: 'les horaires d'ouverture'.",
      },
      {
        term: "le départ",
        translation: "departure",
        pronunciation: "luh day-par",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Le départ est à 14h30.",
          translation: "Departure is at 2:30 PM.",
        },
        tip: "From the verb 'partir' (to leave).",
      },
      {
        term: "l'arrivée",
        translation: "arrival",
        pronunciation: "lah-ree-vay",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "L'arrivée à Lyon est à 16h45.",
          translation: "Arrival in Lyon is at 4:45 PM.",
        },
        tip: "From the verb 'arriver' (to arrive).",
      },
      {
        term: "à l'heure",
        translation: "on time",
        pronunciation: "ah luhr",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Le train est à l'heure.",
          translation: "The train is on time.",
        },
        tip: "Opposite: 'en retard' (late), 'en avance' (early).",
      },
      {
        term: "en retard",
        translation: "late / delayed",
        pronunciation: "ahn ruh-tar",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Le train a 15 minutes de retard.",
          translation: "The train is 15 minutes late.",
        },
        tip: "'Avoir du retard' = to be running late.",
      },
      {
        term: "la salle d'attente",
        translation: "waiting room",
        pronunciation: "lah sahl dah-tahnt",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Je suis dans la salle d'attente.",
          translation: "I'm in the waiting room.",
        },
        tip: "Found in most stations — a place to sit while waiting.",
      },
      {
        term: "la consigne",
        translation: "luggage storage",
        pronunciation: "lah kon-seen-yuh",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Je vais laisser ma valise à la consigne.",
          translation: "I'm going to leave my suitcase in luggage storage.",
        },
        tip: "Lockers or staffed storage for bags.",
      },
      {
        term: "les bagages",
        translation: "luggage / baggage",
        pronunciation: "lay bah-gazh",
        partOfSpeech: "noun",
        gender: "masculine plural",
        exampleSentence: {
          original: "N'oubliez pas vos bagages !",
          translation: "Don't forget your luggage!",
        },
        tip: "Always plural in French! 'Un bagage' is rare.",
      },
      {
        term: "la valise",
        translation: "suitcase",
        pronunciation: "lah vah-leez",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "J'ai une grande valise et un sac.",
          translation: "I have a big suitcase and a bag.",
        },
        tip: "'Un sac' = bag, 'un sac à dos' = backpack.",
      },
      {
        term: "monter dans le train",
        translation: "to get on the train",
        pronunciation: "mon-tay dahn luh tran",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Attention à la marche en montant dans le train.",
          translation: "Mind the gap when getting on the train.",
        },
        tip: "Opposite: 'descendre du train' (to get off the train).",
      },
    ],

    grammar: [
      {
        title: "Train Station Announcements",
        explanation: "French train announcements follow patterns. Understanding key phrases helps you navigate: 'Le train à destination de...' (The train to...), 'en provenance de...' (coming from...), 'va partir' (is about to leave), 'quai numéro...' (platform number...).",
        examples: [
          {
            original: "Le train à destination de Lyon va partir voie 5.",
            translation: "The train to Lyon is about to leave from track 5.",
            breakdown: "À destination de (to) + city + va partir (is about to leave) + voie (track)",
          },
          {
            original: "Le train en provenance de Marseille entre en gare.",
            translation: "The train from Marseille is arriving.",
            breakdown: "En provenance de (from) + city + entre en gare (is entering the station)",
          },
          {
            original: "Attention, le train 7842 a un retard de 20 minutes.",
            translation: "Attention, train 7842 is delayed by 20 minutes.",
            breakdown: "A un retard de (is delayed by) + time",
          },
        ],
        commonMistakes: [
          "❌ Confusing 'à destination de' and 'en provenance de'",
          "✅ 'À destination de' = going TO. 'En provenance de' = coming FROM.",
          "❌ 'Le train pour Lyon' in announcements — too informal",
          "✅ 'Le train à destination de Lyon' — official announcement style.",
          "❌ Missing your train because you didn't check the 'quai'!",
          "✅ Always check the departure board 20 minutes before!",
        ],
      },
    ],

    dialogue: {
      title: "À la gare de Lyon",
      context: "Sophie is at the train station, trying to find her train to Nice.",
      lines: [
        {
          speaker: "Sophie",
          text: "Excusez-moi, le train pour Nice part de quel quai ?",
          translation: "Excuse me, which platform does the train to Nice leave from?",
        },
        {
          speaker: "Agent",
          text: "Le train de 14h15 ? Un moment... Il part du quai 12.",
          translation: "The 2:15 PM train? One moment... It leaves from platform 12.",
        },
        {
          speaker: "Sophie",
          text: "Quai 12. Merci ! Le train est à l'heure ?",
          translation: "Platform 12. Thank you! Is the train on time?",
        },
        {
          speaker: "Agent",
          text: "Oui, il est à l'heure. Mais dépêchez-vous, le départ est dans dix minutes !",
          translation: "Yes, it's on time. But hurry, departure is in ten minutes!",
        },
        {
          speaker: "Sophie",
          text: "Oh là là ! Le quai 12, c'est par où ?",
          translation: "Oh my! Platform 12, which way is it?",
        },
        {
          speaker: "Agent",
          text: "Allez tout droit, puis tournez à gauche après le café. Vous allez voir les panneaux.",
          translation: "Go straight, then turn left after the café. You'll see the signs.",
        },
        {
          speaker: "Sophie",
          text: "Merci beaucoup ! Bonne journée !",
          translation: "Thank you very much! Have a good day!",
        },
        {
          speaker: "Agent",
          text: "Bon voyage !",
          translation: "Have a good trip!",
        },
      ],
      comprehensionQuestions: [
        {
          question: "What platform does Sophie's train leave from?",
          options: ["Platform 10", "Platform 11", "Platform 12", "Platform 14"],
          correctIndex: 2,
        },
        {
          question: "How much time does Sophie have before departure?",
          options: ["5 minutes", "10 minutes", "15 minutes", "20 minutes"],
          correctIndex: 1,
        },
      ],
    },

    culture: {
      title: "Navigating French Train Stations",
      text: "French train stations have their own rhythm! Platforms are announced about 20 minutes before departure on the yellow 'Départ' boards. Look for your train number, destination, and time. The platform (voie/quai) will appear in the last column. Big stations like Paris Gare de Lyon have multiple halls — make sure you're in the right one! 'Composting' machines are yellow and located before the platforms. Don't forget to validate!",
      funFact: "🚂 Paris has 6 major train stations, each serving different regions! Gare du Nord goes north (London, Belgium), Gare de Lyon goes south (Lyon, Nice, Italy), Gare Montparnasse goes west (Brittany, Bordeaux). The stations are NOT connected by metro directly — you need to plan your connections!",
    },

    summary: {
      keyPoints: [
        "Check 'le tableau des départs' for platform (quai/voie) information",
        "'À destination de' = going to, 'En provenance de' = coming from",
        "'À l'heure' = on time, 'en retard' = late, 'en avance' = early",
        "Platform announced ~20 minutes before departure",
        "'Monter dans le train' = get on, 'Descendre du train' = get off",
        "'La consigne' = luggage storage, 'les bagages' = luggage",
        "'Bon voyage !' = Have a good trip!",
      ],
      practicePrompt: "Imagine you're at a French train station. Practice asking: 'Le train pour [city] part de quel quai?' and understanding the response!",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What does 'le tableau des départs' mean?",
      content: {
        options: [
          "departure board",
          "ticket office",
          "waiting room",
          "platform",
        ],
        correctIndex: 0,
      },
      hint: "'Départ' = departure, 'tableau' = board",
      explanation: "'Le tableau des départs' shows departure times and platforms.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What does 'Le train a 10 minutes de retard' mean?",
      content: {
        options: [
          "The train is 10 minutes late",
          "The train leaves in 10 minutes",
          "The train arrives in 10 minutes",
          "The train is on time",
        ],
        correctIndex: 0,
      },
      hint: "'Retard' = delay/late",
      explanation: "'Avoir du retard' = to be late. The train is delayed by 10 minutes.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the French terms with their translations:",
      content: {
        pairs: [
          { left: "le quai", right: "platform" },
          { left: "à l'heure", right: "on time" },
          { left: "en retard", right: "late" },
          { left: "la consigne", right: "luggage storage" },
          { left: "les bagages", right: "luggage" },
        ],
      },
      hint: "Think about things you see/do at a train station",
      explanation: "Essential vocabulary for navigating train stations!",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Le train _____ destination de Lyon part dans 5 minutes. (to)",
      content: {
        sentence: "Le train _____ destination de Lyon part dans 5 minutes.",
        answer: "à",
        options: ["à", "en", "de", "pour"],
        caseSensitive: false,
      },
      hint: "Official announcement style for 'going to' a destination",
      explanation: "'À destination de' = going to (formal/announcement style).",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete: Le train est à _____. Il part dans 2 minutes ! (on time)",
      content: {
        sentence: "Le train est à _____. Il part dans 2 minutes !",
        answer: "l'heure",
        options: ["l'heure", "temps", "retard", "avance"],
        caseSensitive: false,
      },
      hint: "The opposite of 'en retard' (late)",
      explanation: "'À l'heure' = on time. The train is departing as scheduled!",
      difficulty: "EASY",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'Which platform does the train to Paris leave from?'",
      content: {
        correctAnswer: "Le train pour Paris part de quel quai ?",
        acceptableAnswers: [
          "Le train pour Paris part de quel quai ?",
          "Le train pour Paris part de quel quai",
          "De quel quai part le train pour Paris ?",
          "Le train à destination de Paris part de quel quai ?",
        ],
        direction: "to_target",
      },
      hint: "Use 'quel quai' (which platform) and 'le train pour [city]'",
      explanation: "Essential question at any train station!",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 6,
    },
    {
      exercise_type: "REORDER",
      question: "Put the words in order: quai / quel / part / train / de / le / ?",
      content: {
        words: ["quai", "quel", "part", "train", "de", "le", "?"],
        correctOrder: ["le", "train", "part", "de", "quel", "quai", "?"],
        translation: "Which platform does the train leave from?",
      },
      hint: "Subject + verb + de + quel quai",
      explanation: "'Le train part de quel quai?' — asking for platform information.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 7,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen to the announcement and identify the platform:",
      content: {
        ttsText: "Le train à destination de Marseille va partir voie numéro 8.",
        ttsLang: "fr-FR",
        options: [
          "Platform 8",
          "Platform 5",
          "Platform 18",
          "Platform 3",
        ],
        correctIndex: 0,
      },
      hint: "Listen for 'voie numéro...'",
      explanation: "'Voie numéro 8' = Track/Platform 8. The train to Marseille!",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 8,
    },
    {
      exercise_type: "SPEAK",
      question: "Ask: 'Is the train on time?'",
      content: {
        targetText: "Le train est à l'heure ?",
        targetTranslation: "Is the train on time?",
        acceptableVariants: [
          "Le train est à l'heure",
          "Est-ce que le train est à l'heure",
          "Le train est à l'heure ?",
        ],
      },
      hint: "Use 'à l'heure' for 'on time'",
      explanation: "'Le train est à l'heure?' — checking if there are delays!",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 9,
    },
    {
      exercise_type: "SPEAK",
      question: "Wish someone a good trip:",
      content: {
        targetText: "Bon voyage !",
        targetTranslation: "Have a good trip!",
        acceptableVariants: [
          "Bon voyage",
          "Bon voyage !",
        ],
      },
      hint: "'Bon' = good, 'voyage' = trip",
      explanation: "'Bon voyage!' — what French people say when someone is traveling!",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 10,
    },
  ],
};
