// Course: French A1
// Unit: 1 - First Steps
// Lesson: 1 - Greetings & Hello

export const frenchA1U1L1 = {
  metadata: {
    course: "fr-a1",
    unit: 1,
    lesson: 1,
    title: "Greetings & Hello",
    slug: "greetings-hello",
    type: "VOCABULARY",
    estimatedMinutes: 15,
    xpReward: 20,
  },
  content: {
    introduction: {
      text: "Welcome to your very first French lesson! Greetings are the foundation of every conversation. In France, politeness is extremely important — people greet each other formally and often. By the end of this lesson you'll be able to say hello, goodbye, and exchange basic pleasantries like a true Parisian.",
      image: "/images/lessons/greetings.svg",
      culturalNote:
        "🇫🇷 In France, it's customary to greet shopkeepers when you enter a store with 'Bonjour!' and say 'Au revoir!' when you leave — even if you don't buy anything!",
    },

    vocabulary: [
      {
        term: "Bonjour",
        translation: "Hello / Good morning",
        pronunciation: "bohn-ZHOOR",
        partOfSpeech: "phrase",
        image: "/images/vocab/hello.svg",
        audio: "/audio/fr/bonjour.mp3",
        exampleSentence: {
          original: "Bonjour, comment allez-vous ?",
          translation: "Hello, how are you?",
        },
        tip: "This is your all-purpose daytime greeting. Use it from morning until about 6 PM.",
      },
      {
        term: "Bonsoir",
        translation: "Good evening",
        pronunciation: "bohn-SWAHR",
        partOfSpeech: "phrase",
        image: "/images/vocab/evening.svg",
        audio: "/audio/fr/bonsoir.mp3",
        exampleSentence: {
          original: "Bonsoir, madame.",
          translation: "Good evening, ma'am.",
        },
        tip: "'Bon' = good, 'soir' = evening. Use it after about 6 PM.",
      },
      {
        term: "Salut",
        translation: "Hi / Bye (informal)",
        pronunciation: "sah-LÜ",
        partOfSpeech: "phrase",
        image: "/images/vocab/hi.svg",
        audio: "/audio/fr/salut.mp3",
        exampleSentence: {
          original: "Salut, ça va ?",
          translation: "Hi, how's it going?",
        },
        tip: "Casual greeting — use with friends and people your age, never in formal settings.",
      },
      {
        term: "Au revoir",
        translation: "Goodbye",
        pronunciation: "oh ruh-VWAHR",
        partOfSpeech: "phrase",
        image: "/images/vocab/goodbye.svg",
        audio: "/audio/fr/au-revoir.mp3",
        exampleSentence: {
          original: "Au revoir et bonne journée !",
          translation: "Goodbye and have a nice day!",
        },
        tip: "Literally means 'until we see each other again.' Polite and works everywhere.",
      },
      {
        term: "Merci",
        translation: "Thank you",
        pronunciation: "mehr-SEE",
        partOfSpeech: "phrase",
        image: "/images/vocab/thanks.svg",
        audio: "/audio/fr/merci.mp3",
        exampleSentence: {
          original: "Merci beaucoup !",
          translation: "Thank you very much!",
        },
        tip: "Add 'beaucoup' (boh-KOO) after it to say 'thank you very much.'",
      },
      {
        term: "S'il vous plaît",
        translation: "Please (formal)",
        pronunciation: "seel voo PLEH",
        partOfSpeech: "phrase",
        image: "/images/vocab/please.svg",
        audio: "/audio/fr/sil-vous-plait.mp3",
        exampleSentence: {
          original: "Un café, s'il vous plaît.",
          translation: "A coffee, please.",
        },
        tip: "Use 's'il te plaît' (seel tuh PLEH) with friends. 'Vous' = formal, 'te' = informal.",
      },
      {
        term: "Excusez-moi",
        translation: "Excuse me",
        pronunciation: "ex-küh-ZAY mwah",
        partOfSpeech: "phrase",
        image: "/images/vocab/excuse.svg",
        audio: "/audio/fr/excusez-moi.mp3",
        exampleSentence: {
          original: "Excusez-moi, où sont les toilettes ?",
          translation: "Excuse me, where are the restrooms?",
        },
        tip: "Essential for getting attention politely or apologizing for bumping into someone.",
      },
      {
        term: "Oui",
        translation: "Yes",
        pronunciation: "wee",
        partOfSpeech: "adverb",
        image: "/images/vocab/yes.svg",
        audio: "/audio/fr/oui.mp3",
        exampleSentence: {
          original: "Oui, je comprends.",
          translation: "Yes, I understand.",
        },
        tip: "One of the most common French words. Short and sweet!",
      },
      {
        term: "Non",
        translation: "No",
        pronunciation: "nohn",
        partOfSpeech: "adverb",
        image: "/images/vocab/no.svg",
        audio: "/audio/fr/non.mp3",
        exampleSentence: {
          original: "Non, merci.",
          translation: "No, thank you.",
        },
        tip: "The French 'non' has a nasal sound — don't fully pronounce the 'n.'",
      },
    ],

    grammar: [
      {
        title: "Formal vs. Informal Greetings",
        explanation:
          "French has two registers for speaking: formal (vous) and informal (tu). When greeting someone you don't know, someone older, or in a professional setting, use formal greetings like 'Bonjour' and 'Comment allez-vous ?' With friends, family, and peers, use informal greetings like 'Salut' and 'Ça va ?'",
        examples: [
          {
            original: "Bonjour, comment allez-vous ?",
            translation: "Hello, how are you? (formal)",
            breakdown: "Bonjour (hello) + comment (how) + allez-vous (are you — formal)",
          },
          {
            original: "Salut, ça va ?",
            translation: "Hi, how's it going? (informal)",
            breakdown: "Salut (hi) + ça va (it goes / how's it going)",
          },
        ],
        table: {
          headers: ["Situation", "Greeting", "Register"],
          rows: [
            ["Meeting a stranger", "Bonjour, monsieur/madame", "Formal"],
            ["Greeting a friend", "Salut !", "Informal"],
            ["Entering a shop", "Bonjour !", "Formal"],
            ["Evening event", "Bonsoir", "Formal"],
          ],
        },
        commonMistakes: [
          "❌ Don't use 'Salut' with your boss or strangers — it's too casual.",
          "✅ Use 'Bonjour' as your default — it's always safe.",
          "❌ Don't forget to greet people! In France, jumping straight to a question without saying 'Bonjour' first is considered rude.",
        ],
      },
    ],

    dialogue: {
      title: "At the Bakery",
      context:
        "Sophie enters a bakery in Paris. She greets the baker and orders a croissant.",
      image: "/images/dialogues/bakery.svg",
      lines: [
        {
          speaker: "Sophie",
          text: "Bonjour !",
          translation: "Hello!",
          audio: "/audio/fr/dialogue/u1l1-line1.mp3",
        },
        {
          speaker: "Boulanger",
          text: "Bonjour, madame ! Comment allez-vous ?",
          translation: "Hello, ma'am! How are you?",
          audio: "/audio/fr/dialogue/u1l1-line2.mp3",
        },
        {
          speaker: "Sophie",
          text: "Très bien, merci. Un croissant, s'il vous plaît.",
          translation: "Very well, thank you. A croissant, please.",
          audio: "/audio/fr/dialogue/u1l1-line3.mp3",
        },
        {
          speaker: "Boulanger",
          text: "Voilà ! Un euro, s'il vous plaît.",
          translation: "Here you go! One euro, please.",
          audio: "/audio/fr/dialogue/u1l1-line4.mp3",
        },
        {
          speaker: "Sophie",
          text: "Merci beaucoup ! Au revoir !",
          translation: "Thank you very much! Goodbye!",
          audio: "/audio/fr/dialogue/u1l1-line5.mp3",
        },
        {
          speaker: "Boulanger",
          text: "Au revoir, bonne journée !",
          translation: "Goodbye, have a nice day!",
          audio: "/audio/fr/dialogue/u1l1-line6.mp3",
        },
      ],
      comprehensionQuestions: [
        {
          question: "What does Sophie buy?",
          options: ["A baguette", "A croissant", "A coffee", "A cake"],
          correctIndex: 1,
        },
        {
          question: "Which register does Sophie use?",
          options: ["Informal (tu)", "Formal (vous)", "Slang", "Mixed"],
          correctIndex: 1,
        },
      ],
    },

    culture: {
      title: "La Bise — The French Kiss Greeting",
      text: "In France, close friends and family greet each other with 'la bise' — light kisses on the cheeks. The number of kisses varies by region: two in Paris, three in the south, and up to four in some areas! When in doubt, follow the other person's lead.",
      image: "/images/culture/la-bise.svg",
      funFact:
        "🤯 During COVID-19, the French debated whether 'la bise' would survive the pandemic. Spoiler: it did!",
    },

    summary: {
      keyPoints: [
        "'Bonjour' is the universal daytime greeting — always safe to use",
        "'Salut' is informal — save it for friends",
        "'Bonsoir' is used in the evening (after ~6 PM)",
        "'Merci' and 'S'il vous plaît' are essential courtesy words",
        "Always greet people when entering shops, restaurants, etc.",
        "French distinguishes between formal (vous) and informal (tu)",
      ],
      practicePrompt:
        "Try greeting yourself in the mirror with 'Bonjour !' every morning this week. Practice saying 'Merci' and 'S'il vous plaît' out loud!",
    },
  },

  exercises: [
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "How do you say 'Hello' in French?",
      content: {
        options: ["Merci", "Bonjour", "Au revoir", "Salut"],
        correctIndex: 1,
      },
      explanation:
        "'Bonjour' is the standard French greeting meaning 'Hello' or 'Good morning.' 'Salut' also means 'Hi' but is informal.",
      hint: "It literally means 'good day.'",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 1,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "Which greeting would you use at 8 PM?",
      content: {
        options: ["Bonjour", "Bonsoir", "Bonne nuit", "Salut"],
        correctIndex: 1,
      },
      explanation:
        "'Bonsoir' means 'Good evening' and is used after approximately 6 PM.",
      hint: "'Soir' means 'evening' in French.",
      difficulty: "EASY",
      xp_reward: 2,
      order_index: 2,
    },
    {
      exercise_type: "MATCHING",
      question: "Match each French word to its English meaning:",
      content: {
        pairs: [
          { left: "Bonjour", right: "Hello" },
          { left: "Merci", right: "Thank you" },
          { left: "Au revoir", right: "Goodbye" },
          { left: "S'il vous plaît", right: "Please" },
          { left: "Oui", right: "Yes" },
        ],
      },
      explanation:
        "These five phrases are the most essential courtesy words in French. You'll use them every day!",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 3,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete the greeting:",
      content: {
        sentence: "_____, comment allez-vous ?",
        answer: "Bonjour",
        options: ["Bonjour", "Merci", "Au revoir", "Non"],
        caseSensitive: false,
      },
      explanation:
        "'Bonjour, comment allez-vous ?' is the standard formal greeting meaning 'Hello, how are you?'",
      hint: "What do you say first when meeting someone during the day?",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 4,
    },
    {
      exercise_type: "FILL_BLANK",
      question: "Complete Sophie's order:",
      content: {
        sentence: "Un croissant, _____ .",
        answer: "s'il vous plaît",
        options: ["s'il vous plaît", "merci", "bonjour", "au revoir"],
        caseSensitive: false,
      },
      explanation:
        "'S'il vous plaît' means 'please' and is used when making polite requests.",
      hint: "What do you add to be polite when ordering?",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 5,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question: "You walk into a clothing store. What should you say first?",
      content: {
        options: [
          "Salut, ça va ?",
          "Bonjour !",
          "Merci beaucoup !",
          "Au revoir !",
        ],
        correctIndex: 1,
      },
      explanation:
        "In France, it's polite to say 'Bonjour' when entering any shop. Skipping the greeting is considered rude.",
      hint: "Think about French customs when entering a shop.",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 6,
    },
    {
      exercise_type: "TRANSLATION",
      question: "Translate to French: 'Thank you very much!'",
      content: {
        correctAnswer: "Merci beaucoup !",
        acceptableAnswers: [
          "Merci beaucoup !",
          "Merci beaucoup!",
          "Merci beaucoup",
        ],
        direction: "to_target",
      },
      explanation:
        "'Merci' means 'thank you' and 'beaucoup' means 'a lot / very much.' Together they form 'Thank you very much!'",
      hint: "'Merci' + a word meaning 'a lot.'",
      difficulty: "MEDIUM",
      xp_reward: 4,
      order_index: 7,
    },
    {
      exercise_type: "MULTIPLE_CHOICE",
      question:
        "Which greeting is INFORMAL and should only be used with friends?",
      content: {
        options: ["Bonjour", "Bonsoir", "Salut", "Comment allez-vous ?"],
        correctIndex: 2,
      },
      explanation:
        "'Salut' is an informal greeting similar to 'Hi' or 'Hey.' Use it with friends and peers, not in formal situations.",
      hint: "One of these is the 'buddy' greeting.",
      difficulty: "MEDIUM",
      xp_reward: 3,
      order_index: 8,
    },
    {
      exercise_type: "REORDER",
      question: "Put the words in the correct order to form a polite request:",
      content: {
        words: ["plaît", "café", "s'il", "Un", "vous"],
        correctOrder: ["Un", "café", "s'il", "vous", "plaît"],
        translation: "A coffee, please.",
      },
      explanation:
        "The structure is: item + 's'il vous plaît.' This is how you politely order in French.",
      difficulty: "HARD",
      xp_reward: 5,
      order_index: 9,
    },
    {
      exercise_type: "LISTENING",
      question: "Listen and select what you hear:",
      content: {
        ttsText: "Bonjour, comment allez-vous ?",
        ttsLang: "fr-FR",
        options: [
          "Bonjour, comment allez-vous ?",
          "Bonsoir, comment allez-vous ?",
          "Bonjour, comment vas-tu ?",
          "Bonsoir, ça va ?",
        ],
        correctIndex: 0,
      },
      explanation:
        "The speaker says 'Bonjour, comment allez-vous ?' — the standard formal greeting. Note 'Bonjour' (not 'Bonsoir') and 'allez-vous' (formal, not 'vas-tu').",
      difficulty: "HARD",
      xp_reward: 5,
      order_index: 10,
    },
    {
      exercise_type: "SPEAK",
      question: "Say this greeting out loud:",
      content: {
        targetText: "Bonjour",
        targetTranslation: "Hello / Good morning",
        acceptableVariants: ["bonjour", "Bonjour!"],
      },
      hint: "This is the most common French greeting!",
      explanation: "'Bonjour' is pronounced 'bohn-ZHOOR'.",
      difficulty: "EASY",
      xp_reward: 5,
      order_index: 11,
    },
    {
      exercise_type: "SPEAK",
      question: "Now try this polite phrase:",
      content: {
        targetText: "Merci beaucoup",
        targetTranslation: "Thank you very much",
        acceptableVariants: ["merci beaucoup", "Merci beaucoup!"],
      },
      hint: "Speak clearly and do not rush!",
      explanation: "'Merci beaucoup' is pronounced 'mehr-SEE boh-KOO'.",
      difficulty: "MEDIUM",
      xp_reward: 5,
      order_index: 12,
    },
  ],
};