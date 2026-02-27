export const frenchA1U7L8 = {
  metadata: {
    course: "fr-a1",
    unit: 7,
    lesson: 8,
    title: "Unit 7 Review: Daily Activities & Work",
    slug: "unit-7-review",
    type: "REVIEW",
    estimatedMinutes: 15,
    xpReward: 30,
  },

  content: {
    introduction: {
      text: "Welcome to the Unit 7 review! You'll consolidate everything you've learned about jobs, the workplace, -er verb conjugation, time expressions, hobbies, and French work-life balance. Let's make sure you can talk about your daily life with confidence!",
      culturalNote: "🇫🇷 By now, you can have a natural conversation about work and leisure in French — two topics that come up in virtually every social interaction. The French approach to balancing these is something truly unique!",
    },

    vocabulary: [
      {
        term: "un médecin",
        translation: "a doctor",
        pronunciation: "uhn mayd-SAHN",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Il est médecin. Il travaille à l'hôpital.",
          translation: "He is a doctor. He works at the hospital.",
        },
        tip: "Review: no article after 'être' + profession.",
      },
      {
        term: "travailler",
        translation: "to work",
        pronunciation: "trah-vah-YAY",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Je travaille de neuf heures à cinq heures.",
          translation: "I work from nine to five.",
        },
        tip: "Review: regular -er verb. De...à... for time ranges.",
      },
      {
        term: "un bureau",
        translation: "an office / a desk",
        pronunciation: "uhn bew-ROH",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Je travaille dans un bureau avec mes collègues.",
          translation: "I work in an office with my colleagues.",
        },
        tip: "Review: 'dans' for physical spaces.",
      },
      {
        term: "toujours",
        translation: "always",
        pronunciation: "too-ZHOOR",
        partOfSpeech: "adverb",
        exampleSentence: {
          original: "J'arrive toujours à l'heure.",
          translation: "I always arrive on time.",
        },
        tip: "Review: frequency adverbs go AFTER the verb.",
      },
      {
        term: "faire du sport",
        translation: "to do sports",
        pronunciation: "fehr dew SPOR",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Je fais du sport le week-end.",
          translation: "I do sports on weekends.",
        },
        tip: "Review: 'faire de' for general activities, 'jouer à' for specific sports.",
      },
      {
        term: "se reposer",
        translation: "to rest",
        pronunciation: "suh ruh-poh-ZAY",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Pendant les vacances, je me repose.",
          translation: "During the holidays, I rest.",
        },
        tip: "Review: reflexive verb — je me repose, tu te reposes.",
      },
      {
        term: "profiter de",
        translation: "to enjoy / make the most of",
        pronunciation: "proh-fee-TAY duh",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "On profite du temps libre.",
          translation: "We enjoy the free time.",
        },
        tip: "Review: always followed by 'de'.",
      },
      {
        term: "un jour férié",
        translation: "a public holiday",
        pronunciation: "uhn zhoor fay-RYAY",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Demain est un jour férié. On fait le pont !",
          translation: "Tomorrow is a public holiday. We're taking the bridge day!",
        },
        tip: "Review: 'le pont' = extended weekend around a public holiday.",
      },
    ],

    grammar: [
      {
        title: "Review: Professions Without Articles",
        explanation: "When stating someone's profession after 'être', drop the article. But when using 'c'est' + adjective + profession, the article comes back.",
        examples: [
          {
            original: "Elle est professeure.",
            translation: "She is a teacher.",
            breakdown: "être + profession — NO article",
          },
          {
            original: "C'est une bonne professeure.",
            translation: "She is a good teacher.",
            breakdown: "C'est + article + adjective + profession — article RETURNS",
          },
        ],
        commonMistakes: [
          "❌ Elle est une professeure (wrong — no article with être + profession alone)",
          "✅ Elle est professeure (correct)",
        ],
      },
      {
        title: "Review: -er Verbs + Time + Opinions",
        explanation: "You can now build complete sentences about your daily life by combining -er verbs, time expressions, and opinion verbs. This is how natural French conversation flows.",
        examples: [
          {
            original: "Je travaille de neuf heures à cinq heures. J'aime mon travail parce que mes collègues sont sympas.",
            translation: "I work from nine to five. I like my job because my colleagues are nice.",
            breakdown: "Schedule (de...à...) + opinion (j'aime) + reason (parce que)",
          },
          {
            original: "Après le travail, je me détends. Je ne travaille jamais le week-end.",
            translation: "After work, I relax. I never work on weekends.",
            breakdown: "Post-work routine (reflexive) + negation (ne...jamais)",
          },
        ],
        commonMistakes: [
          "❌ J'aime travaille avec mes collègues (second verb must be infinitive)",
          "✅ J'aime travailler avec mes collègues (correct — infinitive after opinion verb)",
        ],
      },
    ],

    dialogue: {
      title: "A Complete Life Description",
      image: "/images/dialogues/complete-life.svg",
      context: "Sophie describes her complete daily life to her new friend Nicolas.",
      lines: [
        {
          speaker: "nicolas",
          text: "Qu'est-ce que tu fais dans la vie, Sophie ?",
          translation: "What do you do for a living, Sophie?",
        },
        {
          speaker: "sophie",
          text: "Je suis avocate. Je travaille dans un grand bureau à Paris.",
          translation: "I'm a lawyer. I work in a big office in Paris.",
        },
        {
          speaker: "nicolas",
          text: "Tu commences à quelle heure ?",
          translation: "What time do you start?",
        },
        {
          speaker: "sophie",
          text: "Je commence à neuf heures et je termine à dix-huit heures. Je déjeune souvent avec mes collègues.",
          translation: "I start at nine and finish at six. I often have lunch with my colleagues.",
        },
        {
          speaker: "nicolas",
          text: "Tu aimes ton travail ?",
          translation: "Do you like your job?",
        },
        {
          speaker: "sophie",
          text: "Oui, j'aime mon métier parce que c'est intéressant. Mais je déteste les réunions longues !",
          translation: "Yes, I like my profession because it's interesting. But I hate long meetings!",
        },
        {
          speaker: "nicolas",
          text: "Et pendant ton temps libre ?",
          translation: "And during your free time?",
        },
        {
          speaker: "sophie",
          text: "Je me repose, je lis, et je fais du sport. Le week-end, je profite de ma famille. L'équilibre est important !",
          translation: "I rest, I read, and I do sports. On weekends, I enjoy my family. Balance is important!",
        },
      ],
      comprehensionQuestions: [
        {
          question: "What does Sophie do for a living?",
          options: ["She's a doctor", "She's a teacher", "She's a lawyer", "She's an accountant"],
          correctIndex: 2,
        },
        {
          question: "What does Sophie do in her free time?",
          options: [
            "She works more",
            "She rests, reads, and does sports",
            "She travels abroad",
            "She watches TV all day",
          ],
          correctIndex: 1,
        },
      ],
    },

    culture: {
      title: "Unit 7 Cultural Summary",
      text: "Throughout this unit, you've explored the French world of work and leisure. You've learned that the French value their professions but don't define themselves solely by their jobs. The 35-hour workweek, five weeks of vacation, public holidays with 'ponts', the sacred lunch break, and the 'droit à la déconnexion' all reflect a society that believes in balance. Hobbies like reading, sports, cinema, cooking, and the simple 'promenade' are not luxuries but essential parts of daily life. Understanding this philosophy will help you connect authentically with French speakers.",
      funFact: "🎉 A French survey found that the top three things the French value most are: 1) Family, 2) Health, 3) Free time. Work came in at number 7! This perfectly illustrates the French philosophy of 'vivre pour travailler ou travailler pour vivre?' (live to work or work to live?) — the French firmly choose the latter.",
    },

    summary: {
      keyPoints: [
        "Professions without articles: il est médecin, elle est avocate",
        "Regular -er verb conjugation: je travaille, tu travailles, il/elle travaille",
        "Workplace vocabulary: bureau, entreprise, collègue, patron, réunion",
        "Time expressions: toujours, souvent, parfois, jamais (after the verb)",
        "Time ranges: de...à... / pendant / depuis (vocabulary only)",
        "Opinions: j'aime, je préfère, je déteste + infinitive",
        "Hobbies: faire du sport, jouer à/de, lire, cuisiner, voyager",
        "Work-life balance: congés, jour férié, pont, se reposer, profiter de",
      ],
      practicePrompt: "Write a full description of your daily life in French. Include: your profession, your schedule, what you like/dislike about work, your hobbies, and how you relax. Use everything you've learned in this unit!",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "Which sentence is correct?",
      content: {
        options: [
          "Il est un médecin",
          "Il est médecin",
          "Il a médecin",
          "Il fait médecin",
        ],
        correctIndex: 1,
      },
      hint: "No article after 'être' + profession",
      explanation: "'Il est médecin' — drop the article when stating a profession after 'être'.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "Where does 'souvent' go in the sentence?",
      content: {
        options: [
          "Souvent je travaille",
          "Je souvent travaille",
          "Je travaille souvent",
          "Je travaille je souvent",
        ],
        correctIndex: 2,
      },
      hint: "Frequency adverbs go after the conjugated verb",
      explanation: "'Je travaille souvent' — adverbs of frequency go AFTER the verb in French.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the expressions with their uses:",
      content: {
        pairs: [
          { left: "faire du sport", right: "general sports activity" },
          { left: "jouer au tennis", right: "specific sport" },
          { left: "jouer de la guitare", right: "musical instrument" },
          { left: "se promener", right: "taking a walk" },
        ],
      },
      hint: "'Faire de' for general, 'jouer à' for sports, 'jouer de' for instruments",
      explanation: "Faire du = general activities, jouer à = sports, jouer de = instruments, se promener = reflexive.",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete the sentence:",
      content: {
        sentence: "J'aime ___ le matin.",
        answer: "travailler",
        options: ["travaille", "travailler", "travailles", "travaillons"],
        caseSensitive: false,
      },
      hint: "After an opinion verb, the second verb must be...",
      explanation: "'J'aime travailler' — infinitive after opinion verbs (aimer, détester, préférer).",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete the sentence:",
      content: {
        sentence: "Je ne travaille ___ le dimanche.",
        answer: "jamais",
        options: ["toujours", "souvent", "jamais", "parfois"],
        caseSensitive: false,
      },
      hint: "'Ne...' indicates negation — which frequency word means 'never'?",
      explanation: "'Je ne travaille jamais' = I never work. Ne...jamais = never.",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'After work, I rest and I enjoy my free time.'",
      content: {
        correctAnswer: "Après le travail, je me repose et je profite de mon temps libre.",
        acceptableAnswers: [
          "Après le travail, je me repose et je profite de mon temps libre",
          "après le travail, je me repose et je profite de mon temps libre",
        ],
        direction: "to_target",
      },
      hint: "Reflexive verb + 'profiter de' + possessive + noun",
      explanation: "Combines reflexive verb (se reposer), 'profiter de', and time vocabulary — all from this unit!",
      difficulty: "HARD",
      xp_reward: 4,
      order_index: 6,
    },
    {
      exercise_type: "REORDER",
      question: "Put the words in order:",
      content: {
        words: ["collègues", "déjeune", "avec", "souvent", "on", "ses"],
        correctOrder: ["on", "déjeune", "souvent", "avec", "ses", "collègues"],
        translation: "We often have lunch with his/her colleagues",
      },
      hint: "Subject + verb + adverb + avec + possessive + noun",
      explanation: "Correct order: On déjeune souvent avec ses collègues. Adverb after verb.",
      difficulty: "HARD",
      xp_reward: 4,
      order_index: 7,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and select the correct answer:",
      content: {
        ttsText: "Je suis ingénieur. Je travaille chez Renault du lundi au vendredi. J'aime mon métier mais je préfère le week-end !",
        ttsLang: "fr-FR",
        options: [
          "I'm an engineer at Renault, Monday to Friday. I like my job but prefer weekends.",
          "I'm a teacher at a school, Monday to Saturday. I hate my job.",
          "I'm an engineer at Airbus, every day. I love my job.",
          "I'm an accountant at Renault, part-time. I prefer working.",
        ],
        correctIndex: 0,
      },
      hint: "Listen for 'ingénieur', 'Renault', 'lundi au vendredi', 'aime', 'préfère'",
      explanation: "A complete work description combining profession, company, schedule, and opinion — all from this unit.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 8,
    },
    {
      exercise_type: "SPEAK",
      question: "Say this sentence out loud:",
      content: {
        targetText: "Je suis professeur et je travaille de neuf heures à cinq heures.",
        targetTranslation: "I am a teacher and I work from nine to five.",
        acceptableVariants: ["je suis professeur et je travaille de neuf heures à cinq heures"],
      },
      hint: "Profession (no article) + schedule (de...à...)",
      explanation: "Great! You combined profession and schedule naturally.",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 9,
    },
    {
      exercise_type: "SPEAK",
      question: "Say this sentence out loud:",
      content: {
        targetText: "Après le travail, je me détends et je fais du sport.",
        targetTranslation: "After work, I relax and I do sports.",
        acceptableVariants: ["après le travail je me détends et je fais du sport"],
      },
      hint: "Time expression + reflexive verb + activity",
      explanation: "Excellent! You described your after-work routine using a reflexive verb and an activity — perfect unit 7 review!",
      difficulty: "HARD",
      xp_reward: 5,
      order_index: 10,
    },
  ],
};
