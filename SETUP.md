# SETUP — new project from this template (~15 min)

Everything here is free tier except your existing Claude subscription. Google Cloud
Run's free tier requires a card on file (you won't be charged within the free tier
limits) — everything else needs no card.

## 1. Create the repo

- GitHub → "Use this template" → new **public** repo (public = unlimited free Actions minutes;
  agent runs idle while waiting for your Telegram answers, so minutes matter).
- Clone it locally.

## 2. Telegram bot (once per account, reusable across projects)

- Talk to [@BotFather](https://t.me/BotFather) → `/newbot` → save the **bot token**.
- Get your **chat id**: message [@userinfobot](https://t.me/userinfobot), or start the relay and send `/start`.
- One bot serves all your auto-flow projects (the relay routes by project).

## 3. Google Cloud Run

- Create or select a GCP project. Enable the **Cloud Run API** and **Cloud Build API**
  (Console → APIs & Services → Enable APIs, or `gcloud services enable run.googleapis.com
  cloudbuild.googleapis.com`).
- Create a service account (e.g. `auto-flow-deployer`) with these five roles — all are
  needed for `gcloud run deploy --source` (it builds via Cloud Build and pushes to
  Artifact Registry under the hood, not just Cloud Run itself):
  - **Cloud Run Admin**
  - **Service Account User**
  - **Artifact Registry Administrator**
  - **Cloud Build Editor**
  - **Storage Admin**

  Then generate a JSON key for it (Console → IAM → Service Accounts → your account →
  Keys → Add key → JSON). Save the file locally — `bootstrap.sh` reads its path in
  step 5. Note: IAM role changes can take a couple of minutes to propagate — if a
  deploy fails with a permission error right after granting a role, wait a bit and
  retry before assuming the role is missing.
- Note your **project ID** and a **region** (e.g. `us-central1`).

Nothing else to click together — the two Cloud Run services (`auto-flow-staging`,
`auto-flow-prod`) are created automatically the first time CI deploys, and each
deploy prints its own current `*.run.app` URL (no URL to copy-paste or keep in sync).

Free-tier note: true scale-to-zero, ~2s cold start on the first request after idle
(much faster than a typical PaaS free tier's 30–60s).

## 4. Tokens

- `claude setup-token` on your machine → **Claude Code OAuth token** (subscription-billed).
- GitHub → Settings → **Developer settings → Personal access tokens → Tokens (classic)**
  → Generate new token → check only the **`repo`** scope → Generate. This is what lets
  the agent's pushes/PRs trigger workflows (the default GITHUB_TOKEN can't).

  *Tighter scoping:* a fine-grained token limited to just this repo (Contents/Issues/
  Pull requests/Actions Read & write, Metadata Read-only) is the better fit given the
  agent runs with `--dangerously-skip-permissions` — but GitHub's fine-grained
  permission UI has been unreliable in practice (permission edits not taking effect
  even after saving). If you hit repeated 403s on writes after setting one up, fall
  back to the classic token above rather than debugging it further.

## 5. Wire it up

```bash
./scripts/bootstrap.sh   # sets secrets/variables, creates the staging branch, protects main
                          # (requires the test check before any merge), sends a test message
```

## 6. Register in the relay

In your `auto-flow-relay` checkout, add the project to `config.json` and start it:

```json
{ "name": "myproject", "repo": "you/myproject", "chatId": "123456789" }
```

```bash
npm start   # long polling — no public URL needed; runs on your machine
```

## 7. First cycle

Send the bot: `/feature myproject add an endpoint that returns the server time`
— then answer its questions, test the staging URL when notified, and reply
`/changes <feedback>` or `/release`. You can send another `/feature` before
releasing too — it builds on top of the current one on staging instead of
replacing it (see the flow diagram in the main [README](README.md)).
