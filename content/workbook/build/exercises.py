#!/usr/bin/env python3
"""
Pair every exercise with its answers.

The reader promises on the sales page that it marks exercises instantly, so it
needs the answer key as DATA, not as prose at the back of the book. Both keys
are parsed here -- the original Corrigé and the expansion's -- and matched to
the numbered items in each exercise.

Anything that cannot be matched confidently is left un-interactive rather than
guessed at: a workbook that marks a right answer wrong is worse than one that
does not mark at all.
"""
import json, re, pathlib

HERE = pathlib.Path(__file__).parent
blocks = json.load(open(HERE / "blocks.json"))
md = (HERE.parent / "PART-6-B1-B2-expansion.md").read_text()

# ---- answers -------------------------------------------------------------
answers = {}   # {exercise_number: {item_number: [accepted, ...]}}

def split_alternatives(a):
    a = a.strip().rstrip(".")
    # The key writes continuations as "…qu'il avait faim". A learner types the
    # words, not the ellipsis.
    a = a.lstrip("….·- ").strip()
    a = re.sub(r"\s*\([^)]*\)\s*$", "", a).strip()      # trailing (note)
    parts = re.split(r"\s*/\s*|\s+ou\s+", a)
    return [p.strip() for p in parts if p.strip()]

# Original key: a run of paragraphs "Exercice N — title" then "1. answer"
cur = None
for b in blocks:
    texts = [b["text"]] if b["kind"] == "p" else [c for r in b["rows"] for c in r]
    for t in texts:
        for line in t.split("\n"):
            line = line.strip()
            m = re.match(r"^Exercice (\d+)\s*[—-]", line)
            if m:
                cur = int(m.group(1)); answers.setdefault(cur, {}); continue
            if cur is None: continue
            m2 = re.match(r"^(\d+)\.\s*(.+)$", line)
            if m2 and len(m2.group(2)) < 120:
                answers[cur][int(m2.group(1))] = split_alternatives(m2.group(2))

# Expansion key: "**31** — 1. x 2. y 3. z"
for m in re.finditer(r"\*\*(\d+)\*\*\s*—\s*(.+?)(?=\n\n\*\*\d+\*\*|\Z)", md[md.index("# Corrigé"):], re.S):
    n = int(m.group(1)); body = " ".join(m.group(2).split())
    answers.setdefault(n, {})
    # Split on the NEXT item marker, not on "no digits" -- the latter truncated
    # every answer that contained a number ("Ce pont a été construit en 1990"
    # became "Ce pont a été construit en").
    # "1990." inside an answer looks exactly like an item marker, so candidates
    # are kept only while they form an increasing run from 1. That is what an
    # answer list actually is, and a year never fits it.
    cands = [(im.start(), int(im.group(1))) for im in re.finditer(r"(?:^|\s)([1-9]\d?)\.\s", body)]
    marks, expect = [], 1
    for pos, num in cands:
        if num == expect:
            marks.append((pos, num)); expect += 1
    for idx, (pos, num) in enumerate(marks):
        start = body.index(".", pos) + 1
        end = marks[idx + 1][0] if idx + 1 < len(marks) else len(body)
        answers[n][num] = split_alternatives(body[start:end])

# ---- exercises -----------------------------------------------------------
exercises = {}   # {n: [{item, text}]}
for b in blocks:
    if b["kind"] != "table" or len(b["rows"]) != 1 or len(b["rows"][0]) != 1:
        continue
    cell = b["rows"][0][0]
    m = re.match(r"^✎\s*Exercice (\d+)", cell)
    if not m: continue
    n = int(m.group(1)); items = []
    for line in cell.split("\n")[1:]:
        im = re.match(r"^(\d+)\.\s*(.+)$", line.strip())
        if im and "______" in im.group(2):
            items.append({"item": int(im.group(1)), "text": im.group(2)})
    if items: exercises[n] = items

for m in re.finditer(r"### ✎ Exercice (\d+)[^\n]*\n(.*?)(?=\n###|\n---|\n## )", md, re.S):
    n = int(m.group(1)); items = []
    for line in m.group(2).split("\n"):
        im = re.match(r"^(\d+)\.\s*(.+)$", line.strip())
        if im and "______" in im.group(2):
            items.append({"item": int(im.group(1)), "text": im.group(2)})
    if items: exercises[n] = items

# ---- join, keeping only what is unambiguous -------------------------------
out, dropped = {}, []
for n, items in sorted(exercises.items()):
    key = answers.get(n, {})
    kept = []
    for it in items:
        a = key.get(it["item"])
        blanks = it["text"].count("______")
        if a and blanks == 1 and all(len(x) < 60 for x in a):
            kept.append({"i": it["item"], "text": it["text"], "answers": a})
        else:
            dropped.append(f"{n}.{it['item']}")
    if kept: out[n] = kept

json.dump(out, open(HERE / "exercises.json", "w"), ensure_ascii=False, indent=1)
total = sum(len(v) for v in exercises.values())
kept = sum(len(v) for v in out.values())
print(f"exercises with items : {len(exercises)}")
print(f"items total          : {total}")
print(f"interactive          : {kept}  ({kept*100//max(total,1)}%)")
print(f"left as plain text   : {len(dropped)}")
print("sample:", json.dumps(out.get(26, [])[:2], ensure_ascii=False))
