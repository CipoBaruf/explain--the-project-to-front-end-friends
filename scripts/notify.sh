#!/usr/bin/env bash
# Send a Telegram message to the project owner.
# Usage: notify.sh "message"  (needs TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)
set -euo pipefail

if [ -z "${TELEGRAM_BOT_TOKEN:-}" ] || [ -z "${TELEGRAM_CHAT_ID:-}" ]; then
  echo "notify.sh: Telegram secrets not configured, skipping: $1" >&2
  exit 0
fi

curl -fsS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
  --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
  --data-urlencode "text=$1" \
  -o /dev/null
