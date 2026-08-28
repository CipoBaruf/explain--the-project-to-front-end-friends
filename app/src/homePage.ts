import { compileScene, createGlyphPerspectiveCamera, cubePolygons } from "glyphcss";

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

const ABOUT_TEXT =
  "auto-flow-app is the demo project for a fully automated dev loop: you ask for a " +
  "feature in chat, a coding agent writes it — code, tests, and docs — and ships it " +
  "to a staging preview for you to try. Nothing reaches production until you say go.";

// Rendered once at module load: compileScene() is a pure function of geometry + camera,
// so this ASCII cube is static HTML, no client-side JS or bundler needed to show it.
const CUBE_SCENE = {
  polygons: cubePolygons({ center: [0, 0, 0], size: 4, color: "#58d854" }),
  camera: createGlyphPerspectiveCamera({ rotX: 60, rotY: 45, zoom: 70 }),
  cols: 34,
  rows: 16,
  autoCenter: true,
} as const;

// mode: "voxel" is meant to swap the shading model from solid-mode's Lambert-ramp
// glyphs to cube-aligned face-normal glyph selection -- the blocky look that reads
// as a voxel, matching the retro 8-bit restyle (see the NES palette tokens in the
// <style> below). But glyphcss@0.1.5 (the current latest release) renders an empty
// grid in "voxel" mode for every geometry we tried (this cube, a 3x3x3 voxel
// cluster, a sphere, a plane) -- an upstream bug, not a usage error, confirmed by
// wireframe/ink/solid all rendering correctly with identical inputs. Fall back to a
// wireframe render (per user request, as the closest available blocky/pixel look)
// whenever voxel comes back blank, so the cube never silently disappears from the
// page; drop this fallback once upstream fixes voxel mode.
const voxelAttempt = compileScene({ ...CUBE_SCENE, mode: "voxel" });
const GLYPH_ART = voxelAttempt.inner.trim()
  ? voxelAttempt.html
  : compileScene({ ...CUBE_SCENE, mode: "wireframe" }).html;

function escapeHtml(value: string): string {
  return value.replace(/[&<>]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" })[char] as string);
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
    /* Full retro 8-bit / NES PPU palette (authentic hex values). Named tokens below
       map a curated subset onto the page's semantic roles for the pixel-art restyle. */
    --nes-black: #000000;
    --nes-dgray: #7c7c7c;
    --nes-gray: #bcbcbc;
    --nes-white: #fcfcfc;
    --nes-blue: #0000fc;
    --nes-dblue: #0000bc;
    --nes-indigo: #4428bc;
    --nes-purple: #940084;
    --nes-red: #f83800;
    --nes-dred: #a81000;
    --nes-amber: #fca044;
    --nes-gold: #f8b800;
    --nes-yellow: #f8d878;
    --nes-green: #00a800;
    --nes-lgreen: #58d854;
    --nes-teal: #008888;
    --nes-cyan: #00e8d8;
    --nes-skyblue: #3cbcfc;
    --nes-magenta: #f878f8;
    --nes-pink: #f85898;
    --ink: var(--nes-white);
    --muted: var(--nes-dgray);
    --bg: var(--nes-black);
    --card: #0c0c10;
    --line: rgba(124, 124, 124, 0.35);
    --accent: var(--nes-cyan);
    --accent-dim: var(--nes-teal);
    --accent-2: var(--nes-magenta);
    --ok: var(--nes-lgreen);
    --warn: var(--nes-gold);
    --err: var(--nes-red);
    --mono: "SF Mono", ui-monospace, "Cascadia Code", Menlo, Consolas, monospace;
    --sans: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 4rem 1.5rem 3rem;
    background: var(--bg);
    background-image:
      repeating-linear-gradient(
        0deg,
        rgba(255, 255, 255, 0.025) 0px,
        rgba(255, 255, 255, 0.025) 1px,
        transparent 1px,
        transparent 3px
      ),
      radial-gradient(circle at 15% 0%, rgba(0, 232, 216, 0.08), transparent 45%),
      radial-gradient(circle at 85% 100%, rgba(248, 120, 248, 0.07), transparent 45%);
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
    background: linear-gradient(
      100deg,
      var(--nes-red) 0%,
      var(--nes-gold) 20%,
      var(--nes-lgreen) 40%,
      var(--nes-cyan) 60%,
      var(--nes-skyblue) 80%,
      var(--nes-magenta) 100%
    );
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    text-shadow: 2px 2px 0 rgba(0, 0, 0, 0.85);
  }
  .banner-wrap {
    overflow-x: auto;
    margin: 0 0 1.1rem;
  }
  .divider {
    text-align: center;
    font-family: var(--mono);
    color: var(--muted);
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
    border: 2px solid var(--line);
    border-radius: 0;
    padding: 1.75rem;
    margin-bottom: 2.5rem;
    box-shadow:
      inset 2px 2px 0 rgba(255, 255, 255, 0.06),
      inset -2px -2px 0 rgba(0, 0, 0, 0.5);
  }
  section.card::before,
  section.card::after {
    content: "";
    position: absolute;
    width: 0.85rem;
    height: 0.85rem;
    border: 2px solid var(--accent);
    opacity: 0.85;
  }
  section.card::before {
    top: -2px;
    left: -2px;
    border-right: none;
    border-bottom: none;
  }
  section.card::after {
    bottom: -2px;
    right: -2px;
    border-left: none;
    border-top: none;
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
    border-radius: 0;
    background: var(--line);
  }
  .terminal-bar .dot-red { background: var(--err); }
  .terminal-bar .dot-yellow { background: var(--warn); }
  .terminal-bar .dot-green { background: var(--ok); }
  .terminal-title {
    margin-left: 0.25rem;
    font-family: var(--mono);
    font-size: 0.78rem;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--muted);
  }
  .terminal-body {
    margin: 0;
    padding: 1.25rem 1.5rem;
    font-family: var(--mono);
    font-size: 0.82rem;
    line-height: 1.6;
    color: var(--ink);
  }
  .glyph-wrap {
    text-align: center;
    margin: 0 0 1.25rem;
    overflow-x: auto;
  }
  pre.glyph-output {
    display: inline-block;
    margin: 0;
    font-family: var(--mono);
    font-size: 0.7rem;
    line-height: 1.15;
  }
  .about-text {
    margin: 0;
    color: var(--ink);
  }
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
    <p class="divider">▓▒░ ▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬▬ ░▒▓</p>
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
        <span class="terminal-title">about.md</span>
      </div>
      <div class="terminal-body">
        <div class="glyph-wrap">${GLYPH_ART}</div>
        <p class="about-text">${escapeHtml(ABOUT_TEXT)}</p>
      </div>
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
