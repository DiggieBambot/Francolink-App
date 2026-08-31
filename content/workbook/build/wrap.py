#!/usr/bin/env python3
"""Wrap the book body in a complete HTML document: cover, TOC, print CSS."""
import re, pathlib, datetime, sys

HERE = pathlib.Path(__file__).parent
body = (HERE / "book-body.html").read_text()

# Build the table of contents from the headings the body already carries.
# Parts now carry their id on the opener <section>, not on the heading, so the
# contents has to look for both shapes or it silently loses every chapter.
toc = []
pat = re.compile(
    r'<section class="opener" id="([^"]+)">'
    r'(?:<p class=chapter-n>(.*?)</p>)?'
    r'<h1 class="chapter-t">(.*?)</h1>'
    r'|<h2 id="([^"]+)">(.*?)</h2>'
)
for m in pat.finditer(body):
    if m.group(1):
        label = re.sub(r"<[^>]+>", "", m.group(2) or "").strip()
        title = re.sub(r"<[^>]+>", "", m.group(3)).strip()
        toc.append(("part", m.group(1), f"{label} · {title}" if label else title))
    else:
        toc.append(("sec", m.group(4), re.sub(r"<[^>]+>", "", m.group(5))))

toc_html = []
for kind, anchor, label in toc:
    cls = "toc-part" if kind == "part" else "toc-sec"
    toc_html.append(f'<li class="{cls}"><a href="#{anchor}">{label}</a></li>')

YEAR = datetime.date.today().year
DOC = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<title>Le Français Pas à Pas — Grammaire &amp; Pratique · A0 → B2</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Instrument+Sans:wght@400;500;600&display=swap">
<style>{(HERE / 'book.css').read_text()}</style>
</head><body>

<section class="cover">
  <p class="cover-k">Grammaire &amp; Pratique</p>
  <h1 class="cover-t">Le Français<br>Pas à Pas</h1>
  <p class="cover-l">A0 → B2</p>
  <p class="cover-s">A progressive grammar workbook — explained,<br>with examples, dialogues &amp; exercises</p>
  <p class="cover-a">Njinu Precious Bambot</p>
</section>

<section class="front">
  <h2 class="nonum">Table des matières · Contents</h2>
  <ul class="toc">{''.join(toc_html)}</ul>
</section>

<section class="front">
  <h2 class="nonum">How to use this workbook</h2>
  <p>Every grammar point here is explained, not just shown: you get the rule, the reason behind it, worked examples, the mistakes to avoid, and a chance to see the structure in a short conversation before you practise it.</p>
  <div class="tw"><table><thead><tr><th>Element</th><th>What it does</th></tr></thead><tbody>
  <tr><td>🧩 Comment ça marche</td><td>A step-by-step breakdown of how to build the form.</td></tr>
  <tr><td>📊 Table</td><td>Conjugations, rules and sound charts for quick reference.</td></tr>
  <tr><td>• Exemples</td><td>Model sentences with English glosses, simple → complex.</td></tr>
  <tr><td>💬 Dialogue</td><td>The structure used in a real mini-conversation.</td></tr>
  <tr><td>✗ / ✓ Erreurs</td><td>The most common learner mistakes, beside the fix.</td></tr>
  <tr><td>💡 Astuce · ⚠️ Attention · 🌍 Culture</td><td>Memory hooks, warnings, and how French is really used.</td></tr>
  <tr><td>✎ Exercice</td><td>Practice. Every answer is in the Corrigé at the back.</td></tr>
  </tbody></table></div>
  <p class="note"><strong>CEFR at a glance.</strong> A0–A1 = sounds, survival phrases and first sentences · A2 = everyday routines, the past and the near future · B1 = narrating and hypothesising · B2 = nuance, opinion and the subjunctive.</p>
</section>

{body}

<section class="colophon">
  <p>© {YEAR} Njinu Precious Bambot. All rights reserved.</p>
  <p>Published by FrancoLink · francolink.net</p>
  <p class="lic">This copy is licensed to one reader. Please don't redistribute it — the book exists because people pay for it.</p>
</section>

</body></html>"""

(HERE / "book.html").write_text(DOC)
words = len(re.sub(r"<[^>]+>", " ", DOC).split())
print(f"book.html · {len(DOC):,} bytes · ~{words:,} words · {len(toc)} TOC entries")
