# AGENTS.md — contract for the developer agent

You are the developer agent in an autonomous flow: the user requests features via
Telegram, you implement them here, CI deploys to staging, the user tests and either
requests changes or releases to production. A fresh agent session runs each cycle —
**this file and README.md are your only memory between cycles. Keep them true.**

<!-- ===================== GENERIC FLOW (shared across projects) ===================== -->
<!-- Improvements to this section belong in the baseline template repo too.          -->

## How a cycle works

1. You receive a request (new feature, or change feedback after staging review) with a tracking issue number.
2. You implement it in `app/` on the current branch. **Never run git commands** — the workflow commits, pushes, opens the PR, and updates `staging` for you.
   A new feature's branch starts from the current tip of `staging`, not `main` — staging
   accumulates every feature requested since the last `/release`, so your changes build on
   top of whatever is already there (already-superseded PRs are closed automatically).
3. CI independently re-runs the checks; if green it deploys staging and notifies the user on Telegram.
4. The user replies `/changes <feedback>` (you run again with feedback, same branch) or `/release`
   (ships everything currently accumulated on staging to production in one batch).

## Preserve what's already there

Your starting branch already contains every feature accumulated on staging so far —
that's the whole point of stacking. **Do not remove, simplify, or revert any existing
feature, route, or content while implementing the new one**, even if it would make
your change easier or cleaner. Only remove or change something the user already
built if their current request explicitly asks you to (e.g. "remove the X endpoint",
"replace the old banner with..."). If the new request seems to conflict with existing
behavior and it's not clear whether that's intentional, ask — don't silently drop it.

## Asking the user

When the request is ambiguous or a decision is genuinely the user's to make, ask via:

```bash
./scripts/ask-user.sh <issue-number> "your question"
```

**Run this as a normal, blocking foreground command — never in the background.**
This is a single-shot headless session (`claude -p` in a GitHub Actions step): once
you stop and return, the whole process exits immediately, killing any backgrounded
child process with it. There is no later turn for a background-task notification to
wake you into — unlike an interactive session, backgrounding this command silently
abandons the question and the run produces no changes. Call it directly and wait for
it to return the answer before doing anything else.

It blocks until the user answers on Telegram and prints the answer to stdout.
Ask few, batched, concrete questions. Prefer sensible defaults over asking; never
guess on scope ("should this endpoint be public?") — ask.

If the answer is naturally a small closed set (a handful of named choices, or
yes/no), end the question with `[options: A | B | C]` — the user gets tappable
buttons instead of having to type an exact match, e.g.:
`./scripts/ask-user.sh 42 "Which theme should the homepage use? [options: Light | Dark | Follow system]"`.
Leave the hint off for anything genuinely open-ended (a name, a description, free-form
text) — those still work as plain text replies exactly as before.

## Definition of done (all required before you finish)

- [ ] Feature implemented in `app/src/`.
- [ ] Tests added/updated in `app/test/` covering the new behavior.
- [ ] `npm run check` passes inside `app/` (typecheck + full test suite). Iterate until green.
- [ ] Any package actually needed to **run** the app (imported/required by code that
      executes at startup or in a request handler — not just used in tests or the
      typecheck step) is in `dependencies`, never `devDependencies`. Production deploys
      install with dev dependencies omitted; a runtime package misplaced in
      `devDependencies` won't fail any local check but will make the container fail to
      start in production with no obvious error (this happened for real with `tsx`,
      the app's own entrypoint runner — caught it the hard way via Cloud Run logs).
- [ ] **Docs updated in the same change:**
      `README.md` — if user-facing behavior, endpoints, config, or setup changed.
      `AGENTS.md` (project-specific section below) — if structure, conventions, or
      anything the next agent session needs to know changed.
      If genuinely nothing changed for docs, state why in your summary.

## Boundaries

- Only modify `app/`, `README.md`, and the project-specific section of `AGENTS.md`.
- Never touch `.github/workflows/`, `scripts/`, or secrets unless the request explicitly asks for it.
- Never commit credentials or personal data; this is a public repository.

<!-- ===================== PROJECT-SPECIFIC (owned by this project) ================== -->

## Project: auto-flow-app (baseline placeholder)

- Stack: Node 24, TypeScript (strict, ESM), Express 4, Vitest + Supertest.
- Layout: `app/src/app.ts` builds the Express app (keep it export-only for testability);
  `app/src/homePage.ts` renders the `GET /` landing page HTML (self-contained, inline
  `<style>`); `app/src/index.ts` is the entrypoint; tests in `app/test/`.
- Conventions: small routers per domain as the app grows; `/health` stays JSON and
  must always exist (useful for manual checks; Cloud Run's own startup probe is a
  plain TCP check on the port, not this route); `/` is the one HTML page — keep its styling
  self-contained in `homePage.ts` rather than pulling in a templating engine or
  static assets pipeline.
- Current state: `GET /` renders an HTML landing page with a large multi-line figlet-style
  ASCII wordmark spelling "AUTO" / "FLOW" (block-letter art in a `<pre class="banner">`,
  gradient-colored via CSS `background-clip: text`), a decorative ASCII divider, an
  oh-my-zsh-style prompt line (`➜ auto-flow-app git:(main) ✗`), and a single terminal-styled
  card (HUD corner accents, fake terminal title bar) rendering a `CHAT` log from
  `homePage.ts` — László Bende's message ("Hey guuuys" / "How your days going?") answered
  with a reply that Ezequiel is working on this project (`.chat-laszlo` / `.chat-me`
  classes color the two speakers). No more steps list, tagline, or "about.json" project-info
  block — those were removed per issue #17 ("remove all the texts ... add a text to answer
  this [message]"), the banner/divider/prompt were kept as page chrome, not prose. Footer
  still credits Ezequiel with a link to `https://github.com/cipoBaruf` plus a link to this
  repo, `https://github.com/CipoBaruf/auto-flow-template/`; `GET /health` returns JSON
  status + environment. No database.
- Styling: dark, clean theme (near-black background, violet `--accent` + teal
  `--accent-2`, no orange) in the spirit of render.com/oh-my-zsh terminal splash
  screens — big gradient ASCII wordmarks, terminal/HUD framing, monospace accents —
  keep it that way for any future `/` changes. The banner text is built letter-by-letter
  from fixed-width ASCII-art glyphs; verify line lengths stay aligned if you change it.
