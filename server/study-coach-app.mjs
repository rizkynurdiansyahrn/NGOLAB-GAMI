import express from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import {
  MAX_FILE_BYTES,
  MAX_QUESTION_CHARACTERS,
} from "../shared/studyCoachLimits.mjs";
import { extractSourceFile } from "./source-extraction.mjs";
import { createRagStudyClient, RagServiceError } from "./rag-study-client.mjs";
import {
  validateSources,
  retrievePassages,
  validateGroundedAnswer,
} from "./study-grounding.mjs";

export function createStudyCoachApp(env = process.env) {
  const app = express();
  const rag = createRagStudyClient(env);
  app.locals.closeStudyCoach = () => rag.close();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "2mb" }));

  const upload = multer({
    storage: multer.memoryStorage(),
    defParamCharset: "utf8",
    limits: { fileSize: MAX_FILE_BYTES, files: 1, fields: 0, parts: 2 },
  });
  let activeExtractions = 0;

  const rateLimitWindows = new Map();

  function studyCoachRateLimit(req, res, next) {
    const now = Date.now();
    const clientKey = req.ip || req.socket.remoteAddress || "unknown";
    const current = rateLimitWindows.get(clientKey);

    if (!current || current.resetAt <= now) {
      rateLimitWindows.set(clientKey, { count: 1, resetAt: now + 60_000 });
    } else if (current.count >= 15) {
      res
        .status(429)
        .json({
          error:
            "Batas pertanyaan sementara tercapai. Coba lagi dalam satu menit.",
        });
      return;
    } else {
      current.count += 1;
    }

    if (rateLimitWindows.size > 500) {
      for (const [key, window] of rateLimitWindows) {
        if (window.resetAt <= now) rateLimitWindows.delete(key);
      }
    }

    next();
  }

  function asShortText(value, maxLength) {
    return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
  }

  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      studyCoachConfigured: rag.configured,
      studyCoachMode: "SOURCE_ONLY",
    });
  });

  app.post(
    "/api/study-coach/sources/file",
    studyCoachRateLimit,
    (req, res, next) => {
      upload.single("file")(req, res, async (error) => {
        if (error) return next(error);
        if (!req.file)
          return res
            .status(400)
            .json({ error: "Pilih file materi yang ingin ditambahkan." });
        if (activeExtractions >= 3)
          return res
            .status(429)
            .json({
              error: "Beberapa file sedang diproses. Coba unggah lagi sebentar.",
            });
        activeExtractions += 1;
        try {
          const source = await extractSourceFile(req.file);
          res.json({ source: { ...source, id: randomUUID(), enabled: true } });
        } catch (error) {
          if (error?.code?.startsWith("EXTRACTOR_")) {
            console.error("Study Coach file extraction failed:", {
              code: error.code,
              causeCode: error.cause?.code,
            });
          }
          res
            .status(error?.code === "EXTRACTOR_START_FAILED" ? 503 : 422)
            .json({
              error:
                error instanceof Error
                  ? error.message
                  : "File materi belum dapat dibaca.",
            });
        } finally {
          activeExtractions -= 1;
        }
      });
    },
  );

  app.post("/api/study-coach", studyCoachRateLimit, async (req, res) => {
    let sources;
    try {
      sources = validateSources(req.body?.sources);
    } catch (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    if (!rag.configured) {
      res
        .status(503)
        .json({
          error:
            "Study Coach belum dikonfigurasi. Isi RAG_API_URL dengan base URL /api/v1 dan RAG_API_KEY di file .env, lalu jalankan ulang server.",
        });
      return;
    }

    const message = asShortText(req.body?.message, MAX_QUESTION_CHARACTERS + 1);
    const taskTitle = asShortText(req.body?.taskTitle, 160);
    const requestedDuration = Number(req.body?.durationMinutes);
    const durationMinutes =
      Number.isInteger(requestedDuration) &&
      requestedDuration >= 1 &&
      requestedDuration <= 180
        ? requestedDuration
        : 25;

    if (!message) {
      res
        .status(400)
        .json({ error: "Tulis pertanyaan atau topik yang ingin dipelajari." });
      return;
    }
    if (message.length > MAX_QUESTION_CHARACTERS) {
      res
        .status(400)
        .json({
          error: `Pertanyaan maksimal ${MAX_QUESTION_CHARACTERS} karakter.`,
        });
      return;
    }

    const history = Array.isArray(req.body?.history)
      ? req.body.history.slice(-6).flatMap((item) => {
          if (!item || typeof item !== "object") return [];
          const role =
            item.role === "assistant"
              ? "assistant"
              : item.role === "user"
                ? "user"
                : null;
          const text = asShortText(item.text, 900);
          return role && text ? [{ role, text }] : [];
        })
      : [];

    const { passages, totalPassages } = retrievePassages(
      sources,
      message,
      history,
    );
    const requestController = new AbortController();
    res.on("close", () => {
      if (!res.writableEnded) requestController.abort();
    });

    try {
      const payload = await rag.answer({
        message, history, passages, taskTitle, durationMinutes,
        signal: AbortSignal.any([
          AbortSignal.timeout(270_000),
          requestController.signal,
        ]),
      });

      let grounded;
      try {
        grounded = validateGroundedAnswer(payload, passages);
      } catch (error) {
        res.status(502).json({ error: error.message });
        return;
      }

      res.json({
        ...grounded,
        coverage: { usedPassages: passages.length, totalPassages },
      });
    } catch (error) {
      if (requestController.signal.aborted) return;
      if (error instanceof RagServiceError) {
        console.error("Study Coach RAG request failed:", {
          code: error.code,
          upstreamStatus: error.upstreamStatus,
          requestId: error.requestId,
        });
        res.status(error.status).json({ error: error.message });
        return;
      }
      console.error(
        "Study Coach RAG request failed:",
        error instanceof Error ? error.name : "UnknownError",
      );

      if (error instanceof Error && (error.name === "TimeoutError" || error.cause?.name === "TimeoutError")) {
        res
          .status(504)
          .json({
            error: "Layanan AI membutuhkan waktu terlalu lama untuk menyiapkan materi atau jawaban. Coba lagi sebentar.",
          });
        return;
      }

      res
        .status(502)
        .json({
          error:
            "Study Coach gagal menghubungi server RAG. Periksa koneksi atau coba lagi sebentar.",
        });
    }
  });

  app.use((error, _req, res, next) => {
    if (res.headersSent) return next(error);
    if (error instanceof multer.MulterError) {
      res.status(error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({
        error:
          error.code === "LIMIT_FILE_SIZE"
            ? "Ukuran file maksimal 10 MB."
            : "Unggah satu file materi dalam setiap permintaan.",
      });
      return;
    }
    if (error.type === "entity.too.large") {
      res
        .status(413)
        .json({
          error: "Jumlah materi terlalu besar. Kurangi sumber yang dipilih.",
        });
      return;
    }
    if (error instanceof SyntaxError && "body" in error) {
      res
        .status(400)
        .json({
          error: "Data pertanyaan tidak valid. Muat ulang halaman dan coba lagi.",
        });
      return;
    }
    console.error(
      "Study Coach request error:",
      error instanceof Error ? error.name : "UnknownError",
    );
    res
      .status(500)
      .json({ error: "Permintaan belum dapat diproses. Silakan coba lagi." });
  });

  return app;
}
