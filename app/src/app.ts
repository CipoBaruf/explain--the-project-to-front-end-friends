import express from "express";
import { renderHomePage } from "./homePage.js";

export function createApp() {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", env: process.env.APP_ENV ?? "local" });
  });

  app.get("/", (_req, res) => {
    res.type("html").send(renderHomePage());
  });

  return app;
}
