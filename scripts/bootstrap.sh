#!/usr/bin/env bash
# One-time wiring for a new project created from this template.
# Run from the repo root after `gh repo create` (or "Use this template" on GitHub).
#
# Prerequisites: gh CLI authenticated (`gh auth login`), and the values below at hand.
set -euo pipefail

echo "== auto-flow bootstrap =="
echo "This sets the GitHub secrets/variables the workflows need."
echo

read -rp "Telegram bot token (from @BotFather): " TELEGRAM_BOT_TOKEN
read -rp "Your Telegram chat id (send /start to the bot, relay prints it; or use @userinfobot): " TELEGRAM_CHAT_ID
read -rp "Claude Code OAuth token (run: claude setup-token): " CLAUDE_CODE_OAUTH_TOKEN
read -rp "GitHub classic PAT with 'repo' scope (see SETUP.md for a tighter-scoped alternative): " GH_PAT
read -rp "Path to your GCP service account JSON key file (see SETUP.md step 3): " GCP_SA_KEY_PATH
read -rp "GCP project ID: " GCP_PROJECT_ID
read -rp "GCP region (e.g. us-central1): " GCP_REGION

gh secret set TELEGRAM_BOT_TOKEN --body "$TELEGRAM_BOT_TOKEN"
gh secret set TELEGRAM_CHAT_ID --body "$TELEGRAM_CHAT_ID"
gh secret set CLAUDE_CODE_OAUTH_TOKEN --body "$CLAUDE_CODE_OAUTH_TOKEN"
gh secret set GH_PAT --body "$GH_PAT"
gh secret set GCP_SA_KEY < "$GCP_SA_KEY_PATH"
gh variable set GCP_PROJECT_ID --body "$GCP_PROJECT_ID"
gh variable set GCP_REGION --body "$GCP_REGION"

echo
echo "Creating the staging branch (tracks whatever feature is under review)..."
git push origin HEAD:staging 2>/dev/null || echo "  (staging already exists or push it manually)"

echo
echo "Protecting main: requiring the 'test' check to pass before any merge..."
echo "(authoritative gate — even if /release's own pre-check has a bug, GitHub itself refuses the merge)"
gh api -X PUT "repos/$(gh repo view --json nameWithOwner --jq .nameWithOwner)/branches/main/protection" --input - <<'EOF' >/dev/null
{
  "required_status_checks": { "strict": false, "contexts": ["test"] },
  "enforce_admins": false,
  "required_pull_request_reviews": null,
  "restrictions": null
}
EOF

echo
echo "Verifying: sending a test Telegram message..."
TELEGRAM_BOT_TOKEN="$TELEGRAM_BOT_TOKEN" TELEGRAM_CHAT_ID="$TELEGRAM_CHAT_ID" \
  ./scripts/notify.sh "✅ auto-flow bootstrap complete for $(gh repo view --json nameWithOwner --jq .nameWithOwner)"

echo
echo "Done. Next: add this repo to the relay's config.json and start the relay."
echo "The two Cloud Run services (auto-flow-staging, auto-flow-prod) are created"
echo "automatically on first deploy — nothing to click together by hand."
