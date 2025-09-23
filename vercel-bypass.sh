#!/usr/bin/env bash
set -euo pipefail

# Usage:
#   ./vercel-bypass.sh https://thaiba-media-dashboard.vercel.app /api/debug/sheets
#   ./vercel-bypass.sh                              # interactive

HOST=${1:-"https://thaiba-media-dashboard.vercel.app"}
ENDPOINTS=( "/api/ping" "/api/debug/sheets" "/api/roles?email=media@thaibagarden.com" "/api/tasks?email=media@thaibagarden.com" )

# Cookie jar path (temporary)
COOKIE_JAR="${TMPDIR:-/tmp}/vercel_bypass_cookie.jar"

# get token from env or prompt
if [[ -z "${VERCEL_BYPASS_TOKEN:-}" ]]; then
  read -r -p "Enter Vercel bypass token: " -s VERCEL_BYPASS_TOKEN
  echo
fi

echo "Using host: $HOST"
echo "Writing cookie jar to: $COOKIE_JAR"

# 1) Set bypass cookie (saves cookie)
curl -s -c "$COOKIE_JAR" \
  "${HOST}/?x-vercel-set-bypass-cookie=true&x-vercel-protection-bypass=${VERCEL_BYPASS_TOKEN}" \
  >/dev/null

# check cookie was saved
if ! grep -q _vercel_sso_nonce "$COOKIE_JAR" 2>/dev/null; then
  echo "Warning: cookie not saved. Protection may still block requests."
fi

# If a specific endpoint passed, call only that, otherwise call all endpoints
if [[ -n "${2:-}" ]]; then
  EP="${2}"
  echo "Calling: ${HOST}${EP}"
  curl -sv -b "$COOKIE_JAR" "${HOST}${EP}"
  exit 0
fi

# Otherwise call the default endpoints
for ep in "${ENDPOINTS[@]}"; do
  echo
  echo "==> GET ${HOST}${ep}"
  curl -sv -b "$COOKIE_JAR" "${HOST}${ep}" || true
done
