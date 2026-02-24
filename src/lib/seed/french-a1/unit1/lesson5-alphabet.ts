// Course: French A1
// Unit: 1 - First Steps
// Lesson: 5 - The Alphabet

export const frenchA1U1L5 = {
  metadata: {
    course: "fr-a1",
    unit: 1,
    lesson: 5,
    title: "The Alphabet",
    slug: "the-alphabet",
    type: "VOCABULARY",
    estimatedMinutes: 15,
    xpReward: 20,
  },
  content: {
    introduction: {
      text: "Knowing the French alphabet is essential for spelling your name, understanding addresses, and reading signs. The French alphabet has the same 26 letters as English, but the pronunciation is quite different. French also uses special accent marks that change how letters sound. Let's learn them!",
      image: "/images/lessons/alphabet.svg",
      culturalNote:
        "🇫🇷 When spelling out loud in France (like your name for a reservation), you might be asked: 'Vous pouvez épeler ?' (Can you spell that?). Knowing the French letter sounds is crucial!",
    },

    vocabulary: [
      {
        term: "A, B, C, D, E, F, G",
        translation: "ah, bay, say, day, uh, eff, zhay",
        pronunciation: "ah, bay, say, day, uh, eff, zhay",
        partOfSpeech: "noun",
        audio: "/audio/fr/alphabet-a-g.mp3",
        exampleSentence: {
          original: "A comme Amour.",
          translation: "A as in Amour (Love).",
        },
        tip: "French 'G' sounds like the 's' in 'measure' — 'zhay', not 'jee.'",
      },
      {
        term: "H, I, J, K, L, M, N",
        translation: "ahsh, ee, zhee, kah, el, em, en",
        pronunciation: "ahsh, ee, zhee, kah, el, em, en",
        partOfSpeech: "noun",
        audio: "/audio/fr/alphabet-h-n.mp3",
        exampleSentence: {
          original: "H comme Hôtel.",
          translation: "H as in Hotel.",
        },
        tip: "French 'H' is always silent in words! 'Hotel' → 'Ôtel'. But the letter name is 'ahsh.'",
      },
      {
        term: "O, P, Q, R, S, T, U",
        translation: "oh, pay, kü, air, ess, tay, ü",
        pronunciation: "oh, pay, kü, air, ess, tay, ü",
        partOfSpeech: "noun",
        audio: "/audio/fr/alphabet-o-u.mp3",
        exampleSentence: {
          original: "R comme Restaurant.",
          translation: "R as in Restaurant.",
        },
        tip: "The French 'R' is pronounced in the throat (like a soft gargle). The 'U' is a sound that doesn't exist in English — round your lips and say 'ee.'",
      },
      {
        term: "V, W, X, Y, Z",
        translation: "vay, doo-bluh-vay, eeks, ee-grek, zed",
        pronunciation: "vay, doo-bluh-vay, eeks, ee-grek, zed",
        partOfSpeech: "noun",
        audio: "/audio/fr/alphabet-v-z.mp3",
        exampleSentence: {
          original: "W comme Wifi.",
          translation: "W as in Wifi.",
        },
        tip: "'W' = 'double-V' (not 'double-U'!). 'Y' = 'i-grec' (Greek i). 'Z' = 'zed' (like British English).",
      },
      {
        term: "É (accent aigu)",
        translation: "ay (like 'bay' without the 'b')",
        pronunciation: "ay",
        partOfSpeech: "noun",
        audio: "/audio/fr/accent-aigu.mp3",
        exampleSentence: {
          original: "Café — C, A, F, É",
          translation: "Café — C, A, F, É (with acute accent)",
        },
        tip: "The acute accent (é) makes an 'ay' sound. It only appears on the letter 'e.'",
      },
      {
        term: "È (accent grave)",
        translation: "eh (like 'bed')",
        pronunciation: "eh",
        partOfSpeech: "noun",
        audio: "/audio/fr/accent-grave.mp3",
        exampleSentence: {
          original: "Mère — M, È, R, E",
          translation: "Mother — M, È, R, E",
        },
        tip: "The grave accent (è) makes an open 'eh' sound. Found on e, a, and u.",
      },
      {
        term: "Ê (accent circonflexe)",
        translation: "eh (similar to accent grave)",
        pronunciation: "eh",
        partOfSpeech: "noun",
        audio: "/audio/fr/accent-circonflexe.mp3",
        exampleSentence: {
          original: "Fête — F, Ê, T, E",
          translation: "Party/Festival — F, Ê, T, E",
        },
        tip: "The circumflex (ê) often indicates a lost 's' from Old French: 'fête' → 'feste' → 'festival' in English!",
      },
      {
        term: "Ç (cédille)",
        translation: "s (soft c before a, o, u)",
        pronunciation: "ss",
        partOfSpeech: "noun",
        audio: "/audio/fr/cedille.mp3",
        exampleSentence: {
          original: "Français — F, R, A, N, Ç, A, I, S",
          translation: "French — F, R, A, N, Ç, A, I, S",
        },
        tip: "The cedilla (ç) makes 'c' sound like 's' before 'a', 'o', or 'u.' Without it, 'ca' would sound like 'ka.'",
      },
    ],

    grammar: [
      {
        title: "Spelling Out Loud in French",
        explanation:
          "To spell a word aloud in French, say each letter by its French name. For accented letters, say the letter then the accent name. The French also use a phrase pattern 'A comme Amour' (A as in Love) for clarity, similar to the NATO phonetic alphabet.",
        examples: [
          {
            original: "M-A-R-I-E",
            translation: "em - ah - air - ee - uh",
            breakdown: "Each letter is pronounced with its French sound",
          },
          {
            original: "Café : C-A-F-É",
            translation: "say - ah - eff - ay (e accent aigu)",
            breakdown:
              "For É, you say 'e accent aigu' or simply 'é' (ay)",
          },
        ],
        table: {
          headers: ["Accent", "Name", "Sound", "Example"],
          rows: [
            ["é", "accent aigu", "ay", "café, été"],
            ["è", "accent grave", "eh", "mère, père"],
            ["ê", "accent circonflexe", "eh", "fête, être"],
            ["ë", "tréma", "separate vowels", "Noël"],
            ["ç", "cédille", "ss", "français, garçon"],
          ],
        },
        commonMistakes: [
          "❌ Pronouncing 'H' in French words — 'H' is always silent!",
          "✅ 'Hôtel' is pronounced 'oh-TEL', not 'HOH-tel.'",
          "❌ Pronouncing French 'R' like English 'R'.",
          "✅ French 'R' is guttural (produced in the throat).",
        ],
      },
    ],

    dialogue: {
      title: "Spelling Your Name at a Hotel",
      context:
        "Thomas checks in at a hotel in Nice and the receptionist asks him to spell his name.",
      image: "/images/dialogues/hotel-checkin.svg",
      lines: [
        {
          speaker: "Réceptionniste",
          text: "Bonjour, monsieur. Votre nom, s'il vous plaît ?",
          translation: "Hello, sir. Your name, please?",
        },
        {
          speaker: "Thomas",
          text: "Thomas Lefèvre.",
          translation: "Thomas Lefèvre.",
        },
        {
          speaker: "Réceptionniste",
          text: "Vous pouvez épeler votre nom de famille ?",
          translation: "Can you spell your last name?",
        },
        {
          speaker: "Thomas",
          text: "Oui. L-E-F-È-V-R-E. Lefèvre.",
          translation: "Yes. L-E-F-È-V-R-E. Lefèvre.",
        },
        {
          speaker: "Réceptionniste",
          text: "Merci. Votre chambre est le numéro douze.",
          translation: "Thank you. Your room is number twelve.",
        },
      ],
      comprehensionQuestions: [
        {
          question: "What does the receptionist ask Thomas to do?",
          options: [
            "Pay for the room",
            "Spell his last name",
            "Show his passport",
            "Choose a room",
          ],
          correctIndex: 1,
        },
        {
          question: "What room number does Thomas get?",
          options: ["10", "11", "12", "14"],
          correctIndex: 2,
        },
      ],
    },

    culture: {
      title: "French Accents Matter!",
      text: "Accents in French aren't decorative — they change meaning! 'Ou' means 'or' but 'où' means 'where.' 'A' is a verb (has) but 'à' is a preposition (at/to). Forgetting an accent is a real spelling mistake in French. The good news? There are clear rules for when to use each accent.",
      image: "/images/culture/accents.svg",
      funFact:
        "📱 The French keyboard layout (AZERTY) makes typing accents easy. The 'é' key is right on the main row — it's one of the most-used keys on French keyboards!",
    },

    summary: {
      keyPoints: [
        "The French alphabet has 26 letters — same as English but pronounced differently",
        "Key differences: G = 'zhay,' J = 'zhee,' R = guttural, U = rounded 'ee'",
        "W = 'double-vé,' Y = 'i-grec,' Z = 'zed'",
        "French uses accents: é (aigu), è (grave), ê (circonflexe), ç (cédille)",
        "Accents change pronunciation AND meaning — they are not optional",
        "'H' is always silent in French words",
      ],
      practicePrompt:
        "Spell your full name using French letter pronunciations. Then spell your city, your street name, and your email address!",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "How is the letter 'G' pronounced in the French alphabet?",
      content: {
        options: ["jee", "gee", "zhay", "gay"],
        correctIndex: 2,
      },
      explanation:
        "The French 'G' is pronounced 'zhay' — with a soft 'zh' sound like the 's' in 'measure.'",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What is the French name for the letter 'W'?",
      content: {
        options: ["double-u", "double-vé", "vé", "wé"],
        correctIndex: 1,
      },
      explanation:
        "In French, 'W' is called 'double-vé' (double V), not 'double U' as in English.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match each accent to its name:",
      content: {
        pairs: [
          { left: "é", right: "accent aigu" },
          { left: "è", right: "accent grave" },
          { left: "ê", right: "accent circonflexe" },
          { left: "ç", right: "cédille" },
        ],
      },
      explanation: "Each accent has a specific name and changes how the letter is pronounced.",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "What accent is on the 'e' in 'café'?",
      content: {
        sentence: "The 'e' in 'café' has an accent _____.",
        answer: "aigu",
        options: ["aigu", "grave", "circonflexe", "cédille"],
        caseSensitive: false,
      },
      explanation: "'Café' has an 'accent aigu' (é), which makes the 'ay' sound.",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What is special about the letter 'H' in French?",
      content: {
        options: [
          "It's pronounced like English 'H'",
          "It's always silent in words",
          "It doesn't exist in French",
          "It's only used in borrowed words",
        ],
        correctIndex: 1,
      },
      explanation:
        "The French 'H' is always silent in words. 'Hôtel' is pronounced 'oh-TEL,' 'homme' is pronounced 'om.'",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "How would you spell 'RIRE' (to laugh) aloud in French?",
      content: {
        options: [
          "air - ee - air - uh",
          "ar - eye - ar - ee",
          "ahr - ee - ahr - eh",
          "air - ee - air - ee",
        ],
        correctIndex: 0,
      },
      explanation:
        "R = 'air,' I = 'ee,' R = 'air,' E = 'uh.' So: air-ee-air-uh.",
      difficulty: "HARD",
      xp_reward: 4,
      order_index: 6,
    },
    {
      exercise_type: "TRANSLATION",
      question: "How do you say 'Can you spell that?' in French?",
      content: {
        correctAnswer: "Vous pouvez épeler ?",
        acceptableAnswers: [
          "Vous pouvez épeler ?",
          "Vous pouvez épeler?",
          "Pouvez-vous épeler ?",
          "Tu peux épeler ?",
        ],
        direction: "to_target",
      },
      explanation: "'Vous pouvez épeler ?' is how you ask someone to spell something in formal French.",
      hint: "'Épeler' means 'to spell.'",
      difficulty: "HARD",
      xp_reward: 5,
      order_index: 7,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the letter to its French pronunciation:",
      content: {
        pairs: [
          { left: "J", right: "zhee" },
          { left: "R", right: "air" },
          { left: "U", right: "ü" },
          { left: "E", right: "uh" },
          { left: "Y", right: "ee-grek" },
        ],
      },
      explanation: "These are the letters whose pronunciation differs most from English.",
      difficulty: "HARD",
      xp_reward: 5,
      order_index: 8,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and select the letter you hear:",
      content: {
        ttsText: "R",
        ttsLang: "fr-FR",
        options: ["A (ah)", "R (air)", "E (uh)", "H (ahsh)"],
        correctIndex: 1,
      },
      explanation: "The French 'R' is pronounced 'air' — a guttural sound from the throat.",
      difficulty: "HARD",
      xp_reward: 5,
      order_index: 9,
    },
  ],
};