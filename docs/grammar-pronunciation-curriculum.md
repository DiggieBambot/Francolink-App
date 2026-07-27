# French Grammar & Pronunciation — Curriculum (expert-authored)

Status: **authored, awaiting sign-off**. This is the pedagogical source of truth. The
build (v2 `tutor_lessons` content + `grammar_explainer` section + discrimination quiz)
implements *this* — AI fills examples/exercise variants **from these specs**, never
originates the ordering, the contrasts, or the error lists.

Scope v1: **French only** (en/… is a later mechanical repeat). Learner profile assumed:
**English-L1 adult**, self-study + tutor-led. Every "signature error" below is chosen
because it is either (a) an English-interference error or (b) a high-frequency
intralingual French error — not a generic "be careful" note.

## How to read a lesson spec

Each grammar point is one lesson with the locked 5-part arc:

1. **In context** — the anchor: 2–3 sentences the learner can already mostly read, with
   the target structure in **bold**. Form follows use; never a cold rule.
2. **The pattern** — plain explanation + the table below (this is the `grammar_explainer`
   section: prose + table + student-visible common mistakes).
3. **Guided practice** — controlled: `fill_in_blank_dialogue` (recognition) +
   `word_order` (production).
4. **Produce it** — `free_response` prompts engineered to *force* the target structure.
5. (Tutor layer) talking points + the error flags to listen for.

"AI drafts" = example sentences, extra fill-blank items, extra word-order items, and
free-response prompts, all constrained by the spec (target forms, vocab ceiling, the
listed mistakes). Human review before publish.

Vocabulary ceiling for A1: keep to high-frequency concrete words already in the A1
conversation course (greetings, family, food, numbers, common -er verbs). Do not
introduce a new tense to illustrate a point below its own lesson.

---

# PART 1 — GRAMMAR

## Expert ordering note (one deviation from the draft)

The draft plan lists **Articles (4)** before **Noun gender & number (5)**. That is
backwards for acquisition: a learner cannot choose `le` vs `la` or `un` vs `une`
without first knowing the noun has a gender. **Recommended A1 order swaps them** →
gender/number becomes the article lesson's prerequisite. Partitive (`du/de la`) is
formally A2 in the CEFR but is retained late in A1 here because A1 food/café vocabulary
demands it ("je voudrais **du** café"); it is taught as a recognition-first pattern, not
a full system. Flag if you'd rather defer partitive to A2.

**Locked A1 teaching order:** 1 être → 2 avoir → 3 -er verbs → 4 gender & number →
5 articles → 6 adjective agreement → 7 negation → 8 questions → 9 possessives →
10 aller + futur proche → 11 faire/venir/prendre → 12 prepositions of place →
13 il y a → 14 partitive.

---

## A1

### A1-01 — Subject pronouns + **être**

- **CEFR can-do:** I can identify myself and others and say what/who someone is
  (*Je suis étudiant. Elle est française.*).
- **Anchor (In context):**
  > **Je suis** Marie. **Tu es** étudiant ? — Non, **je suis** professeur. Paul et moi,
  > **nous sommes** amis.
- **The pattern — conjugation of *être* (to be):**

  | Pronoun | *être* | English | TTS |
  |---|---|---|---|
  | je | **suis** | I am | je suis |
  | tu | **es** | you are (informal) | tu es |
  | il / elle / on | **est** | he / she / one is | il est |
  | nous | **sommes** | we are | nous sommes |
  | vous | **êtes** | you are (formal/plural) | vous êtes |
  | ils / elles | **sont** | they are | ils sont |

  Teaching points: `on` = "we" in everyday speech and takes the **il/elle** form.
  `tu` vs `vous` is the register axis (already met in greetings). Liaison in
  **vous‿êtes** /vu.zɛt/ and **ils‿ont**-type forms is flagged, taught fully in
  pronunciation.
- **Signature errors (student-visible):**
  1. ✗ *Je suis vingt ans.* → ✓ *J'ai vingt ans.* — **age uses `avoir`, not `être`**
     (English "I **am** 20" interference). Previewed here, taught in A1-02.
  2. ✗ *Je suis d'accord avec toi... Je suis froid.* meaning "I am cold" → ✓ *J'ai
     froid.* — states like cold/hungry/afraid use `avoir`.
  3. ✗ *Tu es / Il est* dropped subject: ✗ *Suis étudiant.* → ✓ *Je suis étudiant.* —
     French **requires** the subject pronoun (unlike Spanish/Italian, and unlike English
     imperatives).
- **Guided practice:** fill-blank a short café/classroom dialogue with the six forms;
  word-order: `étudiant / je / suis` → *Je suis étudiant.*
- **Produce it:** "Introduce yourself and two people you know using *être* three ways."
- **Tutor flags:** listen for `je suis` + age; listen for dropped `il/elle`.

### A1-02 — **avoir**

- **CEFR can-do:** I can say what I have, my age, and describe states (hunger, etc.).
- **Anchor:**
  > **J'ai** un frère et **j'ai** deux chats. Tu **as** quel âge ? — **J'ai** vingt ans.
  > Il **a** faim.
- **The pattern — *avoir* (to have):**

  | Pronoun | *avoir* | English | TTS |
  |---|---|---|---|
  | je (**j'**) | **ai** | I have | j'ai |
  | tu | **as** | you have | tu as |
  | il / elle / on | **a** | he/she/one has | il a |
  | nous | **avons** | we have | nous avons |
  | vous | **avez** | you have | vous avez |
  | ils / elles | **ont** | they have | ils ont |

  Teaching points: elision **je → j'** before a vowel (*j'ai*). The fixed `avoir`
  expressions: **avoir … ans** (age), **avoir faim / soif / froid / chaud / peur /
  raison**. Contrast table with `être` (identity/description = être; possession, age,
  bodily states = avoir).
- **Signature errors:**
  1. ✗ *Je suis 20 ans.* → ✓ *J'ai 20 ans.* (the payoff of A1-01's preview).
  2. ✗ *Je suis faim / froid.* → ✓ *J'ai faim / froid.*
  3. ✗ *Je ai* (no elision) → ✓ *J'ai* — obligatory elision before the vowel.
- **Guided practice:** age/possession fill-blank; word-order building *avoir* expressions.
- **Produce it:** "Say your age, what you have (family/pets/objects), and one state."
- **Tutor flags:** missing elision; être/avoir swap on age & states.

### A1-03 — Regular **-er** verbs (present)

- **CEFR can-do:** I can talk about routines and likes with the biggest French verb class.
- **Anchor:**
  > J'**habite** à Lyon. Je **parle** français et j'**aime** le café. Nous **travaillons**
  > ensemble.
- **The pattern — stem + endings** (drop -er, add endings). Model: **parler**:

  | Pronoun | ending | *parler* | TTS |
  |---|---|---|---|
  | je | **-e** | parle | je parle |
  | tu | **-es** | parles | tu parles |
  | il/elle/on | **-e** | parle | il parle |
  | nous | **-ons** | parlons | nous parlons |
  | vous | **-ez** | parlez | vous parlez |
  | ils/elles | **-ent** | parlent | ils parlent |

  **Critical pronunciation fact (teach explicitly):** the endings **-e, -es, -ent** are
  all **silent** — *parle, parles, parlent* sound identical /paʁl/. Only *parlons*
  /-ɔ̃/ and *parlez* /-e/ are audibly different. Common A1 -er verbs: *habiter, aimer,
  parler, travailler, regarder, manger, écouter, jouer, étudier*.
- **Signature errors:**
  1. ✗ *je parles / il parles* → ✓ *je parle / il parle* — spelling the silent endings
     wrong because they all sound the same. High-frequency written error.
  2. ✗ pronouncing *-ent*: saying *ils parlENT* out loud → ✓ silent /paʁl/. English/Latin
     interference.
  3. ✗ *j'aime le café* dropped article: ✗ *j'aime café* → ✓ *j'aime **le** café* —
     generic likes take the definite article (previews A1-05).
- **Guided practice:** conjugation fill-blank across pronouns; word-order routine sentences.
- **Produce it:** "Describe your day and three things you like, using four -er verbs."
- **Tutor flags:** audible *-ent*; wrong written endings; missing article after *aimer*.

### A1-04 — Noun gender & number

- **CEFR can-do:** I know every French noun is masculine or feminine and can form plurals.
- **Anchor:**
  > **un** livre, **une** table, **des** livres. **le** garçon, **la** fille, **les**
  > enfants.
- **The pattern:** every noun has a **grammatical gender** (not tied to meaning — *un
  livre* m., *une table* f.). Plurals usually add **-s** (silent). Endings that *tend*
  masculine (**-age, -ment, -eau, -isme**) vs feminine (**-tion, -sion, -té, -ette,
  -ée**) — taught as **tendencies, not laws**, with high-frequency exceptions
  (*le musée, la page*).

  | | masculine | feminine |
  |---|---|---|
  | singular | un/le livre | une/la table |
  | plural | des/les livres | des/les tables |

- **Signature errors:**
  1. ✗ assuming gender = biological/logical sex for objects → ✓ gender is grammatical and
     must be **learned with the noun** (teach nouns *with* their article, never bare).
  2. ✗ pronouncing the plural **-s** → ✓ it is silent; plurality is heard from the
     **article** (*le*/*les*, *un*/*des*), not the noun.
  3. ✗ *le eau* → ✓ *l'eau* (elision before vowel; previews articles).
- **Guided practice:** gender-sort matching; singular↔plural transformation.
- **Produce it:** "Label six things around you with the correct un/une."
- **Tutor flags:** bare nouns; audible plural -s; guessing gender by meaning.

### A1-05 — Articles: definite (le/la/les) & indefinite (un/une/des)

- **CEFR can-do:** I can choose the right article for specific vs non-specific, and use
  the definite article for likes and generalities.
- **Anchor:**
  > C'est **un** café. **Le** café est bon. J'aime **le** café. **Les** croissants sont
  > **des** viennoiseries.
- **The pattern:**

  | | masc. sing. | fem. sing. | before vowel | plural |
  |---|---|---|---|---|
  | **definite** (the / general) | le | la | **l'** | les |
  | **indefinite** (a / some) | un | une | un/une | des |

  Key uses: **definite** = specific ("*the* café we know") **and** generalities/likes
  ("j'aime **le** café" = coffee in general). **indefinite** = one/some non-specific.
  Elision **le/la → l'** before vowel or mute h (*l'homme*).
- **Signature errors:**
  1. ✗ *j'aime café / j'aime un café* for "I like coffee" → ✓ *j'aime **le** café* —
     English uses no article for generalities; French uses the **definite**.
  2. ✗ *des* → *de* not yet an issue here, but ✗ *un des livres* mis-selection; focus on
     un/une agreement with gender from A1-04.
  3. ✗ *le eau, la homme* → ✓ *l'eau, l'homme* (elision, incl. mute h).
- **Guided practice:** article-choice fill-blank (specific vs general); word-order.
- **Produce it:** "Say what you like in general, then point at three specific things."
- **Tutor flags:** missing definite article on generic likes; elision failures.

### A1-06 — Adjective agreement & placement

- **CEFR can-do:** I can describe people and things with adjectives that agree.
- **Anchor:**
  > un **petit** chat **noir**, une **petite** maison **blanche**, des amis
  > **intelligents**.
- **The pattern:** adjectives **agree** in gender & number. Default: **+e** (fem.),
  **+s** (plural). Most adjectives go **after** the noun; a small high-frequency set
  (**BAGS/BANGS**: Beauty, Age, Number/Goodness, Size — *beau, joli, jeune, vieux, bon,
  mauvais, grand, petit, gros, nouveau*) go **before**.

  | | masc. sing. | fem. sing. | masc. pl. | fem. pl. |
  |---|---|---|---|---|
  | grand | grand | grande | grands | grandes |
  | petit | petit | petite | petits | petites |
  | (already -e) rouge | rouge | rouge | rouges | rouges |

  Irregulars to seed: *beau/belle, vieux/vieille, blanc/blanche, bon/bonne*.
- **Signature errors:**
  1. ✗ *une maison blanc / des chats noir* → ✓ agreement *blanche / noirs* — English
     adjectives are invariable, so agreement is systematically forgotten.
  2. ✗ *un noir chat* → ✓ *un chat noir* — default post-nominal placement (English
     order interference).
  3. ✗ pronouncing masculine as feminine: the fem. **-e** often makes a silent consonant
     **audible** (*petit* /pəti/ → *petite* /pətit/); teach the sound change.
- **Guided practice:** agreement fill-blank; word-order incl. BAGS placement.
- **Produce it:** "Describe three people and three objects (colour + one BAGS adjective)."
- **Tutor flags:** invariable adjectives; wrong placement; unheard fem. consonant.

### A1-07 — Negation **ne … pas**

- **CEFR can-do:** I can make any sentence negative.
- **Anchor:**
  > Je **ne** suis **pas** français. Elle **n'**aime **pas** le café. Nous **ne**
  > travaillons **pas** aujourd'hui.
- **The pattern:** wrap the conjugated verb: **ne + [verb] + pas**. Elision **ne → n'**
  before a vowel. After a negative, indefinite/partitive articles often become **de**
  (*un/une/des → de*: *je n'ai **pas de** frère*) — teach recognition now, drill in A2.
  Spoken French frequently drops **ne** (*je sais pas*) — teach for listening, produce
  the full form.
- **Signature errors:**
  1. ✗ *Je suis ne pas / Je pas suis* → ✓ *Je ne suis pas* — both parts hug the verb in
     the right order.
  2. ✗ *Je n'ai pas un frère* → ✓ *Je n'ai **pas de** frère* — the un/une/des → de shift.
  3. ✗ forgetting elision: *Je ne aime pas* → ✓ *Je n'aime pas*.
- **Guided practice:** affirmative→negative transformation; word-order.
- **Produce it:** "Say three things you are not / do not do."
- **Tutor flags:** misplaced pas; missing *de*; missing elision.

### A1-08 — Questions (intonation · est-ce que · inversion)

- **CEFR can-do:** I can ask yes/no and basic information questions three ways.
- **Anchor:**
  > **Tu parles français ?** / **Est-ce que** tu parles français ? / **Parles-tu**
  > français ?
- **The pattern:** three registers of yes/no question — **intonation** (informal,
  spoken: rising pitch), **est-ce que** (neutral, safest), **inversion** (formal,
  verb-subject + hyphen). Basic question words: *qui, que/qu'est-ce que, où, quand,
  comment, pourquoi, combien, quel*.
- **Signature errors:**
  1. ✗ using English do-support: *Est-ce que tu **fais** parler…* / trying to translate
     "do you" → ✓ French has **no do-support**; *Est-ce que tu parles ?*
  2. ✗ inversion without hyphen / wrong euphonic -t-: *Parle il ?* → ✓ *Parle-**t**-il ?*
  3. ✗ flat intonation on yes/no questions (pronunciation link: rising contour).
- **Guided practice:** rewrite one question across all three forms; word-order inversion.
- **Produce it:** "Ask a partner four questions (mix the three forms)."
- **Tutor flags:** do-support; missing -t-; flat intonation.

### A1-09 — Possessive adjectives (mon/ma/mes …)

- **CEFR can-do:** I can say whose something is.
- **Anchor:**
  > **mon** père, **ma** mère, **mes** parents. C'est **ton** livre ? — Non, c'est
  > **son** livre.
- **The pattern:** agree with the **possessed noun's** gender/number, **not** the owner:

  | owner | masc. sing. | fem. sing. | plural |
  |---|---|---|---|
  | my | mon | ma | mes |
  | your (tu) | ton | ta | tes |
  | his/her/its | son | sa | ses |
  | our | notre | notre | nos |
  | your (vous) | votre | votre | vos |
  | their | leur | leur | leurs |

  Special rule: before a **feminine noun starting with a vowel**, use **mon/ton/son**
  (*mon amie*, not *ma amie*) for euphony.
- **Signature errors:**
  1. ✗ *sa mère* to mean "**his** mother" assumed male owner → ✓ *son/sa* encodes the
     **noun's** gender, not the owner's; "his mother" and "her mother" are **both** *sa
     mère*. Major English-interference error.
  2. ✗ *ma amie* → ✓ *mon amie* (feminine + vowel rule).
  3. ✗ *mes / mon* number mismatch with the noun.
- **Guided practice:** possessive fill-blank family tree; word-order.
- **Produce it:** "Describe your family and whose three objects are whose."
- **Tutor flags:** owner-gender confusion; ma+vowel.

### A1-10 — **aller** + futur proche

- **CEFR can-do:** I can say what I am going to do (near future) and where I am going.
- **Anchor:**
  > Je **vais** à Paris. Nous **allons** manger. **Ils vont** travailler demain.
- **The pattern — *aller* (to go):**

  | je | tu | il/elle/on | nous | vous | ils/elles |
  |---|---|---|---|---|---|
  | vais | vas | va | allons | allez | vont |

  **Futur proche** = **aller (conjugated) + infinitive** = "going to …". Also `aller` +
  place (with prepositions previewed in A1-12: *à/en/chez*).
- **Signature errors:**
  1. ✗ conjugating the second verb: *Je vais **mange*** → ✓ *Je vais **manger*** —
     the second verb stays **infinitive**.
  2. ✗ inserting "to": *Je vais **à** manger* → ✓ *Je vais manger* (no preposition
     before the infinitive; English "going **to**" interference).
  3. ✗ *aller* as motion vs auxiliary confusion in negatives (*je ne vais pas manger*).
- **Guided practice:** futur-proche transformation (present → going-to); word-order.
- **Produce it:** "Say three things you're going to do this weekend + where you're going."
- **Tutor flags:** conjugated 2nd verb; inserted *à*.

### A1-11 — Key irregulars: **faire · venir · prendre**

- **CEFR can-do:** I can use three of the highest-frequency irregular verbs and their
  fixed expressions.
- **The pattern — three tables:**

  | | faire | venir | prendre |
  |---|---|---|---|
  | je | fais | viens | prends |
  | tu | fais | viens | prends |
  | il/elle/on | fait | vient | prend |
  | nous | faisons | venons | prenons |
  | vous | faites | venez | prenez |
  | ils/elles | font | viennent | prennent |

  Fixed expressions: **faire** du sport / la cuisine / les courses; weather *il fait
  beau/froid*. **prendre** un café / le bus / une décision. **venir de** + place (*je
  viens de Lyon*) — and previews **venir de** + infinitive (A2 passé récent).
- **Signature errors:**
  1. ✗ regularizing: *vous **faisez*** → ✓ *vous **faites*** ; *ils **prendent*** → ✓
     *ils **prennent***.
  2. ✗ *je fais 20 ans / il fait chaud* for "I am hot" → ✓ weather = *il fait chaud*
     (impersonal) but a person = *j'ai chaud* (avoir). Three-way être/avoir/faire trap.
  3. ✗ *prendre* pronunciation: nasal *prends* /pʁɑ̃/ vs *prennent* /pʁɛn/.
- **Guided practice:** verb-choice fill-blank across the three; word-order fixed expressions.
- **Produce it:** "Say what you do (faire), where you come from (venir), what you have/take
  in the morning (prendre)."
- **Tutor flags:** regularized irregulars; hot/weather confusion.

### A1-12 — Prepositions of place (à · en · dans · sur · chez)

- **CEFR can-do:** I can say where things and people are and where I'm going.
- **Anchor:**
  > Je suis **à** Paris, **en** France. Le livre est **sur** la table, **dans** le sac.
  > Je vais **chez** le médecin.
- **The pattern:** **à** + city (*à Paris*); **en** + feminine country (*en France*),
  **au** + masc. country (*au Japon*), **aux** + plural (*aux États-Unis*); **dans** =
  inside; **sur** = on; **chez** = at someone's place/home/business (*chez moi, chez le
  médecin*) — no English one-word equivalent.
- **Signature errors:**
  1. ✗ *à France / à Japon* → ✓ *en France / au Japon* — country preposition depends on
     gender/number, not the city rule.
  2. ✗ *à la maison de Marie / à Marie* for "at Marie's" → ✓ **chez** Marie.
  3. ✗ *dans* vs *à*: *je suis dans Paris* → ✓ *je suis à Paris*.
- **Guided practice:** preposition-choice fill-blank; word-order location sentences.
- **Produce it:** "Say where you are (city/country), where 3 objects are, and one *chez*."
- **Tutor flags:** country prepositions; missing *chez*.

### A1-13 — **il y a**

- **CEFR can-do:** I can say what exists / is there.
- **Anchor:**
  > **Il y a** un café dans la rue. **Il y a** trois personnes. **Il n'y a pas de** pain.
- **The pattern:** invariable **il y a** = "there is / there are" (singular *and*
  plural). Negative **il n'y a pas de** (+ *de*, the A1-07 rule returns). Question *Est-ce
  qu'il y a … ? / Y a-t-il … ?* Contrast with **c'est / ce sont** (identifying) vs *il y
  a* (existence).
- **Signature errors:**
  1. ✗ *ils y a / il y ont* pluralizing → ✓ *il y a* is **invariable**.
  2. ✗ *il y a pas un pain* → ✓ *il n'y a pas **de** pain*.
  3. ✗ *il y a* vs *c'est*: *il y a mon ami* to introduce → ✓ *c'est mon ami*.
- **Guided practice:** existence fill-blank (affirmative/negative); word-order.
- **Produce it:** "Describe your room / street: 4 things there are, 1 there isn't."
- **Tutor flags:** pluralized *il y a*; c'est/il y a confusion.

### A1-14 — Partitive articles (du / de la / de l' / des)

- **CEFR can-do:** I can talk about an unspecified quantity ("some") of food/drink.
- **Anchor:**
  > Je voudrais **du** café, **de la** salade et **de l'**eau. Je ne veux **pas de**
  > viande.
- **The pattern:** the partitive = "some / an amount of" uncountables:

  | masc. | fem. | before vowel | after negative / quantity |
  |---|---|---|---|
  | du | de la | de l' | **de** (pas de, beaucoup de, un peu de) |

  Contrast the three article systems: **definite** (j'aime **le** café — in general),
  **indefinite** (un café — one cup), **partitive** (**du** café — some coffee). After
  negation and quantity words → **de**.
- **Signature errors:**
  1. ✗ *j'aime du café* for "I like coffee (in general)" → ✓ *j'aime **le** café* — likes
     take **definite**, not partitive. The definite/partitive line is the whole point.
  2. ✗ *je bois le café* for "I'm drinking some coffee" → ✓ *je bois **du** café*.
  3. ✗ *beaucoup du café / pas du café* → ✓ *beaucoup **de** café / pas **de** café*.
- **Guided practice:** three-way article choice (le/un/du) fill-blank; word-order menu order.
- **Produce it:** "Order a meal (partitive) and say what you like in general (definite)."
- **Tutor flags:** partitive-for-general; quantity + de.

**A1 exit outcome:** learner can introduce self & others, describe people/things with
agreement, negate, ask questions three ways, express possession, near future, location,
existence, and quantity — the full transactional survival core.

---

## A2 (expert specs — objective · target forms · signature errors · contrast focus)

1. **Passé composé with *avoir*** — can-do: narrate past events. Forms: *avoir* +
   past participle (-er→-é, -ir→-i, -re→-u; irregulars *eu, fait, pris, vu, été*).
   Errors: ✗ *j'ai allé* (wrong aux, previews A2-02); ✗ present-for-past;
   ✗ unagreed participle when it *should* agree with a preceding DO (previews later).
2. **Passé composé with *être* (+ agreement)** — can-do: narrate motion/change verbs.
   Forms: DR & MRS VANDERTRAMP verbs + reflexives; **participle agrees with subject**
   (*elle est allé**e***, *ils sont allé**s***). Errors: ✗ *j'ai allé/tombé*; ✗ no
   agreement *elle est allé*; ✗ agreement written but not heard confusion.
3. **Imparfait (description/habit)** — can-do: set scenes, past habits. Forms: nous-stem
   + -ais/-ais/-ait/-ions/-iez/-aient; irregular stem *ét-* (être). Errors: ✗ using PC
   for background description; ✗ *j'étais + -ais* double marking.
4. **Pronominal/reflexive verbs** — can-do: daily routine. Forms: me/te/se/nous/vous/se +
   verb; PC with *être*. Errors: ✗ dropped reflexive *je lève* → *je me lève*; ✗ wrong
   pronoun person; ✗ reflexive PC with *avoir*.
5. **Direct object pronouns (le/la/les)** — can-do: avoid noun repetition. Placement
   **before** the verb. Errors: ✗ post-verbal English order *je vois le* → *je le vois*;
   ✗ le/la not matching noun gender; ✗ no elision *je le aime* → *je l'aime*.
6. **Indirect object pronouns (lui/leur)** — can-do: say to/for whom. Forms: *lui*
   (sing.), *leur* (pl.) for *à + person*. Errors: ✗ *le/la* for indirect; ✗ *leurs* (adj)
   for *leur* (pronoun); ✗ keeping *à + person* redundantly.
7. **Futur simple** — can-do: predictions/plans. Forms: infinitive stem + -ai/-as/-a/-ons/
   -ez/-ont; irregular stems *ser-/aur-/ir-/fer-/viendr-*. Errors: ✗ futur proche vs simple
   register; ✗ regularized irregular stems; ✗ *si + futur* (see B1 si-clauses).
8. **Comparatives & superlatives** — can-do: compare. Forms: plus/moins/aussi … que;
   le/la/les plus …; irregular *meilleur / mieux / pire*. Errors: ✗ *plus bon* → *meilleur*;
   ✗ *plus bien* → *mieux*; ✗ missing article in superlative.
9. **Time: depuis / pendant / il y a** — can-do: locate events in time. Errors:
   ✗ *depuis* + present nuance (English "for/since" + perfect); ✗ *pendant* vs *depuis*;
   ✗ *il y a* (ago) vs *il y a* (there is) confusion.
10. **Imperative** — can-do: give instructions. Forms: tu/nous/vous, drop -s from -er tu
    form (*mange!*); pronoun order changes (*donne-moi*). Errors: ✗ keeping subject pronoun;
    ✗ kept -s (*manges!*); ✗ pre-verbal pronoun in affirmative imperative.
11. **venir de + infinitif (passé récent)** — can-do: "just did". Errors: ✗ *je viens
    manger* vs *je viens **de** manger*; ✗ past tense instead of present + de + inf.
12. **Relative pronouns qui / que** — can-do: combine clauses. Forms: *qui* = subject,
    *que* = object. Errors: ✗ qui/que swap; ✗ *que → qu'* elision missing; ✗ dropping the
    relative (English allows "the book I read", French does not).
13. **y and en (intro)** — can-do: replace *à/de + thing*. Errors: ✗ *y* for people;
    ✗ placement; ✗ *en* for quantity dropped.

---

## B1 (expert specs — condensed)

1. **Passé composé vs imparfait** (the pivotal contrast) — completed/foreground vs
   background/habit/description; *soudain* vs *souvent* triggers. Errors: ✗ all-PC
   narration; ✗ *j'ai su* (found out) vs *je savais* (knew) aspectual meaning shifts.
2. **Plus-que-parfait** — "had done"; *avais/étais* + participle; sequence-of-past.
3. **Conditionnel présent** — politeness (*je voudrais/pourriez-vous*) + hypothesis;
   futur stem + imparfait endings. Errors: ✗ conditional stem ≠ futur stem.
4. **Subjonctif présent (intro + common triggers)** — *il faut que, vouloir que, bien
   que, pour que*; ils-stem + -e endings; irregulars *soit/ait/aille/fasse*. Errors:
   ✗ indicative after *il faut que*; ✗ subjunctive after *espérer*.
5. **Si clauses type 1 & 2** — *si + présent → futur*; *si + imparfait → conditionnel*.
   Errors: ✗ *si + conditionnel/futur* (the cardinal si-clause error).
6. **Relative pronouns dont, où** — *dont* (de +), *où* (place/time). Errors: ✗ *de qui/de
   que* for things → *dont*; ✗ *quand* for relative time → *où*.
7. **Double object pronoun order** — me/te/se/nous/vous < le/la/les < lui/leur < y < en.
8. **Gérondif (en + -ant)** — simultaneity/manner. Errors: ✗ English -ing overreach;
   ✗ different subjects (gérondif requires same subject).
9. **Discours indirect (present)** — reported speech, *que*, pronoun/tense shifts.
10. **Demonstrative pronouns (celui/celle/ceux/celles)** — + -ci/-là, *de*, relative.
11. **Opinion + subjunctive vs indicative** — *je pense que* (ind.) vs *je ne pense pas
    que* (subj.); *il est probable* (ind.) vs *il est possible* (subj.).

## B2 (expert specs — condensed)

1. **Subjonctif — full triggers + subjonctif passé** (doubt/emotion/necessity; *ait fait*).
2. **Conditionnel passé** — regret/reproach; *aurais/serais* + participle; + si type 3.
3. **Si clauses — all three types together** (incl. *si + plus-que-parfait →
   conditionnel passé*).
4. **Passive voice** — *être* + participle + *par/de*; when to avoid (prefer *on*).
5. **Discours indirect au passé (concordance des temps)** — full tense back-shift.
6. **Participe présent vs gérondif** — cause/relative-reduction vs simultaneity.
7. **Relative pronouns composés (lequel/auquel/duquel)** — after prepositions.
8. **Concessive/purpose + subjunctive** (*bien que, quoique, pour que, afin que, avant que*).
9. **Mise en relief (c'est … qui / que)** — focus/emphasis structures.
10. **ne explétif** — after *avant que, à moins que, craindre que* (non-negating *ne*).

## C1 (recognition + nuance — condensed)

1. **Passé simple** (recognition; literary/news 3rd-person forms).
2. **Subjonctif imparfait** (recognition only; *fût/eût*).
3. **Advanced concordance des temps** across registers.
4. **Nominalisation** (verb→noun style for formal writing).
5. **Register shifts (soutenu ↔ familier ↔ argot)** — lexical & syntactic markers.
6. **Advanced argumentation connectors** (*néanmoins, or, en effet, quant à, dès lors*).
7. **Inversion stylistique** (after *ainsi, peut-être, sans doute, à peine*).
8. **Nuanced modality** (*devoir/pouvoir* shades: obligation/probability/reproach).

---

# PART 2 — PRONUNCIATION

v1 = **listen + minimal-pair discrimination only** (one new section kind). No
record-yourself. Every lesson follows the locked 5-part shape (the sound → minimal
pairs + discrimination quiz → words→phrases → connected speech → tutor notes). Audio via
the existing `/api/tts` (Inworld) cache.

## Sequencing principle

Order by **(a) communicative cost of confusion** and **(b) what unlocks the most words**,
not by the IPA chart. The English-L1 learner's three biggest intelligibility killers come
first: the /y/ vowel (doesn't exist in English), nasal vowels, and the French /ʁ/. Silent
letters + liaison are sequenced early too because they block *listening* comprehension.

**Recommended teaching order (v1, ~16 lessons):**

### Tier 1 — highest payoff (build these first)
- **P-01 /u/ vs /y/** — *tout/tu, vous/vu, roue/rue, sous/su*. The signature French vowel;
  /y/ = round lips for /u/ but tongue for /i/. Error: /y/→/u/ collapses *tu/tout*.
- **P-02 /i/ vs /y/** — *si/su, dit/du, lit/lu*. Completes the /y/ triangle.
- **P-03 Nasal vowels /ɑ̃/ /ɔ̃/ /ɛ̃/** — *sans/son/saint, blanc/blond/brin, temps/thon*.
  Error: pronouncing the following /n/; English has no phonemic nasal vowels.
- **P-04 Nasal vs oral** — *bon/bonne, plein/pleine, un/une, brun/brune*. Ties nasal
  vowels to A1-06 masculine/feminine adjective audibility.
- **P-05 The French /ʁ/** — *rue, Paris, rouge, très*. Uvular, not English retroflex.

### Tier 2 — vowel precision
- **P-06 /e/ vs /ɛ/** — *été/est, les/lait, ces/c'est*. Links to *-er* verb endings (A1-03).
- **P-07 /o/ vs /ɔ/** — *beau/bol, saute/sotte, pot/porte*.
- **P-08 /ø/ vs /œ/** — *peu/peur, ceux/sœur, jeûne/jeune*.
- **P-09 /ə/ schwa & e-muet** — *le, je, samedi, petit*; when the "e" drops.

### Tier 3 — consonants
- **P-10 /ʃ/ vs /ʒ/** — *chou/joue, cache/cage*.
- **P-11 unaspirated /p t k/** — *Paris, Tour, café* (no English puff of air).
- **P-12 h muet** — *l'homme, les hôtels, l'hôpital* (no /h/; drives elision & liaison).
- **P-13 silent final consonants** — *petit, trop, vous, grand* (ties to A1-04 plural -s,
  A1-06 adjective agreement being silent).

### Tier 4 — connected speech (listening unlock)
- **P-14 Liaison** — obligatory (*les‿amis, un‿homme, vous‿êtes*) / forbidden (*et |
  après*) / optional. Ties to *être/avoir* plurals (A1-01/02).
- **P-15 Élision & enchaînement** — *l', d', j', qu', n'*; *il est‿ici*.
- **P-16 Intonation** — rising yes/no questions vs falling statements (ties to A1-08).

## Pronunciation lesson spec (applies to each)

1. **The sound** — articulatory description (lip/tongue position) + IPA + a TTS model word.
2. **Minimal pairs** — the pairs above, each playable (TTS) both ways.
3. **Discrimination quiz** (the new section kind) — hear one word, choose which of the pair
   it was; 6–8 items, auto-graded, immediate feedback. Counts toward streak via
   `recordActivity({kind:"lesson"})` on completion.
4. **In words → phrases** — the sound scaled into real A1/A2 vocabulary and short phrases.
5. **Tutor notes** — what to listen for, quick live drills, the L1-interference to expect.

**Cross-linking (build last):** each pronunciation lesson references the grammar/vocab it
supports (e.g. P-06 ↔ A1-03 -er endings; P-04 ↔ A1-06 adjective agreement), and Daily
News stories surface the matching grammar lesson by tense/structure tag.

---

## Sign-off checklist

- [ ] A1 teaching order (incl. the gender-before-articles swap, partitive kept at A1-14).
- [ ] A2–C1 point list & contrasts as specced.
- [ ] Pronunciation order (payoff-first, not IPA-chart order) + 16-lesson v1 set.
- [ ] Confirm the "signature errors" are the ones you want taught (they drive the
      student-visible `common_mistakes` and the tutor error-flags).

Once signed off, build order is unchanged: (1) `fr-grammar` category + `grammar_explainer`
section + renderer, (2) A1-01→A1-03 authored to this spec at `status:'review'`,
(3) être homework via the existing homework pipeline, review checkpoint, then scale the
rest of A1.
