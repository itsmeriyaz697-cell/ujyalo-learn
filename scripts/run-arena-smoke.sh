#!/usr/bin/env bash
# Boots the local API against the Firestore emulator, waits for it, runs the
# Arena end-to-end proof, then shuts it down. Called by `npm run test:arena`.
set -uo pipefail

export ARENA_ALLOW_TEST_AUTH=1
export FIREBASE_PROJECT_ID=demo-ujyalo
export DEV_API_PORT=8788

npx tsx server/dev-api.ts > /tmp/arena-api.log 2>&1 &
API_PID=$!

cleanup() { kill "$API_PID" 2>/dev/null || true; }
trap cleanup EXIT

for _ in $(seq 1 40); do
  if curl -sf "http://127.0.0.1:8788/api/health" > /dev/null 2>&1; then break; fi
  sleep 0.5
done

if ! curl -sf "http://127.0.0.1:8788/api/health" > /dev/null 2>&1; then
  echo "The local API did not start. Log:"; tail -30 /tmp/arena-api.log; exit 1
fi

ARENA_API_URL="http://127.0.0.1:8788/api/quiz-arena" node scripts/arena-smoke.mjs
STATUS=$?

if [ "$STATUS" -ne 0 ]; then
  echo "--- dev API log tail ---"; tail -20 /tmp/arena-api.log
fi
exit "$STATUS"
