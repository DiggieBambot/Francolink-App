#!/usr/bin/env python3
"""
Inworld TTS for the workbook audio pack.

Run mode `test` first. PRD decision 9.2 gates the whole audio pack on an
acceptance test, because the book teaches SOUND in 1.1-1.6 -- nasal vowels,
liaison, the French u, the guttural r -- and a synthesised voice that gets
those wrong would be teaching wrong pronunciation to people who cannot yet
hear the difference. That is worse than shipping no audio at all.

The slow pass is half the product and most TTS degrades badly when slowed,
so every diagnostic is generated at both speeds.

  python3 tts.py test          # ~28 clips: 4 voices + the hard sounds
  python3 tts.py build         # the full pack, once a voice is chosen
"""
import base64, json, os, pathlib, subprocess, sys, tempfile

KEY = os.environ.get("INWORLD_API_KEY")
OUT = pathlib.Path(__file__).parent / "audio"
API = "https://api.inworld.ai/tts/v1/voice"
VOICES = ["Hélène", "Alain", "Mathieu", "Étienne"]

def say(text, voice, speed, path):
    """POST through curl rather than urllib.

    This Python has no CA bundle (a python.org install without
    Install Certificates.command), so every urllib call to the API failed with
    CERTIFICATE_VERIFY_FAILED. curl uses the system trust store and works."""
    if path.exists():
        return "cached"
    # The rate lives in audioConfig.speakingRate. A top-level "speed" is
    # accepted and silently ignored: identical text at speed 0.5/0.7/1.0/1.3
    # came back 5.5s/4.7s/6.9s/4.2s -- no relationship at all, just run-to-run
    # prosody variation. With speakingRate it is monotonic:
    # 0.5 -> 10.2s, 0.65 -> 7.2s, 0.8 -> 6.1s, 1.0 -> 4.7s.
    body = json.dumps({
        "text": text, "voice_id": voice, "model_id": "inworld-tts-1",
        "language": "fr", "audioConfig": {"speakingRate": speed},
    })
    with tempfile.NamedTemporaryFile("w", suffix=".json", delete=False) as f:
        f.write(body); payload = f.name
    try:
        r = subprocess.run(
            ["curl", "-s", "-m", "120", "-X", "POST", API,
             "-H", f"Authorization: Basic {KEY}",
             "-H", "Content-Type: application/json",
             "--data-binary", f"@{payload}"],
            capture_output=True, text=True)
        data = json.loads(r.stdout or "{}")
    except Exception as e:
        return f"ERROR {e}"
    finally:
        os.unlink(payload)
    if "error" in data or "message" in data and "audioContent" not in data:
        return f"ERROR {str(data)[:110]}"
    audio = data.get("audioContent")
    if not audio:
        return "ERROR no audioContent"
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(base64.b64decode(audio))
    return f"{path.stat().st_size // 1024}KB"

def slug(s, n=42):
    s = s.lower().replace("'", "").replace("’", "")
    s = "".join(c if c.isalnum() or c == " " else " " for c in
                s.encode("ascii", "ignore").decode())
    return "-".join(s.split())[:n] or "clip"

# The diagnostics: every one is a sound the book explicitly teaches, chosen so
# a wrong rendering is obvious rather than subtle.
DIAGNOSTICS = [
    ("nasal-3",     "un bon vin blanc"),                         # the three nasals in a row
    ("nasal-pair",  "an, année. Bon, bonne. Fin, fine."),        # nasal vs non-nasal
    ("liaison",     "nous avons, les amis, vous avez, un grand arbre"),
    ("u-ou",        "tu, tout. Rue, roue. Su, sous."),           # the contrast learners miss
    ("r",           "rouge, Paris, très, une rue parisienne"),
    ("silent",      "temps, chat, grand, nez, ils mangent"),     # silent finals
    ("accents",     "été, père, fête, où, garçon"),
]

DIALOGUE = ("dialogue-a",
  "Léa : Salut ! Comment ça va ? "
  "Sam : Ça va bien, merci ! Et toi ? "
  "Léa : Très bien. Comment tu t'appelles ? "
  "Sam : Je m'appelle Sam. Je suis canadien et j'habite à Toronto.")

def build(voice):
    """Generate the pack from audio-manifest.json.

    Idempotent: a clip that already exists on disk is skipped, so a failed run
    is resumed by running it again rather than paying for everything twice.
    """
    manifest = json.loads((pathlib.Path(__file__).parent / "audio-manifest.json").read_text())
    pack = OUT / "pack"
    total = sum(2 if c["slow"] else 1 for c in manifest)
    made = skipped = failed = 0
    print(f"voice: {voice} · {len(manifest)} clips · {total} renders\n")

    for c in manifest:
        speeds = [(1.0, "normal")] + ([(0.65, "slow")] if c["slow"] else [])
        for rate, tag in speeds:
            path = pack / f"{c['id']}-{tag}.mp3"
            r = say(c["text"], voice, rate, path)
            if r == "cached":
                skipped += 1
            elif r.startswith("ERROR"):
                failed += 1
                print(f"  FAIL {c['id']}-{tag}: {r}")
            else:
                made += 1
                if made % 20 == 0:
                    print(f"  {made} generated…")

    print(f"\ngenerated {made} · already present {skipped} · failed {failed}")
    print(f"pack: {pack}")
    if failed:
        print("re-run to retry the failures; existing clips are skipped")


def test():
    print("=== A. one diagnostic across all four voices ===")
    for v in VOICES:
        r = say("un bon vin blanc, tu et tout, une rue parisienne", v, 1.0,
                OUT / "voice-compare" / f"{slug(v)}.mp3")
        print(f"  {v:10} {r}")

    print("\n=== B. the hard sounds, normal and slow ===")
    voice = VOICES[0]
    for name, text in DIAGNOSTICS + [DIALOGUE]:
        for speed, tag in ((1.0, "normal"), (0.65, "slow")):
            r = say(text, voice, speed, OUT / "diagnostics" / f"{name}-{tag}.mp3")
            print(f"  {name:12} {tag:7} {r}")
    print(f"\nvoice used for B: {voice}")
    print(f"clips in: {OUT}")

if __name__ == "__main__":
    if not KEY:
        sys.exit("INWORLD_API_KEY not set")
    mode = sys.argv[1] if len(sys.argv) > 1 else "test"
    if mode == "test":
        test()
    elif mode == "build":
        build(sys.argv[2] if len(sys.argv) > 2 else VOICES[0])
    else:
        sys.exit("usage: tts.py [test | build <voice>]")
