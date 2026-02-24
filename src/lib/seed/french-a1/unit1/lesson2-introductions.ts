// Course: French A1
// Unit: 1 - First Steps
// Lesson: 2 - Introducing Yourself

export const frenchA1U1L2 = {
  metadata: {
    course: "fr-a1",
    unit: 1,
    lesson: 2,
    title: "Introducing Yourself",
    slug: "introducing-yourself",
    type: "VOCABULARY",
    estimatedMinutes: 15,
    xpReward: 20,
  },
  content: {
    introduction: {
      text: "Now that you can say hello, it's time to introduce yourself! In this lesson you'll learn how to say your name, ask someone else's name, and use the essential verb 'être' (to be). These are the building blocks for every French conversation.",
      image: "/images/lessons/introductions.svg",
      culturalNote:
        "🇫🇷 The French typically shake hands in professional settings. Among friends, they use 'la bise' (cheek kisses). First names are used only after being invited to — otherwise, stick to 'Monsieur' or 'Madame.'",
    },

    vocabulary: [
      {
        term: "Je m'appelle",
        translation: "My name is (I call myself)",
        pronunciation: "zhuh mah-PEL",
        partOfSpeech: "phrase",
        audio: "/audio/fr/je-mappelle.mp3",
        exampleSentence: {
          original: "Je m'appelle Marie.",
          translation: "My name is Marie.",
        },
        tip: "Literally means 'I call myself.' The verb is 's'appeler' (to call oneself).",
      },
      {
        term: "Comment vous appelez-vous ?",
        translation: "What is your name? (formal)",
        pronunciation: "koh-MAHN vooz ah-play VOO",
        partOfSpeech: "phrase",
        audio: "/audio/fr/comment-vous-appelez-vous.mp3",
        exampleSentence: {
          original: "Bonjour ! Comment vous appelez-vous ?",
          translation: "Hello! What is your name?",
        },
        tip: "Formal version — use with strangers and in professional settings.",
      },
      {
        term: "Tu t'appelles comment ?",
        translation: "What's your name? (informal)",
        pronunciation: "tü tah-PEL koh-MAHN",
        partOfSpeech: "phrase",
        audio: "/audio/fr/tu-tappelles-comment.mp3",
        exampleSentence: {
          original: "Salut ! Tu t'appelles comment ?",
          translation: "Hi! What's your name?",
        },
        tip: "Informal version — use with peers and in casual settings.",
      },
      {
        term: "Enchanté(e)",
        translation: "Nice to meet you",
        pronunciation: "ahn-shahn-TAY",
        partOfSpeech: "adjective",
        gender: "masculine",
        audio: "/audio/fr/enchante.mp3",
        exampleSentence: {
          original: "Enchanté, je suis Pierre.",
          translation: "Nice to meet you, I'm Pierre.",
        },
        tip: "Add an 'e' at the end (enchantée) if you're female — it sounds the same!",
      },
      {
        term: "Je suis",
        translation: "I am",
        pronunciation: "zhuh SWEE",
        partOfSpeech: "phrase",
        audio: "/audio/fr/je-suis.mp3",
        exampleSentence: {
          original: "Je suis français.",
          translation: "I am French.",
        },
        tip: "'Je' = I, 'suis' = am. This is the verb 'être' (to be) with 'je.'",
      },
      {
        term: "Monsieur",
        translation: "Sir / Mr.",
        pronunciation: "muh-SYUH",
        partOfSpeech: "noun",
        gender: "masculine",
        audio: "/audio/fr/monsieur.mp3",
        exampleSentence: {
          original: "Bonjour, monsieur.",
          translation: "Hello, sir.",
        },
        tip: "Abbreviated as 'M.' in writing. Used widely — even the waiter at a café will address you this way.",
      },
      {
        term: "Madame",
        translation: "Ma'am / Mrs. / Ms.",
        pronunciation: "mah-DAHM",
        partOfSpeech: "noun",
        gender: "feminine",
        audio: "/audio/fr/madame.mp3",
        exampleSentence: {
          original: "Bonsoir, madame.",
          translation: "Good evening, ma'am.",
        },
        tip: "Abbreviated as 'Mme.' 'Mademoiselle' (Miss) is outdated — use 'Madame' for all women.",
      },
      {
        term: "Comment allez-vous ?",
        translation: "How are you? (formal)",
        pronunciation: "koh-MAHN tah-lay VOO",
        partOfSpeech: "phrase",
        audio: "/audio/fr/comment-allez-vous.mp3",
        exampleSentence: {
          original: "Bonjour madame, comment allez-vous ?",
          translation: "Hello ma'am, how are you?",
        },
        tip: "The formal 'how are you.' For informal, use 'Ça va ?' or 'Comment vas-tu ?'",
      },
      {
        term: "Très bien",
        translation: "Very well",
        pronunciation: "treh BYEHN",
        partOfSpeech: "phrase",
        audio: "/audio/fr/tres-bien.mp3",
        exampleSentence: {
          original: "Je vais très bien, merci.",
          translation: "I'm doing very well, thank you.",
        },
        tip: "'Très' means 'very.' You can also just say 'Bien, merci' (Well, thanks).",
      },
    ],

    grammar: [
      {
        title: "The Verb 'Être' (To Be) — Introduction",
        explanation:
          "'Être' is one of the most important French verbs. At this stage, focus on the first-person form 'je suis' (I am). You'll learn the full conjugation soon. 'Être' is used to state your name, nationality, profession, and feelings.",
        examples: [
          {
            original: "Je suis Marie.",
            translation: "I am Marie.",
            breakdown: "Je (I) + suis (am) + Marie (name)",
          },
          {
            original: "Je suis étudiant.",
            translation: "I am a student (male).",
            breakdown:
              "Je (I) + suis (am) + étudiant (student). Note: no article ('a') needed!",
          },
          {
            original: "Je suis française.",
            translation: "I am French (female).",
            breakdown:
              "Je (I) + suis (am) + française (French, feminine form)",
          },
        ],
        commonMistakes: [
          "❌ 'Je suis un étudiant' — In French you typically drop the article before professions/nationalities after 'être.'",
          "✅ 'Je suis étudiant.' — No 'un/une' needed.",
          "❌ 'Je suis Marie' does NOT mean 'I follow Marie' here — 'suis' from 'être' (to be) and 'suivre' (to follow) look the same in the 'je' form.",
        ],
      },
      {
        title: "Asking Someone's Name",
        explanation:
          "There are two main ways to ask someone's name in French — formal and informal. Always start with the formal version when meeting someone for the first time.",
        examples: [
          {
            original: "Comment vous appelez-vous ?",
            translation: "What is your name? (formal)",
            breakdown:
              "Comment (how/what) + vous appelez-vous (do you call yourself — formal)",
          },
          {
            original: "Tu t'appelles comment ?",
            translation: "What's your name? (informal)",
            breakdown:
              "Tu (you, informal) + t'appelles (call yourself) + comment (how/what)",
          },
        ],
        table: {
          headers: ["Register", "Question", "Answer"],
          rows: [
            [
              "Formal",
              "Comment vous appelez-vous ?",
              "Je m'appelle [name].",
            ],
            ["Informal", "Tu t'appelles comment ?", "Je m'appelle [name]."],
            ["Alternative", "C'est quoi ton prénom ?", "Mon prénom, c'est [name]."],
          ],
        },
        commonMistakes: [
          "❌ 'Comment tu appelles ?' — Don't forget the reflexive pronoun 't'' !",
          "✅ 'Comment tu t'appelles ?' or 'Tu t'appelles comment ?'",
        ],
      },
    ],

    dialogue: {
      title: "Meeting at a Conference",
      context:
        "Pierre and Anne meet for the first time at a professional conference in Lyon.",
      image: "/images/dialogues/conference.svg",
      lines: [
        {
          speaker: "Pierre",
          text: "Bonjour, madame. Je suis Pierre Dupont.",
          translation: "Hello, ma'am. I am Pierre Dupont.",
        },
        {
          speaker: "Anne",
          text: "Bonjour, monsieur. Je m'appelle Anne Martin. Enchantée !",
          translation:
            "Hello, sir. My name is Anne Martin. Nice to meet you!",
        },
        {
          speaker: "Pierre",
          text: "Enchanté ! Comment allez-vous ?",
          translation: "Nice to meet you! How are you?",
        },
        {
          speaker: "Anne",
          text: "Très bien, merci. Et vous ?",
          translation: "Very well, thank you. And you?",
        },
        {
          speaker: "Pierre",
          text: "Très bien aussi, merci.",
          translation: "Very well too, thank you.",
        },
      ],
      comprehensionQuestions: [
        {
          question: "What is Pierre's last name?",
          options: ["Martin", "Dupont", "Bernard", "Moreau"],
          correctIndex: 1,
        },
        {
          question: "Is this conversation formal or informal?",
          options: [
            "Informal — they use 'tu'",
            "Formal — they use 'vous' and titles",
            "Slang",
            "A mix of both",
          ],
          correctIndex: 1,
        },
      ],
    },

    culture: {
      title: "The Importance of 'Vous' and 'Tu'",
      text: "In French, there are two words for 'you': 'tu' (informal, singular) and 'vous' (formal, or plural). Using 'tu' with someone you just met can seem presumptuous. The French even have a verb for switching from 'vous' to 'tu': 'tutoyer.' Someone might say 'On peut se tutoyer ?' meaning 'Can we use tu with each other?'",
      image: "/images/culture/tu-vs-vous.svg",
      funFact:
        "💡 In many French workplaces, colleagues who've worked together for years still use 'vous' with each other!",
    },

    summary: {
      keyPoints: [
        "'Je m'appelle...' is how you say your name (literally: 'I call myself...')",
        "'Enchanté(e)' means 'Nice to meet you'",
        "'Je suis' means 'I am' — use it for name, nationality, profession",
        "Use 'vous' (formal) with strangers; 'tu' (informal) with friends",
        "'Monsieur' (sir) and 'Madame' (ma'am) are used frequently",
        "No article needed before professions after 'être': 'Je suis étudiant' ✅",
      ],
      practicePrompt:
        "Introduce yourself in French 5 times today: 'Bonjour, je m'appelle [your name]. Enchanté(e) !' Say it aloud each time!",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "How do you say 'My name is Marie' in French?",
      content: {
        options: [
          "Je suis Marie.",
          "Je m'appelle Marie.",
          "Marie m'appelle.",
          "Mon nom Marie.",
        ],
        correctIndex: 1,
      },
      explanation:
        "'Je m'appelle Marie' literally means 'I call myself Marie.' Both 'Je m'appelle' and 'Je suis' can be used to give your name.",
      hint: "Which phrase literally means 'I call myself'?",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "Which is the FORMAL way to ask someone's name?",
      content: {
        options: [
          "Tu t'appelles comment ?",
          "Comment vous appelez-vous ?",
          "C'est quoi ton prénom ?",
          "Salut, t'es qui ?",
        ],
        correctIndex: 1,
      },
      explanation:
        "'Comment vous appelez-vous ?' uses 'vous' (the formal you), making it appropriate for strangers, elders, and professional settings.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete the introduction:",
      content: {
        sentence: "Bonjour, je _____ Pierre.",
        answer: "m'appelle",
        options: ["m'appelle", "appelle", "suis appelle", "mon nom"],
        caseSensitive: false,
      },
      explanation:
        "'Je m'appelle' is the reflexive form of 's'appeler' (to call oneself). The full phrase is 'Je m'appelle Pierre.'",
      hint: "This reflexive verb means 'to call oneself.'",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete the response:",
      content: {
        sentence: "Comment allez-vous ? — _____ bien, merci.",
        answer: "Très",
        options: ["Très", "Beaucoup", "Bon", "Oui"],
        caseSensitive: false,
      },
      explanation:
        "'Très bien, merci' means 'Very well, thank you.' 'Très' means 'very.'",
      hint: "Which word means 'very'?",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the French to the English:",
      content: {
        pairs: [
          { left: "Je m'appelle", right: "My name is" },
          { left: "Enchanté", right: "Nice to meet you" },
          { left: "Comment allez-vous ?", right: "How are you? (formal)" },
          { left: "Très bien", right: "Very well" },
          { left: "Monsieur", right: "Sir / Mr." },
        ],
      },
      explanation:
        "These are the core introduction phrases. Practice them together as a mini-script!",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 5,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'Nice to meet you!'",
      content: {
        correctAnswer: "Enchanté !",
        acceptableAnswers: [
          "Enchanté !",
          "Enchanté!",
          "Enchanté",
          "Enchantée !",
          "Enchantée!",
          "Enchantée",
        ],
        direction: "to_target",
      },
      explanation:
        "'Enchanté' (male speaker) or 'Enchantée' (female speaker) means 'Nice to meet you' — literally 'enchanted.'",
      hint: "This word literally means 'enchanted.'",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 6,
    },
    {
      exercise_type: "REORDER",
      question: "Arrange the words to form a correct question:",
      content: {
        words: ["appelez-vous", "Comment", "vous", "?"],
        correctOrder: ["Comment", "vous", "appelez-vous", "?"],
        translation: "What is your name?",
      },
      explanation:
        "The formal structure is: Comment + vous + appelez-vous ? Word order matters in formal French questions.",
      difficulty: "HARD",
      xp_reward: 5,
      order_index: 7,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "'Je suis étudiant.' Why is there no 'un' (a) before 'étudiant'?",
      content: {
        options: [
          "It's a grammar mistake — you should say 'un étudiant'",
          "In French, articles are dropped before professions/nationalities after 'être'",
          "'Étudiant' is an adjective, not a noun",
          "You only need 'un' with feminine nouns",
        ],
        correctIndex: 1,
      },
      explanation:
        "In French, when stating your profession or nationality with 'être,' you typically omit the article: 'Je suis étudiant' (not 'Je suis un étudiant').",
      difficulty: "HARD",
      xp_reward: 4,
      order_index: 8,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and select what you hear:",
      content: {
        ttsText: "Enchanté, je m'appelle Pierre.",
        ttsLang: "fr-FR",
        options: [
          "Enchanté, je m'appelle Pierre.",
          "Bonjour, je suis Pierre.",
          "Enchanté, je suis français.",
          "Enchanté, comment allez-vous ?",
        ],
        correctIndex: 0,
      },
      explanation:
        "The speaker says 'Enchanté, je m'appelle Pierre' — 'Nice to meet you, my name is Pierre.'",
      difficulty: "HARD",
      xp_reward: 5,
      order_index: 9,
    },
  ],
};