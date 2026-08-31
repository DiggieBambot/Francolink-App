# Building the book

Three artefacts, one source. Never edit the PDF or `book.html` by hand — the
next build silently reverts it. Corrections go in `FIXES` in `build.py`.

```bash
cd content/workbook/build
python3 extract.py "/path/to/Le_Francais_Pas_a_Pas_A0-B2.docx" blocks.json
python3 exercises.py          # answer key -> exercises.json
python3 build.py              # manuscript + expansion + fixes -> book-body.html
python3 wrap.py               # + cover, TOC, screen CSS, runtime -> book.html

"/Applications/Google Chrome.app/Contents/MacOS/Google Chrome" \
  --headless --disable-gpu --no-sandbox --virtual-time-budget=25000 \
  --no-pdf-header-footer \
  --print-to-pdf="$PWD/Le-Francais-Pas-a-Pas.pdf" "file://$PWD/book.html"
```

Then publish the three files the app serves:

```bash
cp Le-Francais-Pas-a-Pas.pdf ../../../assets/workbook/book.pdf
cp book.html                 ../../../assets/workbook/book.html
cp book-body.html            ../../../src/lib/workbook/content/book-body.html
cp exercises.json            ../../../src/lib/workbook/content/exercises.json
```

`assets/workbook/**` is traced into the download function by `next.config.ts`.
It is deliberately NOT under `public/` — that directory is served to anyone who
guesses the path, and this is the paid product.
