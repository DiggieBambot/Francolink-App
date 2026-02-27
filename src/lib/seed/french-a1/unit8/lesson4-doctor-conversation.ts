export const frenchA1U8L4 = {
  metadata: {
    course: "fr-a1",
    unit: 8,
    lesson: 4,
    title: "Doctor Dialogue",
    slug: "doctor-dialogue",
    type: "CONVERSATION",
    estimatedMinutes: 15,
    xpReward: 25,
  },

  content: {
    introduction: {
      text: "In this lesson, you'll practice a complete conversation at the doctor's office. You'll combine body part vocabulary, the 'avoir mal à' structure, symptom descriptions, and medical vocabulary into a natural dialogue that you can use in a real French medical situation.",
      image: "/images/lessons/doctor-conversation.svg",
      culturalNote: "🇫🇷 French doctors typically use 'vous' with patients, and patients address doctors as 'Docteur'. The consultation is usually private and thorough — French doctors spend an average of 16 minutes per patient, compared to 7 minutes in some other countries.",
    },

    vocabulary: [
      {
        term: "Qu'est-ce qui ne va pas ?",
        translation: "What's wrong?",
        pronunciation: "kess-kee nuh vah PAH",
        partOfSpeech: "expression",
        image: "/images/vocab/whats-wrong.svg",
        exampleSentence: {
          original: "Qu'est-ce qui ne va pas aujourd'hui ?",
          translation: "What's wrong today?",
        },
        tip: "The most common way a doctor starts the consultation.",
      },
      {
        term: "depuis quand ?",
        translation: "since when?",
        pronunciation: "duh-PWEE kahn",
        partOfSpeech: "expression",
        image: "/images/vocab/since-when.svg",
        exampleSentence: {
          original: "Depuis quand avez-vous mal ?",
          translation: "Since when have you been in pain?",
        },
        tip: "The doctor asks this to understand how long symptoms have lasted.",
      },
      {
        term: "c'est grave ?",
        translation: "is it serious?",
        pronunciation: "say GRAHV",
        partOfSpeech: "expression",
        image: "/images/vocab/serious.svg",
        exampleSentence: {
          original: "C'est grave, docteur ?",
          translation: "Is it serious, doctor?",
        },
        tip: "A very common patient question. The doctor usually reassures you!",
      },
      {
        term: "se reposer",
        translation: "to rest",
        pronunciation: "suh ruh-poh-ZAY",
        partOfSpeech: "verb",
        image: "/images/vocab/rest.svg",
        exampleSentence: {
          original: "Vous devez vous reposer.",
          translation: "You must rest.",
        },
        tip: "Reflexive verb. Doctors often prescribe rest: 'Reposez-vous !'",
      },
      {
        term: "boire beaucoup d'eau",
        translation: "to drink a lot of water",
        pronunciation: "bwahr boh-KOO DOH",
        partOfSpeech: "expression",
        image: "/images/vocab/drink-water.svg",
        exampleSentence: {
          original: "Il faut boire beaucoup d'eau.",
          translation: "You need to drink a lot of water.",
        },
        tip: "Standard doctor advice! 'Il faut' = it is necessary / you must.",
      },
      {
        term: "prendre un médicament",
        translation: "to take a medicine",
        pronunciation: "PRAHN-druh uhn may-dee-kah-MAHN",
        partOfSpeech: "expression",
        image: "/images/vocab/take-medicine.svg",
        exampleSentence: {
          original: "Prenez ce médicament trois fois par jour.",
          translation: "Take this medicine three times a day.",
        },
        tip: "'Prendre' is irregular: je prends, tu prends, il prend, nous prenons.",
      },
      {
        term: "une allergie",
        translation: "an allergy",
        pronunciation: "ewn ah-lehr-ZHEE",
        partOfSpeech: "noun",
        gender: "feminine",
        image: "/images/vocab/allergy.svg",
        exampleSentence: {
          original: "J'ai une allergie au pollen.",
          translation: "I have a pollen allergy.",
        },
        tip: "Common question: 'Avez-vous des allergies ?' (Do you have any allergies?)",
      },
      {
        term: "la tension",
        translation: "blood pressure",
        pronunciation: "lah tahn-SYOHN",
        partOfSpeech: "noun",
        gender: "feminine",
        image: "/images/vocab/blood-pressure.svg",
        exampleSentence: {
          original: "Je vais prendre votre tension.",
          translation: "I'm going to take your blood pressure.",
        },
        tip: "Can also mean 'tension/stress' in everyday French.",
      },
    ],

    grammar: [
      {
        title: "Doctor's Instructions: Imperative with 'vous'",
        explanation: "Doctors use the imperative (command form) with 'vous' to give instructions. For -er verbs, the imperative 'vous' form is the same as the present tense. These are direct commands the doctor gives during examination.",
        examples: [
          {
            original: "Ouvrez la bouche.",
            translation: "Open your mouth.",
            breakdown: "Ouvrez (open — imperative vous) + la bouche (the mouth)",
          },
          {
            original: "Respirez profondément.",
            translation: "Breathe deeply.",
            breakdown: "Respirez (breathe — imperative vous) + profondément (deeply)",
          },
          {
            original: "Reposez-vous.",
            translation: "Rest.",
            breakdown: "Reposez-vous (rest yourself — reflexive imperative)",
          },
        ],
        commonMistakes: [
          "❌ Vous respirez (this is a statement, not a command)",
          "✅ Respirez ! (imperative — drop the 'vous' for commands)",
        ],
      },
      {
        title: "'Il faut' for Medical Advice",
        explanation: "'Il faut' + infinitive means 'it is necessary to' or 'you must'. Doctors use it frequently to give advice. It's impersonal — the subject is always 'il' (not referring to a person).",
        examples: [
          {
            original: "Il faut boire beaucoup d'eau.",
            translation: "You must drink a lot of water.",
            breakdown: "Il faut (you must) + boire (to drink) + beaucoup d'eau (a lot of water)",
          },
          {
            original: "Il faut prendre ce médicament.",
            translation: "You must take this medicine.",
            breakdown: "Il faut (you must) + prendre (to take) + ce médicament (this medicine)",
          },
        ],
        commonMistakes: [
          "❌ Il faut bois de l'eau (wrong — verb after 'il faut' must be infinitive)",
          "✅ Il faut boire de l'eau (correct — infinitive after 'il faut')",
        ],
      },
    ],

    dialogue: {
      title: "A Full Doctor's Consultation",
      context: "Léa visits Dr. Thomas for a health issue.",
      image: "/images/dialogues/full-consultation.svg",
      lines: [
        {
          speaker: "thomas",
          text: "Bonjour, Léa. Asseyez-vous. Qu'est-ce qui ne va pas ?",
          translation: "Hello, Léa. Sit down. What's wrong?",
        },
        {
          speaker: "léa",
          text: "Bonjour, docteur. J'ai mal à la tête et au ventre depuis deux jours.",
          translation: "Hello, doctor. I've had a headache and stomachache for two days.",
        },
        {
          speaker: "thomas",
          text: "Vous avez de la fièvre ?",
          translation: "Do you have a fever?",
        },
        {
          speaker: "léa",
          text: "Oui, un peu. Et je suis très fatiguée.",
          translation: "Yes, a little. And I'm very tired.",
        },
        {
          speaker: "thomas",
          text: "Avez-vous des allergies ?",
          translation: "Do you have any allergies?",
        },
        {
          speaker: "léa",
          text: "Non, pas d'allergies.",
          translation: "No, no allergies.",
        },
        {
          speaker: "thomas",
          text: "Je vais vous examiner. Ouvrez la bouche. Respirez profondément.",
          translation: "I'm going to examine you. Open your mouth. Breathe deeply.",
        },
        {
          speaker: "léa",
          text: "C'est grave, docteur ?",
          translation: "Is it serious, doctor?",
        },
        {
          speaker: "thomas",
          text: "Non, ce n'est pas grave. C'est un rhume. Il faut vous reposer et boire beaucoup d'eau. Voici une ordonnance.",
          translation: "No, it's not serious. It's a cold. You need to rest and drink lots of water. Here's a prescription.",
        },
        {
          speaker: "léa",
          text: "Merci, docteur. Au revoir !",
          translation: "Thank you, doctor. Goodbye!",
        },
      ],
      comprehensionQuestions: [
        {
          question: "How long has Léa been feeling sick?",
          options: ["One day", "Two days", "Three days", "A week"],
          correctIndex: 1,
        },
        {
          question: "What does the doctor advise?",
          options: [
            "Go to the hospital",
            "Rest and drink water",
            "Take antibiotics",
            "Come back tomorrow",
          ],
          correctIndex: 1,
        },
      ],
    },

    culture: {
      title: "The French Medical Consultation",
      text: "A typical French medical consultation follows a clear pattern: greeting, describing symptoms, examination, diagnosis, and prescription. French doctors are thorough and take time with patients. They almost always write an ordonnance (prescription), even if it's just for paracetamol. The 'carte vitale' (health card) is essential — it's a green card with a chip that contains your health insurance information. You present it at every medical visit and pharmacy.",
      image: "/images/culture/medical-consultation.svg",
      funFact: "🎉 France's 'carte vitale' (health card) was introduced in 1998. This small green card is carried by virtually every French resident and makes healthcare reimbursement almost automatic — you just swipe it!",
    },

    summary: {
      keyPoints: [
        "'Qu'est-ce qui ne va pas ?' = What's wrong?",
        "'Depuis quand ?' = Since when? (for duration of symptoms)",
        "'C'est grave ?' = Is it serious?",
        "Doctor commands: Ouvrez, Respirez, Reposez-vous",
        "'Il faut' + infinitive = You must...",
        "Medical essentials: ordonnance, médicament, allergie",
      ],
      practicePrompt: "Role-play a doctor's visit. Practice both sides: Doctor: 'Qu'est-ce qui ne va pas ?' Patient: 'J'ai mal à... depuis... jours.' Doctor: 'Il faut vous reposer.'",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "How does a French doctor typically start a consultation?",
      content: {
        options: [
          "Comment vous appelez-vous ?",
          "Qu'est-ce qui ne va pas ?",
          "Quel âge avez-vous ?",
          "Où habitez-vous ?",
        ],
        correctIndex: 1,
      },
      hint: "The doctor wants to know about your health problem",
      explanation: "'Qu'est-ce qui ne va pas ?' (What's wrong?) is the standard opening question.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What does 'Il faut boire beaucoup d'eau' mean?",
      content: {
        options: [
          "You must eat a lot of bread",
          "You must drink a lot of water",
          "You must sleep a lot",
          "You must take medicine",
        ],
        correctIndex: 1,
      },
      hint: "'Boire' = to drink, 'eau' = water",
      explanation: "'Il faut boire beaucoup d'eau' = You must drink a lot of water — common medical advice.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the doctor's phrases with their meanings:",
      content: {
        pairs: [
          { left: "Ouvrez la bouche", right: "Open your mouth" },
          { left: "Respirez profondément", right: "Breathe deeply" },
          { left: "Reposez-vous", right: "Rest" },
          { left: "C'est grave ?", right: "Is it serious?" },
        ],
      },
      hint: "These are common phrases heard during a medical visit",
      explanation: "Essential medical consultation phrases — both doctor instructions and patient questions.",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete the sentence:",
      content: {
        sentence: "Il ___ vous reposer.",
        answer: "faut",
        options: ["faut", "fait", "fais", "font"],
        caseSensitive: false,
      },
      hint: "'Il faut' = it is necessary / you must",
      explanation: "'Il faut' + infinitive = you must. Il faut vous reposer = You must rest.",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete the sentence:",
      content: {
        sentence: "J'ai mal à la tête ___ deux jours.",
        answer: "depuis",
        options: ["depuis", "pendant", "pour", "dans"],
        caseSensitive: false,
      },
      hint: "Which word means 'since/for' when describing ongoing symptoms?",
      explanation: "'Depuis deux jours' = for two days (ongoing). Used to describe symptom duration.",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'Is it serious, doctor?'",
      content: {
        correctAnswer: "C'est grave, docteur ?",
        acceptableAnswers: [
          "C'est grave, docteur ?",
          "C'est grave, docteur",
          "c'est grave, docteur",
          "C'est grave docteur ?",
        ],
        direction: "to_target",
      },
      hint: "Very simple and direct in French",
      explanation: "'C'est grave, docteur ?' — the most natural way to ask if something is serious.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 6,
    },
    {
      exercise_type: "REORDER",
      question: "Put the words in order:",
      content: {
        words: ["boire", "d'eau", "faut", "beaucoup", "il"],
        correctOrder: ["il", "faut", "boire", "beaucoup", "d'eau"],
        translation: "You must drink a lot of water",
      },
      hint: "'Il faut' + infinitive",
      explanation: "Correct order: Il faut boire beaucoup d'eau. (You must drink a lot of water.)",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 7,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and select the correct answer:",
      content: {
        ttsText: "Ce n'est pas grave. C'est un rhume. Il faut vous reposer et prendre ce médicament.",
        ttsLang: "fr-FR",
        options: [
          "It's not serious. It's a cold. You need to rest and take this medicine.",
          "It's very serious. You need to go to the hospital.",
          "It's not serious. It's an allergy. You need to drink water.",
          "It's a fever. You need to stay in bed for a week.",
        ],
        correctIndex: 0,
      },
      hint: "Listen for 'pas grave', 'rhume', 'reposer', 'médicament'",
      explanation: "The doctor's diagnosis and advice: not serious, cold, rest and medicine.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 8,
    },
    {
      exercise_type: "SPEAK",
      question: "Say this sentence out loud:",
      content: {
        targetText: "Qu'est-ce qui ne va pas ?",
        targetTranslation: "What's wrong?",
        acceptableVariants: ["qu'est-ce qui ne va pas"],
      },
      hint: "This is the key question a doctor asks",
      explanation: "Great! 'Qu'est-ce qui ne va pas ?' — essential medical vocabulary.",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 9,
    },
    {
      exercise_type: "SPEAK",
      question: "Say this sentence out loud:",
      content: {
        targetText: "J'ai mal à la tête depuis trois jours.",
        targetTranslation: "I've had a headache for three days.",
        acceptableVariants: ["j'ai mal à la tête depuis trois jours"],
      },
      hint: "Symptom + duration with 'depuis'",
      explanation: "Excellent! You described your symptom with its duration — exactly what a doctor needs to hear.",
      difficulty: "HARD",
      xp_reward: 5,
      order_index: 10,
    },
  ],
};
