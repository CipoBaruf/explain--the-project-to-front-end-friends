import { describe, expect, it } from "vitest";
import request from "supertest";
import { compileScene, createGlyphPerspectiveCamera, cubePolygons } from "glyphcss";
import { createApp } from "../src/app.js";

describe("baseline app", () => {
  it("GET /health returns ok", async () => {
    const res = await request(createApp()).get("/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET / renders the HTML landing page", async () => {
    const res = await request(createApp()).get("/");
    expect(res.status).toBe(200);
    expect(res.headers["content-type"]).toMatch(/html/);
    expect(res.text).toContain("<pre class=\"banner\">");
    expect(res.text).toContain("Ezequiel");
    expect(res.text).toContain("https://github.com/cipoBaruf");
  });

  it("GET / uses a dark color scheme without orange accents", async () => {
    const res = await request(createApp()).get("/");
    expect(res.text).toContain("color-scheme: dark");
    expect(res.text).not.toMatch(/orange|#d97757/i);
  });

  it("GET / includes a repo link", async () => {
    const res = await request(createApp()).get("/");
    expect(res.text).toContain("https://github.com/CipoBaruf/auto-flow-template/");
  });

  it("GET / renders an oh-my-zsh-style prompt line and ASCII divider", async () => {
    const res = await request(createApp()).get("/");
    expect(res.text).toContain("class=\"prompt\"");
    expect(res.text).toContain("prompt-arrow");
    expect(res.text).toContain("git:(<span class=\"prompt-branch\">main</span>)");
    expect(res.text).toContain("class=\"divider\"");
  });

  it("GET / uses a large multi-line figlet-style ASCII banner", async () => {
    const res = await request(createApp()).get("/");
    const bannerMatch = res.text.match(/<pre class="banner">([\s\S]*?)<\/pre>/);
    expect(bannerMatch).not.toBeNull();
    const bannerLines = (bannerMatch?.[1] ?? "").trim().split("\n");
    expect(bannerLines.length).toBeGreaterThanOrEqual(12);
  });

  it("GET / shows a quick summary of the project's objective instead of the old chat card", async () => {
    const res = await request(createApp()).get("/");
    expect(res.text).toContain("class=\"about-text\"");
    expect(res.text).toMatch(/feature in chat/i);
    expect(res.text).toMatch(/staging preview/i);
    expect(res.text).not.toContain("László Bende");
    expect(res.text).not.toContain("Hey guuuys");
    expect(res.text).not.toContain("How a cycle works");
    expect(res.text).not.toContain("about.json");
  });

  it("GET / renders a static glyphcss ASCII graphic (no client-side JS needed)", async () => {
    const res = await request(createApp()).get("/");
    expect(res.text).toContain("class=\"glyph-output\"");
    expect(res.text).toMatch(/<span style="color:#[0-9a-f]{6}">/i);
  });

  it("GET / uses a full retro 8-bit / NES color palette", async () => {
    const res = await request(createApp()).get("/");
    expect(res.text).toMatch(/#f83800/i); // NES red
    expect(res.text).toMatch(/#00e8d8/i); // NES cyan
    expect(res.text).toMatch(/#f878f8/i); // NES magenta
    expect(res.text).toMatch(/#58d854/i); // NES light green
    // Retired from the earlier violet/teal terminal theme.
    expect(res.text).not.toContain("#8b7cf6");
    expect(res.text).not.toContain("#52d8c4");
  });

  it("GET / falls back to a wireframe cube, since glyphcss's voxel mode currently renders empty for this geometry", async () => {
    // Pins the upstream glyphcss@0.1.5 bug the app works around: "voxel" mode renders
    // an empty grid for this cube. If a glyphcss upgrade fixes this, this assertion
    // will fail loudly as a signal to drop the fallback in src/homePage.ts.
    const cubeScene = {
      polygons: cubePolygons({ center: [0, 0, 0] as const, size: 4, color: "#58d854" }),
      camera: createGlyphPerspectiveCamera({ rotX: 60, rotY: 45, zoom: 70 }),
      cols: 34,
      rows: 16,
      autoCenter: true,
    };
    const voxelAttempt = compileScene({ ...cubeScene, mode: "voxel" as const });
    expect(voxelAttempt.inner.trim()).toBe("");

    // Despite that, the served page must still show the wireframe fallback render
    // (user's chosen stand-in for the still-broken voxel mode), not a blank cube.
    // Wireframe glyph selection isn't deterministic across compileScene() calls with
    // identical input (confirmed empirically), so this checks for wireframe's
    // rule-glyph character set rather than an exact string match -- that set is
    // disjoint from solid mode's density-ramp characters (e.g. "@", "%").
    const res = await request(createApp()).get("/");
    const glyphMatch = res.text.match(/<pre class="glyph-output">([\s\S]*?)<\/pre>/);
    expect(glyphMatch).not.toBeNull();
    expect(glyphMatch?.[1]).toMatch(/[◈◊╬⊥∵┼⬢⬡⊗⊛⊕▲▽╳╋▼△◇◆∴⊚⊙]/);
  });
});
