export const frenchA1U7L5 = {
  metadata: {
    course: "fr-a1",
    unit: 7,
    lesson: 5,
    title: "Talking About Your Job",
    slug: "talking-about-your-job",
    type: "CONVERSATION",
    estimatedMinutes: 15,
    xpReward: 25,
  },

  content: {
    introduction: {
      text: "In this lesson, you'll practice having a full conversation about work — your job, your schedule, your workplace, and your colleagues. You'll combine profession vocabulary, -er verbs, time expressions, and workplace words into natural dialogue.",
      culturalNote: "🇫🇷 When talking about work in social settings, the French tend to be modest about their accomplishments. Bragging about your salary or position is considered very rude. Instead, focus on what you enjoy about your work and your colleagues.",
    },

    vocabulary: [
      {
        term: "un travail",
        translation: "a job / work",
        pronunciation: "uhn trah-VAH-yuh",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "J'aime mon travail.",
          translation: "I like my job.",
        },
        tip: "More casual than 'un emploi'. 'Le travail' can mean work in general.",
      },
      {
        term: "un métier",
        translation: "a profession / a trade",
        pronunciation: "uhn may-TYAY",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Quel est ton métier ?",
          translation: "What is your profession?",
        },
        tip: "Implies skill and expertise. 'C'est un beau métier' = It's a fine profession.",
      },
      {
        term: "un horaire",
        translation: "a schedule / timetable",
        pronunciation: "uhn oh-REHR",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Mon horaire est flexible.",
          translation: "My schedule is flexible.",
        },
        tip: "Can be singular or plural: 'les horaires de travail' = work hours.",
      },
      {
        term: "à temps plein",
        translation: "full-time",
        pronunciation: "ah tahn PLAHN",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Elle travaille à temps plein.",
          translation: "She works full-time.",
        },
        tip: "Opposite: 'à temps partiel' (part-time).",
      },
      {
        term: "à temps partiel",
        translation: "part-time",
        pronunciation: "ah tahn par-SYEL",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Il travaille à temps partiel le mercredi.",
          translation: "He works part-time on Wednesdays.",
        },
        tip: "Very common in France — many parents work part-time on Wednesdays when schools are closed.",
      },
      {
        term: "aimer",
        translation: "to like / to love",
        pronunciation: "eh-MAY",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "J'aime travailler avec mes collègues.",
          translation: "I like working with my colleagues.",
        },
        tip: "Followed by a verb in the infinitive: j'aime + travailler.",
      },
      {
        term: "préférer",
        translation: "to prefer",
        pronunciation: "pray-fay-RAY",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Je préfère travailler le matin.",
          translation: "I prefer to work in the morning.",
        },
        tip: "Note the accent change: je préfère (accent grave), nous préférons (accent aigu).",
      },
      {
        term: "détester",
        translation: "to hate",
        pronunciation: "day-teh-STAY",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Je déteste les réunions longues.",
          translation: "I hate long meetings.",
        },
        tip: "Regular -er verb. Stronger than 'ne pas aimer' (to not like).",
      },
    ],

    grammar: [
      {
        title: "Expressing Likes and Dislikes About Work",
        explanation: "Use 'aimer', 'adorer', 'préférer', and 'détester' followed by a noun or infinitive verb to express your feelings about work. The structure is: subject + opinion verb + noun/infinitive.",
        examples: [
          {
            original: "J'aime mon travail.",
            translation: "I like my job.",
            breakdown: "J'aime (I like) + mon travail (my job) — verb + noun",
          },
          {
            original: "Je déteste travailler le week-end.",
            translation: "I hate working on weekends.",
            breakdown: "Je déteste (I hate) + travailler (to work) — verb + infinitive",
          },
          {
            original: "Je préfère travailler le matin.",
            translation: "I prefer working in the morning.",
            breakdown: "Je préfère (I prefer) + travailler (to work) + le matin (in the morning)",
          },
        ],
        commonMistakes: [
          "❌ J'aime travaille le matin (wrong — second verb must be infinitive)",
          "✅ J'aime travailler le matin (correct — infinitive after opinion verb)",
        ],
      },
      {
        title: "Combining Work Topics in Conversation",
        explanation: "A natural conversation about work covers: what you do (profession), where you work (workplace), when you work (schedule), and how you feel about it (opinions). Practice linking these with connectors like 'et' (and), 'mais' (but), 'parce que' (because).",
        examples: [
          {
            original: "Je suis comptable. Je travaille dans un bureau à Paris.",
            translation: "I'm an accountant. I work in an office in Paris.",
            breakdown: "Profession + workplace — two connected sentences",
          },
          {
            original: "J'aime mon travail parce que mes collègues sont sympas.",
            translation: "I like my job because my colleagues are nice.",
            breakdown: "Opinion + parce que (because) + reason",
          },
        ],
        commonMistakes: [
          "❌ J'aime mon travail car que mes collègues sont sympas (double conjunction)",
          "✅ J'aime mon travail parce que mes collègues sont sympas (correct — single 'parce que')",
        ],
      },
    ],

    dialogue: {
      title: "Catching Up About Work",
      image: "/images/dialogues/catching-up-work.svg",
      context: "Pierre and Emma meet for coffee and talk about their jobs.",
      lines: [
        {
          speaker: "pierre",
          text: "Alors Emma, tu aimes ton nouveau travail ?",
          translation: "So Emma, do you like your new job?",
        },
        {
          speaker: "emma",
          text: "Oui, beaucoup ! Je suis comptable dans une grande entreprise.",
          translation: "Yes, a lot! I'm an accountant in a big company.",
        },
        {
          speaker: "pierre",
          text: "Tu travailles à temps plein ?",
          translation: "Do you work full-time?",
        },
        {
          speaker: "emma",
          text: "Oui, du lundi au vendredi. Je commence à neuf heures et je termine à dix-sept heures.",
          translation: "Yes, Monday to Friday. I start at nine and finish at five.",
        },
        {
          speaker: "pierre",
          text: "Et tes collègues, comment sont-ils ?",
          translation: "And your colleagues, what are they like?",
        },
        {
          speaker: "emma",
          text: "Ils sont très sympas. On déjeune souvent ensemble. Et toi, ton travail ?",
          translation: "They're very nice. We often have lunch together. And you, your job?",
        },
        {
          speaker: "pierre",
          text: "Je suis serveur dans un restaurant. J'aime mon métier mais je déteste travailler le week-end !",
          translation: "I'm a waiter in a restaurant. I like my profession but I hate working on weekends!",
        },
        {
          speaker: "emma",
          text: "Je comprends ! C'est un métier difficile mais intéressant.",
          translation: "I understand! It's a difficult but interesting profession.",
        },
      ],
      comprehensionQuestions: [
        {
          question: "What is Emma's schedule?",
          options: ["Part-time", "Monday to Friday, 9 to 5", "Weekends only", "Night shifts"],
          correctIndex: 1,
        },
        {
          question: "What does Pierre dislike about his job?",
          options: ["His colleagues", "The food", "Working on weekends", "His boss"],
          correctIndex: 2,
        },
      ],
    },

    culture: {
      title: "Work-Life Balance in France",
      text: "France is famous for its emphasis on work-life balance. The 35-hour workweek, five weeks of paid vacation, and numerous public holidays mean that the French have significant time for leisure, family, and personal pursuits. The concept of 'droit à la déconnexion' (right to disconnect) was introduced in 2017, making it illegal for companies to require employees to check work emails outside of working hours. The French believe that a happy, rested worker is a more productive worker.",
      funFact: "🎉 France has the 'droit à la déconnexion' (right to disconnect) law since 2017. Companies with 50+ employees must negotiate 'email-free' hours with their staff. Your boss legally cannot expect you to answer emails on vacation!",
    },

    summary: {
      keyPoints: [
        "'Qu'est-ce que tu fais dans la vie ?' = What do you do for a living?",
        "Express opinions: j'aime, je préfère, je déteste + noun/infinitive",
        "À temps plein = full-time, à temps partiel = part-time",
        "Connect ideas: parce que (because), mais (but), et (and)",
        "Use 'on' for casual 'we': on déjeune ensemble",
        "No article with être + profession: je suis comptable",
      ],
      practicePrompt: "Have a complete conversation about work in French. Answer: Qu'est-ce que tu fais dans la vie ? Tu travailles où ? Tu aimes ton travail ? Pourquoi ?",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "How do you say 'I like my job' in French?",
      content: {
        options: [
          "Je suis mon travail",
          "J'aime mon travail",
          "Je fais mon travail",
          "J'ai mon travail",
        ],
        correctIndex: 1,
      },
      hint: "Use the verb for 'to like'",
      explanation: "'J'aime mon travail' = I like my job. 'Aimer' = to like/love.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What does 'à temps partiel' mean?",
      content: {
        options: ["Full-time", "Part-time", "Overtime", "On time"],
        correctIndex: 1,
      },
      hint: "'Partiel' is related to the English word 'partial'",
      explanation: "'À temps partiel' = part-time. Opposite: 'à temps plein' = full-time.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the opinion verbs with their meanings:",
      content: {
        pairs: [
          { left: "aimer", right: "to like" },
          { left: "détester", right: "to hate" },
          { left: "préférer", right: "to prefer" },
          { left: "adorer", right: "to love" },
        ],
      },
      hint: "Think about the intensity of each feeling",
      explanation: "Adorer (love) > aimer (like) > préférer (prefer) > détester (hate).",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete the sentence:",
      content: {
        sentence: "J'aime ___ avec mes collègues.",
        answer: "travailler",
        options: ["travaille", "travailler", "travaillons", "travailles"],
        caseSensitive: false,
      },
      hint: "After an opinion verb, the second verb stays in the infinitive",
      explanation: "'J'aime travailler' — the second verb must be in the infinitive form.",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete the sentence:",
      content: {
        sentence: "J'aime mon travail ___ mes collègues sont sympas.",
        answer: "parce que",
        options: ["parce que", "mais", "et", "ou"],
        caseSensitive: false,
      },
      hint: "Which connector means 'because'?",
      explanation: "'Parce que' = because. J'aime mon travail parce que mes collègues sont sympas.",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'I prefer to work in the morning.'",
      content: {
        correctAnswer: "Je préfère travailler le matin.",
        acceptableAnswers: [
          "Je préfère travailler le matin",
          "je préfère travailler le matin",
        ],
        direction: "to_target",
      },
      hint: "Opinion verb + infinitive + time expression",
      explanation: "'Je préfère travailler le matin.' — 'préférer' + infinitive 'travailler'.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 6,
    },
    {
      exercise_type: "REORDER",
      question: "Put the words in order:",
      content: {
        words: ["déteste", "le", "travailler", "je", "week-end"],
        correctOrder: ["je", "déteste", "travailler", "le", "week-end"],
        translation: "I hate working on weekends",
      },
      hint: "Subject + opinion verb + infinitive + time",
      explanation: "Correct order: Je déteste travailler le week-end. (I hate working on weekends.)",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 7,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and select the correct answer:",
      content: {
        ttsText: "Je suis comptable. Je travaille à temps plein du lundi au vendredi. J'aime mon métier.",
        ttsLang: "fr-FR",
        options: [
          "I'm an accountant. I work full-time Monday to Friday. I like my profession.",
          "I'm a teacher. I work part-time on weekdays. I hate my job.",
          "I'm an accountant. I work part-time on weekends. I like my colleagues.",
          "I'm a nurse. I work full-time every day. I like my profession.",
        ],
        correctIndex: 0,
      },
      hint: "Listen for 'comptable', 'temps plein', and 'j'aime'",
      explanation: "A complete work description: profession + schedule + opinion. All key vocabulary from this unit.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 8,
    },
    {
      exercise_type: "SPEAK",
      question: "Say this sentence out loud:",
      content: {
        targetText: "Je suis professeur et j'aime mon travail.",
        targetTranslation: "I am a teacher and I like my job.",
        acceptableVariants: ["je suis professeur et j'aime mon travail"],
      },
      hint: "No article after 'être' + profession, then opinion with 'aimer'",
      explanation: "Great! You stated your profession and expressed your opinion naturally.",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 9,
    },
    {
      exercise_type: "SPEAK",
      question: "Say this sentence out loud:",
      content: {
        targetText: "Je travaille à temps plein parce que j'aime mon métier.",
        targetTranslation: "I work full-time because I like my profession.",
        acceptableVariants: ["je travaille à temps plein parce que j'aime mon métier"],
      },
      hint: "Combine schedule + reason with 'parce que'",
      explanation: "Excellent! You connected your work schedule with your reason using 'parce que'.",
      difficulty: "HARD",
      xp_reward: 5,
      order_index: 10,
    },
  ],
};
