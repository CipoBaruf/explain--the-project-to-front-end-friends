#!/usr/bin/env bash
# Orchestrates one agent run, including any clarifying questions it asks along
# the way. This is the piece that actually WAITS for a Telegram answer — never
# the agent itself, which only ever asks (via ask-user.sh, now non-blocking) and
# stops. That split exists because a model choosing to background a blocking
# call and end its turn, expecting a later resumption, was silently abandoning
# every question asked in headless CI (claude -p is single-shot; the process
# exits the moment the model stops). Waiting here instead, in plain bash, isn't
# something a model can "choose" to skip.
#
# Flow: run (or resume) the same Claude session -> check the issue's
# awaiting-answer label (the only reliable signal, not the model's own text) ->
# if absent, the agent is done, exit 0 -> if present, poll for the "[answer]"
# comment, then resume the SAME session (claude -r) with that answer. Repeats
# up to MAX_ROUNDS times (AGENTS.md already asks for "few, batched" questions,
# so this should rarely exceed 1-2 in practice).
#
# Needs: ISSUE, DESCRIPTION, ACTION (feature-request|feature-changes), GH_TOKEN,
# GITHUB_REPOSITORY, CLAUDE_CODE_OAUTH_TOKEN, TELEGRAM_BOT_TOKEN,
# TELEGRAM_CHAT_ID. Optional: ASK_TIMEOUT_MINUTES (default 240).
set -euo pipefail

MAX_ROUNDS=10
POLL_SECONDS=20

if [ "$ACTION" = "feature-changes" ]; then
  TASK="The user tested this feature on staging and requests changes. Apply them on the current branch."
else
  TASK="Implement this new feature request."
fi

SESSION_ID=$(uuidgen)
PROMPT=$(printf '%s\n\nTracking issue: #%s\nRequest:\n%s\n\nFollow AGENTS.md strictly: implement in app/, add/update tests, iterate until "npm run check" passes inside app/, and update README.md / AGENTS.md per the definition of done. If anything is ambiguous, ask the user with: ./scripts/ask-user.sh %s "your question" -- it sends the question and returns immediately. After calling it, STOP: do not keep working, do not call it again expecting a reply in this turn. You will be resumed automatically, in a fresh turn, once the user answers. Do NOT run any git commands; the workflow handles git.' \
  "$TASK" "$ISSUE" "$DESCRIPTION" "$ISSUE")

is_awaiting_answer() {
  gh api "repos/${GITHUB_REPOSITORY}/issues/${ISSUE}" --jq '[.labels[].name] | any(. == "awaiting-answer")'
}

for round in $(seq 1 "$MAX_ROUNDS"); do
  if [ "$round" -eq 1 ]; then
    claude -p "$PROMPT" --session-id "$SESSION_ID" --dangerously-skip-permissions
  else
    claude -p "The user answered: ${ANSWER}" -r "$SESSION_ID" --dangerously-skip-permissions
  fi

  if [ "$(is_awaiting_answer)" != "true" ]; then
    exit 0
  fi

  ASKED_AT=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  DEADLINE=$(( $(date +%s) + ${ASK_TIMEOUT_MINUTES:-240} * 60 ))
  ANSWER=""
  while [ "$(date +%s)" -lt "$DEADLINE" ]; do
    ANSWER=$(gh api "repos/${GITHUB_REPOSITORY}/issues/${ISSUE}/comments?since=${ASKED_AT}&per_page=100" \
      --jq '[.[] | select(.body | startswith("[answer]"))] | last | .body // empty' 2>/dev/null || true)
    [ -n "$ANSWER" ] && break
    sleep "$POLL_SECONDS"
  done

  if [ -z "$ANSWER" ]; then
    gh issue edit "$ISSUE" --repo "$GITHUB_REPOSITORY" --remove-label "awaiting-answer" >/dev/null 2>&1 || true
    ./scripts/notify.sh "🔴 [#${ISSUE}] No answer within ${ASK_TIMEOUT_MINUTES:-240} minutes — run failed."
    exit 1
  fi

  ANSWER=$(printf '%s' "${ANSWER#\[answer\]}" | sed 's/^[[:space:]]*//')
  gh issue edit "$ISSUE" --repo "$GITHUB_REPOSITORY" --remove-label "awaiting-answer" >/dev/null 2>&1 || true
  ./scripts/notify.sh "✅ [#${ISSUE}] Got your answer, agent is continuing..."
done

echo "::error::Exceeded ${MAX_ROUNDS} question rounds on issue #${ISSUE} — aborting to avoid a runaway loop."
exit 1
