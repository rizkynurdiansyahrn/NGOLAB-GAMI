import "dotenv/config";
import express from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { createStudyCoachApp } from "./study-coach-app.mjs";

const app = createStudyCoachApp();
const port = Number(process.env.PORT || 3001);

const distPath = path.resolve(process.cwd(), "dist");
if (existsSync(path.join(distPath, "index.html"))) {
  app.use(express.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) return next();
    res.sendFile(path.join(distPath, "index.html"));
  });
}

app.listen(port, "0.0.0.0", () => {
  console.log(`Ngolab Gami API listening on http://localhost:${port}`);
  if (!process.env.RAG_API_URL?.trim() || !process.env.RAG_API_KEY?.trim())
    console.warn(
      "RAG_API_URL or RAG_API_KEY is not set. AI Study Coach requests will return a setup message.",
    );
});
