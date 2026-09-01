#!/usr/bin/env python3
"""
Master the pack: trim, level, limit.

Raw TTS output is not a product. Straight from the API this pack had a 10.7 dB
spread between its quietest and loudest clip — enough that a learner working
through a section would reach for the volume between one clip and the next —
peaks pinned at 0 dBFS on some clips, and up to 2.5 seconds of dead air at the
edges of others.

Three passes, in this order:

  trim   leading and trailing silence, leaving a short natural pad
  level  every clip to the same RMS, so nothing jumps
  limit  peaks below -1 dBFS, so nothing distorts after the gain

Idempotent by way of a marker file: mastering twice would compound the gain.
"""
import subprocess, pathlib, wave, struct, tempfile, os, math, sys, shutil

PACK   = pathlib.Path(__file__).parent / "audio" / "pack"
DONE   = PACK / ".mastered"
TARGET = -20.0      # dBFS RMS. Quiet enough to keep headroom, loud enough on a phone.
CEIL   = -1.0       # dBFS peak.
PAD    = 0.12       # seconds of silence kept at each end.

def decode(p):
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as t: w = t.name
    subprocess.run(["afconvert","-f","WAVE","-d","LEI16",str(p),w], capture_output=True)
    with wave.open(w) as f:
        sr, n = f.getframerate(), f.getnframes()
        raw = f.readframes(n)
    os.unlink(w)
    return list(struct.unpack(f"<{len(raw)//2}h", raw)), sr

def encode(samples, sr, dest):
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as t: w = t.name
    with wave.open(w, "wb") as f:
        f.setnchannels(1); f.setsampwidth(2); f.setframerate(sr)
        f.writeframes(struct.pack(f"<{len(samples)}h", *samples))
    r = subprocess.run(["afconvert","-f","m4af","-d","aac","-b","96000",w,str(dest)],
                       capture_output=True, text=True)
    os.unlink(w)
    return r.returncode == 0

def master(p):
    s, sr = decode(p)
    if not s: return None
    peak = max(abs(x) for x in s) or 1

    # --- trim ---
    win = sr // 100
    thr = max(250, peak // 50)
    amps = [max(abs(x) for x in s[i:i+win]) for i in range(0, len(s), win)]
    loud = [i for i, a in enumerate(amps) if a > thr]
    if loud:
        pad = int(PAD * sr)
        a = max(0, loud[0]*win - pad)
        b = min(len(s), (loud[-1]+1)*win + pad)
        s = s[a:b]
    if not s: return None

    # --- level ---
    rms = math.sqrt(sum(float(x)*x for x in s)/len(s)) or 1
    gain = (10 ** (TARGET/20) * 32768) / rms

    # --- limit: never let the gain push a peak past the ceiling ---
    peak = max(abs(x) for x in s) or 1
    ceil = 10 ** (CEIL/20) * 32768
    gain = min(gain, ceil / peak)

    out = [max(-32768, min(32767, int(x*gain))) for x in s]
    return out, sr

def main():
    if DONE.exists():
        sys.exit("already mastered (delete .mastered to force)")
    files = sorted(PACK.glob("*.m4a"))
    if not files: sys.exit(f"no clips in {PACK}")
    ok = fail = 0
    for i, f in enumerate(files, 1):
        r = master(f)
        if not r:
            fail += 1; print("  FAIL", f.name); continue
        samples, sr = r
        tmp = f.with_suffix(".tmp.m4a")
        if encode(samples, sr, tmp):
            shutil.move(str(tmp), str(f)); ok += 1
        else:
            tmp.unlink(missing_ok=True); fail += 1; print("  ENCODE FAIL", f.name)
        if i % 30 == 0: print(f"  {i}/{len(files)}…")
    DONE.write_text("mastered\n")
    print(f"\nmastered {ok} · failed {fail}")

if __name__ == "__main__":
    main()
