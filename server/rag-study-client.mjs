import { createHash, randomUUID } from "node:crypto";
import { mkdir, readdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { buildRagExtractionQuery } from "./study-grounding.mjs";

export class RagServiceError extends Error {
  constructor(message, { status = 502, code, upstreamStatus, requestId } = {}) {
    super(message);
    this.name = "RagServiceError";
    Object.assign(this, { status, code, upstreamStatus, requestId });
  }
}

function apiBaseUrl(value) {
  const url = new URL(value);
  if (!['https:', 'http:'].includes(url.protocol) || url.username || url.password)
    throw new Error("Invalid RAG base URL");
  const pathname = url.pathname.replace(/\/+$/, "");
  // The service root redirects to its console. API requests belong under /api/v1.
  if (!pathname || pathname === "/ui") url.pathname = "/api/v1/";
  else if (/\/api\/v1(?:\/(query|extract|knowledge\/index))?$/.test(pathname))
    url.pathname = pathname.replace(/\/(query|extract|knowledge\/index)$/, "") + "/";
  else throw new Error("Use the RAG service origin or /api/v1 base URL");
  url.search = "";
  url.hash = "";
  return url.href;
}

function upstreamError(response, payload) {
  const code = typeof payload?.error?.code === "string" ? payload.error.code : "RAG_HTTP_ERROR";
  const requestId = response.headers.get("x-request-id");
  const detail = { code, upstreamStatus: response.status, requestId };
  if (response.status === 401)
    return new RagServiceError("Layanan AI menolak API key. Periksa konfigurasi RAG di server aplikasi.", detail);
  if (response.status === 403)
    return new RagServiceError("API key RAG memerlukan izin read dan write untuk mempelajari materi pengguna.", detail);
  if (response.status === 429)
    return new RagServiceError("Batas permintaan layanan AI tercapai. Coba lagi sebentar.", { ...detail, status: 429 });
  if (code === "LLM_FAILED")
    return new RagServiceError("Model AI di layanan RAG belum dapat menjawab. Silakan coba lagi sebentar.", detail);
  if (response.status === 404 || response.status === 405)
    return new RagServiceError("Alamat API RAG tidak sesuai. Gunakan base URL layanan dengan endpoint /api/v1.", detail);
  return new RagServiceError(`Layanan AI gagal memproses materi (HTTP ${response.status}).`, detail);
}

export function createRagStudyClient(env) {
  const key = env.RAG_API_KEY?.trim();
  const header = env.RAG_API_AUTH_HEADER?.trim() || "Authorization";
  const prefix = env.RAG_API_AUTH_PREFIX?.trim() ?? "Bearer";
  let base;
  try { if (env.RAG_API_URL?.trim()) base = apiBaseUrl(env.RAG_API_URL.trim()); } catch { /* Report setup without exposing credentials. */ }
  const configured = Boolean(base && key);
  const pending = new Map();
  // Only generated document IDs are saved, never original files, material text, or API keys.
  const namespace = createHash("sha256").update(`${base || ""}\0${key || ""}`).digest("hex");
  const journalDir = path.resolve(".study-coach-cache", namespace);
  const documentIdPattern = /^gammi-material-[0-9a-f-]{36}$/;
  let maintenanceBusy = false;
  let closed = false;

  async function request(method, endpoint, body, signal) {
    const response = await fetch(new URL(endpoint, base), {
      method,
      redirect: "error",
      headers: {
        "Content-Type": "application/json",
        [header]: prefix ? `${prefix} ${key}` : key,
        "X-Request-Id": `gammi-${randomUUID()}`,
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      signal,
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok || payload?.success === false) throw upstreamError(response, payload);
    if (payload?.success !== true || !payload.data || typeof payload.data !== "object")
      throw new RagServiceError("Respons layanan RAG tidak sesuai kontrak API.", { code: "INVALID_RAG_RESPONSE" });
    return payload.data;
  }

  const ready = configured ? (async () => {
    await mkdir(journalDir, { recursive: true });
    for (const name of await readdir(journalDir)) {
      const id = name.replace(/\.json$/, "");
      if (!name.endsWith(".json") || !documentIdPattern.test(id)) continue;
      try {
        const entry = JSON.parse(await readFile(path.join(journalDir, name), "utf8"));
        if (entry.documentId === id && Number.isFinite(entry.createdAt))
          pending.set(id, { ...entry, active: false, recovered: true });
      } catch { /* An incomplete journal is left for inspection, without logging its contents. */ }
    }
  })() : Promise.resolve();
  // Keep startup failures handled; answering still refuses to index without a cleanup journal.
  ready.catch(() => console.error("Study Coach cleanup journal could not be opened."));

  async function removeTemporaryDocument(entry) {
    if (entry.active || entry.cleaning) return;
    // Another local process might still be completing a recent request.
    if (entry.recovered && Date.now() - entry.createdAt < 5 * 60_000) return;
    entry.cleaning = true;
    try {
      let status;
      try {
        status = await request("GET", `knowledge/${entry.documentId}`, undefined, AbortSignal.timeout(15_000));
      } catch (error) {
        if (error.upstreamStatus !== 404) throw error;
        // A timed-out POST may still reach the indexing worker; retain the journal briefly.
        if (Date.now() - entry.createdAt < 5 * 60_000) return;
      }
      // Never delete while an indexing worker could recreate vectors afterward.
      if (status && !["completed", "failed", "deleted"].includes(status.status)) return;
      if (status && status.status !== "deleted")
        await request("DELETE", `knowledge/${entry.documentId}`, undefined, AbortSignal.timeout(15_000));
      await unlink(path.join(journalDir, `${entry.documentId}.json`));
      pending.delete(entry.documentId);
    } catch (error) {
      console.error("Study Coach temporary index cleanup pending:", {
        code: error.code || error.name, upstreamStatus: error.upstreamStatus,
      });
    } finally { entry.cleaning = false; }
  }

  async function maintain() {
    if (maintenanceBusy || closed || !configured) return;
    maintenanceBusy = true;
    try {
      await ready;
      for (const entry of pending.values()) {
        if (closed) break;
        await removeTemporaryDocument(entry);
      }
    } catch { /* Answer requests report journal failures separately. */ }
    finally { maintenanceBusy = false; }
  }
  const timer = configured ? setInterval(() => void maintain(), 30_000) : null;
  timer?.unref();

  async function answer({ passages, message, history, taskTitle, durationMinutes, signal }) {
    if (!configured)
      throw new RagServiceError("Study Coach belum dikonfigurasi. Isi RAG_API_URL dengan base URL /api/v1 dan RAG_API_KEY, lalu jalankan ulang server.", { status: 503, code: "RAG_NOT_CONFIGURED" });
    const query = buildRagExtractionQuery({ message, history, taskTitle, durationMinutes });
    if (query.length > 8000)
      throw new RagServiceError("Pertanyaan mengandung terlalu banyak karakter khusus. Tulis ulang dengan teks biasa.", { status: 400, code: "QUERY_TOO_LONG" });
    try { await ready; }
    catch { throw new RagServiceError("Penyimpanan sementara Study Coach belum dapat digunakan. Jalankan ulang server aplikasi.", { status: 503, code: "CLEANUP_JOURNAL_UNAVAILABLE" }); }
    const id = randomUUID();
    const knowledgeBaseId = `gammi-study-${id}`;
    const documentId = `gammi-material-${id}`;
    const entry = { documentId, createdAt: Date.now(), active: true };
    // Record cleanup before uploading, including the case where POST is accepted but its reply is lost.
    await writeFile(path.join(journalDir, `${documentId}.json`), JSON.stringify({ documentId, createdAt: entry.createdAt }), { flag: "wx", mode: 0o600 });
    pending.set(documentId, entry);
    try {
      const text = passages.map(passage =>
        `<<<PASSAGE ${passage.passageId}>>>\n${JSON.stringify({ sourceName: passage.sourceName, location: passage.location })}\n${passage.text}\n<<<END PASSAGE ${passage.passageId}>>>`
      ).join("\n\n");
      const indexed = await request("POST", "knowledge/index", {
        document_id: documentId,
        knowledge_base_id: knowledgeBaseId,
        document_name: "Materi belajar.txt",
        text,
        language: "id",
        replace: false,
        metadata: { application: "ngolab-gami", mode: "SOURCE_ONLY", transient: true },
      }, signal);
      if (indexed.document_id !== documentId)
        throw new RagServiceError("Layanan RAG mengembalikan identitas materi yang tidak sesuai.", { code: "INDEX_SCOPE_MISMATCH" });
      const indexSignal = AbortSignal.any([signal, AbortSignal.timeout(120_000)]);
      let pollInterval = 1500;
      while (true) {
        const status = await request("GET", `knowledge/${documentId}`, undefined, indexSignal);
        if (status.document_id !== documentId || status.knowledge_base_id !== knowledgeBaseId)
          throw new RagServiceError("Indeks materi tidak sesuai dengan sumber pertanyaan ini.", { code: "INDEX_SCOPE_MISMATCH" });
        if (status.status === "completed") break;
        if (["failed", "deleted"].includes(status.status))
          throw new RagServiceError("Layanan AI belum berhasil mengindeks materi. Silakan coba lagi sebentar.", { code: "INDEXING_FAILED" });
        await delay(pollInterval, undefined, { signal: indexSignal });
        pollInterval = Math.min(3000, pollInterval + 500);
      }

      const data = await request("POST", "extract", {
        query,
        knowledge_base_id: knowledgeBaseId,
        document_ids: [documentId],
        top_k: 50,
        output_schema: {
          type: "object", additionalProperties: false, required: ["items", "not_found"],
          properties: {
            not_found: { type: "boolean" },
            items: { type: "array", maxItems: 1, items: {
              type: "object", additionalProperties: false, required: ["answer", "notFound", "citations"],
              properties: {
                answer: { type: "string", maxLength: 10000 },
                notFound: { type: "boolean" },
                citations: { type: "array", maxItems: 12, items: {
                  type: "object", additionalProperties: false, required: ["passageId", "quote"],
                  properties: {
                    passageId: { type: "string", enum: passages.map(p => p.passageId) },
                    quote: { type: "string", minLength: 12, maxLength: 500 },
                  },
                } },
              },
            } },
          },
        },
      }, AbortSignal.any([signal, AbortSignal.timeout(120_000)]));
      if (typeof data.not_found !== "boolean" || !Array.isArray(data.items) || !Array.isArray(data.sources))
        throw new RagServiceError("Respons AI belum sesuai format jawaban berdasarkan materi.", { code: "INVALID_EXTRACTION_RESPONSE" });
      if (data.sources.some(source => source.document_id !== documentId))
        throw new RagServiceError("Layanan AI mengembalikan sumber di luar materi terpilih. Jawaban tidak ditampilkan.", { code: "ANSWER_SCOPE_MISMATCH" });
      if (data.not_found) return { answer: "", notFound: true, citations: [] };
      if (data.items.length !== 1 || !data.sources.length)
        throw new RagServiceError("Jawaban AI belum menyertakan rujukan materi yang lengkap.", { code: "INVALID_EXTRACTION_RESPONSE" });
      return data.items[0];
    } finally {
      entry.active = false;
      void removeTemporaryDocument(entry);
    }
  }

  return { configured, answer, close() { closed = true; if (timer) clearInterval(timer); } };
}
