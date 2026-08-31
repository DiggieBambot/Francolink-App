#!/usr/bin/env python3
"""
Turn the .docx manuscript into structured blocks.

The earlier throwaway extractor flattened everything to text, which lost the
205 tables the book is largely made of -- the conjugations, the error boxes,
the "grammaire reperee" tables. This one walks the document body in order and
keeps paragraphs, headings and tables apart, so the HTML can rebuild them.
"""
import zipfile, re, json, sys, html
from xml.etree import ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"

def text_of(el):
    out = []
    for t in el.iter(f"{W}t"):
        out.append(t.text or "")
    for _ in el.iter(f"{W}br"):
        pass
    return "".join(out).strip()

def para(el):
    style = None
    ps = el.find(f"{W}pPr/{W}pStyle")
    if ps is not None:
        style = ps.get(f"{W}val")
    return {"kind": "p", "style": style, "text": text_of(el)}

def cell_text(tc):
    """Keep the paragraph breaks inside a cell.

    Most of this book's callouts and every exercise is a single-cell table, and
    joining their paragraphs with "" turned each one into a run-on string --
    "1. Demain...2. Nous...3. Prediction..." with nowhere to break a line."""
    parts = [text_of(p) for p in tc.findall(f"{W}p")]
    return "\n".join([p for p in parts if p])

def table(el):
    rows = []
    for tr in el.findall(f"{W}tr"):
        rows.append([cell_text(tc) for tc in tr.findall(f"{W}tc")])
    return {"kind": "table", "rows": rows}

def main(path, out):
    z = zipfile.ZipFile(path)
    root = ET.fromstring(z.read("word/document.xml"))
    body = root.find(f"{W}body")
    blocks = []
    for el in body:
        if el.tag == f"{W}p":
            b = para(el)
            if b["text"] or b["style"]:
                blocks.append(b)
        elif el.tag == f"{W}tbl":
            t = table(el)
            if any(any(c for c in r) for r in t["rows"]):
                blocks.append(t)
    json.dump(blocks, open(out, "w"), ensure_ascii=False, indent=1)
    kinds = {}
    for b in blocks:
        k = b["kind"] if b["kind"] != "p" else (b["style"] or "body")
        kinds[k] = kinds.get(k, 0) + 1
    print(f"{len(blocks)} blocks ->", out)
    for k, v in sorted(kinds.items(), key=lambda x: -x[1]):
        print(f"  {k:12} {v}")

if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
