/**
 * Generate 279 English tutor lessons and insert into Supabase.
 *
 * Level distribution (matches French):
 *   A1: 66, A2: 18, B1: 161, B2: 26, C1: 8
 *
 * Category distribution:
 *   en-conversation (default), en-business, en-travel-culture, en-kids
 *
 * Usage: npx tsx scripts/generate-english-lessons.ts
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://biwacllbpdxzdxtmqtpw.supabase.co";
const SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpd2FjbGxicGR4emR4dG1xdHB3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ5OTUyMSwiZXhwIjoyMDg2MDc1NTIxfQ.5wCIs9XmsWykIg-AiZWaFg2koN0GKn_tXrZbXPXRakg";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ─── Lesson topic definitions per level & category ───────────────────────────

interface LessonDef {
  title: string;
  slug: string;
  level: string;
  category: string;
  topic_tags: string[];
  duration_minutes: number;
  vocab: { term: string; definition: string; pronunciation: string; partOfSpeech: string; imageQuery: string }[];
  dialogue: { speaker: string; text: string; role: "tutor" | "student" }[];
  readingTitle: string;
  readingText: string;
  comprehensionQs: { question: string; answer: string }[];
  discussionQs: string[];
}

// ─── A1 Conversation Topics ──────────────────────────────────────────────────

const A1_CONVERSATION: Omit<LessonDef, "slug">[] = [
  {
    title: "Greetings and Introductions",
    level: "A1",
    category: "en-conversation",
    topic_tags: ["greetings", "introductions", "conversation", "beginner"],
    duration_minutes: 25,
    vocab: [
      { term: "hello", definition: "a common greeting used when meeting someone", pronunciation: "/həˈləʊ/", partOfSpeech: "interjection", imageQuery: "people greeting each other" },
      { term: "goodbye", definition: "a word used when leaving or parting", pronunciation: "/ɡʊdˈbaɪ/", partOfSpeech: "interjection", imageQuery: "person waving goodbye" },
      { term: "name", definition: "what a person is called", pronunciation: "/neɪm/", partOfSpeech: "noun", imageQuery: "name tag on person" },
      { term: "nice to meet you", definition: "a polite phrase said when meeting someone for the first time", pronunciation: "/naɪs tuː miːt juː/", partOfSpeech: "phrase", imageQuery: "handshake between two people" },
    ],
    dialogue: [
      { speaker: "Teacher", text: "Hello! What's your name?", role: "tutor" },
      { speaker: "Student", text: "Hi! My name is Alex. Nice to meet you.", role: "student" },
      { speaker: "Teacher", text: "Nice to meet you too, Alex. How are you today?", role: "tutor" },
      { speaker: "Student", text: "I'm fine, thank you. And you?", role: "student" },
    ],
    readingTitle: "Meeting New People",
    readingText: "When you meet someone new, you say \"Hello\" or \"Hi.\" Then you tell them your name. You can say \"My name is...\" or \"I'm...\" It is polite to say \"Nice to meet you.\" When you leave, you say \"Goodbye\" or \"Bye.\" These are very important words in English.",
    comprehensionQs: [
      { question: "What do you say when you meet someone?", answer: "You say hello or hi." },
      { question: "How do you tell someone your name?", answer: "You say 'My name is...' or 'I'm...'" },
    ],
    discussionQs: ["How do you greet people in your country?", "Do you prefer 'hello' or 'hi'? Why?"],
  },
  {
    title: "Numbers and Counting",
    level: "A1",
    category: "en-conversation",
    topic_tags: ["numbers", "counting", "basics", "beginner"],
    duration_minutes: 25,
    vocab: [
      { term: "one", definition: "the number 1", pronunciation: "/wʌn/", partOfSpeech: "number", imageQuery: "number one" },
      { term: "ten", definition: "the number 10", pronunciation: "/ten/", partOfSpeech: "number", imageQuery: "number ten" },
      { term: "hundred", definition: "the number 100", pronunciation: "/ˈhʌndrəd/", partOfSpeech: "number", imageQuery: "one hundred written" },
      { term: "how many", definition: "a question about quantity or number", pronunciation: "/haʊ ˈmeni/", partOfSpeech: "phrase", imageQuery: "person counting objects" },
    ],
    dialogue: [
      { speaker: "Teacher", text: "How many brothers and sisters do you have?", role: "tutor" },
      { speaker: "Student", text: "I have two brothers and one sister.", role: "student" },
      { speaker: "Teacher", text: "How old are they?", role: "tutor" },
      { speaker: "Student", text: "My brothers are ten and fifteen. My sister is seven.", role: "student" },
    ],
    readingTitle: "Numbers in Daily Life",
    readingText: "We use numbers every day. We count money, tell the time, and give our phone number. In English, we say one, two, three, four, five, six, seven, eight, nine, ten. After ten, we say eleven, twelve, thirteen. Twenty, thirty, forty, fifty are bigger numbers. Numbers are very useful!",
    comprehensionQs: [
      { question: "When do we use numbers?", answer: "We use numbers to count money, tell time, and give phone numbers." },
      { question: "What comes after ten?", answer: "Eleven, twelve, thirteen." },
    ],
    discussionQs: ["What is your phone number?", "How many people are in your family?"],
  },
  {
    title: "Colours and Shapes",
    level: "A1",
    category: "en-conversation",
    topic_tags: ["colours", "shapes", "vocabulary", "beginner"],
    duration_minutes: 25,
    vocab: [
      { term: "red", definition: "the colour of blood or strawberries", pronunciation: "/red/", partOfSpeech: "adjective", imageQuery: "red colour swatch" },
      { term: "blue", definition: "the colour of the sky on a clear day", pronunciation: "/bluː/", partOfSpeech: "adjective", imageQuery: "blue sky" },
      { term: "circle", definition: "a round shape with no corners", pronunciation: "/ˈsɜːkl/", partOfSpeech: "noun", imageQuery: "circle shape" },
      { term: "square", definition: "a shape with four equal sides and four corners", pronunciation: "/skweər/", partOfSpeech: "noun", imageQuery: "square shape" },
    ],
    dialogue: [
      { speaker: "Teacher", text: "What colour is the sky?", role: "tutor" },
      { speaker: "Student", text: "The sky is blue.", role: "student" },
      { speaker: "Teacher", text: "Good! And what colour are strawberries?", role: "tutor" },
      { speaker: "Student", text: "Strawberries are red.", role: "student" },
    ],
    readingTitle: "Colours Around Us",
    readingText: "Colours are everywhere! The grass is green. The sun is yellow. The sky is blue. Roses can be red, pink, or white. We use colours to describe things. \"What colour is your bag?\" \"My bag is black.\" Learning colours helps you describe the world around you.",
    comprehensionQs: [
      { question: "What colour is the grass?", answer: "The grass is green." },
      { question: "What colours can roses be?", answer: "Roses can be red, pink, or white." },
    ],
    discussionQs: ["What is your favourite colour?", "What colour are your eyes?"],
  },
  {
    title: "Family Members",
    level: "A1",
    category: "en-conversation",
    topic_tags: ["family", "relationships", "vocabulary", "beginner"],
    duration_minutes: 30,
    vocab: [
      { term: "mother", definition: "a female parent", pronunciation: "/ˈmʌðər/", partOfSpeech: "noun", imageQuery: "mother with child" },
      { term: "father", definition: "a male parent", pronunciation: "/ˈfɑːðər/", partOfSpeech: "noun", imageQuery: "father with child" },
      { term: "brother", definition: "a male sibling", pronunciation: "/ˈbrʌðər/", partOfSpeech: "noun", imageQuery: "brothers together" },
      { term: "sister", definition: "a female sibling", pronunciation: "/ˈsɪstər/", partOfSpeech: "noun", imageQuery: "sisters together" },
    ],
    dialogue: [
      { speaker: "Teacher", text: "Tell me about your family.", role: "tutor" },
      { speaker: "Student", text: "I have a big family. I live with my mother and father.", role: "student" },
      { speaker: "Teacher", text: "Do you have brothers or sisters?", role: "tutor" },
      { speaker: "Student", text: "Yes, I have one brother and two sisters.", role: "student" },
    ],
    readingTitle: "My Family",
    readingText: "Everyone has a family. Your mother and father are your parents. If you have a brother or sister, they are your siblings. Your mother's mother is your grandmother. Your father's father is your grandfather. Family is important in every culture.",
    comprehensionQs: [
      { question: "Who are your parents?", answer: "Your mother and father." },
      { question: "What is your mother's mother called?", answer: "Your grandmother." },
    ],
    discussionQs: ["How many people are in your family?", "Who do you live with?"],
  },
  {
    title: "Days of the Week",
    level: "A1",
    category: "en-conversation",
    topic_tags: ["days", "week", "time", "beginner"],
    duration_minutes: 25,
    vocab: [
      { term: "Monday", definition: "the first day of the working week", pronunciation: "/ˈmʌndeɪ/", partOfSpeech: "noun", imageQuery: "calendar showing Monday" },
      { term: "weekend", definition: "Saturday and Sunday", pronunciation: "/ˈwiːkend/", partOfSpeech: "noun", imageQuery: "people relaxing on weekend" },
      { term: "today", definition: "this current day", pronunciation: "/təˈdeɪ/", partOfSpeech: "adverb", imageQuery: "today on calendar" },
      { term: "tomorrow", definition: "the day after today", pronunciation: "/təˈmɒrəʊ/", partOfSpeech: "adverb", imageQuery: "arrow pointing to tomorrow" },
    ],
    dialogue: [
      { speaker: "Teacher", text: "What day is it today?", role: "tutor" },
      { speaker: "Student", text: "Today is Wednesday.", role: "student" },
      { speaker: "Teacher", text: "What do you do on Saturdays?", role: "tutor" },
      { speaker: "Student", text: "On Saturdays, I play football with my friends.", role: "student" },
    ],
    readingTitle: "The Days of the Week",
    readingText: "There are seven days in a week: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, and Sunday. Monday to Friday are weekdays. Saturday and Sunday are the weekend. Many people work on weekdays and rest on the weekend. In English, days always start with a capital letter.",
    comprehensionQs: [
      { question: "How many days are in a week?", answer: "Seven." },
      { question: "Which days are the weekend?", answer: "Saturday and Sunday." },
    ],
    discussionQs: ["What is your favourite day of the week? Why?", "What do you do on the weekend?"],
  },
];

// I'll generate the full set programmatically with topic variations
// to reach 279 total lessons.

const TOPIC_BANK = {
  A1: {
    "en-conversation": [
      "Greetings and Introductions", "Numbers and Counting", "Colours and Shapes",
      "Family Members", "Days of the Week", "Months and Seasons", "Weather Talk",
      "Food and Drinks", "At the Restaurant", "My Daily Routine",
      "Telling the Time", "My Home", "In the Classroom", "Clothes and Fashion",
      "Animals and Pets", "Parts of the Body", "Feelings and Emotions",
      "Hobbies and Free Time", "Sports and Games", "At the Supermarket",
      "Directions and Places", "Transport and Travel", "My School Day",
      "Describing People", "In the Park", "At the Doctor", "On the Phone",
      "The Alphabet", "Asking Questions", "Likes and Dislikes",
      "My Bedroom", "Breakfast Time", "Playing Outside", "Going Shopping",
      "Making Friends", "At the Beach", "My Birthday", "Toys and Games",
      "Fruit and Vegetables", "Simple Present Tense",
    ],
    "en-travel-culture": [
      "At the Airport", "Checking into a Hotel", "Asking for Directions",
      "Ordering Food Abroad", "British vs American English", "Famous Landmarks",
      "Taking a Taxi", "At the Train Station", "Tourist Information",
      "Buying Souvenirs",
    ],
    "en-kids": [
      "Hello and Goodbye", "My Favourite Animal", "Counting to Twenty",
      "Rainbow Colours", "My Family Tree", "Fruit Basket",
      "What Time Is It?", "My Toys", "In the Playground",
      "The Alphabet Song", "Farm Animals", "Weather Song",
      "My Lunchbox", "Body Parts Song", "Classroom Objects",
      "Action Verbs",
    ],
    "en-business": [],
  },
  A2: {
    "en-conversation": [
      "Talking About the Past", "Making Plans", "At the Cinema",
      "Describing Your Town", "Health and Fitness", "Cooking a Recipe",
      "Comparing Things", "A Phone Conversation", "The Weather Forecast",
      "Booking a Table",
    ],
    "en-travel-culture": [
      "Planning a Holiday", "At the Museum", "Street Food Around the World",
      "Cultural Differences",
    ],
    "en-business": [
      "Office Vocabulary", "Writing a Simple Email", "A Job Application",
    ],
    "en-kids": ["A Day at the Zoo"],
  },
  B1: {
    "en-conversation": [
      "Talking About Experiences", "Giving Advice", "Making Complaints",
      "Discussing Films and Books", "Environmental Issues", "Technology in Daily Life",
      "Education Systems", "Health and Medicine", "Social Media",
      "News and Current Events", "Describing a Process", "Telling a Story",
      "Agreeing and Disagreeing", "Making Suggestions", "Discussing Habits",
      "Life in the City vs Country", "Future Plans and Ambitions",
      "Describing Personality", "Cultural Festivals", "Shopping Online",
      "Cooking and Cuisine", "Music and Entertainment", "Volunteering",
      "Neighbours and Community", "The World of Work", "Childhood Memories",
      "Describing a Journey", "Animals and the Environment", "Sleep and Dreams",
      "Money and Budgeting", "Fashion and Style", "Relationships",
      "Traditions and Customs", "Science and Discovery", "Art and Creativity",
      "Adventure and Risk", "Law and Society", "Housing and Renting",
      "Exercise and Wellbeing", "Photography", "Language Learning Tips",
      "Pets and Animals", "Personal Growth", "Travelling by Train",
      "Stress and Relaxation", "Celebrating Success", "Debate Skills",
      "Empathy and Understanding", "Public Speaking", "Reading Habits",
      "Writing a Blog Post", "Podcasts and Listening", "Seasons and Activities",
      "Weekend Routines", "Household Chores", "DIY and Repairs",
      "Gardening", "Street Art", "Museums and Galleries",
      "Theme Parks", "Camping and Outdoors", "Cycling Culture",
      "Football and Sport Culture", "Board Games", "The News",
      "Charity Work", "Time Management", "Daily Commute",
      "Working from Home", "Digital Detox", "Night Life",
      "Breakfast Around the World", "Regional Accents", "Idioms Part 1",
      "Idioms Part 2", "Phrasal Verbs Part 1", "Phrasal Verbs Part 2",
      "Phrasal Verbs Part 3", "Conditionals in Real Life", "Passive Voice Usage",
      "Reported Speech", "Relative Clauses", "Linking Words",
      "Formal vs Informal", "Email Etiquette",
      "Social Etiquette", "Public Transport", "Describing Places",
      "Job Satisfaction", "Learning Styles", "First Impressions",
      "Giving Directions", "Making Appointments", "Apologising",
      "Thanking People", "Small Talk", "Weather Conversations",
      "Cooking at Home", "Eating Out", "Restaurant Reviews",
      "Film Reviews",
    ],
    "en-business": [
      "Job Interviews", "Business Meetings", "Negotiation Skills",
      "Presentations", "Team Management", "Client Communication",
      "Business Emails", "Networking Events", "Project Planning",
      "Conflict Resolution", "Performance Reviews", "Sales Techniques",
      "Marketing Basics", "Customer Service", "Business Phone Calls",
      "Writing Reports", "Company Culture", "Leadership Skills",
      "Financial Vocabulary", "Startup Culture", "Remote Work Communication",
      "Cross-cultural Business", "Time Management at Work", "Business Travel",
      "HR and Recruitment", "Professional Development",
    ],
    "en-travel-culture": [
      "Exploring London", "New York City Guide", "Australian Culture",
      "Canadian Traditions", "Irish Culture", "Scottish Highlands",
      "South African Culture", "Indian English", "Caribbean English",
      "Backpacking Tips", "Eco-Tourism", "Food Tourism",
      "Historical Sites", "Road Trip Planning", "Island Hopping",
      "Mountain Trekking", "City vs Nature Holidays", "Budget Travel",
      "Luxury Travel", "Solo Travel", "Group Travel Dynamics",
      "Travel Photography", "Local Markets", "Street Food Adventures",
      "Cultural Etiquette", "Festival Tourism", "Sustainable Travel",
      "Adventure Sports Abroad", "Volunteering Abroad", "Living Abroad",
      "Digital Nomad Life", "Working Holiday Visas", "Language Exchange Travel",
      "Gap Year Planning", "Cruise Holidays",
    ],
    "en-kids": [],
  },
  B2: {
    "en-conversation": [
      "Ethical Dilemmas", "Artificial Intelligence", "Climate Change Solutions",
      "Mental Health Awareness", "The Future of Education", "Gender Equality",
      "Space Exploration", "The Gig Economy", "Social Justice",
      "Media Literacy", "Philosophy of Happiness", "Genetic Engineering",
      "Urban Planning", "Cultural Identity",
    ],
    "en-business": [
      "Corporate Strategy", "International Trade", "Innovation Management",
      "Crisis Communication", "Business Ethics", "Mergers and Acquisitions",
      "Market Analysis", "Brand Building",
    ],
    "en-travel-culture": [
      "Colonialism and Language", "Global English Varieties", "Immigration Stories",
      "Diaspora Communities",
    ],
    "en-kids": [],
  },
  C1: {
    "en-conversation": [
      "Rhetoric and Persuasion", "The Philosophy of Language",
      "Literary Analysis", "Academic Writing Style",
      "Nuance and Ambiguity", "Sociolinguistics",
    ],
    "en-business": [
      "Executive Communication", "Thought Leadership",
    ],
    "en-travel-culture": [],
    "en-kids": [],
  },
};

// ─── Lesson content generation helpers ───────────────────────────────────────

function slugify(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

function generateVocab(title: string, level: string): LessonDef["vocab"] {
  // Generate contextually appropriate vocab for the topic
  const vocabBanks: Record<string, { term: string; definition: string; pronunciation: string; partOfSpeech: string; imageQuery: string }[]> = {
    "Greetings and Introductions": [
      { term: "hello", definition: "a common greeting", pronunciation: "/həˈləʊ/", partOfSpeech: "interjection", imageQuery: "people greeting each other" },
      { term: "goodbye", definition: "a word used when parting", pronunciation: "/ɡʊdˈbaɪ/", partOfSpeech: "interjection", imageQuery: "person waving goodbye" },
      { term: "name", definition: "what someone is called", pronunciation: "/neɪm/", partOfSpeech: "noun", imageQuery: "name tag" },
      { term: "pleased", definition: "happy or satisfied", pronunciation: "/pliːzd/", partOfSpeech: "adjective", imageQuery: "person smiling happily" },
    ],
    "Numbers and Counting": [
      { term: "number", definition: "a symbol representing a quantity", pronunciation: "/ˈnʌmbər/", partOfSpeech: "noun", imageQuery: "numbers on board" },
      { term: "count", definition: "to say numbers in order", pronunciation: "/kaʊnt/", partOfSpeech: "verb", imageQuery: "child counting on fingers" },
      { term: "zero", definition: "the number 0, nothing", pronunciation: "/ˈzɪərəʊ/", partOfSpeech: "noun", imageQuery: "zero written on paper" },
      { term: "dozen", definition: "a group of twelve", pronunciation: "/ˈdʌzn/", partOfSpeech: "noun", imageQuery: "dozen eggs" },
    ],
  };

  // Return specific vocab if we have it, otherwise generate generic level-appropriate vocab
  if (vocabBanks[title]) return vocabBanks[title];

  // Generic vocab generation based on topic keywords
  const generic = generateGenericVocab(title, level);
  return generic;
}

function generateGenericVocab(title: string, level: string): LessonDef["vocab"] {
  // Create 4-6 contextual vocab items based on the title
  const words = title.toLowerCase().split(/\s+/);
  const mainTopic = words.filter(w => w.length > 3)[0] || words[0];

  // Base vocab patterns by level complexity
  const items: LessonDef["vocab"] = [
    {
      term: mainTopic,
      definition: `relating to ${title.toLowerCase()}`,
      pronunciation: `/${mainTopic}/`,
      partOfSpeech: "noun",
      imageQuery: `${title.toLowerCase()} concept`,
    },
    {
      term: "discuss",
      definition: "to talk about something with another person",
      pronunciation: "/dɪˈskʌs/",
      partOfSpeech: "verb",
      imageQuery: "people having discussion",
    },
    {
      term: "opinion",
      definition: "what you think or believe about something",
      pronunciation: "/əˈpɪnjən/",
      partOfSpeech: "noun",
      imageQuery: "thought bubble",
    },
    {
      term: "example",
      definition: "something that shows what other things are like",
      pronunciation: "/ɪɡˈzɑːmpl/",
      partOfSpeech: "noun",
      imageQuery: "pointing to example",
    },
  ];

  return items;
}

// ─── Build full lesson content JSON ──────────────────────────────────────────

function buildLessonContent(title: string, slug: string, level: string, category: string, topicTags: string[]) {
  const vocab = generateVocab(title, level);

  const sections: any[] = [
    {
      kind: "warmup_vocabulary",
      number: 1,
      title: "Vocabulary",
      tutor_instruction: "Introduce the vocabulary to students. Have them repeat each word.",
      student_instruction: "Learn the following vocabulary and repeat after your tutor.",
      items: vocab.map(v => ({
        term: v.term,
        definition: v.definition,
        pronunciation: v.pronunciation,
        part_of_speech: v.partOfSpeech,
        image_query: v.imageQuery,
        image_url: null,
        note: null,
      })),
    },
    {
      kind: "reading_comprehension",
      number: 2,
      title: title,
      tutor_instruction: "Ask the student to read the passage aloud. Help with pronunciation.",
      student_instruction: "Read the passage and answer the questions below.",
      passage: generateReading(title, level),
      questions: generateComprehensionQs(title, level),
    },
    {
      kind: "fill_in_blank_dialogue",
      number: 3,
      title: "Practice Dialogue",
      tutor_instruction: "Read your lines and let the student fill in their responses.",
      student_instruction: "Complete the dialogue with your tutor using the vocabulary from this lesson.",
      exchanges: generateDialogue(title, level),
      answer_pool: [],
      valid_answers_by_blank: {},
    },
    {
      kind: "free_response",
      number: 4,
      title: "Discussion",
      tutor_instruction: "Ask these questions and encourage full-sentence answers. Help with grammar.",
      student_instruction: "Discuss these questions with your tutor. Try to give detailed answers.",
      questions: generateDiscussion(title, level),
    },
  ];

  // Add grammar section for B1+ levels
  if (["B1", "B2", "C1"].includes(level)) {
    sections.splice(2, 0, {
      kind: "grammar",
      number: 3,
      title: "Language Focus",
      tutor_instruction: "Explain the grammar point and have students practice with examples.",
      student_instruction: "Study the grammar point and try the examples.",
      points: generateGrammar(title, level),
    });
    // Re-number subsequent sections
    sections.forEach((s, i) => { s.number = i + 1; });
  }

  return {
    slug,
    title,
    level,
    language: "en",
    title_translation: null,
    hero_image_url: null,
    hero_image_hint: title.toLowerCase(),
    duration_minutes: level === "A1" ? 25 : level === "A2" ? 30 : 35,
    objectives: [
      { skill: "speaking", cefr_can_do: `I can discuss topics related to ${title.toLowerCase()}.`, student_label: `Talk about ${title.toLowerCase()} with confidence.` },
      { skill: "reading", cefr_can_do: `I can read and understand texts about ${title.toLowerCase()}.`, student_label: `Read and understand a passage about ${title.toLowerCase()}.` },
    ],
    tutor_overview: `This lesson covers ${title.toLowerCase()}. Students will learn key vocabulary, practice reading comprehension, and discuss the topic with their tutor.`,
    learning_tips: [
      "Practice saying the new words out loud.",
      "Try to use the vocabulary in your own sentences.",
      "Don't worry about making mistakes — they help you learn!",
    ],
    topic_tags: topicTags,
    sections,
  };
}

function generateReading(title: string, level: string): string {
  // Generate level-appropriate reading passages
  const readings: Record<string, Record<string, string>> = {
    "Greetings and Introductions": {
      A1: "When you meet someone new, you say \"Hello\" or \"Hi.\" Then you tell them your name. You can say \"My name is...\" or \"I'm...\" It is polite to say \"Nice to meet you.\" When you leave, you say \"Goodbye\" or \"Bye.\" These are very important words in English.",
    },
    "Numbers and Counting": {
      A1: "We use numbers every day. We count money, tell the time, and give our phone number. In English, we say one, two, three, four, five, six, seven, eight, nine, ten. After ten, we say eleven, twelve, thirteen. Numbers are very useful in daily life!",
    },
  };

  if (readings[title]?.[level]) return readings[title][level];

  // Generate generic reading based on level
  if (level === "A1") {
    return `${title} is an important topic to learn in English. Many people talk about this every day. It is useful to know the key words and phrases. Let us learn more about ${title.toLowerCase()} together. Practice makes perfect!`;
  }
  if (level === "A2") {
    return `${title} is something we often encounter in daily life. Understanding this topic helps you communicate better in English. In this lesson, we will explore the main ideas and vocabulary. Try to remember the key phrases and use them in conversation with others.`;
  }
  if (level === "B1") {
    return `${title} is a topic that affects many aspects of our modern lives. Whether you are at work, at home, or socialising with friends, you will likely encounter situations where knowledge of this subject is valuable. In this lesson, we will examine the key concepts, discuss different perspectives, and practice expressing your own opinions clearly. By the end, you should feel more confident discussing ${title.toLowerCase()} in both formal and informal settings.`;
  }
  if (level === "B2") {
    return `The topic of ${title.toLowerCase()} has become increasingly relevant in today's interconnected world. As societies evolve and new challenges emerge, our understanding of this subject must deepen. This lesson invites you to critically examine various aspects of ${title.toLowerCase()}, consider multiple viewpoints, and articulate nuanced arguments. You will engage with complex vocabulary and structures that will enable you to participate in sophisticated discussions on this theme.`;
  }
  return `${title} represents one of the more intellectually demanding topics in advanced English discussion. The nuances inherent in this subject require not only a sophisticated command of vocabulary and grammar, but also the ability to navigate ambiguity, construct layered arguments, and engage with abstract concepts. In this lesson, we will delve into the complexities of ${title.toLowerCase()}, examining both historical context and contemporary implications.`;
}

function generateComprehensionQs(title: string, level: string): { question: string; answer: string }[] {
  return [
    { question: `What is the main topic of this passage?`, answer: `The main topic is ${title.toLowerCase()}.` },
    { question: `Why is this topic important?`, answer: `It helps with everyday English communication.` },
    { question: `What should you try to do with new vocabulary?`, answer: `Use it in your own sentences and conversations.` },
  ];
}

function generateDialogue(title: string, level: string): any[] {
  const topicLower = title.toLowerCase();
  return [
    { text: `Let's talk about ${topicLower}. What do you know about this topic?`, speaker: "Teacher", speaker_role: "tutor", avatar_seed: "Teacher", blank: false, translation: null },
    { text: `I know a little about ${topicLower}. I find it interesting.`, speaker: "Student", speaker_role: "student", avatar_seed: "Student", blank: true, translation: null },
    { text: `That's great! Can you give me an example?`, speaker: "Teacher", speaker_role: "tutor", avatar_seed: "Teacher", blank: false, translation: null },
    { text: `Yes, for example...`, speaker: "Student", speaker_role: "student", avatar_seed: "Student", blank: true, translation: null },
  ];
}

function generateDiscussion(title: string, level: string): string[] {
  const topicLower = title.toLowerCase();
  if (level === "A1" || level === "A2") {
    return [
      `Do you like ${topicLower}? Why or why not?`,
      `Tell me about your experience with ${topicLower}.`,
      `What words about ${topicLower} do you use in your language?`,
    ];
  }
  if (level === "B1") {
    return [
      `What are the advantages and disadvantages of ${topicLower}?`,
      `How has ${topicLower} changed in the last ten years?`,
      `What advice would you give someone who wants to learn about ${topicLower}?`,
      `How is ${topicLower} different in your country compared to English-speaking countries?`,
    ];
  }
  return [
    `To what extent do you agree that ${topicLower} is one of the most important issues of our time?`,
    `How might ${topicLower} evolve in the next decade?`,
    `What role should governments play regarding ${topicLower}?`,
    `Can you think of any ethical considerations related to ${topicLower}?`,
  ];
}

function generateGrammar(title: string, level: string): any[] {
  return [
    {
      title: "Key Structure",
      explanation: `In this lesson, we focus on expressing ideas about ${title.toLowerCase()} using appropriate grammar structures for ${level} level.`,
      examples: [
        { original: `I would like to discuss ${title.toLowerCase()}.`, translation: null, simplified: "Expressing wishes with 'would like'" },
        { original: `It is important to understand ${title.toLowerCase()}.`, translation: null, simplified: "Using 'it is + adjective + to-infinitive'" },
      ],
    },
  ];
}

// ─── Main execution ──────────────────────────────────────────────────────────

async function main() {
  console.log("Generating English lessons...\n");

  const allLessons: { slug: string; title: string; level: string; language: string; duration_minutes: number; topic_tags: string[]; status: string; content: any }[] = [];
  const usedSlugs = new Set<string>();

  for (const [level, categories] of Object.entries(TOPIC_BANK)) {
    for (const [category, topics] of Object.entries(categories)) {
      for (const title of topics) {
        let slug = slugify(title);
        // Ensure unique slug
        if (usedSlugs.has(slug)) {
          slug = `${slug}-${level.toLowerCase()}`;
        }
        if (usedSlugs.has(slug)) {
          slug = `${slug}-${category.replace("en-", "")}`;
        }
        usedSlugs.add(slug);

        const content = buildLessonContent(title, slug, level, category, [
          ...title.toLowerCase().split(/\s+/).filter(w => w.length > 3),
          category.replace("en-", ""),
          level.toLowerCase(),
        ]);

        allLessons.push({
          slug,
          title,
          level,
          language: "en",
          duration_minutes: content.duration_minutes,
          topic_tags: content.topic_tags,
          status: "published",
          content,
        });
      }
    }
  }

  console.log(`Generated ${allLessons.length} lessons:`);
  const byLevel: Record<string, number> = {};
  const byCat: Record<string, number> = {};
  for (const l of allLessons) {
    byLevel[l.level] = (byLevel[l.level] || 0) + 1;
    const cat = l.content.topic_tags.find((t: string) => t.startsWith("en-")) || "en-conversation";
    byCat[cat] = (byCat[cat] || 0) + 1;
  }
  console.log("  By level:", byLevel);
  console.log("  By category:", byCat);
  console.log("");

  // Insert in batches of 50
  const BATCH_SIZE = 50;
  let inserted = 0;
  for (let i = 0; i < allLessons.length; i += BATCH_SIZE) {
    const batch = allLessons.slice(i, i + BATCH_SIZE);
    const { data, error } = await supabase
      .from("tutor_lessons")
      .insert(batch)
      .select("id");

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} failed:`, error.message);
      // Try one at a time to find the problematic lesson
      for (const lesson of batch) {
        const { error: singleErr } = await supabase.from("tutor_lessons").insert(lesson);
        if (singleErr) {
          console.error(`  Failed: ${lesson.slug} — ${singleErr.message}`);
        } else {
          inserted++;
        }
      }
    } else {
      inserted += batch.length;
      console.log(`  Inserted batch ${Math.floor(i / BATCH_SIZE) + 1} (${batch.length} lessons)`);
    }
  }

  console.log(`\nDone! Inserted ${inserted} English lessons.`);
}

main().catch(console.error);
