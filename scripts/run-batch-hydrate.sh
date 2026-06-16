#!/bin/bash
# Calls the batch-hydrate API endpoint on production repeatedly to hydrate
# all English lesson images. Each call processes up to 3 lessons to stay
# well under the Vercel function timeout.

BASE_URL="https://app.francolink.net"
SERVICE_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJpd2FjbGxicGR4emR4dG1xdHB3Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDQ5OTUyMSwiZXhwIjoyMDg2MDc1NTIxfQ.5wCIs9XmsWykIg-AiZWaFg2koN0GKn_tXrZbXPXRakg"
LANGUAGE="en"
LIMIT=3
OFFSET=${1:-0}
TOTAL=279

echo "=== Batch Hydrate English Lessons ==="
echo "Starting at offset $OFFSET, limit $LIMIT"
echo ""

TOTAL_OK=0
TOTAL_SKIP=0
TOTAL_ERR=0

while [ "$OFFSET" -lt "$TOTAL" ]; do
  echo -n "Batch offset=$OFFSET ... "

  RESPONSE=$(curl -sS --http1.1 -X POST \
    "${BASE_URL}/api/admin/tutor-lessons/batch-hydrate?language=${LANGUAGE}&limit=${LIMIT}&offset=${OFFSET}" \
    -H "Authorization: Bearer ${SERVICE_KEY}" \
    -H "Content-Type: application/json" \
    --max-time 240 2>&1)

  # Check for curl errors
  if [ $? -ne 0 ]; then
    echo "CURL ERROR: $RESPONSE"
    echo "Retrying in 10s..."
    sleep 10
    continue
  fi

  # Parse response
  PARSED=$(echo "$RESPONSE" | python3 -c "
import json, sys
try:
    d = json.load(sys.stdin)
    if 'error' in d:
        print(f'ERROR:{d[\"error\"]}')
    else:
        ok = d.get('ok',0)
        skip = d.get('skipped',0)
        err = d.get('errored',0)
        print(f'OK:{ok}:{skip}:{err}')
        for r in d.get('results', []):
            s = r.get('stats', {})
            if r['status'] == 'ok':
                print(f'  ✓ {r[\"slug\"]}: {s.get(\"vocab\",0)}v {s.get(\"prompts\",0)}p {s.get(\"dialogues\",0)}d')
            elif r['status'] == 'error':
                print(f'  ✗ {r[\"slug\"]}: {r.get(\"error\",\"?\")[:60]}')
            else:
                print(f'  - {r[\"slug\"]}: skipped')
except Exception as e:
    print(f'PARSE_ERROR:{e}')
" 2>&1)

  echo "$PARSED" | head -1
  echo "$PARSED" | tail -n +2

  # Extract counts
  COUNTS=$(echo "$PARSED" | head -1)
  case "$COUNTS" in
    OK:*)
      IFS=':' read -r _ ok skip err <<< "$COUNTS"
      TOTAL_OK=$((TOTAL_OK + ok))
      TOTAL_SKIP=$((TOTAL_SKIP + skip))
      TOTAL_ERR=$((TOTAL_ERR + err))
      ;;
    ERROR:*)
      echo "  Server error. Retrying in 15s..."
      sleep 15
      continue
      ;;
    *)
      echo "  Unexpected response. Retrying in 15s..."
      sleep 15
      continue
      ;;
  esac

  OFFSET=$((OFFSET + LIMIT))

  # Brief pause between batches
  if [ "$OFFSET" -lt "$TOTAL" ]; then
    sleep 3
  fi
done

echo ""
echo "========================================"
echo "Complete!"
echo "  Hydrated: $TOTAL_OK"
echo "  Skipped:  $TOTAL_SKIP"
echo "  Errors:   $TOTAL_ERR"
echo "========================================"
