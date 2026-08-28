import { describe, expect, it } from "vitest";
import request from "supertest";
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

  it("GET / replies to László Bende's message instead of the old promo copy", async () => {
    const res = await request(createApp()).get("/");
    expect(res.text).toContain("László Bende");
    expect(res.text).toContain("Hey guuuys");
    expect(res.text).toContain("How your days going?");
    expect(res.text).toMatch(/working on this project/i);
    expect(res.text).not.toContain("How a cycle works");
    expect(res.text).not.toContain("about.json");
  });
});
