# Grammar & Pronunciation Materials — Plan

Status: **planning / awaiting syllabus sign-off**. No code yet.

## Locked decisions
- **Placement:** two new `/library` categories (`grammar` / `fr-grammar`, `pronunciation` / `fr-prononciation`), reusing the Daily News pipeline + admin generate/review + tutor/student dual view + Inworld TTS.
- **Production:** *curated syllabus + AI fill.* The pedagogical ordering (which points, what order, what contrasts) is hand-authored in this doc. AI drafts each lesson's examples / exercises / common-mistakes from that spec. Human review before publish — same as Daily News.
- **Pronunciation v1:** listen + minimal-pair **discrimination quizzes** only. No record-yourself in v1 (add later). Audio via existing `/api/tts` cache.

## Pedagogical principles
1. Form follows use — anchor each rule to language already seen; never a cold rule dump.
2. Arc per lesson: input → noticing → controlled practice → free production.
3. Pronunciation is a first-class skill with real audio, not an IPA footnote.
4. One content model, two modes: self-study (auto-graded) + tutor-led (talking points + error flags).

## Grammar lesson shape (section order)
1. **In context** — 2–3 sentences showing the structure in bold (noticing).
2. **The pattern** — plain explanation + conjugation/agreement table.
3. **Guided practice** — auto-graded fill-blank / reorder (existing exercise components).
4. **Common mistakes** — the 2–3 real learner errors (high tutor value).
5. **Produce it** — free-response prompts forcing the structure + tutor talking points.

Scaling: A1–A2 one rule / present tense / heavy scaffolding; B1–B2 contrasts + register; C1 nuance, exceptions, style.

## Pronunciation lesson shape (section order)
1. **The sound** — description, mouth position, IPA, TTS model to listen to.
2. **Minimal pairs** — listen to both (TTS) + listen-and-choose discrimination quiz (the one new interactive piece).
3. **In words → phrases** — the sound scaling up, TTS models.
4. **In connected speech** — liaison / élision, TTS.
5. **Tutor notes** — what to listen for, live drills.

---

## DRAFT French grammar syllabus (curated ordering — review/edit me)

### A1
1. Subject pronouns + **être**
2. **avoir**
3. Regular **-er** verbs (present)
4. Articles: definite (le/la/les) & indefinite (un/une/des)
5. Noun gender & number
6. Adjective agreement & placement
7. Negation **ne … pas**
8. Questions (intonation, est-ce que, basic inversion)
9. Possessive adjectives (mon/ma/mes …)
10. **aller** + futur proche (aller + infinitif)
11. Partitive articles (du / de la / des)
12. Key irregulars: **faire**, **venir**, **prendre**
13. Prepositions of place (à, en, dans, sur, chez)
14. **il y a**

### A2
1. **Passé composé** with *avoir*
2. **Passé composé** with *être* (+ agreement)
3. **Imparfait** (intro: description/habit)
4. Pronominal/reflexive verbs
5. Direct object pronouns (le/la/les)
6. Indirect object pronouns (lui/leur)
7. **Futur simple**
8. Comparatives & superlatives
9. Time: depuis / pendant / il y a
10. Imperative
11. **venir de** + infinitif (passé récent)
12. Relative pronouns qui / que
13. **y** and **en** (intro)

### B1
1. **Passé composé vs imparfait** (contrast — the big one)
2. Plus-que-parfait
3. **Conditionnel présent** (politeness + hypothesis)
4. **Subjonctif présent** (intro + common triggers)
5. Si clauses type 1 & 2 (si + présent / si + imparfait)
6. Relative pronouns dont, où
7. Double object pronoun order
8. **Gérondif** (en + -ant)
9. Discours indirect (present)
10. Demonstrative pronouns (celui/celle …)
11. Opinion + subjunctive vs indicative

### B2
1. Subjonctif — full triggers + subjonctif passé
2. **Conditionnel passé** + regrets/reproach
3. Si clauses — all three types together
4. Passive voice
5. Discours indirect au passé (concordance des temps)
6. Participe présent vs gérondif
7. Relative pronouns composés (lequel, auquel, duquel)
8. Concessive/purpose connectors + subjunctive (bien que, pour que, afin que)
9. Mise en relief (c'est … qui / que)
10. ne explétif

### C1 (recognition + nuance)
1. Passé simple (recognition, literary/news)
2. Subjonctif imparfait (recognition)
3. Advanced concordance des temps
4. Nominalisation
5. Register shifts (soutenu ↔ familier)
6. Advanced argumentation connectors
7. Inversion stylistique
8. Nuanced modality (devoir/pouvoir shades)

---

## DRAFT French pronunciation inventory (curated — review/edit me)

### Vowel contrasts (minimal pairs)
- /u/ vs /y/ — tout / tu, vous / vu, roue / rue
- /i/ vs /y/ — si / su, dit / du
- /e/ vs /ɛ/ — été / est, les / lait
- /o/ vs /ɔ/ — beau / bol, saute / sotte
- /ø/ vs /œ/ — peu / peur, ceux / sœur
- /ə/ schwa & e-muet (le, je, samedi)

### Nasal vowels
- /ɑ̃/ /ɔ̃/ /ɛ̃/ — sans / son / saint, blanc / blond / brin
- /ɑ̃/ vs /ɔ̃/ — temps / thon
- nasal vs oral — bon / bonne, plein / pleine

### Consonants
- /ʁ/ — the French R (rue, Paris, rouge)
- /ʃ/ vs /ʒ/ — chou / joue, cache / cage
- unaspirated /p t k/ — Paris, Tour
- h muet (no /h/): l'homme, les hôtels
- silent final consonants (petit, trop, vous)

### Connected speech
- Liaison — obligatory / forbidden / optional (les_amis, un_homme)
- Élision — l', d', j', qu', n'
- Enchaînement (il est ici)
- Intonation — rising yes/no questions vs falling statements

---

## Build order (once syllabus is signed off)
1. **Grammar category** first — ~80% of components already exist (grammar-section, exercises). Prove the category + generation + review flow end-to-end on 2–3 A1/A2 points.
2. **Pronunciation category** — build the one new *discrimination-quiz* section kind, then curate from the inventory above; audio via existing TTS.
3. **Cross-linking** — surface the matching grammar lesson from Daily News stories by tense/structure tag. Last.

## Open questions before build
- Sign off / edit the A1 grammar syllabus (we'll build from the top of it first).
- Confirm English-language grammar/pronunciation is in scope too, or French-only for v1.
