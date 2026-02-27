export const frenchA1U8L6 = {
  metadata: {
    course: "fr-a1",
    unit: 8,
    lesson: 6,
    title: "At the Pharmacy",
    slug: "at-the-pharmacy",
    type: "CONVERSATION",
    estimatedMinutes: 15,
    xpReward: 25,
  },

  content: {
    introduction: {
      text: "In this lesson, you'll practice a complete pharmacy conversation. You'll learn how to describe symptoms to a pharmacist, ask for recommendations, and understand dosage instructions. French pharmacists are excellent health advisors — knowing how to communicate with them is invaluable!",
      image: "/images/lessons/pharmacy-conversation.svg",
      culturalNote: "🇫🇷 In France, pharmacists can recommend medicines for common ailments without a doctor's prescription. Many French people go directly to the pharmacy for minor health issues like headaches, colds, or small injuries before considering a doctor's visit.",
    },

    vocabulary: [
      {
        term: "quelque chose pour",
        translation: "something for",
        pronunciation: "kel-kuh SHOHZ poor",
        partOfSpeech: "expression",
        image: "/images/vocab/something-for.svg",
        exampleSentence: {
          original: "Vous avez quelque chose pour le mal de tête ?",
          translation: "Do you have something for headaches?",
        },
        tip: "The most natural way to ask for medicine at a pharmacy.",
      },
      {
        term: "je vous recommande",
        translation: "I recommend (to you)",
        pronunciation: "zhuh voo ruh-koh-MAHND",
        partOfSpeech: "expression",
        image: "/images/vocab/recommend.svg",
        exampleSentence: {
          original: "Je vous recommande ce sirop.",
          translation: "I recommend this syrup to you.",
        },
        tip: "What the pharmacist says when suggesting a product.",
      },
      {
        term: "la carte vitale",
        translation: "the health insurance card",
        pronunciation: "lah kart vee-TAL",
        partOfSpeech: "noun",
        gender: "feminine",
        image: "/images/vocab/carte-vitale.svg",
        exampleSentence: {
          original: "Voici ma carte vitale.",
          translation: "Here is my health insurance card.",
        },
        tip: "Essential in France! This green card with a chip stores your health insurance info.",
      },
      {
        term: "avant les repas",
        translation: "before meals",
        pronunciation: "ah-VAHN lay ruh-PAH",
        partOfSpeech: "expression",
        image: "/images/vocab/before-meals.svg",
        exampleSentence: {
          original: "Prenez le médicament avant les repas.",
          translation: "Take the medicine before meals.",
        },
        tip: "Opposite: 'après les repas' (after meals). Important for medication timing.",
      },
      {
        term: "après les repas",
        translation: "after meals",
        pronunciation: "ah-PREH lay ruh-PAH",
        partOfSpeech: "expression",
        image: "/images/vocab/after-meals.svg",
        exampleSentence: {
          original: "Prenez le comprimé après les repas.",
          translation: "Take the tablet after meals.",
        },
        tip: "Most medicines in France are taken after meals to protect the stomach.",
      },
      {
        term: "matin et soir",
        translation: "morning and evening",
        pronunciation: "mah-TAHN ay SWAHR",
        partOfSpeech: "expression",
        image: "/images/vocab/morning-evening.svg",
        exampleSentence: {
          original: "Appliquez la crème matin et soir.",
          translation: "Apply the cream morning and evening.",
        },
        tip: "Common dosage timing for medicines and skincare.",
      },
      {
        term: "pendant combien de temps ?",
        translation: "for how long?",
        pronunciation: "pahn-DAHN kohm-BYAHN duh TAHN",
        partOfSpeech: "expression",
        image: "/images/vocab/how-long.svg",
        exampleSentence: {
          original: "Je prends ce médicament pendant combien de temps ?",
          translation: "How long do I take this medicine for?",
        },
        tip: "An important question to ask about any medication treatment duration.",
      },
      {
        term: "ça coûte combien ?",
        translation: "how much does it cost?",
        pronunciation: "sah KOOT kohm-BYAHN",
        partOfSpeech: "expression",
        image: "/images/vocab/how-much.svg",
        exampleSentence: {
          original: "Ça coûte combien, le sirop ?",
          translation: "How much does the syrup cost?",
        },
        tip: "Useful for pharmacy purchases. Many medicines are partially reimbursed by insurance.",
      },
    ],

    grammar: [
      {
        title: "Asking for Recommendations: 'Vous avez quelque chose pour...?'",
        explanation: "The most natural way to ask for medicine at a French pharmacy is 'Vous avez quelque chose pour...?' (Do you have something for...?). Follow it with the symptom or condition.",
        examples: [
          {
            original: "Vous avez quelque chose pour le mal de tête ?",
            translation: "Do you have something for headaches?",
            breakdown: "Vous avez (do you have) + quelque chose (something) + pour (for) + le mal de tête (headaches)",
          },
          {
            original: "Vous avez quelque chose pour la toux ?",
            translation: "Do you have something for a cough?",
            breakdown: "Same structure + la toux (cough)",
          },
        ],
        commonMistakes: [
          "❌ Donnez-moi un médicament (too direct / rude)",
          "✅ Vous avez quelque chose pour... ? (polite and natural)",
        ],
      },
      {
        title: "Understanding Dosage with 'Prendre'",
        explanation: "The pharmacist uses 'prendre' (to take) in the imperative to give dosage instructions. Remember 'prendre' is irregular: prenez (vous form imperative).",
        examples: [
          {
            original: "Prenez un comprimé matin et soir.",
            translation: "Take one tablet morning and evening.",
            breakdown: "Prenez (take — imperative) + un comprimé (one tablet) + matin et soir (morning and evening)",
          },
          {
            original: "Prenez ce sirop après les repas pendant cinq jours.",
            translation: "Take this syrup after meals for five days.",
            breakdown: "Prenez + ce sirop + après les repas (after meals) + pendant cinq jours (for five days)",
          },
        ],
        commonMistakes: [
          "❌ Prendez un comprimé (wrong — 'prendre' is irregular: prenez, not prendez)",
          "✅ Prenez un comprimé (correct imperative form)",
        ],
      },
    ],

    dialogue: {
      title: "Buying Medicine Without a Prescription",
      context: "Nicolas visits the pharmacy for a cold without seeing the doctor first.",
      image: "/images/dialogues/pharmacy-buying.svg",
      lines: [
        {
          speaker: "nicolas",
          text: "Bonjour ! J'ai un rhume. Vous avez quelque chose pour la toux ?",
          translation: "Hello! I have a cold. Do you have something for a cough?",
        },
        {
          speaker: "camille",
          text: "Oui, bien sûr. Depuis quand toussez-vous ?",
          translation: "Yes, of course. How long have you been coughing?",
        },
        {
          speaker: "nicolas",
          text: "Depuis trois jours. Et j'ai aussi mal à la gorge.",
          translation: "For three days. And my throat also hurts.",
        },
        {
          speaker: "camille",
          text: "Je vous recommande ce sirop pour la toux et ces pastilles pour la gorge.",
          translation: "I recommend this cough syrup and these throat lozenges.",
        },
        {
          speaker: "nicolas",
          text: "Comment je prends le sirop ?",
          translation: "How do I take the syrup?",
        },
        {
          speaker: "camille",
          text: "Deux cuillères, trois fois par jour, après les repas.",
          translation: "Two spoonfuls, three times a day, after meals.",
        },
        {
          speaker: "nicolas",
          text: "Pendant combien de temps ?",
          translation: "For how long?",
        },
        {
          speaker: "camille",
          text: "Pendant cinq jours. Si ça ne va pas mieux, allez chez le médecin.",
          translation: "For five days. If it doesn't get better, go to the doctor.",
        },
        {
          speaker: "nicolas",
          text: "Ça coûte combien ?",
          translation: "How much does it cost?",
        },
        {
          speaker: "camille",
          text: "Douze euros cinquante. Bon rétablissement !",
          translation: "Twelve euros fifty. Get well soon!",
        },
      ],
      comprehensionQuestions: [
        {
          question: "What does the pharmacist recommend?",
          options: [
            "Tablets and cream",
            "Syrup and throat lozenges",
            "Bandages and water",
            "A doctor's visit only",
          ],
          correctIndex: 1,
        },
        {
          question: "How long should Nicolas take the syrup?",
          options: ["Three days", "Five days", "One week", "Two weeks"],
          correctIndex: 1,
        },
      ],
    },

    culture: {
      title: "The Pharmacist as Health Advisor",
      text: "In France, pharmacists play a crucial role in the healthcare system. They can advise on minor health issues without requiring you to see a doctor first. This saves time and money for patients and reduces pressure on doctors. Pharmacists check for drug interactions, explain side effects, and ensure you understand your treatment. Since 2019, some French pharmacists can even administer flu vaccines. The relationship between a French person and their local pharmacist is often personal and long-lasting — many people have been going to the same 'pharmacie de quartier' (neighborhood pharmacy) for years.",
      image: "/images/culture/pharmacist-advisor.svg",
      funFact: "🎉 Since 2019, French pharmacists can administer flu vaccines, and since 2022, they can also prescribe and administer COVID boosters. They can also test for strep throat and prescribe antibiotics — making French pharmacies true healthcare hubs!",
    },

    summary: {
      keyPoints: [
        "'Vous avez quelque chose pour...?' = Do you have something for...?",
        "'Je vous recommande...' = I recommend...",
        "Dosage: 'fois par jour' (times per day), 'matin et soir' (morning and evening)",
        "Timing: 'avant les repas' (before meals), 'après les repas' (after meals)",
        "'Pendant combien de temps ?' = For how long?",
        "'La carte vitale' = French health insurance card",
        "'Bon rétablissement !' = Get well soon!",
      ],
      practicePrompt: "Role-play a pharmacy visit: 'Bonjour, j'ai un rhume. Vous avez quelque chose pour la toux ? Comment je prends ce médicament ? Pendant combien de temps ? Ça coûte combien ?'",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "How do you politely ask for medicine at a French pharmacy?",
      content: {
        options: [
          "Donnez-moi un médicament !",
          "Vous avez quelque chose pour le mal de tête ?",
          "Je veux un comprimé !",
          "Un médicament, vite !",
        ],
        correctIndex: 1,
      },
      hint: "The polite way starts with 'Vous avez...'",
      explanation: "'Vous avez quelque chose pour...?' is the natural, polite way to ask for medicine.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What does 'après les repas' mean?",
      content: {
        options: ["Before meals", "After meals", "During meals", "Without meals"],
        correctIndex: 1,
      },
      hint: "'Après' means 'after'",
      explanation: "'Après les repas' = after meals. Important for medication timing.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the pharmacy phrases with their meanings:",
      content: {
        pairs: [
          { left: "avant les repas", right: "before meals" },
          { left: "matin et soir", right: "morning and evening" },
          { left: "trois fois par jour", right: "three times a day" },
          { left: "pendant cinq jours", right: "for five days" },
        ],
      },
      hint: "These are all dosage and timing instructions",
      explanation: "Essential phrases for understanding medication instructions in French.",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete the sentence:",
      content: {
        sentence: "Vous avez ___ chose pour la toux ?",
        answer: "quelque",
        options: ["quelque", "quel", "quelle", "chaque"],
        caseSensitive: false,
      },
      hint: "'Something' in French is 'quelque chose'",
      explanation: "'Quelque chose' = something. 'Vous avez quelque chose pour...?' = Do you have something for...?",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete the sentence:",
      content: {
        sentence: "Prenez ce médicament ___ les repas.",
        answer: "après",
        options: ["après", "avant", "pendant", "sans"],
        caseSensitive: false,
      },
      hint: "Most medicines are taken after eating to protect the stomach",
      explanation: "'Après les repas' = after meals — the most common timing for medication.",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'How much does it cost?'",
      content: {
        correctAnswer: "Ça coûte combien ?",
        acceptableAnswers: [
          "Ça coûte combien ?",
          "Ça coûte combien",
          "ça coûte combien",
          "Combien ça coûte ?",
          "Combien ça coûte",
        ],
        direction: "to_target",
      },
      hint: "A simple, direct question about price",
      explanation: "'Ça coûte combien ?' or 'Combien ça coûte ?' — both are correct and natural.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 6,
    },
    {
      exercise_type: "REORDER",
      question: "Put the words in order:",
      content: {
        words: ["pour", "quelque", "avez", "vous", "chose", "la toux"],
        correctOrder: ["vous", "avez", "quelque", "chose", "pour", "la toux"],
        translation: "Do you have something for a cough?",
      },
      hint: "Start with 'vous avez' then the request",
      explanation: "Correct order: Vous avez quelque chose pour la toux ? (Do you have something for a cough?)",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 7,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and select the correct answer:",
      content: {
        ttsText: "Prenez deux comprimés, matin et soir, après les repas, pendant une semaine.",
        ttsLang: "fr-FR",
        options: [
          "Take two tablets, morning and evening, after meals, for one week",
          "Take one tablet, three times a day, before meals, for three days",
          "Take the syrup, once a day, after meals, for two weeks",
          "Take two tablets, once a day, before meals, for five days",
        ],
        correctIndex: 0,
      },
      hint: "Listen for 'deux comprimés', 'matin et soir', 'après les repas', 'une semaine'",
      explanation: "Complete dosage instructions: quantity, timing, meal relation, duration.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 8,
    },
    {
      exercise_type: "SPEAK",
      question: "Say this sentence out loud:",
      content: {
        targetText: "Vous avez quelque chose pour le mal de tête ?",
        targetTranslation: "Do you have something for headaches?",
        acceptableVariants: ["vous avez quelque chose pour le mal de tête"],
      },
      hint: "The essential pharmacy question",
      explanation: "Great! This is the most useful phrase for any French pharmacy visit.",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 9,
    },
    {
      exercise_type: "SPEAK",
      question: "Say this sentence out loud:",
      content: {
        targetText: "Pendant combien de temps je prends ce médicament ?",
        targetTranslation: "How long do I take this medicine for?",
        acceptableVariants: ["pendant combien de temps je prends ce médicament"],
      },
      hint: "An important follow-up question about treatment duration",
      explanation: "Excellent! Always ask about treatment duration when getting medicine.",
      difficulty: "HARD",
      xp_reward: 5,
      order_index: 10,
    },
  ],
};
