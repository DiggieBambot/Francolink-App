#!/usr/bin/env python3
"""
Decide what gets recorded, before anything is generated.

The pack is not "read the book aloud". It is the parts where hearing it is the
lesson (PRD §7):

  * every dialogue, including the fourteen new ones
  * the pronunciation drills of 1.1-1.6 -- the sounds the book teaches in text
  * the 20 essential phrases of 0.1, which are the survival kit
  * the conjugation tables read across, so the pattern is audible

Everything else -- explanations, exercise instructions, the answer key -- is
read, not heard, and recording it would double the cost for nothing.
"""
import json, re, pathlib

HERE = pathlib.Path(__file__).parent
blocks = json.load(open(HERE / "blocks.json"))
md = (HERE.parent / "PART-6-B1-B2-expansion.md").read_text()

clips = []
seen = set()

def anchor(heading):
    """Same slug the book builder uses, so ids line up with section anchors."""
    m = re.match(r"^(\d+(?:\.\d+)?)", (heading or "").strip())
    return "s" + m.group(1).replace(".", "-") if m else None

# Written conventions that must never be spoken. The book writes "Enchanté(e)"
# to show the feminine agreement and "Oui / Non" to pair two answers; read
# aloud, the model says the bracket and the slash, which is why "Oui / Non"
# took 7.3 seconds for two words.
def speakable(text):
    text = re.sub(r"\(e\)", "", text)             # Enchanté(e) -> Enchanté
    # A slash means "or", not a full stop. Turning it into one made the
    # conjugation tables read "il. elle. on va" — three sentences where the
    # book means one list.
    text = re.sub(r"\s*/\s*", ", ", text)          # il / elle / on -> il, elle, on
    text = re.sub(r"\s*\([^)]*\)", "", text)       # any other written aside
    text = text.replace("…", " ").replace("«", "").replace("»", "")
    return " ".join(text.split())

def add(cid, text, kind, slow=True, section=None):
    text = speakable(text)
    if len(text) < 3 or len(text) > 900:
        return
    key = text.lower()
    if key in seen:
        return
    seen.add(key)
    clips.append({"id": cid, "text": text, "kind": kind,
                  "slow": slow, "section": section})

# Walking order matters: each clip is tagged with the last heading seen above
# it, which is how the reader knows to offer audio on that section and nowhere
# else.
section_of = {}
cur = None
for i, b in enumerate(blocks):
    if b["kind"] == "p" and b["style"] in ("Heading2", "Heading1"):
        cur = anchor(b["text"]) or cur
    section_of[i] = cur

# --- 0.1, the twenty essential phrases ------------------------------------
# They live in a three-column table: French | pronunciation hint | English.
for b in blocks:
    if b["kind"] != "table":
        continue
    rows = b["rows"]
    if len(rows) > 5 and len(rows[0]) == 3 and "Prononciation" in " ".join(rows[0]):
        for i, r in enumerate(rows[1:], 1):
            # No slow pass: "Bonjour" read slowly is not a lesson, and the
            # model is erratic on one- and two-word inputs — several slow
            # takes came back SHORTER than their normal counterpart.
            add(f"0.1-phrase-{i:02d}", r[0], "phrase", slow=False, section="s0-1")

# --- dialogues -------------------------------------------------------------
# One clip per dialogue, not per line: the point is to hear a conversation.
d = 0
for idx, b in enumerate(blocks):
    if b["kind"] != "table" or len(b["rows"]) != 1 or len(b["rows"][0]) != 1:
        continue
    cell = b["rows"][0][0]
    if not cell.startswith("💬"):
        continue
    lines = [l for l in cell.split("\n")[1:] if l.strip()]
    # Drop the English gloss in brackets -- this is a French recording.
    fr = [re.sub(r"\s{2,}\(.*\)\s*$", "", l).strip() for l in lines]
    fr = [l for l in fr if l]
    if fr:
        d += 1
        add(f"dialogue-{d:02d}", "  ".join(fr), "dialogue", section=section_of.get(idx))

for m in re.finditer(r"### 💬 Dialogue · ([^\n]+)\n(.*?)(?=\n###|\n---|\n## )", md, re.S):
    head = md.rfind("\n## ", 0, m.start())
    sec = anchor(md[head + 4: md.find("\n", head + 4)]) if head != -1 else None
    lines = []
    for l in m.group(2).split("\n"):
        mm = re.match(r"\*\*(.+?)\*\* : (.+?)(?:\s*\*\(.*\)\*)?\s*$", l.strip())
        if mm:
            lines.append(f"{mm.group(1)} : {mm.group(2)}")
    if lines:
        d += 1
        add(f"dialogue-{d:02d}", "  ".join(lines), "dialogue", section=sec)

# --- 1.1-1.6, the sounds ---------------------------------------------------
# Written as drills rather than lifted verbatim: a list of example words read
# in sequence is what makes a contrast audible.
DRILLS = [
    ("1.1-u",        "tu, rue, une, sur, bienvenue"),
    ("1.1-u-ou",     "tu, tout. Rue, roue. Su, sous. Vu, vous."),
    ("1.1-r",        "rouge, Paris, très, rire, une rue parisienne"),
    ("1.1-h",        "heureux, hôpital, huit, l'homme"),
    ("1.2-accents",  "été, père, fête, forêt, où, garçon, à Paris"),
    ("1.2-pairs",    "ou, où. A, à. Sur, sûr."),
    ("1.3-combos",   "voiture, chaud, fille, montagne, bateau, rouge, français, sœur"),
    ("1.4-silent",   "temps, gris, chat, petit, grand, quand, nez, trop"),
    ("1.4-ent",      "il mange, ils mangent. Il parle, ils parlent."),
    ("1.5-liaison",  "nous avons, les élèves, un grand arbre, vous êtes, les amis"),
    ("1.6-nasal",    "enfant, temps, chambre. Bon, nom, ombre. Pain, main, fin."),
    ("1.6-contrast", "an, année. Bon, bonne. Fin, fine. Un, une."),
]
for cid, text in DRILLS:
    add(cid, text, "drill", section=anchor(cid))

# --- conjugations ----------------------------------------------------------
# Read across so the pattern is audible; a column of forms is not a sound.
for bi, b in enumerate(blocks):
    if b["kind"] != "table" or len(b["rows"]) < 5:
        continue
    col0 = [r[0].strip().lower() for r in b["rows"] if r]
    if len(b["rows"][0]) == 2 and any(c.startswith(("je", "j'")) for c in col0) \
       and any(c.startswith("nous") for c in col0):
        forms = [f"{r[0].strip()} {r[1].strip()}" for r in b["rows"] if len(r) == 2 and r[1].strip()]
        if len(forms) >= 5:
            add(f"conj-{len([c for c in clips if c['kind']=='conj'])+1:02d}",
                ", ".join(forms), "conj", section=section_of.get(bi))

out = HERE / "audio-manifest.json"
json.dump(clips, open(out, "w"), ensure_ascii=False, indent=1)

kinds = {}
chars = 0
for c in clips:
    kinds[c["kind"]] = kinds.get(c["kind"], 0) + 1
    chars += len(c["text"]) * (2 if c["slow"] else 1)
print(f"{len(clips)} clips -> {out.name}")
for k, v in sorted(kinds.items(), key=lambda x: -x[1]):
    print(f"  {k:10} {v}")
placed = sum(1 for c in clips if c["section"])
print(f"\nwith a section anchor  : {placed}/{len(clips)}")
print(f"renders (normal + slow): {sum(2 if c['slow'] else 1 for c in clips)}")
print(f"characters billed      : ~{chars:,}")
