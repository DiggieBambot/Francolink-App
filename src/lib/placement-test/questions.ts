// src/lib/placement-test/questions.ts

export interface PlacementQuestion {
  id: string;
  level: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  difficulty: 1 | 2 | 3 | 4 | 5 | 6;
  points: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export const placementQuestions: PlacementQuestion[] = [
  // A1 Level (Difficulty: 1)
  {
    id: "a1-01",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "Bonjour! Je _____ Marie.",
    options: ["suis", "es", "est", "sommes"],
    correctIndex: 0,
    explanation: "'Je suis' means 'I am'. The verb 'être' conjugates to 'suis' with 'je'."
  },
  {
    id: "a1-02",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "Comment tu _____?",
    options: ["appelle", "appelles", "t'appelles", "s'appelle"],
    correctIndex: 2,
    explanation: "'Comment tu t'appelles?' means 'What is your name?' The reflexive pronoun 'te' contracts to 't'' before a vowel."
  },
  {
    id: "a1-03",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "J'ai _____ chat.",
    options: ["un", "une", "des", "le"],
    correctIndex: 0,
    explanation: "'Chat' (cat) is masculine, so we use 'un' (a/one)."
  },
  {
    id: "a1-04",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "Elle _____ française.",
    options: ["suis", "es", "est", "sont"],
    correctIndex: 2,
    explanation: "'Elle est' means 'She is'. The verb 'être' conjugates to 'est' with 'elle'."
  },
  {
    id: "a1-05",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "Nous _____ à Paris.",
    options: ["habite", "habites", "habitent", "habitons"],
    correctIndex: 3,
    explanation: "'Nous habitons' means 'We live'. The verb 'habiter' conjugates to 'habitons' with 'nous'."
  },
  {
    id: "a1-06",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "Quel âge _____-vous?",
    options: ["as", "avez", "a", "ont"],
    correctIndex: 1,
    explanation: "'Quel âge avez-vous?' means 'How old are you?' (formal). The verb 'avoir' conjugates to 'avez' with 'vous'."
  },

  // A2 Level (Difficulty: 2)
  {
    id: "a2-01",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "Hier, je _____ au cinéma.",
    options: ["vais", "suis allé", "vais aller", "allais"],
    correctIndex: 1,
    explanation: "'Hier' (yesterday) requires the passé composé. 'Je suis allé' means 'I went'."
  },
  {
    id: "a2-02",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "Il fait beau aujourd'hui. _____ sortons?",
    options: ["Nous", "On", "Ils", "Vous"],
    correctIndex: 1,
    explanation: "'On' is commonly used in spoken French to mean 'we'. It's more casual than 'nous'."
  },
  {
    id: "a2-03",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "Je voudrais _____ eau, s'il vous plaît.",
    options: ["de l'", "du", "de la", "des"],
    correctIndex: 0,
    explanation: "'Eau' (water) is feminine and starts with a vowel, so we use 'de l'' for the partitive article."
  },
  {
    id: "a2-04",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "Ma sœur est _____ que moi.",
    options: ["plus grande", "plus grand", "grande", "la plus grande"],
    correctIndex: 0,
    explanation: "'Plus grande que' means 'taller than'. The adjective must agree with the feminine subject 'sœur'."
  },
  {
    id: "a2-05",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "Nous _____ nos devoirs quand il est arrivé.",
    options: ["faisons", "avons fait", "faisions", "ferons"],
    correctIndex: 2,
    explanation: "The imparfait 'faisions' is used for ongoing actions interrupted by another event in the past."
  },
  {
    id: "a2-06",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "Je me lève _____ 7 heures tous les jours.",
    options: ["à", "en", "dans", "pour"],
    correctIndex: 0,
    explanation: "We use 'à' with specific times: 'à 7 heures' means 'at 7 o'clock'."
  },

  // B1 Level (Difficulty: 3)
  {
    id: "b1-01",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "Si j'avais de l'argent, je _____ une nouvelle voiture.",
    options: ["achète", "achèterai", "achèterais", "ai acheté"],
    correctIndex: 2,
    explanation: "The conditional 'achèterais' is used with 'si + imparfait' for hypothetical situations."
  },
  {
    id: "b1-02",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "Il faut que tu _____ plus attention en classe.",
    options: ["fais", "fasses", "fera", "ferais"],
    correctIndex: 1,
    explanation: "'Il faut que' requires the subjunctive. 'Fasses' is the subjunctive form of 'faire'."
  },
  {
    id: "b1-03",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "C'est le livre _____ je t'ai parlé.",
    options: ["que", "qui", "dont", "où"],
    correctIndex: 2,
    explanation: "'Dont' is used with verbs that take 'de', like 'parler de' (to talk about)."
  },
  {
    id: "b1-04",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "Après _____ le film, nous sommes allés au restaurant.",
    options: ["voir", "vu", "avoir vu", "voyant"],
    correctIndex: 2,
    explanation: "'Après + infinitif passé' (après avoir vu) expresses an action completed before another."
  },
  {
    id: "b1-05",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "Je doute qu'il _____ venir demain.",
    options: ["peut", "puisse", "pourra", "pourrait"],
    correctIndex: 1,
    explanation: "'Douter que' expresses uncertainty and requires the subjunctive 'puisse'."
  },
  {
    id: "b1-06",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "_____ le mauvais temps, nous sommes sortis.",
    options: ["Malgré", "Pendant", "Grâce à", "À cause de"],
    correctIndex: 0,
    explanation: "'Malgré' means 'despite' and introduces a contrast with what follows."
  },

  // B2 Level (Difficulty: 4)
  {
    id: "b2-01",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "Il est parti sans que je _____ le voir.",
    options: ["peux", "puisse", "pourrais", "pourrai"],
    correctIndex: 1,
    explanation: "'Sans que' always requires the subjunctive. 'Puisse' is the subjunctive of 'pouvoir'."
  },
  {
    id: "b2-02",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "_____ ses efforts, il n'a pas réussi l'examen.",
    options: ["Malgré", "Bien que", "Quoique", "En dépit de"],
    correctIndex: 3,
    explanation: "'En dépit de' is a more formal way of saying 'despite' and is followed by a noun."
  },
  {
    id: "b2-03",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "C'est la meilleure décision que nous _____ prendre.",
    options: ["avons pu", "ayons pu", "pouvons", "puissions"],
    correctIndex: 1,
    explanation: "After superlatives like 'la meilleure', the subjunctive is required: 'ayons pu'."
  },
  {
    id: "b2-04",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "Il a agi _____ s'il connaissait toute l'histoire.",
    options: ["comme", "comme si", "parce que", "ainsi que"],
    correctIndex: 1,
    explanation: "'Comme si' (as if) is used for hypothetical comparisons and is followed by the imparfait."
  },
  {
    id: "b2-05",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "_____ tu aies raison, je ne suis pas d'accord avec toi.",
    options: ["Bien que", "Parce que", "Pendant que", "Alors que"],
    correctIndex: 0,
    explanation: "'Bien que' (although) requires the subjunctive and expresses concession."
  },
  {
    id: "b2-06",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "Le projet _____ depuis trois mois quand on l'a annulé.",
    options: ["était en cours", "a été en cours", "sera en cours", "serait en cours"],
    correctIndex: 0,
    explanation: "The imparfait 'était en cours' describes an ongoing state in the past before another event."
  },

  // C1 Level (Difficulty: 5)
  {
    id: "c1-01",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "_____ qu'il ait beaucoup travaillé, ses résultats restent médiocres.",
    options: ["Bien", "Quoique", "Encore", "Même"],
    correctIndex: 2,
    explanation: "'Encore que' is a literary expression meaning 'although/even though' and requires the subjunctive."
  },
  {
    id: "c1-02",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "Le ministre a annoncé que des mesures _____ prochainement.",
    options: ["seront prises", "seraient prises", "soient prises", "aient été prises"],
    correctIndex: 1,
    explanation: "In reported speech with a past tense main verb, the future becomes conditional: 'seraient prises'."
  },
  {
    id: "c1-03",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "_____ avoir consulté les experts, nous avons décidé de poursuivre.",
    options: ["Après", "Avant", "Pour", "Sans"],
    correctIndex: 0,
    explanation: "'Après avoir + past participle' indicates an action completed before the main action."
  },
  {
    id: "c1-04",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "Il s'est exprimé de manière _____ aucune ambiguïté ne subsiste.",
    options: ["que", "à ce que", "telle que", "si"],
    correctIndex: 2,
    explanation: "'De manière telle que' (in such a way that) is a formal construction expressing result."
  },
  {
    id: "c1-05",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "Peu _____ qu'il fasse beau, nous irons à la plage.",
    options: ["importe", "important", "importait", "a importé"],
    correctIndex: 0,
    explanation: "'Peu importe que' (no matter whether) is a fixed expression with subjunctive."
  },
  {
    id: "c1-06",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "\"Il a beau étudier, il n'y arrive pas.\" Quelle est la signification?",
    options: ["Il étudie peu", "Il étudie beaucoup mais sans succès", "Il va étudier bientôt", "Il a arrêté d'étudier"],
    correctIndex: 1,
    explanation: "'Avoir beau + infinitive' means doing something in vain, without success."
  },

  // C2 Level (Difficulty: 6)
  {
    id: "c2-01",
    level: "C2",
    difficulty: 6,
    points: 6,
    question: "_____ des circonstances atténuantes, le verdict demeure sévère.",
    options: ["Nonobstant", "Néanmoins", "Toutefois", "Cependant"],
    correctIndex: 0,
    explanation: "'Nonobstant' is a very formal/legal term meaning 'notwithstanding' or 'despite'."
  },
  {
    id: "c2-02",
    level: "C2",
    difficulty: 6,
    points: 6,
    question: "Il a usé de périphrases _____ ne pas froisser son interlocuteur.",
    options: ["pour", "afin de", "de peur de", "histoire de"],
    correctIndex: 2,
    explanation: "'De peur de' (for fear of) best captures the nuance of avoiding offense through circumlocution."
  },
  {
    id: "c2-03",
    level: "C2",
    difficulty: 6,
    points: 6,
    question: "L'orateur a su capter l'attention de son auditoire _____ des métaphores audacieuses.",
    options: ["grâce à", "au moyen de", "à force de", "par le biais de"],
    correctIndex: 3,
    explanation: "'Par le biais de' (by means of/through) is the most sophisticated expression for this context."
  },
  {
    id: "c2-04",
    level: "C2",
    difficulty: 6,
    points: 6,
    question: "Quel registre de langue: \"Il s'est fait avoir.\"",
    options: ["Soutenu", "Courant", "Familier", "Vulgaire"],
    correctIndex: 2,
    explanation: "'Se faire avoir' (to be tricked) is a colloquial/familiar expression, not formal or vulgar."
  },
  {
    id: "c2-05",
    level: "C2",
    difficulty: 6,
    points: 6,
    question: "Soit qu'il _____ occupé, soit qu'il _____ envie, il n'est jamais venu.",
    options: ["est / a", "soit / ait", "fût / eût", "sera / aura"],
    correctIndex: 2,
    explanation: "'Fût' and 'eût' are the literary imperfect subjunctive forms, used in formal writing with 'soit que... soit que'."
  }
];

// Level thresholds for placement
export const levelThresholds = {
  A1: { min: 0, max: 8 },
  A2: { min: 9, max: 16 },
  B1: { min: 17, max: 28 },
  B2: { min: 29, max: 40 },
  C1: { min: 41, max: 52 },
  C2: { min: 53, max: 999 }
};

// Get questions by difficulty level
export function getQuestionsByDifficulty(difficulty: number): PlacementQuestion[] {
  return placementQuestions.filter(q => q.difficulty === difficulty);
}

// Determine level from score
export function getLevelFromScore(score: number): "A1" | "A2" | "B1" | "B2" | "C1" | "C2" {
  if (score <= levelThresholds.A1.max) return "A1";
  if (score <= levelThresholds.A2.max) return "A2";
  if (score <= levelThresholds.B1.max) return "B1";
  if (score <= levelThresholds.B2.max) return "B2";
  if (score <= levelThresholds.C1.max) return "C1";
  return "C2";
}