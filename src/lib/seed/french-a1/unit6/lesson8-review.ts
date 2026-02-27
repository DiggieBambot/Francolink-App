export const frenchA1U6L8 = {
  metadata: {
    course: "fr-a1",
    unit: 6,
    lesson: 8,
    title: "Unit 6 Review: People & Relationships",
    slug: "unit-6-review",
    type: "REVIEW",
    estimatedMinutes: 15,
    xpReward: 30,
  },

  content: {
    introduction: {
      text: "Welcome to the Unit 6 review! In this lesson, you'll consolidate everything you've learned about family members, possessive adjectives, physical descriptions, adjective agreement, personality traits, and family culture. Let's make sure you can describe the people in your life with confidence!",
      culturalNote: "🇫🇷 By now you can describe people like a French speaker! Remember that in France, describing someone fully — their appearance, personality, and family role — is a natural part of conversation.",
    },

    vocabulary: [
      {
        term: "la famille",
        translation: "the family",
        pronunciation: "lah fah-MEE-yuh",
        partOfSpeech: "noun",
        gender: "feminine",
        exampleSentence: {
          original: "Ma famille est grande et sympa.",
          translation: "My family is big and nice.",
        },
        tip: "Review: feminine noun — use 'ma' not 'mon'.",
      },
      {
        term: "mon / ma / mes",
        translation: "my (masc. / fem. / plural)",
        pronunciation: "mohn / mah / may",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Mon père, ma mère et mes frères sont ici.",
          translation: "My father, my mother and my brothers are here.",
        },
        tip: "Review: possessives agree with the NOUN, not the speaker.",
      },
      {
        term: "grand / grande",
        translation: "tall (masc. / fem.)",
        pronunciation: "grahn / grahnd",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Mon père est grand. Ma mère est grande aussi.",
          translation: "My father is tall. My mother is tall too.",
        },
        tip: "Review: add 'e' for feminine agreement.",
      },
      {
        term: "les cheveux",
        translation: "the hair",
        pronunciation: "lay shuh-VUH",
        partOfSpeech: "noun",
        gender: "masculine",
        exampleSentence: {
          original: "Elle a les cheveux longs et bruns.",
          translation: "She has long brown hair.",
        },
        tip: "Review: use 'avoir' for hair, not 'être'.",
      },
      {
        term: "gentil / gentille",
        translation: "kind (masc. / fem.)",
        pronunciation: "zhahn-TEE / zhahn-TEE-yuh",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Mon frère est gentil et ma sœur est gentille.",
          translation: "My brother is kind and my sister is kind.",
        },
        tip: "Review: irregular feminine — 'gentil' → 'gentille'.",
      },
      {
        term: "sérieux / sérieuse",
        translation: "serious (masc. / fem.)",
        pronunciation: "say-RYUH / say-RYUHZ",
        partOfSpeech: "adjective",
        exampleSentence: {
          original: "Son père est sérieux mais sa mère est drôle.",
          translation: "His father is serious but his mother is funny.",
        },
        tip: "Review: -eux → -euse for feminine.",
      },
      {
        term: "ressembler à",
        translation: "to look like",
        pronunciation: "ruh-SAHM-blay ah",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "Je ressemble à mon père.",
          translation: "I look like my father.",
        },
        tip: "Review: always use 'à' after 'ressembler'.",
      },
      {
        term: "s'entendre bien avec",
        translation: "to get along well with",
        pronunciation: "sahn-TAHN-druh byahn ah-VEK",
        partOfSpeech: "verb",
        exampleSentence: {
          original: "On s'entend bien avec nos voisins.",
          translation: "We get along well with our neighbors.",
        },
        tip: "Review: reflexive verb — je m'entends, tu t'entends, il s'entend.",
      },
    ],

    grammar: [
      {
        title: "Review: Possessive Adjectives",
        explanation: "Remember: French possessives agree with the NOUN (the thing possessed), not the owner. Mon/ton/son (masculine), ma/ta/sa (feminine), mes/tes/ses (plural). Before a vowel, always use mon/ton/son even for feminine nouns.",
        examples: [
          {
            original: "Mon père, ma mère, mes parents.",
            translation: "My father, my mother, my parents.",
            breakdown: "Mon (masc.) + père | Ma (fem.) + mère | Mes (plural) + parents",
          },
          {
            original: "Son amie est française.",
            translation: "His/Her friend is French.",
            breakdown: "Son (not 'sa') + amie — use 'son' before vowels even for feminine nouns",
          },
        ],
        commonMistakes: [
          "❌ Sa amie est gentille (wrong — use 'son' before vowels)",
          "✅ Son amie est gentille (correct)",
          "❌ Marie aime sa père (wrong — père is masculine)",
          "✅ Marie aime son père (correct — possessive matches masculine 'père')",
        ],
      },
      {
        title: "Review: 'être' vs 'avoir' for Descriptions",
        explanation: "Use 'être' for general qualities (height, build, personality) and 'avoir' for specific physical features (hair, eyes). This is a key distinction that must become automatic.",
        examples: [
          {
            original: "Il est grand, mince et gentil.",
            translation: "He is tall, slim, and kind.",
            breakdown: "être for height (grand), build (mince), personality (gentil)",
          },
          {
            original: "Il a les cheveux noirs et les yeux marron.",
            translation: "He has black hair and brown eyes.",
            breakdown: "avoir for hair (cheveux) and eyes (yeux)",
          },
        ],
        commonMistakes: [
          "❌ Elle est les cheveux blonds (wrong — use 'avoir' for hair)",
          "✅ Elle a les cheveux blonds (correct)",
          "❌ Il a grand (wrong — use 'être' for height)",
          "✅ Il est grand (correct)",
        ],
      },
    ],

    dialogue: {
      title: "Describing the Whole Family",
      image: "/images/dialogues/whole-family.svg",
      context: "Sophie describes her entire family to her new colleague Nicolas.",
      lines: [
        {
          speaker: "nicolas",
          text: "Parle-moi de ta famille, Sophie.",
          translation: "Tell me about your family, Sophie.",
        },
        {
          speaker: "sophie",
          text: "J'ai une famille nombreuse ! Mon père est grand et sérieux. Il a les cheveux gris.",
          translation: "I have a big family! My father is tall and serious. He has grey hair.",
        },
        {
          speaker: "nicolas",
          text: "Et ta mère ?",
          translation: "And your mother?",
        },
        {
          speaker: "sophie",
          text: "Ma mère est petite et très bavarde. Elle a les yeux bleus. Je lui ressemble.",
          translation: "My mother is short and very talkative. She has blue eyes. I look like her.",
        },
        {
          speaker: "nicolas",
          text: "Tu as des frères et sœurs ?",
          translation: "Do you have brothers and sisters?",
        },
        {
          speaker: "sophie",
          text: "Oui, mon frère est l'aîné. Il est brun et courageux. Ma sœur est la cadette. Elle est blonde et timide.",
          translation: "Yes, my brother is the eldest. He's brown-haired and brave. My sister is the youngest. She's blonde and shy.",
        },
        {
          speaker: "nicolas",
          text: "Vous vous entendez bien ?",
          translation: "Do you all get along?",
        },
        {
          speaker: "sophie",
          text: "Oui, très bien ! Le dimanche, on fait un repas de famille ensemble. C'est toujours sympa.",
          translation: "Yes, very well! On Sundays, we have a family meal together. It's always nice.",
        },
      ],
      comprehensionQuestions: [
        {
          question: "What does Sophie's mother look like?",
          options: ["Tall with brown eyes", "Short with blue eyes", "Tall with green eyes", "Short with brown eyes"],
          correctIndex: 1,
        },
        {
          question: "What do they do on Sundays?",
          options: ["Go to church", "Have a family meal", "Visit grandma", "Go shopping"],
          correctIndex: 1,
        },
      ],
    },

    culture: {
      title: "Unit 6 Cultural Summary",
      text: "Throughout this unit, you've learned that French family life revolves around connection, tradition, and shared meals. From the weekly Sunday lunch to holiday celebrations like Noël and la Chandeleur, families make time to be together. Grandparents play a vital role, often helping with childcare and hosting family gatherings. Describing family members — both physically and by personality — is a fundamental social skill in France.",
      funFact: "🎉 A French proverb says: 'Les chiens ne font pas des chats' (Dogs don't make cats) — meaning children resemble their parents! It's the French equivalent of 'The apple doesn't fall far from the tree.'",
    },

    summary: {
      keyPoints: [
        "Family vocabulary: père, mère, frère, sœur, fils, fille, grands-parents",
        "Possessive adjectives: mon/ma/mes, ton/ta/tes, son/sa/ses",
        "'Être' for height, build, personality — 'Avoir' for hair and eyes",
        "Adjective agreement: add 'e' (fem.), 's' (plural), 'es' (fem. plural)",
        "-eux → -euse pattern: sérieux → sérieuse",
        "BANGS adjectives go before the noun: beau, petit, nouveau, vieux",
        "Family expressions: ressembler à, s'entendre bien, enfant unique",
        "'On' = informal 'we' with il/elle verb forms",
      ],
      practicePrompt: "Write a full description of your family in French. Include: how many people, what they look like, their personalities, and what you do together. Try to use possessives, 'être', 'avoir', and adjective agreement correctly!",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "Which sentence correctly uses 'avoir' for a description?",
      content: {
        options: [
          "Elle est les cheveux blonds",
          "Elle a les cheveux blonds",
          "Elle fait les cheveux blonds",
          "Elle va les cheveux blonds",
        ],
        correctIndex: 1,
      },
      hint: "Use 'avoir' for specific features like hair",
      explanation: "'Elle a les cheveux blonds' — always use 'avoir' for hair and eye descriptions.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "What is the correct possessive in: '___ amie est gentille' (His/Her friend is kind)?",
      content: {
        options: ["Sa", "Son", "Ses", "Ma"],
        correctIndex: 1,
      },
      hint: "'Amie' starts with a vowel — which rule applies?",
      explanation: "'Son amie' — use 'son' before vowels even when the noun is feminine.",
      difficulty: "MEDIUM",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match the descriptions with the correct verb:",
      content: {
        pairs: [
          { left: "___ grand (tall)", right: "Il est" },
          { left: "___ les yeux bleus", right: "Il a" },
          { left: "___ gentille (kind)", right: "Elle est" },
          { left: "___ les cheveux longs", right: "Elle a" },
        ],
      },
      hint: "'Être' for qualities, 'avoir' for features",
      explanation: "Être for height/personality, avoir for hair/eyes. This is a fundamental French pattern.",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete the sentence:",
      content: {
        sentence: "Ma sœur est petite et ___.",
        answer: "courageuse",
        options: ["courageux", "courageuse", "courageuxe", "courage"],
        caseSensitive: false,
      },
      hint: "'Sœur' is feminine — the adjective must agree",
      explanation: "'Courageuse' is the feminine of 'courageux'. -eux → -euse for feminine agreement.",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete the sentence:",
      content: {
        sentence: "Mon frère ___ à mon père.",
        answer: "ressemble",
        options: ["ressemble", "ressembles", "ressemblent", "ressembler"],
        caseSensitive: false,
      },
      hint: "'Mon frère' is third person singular — il form",
      explanation: "'Mon frère ressemble à mon père' = My brother looks like my father. Third person: ressemble.",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'My mother is short but very brave.'",
      content: {
        correctAnswer: "Ma mère est petite mais très courageuse.",
        acceptableAnswers: [
          "Ma mère est petite mais très courageuse",
          "ma mère est petite mais très courageuse",
        ],
        direction: "to_target",
      },
      hint: "Both adjectives need feminine agreement — 'petite' and 'courageuse'",
      explanation: "'Ma mère est petite mais très courageuse.' — all adjectives agree with feminine 'mère'.",
      difficulty: "HARD",
      xp_reward: 4,
      order_index: 6,
    },
    {
      exercise_type: "REORDER",
      question: "Put the words in order:",
      content: {
        words: ["bruns", "les", "a", "cheveux", "il", "et", "courts"],
        correctOrder: ["il", "a", "les", "cheveux", "bruns", "et", "courts"],
        translation: "He has brown and short hair",
      },
      hint: "Start with the subject, then 'avoir', then the feature with adjectives",
      explanation: "Correct order: Il a les cheveux bruns et courts. (He has brown and short hair.)",
      difficulty: "HARD",
      xp_reward: 4,
      order_index: 7,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and select the correct answer:",
      content: {
        ttsText: "Ma sœur est grande et blonde. Elle est très gentille et un peu timide.",
        ttsLang: "fr-FR",
        options: [
          "My sister is tall and blonde. She is very kind and a little shy.",
          "My brother is tall and blond. He is very kind and a little shy.",
          "My sister is short and brown-haired. She is funny and talkative.",
          "My sister is tall and blonde. She is serious and brave.",
        ],
        correctIndex: 0,
      },
      hint: "Listen for 'sœur', 'grande', 'blonde', 'gentille', 'timide'",
      explanation: "A complete physical and personality description combining 'être' with multiple feminine adjectives.",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 8,
    },
    {
      exercise_type: "SPEAK",
      question: "Say this sentence out loud:",
      content: {
        targetText: "Mon père est grand et sérieux. Il a les cheveux gris.",
        targetTranslation: "My father is tall and serious. He has grey hair.",
        acceptableVariants: ["mon père est grand et sérieux il a les cheveux gris"],
      },
      hint: "Two sentences: first 'être' for build/personality, then 'avoir' for hair",
      explanation: "Great! You combined 'être' and 'avoir' descriptions naturally.",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 9,
    },
    {
      exercise_type: "SPEAK",
      question: "Say this sentence out loud:",
      content: {
        targetText: "Je m'entends bien avec ma famille. On mange ensemble le dimanche.",
        targetTranslation: "I get along well with my family. We eat together on Sundays.",
        acceptableVariants: ["je m'entends bien avec ma famille on mange ensemble le dimanche"],
      },
      hint: "Two sentences: reflexive verb first, then 'on' + activity",
      explanation: "Excellent! You used a reflexive verb and 'on' for family activities — perfect review!",
      difficulty: "HARD",
      xp_reward: 5,
      order_index: 10,
    },
  ],
};
