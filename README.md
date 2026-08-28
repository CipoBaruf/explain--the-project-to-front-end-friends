# auto-flow-template

Baseline for an **automatic flow development cycle**: you request features from a
Telegram bot, a Claude Code agent develops them autonomously (asking you questions
in Telegram when needed), CI/CD deploys every change to staging, you test it from
your phone, and `/release` promotes it to production — the only thing that ever does.

This repo is a **GitHub template** — create one copy per project. All project-specific
wiring lives in GitHub secrets/variables and the `app/` directory; the flow itself
(workflows, scripts, agent contract) is identical across projects.

```
you (Telegram) ──/feature──▶ relay (your machine) ──dispatch──▶ GitHub Actions: agent
     ▲                            │ answers as issue comments        │ implements + tests + docs
     │◀── questions / notify ─────┴─────────────────────────────────┘ pushes → PR → staging branch
     │                                                                    │
     │◀── "🟡 staging deployed, test it" ◀── deploy-staging (test gate → Cloud Run staging)
     ├── /changes <feedback> ──▶ agent runs again on the same branch
     ├── /feature <next thing> ──▶ next feature branches from staging's tip (stacks); previous PR auto-closes
     └── /release ──▶ if checks pass: merges everything on staging to main, explicitly
                       triggers deploy-prod (nothing else can — no push trigger on prod)
```

Send `/feature` again before releasing and the next feature builds on top of the current
one instead of replacing it — staging keeps accumulating until you `/release`, which ships
the whole batch at once.

`/feature` and `/changes` walk through a short inline-button wizard (project → type of
change → confirm) before anything gets dispatched, catching a typo or ambiguous request
in chat instead of a wasted agent run — every step also works as plain text. See
[auto-flow-relay's README](../auto-flow-relay/README.md) for the full command reference.

## Components

| Piece | Where it runs | Cost |
| ----- | ------------- | ---- |
| Telegram relay ([auto-flow-relay](../auto-flow-relay)) | your machine (long polling) | free |
| Developer agent (Claude Code headless) | GitHub Actions | your Claude subscription |
| CI/CD (`.github/workflows/`) | GitHub Actions (public repo) | free, unlimited |
| Staging + production | Google Cloud Run free tier | free (scale-to-zero, ~2s cold start) |

## The app (`app/`)

Baseline placeholder the agent grows feature by feature: Node 24 + TypeScript + Express,
Vitest tests. Endpoints: `GET /` (dark-themed HTML landing page with a large gradient
figlet-style ASCII wordmark, an oh-my-zsh-style prompt line, and a terminal-styled chat
card replying to a message from László Bende, plus a footer with the author's GitHub
link and a link to this repo), `GET /health` (status + environment).

```bash
cd app && npm install && npm run dev     # local dev on :3000
npm run check                            # typecheck + tests (the CI gate)
```

## Guarantees baked into the flow

- **Auto-tested**: the agent must make `npm run check` pass, and CI re-runs it
  independently before any deploy. Broken code never reaches staging or prod —
  enforced twice over: the relay checks the PR is clean before merging, and a
  GitHub branch protection rule on `main` requires the `test` check regardless
  (set up automatically by `scripts/bootstrap.sh`).
- **Auto-documented**: the agent's definition of done (see [AGENTS.md](AGENTS.md))
  requires updating `README.md` and `AGENTS.md` with every behavior/convention change —
  the docs are the agent's memory between cycles. A CI check warns on PRs that
  change `app/src` without touching docs.
- **Nothing is silently lost**: features stack on staging until you `/release` (see
  above), and the agent's contract forbids removing or reverting an existing
  feature while adding a new one unless you explicitly asked for that removal.
- **Human gate**: nothing reaches production except via your explicit `/release` —
  `deploy-prod` has no automatic trigger of any kind, not even a push to `main`.
- **One cycle at a time**: agent runs and deploys are serialized via Actions concurrency groups.
- **URLs are never hand-typed**: each deploy reads its service's current `*.run.app`
  URL straight from Cloud Run and uses it directly in the Telegram notification —
  nothing to keep in sync or get stale.

## Get started

Follow [SETUP.md](SETUP.md) (~15 min per new project).
