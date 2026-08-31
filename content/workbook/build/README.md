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

## Audio pack

```bash
python3 audio_manifest.py              # what gets recorded -> audio-manifest.json
python3 tts.py test                    # 20 acceptance clips -> audio/
python3 tts.py build "<voice>"         # the pack -> audio/pack/  (144 renders)
python3 upload_audio.py                # -> private Supabase bucket workbook-audio
cp audio-manifest.json ../../../src/lib/workbook/content/audio.json
```

`tts.py build` is idempotent: clips already on disk are skipped, so a failed
run is resumed by running it again rather than paying twice.

Two things learned the hard way and encoded in `tts.py`:

* The rate is `audioConfig.speakingRate`. A top-level `speed` is accepted and
  silently ignored — 0.5/0.7/1.0/1.3 produced 5.5s/4.7s/6.9s/4.2s, no
  relationship at all.
* Inworld returns **MP3**, not WAV, whatever the extension says.

Clips are served by `/api/workbook/audio/[clip]`, which checks the buyer owns
`audio_fpp` and returns a 30-minute signed URL. The bucket is private; the
reader shows non-buyers what exists on that section and offers the $17 pack.
