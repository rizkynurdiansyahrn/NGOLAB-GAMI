import "dotenv/config";
import express from "express";
import { existsSync } from "node:fs";
import path from "node:path";
import { createStudyCoachApp } from "./study-coach-app.mjs";

const app = createStudyCoachApp();
const port = Number(process.env.PORT || 3001);
const apiTarget = (process.env.VITE_API_BASE_URL || "http://localhost:3000").replace(/\/+$/, "");

async function proxyToBackend(req, res, targetPath) {
  try {
    const url = `${apiTarget}${targetPath}`;
    const headers = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (!value || ["host", "connection", "origin", "content-length"].includes(key.toLowerCase())) continue;
      headers[key] = Array.isArray(value) ? value.join(", ") : value;
    }
    const hasBody = !["GET", "HEAD"].includes(req.method);
    let bodyBuffer;
    if (hasBody) {
      if (req.body && typeof req.body === "object" && Object.keys(req.body).length > 0) {
        bodyBuffer = Buffer.from(JSON.stringify(req.body));
        headers["content-type"] = "application/json";
      } else {
        const chunks = [];
        for await (const chunk of req) chunks.push(Buffer.from(chunk));
        if (chunks.length > 0) bodyBuffer = Buffer.concat(chunks);
      }
    }
    const upstream = await fetch(url, {
      method: req.method,
      headers,
      body: bodyBuffer,
    });
    res.status(upstream.status);
    const contentType = upstream.headers.get("content-type");
    if (contentType) res.setHeader("content-type", contentType);
    const arrayBuffer = await upstream.arrayBuffer();
    res.send(Buffer.from(arrayBuffer));
  } catch (err) {
    res.status(502).json({ ok: false, message: "Gagal meneruskan request ke backend_ngolab", error: err?.message });
  }
}

app.use("/membership-api", (req, res) => {
  return proxyToBackend(req, res, req.url || "/");
});

app.use("/uploads", (req, res) => {
  return proxyToBackend(req, res, `/uploads${req.url || ""}`);
});

const distPath = path.resolve(process.cwd(), "dist");
if (existsSync(path.join(distPath, "index.html"))) {
  app.use(express.static(distPath));
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/") || req.path.startsWith("/membership-api/") || req.path.startsWith("/uploads/")) {
      return next();
    }
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
