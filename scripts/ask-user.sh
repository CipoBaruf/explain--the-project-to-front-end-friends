#!/usr/bin/env bash
# Ask the user a question via Telegram, then return immediately — does NOT wait
# for the answer. Waiting is owned by scripts/run-agent.sh (the orchestrator that
# invokes this session), not by this script or by the agent's own tool call: a
# model choosing to run this in the background and end its turn used to silently
# abandon the question (headless `claude -p` is single-shot — the process exits
# the moment the model stops, killing any backgrounded child with it). Now there
# is nothing to background: call this, then stop. run-agent.sh polls for the
# reply and resumes this same session once it arrives.
#
# Usage: ask-user.sh <issue-number> "question"
#
# How it works: the question is sent to the user's Telegram chat, and the tracking
# issue is labeled "awaiting-answer" — this is the signal both the relay and
# run-agent.sh use to know a reply should be treated as the answer to THIS
# question. The user replies in Telegram; the relay posts that reply as a comment
# starting with "[answer]" on the tracking issue. run-agent.sh polls for it and
# clears the label once found (or on its own timeout).
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
# GITHUB_REPOSITORY.
set -euo pipefail

ISSUE="$1"
QUESTION="$2"

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

echo "Question sent. Stop here — do not keep working, do not call this again expecting a reply in this turn. You will be resumed automatically once the user answers."
