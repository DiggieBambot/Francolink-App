#!/usr/bin/env python3
"""
Push the generated pack into Supabase Storage.

The bucket is private: /api/workbook/audio/[clip] checks the buyer owns
audio_fpp and hands back a short-lived signed URL. Uploading here does not
make anything public.

Idempotent — an existing object is replaced, so re-running after regenerating
a few clips costs nothing extra.
"""
import json, os, pathlib, subprocess, sys

URL = os.environ.get("NEXT_PUBLIC_SUPABASE_URL")
KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
BUCKET = "workbook-audio"
PACK = pathlib.Path(__file__).parent / "audio" / "pack"

def api(method, path, data=None, headers=None, binary=None):
    cmd = ["curl", "-s", "-m", "120", "-X", method, f"{URL}{path}",
           "-H", f"apikey: {KEY}", "-H", f"Authorization: Bearer {KEY}"]
    for h in (headers or []):
        cmd += ["-H", h]
    if data is not None:
        cmd += ["-H", "Content-Type: application/json", "-d", json.dumps(data)]
    if binary is not None:
        cmd += ["--data-binary", f"@{binary}"]
    return subprocess.run(cmd, capture_output=True, text=True).stdout

def main():
    if not (URL and KEY):
        sys.exit("NEXT_PUBLIC_SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY not set")
    if not PACK.exists():
        sys.exit(f"no pack at {PACK} — run tts.py build <voice> first")

    r = api("POST", "/storage/v1/bucket",
            {"name": BUCKET, "id": BUCKET, "public": False})
    print("bucket:", "created" if '"name"' in r else r[:120])

    files = sorted(PACK.glob("*.mp3"))
    ok = fail = 0
    for f in files:
        out = api("POST", f"/storage/v1/object/{BUCKET}/{f.name}",
                  headers=["Content-Type: audio/mpeg", "x-upsert: true"],
                  binary=str(f))
        if '"Key"' in out or '"Id"' in out:
            ok += 1
        else:
            fail += 1
            print("  FAIL", f.name, out[:100])
        if ok and ok % 25 == 0:
            print(f"  {ok} uploaded…")
    total_mb = sum(f.stat().st_size for f in files) / 1024 / 1024
    print(f"\nuploaded {ok} · failed {fail} · {total_mb:.1f} MB in {BUCKET}")

if __name__ == "__main__":
    main()
