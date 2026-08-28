const BANNER = String.raw`
 █████╗ ██╗   ██╗████████╗ ██████╗
██╔══██╗██║   ██║╚══██╔══╝██╔═══██╗
███████║██║   ██║   ██║   ██║   ██║
██╔══██║██║   ██║   ██║   ██║   ██║
██║  ██║╚██████╔╝   ██║   ╚██████╔╝
╚═╝  ╚═╝ ╚═════╝    ╚═╝    ╚═════╝

███████╗██╗      ██████╗ ██╗    ██╗
██╔════╝██║     ██╔═══██╗██║    ██║
█████╗  ██║     ██║   ██║██║ █╗ ██║
██╔══╝  ██║     ██║   ██║██║███╗██║
██║     ███████╗╚██████╔╝╚███╔███╔╝
╚═╝     ╚══════╝ ╚═════╝  ╚══╝╚══╝
`.trim();

const REPO_URL = "https://github.com/CipoBaruf/auto-flow-template/";

const CHAT = [
  { from: "laszlo", name: "László Bende", lines: ["Hey guuuys", "How your days going?"] },
  { from: "me", name: "Ezequiel", lines: ["Hey! All good here — I'm working on this project."] },
] as const;

function escapeHtml(value: string): string {
  return value.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char] as string);
}

function renderChatLog(): string {
  return CHAT.map(({ from, name, lines }) => {
    const body = lines.map((line) => escapeHtml(line)).join("\n  ");
    return `<span class="chat-name chat-${from}">${escapeHtml(name)}:</span>\n  ${body}`;
  }).join("\n\n");
}

export function renderHomePage(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Auto Flow App Creator</title>
<style>
  :root {
    color-scheme: dark;
    --ink: #e4e7ec;
    --muted: #8a93a3;
    --bg: #0a0d12;
    --card: #10141b;
    --line: #232833;
    --accent: #8b7cf6;
    --accent-dim: #6e5fd1;
    --accent-2: #52d8c4;
    --ok: #63c374;
    --warn: #f4c05d;
    --err: #f16565;
    --mono: "SF Mono", ui-monospace, "Cascadia Code", Menlo, Consolas, monospace;
    --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 4rem 1.5rem 3rem;
    background: var(--bg);
    background-image:
      radial-gradient(circle at 15% 0%, rgba(139, 124, 246, 0.08), transparent 45%),
      radial-gradient(circle at 85% 100%, rgba(82, 216, 196, 0.06), transparent 45%);
    color: var(--ink);
    font-family: var(--sans);
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  main {
    width: 100%;
    max-width: 640px;
  }
  pre.banner {
    font-family: var(--mono);
    font-size: 0.68rem;
    line-height: 1.25;
    font-weight: 700;
    margin: 0 auto;
    padding: 0;
    text-align: center;
    white-space: pre;
    display: inline-block;
    width: 100%;
    background: linear-gradient(135deg, var(--accent) 0%, var(--accent-2) 100%);
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    filter: drop-shadow(0 0 14px rgba(139, 124, 246, 0.35));
  }
  .banner-wrap {
    overflow-x: auto;
    margin: 0 0 1.1rem;
  }
  .divider {
    text-align: center;
    font-family: var(--mono);
    color: var(--line);
    letter-spacing: 0.3em;
    font-size: 0.7rem;
    margin: 0 0 1.6rem;
  }
  .prompt {
    text-align: center;
    font-family: var(--mono);
    font-size: 0.85rem;
    margin: 0 0 2.5rem;
  }
  .prompt-arrow { color: var(--ok); font-weight: 700; }
  .prompt-dir { color: var(--accent-2); }
  .prompt-git { color: var(--muted); }
  .prompt-branch { color: var(--accent); }
  .prompt-dirty { color: var(--err); }
  section.card {
    position: relative;
    background: var(--card);
    border: 1px solid var(--line);
    border-radius: 10px;
    padding: 1.75rem;
    margin-bottom: 2.5rem;
  }
  section.card::before,
  section.card::after {
    content: "";
    position: absolute;
    width: 0.85rem;
    height: 0.85rem;
    border: 1px solid var(--accent-dim);
    opacity: 0.6;
  }
  section.card::before {
    top: -1px;
    left: -1px;
    border-right: none;
    border-bottom: none;
    border-top-left-radius: 4px;
  }
  section.card::after {
    bottom: -1px;
    right: -1px;
    border-left: none;
    border-top: none;
    border-bottom-right-radius: 4px;
  }
  section.terminal {
    padding: 0;
    overflow: hidden;
  }
  .terminal-bar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.7rem 1rem;
    border-bottom: 1px solid var(--line);
    background: rgba(255, 255, 255, 0.02);
  }
  .terminal-bar .dot {
    width: 0.6rem;
    height: 0.6rem;
    border-radius: 50%;
    background: var(--line);
  }
  .terminal-bar .dot-red { background: var(--err); }
  .terminal-bar .dot-yellow { background: var(--warn); }
  .terminal-bar .dot-green { background: var(--ok); }
  .terminal-title {
    margin-left: 0.25rem;
    font-family: var(--mono);
    font-size: 0.78rem;
    color: var(--muted);
  }
  pre.terminal-body {
    margin: 0;
    padding: 1.25rem 1.5rem;
    font-family: var(--mono);
    font-size: 0.82rem;
    line-height: 1.6;
    color: var(--ink);
    overflow-x: auto;
  }
  .chat-name {
    font-weight: 700;
  }
  .chat-laszlo { color: var(--accent-2); }
  .chat-me { color: var(--accent); }
  footer {
    text-align: center;
    font-size: 0.85rem;
    color: var(--muted);
    font-family: var(--mono);
  }
  footer .rule {
    color: var(--line);
    letter-spacing: 0.4em;
    margin: 0 0 1rem;
    font-size: 0.7rem;
  }
  footer a {
    color: var(--accent);
    text-decoration: none;
    font-family: var(--mono);
  }
  footer a:hover { text-decoration: underline; color: var(--accent-dim); }
  footer .repo-link {
    display: block;
    margin-top: 0.4rem;
    font-size: 0.8rem;
  }
</style>
</head>
<body>
  <main>
    <div class="banner-wrap"><pre class="banner">${BANNER}</pre></div>
    <p class="divider">◆ ─────────────────────────────── ◆</p>
    <p class="prompt">
      <span class="prompt-arrow">&#10148;</span>
      <span class="prompt-dir">auto-flow-app</span>
      <span class="prompt-git">git:(<span class="prompt-branch">main</span>)</span>
      <span class="prompt-dirty">&#10007;</span>
    </p>
    <section class="card terminal">
      <div class="terminal-bar">
        <span class="dot dot-red"></span>
        <span class="dot dot-yellow"></span>
        <span class="dot dot-green"></span>
        <span class="terminal-title">chat</span>
      </div>
      <pre class="terminal-body">${renderChatLog()}</pre>
    </section>
    <footer>
      <p class="rule">· · · · · · · · · · · · · · · · · · ·</p>
      Built by Ezequiel &middot; <a href="https://github.com/cipoBaruf">github.com/cipoBaruf</a>
      <a class="repo-link" href="${REPO_URL}">${REPO_URL}</a>
    </footer>
  </main>
</body>
</html>
`;
}
