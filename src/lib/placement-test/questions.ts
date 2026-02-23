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

// ============================================
// FRENCH QUESTIONS
// ============================================
export const frenchQuestions: PlacementQuestion[] = [
  // A1 Level (Difficulty: 1)
  {
    id: "fr-a1-01",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "Bonjour! Je _____ Marie.",
    options: ["suis", "es", "est", "sommes"],
    correctIndex: 0,
    explanation: "'Je suis' means 'I am'. The verb 'être' conjugates to 'suis' with 'je'."
  },
  {
    id: "fr-a1-02",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "Comment tu _____?",
    options: ["appelle", "appelles", "t'appelles", "s'appelle"],
    correctIndex: 2,
    explanation: "'Comment tu t'appelles?' means 'What is your name?' The reflexive pronoun 'te' contracts to 't'' before a vowel."
  },
  {
    id: "fr-a1-03",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "J'ai _____ chat.",
    options: ["un", "une", "des", "le"],
    correctIndex: 0,
    explanation: "'Chat' (cat) is masculine, so we use 'un' (a/one)."
  },
  {
    id: "fr-a1-04",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "Elle _____ française.",
    options: ["suis", "es", "est", "sont"],
    correctIndex: 2,
    explanation: "'Elle est' means 'She is'. The verb 'être' conjugates to 'est' with 'elle'."
  },
  {
    id: "fr-a1-05",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "Nous _____ à Paris.",
    options: ["habite", "habites", "habitent", "habitons"],
    correctIndex: 3,
    explanation: "'Nous habitons' means 'We live'. The verb 'habiter' conjugates to 'habitons' with 'nous'."
  },
  {
    id: "fr-a1-06",
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
    id: "fr-a2-01",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "Hier, je _____ au cinéma.",
    options: ["vais", "suis allé", "vais aller", "allais"],
    correctIndex: 1,
    explanation: "'Hier' (yesterday) requires the passé composé. 'Je suis allé' means 'I went'."
  },
  {
    id: "fr-a2-02",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "Il fait beau aujourd'hui. _____ sortons?",
    options: ["Nous", "On", "Ils", "Vous"],
    correctIndex: 1,
    explanation: "'On' is commonly used in spoken French to mean 'we'. It's more casual than 'nous'."
  },
  {
    id: "fr-a2-03",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "Je voudrais _____ eau, s'il vous plaît.",
    options: ["de l'", "du", "de la", "des"],
    correctIndex: 0,
    explanation: "'Eau' (water) is feminine and starts with a vowel, so we use 'de l'' for the partitive article."
  },
  {
    id: "fr-a2-04",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "Ma sœur est _____ que moi.",
    options: ["plus grande", "plus grand", "grande", "la plus grande"],
    correctIndex: 0,
    explanation: "'Plus grande que' means 'taller than'. The adjective must agree with the feminine subject 'sœur'."
  },
  {
    id: "fr-a2-05",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "Nous _____ nos devoirs quand il est arrivé.",
    options: ["faisons", "avons fait", "faisions", "ferons"],
    correctIndex: 2,
    explanation: "The imparfait 'faisions' is used for ongoing actions interrupted by another event in the past."
  },
  {
    id: "fr-a2-06",
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
    id: "fr-b1-01",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "Si j'avais de l'argent, je _____ une nouvelle voiture.",
    options: ["achète", "achèterai", "achèterais", "ai acheté"],
    correctIndex: 2,
    explanation: "The conditional 'achèterais' is used with 'si + imparfait' for hypothetical situations."
  },
  {
    id: "fr-b1-02",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "Il faut que tu _____ plus attention en classe.",
    options: ["fais", "fasses", "fera", "ferais"],
    correctIndex: 1,
    explanation: "'Il faut que' requires the subjunctive. 'Fasses' is the subjunctive form of 'faire'."
  },
  {
    id: "fr-b1-03",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "C'est le livre _____ je t'ai parlé.",
    options: ["que", "qui", "dont", "où"],
    correctIndex: 2,
    explanation: "'Dont' is used with verbs that take 'de', like 'parler de' (to talk about)."
  },
  {
    id: "fr-b1-04",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "Après _____ le film, nous sommes allés au restaurant.",
    options: ["voir", "vu", "avoir vu", "voyant"],
    correctIndex: 2,
    explanation: "'Après + infinitif passé' (après avoir vu) expresses an action completed before another."
  },
  {
    id: "fr-b1-05",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "Je doute qu'il _____ venir demain.",
    options: ["peut", "puisse", "pourra", "pourrait"],
    correctIndex: 1,
    explanation: "'Douter que' expresses uncertainty and requires the subjunctive 'puisse'."
  },
  {
    id: "fr-b1-06",
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
    id: "fr-b2-01",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "Il est parti sans que je _____ le voir.",
    options: ["peux", "puisse", "pourrais", "pourrai"],
    correctIndex: 1,
    explanation: "'Sans que' always requires the subjunctive. 'Puisse' is the subjunctive of 'pouvoir'."
  },
  {
    id: "fr-b2-02",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "_____ ses efforts, il n'a pas réussi l'examen.",
    options: ["Malgré", "Bien que", "Quoique", "En dépit de"],
    correctIndex: 3,
    explanation: "'En dépit de' is a more formal way of saying 'despite' and is followed by a noun."
  },
  {
    id: "fr-b2-03",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "C'est la meilleure décision que nous _____ prendre.",
    options: ["avons pu", "ayons pu", "pouvons", "puissions"],
    correctIndex: 1,
    explanation: "After superlatives like 'la meilleure', the subjunctive is required: 'ayons pu'."
  },
  {
    id: "fr-b2-04",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "Il a agi _____ s'il connaissait toute l'histoire.",
    options: ["comme", "comme si", "parce que", "ainsi que"],
    correctIndex: 1,
    explanation: "'Comme si' (as if) is used for hypothetical comparisons and is followed by the imparfait."
  },
  {
    id: "fr-b2-05",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "_____ tu aies raison, je ne suis pas d'accord avec toi.",
    options: ["Bien que", "Parce que", "Pendant que", "Alors que"],
    correctIndex: 0,
    explanation: "'Bien que' (although) requires the subjunctive and expresses concession."
  },
  {
    id: "fr-b2-06",
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
    id: "fr-c1-01",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "_____ qu'il ait beaucoup travaillé, ses résultats restent médiocres.",
    options: ["Bien", "Quoique", "Encore", "Même"],
    correctIndex: 2,
    explanation: "'Encore que' is a literary expression meaning 'although/even though' and requires the subjunctive."
  },
  {
    id: "fr-c1-02",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "Le ministre a annoncé que des mesures _____ prochainement.",
    options: ["seront prises", "seraient prises", "soient prises", "aient été prises"],
    correctIndex: 1,
    explanation: "In reported speech with a past tense main verb, the future becomes conditional: 'seraient prises'."
  },
  {
    id: "fr-c1-03",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "_____ avoir consulté les experts, nous avons décidé de poursuivre.",
    options: ["Après", "Avant", "Pour", "Sans"],
    correctIndex: 0,
    explanation: "'Après avoir + past participle' indicates an action completed before the main action."
  },
  {
    id: "fr-c1-04",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "Il s'est exprimé de manière _____ aucune ambiguïté ne subsiste.",
    options: ["que", "à ce que", "telle que", "si"],
    correctIndex: 2,
    explanation: "'De manière telle que' (in such a way that) is a formal construction expressing result."
  },
  {
    id: "fr-c1-05",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "Peu _____ qu'il fasse beau, nous irons à la plage.",
    options: ["importe", "important", "importait", "a importé"],
    correctIndex: 0,
    explanation: "'Peu importe que' (no matter whether) is a fixed expression with subjunctive."
  },
  {
    id: "fr-c1-06",
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
    id: "fr-c2-01",
    level: "C2",
    difficulty: 6,
    points: 6,
    question: "_____ des circonstances atténuantes, le verdict demeure sévère.",
    options: ["Nonobstant", "Néanmoins", "Toutefois", "Cependant"],
    correctIndex: 0,
    explanation: "'Nonobstant' is a very formal/legal term meaning 'notwithstanding' or 'despite'."
  },
  {
    id: "fr-c2-02",
    level: "C2",
    difficulty: 6,
    points: 6,
    question: "Il a usé de périphrases _____ ne pas froisser son interlocuteur.",
    options: ["pour", "afin de", "de peur de", "histoire de"],
    correctIndex: 2,
    explanation: "'De peur de' (for fear of) best captures the nuance of avoiding offense through circumlocution."
  },
  {
    id: "fr-c2-03",
    level: "C2",
    difficulty: 6,
    points: 6,
    question: "L'orateur a su capter l'attention de son auditoire _____ des métaphores audacieuses.",
    options: ["grâce à", "au moyen de", "à force de", "par le biais de"],
    correctIndex: 3,
    explanation: "'Par le biais de' (by means of/through) is the most sophisticated expression for this context."
  },
  {
    id: "fr-c2-04",
    level: "C2",
    difficulty: 6,
    points: 6,
    question: "Quel registre de langue: \"Il s'est fait avoir.\"",
    options: ["Soutenu", "Courant", "Familier", "Vulgaire"],
    correctIndex: 2,
    explanation: "'Se faire avoir' (to be tricked) is a colloquial/familiar expression, not formal or vulgar."
  },
  {
    id: "fr-c2-05",
    level: "C2",
    difficulty: 6,
    points: 6,
    question: "Soit qu'il _____ occupé, soit qu'il _____ envie, il n'est jamais venu.",
    options: ["est / a", "soit / ait", "fût / eût", "sera / aura"],
    correctIndex: 2,
    explanation: "'Fût' and 'eût' are the literary imperfect subjunctive forms, used in formal writing with 'soit que... soit que'."
  }
];

// ============================================
// SPANISH QUESTIONS
// ============================================
export const spanishQuestions: PlacementQuestion[] = [
  // A1 Level (Difficulty: 1)
  {
    id: "es-a1-01",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "¡Hola! Yo _____ María.",
    options: ["soy", "eres", "es", "somos"],
    correctIndex: 0,
    explanation: "'Yo soy' means 'I am'. The verb 'ser' conjugates to 'soy' with 'yo'."
  },
  {
    id: "es-a1-02",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "¿Cómo te _____?",
    options: ["llama", "llamas", "llamo", "llamamos"],
    correctIndex: 1,
    explanation: "'¿Cómo te llamas?' means 'What is your name?' The verb 'llamarse' conjugates to 'llamas' with 'tú'."
  },
  {
    id: "es-a1-03",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "Tengo _____ gato.",
    options: ["un", "una", "unos", "el"],
    correctIndex: 0,
    explanation: "'Gato' (cat) is masculine, so we use 'un' (a/one)."
  },
  {
    id: "es-a1-04",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "Ella _____ española.",
    options: ["soy", "eres", "es", "son"],
    correctIndex: 2,
    explanation: "'Ella es' means 'She is'. The verb 'ser' conjugates to 'es' with 'ella'."
  },
  {
    id: "es-a1-05",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "Nosotros _____ en Madrid.",
    options: ["vivo", "vives", "viven", "vivimos"],
    correctIndex: 3,
    explanation: "'Nosotros vivimos' means 'We live'. The verb 'vivir' conjugates to 'vivimos' with 'nosotros'."
  },
  {
    id: "es-a1-06",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "¿Cuántos años _____?",
    options: ["tienes", "tiene", "tengo", "tienen"],
    correctIndex: 0,
    explanation: "'¿Cuántos años tienes?' means 'How old are you?' (informal). The verb 'tener' conjugates to 'tienes' with 'tú'."
  },

  // A2 Level (Difficulty: 2)
  {
    id: "es-a2-01",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "Ayer, yo _____ al cine.",
    options: ["voy", "fui", "iré", "iba"],
    correctIndex: 1,
    explanation: "'Ayer' (yesterday) requires the preterite. 'Fui' means 'I went'."
  },
  {
    id: "es-a2-02",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "Hace buen tiempo hoy. ¿_____ salimos?",
    options: ["Nosotros", "Y si", "Ellos", "Ustedes"],
    correctIndex: 1,
    explanation: "'¿Y si salimos?' means 'How about we go out?' It's a common way to make suggestions."
  },
  {
    id: "es-a2-03",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "Quisiera _____ agua, por favor.",
    options: ["un poco de", "un", "una", "unos"],
    correctIndex: 0,
    explanation: "'Un poco de agua' (some water) is the correct way to ask for water politely."
  },
  {
    id: "es-a2-04",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "Mi hermana es _____ que yo.",
    options: ["más alta", "más alto", "alta", "la más alta"],
    correctIndex: 0,
    explanation: "'Más alta que' means 'taller than'. The adjective must agree with the feminine subject 'hermana'."
  },
  {
    id: "es-a2-05",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "_____ la tarea cuando él llegó.",
    options: ["Hago", "Hice", "Hacía", "Haré"],
    correctIndex: 2,
    explanation: "The imperfect 'hacía' is used for ongoing actions interrupted by another event in the past."
  },
  {
    id: "es-a2-06",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "Me levanto _____ las 7 todos los días.",
    options: ["a", "en", "por", "para"],
    correctIndex: 0,
    explanation: "We use 'a' with specific times: 'a las 7' means 'at 7 o'clock'."
  },

  // B1 Level (Difficulty: 3)
  {
    id: "es-b1-01",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "Si tuviera dinero, _____ un coche nuevo.",
    options: ["compro", "compraré", "compraría", "he comprado"],
    correctIndex: 2,
    explanation: "The conditional 'compraría' is used with 'si + imperfect subjunctive' for hypothetical situations."
  },
  {
    id: "es-b1-02",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "Es necesario que tú _____ más atención en clase.",
    options: ["prestas", "prestes", "prestarás", "prestarías"],
    correctIndex: 1,
    explanation: "'Es necesario que' requires the subjunctive. 'Prestes' is the subjunctive form of 'prestar'."
  },
  {
    id: "es-b1-03",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "Es el libro _____ te hablé.",
    options: ["que", "quien", "del que", "donde"],
    correctIndex: 2,
    explanation: "'Del que' is used with verbs that take 'de', like 'hablar de' (to talk about)."
  },
  {
    id: "es-b1-04",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "Después de _____ la película, fuimos al restaurante.",
    options: ["ver", "visto", "haber visto", "viendo"],
    correctIndex: 2,
    explanation: "'Después de + haber + past participle' (después de haber visto) expresses an action completed before another."
  },
  {
    id: "es-b1-05",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "Dudo que él _____ venir mañana.",
    options: ["puede", "pueda", "podrá", "podría"],
    correctIndex: 1,
    explanation: "'Dudar que' expresses uncertainty and requires the subjunctive 'pueda'."
  },
  {
    id: "es-b1-06",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "_____ el mal tiempo, salimos.",
    options: ["A pesar de", "Durante", "Gracias a", "Por culpa de"],
    correctIndex: 0,
    explanation: "'A pesar de' means 'despite' and introduces a contrast with what follows."
  },

  // B2 Level (Difficulty: 4)
  {
    id: "es-b2-01",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "Se fue sin que yo _____ verlo.",
    options: ["puedo", "pudiera", "podría", "podré"],
    correctIndex: 1,
    explanation: "'Sin que' always requires the subjunctive. 'Pudiera' is the imperfect subjunctive of 'poder'."
  },
  {
    id: "es-b2-02",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "_____ sus esfuerzos, no aprobó el examen.",
    options: ["A pesar de", "Aunque", "Si bien", "No obstante"],
    correctIndex: 3,
    explanation: "'No obstante' is a more formal way of saying 'nevertheless/despite' in a sentence."
  },
  {
    id: "es-b2-03",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "Es la mejor decisión que _____ tomar.",
    options: ["hemos podido", "hayamos podido", "podemos", "podamos"],
    correctIndex: 1,
    explanation: "After superlatives like 'la mejor', the subjunctive is required: 'hayamos podido'."
  },
  {
    id: "es-b2-04",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "Actuó _____ conociera toda la historia.",
    options: ["como", "como si", "porque", "así como"],
    correctIndex: 1,
    explanation: "'Como si' (as if) is used for hypothetical comparisons and is followed by the imperfect subjunctive."
  },
  {
    id: "es-b2-05",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "_____ tengas razón, no estoy de acuerdo contigo.",
    options: ["Aunque", "Porque", "Mientras", "Ya que"],
    correctIndex: 0,
    explanation: "'Aunque' (although) can be followed by subjunctive when the outcome is uncertain."
  },
  {
    id: "es-b2-06",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "El proyecto _____ en marcha desde hacía tres meses cuando lo cancelaron.",
    options: ["estaba", "estuvo", "estará", "estaría"],
    correctIndex: 0,
    explanation: "The imperfect 'estaba' describes an ongoing state in the past before another event."
  },

  // C1 Level (Difficulty: 5)
  {
    id: "es-c1-01",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "_____ que haya trabajado mucho, sus resultados siguen siendo mediocres.",
    options: ["Bien", "Aunque", "Aun", "Si bien"],
    correctIndex: 2,
    explanation: "'Aun que' (even though) is a literary expression requiring the subjunctive."
  },
  {
    id: "es-c1-02",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "El ministro anunció que se _____ medidas próximamente.",
    options: ["tomarán", "tomarían", "tomen", "hayan tomado"],
    correctIndex: 1,
    explanation: "In reported speech with a past tense main verb, the future becomes conditional: 'tomarían'."
  },
  {
    id: "es-c1-03",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "_____ haber consultado a los expertos, decidimos continuar.",
    options: ["Tras", "Antes de", "Para", "Sin"],
    correctIndex: 0,
    explanation: "'Tras haber + past participle' indicates an action completed before the main action."
  },
  {
    id: "es-c1-04",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "Se expresó de manera _____ no quedara ninguna ambigüedad.",
    options: ["que", "a que", "tal que", "tan"],
    correctIndex: 2,
    explanation: "'De manera tal que' (in such a way that) is a formal construction expressing result."
  },
  {
    id: "es-c1-05",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "No _____ que haga buen tiempo, iremos a la playa.",
    options: ["importa", "importando", "importaba", "ha importado"],
    correctIndex: 0,
    explanation: "'No importa que' (no matter whether) is a fixed expression with subjunctive."
  },
  {
    id: "es-c1-06",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "\"Por más que estudie, no lo logra.\" ¿Cuál es el significado?",
    options: ["Estudia poco", "Estudia mucho pero sin éxito", "Va a estudiar pronto", "Dejó de estudiar"],
    correctIndex: 1,
    explanation: "'Por más que + subjunctive' means doing something in vain, without success."
  },

  // C2 Level (Difficulty: 6)
  {
    id: "es-c2-01",
    level: "C2",
    difficulty: 6,
    points: 6,
    question: "_____ las circunstancias atenuantes, el veredicto sigue siendo severo.",
    options: ["No obstante", "Sin embargo", "Empero", "Mas"],
    correctIndex: 2,
    explanation: "'Empero' is an archaic/literary term meaning 'however' or 'nevertheless'."
  },
  {
    id: "es-c2-02",
    level: "C2",
    difficulty: 6,
    points: 6,
    question: "Usó circunloquios _____ no ofender a su interlocutor.",
    options: ["para", "a fin de", "por temor a", "con tal de"],
    correctIndex: 2,
    explanation: "'Por temor a' (for fear of) best captures the nuance of avoiding offense through circumlocution."
  },
  {
    id: "es-c2-03",
    level: "C2",
    difficulty: 6,
    points: 6,
    question: "El orador supo captar la atención de su audiencia _____ metáforas audaces.",
    options: ["gracias a", "por medio de", "a fuerza de", "mediante"],
    correctIndex: 3,
    explanation: "'Mediante' (by means of/through) is the most formal expression for this context."
  },
  {
    id: "es-c2-04",
    level: "C2",
    difficulty: 6,
    points: 6,
    question: "¿Qué registro de lengua es \"Lo timaron\"?",
    options: ["Culto", "Estándar", "Coloquial", "Vulgar"],
    correctIndex: 2,
    explanation: "'Timar' (to swindle) is a colloquial expression, not formal or vulgar."
  },
  {
    id: "es-c2-05",
    level: "C2",
    difficulty: 6,
    points: 6,
    question: "Ora _____ ocupado, ora no _____ ganas, nunca vino.",
    options: ["está / tiene", "esté / tenga", "estuviera / tuviera", "estará / tendrá"],
    correctIndex: 2,
    explanation: "'Ora... ora' with imperfect subjunctive is a literary construction expressing alternatives."
  }
];

// ============================================
// ENGLISH QUESTIONS
// ============================================
export const englishQuestions: PlacementQuestion[] = [
  // A1 Level (Difficulty: 1)
  {
    id: "en-a1-01",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "Hello! I _____ Maria.",
    options: ["am", "is", "are", "be"],
    correctIndex: 0,
    explanation: "'I am' is the correct form. The verb 'to be' conjugates to 'am' with 'I'."
  },
  {
    id: "en-a1-02",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "What is _____ name?",
    options: ["you", "your", "yours", "you're"],
    correctIndex: 1,
    explanation: "'Your' is the possessive adjective used before a noun."
  },
  {
    id: "en-a1-03",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "I have _____ cat.",
    options: ["a", "an", "the", "some"],
    correctIndex: 0,
    explanation: "'A' is used before consonant sounds. 'Cat' starts with a consonant."
  },
  {
    id: "en-a1-04",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "She _____ from France.",
    options: ["am", "are", "is", "be"],
    correctIndex: 2,
    explanation: "'She is' is correct. The verb 'to be' conjugates to 'is' with 'she'."
  },
  {
    id: "en-a1-05",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "We _____ in Paris.",
    options: ["live", "lives", "living", "lived"],
    correctIndex: 0,
    explanation: "'We live' is correct. The base form is used with 'we'."
  },
  {
    id: "en-a1-06",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "How old _____ you?",
    options: ["is", "are", "am", "be"],
    correctIndex: 1,
    explanation: "'Are' is used with 'you' in questions."
  },

  // A2 Level (Difficulty: 2)
  {
    id: "en-a2-01",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "Yesterday, I _____ to the cinema.",
    options: ["go", "went", "going", "gone"],
    correctIndex: 1,
    explanation: "'Yesterday' requires the past simple. 'Went' is the past tense of 'go'."
  },
  {
    id: "en-a2-02",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "The weather is nice today. _____ we go out?",
    options: ["Will", "Shall", "Do", "Are"],
    correctIndex: 1,
    explanation: "'Shall we' is used to make suggestions in British English."
  },
  {
    id: "en-a2-03",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "I would like _____ water, please.",
    options: ["some", "a", "an", "the"],
    correctIndex: 0,
    explanation: "'Some' is used with uncountable nouns like 'water' in requests."
  },
  {
    id: "en-a2-04",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "My sister is _____ than me.",
    options: ["taller", "more tall", "tallest", "most tall"],
    correctIndex: 0,
    explanation: "'Taller' is the comparative form. Short adjectives add '-er'."
  },
  {
    id: "en-a2-05",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "I _____ my homework when he arrived.",
    options: ["do", "did", "was doing", "will do"],
    correctIndex: 2,
    explanation: "The past continuous 'was doing' is used for ongoing actions interrupted by another event."
  },
  {
    id: "en-a2-06",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "I wake up _____ 7 o'clock every day.",
    options: ["at", "in", "on", "for"],
    correctIndex: 0,
    explanation: "We use 'at' with specific times: 'at 7 o'clock'."
  },

  // B1 Level (Difficulty: 3)
  {
    id: "en-b1-01",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "If I had money, I _____ a new car.",
    options: ["buy", "will buy", "would buy", "have bought"],
    correctIndex: 2,
    explanation: "The conditional 'would buy' is used with 'if + past simple' for hypothetical situations."
  },
  {
    id: "en-b1-02",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "It's important that he _____ on time.",
    options: ["arrives", "arrive", "will arrive", "arriving"],
    correctIndex: 1,
    explanation: "The subjunctive 'arrive' (base form) is used after 'it's important that'."
  },
  {
    id: "en-b1-03",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "This is the book _____ I told you about.",
    options: ["what", "who", "which", "whose"],
    correctIndex: 2,
    explanation: "'Which' or 'that' is used for things. 'About which I told you' in formal English."
  },
  {
    id: "en-b1-04",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "After _____ the movie, we went to a restaurant.",
    options: ["watch", "watched", "watching", "to watch"],
    correctIndex: 2,
    explanation: "'After + gerund' (after watching) expresses an action completed before another."
  },
  {
    id: "en-b1-05",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "I doubt that he _____ come tomorrow.",
    options: ["can", "will", "would", "shall"],
    correctIndex: 1,
    explanation: "'Will' is used for future predictions, even with doubt."
  },
  {
    id: "en-b1-06",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "_____ the bad weather, we went out.",
    options: ["Despite", "Although", "Because of", "Due to"],
    correctIndex: 0,
    explanation: "'Despite' means 'in spite of' and introduces a contrast. It's followed by a noun."
  },

  // B2 Level (Difficulty: 4)
  {
    id: "en-b2-01",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "He left without my _____ able to see him.",
    options: ["be", "being", "been", "to be"],
    correctIndex: 1,
    explanation: "After prepositions, we use the gerund: 'without being'."
  },
  {
    id: "en-b2-02",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "_____ his efforts, he didn't pass the exam.",
    options: ["Despite", "Although", "However", "Notwithstanding"],
    correctIndex: 3,
    explanation: "'Notwithstanding' is a formal way of saying 'despite' and is followed by a noun."
  },
  {
    id: "en-b2-03",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "It's the best decision we _____ ever made.",
    options: ["had", "have", "has", "having"],
    correctIndex: 1,
    explanation: "Present perfect 'have made' is used with superlatives referring to life experience."
  },
  {
    id: "en-b2-04",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "He acted as if he _____ the whole story.",
    options: ["knows", "knew", "has known", "knowing"],
    correctIndex: 1,
    explanation: "'As if' is followed by past simple for hypothetical situations (subjunctive mood)."
  },
  {
    id: "en-b2-05",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "_____ you may be right, I still disagree.",
    options: ["Although", "Because", "While", "Since"],
    correctIndex: 0,
    explanation: "'Although' introduces a concession and is followed by a clause."
  },
  {
    id: "en-b2-06",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "The project _____ for three months when they cancelled it.",
    options: ["was running", "had been running", "has been running", "ran"],
    correctIndex: 1,
    explanation: "Past perfect continuous 'had been running' shows duration before another past event."
  },

  // C1 Level (Difficulty: 5)
  {
    id: "en-c1-01",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "_____ he worked hard, his results remain mediocre.",
    options: ["Although", "Despite", "Much as", "However"],
    correctIndex: 2,
    explanation: "'Much as' is a more emphatic way of saying 'although' in formal English."
  },
  {
    id: "en-c1-02",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "The minister announced that measures _____ taken shortly.",
    options: ["will be", "would be", "are", "were"],
    correctIndex: 1,
    explanation: "In reported speech with a past tense main verb, 'will' becomes 'would'."
  },
  {
    id: "en-c1-03",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "_____ consulted the experts, we decided to proceed.",
    options: ["Having", "Being", "To have", "Have"],
    correctIndex: 0,
    explanation: "'Having + past participle' is a perfect participle clause showing completed action."
  },
  {
    id: "en-c1-04",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "He expressed himself in such a way _____ no ambiguity remained.",
    options: ["that", "as", "which", "so"],
    correctIndex: 0,
    explanation: "'In such a way that' is a correlative construction expressing result."
  },
  {
    id: "en-c1-05",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "_____ the weather, we'll go to the beach.",
    options: ["Whatever", "However", "Wherever", "Whenever"],
    correctIndex: 0,
    explanation: "'Whatever the weather' means 'no matter what the weather is like'."
  },
  {
    id: "en-c1-06",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "\"Try as he might, he couldn't succeed.\" What does this mean?",
    options: ["He didn't try", "He tried hard but failed", "He will try soon", "He stopped trying"],
    correctIndex: 1,
    explanation: "'Try as he might' is an inverted concessive clause meaning 'although he tried hard'."
  },

  // C2 Level (Difficulty: 6)
  {
    id: "en-c2-01",
    level: "C2",
    difficulty: 6,
    points: 6,
    question: "_____ the mitigating circumstances, the verdict remains severe.",
    options: ["Notwithstanding", "Nevertheless", "Albeit", "Whereas"],
    correctIndex: 0,
    explanation: "'Notwithstanding' is a formal/legal term meaning 'despite'."
  },
  {
    id: "en-c2-02",
    level: "C2",
    difficulty: 6,
    points: 6,
    question: "He used circumlocution _____ offend his interlocutor.",
    options: ["so as not to", "in order to", "lest he", "for fear of"],
    correctIndex: 2,
    explanation: "'Lest' is an archaic/formal conjunction meaning 'for fear that' and takes subjunctive."
  },
  {
    id: "en-c2-03",
    level: "C2",
    difficulty: 6,
    points: 6,
    question: "The speaker captured the audience's attention _____ bold metaphors.",
    options: ["through", "by means of", "via", "by dint of"],
    correctIndex: 3,
    explanation: "'By dint of' is a formal expression meaning 'by means of' or 'through the force of'."
  },
  {
    id: "en-c2-04",
    level: "C2",
    difficulty: 6,
    points: 6,
    question: "What register is \"He got done over\"?",
    options: ["Formal", "Standard", "Colloquial", "Archaic"],
    correctIndex: 2,
    explanation: "'Got done over' (was cheated/beaten) is colloquial British slang."
  },
  {
    id: "en-c2-05",
    level: "C2",
    difficulty: 6,
    points: 6,
    question: "_____ he busy, _____ he unwilling, he never came.",
    options: ["Whether / or", "Be he / be he", "If / if", "Either / or"],
    correctIndex: 1,
    explanation: "'Be he... be he' is a literary subjunctive construction meaning 'whether he was... or'."
  }
];

// ============================================
// GERMAN QUESTIONS
// ============================================
export const germanQuestions: PlacementQuestion[] = [
  // A1 Level (Difficulty: 1)
  {
    id: "de-a1-01",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "Hallo! Ich _____ Maria.",
    options: ["bin", "bist", "ist", "sind"],
    correctIndex: 0,
    explanation: "'Ich bin' means 'I am'. The verb 'sein' conjugates to 'bin' with 'ich'."
  },
  {
    id: "de-a1-02",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "Wie _____ du?",
    options: ["heißt", "heiße", "heißen", "heißt"],
    correctIndex: 0,
    explanation: "'Wie heißt du?' means 'What is your name?' The verb 'heißen' conjugates to 'heißt' with 'du'."
  },
  {
    id: "de-a1-03",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "Ich habe _____ Katze.",
    options: ["eine", "ein", "einen", "einer"],
    correctIndex: 0,
    explanation: "'Katze' (cat) is feminine, so we use 'eine' in the accusative case."
  },
  {
    id: "de-a1-04",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "Sie _____ aus Frankreich.",
    options: ["bin", "bist", "ist", "sind"],
    correctIndex: 2,
    explanation: "'Sie ist' means 'She is'. The verb 'sein' conjugates to 'ist' with 'sie' (she)."
  },
  {
    id: "de-a1-05",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "Wir _____ in Berlin.",
    options: ["wohne", "wohnst", "wohnt", "wohnen"],
    correctIndex: 3,
    explanation: "'Wir wohnen' means 'We live'. The verb 'wohnen' conjugates to 'wohnen' with 'wir'."
  },
  {
    id: "de-a1-06",
    level: "A1",
    difficulty: 1,
    points: 1,
    question: "Wie alt _____ du?",
    options: ["bin", "bist", "ist", "sind"],
    correctIndex: 1,
    explanation: "'Wie alt bist du?' means 'How old are you?' The verb 'sein' conjugates to 'bist' with 'du'."
  },

  // A2 Level (Difficulty: 2)
  {
    id: "de-a2-01",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "Gestern _____ ich ins Kino gegangen.",
    options: ["habe", "bin", "war", "hatte"],
    correctIndex: 1,
    explanation: "'Gehen' uses 'sein' as auxiliary. 'Ich bin gegangen' means 'I went'."
  },
  {
    id: "de-a2-02",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "Das Wetter ist schön heute. _____ wir spazieren?",
    options: ["Werden", "Sollen", "Wollen", "Können"],
    correctIndex: 2,
    explanation: "'Wollen wir' is used to make suggestions, like 'Shall we' in English."
  },
  {
    id: "de-a2-03",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "Ich möchte _____ Wasser, bitte.",
    options: ["etwas", "ein", "eine", "einen"],
    correctIndex: 0,
    explanation: "'Etwas Wasser' (some water) is correct. 'Etwas' is used with uncountable nouns."
  },
  {
    id: "de-a2-04",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "Meine Schwester ist _____ als ich.",
    options: ["größer", "großer", "am größten", "mehr groß"],
    correctIndex: 0,
    explanation: "'Größer als' means 'taller than'. German uses '-er' for comparatives."
  },
  {
    id: "de-a2-05",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "Ich _____ meine Hausaufgaben, als er ankam.",
    options: ["mache", "machte", "habe gemacht", "werde machen"],
    correctIndex: 1,
    explanation: "The simple past 'machte' is used for ongoing actions in the past in written German."
  },
  {
    id: "de-a2-06",
    level: "A2",
    difficulty: 2,
    points: 2,
    question: "Ich stehe jeden Tag _____ 7 Uhr auf.",
    options: ["um", "in", "an", "für"],
    correctIndex: 0,
    explanation: "We use 'um' with specific times: 'um 7 Uhr' means 'at 7 o'clock'."
  },

  // B1 Level (Difficulty: 3)
  {
    id: "de-b1-01",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "Wenn ich Geld hätte, _____ ich ein neues Auto kaufen.",
    options: ["werde", "würde", "will", "wollte"],
    correctIndex: 1,
    explanation: "The Konjunktiv II 'würde kaufen' is used for hypothetical situations."
  },
  {
    id: "de-b1-02",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "Es ist wichtig, dass du mehr Aufmerksamkeit _____.",
    options: ["schenkst", "schenkest", "schenken", "geschenkt"],
    correctIndex: 0,
    explanation: "After 'dass', the verb goes to the end. Present tense 'schenkst' is used here."
  },
  {
    id: "de-b1-03",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "Das ist das Buch, _____ ich dir erzählt habe.",
    options: ["das", "dem", "von dem", "dessen"],
    correctIndex: 2,
    explanation: "'Von dem' is used because 'erzählen von' requires the dative with 'von'."
  },
  {
    id: "de-b1-04",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "Nachdem ich den Film _____ hatte, gingen wir ins Restaurant.",
    options: ["sehe", "gesehen", "sah", "sehend"],
    correctIndex: 1,
    explanation: "'Nachdem' with past perfect: 'nachdem ich gesehen hatte' (after I had seen)."
  },
  {
    id: "de-b1-05",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "Ich bezweifle, dass er morgen kommen _____.",
    options: ["kann", "könne", "wird", "würde"],
    correctIndex: 2,
    explanation: "'Wird kommen' expresses future. Doubt doesn't require subjunctive in German."
  },
  {
    id: "de-b1-06",
    level: "B1",
    difficulty: 3,
    points: 3,
    question: "_____ des schlechten Wetters gingen wir spazieren.",
    options: ["Trotz", "Während", "Wegen", "Dank"],
    correctIndex: 0,
    explanation: "'Trotz' means 'despite' and takes the genitive case."
  },

  // B2 Level (Difficulty: 4)
  {
    id: "de-b2-01",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "Er ging weg, ohne dass ich ihn _____ konnte.",
    options: ["sehe", "sehen", "sähe", "gesehen"],
    correctIndex: 1,
    explanation: "'Ohne dass' introduces a clause; 'sehen konnte' with infinitive at the end."
  },
  {
    id: "de-b2-02",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "_____ seiner Bemühungen bestand er die Prüfung nicht.",
    options: ["Trotz", "Obwohl", "Dennoch", "Ungeachtet"],
    correctIndex: 3,
    explanation: "'Ungeachtet' is a formal way of saying 'despite' and takes genitive."
  },
  {
    id: "de-b2-03",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "Das ist die beste Entscheidung, die wir je _____ haben.",
    options: ["treffen", "getroffen", "trafen", "träfen"],
    correctIndex: 1,
    explanation: "Perfect tense with superlative: 'die wir getroffen haben' (that we have made)."
  },
  {
    id: "de-b2-04",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "Er handelte, als ob er die ganze Geschichte _____.",
    options: ["kennt", "kannte", "kennte", "gekannt hätte"],
    correctIndex: 2,
    explanation: "'Als ob' requires Konjunktiv II. 'Kennte' is the subjunctive form (or 'kennen würde')."
  },
  {
    id: "de-b2-05",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "_____ du recht haben magst, bin ich nicht einverstanden.",
    options: ["Obwohl", "Weil", "Während", "Da"],
    correctIndex: 0,
    explanation: "'Obwohl' (although) introduces a concessive clause."
  },
  {
    id: "de-b2-06",
    level: "B2",
    difficulty: 4,
    points: 4,
    question: "Das Projekt _____ seit drei Monaten, als man es absagte.",
    options: ["lief", "war gelaufen", "läuft", "würde laufen"],
    correctIndex: 0,
    explanation: "Simple past 'lief' describes an ongoing state before another past event."
  },

  // C1 Level (Difficulty: 5)
  {
    id: "de-c1-01",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "_____ er auch viel gearbeitet hat, bleiben seine Ergebnisse mittelmäßig.",
    options: ["Obwohl", "Obgleich", "Wenngleich", "Sosehr"],
    correctIndex: 3,
    explanation: "'Sosehr' (however much) is a more emphatic concessive conjunction."
  },
  {
    id: "de-c1-02",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "Der Minister kündigte an, dass Maßnahmen _____ würden.",
    options: ["ergriffen werden", "ergriffen würden", "ergreifen", "ergriffen"],
    correctIndex: 1,
    explanation: "Reported speech with Konjunktiv I or II: 'ergriffen würden' (would be taken)."
  },
  {
    id: "de-c1-03",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "_____ die Experten konsultiert, beschlossen wir fortzufahren.",
    options: ["Nachdem wir", "Haben wir", "Wir hatten", "Konsultiert"],
    correctIndex: 0,
    explanation: "'Nachdem wir... konsultiert hatten' is the correct temporal clause structure."
  },
  {
    id: "de-c1-04",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "Er drückte sich so aus, _____ keine Zweideutigkeit blieb.",
    options: ["dass", "damit", "sodass", "auf dass"],
    correctIndex: 2,
    explanation: "'Sodass' (so that/with the result that) expresses consequence."
  },
  {
    id: "de-c1-05",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "_____ das Wetter auch sein mag, wir gehen zum Strand.",
    options: ["Wie", "Was", "Wie auch immer", "Welches"],
    correctIndex: 2,
    explanation: "'Wie auch immer das Wetter sein mag' means 'whatever the weather may be'."
  },
  {
    id: "de-c1-06",
    level: "C1",
    difficulty: 5,
    points: 5,
    question: "\"Er hat sich vergeblich bemüht.\" Was bedeutet das?",
    options: ["Er hat wenig versucht", "Er hat viel versucht, aber ohne Erfolg", "Er wird bald versuchen", "Er hat aufgehört zu versuchen"],
    correctIndex: 1,
    explanation: "'Vergeblich' means 'in vain' - he tried hard but without success."
  },

  // C2 Level (Difficulty: 6)
  {
    id: "de-c2-01",
    level: "C2",
    difficulty: 6,
    points: 6,
    question: "_____ der mildernden Umstände bleibt das Urteil streng.",
    options: ["Unbeschadet", "Nichtsdestotrotz", "Gleichwohl", "Indessen"],
    correctIndex: 0,
    explanation: "'Unbeschadet' is a formal/legal term meaning 'notwithstanding' (+ genitive)."
  },
  {
    id: "de-c2-02",
    level: "C2",
    difficulty: 6,
    points: 6,
    question: "Er bediente sich der Umschreibungen, _____ seinen Gesprächspartner nicht zu kränken.",
    options: ["um", "damit", "auf dass", "um... willen"],
    correctIndex: 0,
    explanation: "'Um... nicht zu + infinitive' expresses purpose (in order not to)."
  },
  {
    id: "de-c2-03",
    level: "C2",
    difficulty: 6,
    points: 6,
    question: "Der Redner verstand es, die Aufmerksamkeit seines Publikums _____ kühner Metaphern zu fesseln.",
    options: ["durch", "mittels", "kraft", "vermöge"],
    correctIndex: 2,
    explanation: "'Kraft' (by virtue of/by means of) is a formal preposition taking genitive."
  },
  {
    id: "de-c2-04",
    level: "C2",
    difficulty: 6,
    points: 6,
    question: "Welches Sprachregister ist \"Der wurde übers Ohr gehauen\"?",
    options: ["Gehoben", "Standardsprachlich", "Umgangssprachlich", "Vulgär"],
    correctIndex: 2,
    explanation: "'Übers Ohr gehauen werden' (to be cheated) is colloquial German."
  },
  {
    id: "de-c2-05",
    level: "C2",
    difficulty: 6,
    points: 6,
    question: "Sei es, dass er beschäftigt _____, sei es, dass er keine Lust _____, er kam nie.",
    options: ["ist / hat", "sei / habe", "war / hatte", "wäre / hätte"],
    correctIndex: 3,
    explanation: "'Sei es, dass... wäre/hätte' uses Konjunktiv II for hypothetical alternatives."
  }
];

// ============================================
// HELPER FUNCTIONS
// ============================================

// Level thresholds for placement
export const levelThresholds = {
  A1: { min: 0, max: 8 },
  A2: { min: 9, max: 16 },
  B1: { min: 17, max: 28 },
  B2: { min: 29, max: 40 },
  C1: { min: 41, max: 52 },
  C2: { min: 53, max: 999 }
};

// Get questions by language
export function getQuestionsByLanguage(language: string): PlacementQuestion[] {
  switch (language) {
    case "fr":
      return frenchQuestions;
    case "es":
      return spanishQuestions;
    case "en":
      return englishQuestions;
    case "de":
      return germanQuestions;
    default:
      return frenchQuestions; // Default fallback
  }
}

// Get questions by difficulty level (for a specific language)
export function getQuestionsByDifficulty(language: string, difficulty: number): PlacementQuestion[] {
  const questions = getQuestionsByLanguage(language);
  return questions.filter(q => q.difficulty === difficulty);
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

// Legacy export for backwards compatibility
export const placementQuestions = frenchQuestions;