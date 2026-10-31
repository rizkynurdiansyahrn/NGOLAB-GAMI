import express from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";
import {
  MAX_FILE_BYTES,
  MAX_QUESTION_CHARACTERS,
} from "../shared/studyCoachLimits.mjs";
import { extractSourceFile } from "./source-extraction.mjs";
import { createRagStudyClient, RagServiceError } from "./rag-study-client.mjs";
import { createKmsStudyClient, KmsServiceError } from "./kms-study-client.mjs";
import {
  validateSources,
  retrievePassages,
  validateGroundedAnswer,
} from "./study-grounding.mjs";

export function createStudyCoachApp(env = process.env) {
  const app = express();
  const rag = createRagStudyClient(env);
  const kms = createKmsStudyClient(env);
  app.locals.closeStudyCoach = () => {
    rag.close();
    kms.close();
  };

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
    } else if (current.count >= 30) {
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

  // Health check endpoint dengan rincian KMS BUMD Multi-Tenant RAG
  app.get("/api/health", (_req, res) => {
    res.json({
      ok: true,
      studyCoachConfigured: true,
      studyCoachMode: kms.configured
        ? "KMS_RAG_ONLINE"
        : rag.configured
          ? "RAG_ONLINE"
          : "LOCAL_GROUNDING",
      kmsProvider: "KMS BUMD Multi-Tenant RAG",
      organization: kms.organizationName,
      organizationId: kms.organizationId,
      timestamp: new Date().toISOString(),
    });
  });

  // Cek Status Layanan AI RAG KMS
  app.get("/api/study-coach/kms/status", async (_req, res) => {
    try {
      const status = await kms.checkStatus();
      res.json({
        success: true,
        configured: kms.configured,
        organizationId: kms.organizationId,
        organizationName: kms.organizationName,
        baseUrl: kms.baseUrl,
        ...status,
      });
    } catch (err) {
      res.status(502).json({
        success: false,
        error: err.message,
      });
    }
  });

  // Ambil daftar dokumen di repositori KMS project Gami_Study
  app.get("/api/study-coach/kms/documents", async (req, res) => {
    try {
      const orgId = req.query.organizationId || kms.organizationId;
      const documents = await kms.listDocuments(orgId);
      res.json({
        success: true,
        organizationId: orgId,
        organizationName: kms.organizationName,
        documents,
      });
    } catch (err) {
      res.status(502).json({
        success: false,
        error: err.message,
      });
    }
  });

  // Ambil isi dokumen dari KMS Repositori untuk dimuat langsung sebagai materi aktif
  app.get("/api/study-coach/kms/documents/:id/content", async (req, res) => {
    try {
      const doc = await kms.getDocument(req.params.id);
      const text = await kms.getDocumentContent(req.params.id);
      res.json({
        success: true,
        document: doc,
        content: text,
      });
    } catch (err) {
      res.status(502).json({
        success: false,
        error: err.message,
      });
    }
  });

  // Unggah file materi lokal + Otomatis Terindeks ke KMS BUMD RAG & Edge CDN
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

          // Asinkron: Unggah dan indeks berkas ke KMS BUMD Multi-Tenant RAG
          if (kms.configured) {
            kms
              .uploadDocument({
                fileBuffer: req.file.buffer,
                fileName: req.file.originalname,
                title: req.file.originalname.replace(/\.[^/.]+$/, ""),
                category: "Materi Kuliah",
                department: "Gami Study",
                notes: `Diunggah via Gami-Study (${new Date().toLocaleDateString("id-ID")})`,
              })
              .then((doc) => {
                console.log(`[KMS] Dokumen "${doc.title}" berhasil diindeks ke KMS RAG (${doc.id})`);
              })
              .catch((err) => {
                console.warn("[KMS Upload Notice]", err.message);
              });
          }

          res.json({
            source: {
              ...source,
              id: randomUUID(),
              enabled: true,
              kmsUploaded: kms.configured,
            },
          });
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

  // Tanya Jawab Cerdas Berbasis Dokumen RAG KMS
  app.post("/api/study-coach", studyCoachRateLimit, async (req, res) => {
    let sources;
    try {
      sources = validateSources(req.body?.sources);
    } catch (error) {
      res.status(400).json({ error: error.message });
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

    // 1. Prioritas Utama: Menggunakan KMS BUMD Multi-Tenant RAG AI
    if (kms.configured) {
      try {
        const payload = await kms.answer({
          message,
          taskTitle,
          durationMinutes,
          history,
          passages,
          sources,
          signal: AbortSignal.any([
            AbortSignal.timeout(60_000),
            requestController.signal,
          ]),
        });

        res.json({
          ...payload,
          coverage: { usedPassages: passages.length, totalPassages },
        });
        return;
      } catch (err) {
        console.warn("KMS RAG query failed or timed out, falling back to local/legacy grounding:", err.message);
      }
    }

    // 2. Fallback: Local Grounding BM25 (Jaminan Selalu Bisa Menjawab secara Offline)
    if (passages.length > 0) {
      const excerpt = passages
        .slice(0, 3)
        .map((p, i) => `[Kutipan ${i + 1}] "${p.text}"`)
        .join("\n\n");
      const answer = `Berdasarkan materi belajar yang kamu lampirkan untuk topik "${taskTitle || "Tugas"}":\n\n${excerpt}\n\n💡 Kamu dapat menanyakan rincian lebih lanjut dari bagian materi di atas.`;
      const citations = passages.slice(0, 3).map((p) => ({
        sourceId: p.sourceId,
        sourceName: p.sourceName,
        location: p.location,
        quote: p.text.slice(0, 80),
      }));
      res.json({
        answer,
        citations,
        notFound: false,
        coverage: { usedPassages: Math.min(passages.length, 3), totalPassages },
        model: "local-bm25-grounding",
      });
      return;
    }

    res.json({
      answer: `Belum menemukan kutipan yang relevan dengan pertanyaan "${message}" di materi yang kamu pilih. Coba tambahkan catatan atau unggah file materi terkait di panel samping.`,
      citations: [],
      notFound: true,
      coverage: { usedPassages: 0, totalPassages },
      model: "local-bm25-grounding",
    });
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
