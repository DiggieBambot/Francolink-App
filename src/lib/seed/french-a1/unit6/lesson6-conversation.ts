export const frenchA1U6L6 = {
  metadata: {
    course: "fr-a1",
    unit: 6,
    lesson: 6,
    title: "Talking About Your Family",
    slug: "talking-about-family",
    type: "CONVERSATION",
    estimatedMinutes: 15,
    xpReward: 25,
  },

  content: {
    introduction: {
      text: "In this lesson, you'll practice having a full conversation about your family. You'll combine everything you've learned — family vocabulary, possessive adjectives, physical descriptions, and personality traits — into natural dialogue.",
      culturalNote: "🇫🇷 In France, talking about family is a common way to get to know someone. The French love sharing stories about their relatives, especially during meals. However, very personal questions about family finances or problems are considered impolite in casual settings.",
    },

    vocabulary: [
      {
        term: "comment est...?",
        translation: "what is... like?",
        pronunciation: "koh-MAHN eh",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Comment est ta sœur ?",
          translation: "What is your sister like?",
        },
        tip: "Used to ask about personality or appearance. Very common in conversation.",
      },
      {
        term: "il/elle ressemble à",
        translation: "he/she looks like",
        pronunciation: "eel/ell ruh-SAHM-bluh ah",
        partOfSpeech: "expression",
        exampleSentence: {
          original: "Elle ressemble à sa mère.",
          translation: "She looks like her mother.",
        },
        tip: "Use 'à' after 'ressembler' — never 'de' or nothing.",
      },
      {
        term: "l'aîné / l'aînée",
        translation: "the eldest (masculine / feminine)",
        pronunciation: "leh-NAY / leh-NAY",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Mon frère est l'aîné de la famille.",
          translation: "My brother is the eldest in the family.",
        },
        tip: "Feminine form: 'l'aînée'. Very useful when talking about siblings.",
      },
      {
        term: "le cadet / la cadette",
        translation: "the youngest (masculine / feminine)",
        pronunciation: "luh kah-DEH / lah kah-DET",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Je suis la cadette.",
          translation: "I am the youngest.",
        },
        tip: "Used specifically for the youngest sibling, not just 'young' in general.",
      },
      {
        term: "ensemble",
        translation: "together",
        pronunciation: "ahn-SAHM-bluh",
        partOfSpeech: "adverb",
        exampleSentence: {
          original: "Nous habitons ensemble.",
          translation: "We live together.",
        },
        tip: "Very common in family contexts — 'on mange ensemble' (we eat together).",
      },
      {
        term: "s'entendre bien",
        translation: "to get along well",
        pronunciation: "sahn-TAHN-druh byahn",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Je m'entends bien avec ma sœur.",
          translation: "I get along well with my sister.",
        },
        tip: "Reflexive verb — 'je m'entends', 'tu t'entends', 'il s'entend'.",
      },
      {
        term: "un enfant unique",
        translation: "an only child",
        pronunciation: "uhn ahn-FAHN ew-NEEK",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Je suis enfant unique.",
          translation: "I am an only child.",
        },
        tip: "No article needed after 'être': 'Je suis enfant unique' (not 'un enfant unique').",
      },
      {
        term: "une famille nombreuse",
        translation: "a large family",
        pronunciation: "ewn fah-MEE-yuh nohm-BRUHZ",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "J'ai une famille nombreuse.",
          translation: "I have a large family.",
        },
        tip: "'Nombreuse' is the feminine of 'nombreux' — matching 'famille'.",
      },
    ],

    grammar: [
      {
        title: "Asking About People: 'Comment est...?'",
        explanation: "To ask what someone is like (personality or appearance), use 'Comment est + person?' This is one of the most useful conversation starters when talking about family and friends.",
        examples: [
          {
            original: "Comment est ton père ?",
            translation: "What is your father like?",
            breakdown: "Comment (how/what) + est (is) + ton père (your father)",
          },
          {
            original: "Comment sont tes frères ?",
            translation: "What are your brothers like?",
            breakdown: "Comment (how/what) + sont (are) + tes frères (your brothers) — plural form",
          },
        ],
        commonMistakes: [
          "❌ Qu'est-ce que ton père ? (wrong question structure for descriptions)",
          "✅ Comment est ton père ? (correct way to ask about someone's character/appearance)",
        ],
      },
      {
        title: "Describing Family Relationships",
        explanation: "Use 's'entendre bien/mal avec' to describe how family members get along. This reflexive structure is very natural in family conversations.",
        examples: [
          {
            original: "Je m'entends bien avec mon frère.",
            translation: "I get along well with my brother.",
            breakdown: "Je m'entends (I get along) + bien (well) + avec (with) + mon frère",
          },
          {
            original: "Ils s'entendent mal.",
            translation: "They don't get along.",
            breakdown: "Ils s'entendent (they get along) + mal (badly)",
          },
        ],
        commonMistakes: [
          "❌ Je entends bien avec mon frère (missing reflexive pronoun)",
          "✅ Je m'entends bien avec mon frère (correct reflexive form)",
        ],
      },
    ],

    dialogue: {
      title: "Getting to Know Each Other's Families",
      image: "/images/dialogues/family-conversation.svg",
      context: "Camille and Lucas meet at a party and talk about their families.",
      lines: [
        {
          speaker: "lucas",
          text: "Tu as des frères et sœurs, Camille ?",
          translation: "Do you have brothers and sisters, Camille?",
        },
        {
          speaker: "camille",
          text: "Oui, j'ai un grand frère et une petite sœur. Et toi ?",
          translation: "Yes, I have a big brother and a little sister. And you?",
        },
        {
          speaker: "lucas",
          text: "Je suis enfant unique. Comment est ton frère ?",
          translation: "I'm an only child. What's your brother like?",
        },
        {
          speaker: "camille",
          text: "Il est grand et brun. Il est très drôle mais un peu paresseux !",
          translation: "He's tall and brown-haired. He's very funny but a little lazy!",
        },
        {
          speaker: "lucas",
          text: "Et ta petite sœur ?",
          translation: "And your little sister?",
        },
        {
          speaker: "camille",
          text: "Elle est blonde et timide. Elle ressemble à ma mère.",
          translation: "She's blonde and shy. She looks like my mother.",
        },
        {
          speaker: "lucas",
          text: "Vous vous entendez bien ?",
          translation: "Do you get along well?",
        },
        {
          speaker: "camille",
          text: "Oui, très bien ! On mange ensemble tous les dimanches.",
          translation: "Yes, very well! We eat together every Sunday.",
        },
      ],
      comprehensionQuestions: [
        {
          question: "How many siblings does Camille have?",
          options: ["None", "One brother", "One brother and one sister", "Two sisters"],
          correctIndex: 2,
        },
        {
          question: "Who does Camille's little sister look like?",
          options: ["Her father", "Her brother", "Her mother", "Camille"],
          correctIndex: 2,
        },
      ],
    },

    culture: {
      title: "Family Conversations in France",
      text: "Talking about family is one of the easiest ways to connect with French people. At social gatherings, it's common to ask about someone's family after initial introductions. The French often share funny stories about their relatives, especially their children. However, there's an unwritten rule: avoid asking about divorce, family conflicts, or money. These topics are considered very private until you know someone well.",
      funFact: "🎉 The French expression 'C'est de famille' (It runs in the family) is used when someone shares a trait with their relatives — whether it's being tall, funny, or stubborn!",
    },

    summary: {
      keyPoints: [
        "'Comment est...?' to ask what someone is like",
        "'Ressembler à' to say someone looks like someone else",
        "'S'entendre bien/mal avec' for relationships",
        "L'aîné(e) = eldest, le cadet / la cadette = youngest",
        "Enfant unique = only child",
        "Combine physical + personality descriptions for natural conversation",
      ],
      practicePrompt: "Have an imaginary conversation about your family. Answer these questions in French: Tu as des frères et sœurs ? Comment est ta mère ? Vous vous entendez bien ?",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "How do you ask 'What is your brother like?' in French?",
      content: {
        options: [
          "Où est ton frère ?",
          "Comment est ton frère ?",
          "Qui est ton frère ?",
          "Quand est ton frère ?",
        ],
        correctIndex: 1,
      },
      hint: "Use 'Comment est...?' for descriptions",
      explanation: "'Comment est ton frère ?' means 'What is your brother like?' — asking about personality or appearance.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What does 'Je suis enfant unique' mean?",
      content: {
        options: [
          "I have a unique child",
          "I am an only child",
          "I am a special child",
          "I have one child",
        ],
        correctIndex: 1,
      },
      hint: "'Enfant unique' is a fixed expression",
      explanation: "'Je suis enfant unique' means 'I am an only child'. No article is needed after 'être' here.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the French expressions with their meanings:",
      content: {
        pairs: [
          { left: "l'aîné", right: "the eldest" },
          { left: "la cadette", right: "the youngest (f)" },
          { left: "ensemble", right: "together" },
          { left: "ressembler à", right: "to look like" },
        ],
      },
      hint: "Think about family roles and relationships",
      explanation: "L'aîné = eldest, la cadette = youngest (feminine), ensemble = together, ressembler à = to look like.",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete the sentence:",
      content: {
        sentence: "Elle ___ à sa mère.",
        answer: "ressemble",
        options: ["ressemble", "ressembles", "ressemblent", "ressembler"],
        caseSensitive: false,
      },
      hint: "'Elle' takes the third person singular form",
      explanation: "'Elle ressemble à sa mère' means 'She looks like her mother'. Third person singular: ressemble.",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete the sentence:",
      content: {
        sentence: "Je m'entends ___ avec mon frère.",
        answer: "bien",
        options: ["bien", "bon", "mal", "beau"],
        caseSensitive: false,
      },
      hint: "The opposite would be 'mal'",
      explanation: "'Je m'entends bien avec mon frère' means 'I get along well with my brother'.",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'She looks like her father.'",
      content: {
        correctAnswer: "Elle ressemble à son père.",
        acceptableAnswers: ["Elle ressemble à son père", "elle ressemble à son père"],
        direction: "to_target",
      },
      hint: "Use 'ressembler à' and remember 'père' is masculine so use 'son'",
      explanation: "'Elle ressemble à son père.' — 'son' because 'père' is masculine, regardless of 'elle'.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 6,
    },
    {
      exercise_type: "REORDER",
      question: "Put the words in order:",
      content: {
        words: ["bien", "m'entends", "sœur", "avec", "je", "ma"],
        correctOrder: ["je", "m'entends", "bien", "avec", "ma", "sœur"],
        translation: "I get along well with my sister",
      },
      hint: "Start with 'je' then the reflexive verb",
      explanation: "Correct order: Je m'entends bien avec ma sœur. (I get along well with my sister.)",
      difficulty: "HARD",
      xp_reward: 4,
      order_index: 7,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and select the correct answer:",
      content: {
        ttsText: "Mon frère est l'aîné de la famille. Il est grand et sérieux.",
        ttsLang: "fr-FR",
        options: [
          "My brother is the eldest. He is tall and serious.",
          "My brother is the youngest. He is short and funny.",
          "My sister is the eldest. She is tall and serious.",
          "My brother is the eldest. He is small and shy.",
        ],
        correctIndex: 0,
      },
      hint: "Listen for 'l'aîné', 'grand', and 'sérieux'",
      explanation: "'Mon frère est l'aîné... grand et sérieux' = My brother is the eldest... tall and serious.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 8,
    },
    {
      exercise_type: "SPEAK",
      question: "Say this sentence out loud:",
      content: {
        targetText: "Comment est ton frère ?",
        targetTranslation: "What is your brother like?",
        acceptableVariants: ["comment est ton frère"],
      },
      hint: "This is a question — your voice should rise at the end",
      explanation: "Great! 'Comment est ton frère ?' is the natural way to ask about someone's character.",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 9,
    },
    {
      exercise_type: "SPEAK",
      question: "Say this sentence out loud:",
      content: {
        targetText: "Je m'entends bien avec ma famille.",
        targetTranslation: "I get along well with my family.",
        acceptableVariants: ["je m'entends bien avec ma famille"],
      },
      hint: "Take it slowly: je m'entends... bien... avec ma famille",
      explanation: "Excellent! You used the reflexive verb 's'entendre' correctly in a natural sentence.",
      difficulty: "HARD",
      xp_reward: 5,
      order_index: 10,
    },
  ],
};
