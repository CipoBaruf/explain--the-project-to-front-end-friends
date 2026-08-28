#!/usr/bin/env bash
# Ask the user a question via Telegram and wait for their answer.
#
# Usage: ask-user.sh <issue-number> "question"
# Prints the answer to stdout; exits non-zero on timeout.
#
# How it works: the question is sent to the user's Telegram chat, and the tracking
# issue is labeled "awaiting-answer" — this is the signal the relay uses to know a
# plain-text reply should be treated as an answer rather than as unrelated chatter
# (see auto-flow-relay's isAwaitingAnswer). The user replies in Telegram; the relay
# posts that reply as a comment starting with "[answer]" on the tracking issue. This
# script polls for such a comment and clears the label once it finds one (or on
# timeout), so the window where plain text = answer is exactly this call's lifetime.
#
# Small-choice questions: if $QUESTION ends with a "[options: A | B | C]" hint (see
# AGENTS.md, "Asking the user"), this attaches a Telegram inline keyboard — one
# button per option, callback_data "q:<issue>:<0-based index>" — so the relay can
# resolve an answer to a tap instead of free text. The hint is deliberately left in
# the sent message text (not stripped): the relay recovers the option list by
# re-parsing the same "[options: ...]" hint straight off the delivered message
# (ctx.callbackQuery.message.text) rather than needing it encoded in callback_data,
# so both sides must agree on this exact convention. It's also a readable fallback
# if buttons don't render on some client. A question with no such hint sends exactly
# as before — plain text, no keyboard — that path is untouched.
#
# Needs: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID, GH_TOKEN (gh CLI auth),
# GITHUB_REPOSITORY. Optional: ASK_TIMEOUT_MINUTES (default 240).
set -euo pipefail

ISSUE="$1"
QUESTION="$2"
TIMEOUT_MINUTES="${ASK_TIMEOUT_MINUTES:-240}"
POLL_SECONDS=20
ASKED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)

clear_label() {
  gh issue edit "$ISSUE" --repo "$GITHUB_REPOSITORY" --remove-label "awaiting-answer" >/dev/null 2>&1 || true
}

gh label create "awaiting-answer" --repo "$GITHUB_REPOSITORY" --color FBCA04 --force >/dev/null 2>&1 || true
gh issue edit "$ISSUE" --repo "$GITHUB_REPOSITORY" --add-label "awaiting-answer" >/dev/null

# Extract "[options: A | B | C]" (case-insensitive), if present. Portable POSIX ERE
# (no PCRE lookaround) so this doesn't depend on GNU grep specifically.
OPTIONS_RAW=$(printf '%s' "$QUESTION" | sed -nE 's/.*\[[Oo][Pp][Tt][Ii][Oo][Nn][Ss]:([^]]*)\].*/\1/p')
REPLY_MARKUP=""
if [ -n "$OPTIONS_RAW" ]; then
  IFS='|' read -ra RAW_OPTS <<< "$OPTIONS_RAW"
  OPTIONS=()
  for opt in "${RAW_OPTS[@]}"; do
    trimmed=$(printf '%s' "$opt" | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//')
    [ -n "$trimmed" ] && OPTIONS+=("$trimmed")
  done
  if [ "${#OPTIONS[@]}" -gt 0 ]; then
    REPLY_MARKUP=$(printf '%s\n' "${OPTIONS[@]}" | jq -R -s --arg issue "$ISSUE" '
      split("\n") | map(select(length > 0)) | to_entries |
      map({text: (.value[0:60]), callback_data: ("q:" + $issue + ":" + (.key|tostring))}) |
      map([.]) | {inline_keyboard: .}
    ')
  fi
fi

if [ -n "$REPLY_MARKUP" ]; then
  curl -fsS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "text=❓ [#${ISSUE}] ${QUESTION}" \
    --data-urlencode "reply_markup=${REPLY_MARKUP}" \
    -o /dev/null
else
  curl -fsS "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    --data-urlencode "chat_id=${TELEGRAM_CHAT_ID}" \
    --data-urlencode "text=❓ [#${ISSUE}] ${QUESTION}" \
    -o /dev/null
fi

DEADLINE=$(( $(date +%s) + TIMEOUT_MINUTES * 60 ))
while [ "$(date +%s)" -lt "$DEADLINE" ]; do
  ANSWER=$(gh api "repos/${GITHUB_REPOSITORY}/issues/${ISSUE}/comments?since=${ASKED_AT}&per_page=100" \
    --jq '[.[] | select(.body | startswith("[answer]"))] | last | .body // empty' 2>/dev/null || true)
  if [ -n "$ANSWER" ]; then
    clear_label
    ./scripts/notify.sh "✅ [#${ISSUE}] Got your answer, agent is continuing..."
    printf '%s\n' "${ANSWER#\[answer\]}" | sed 's/^[[:space:]]*//'
    exit 0
  fi
  sleep "$POLL_SECONDS"
done

clear_label
echo "ask-user.sh: no answer within ${TIMEOUT_MINUTES} minutes" >&2
exit 1
