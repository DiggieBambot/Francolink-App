#!/usr/bin/env python3
"""
Technical audit of the generated pack.

This cannot tell you whether the French is right — that needs a person. It can
tell you whether the pack is shippable as a product: nothing silent, nothing
clipped, nothing truncated, nothing wildly louder than its neighbours, and no
dead air at the edges. A pack where the listener reaches for the volume between
clips is not a $17 product, however good the pronunciation is.
"""
import subprocess, pathlib, wave, struct, tempfile, os, json, math, sys

PACK = pathlib.Path(__file__).parent / "audio" / "pack"

def decode(p):
    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as t:
        w = t.name
    subprocess.run(["afconvert", "-f", "WAVE", "-d", "LEI16", str(p), w],
                   capture_output=True)
    try:
        with wave.open(w) as f:
            sr, n = f.getframerate(), f.getnframes()
            raw = f.readframes(n)
    finally:
        os.unlink(w)
    if not raw:
        return None, None
    return struct.unpack(f"<{len(raw)//2}h", raw), sr

def analyse(p):
    s, sr = decode(p)
    if not s:
        return {"error": "undecodable"}
    peak = max(abs(x) for x in s)
    rms = math.sqrt(sum(float(x) * x for x in s) / len(s))
    win = sr // 50                                   # 20 ms
    amps = [max(abs(x) for x in s[i:i + win]) for i in range(0, len(s), win)]
    thr = max(300, peak // 60)
    loud = [i for i, a in enumerate(amps) if a > thr]
    if not loud:
        return {"error": "silent", "peak": peak}
    return {
        "dur": len(s) / sr,
        "peak_db": 20 * math.log10(peak / 32768) if peak else -99,
        "rms_db": 20 * math.log10(rms / 32768) if rms else -99,
        "lead": loud[0] * win / sr,
        "trail": (len(amps) - 1 - loud[-1]) * win / sr,
        "clipped": sum(1 for x in s if abs(x) >= 32700),
        "end_amp": amps[loud[-1]] / 32768,           # loud at the very end = cut off
    }

def main():
    files = sorted(PACK.glob("*.m4a"))
    if not files:
        sys.exit(f"no clips in {PACK}")
    rows, problems = [], []
    for f in files:
        a = analyse(f)
        a["name"] = f.name
        rows.append(a)
        if "error" in a:
            problems.append(("BROKEN", f.name, a["error"]))
            continue
        if a["rms_db"] < -40:            problems.append(("very quiet", f.name, f"{a['rms_db']:.1f} dB RMS"))
        if a["clipped"] > 50:            problems.append(("clipping", f.name, f"{a['clipped']} samples"))
        if a["lead"] > 0.8:              problems.append(("dead air at start", f.name, f"{a['lead']:.2f}s"))
        if a["trail"] > 1.5:             problems.append(("dead air at end", f.name, f"{a['trail']:.2f}s"))
        if a["end_amp"] > 0.35 and a["trail"] < 0.10:
            problems.append(("possibly cut off", f.name, f"ends loud at {a['end_amp']:.2f}"))

    ok = [r for r in rows if "error" not in r]
    rmss = sorted(r["rms_db"] for r in ok)
    print(f"clips            : {len(files)}")
    print(f"decoded          : {len(ok)}")
    print(f"total audio      : {sum(r['dur'] for r in ok)/60:.1f} min")
    print(f"loudness (RMS dB): min {rmss[0]:.1f} · median {rmss[len(rmss)//2]:.1f} · max {rmss[-1]:.1f}")
    print(f"loudness spread  : {rmss[-1]-rmss[0]:.1f} dB   (under ~8 dB sounds consistent)")
    print(f"peak headroom    : max {max(r['peak_db'] for r in ok):.1f} dBFS")
    print(f"lead silence     : median {sorted(r['lead'] for r in ok)[len(ok)//2]:.2f}s")
    print(f"trail silence    : median {sorted(r['trail'] for r in ok)[len(ok)//2]:.2f}s")

    if problems:
        print(f"\n{len(problems)} issues:")
        by = {}
        for kind, name, detail in problems:
            by.setdefault(kind, []).append((name, detail))
        for kind, items in sorted(by.items(), key=lambda x: -len(x[1])):
            print(f"\n  {kind} ({len(items)}):")
            for name, detail in items[:6]:
                print(f"    {name:34} {detail}")
            if len(items) > 6:
                print(f"    … and {len(items)-6} more")
    else:
        print("\nno technical problems found")

if __name__ == "__main__":
    main()
