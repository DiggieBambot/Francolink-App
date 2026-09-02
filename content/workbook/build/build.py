#!/usr/bin/env python3
"""
Build the book: one semantic HTML file, the source of truth for both the PDF
and the online reader.

Three inputs are merged here:
  1. blocks.json          -- the original manuscript, structure intact
  2. PART-6-B1-B2-expansion.md -- the 10,745-word B1/B2 expansion
  3. FIXES below          -- the corrections from the two audits

Nothing is retyped by hand. Re-running this regenerates the whole book, so a
typo is a one-line edit here and a re-run, not a hunt through 95 pages.
"""
import json, re, html, sys, pathlib

HERE = pathlib.Path(__file__).parent
ROOT = HERE.parent

# ---------------------------------------------------------------------------
# Corrections from AUDIT-parts-0-3-and-key.md and AUDIT-parts-4-5.md.
# Applied to block text before rendering. Each is (find, replace, label).
# ---------------------------------------------------------------------------
FIXES = [
    # B1 -- the gender section contradicted itself in its opening sentence.
    ("A table is masculine (le stylo? no — une table, feminine!), a chair is feminine.",
     "A table is feminine — une table — while a pen is masculine — un stylo. "
     "Nothing about the objects explains it.",
     "1.10 gender sentence"),
    # B2 -- the CaReFuL mnemonic was stated inside-out.
    ("6. Je t'(appeler) ______ plus tard.  (stem appeller-)",
     "6. Je t'(appeler) ______ plus tard.  (careful: appeler doubles the l)",
     "5.1 appeler stem note"),
    ("A classic memory key groups the usually-silent final consonants; a common mnemonic "
     "is to remember they are NOT in the English word CaReFuL (c, r, f, l are the finals "
     "you often DO pronounce).",
     "The CaReFuL rule: most final consonants are silent, and the usual exceptions are "
     "c, r, f and l — the consonants in the English word CaReFuL. So you pronounce the "
     "last letter of avec, bonjour, chef and animal, but not of temps, chat, grand or nez.",
     "1.4 CaReFuL mnemonic"),
    # A1 -- the question underlined one thing and the key answered another.
    ("3. Read aloud and write the sound of the underlined part: bonjOUr · trOIs · chAT · sOEur.",
     "3. Read aloud and write the sound of the underlined part: bonjOUr · trOIs · CHat · sOEur.",
     "Exercice 3.3 mismatch"),
    # A3 -- you cannot fill that blank with the answer given.
    ("4. Ask for the missing word: « Je vais ______ ? » (where)",
     "4. Turn into a question with « où »: « Tu vas à Paris. » → ______",
     "Exercice 13.4 malformed"),
    # A4 -- the question contained its own answer.
    ("3. Prediction: « Il (pleuvoir → pleuvra) ______ demain. »",
     "3. Prediction: « Il (pleuvoir) ______ demain. »",
     "Exercice 28.3 gave the answer"),
    # A2 -- right verdict, confused reasoning.
    ("4. False: « parlez » is followed by nothing here, and the next word must start with "
     "a vowel for a liaison; « vous parlez » itself has no liaison because « parlez » "
     "starts with a consonant.",
     "4. False. A liaison needs the NEXT word to begin with a vowel sound. In « vous "
     "parlez » the second word begins with the consonant p, so the s of vous stays "
     "silent. Compare « vous avez » → « vou-Zavez ».",
     "Exercice 4.4 reasoning"),
    # B4 -- the rule contradicted its own table two lines later.
    ("🎾 The ball rule. Sport or instrument WITHOUT a ball → faire du / de la / des. "
     "Sport or game WITH a ball → jouer au / à la / aux. (For instruments it's jouer "
     "du/de la: jouer du piano.)",
     "🎾 The rule. A sport you DO → faire du / de la (faire du vélo, de la natation). "
     "A sport or game you PLAY AGAINST someone → jouer au / aux (jouer au football, aux "
     "cartes, aux échecs). Instruments are the odd ones out: jouer du / de la "
     "(jouer du piano).",
     "2.5 ball rule"),
    # Production artefact -- an instruction to the author, not the reader.
    ("Print-friendly and Google-Docs-friendly: upload this file to Google Drive and open "
     "it with Google Docs — the tables, colours and headings carry over.",
     "", "Google Docs instruction"),
    ("(In Google Docs / Word: right-click the list above → “Update field” to build page numbers.)",
     "", "Word TOC instruction"),
    ("This workbook rebuilds your class notes into one graded path from absolute beginner "
     "(A0) to upper-intermediate (B2).",
     "This workbook is one graded path from absolute beginner (A0) to upper-intermediate "
     "(B2).", "class-notes reference"),
]

CALLOUTS = {
    "📌": ("retenir", "À retenir"),
    "💡": ("astuce", "Astuce"),
    "⚠️": ("attention", "Attention"),
    "🧩": ("marche", "Comment ça marche"),
    "🌍": ("culture", "Culture & usage"),
    "💬": ("dialogue", "Dialogue"),
    "✎": ("exercice", "Exercice"),
}


# ---------------------------------------------------------------------------
# French first.
#
# The manuscript separates the French from its English gloss in two consistent
# ways: examples use "French.  — English." (two spaces before the dash) and
# dialogue lines use "Name : French  (English)". Marking those apart lets the
# French carry the weight and the gloss recede -- which is the right hierarchy
# for a French workbook, and was not happening when both halves were one flat
# run of grey text.
#
# The two-space requirement matters: the expansion writes French-to-French
# exchanges like "Tu vois le film ? — Oui, je le vois." with a single space,
# and styling that second half as English would be wrong.
# ---------------------------------------------------------------------------
DIALOGUE = re.compile(r"^([^:<]{1,28})\s:\s(.+?)\s{2,}\((.+)\)\s*$")
EXAMPLE = re.compile(r"^(.+?)\s{2,}—\s(.+)$")

def frenchify(escaped):
    m = DIALOGUE.match(escaped)
    if m:
        return (f'<span class="sp">{m.group(1).strip()}</span>'
                f'<span class="fr">{m.group(2).strip()}</span>'
                f'<span class="en">{m.group(3).strip()}</span>')
    m = EXAMPLE.match(escaped)
    if m:
        return (f'<span class="fr">{m.group(1).strip()}</span>'
                f'<span class="en">— {m.group(2).strip()}</span>')
    return escaped

def esc(s):
    return html.escape(s, quote=False)

def apply_fixes(blocks):
    """Corrections land in paragraphs AND in table cells.

    Nearly every exercise and callout in this book is a single-cell table, so a
    fixer that only walked paragraphs silently missed four of the ten."""
    applied = []
    for b in blocks:
        for find, repl, label in FIXES:
            if b["kind"] == "p":
                if find in b["text"]:
                    b["text"] = b["text"].replace(find, repl)
                    applied.append(label)
            else:
                for row in b["rows"]:
                    for i, c in enumerate(row):
                        if find in c:
                            row[i] = c.replace(find, repl)
                            applied.append(label)
    return applied

def slug(text):
    m = re.match(r"^(\d+(?:\.\d+)?)", text.strip())
    return "s" + m.group(1).replace(".", "-") if m else re.sub(r"[^a-z0-9]+", "-", text.lower())[:40]

def render_blocks(blocks):
    out, i = [], 0
    while i < len(blocks):
        b = blocks[i]
        if b["kind"] == "table":
            out.append(render_table(b["rows"]))
            i += 1
            continue
        t, style = b["text"], b["style"]
        if not t:
            i += 1
            continue
        if style == "Heading1":
            out.append(f'<h1 class="part" id="{slug(t)}">{esc(t)}</h1>')
        elif style == "Heading2":
            out.append(f'<h2 id="{slug(t)}">{esc(t)}</h2>')
        elif style == "Heading3":
            out.append(f'<h3>{esc(t)}</h3>')
        else:
            marker = next((k for k in CALLOUTS if t.startswith(k)), None)
            if marker:
                cls, label = CALLOUTS[marker]
                body = t[len(marker):].strip()
                # The label repeats in the source; drop it from the body.
                body = re.sub(r"^" + re.escape(label) + r"\s*", "", body)
                nxt = ""
                if i + 1 < len(blocks) and blocks[i+1]["kind"] == "p" \
                   and not blocks[i+1]["style"] and blocks[i+1]["text"] \
                   and not any(blocks[i+1]["text"].startswith(k) for k in CALLOUTS):
                    nxt = blocks[i+1]["text"]; i += 1
                text = (body + " " + nxt).strip()
                out.append(f'<aside class="box {cls}"><p class="box-l">{esc(label)}</p>'
                           f'<p>{frenchify(esc(text))}</p></aside>')
            elif t.startswith("•"):
                items = [t]
                while i + 1 < len(blocks) and blocks[i+1]["kind"] == "p" \
                      and blocks[i+1]["text"].startswith("•"):
                    i += 1; items.append(blocks[i]["text"])
                lis = "".join(f"<li>{frenchify(esc(x.lstrip('• ').strip()))}</li>" for x in items)
                out.append(f'<ul class="ex">{lis}</ul>')
            else:
                out.append(f"<p>{frenchify(esc(t))}</p>")
        i += 1
    return "\n".join(out)

def render_table(rows):
    rows = [r for r in rows if any(c.strip() for c in r)]
    if not rows:
        return ""
    # A one-by-one table is not a table: it is how this manuscript draws its
    # callouts and its exercises. Render it as the box it is meant to be.
    if len(rows) == 1 and len(rows[0]) == 1:
        cell = rows[0][0]
        first = cell.split("\n")[0]
        marker = next((k for k in CALLOUTS if first.startswith(k)), None)
        if marker:
            cls, label = CALLOUTS[marker]
            lines = cell.split("\n")
            head = re.sub(r"^" + re.escape(marker) + r"\s*", "", lines[0]).strip()
            head = re.sub(r"^" + re.escape(label) + r"\s*", "", head).strip()
            body = ([head] if head else []) + [l for l in lines[1:] if l.strip()]
            ps = "".join(f"<p>{frenchify(esc(l))}</p>" for l in body)
            return f'<aside class="box {cls}"><p class="box-l">{esc(label)}</p>{ps}</aside>'
        return f'<aside class="box"><p>{esc(cell)}</p></aside>'
    rows = [[c.replace("\n", " ") for c in r] for r in rows]
    head, body = rows[0], rows[1:]
    th = "".join(f"<th>{esc(c)}</th>" for c in head)
    trs = "".join("<tr>" + "".join(f"<td>{esc(c)}</td>" for c in r) + "</tr>" for r in body)
    return (f'<div class="tw"><table><thead><tr>{th}</tr></thead>'
            f"<tbody>{trs}</tbody></table></div>")

# ---------------------------------------------------------------------------
# Markdown (the expansion) -> HTML. Small on purpose: it only has to handle
# what PART-6 actually uses.
# ---------------------------------------------------------------------------
def md_inline(s):
    s = esc(s)
    s = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", s)
    s = re.sub(r"(?<!\*)\*([^*]+?)\*(?!\*)", r"<em>\1</em>", s)
    s = re.sub(r"`([^`]+?)`", r"<code>\1</code>", s)
    return s

def md_to_html(md):
    out, lines, i = [], md.split("\n"), 0
    while i < len(lines):
        ln = lines[i]
        if re.match(r"^\|.*\|\s*$", ln) and i + 1 < len(lines) and re.match(r"^\|[\s:|-]+\|\s*$", lines[i+1]):
            head = [c.strip() for c in ln.strip().strip("|").split("|")]
            i += 2
            rows = []
            while i < len(lines) and re.match(r"^\|.*\|\s*$", lines[i]):
                rows.append([c.strip() for c in lines[i].strip().strip("|").split("|")]); i += 1
            th = "".join(f"<th>{md_inline(c)}</th>" for c in head)
            trs = "".join("<tr>" + "".join(f"<td>{md_inline(c)}</td>" for c in r) + "</tr>" for r in rows)
            out.append(f'<div class="tw"><table><thead><tr>{th}</tr></thead><tbody>{trs}</tbody></table></div>')
            continue
        if ln.startswith("### "):
            # The expansion writes its callouts as headings ("### 💬 Dialogue · …").
            # Tag them so they get the same visual treatment as the original
            # manuscript's boxed ones, instead of reading as plain h3s.
            t = ln[4:]
            marker = next((k for k in CALLOUTS if t.strip().startswith(k)), None)
            cls = f' class="cue {CALLOUTS[marker][0]}"' if marker else ""
            out.append(f"<h3{cls}>{md_inline(t)}</h3>"); i += 1; continue
        if ln.startswith("## "):
            t = ln[3:]
            out.append(f'<h2 id="{slug(t)}">{md_inline(t)}</h2>'); i += 1; continue
        if ln.startswith("# "):
            out.append(f'<h1 class="part" id="{slug(ln[2:])}">{md_inline(ln[2:])}</h1>'); i += 1; continue
        if ln.strip() == "---":
            i += 1; continue
        if re.match(r"^\s*[-*] ", ln):
            items = []
            while i < len(lines) and re.match(r"^\s*[-*] ", lines[i]):
                items.append(re.sub(r"^\s*[-*] ", "", lines[i])); i += 1
            out.append("<ul>" + "".join(f"<li>{frenchify(md_inline(x))}</li>" for x in items) + "</ul>")
            continue
        if re.match(r"^\d+\. ", ln):
            items = []
            while i < len(lines) and re.match(r"^\d+\. ", lines[i]):
                items.append(re.sub(r"^\d+\. ", "", lines[i])); i += 1
            out.append("<ol>" + "".join(f"<li>{md_inline(x)}</li>" for x in items) + "</ol>")
            continue
        if not ln.strip():
            i += 1; continue
        buf = []
        while i < len(lines) and lines[i].strip() and not re.match(r"^(#|\||\s*[-*] |\d+\. |---)", lines[i]):
            buf.append(lines[i]); i += 1
        out.append(f"<p>{md_inline(' '.join(buf))}</p>")
    return "\n".join(out)


# ---------------------------------------------------------------------------
# Chapter openers.
#
# A part used to be a heading at the top of an otherwise ordinary page, which
# made the six parts of the book feel like six more sections. Each now gets its
# own page: the number, the title, the part's own introduction, and the list of
# what is in it -- so a reader flicking through can see where they are and what
# is coming.
#
# Two duplicates are dropped here as well. The manuscript carries its own
# "How to use this workbook" and an empty "Table des matières" (it was an
# unbuilt Word field); wrap.py generates real versions of both, so keeping the
# originals printed each of them twice.
# ---------------------------------------------------------------------------
H1 = re.compile(r'<h1 class="part" id="([^"]+)">(.*?)</h1>')
DROP_FROM_BODY = ("Comment utiliser ce livret", "Table des matières")
# Not chapters: these continue the section before them.
DEMOTE = ("Corrigé · Answer Key (exercices",)

def chapterise(body):
    marks = [(m.start(), m.end(), m.group(1), m.group(2)) for m in H1.finditer(body)]
    if not marks:
        return body
    out, cursor = [], 0
    for i, (start, end, anchor, title) in enumerate(marks):
        out.append(body[cursor:start])
        nxt = marks[i + 1][0] if i + 1 < len(marks) else len(body)
        chunk = body[end:nxt]
        cursor = nxt

        plain = re.sub(r"<[^>]+>", "", title).strip()
        if any(plain.startswith(d) for d in DROP_FROM_BODY):
            continue  # wrap.py supplies a better one

        if any(plain.startswith(d) for d in DEMOTE):
            out.append(f'<h2 id="{anchor}">{title}</h2>')
            out.append(chunk)
            continue

        # The intro is whatever sits between the part heading and its first
        # section; the contents are that part's section headings.
        first_h2 = chunk.find("<h2")
        before_h2 = chunk[:first_h2] if first_h2 != -1 else chunk
        rest = chunk[first_h2:] if first_h2 != -1 else ""
        secs = [re.sub(r"<[^>]+>", "", t).strip()
                for _, t in re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', rest)]

        # A back-matter chapter (Corrigé, Ressources, Coin du professeur) has no
        # sections at all, so "everything before the first h2" is the whole
        # chapter. Putting that inside a fixed-height, centred flex box made it
        # overflow the page and print on top of the pages after it. Those get a
        # plain page-breaking heading instead of a full opener.
        if not secs:
            out.append(f'<h1 class="chapter-plain" id="{anchor}">{title}</h1>')
            out.append(chunk)
            continue

        # Only the opening paragraphs belong on the opener page; anything else
        # the part says before its first section flows on afterwards.
        paras = re.findall(r"<(?:p|aside)\b[\s\S]*?</(?:p|aside)>", before_h2)
        intro_html = "".join(paras[:2])
        spill = "".join(paras[2:])

        # "PARTIE 3 · Niveau A2–B1 — Verbes irréguliers" -> label + title
        if " · " in plain:
            label, rest_title = plain.split(" · ", 1)
        else:
            label, rest_title = "", plain

        toc = ""
        if secs:
            lis = "".join(f"<li>{x}</li>" for x in secs)
            toc = f'<ol class="opener-toc">{lis}</ol>'

        out.append(
            f'<section class="opener" id="{anchor}">'
            f'{f"<p class=chapter-n>{label}</p>" if label else ""}'
            f'<h1 class="chapter-t">{rest_title}</h1>'
            f'<div class="opener-intro">{intro_html}</div>'
            f"{toc}"
            f"</section>"
        )
        out.append(spill)
        out.append(rest)
    out.append(body[cursor:])
    return "".join(out)


# ---------------------------------------------------------------------------
# Turn the blanks into inputs.
#
# Every exercise item that has a known answer becomes a real field the reader
# can type into. Items without one keep their "______" and stay printed text --
# a workbook that marks a right answer wrong is worse than one that does not
# mark at all.
#
# The data attributes are all the runtime needs; the answers themselves are
# emitted once as JSON, so the same markup serves the PDF (where the inputs
# print as ruled lines) and the screen.
# ---------------------------------------------------------------------------
ITEM = re.compile(r"^(\d+)\.\s")

def interactivise(body, answers):
    def blank(ex, i):
        return (f'<input class="blank" type="text" autocomplete="off" '
                f'autocapitalize="off" spellcheck="false" '
                f'data-ex="{ex}" data-i="{i}" aria-label="Exercice {ex}, item {i}">')

    def do_box(m):
        inner = m.group(0)
        # The callout renderer strips the "Exercice" label into .box-l, so the
        # number is left alone at the head of the first paragraph:
        # <p>26 — Conjuguez à l'imparfait</p>. Item paragraphs use a dot
        # ("1. Je (danser)..."), so the dash is what tells the two apart.
        ex = (re.search(r'<p>(\d+)\s*[—–-]', inner)
              or re.search(r"Exercice\s+(\d+)", inner))
        if not ex:
            return inner
        n = ex.group(1)
        key = {str(it["i"]) for it in answers.get(n, [])}
        if not key:
            return inner

        def one(em):
            tag, num, rest = em.group(1), em.group(2), em.group(3)
            if num in key and "______" in rest:
                rest = rest.replace("______", blank(n, num), 1)
            return f"<{tag}>{num}. {rest}</{tag}>"

        return re.sub(r"<(p|li)>(\d+)\.\s([\s\S]*?)</\1>", one, inner)

    # Exercise boxes from the manuscript.
    body = re.sub(r'<aside class="box exercice">[\s\S]*?</aside>', do_box, body)

    # The expansion writes its exercises as a heading plus an ordered list, so
    # the number lives in the heading and the items in the <li>s after it.
    def do_md(m):
        head, lst = m.group(0), m.group(2)
        ex = re.search(r"Exercice\s+(\d+)", m.group(1))
        if not ex:
            return head
        n = ex.group(1)
        key = {str(it["i"]): it for it in answers.get(n, [])}
        if not key:
            return head
        idx = [0]
        def li(lm):
            idx[0] += 1
            num = str(idx[0])
            if num not in key or "______" not in lm.group(0):
                return lm.group(0)
            return lm.group(0).replace("______", blank(n, num), 1)
        return head.replace(lst, re.sub(r"<li>[\s\S]*?</li>", li, lst))

    body = re.sub(r'(<h3 class="cue exercice">[\s\S]*?</h3>)\s*(<ol>[\s\S]*?</ol>)', do_md, body)
    return body

def main():
    blocks = json.load(open(HERE / "blocks.json"))
    applied = apply_fixes(blocks)
    print(f"corrections applied: {len(applied)}")
    for a in sorted(set(applied)):
        print("  ✓", a)
    missed = [l for _, _, l in FIXES if l not in applied]
    for m in missed:
        print("  ! NOT FOUND:", m)

    md = (ROOT / "PART-6-B1-B2-expansion.md").read_text()
    # Split the expansion: the sections, and its answer key.
    key_i = md.index("# Corrigé · Answer Key")
    expansion_html = md_to_html(md[md.index("## 2.11"):key_i])
    expansion_key = md_to_html(md[key_i:])

    book = render_blocks(blocks)

    # Splice: the expansion sits before the answer key; the two keys join.
    anchor = '<h2 id="s4-1"'
    corrige = re.search(r'<p>Corrigé · Answer Key</p>|<h[12][^>]*>Corrigé', book)
    if corrige:
        cut = corrige.start()
        book = book[:cut] + expansion_html + "\n" + book[cut:]
        # The expansion's answers belong immediately after the original ones,
        # not stranded past Ressources at the very back of the book.
        res = re.search(r'<h1 class="part" id="[^"]*ressources[^"]*">', book)
        if res:
            book = book[:res.start()] + expansion_key + "\n" + book[res.start():]
        else:
            book = book + "\n" + expansion_key
    else:
        book = book + "\n" + expansion_html + "\n" + expansion_key

    book = chapterise(book)

    exercises = json.load(open(HERE / "exercises.json")) if (HERE / "exercises.json").exists() else {}
    book = interactivise(book, exercises)
    print(f"interactive blanks: {book.count('class=\"blank\"')}")
    (HERE / "book-body.html").write_text(book)
    words = len(re.sub(r"<[^>]+>", " ", book).split())
    print(f"\nbody written: {len(book):,} bytes · ~{words:,} words")

if __name__ == "__main__":
    main()
