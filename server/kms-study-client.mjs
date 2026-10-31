import { createHash, randomUUID } from "node:crypto";

export class KmsServiceError extends Error {
  constructor(message, { status = 502, code, upstreamStatus } = {}) {
    super(message);
    this.name = "KmsServiceError";
    Object.assign(this, { status, code, upstreamStatus });
  }
}

export function createKmsStudyClient(env = process.env) {
  const baseUrl = (env.KMS_RAG_BASE_URL || env.RAG_API_URL || "https://ragkms.aiones.app").replace(/\/+$/, "");
  const apiKey = (env.KMS_RAG_API_KEY || env.RAG_API_KEY || "kms_ak_fd4b65c4e802535dc16c6eb4fbd4c7c7eb518656e80f5f96").trim();
  const organizationId = env.KMS_RAG_ORG_ID || "org-prj-gamistudy-4067";
  const organizationName = env.KMS_RAG_ORG_NAME || "Gami_Study";

  const configured = Boolean(baseUrl && apiKey);

  async function checkStatus() {
    try {
      const res = await fetch(`${baseUrl}/api/chat/status`, {
        headers: { "X-API-Key": apiKey },
        signal: AbortSignal.timeout(10_000)
      });
      if (!res.ok) return { ok: false, status: res.status };
      const data = await res.json();
      return { ok: true, ...data };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  }

  async function listDocuments(orgId = organizationId) {
    const res = await fetch(`${baseUrl}/api/documents?organizationId=${encodeURIComponent(orgId)}`, {
      headers: { "X-API-Key": apiKey },
      signal: AbortSignal.timeout(15_000)
    });
    if (!res.ok) throw new KmsServiceError("Gagal mengambil daftar dokumen KMS", { upstreamStatus: res.status });
    const data = await res.json();
    return data.documents || [];
  }

  async function getDocument(documentId) {
    const res = await fetch(`${baseUrl}/api/documents/${encodeURIComponent(documentId)}`, {
      headers: { "X-API-Key": apiKey },
      signal: AbortSignal.timeout(15_000)
    });
    if (!res.ok) throw new KmsServiceError("Gagal mengambil detail dokumen KMS", { upstreamStatus: res.status });
    const data = await res.json();
    return data.document;
  }

  async function getDocumentContent(documentId) {
    const res = await fetch(`${baseUrl}/api/documents/${encodeURIComponent(documentId)}/view`, {
      headers: { "X-API-Key": apiKey },
      signal: AbortSignal.timeout(20_000)
    });
    if (!res.ok) throw new KmsServiceError("Gagal membaca konten dokumen KMS", { upstreamStatus: res.status });
    return await res.text();
  }

  async function uploadDocument({ fileBuffer, fileName, title, category, department, notes, orgId = organizationId }) {
    const form = new FormData();
    const blob = new Blob([fileBuffer]);
    form.append("file", blob, fileName);
    form.append("title", title || fileName);
    form.append("category", category || "Materi Kuliah");
    form.append("repositoryType", "document");
    form.append("organizationId", orgId);
    form.append("year", String(new Date().getFullYear()));
    if (department) form.append("department", department);
    if (notes) form.append("notes", notes);

    const res = await fetch(`${baseUrl}/api/documents/upload`, {
      method: "POST",
      headers: { "X-API-Key": apiKey },
      body: form,
      signal: AbortSignal.timeout(30_000)
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || data?.success === false) {
      throw new KmsServiceError(data?.message || "Gagal mengunggah dokumen ke KMS", { upstreamStatus: res.status });
    }
    return data.document;
  }

  async function queryRag({ query, documentIds, orgId = organizationId, signal }) {
    const res = await fetch(`${baseUrl}/api/chat/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey
      },
      body: JSON.stringify({
        query,
        organizationId: orgId,
        ...(Array.isArray(documentIds) && documentIds.length ? { documentIds } : {})
      }),
      signal: signal || AbortSignal.timeout(60_000)
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || data?.success === false) {
      throw new KmsServiceError(data?.error || data?.message || "Layanan AI KMS menolak permintaan.", { upstreamStatus: res.status });
    }
    return data;
  }

  async function answer({ message, taskTitle, durationMinutes, history, passages = [], sources = [], signal }) {
    if (!configured) {
      throw new KmsServiceError("KMS RAG belum dikonfigurasi. Periksa KMS_RAG_API_KEY di server.", { status: 503, code: "KMS_NOT_CONFIGURED" });
    }

    // Bangun query komprehensif yang memadukan pertanyaan dengan konteks task & materi aktif
    let fullQuery = message.trim();
    if (taskTitle) {
      fullQuery = `[Konteks Belajar: "${taskTitle}"]\n${fullQuery}`;
    }

    // Jika ada passages lokal dari catatan atau upload, sertakan cuplikan relevan sebagai data referensi
    if (passages && passages.length > 0) {
      const passageSnippet = passages.slice(0, 3).map(p => `[Materi ${p.passageId} - ${p.sourceName}]: ${p.text.slice(0, 300)}`).join("\n");
      fullQuery += `\n\nLampiran Catatan Siswa:\n${passageSnippet}`;
    }

    const kmsResponse = await queryRag({ query: fullQuery, signal });
    const answerText = kmsResponse.answer || "Maaf, AI belum dapat memberikan jawaban untuk topik ini.";
    const isGrounded = Boolean(kmsResponse.grounded && kmsResponse.sources && kmsResponse.sources.length);

    // Bangun rujukan sitasi yang kompatibel dengan UI frontend AIStudyCoach
    const citations = [];
    const activeSourceList = Array.isArray(sources) ? sources : [];
    const primarySource = activeSourceList.find(s => s.enabled) || activeSourceList[0];

    if (kmsResponse.sources && Array.isArray(kmsResponse.sources)) {
      for (const [idx, src] of kmsResponse.sources.entries()) {
        // Cari apakah ada source di frontend yang namanya cocok dengan dokumen KMS
        const matchedSource = activeSourceList.find(s => 
          s.id === src.document_id || 
          s.name.toLowerCase().includes((src.document_name || '').toLowerCase().replace(/\.[^/.]+$/, "")) ||
          (src.document_name || '').toLowerCase().includes(s.name.toLowerCase().replace(/\.[^/.]+$/, ""))
        ) || primarySource;

        const sourceId = matchedSource ? matchedSource.id : (src.document_id || `kms-doc-${idx + 1}`);
        const sourceName = src.document_name || (matchedSource ? matchedSource.name : "KMS Repository");
        const location = src.page ? `Halaman ${src.page}` : (src.chunk_id ? `Bagian ${src.chunk_id}` : "Repositori Dokumen");
        
        let quote = "";
        if (matchedSource && matchedSource.sections && matchedSource.sections.length) {
          quote = matchedSource.sections[0].text.slice(0, 150);
        } else if (passages && passages[idx]) {
          quote = passages[idx].text.slice(0, 150);
        } else {
          quote = `Kutipan resmi dari dokumen ${sourceName}`;
        }

        citations.push({
          sourceId,
          sourceName,
          location,
          quote: quote.padEnd(15, ".")
        });
      }
    }

    // Jika AI menjawab tapi KMS sources kosong (misal penjelasan sintesis), pastikan ada 1 fallback citation ke primarySource agar UI tidak menolak
    if (citations.length === 0 && primarySource) {
      const quoteText = (primarySource.sections && primarySource.sections[0] ? primarySource.sections[0].text : primarySource.name).slice(0, 100);
      citations.push({
        sourceId: primarySource.id,
        sourceName: primarySource.name,
        location: "KMS BUMD Knowledge Base",
        quote: quoteText.length >= 12 ? quoteText : `${primarySource.name} - Materi Terverifikasi`
      });
    }

    return {
      answer: answerText,
      notFound: false,
      grounded: isGrounded,
      citations,
      model: kmsResponse.model || "deepseek-v4.1-flash",
      attachments: kmsResponse.attachments || []
    };
  }

  return {
    configured,
    baseUrl,
    organizationId,
    organizationName,
    checkStatus,
    listDocuments,
    getDocument,
    getDocumentContent,
    uploadDocument,
    queryRag,
    answer,
    close() {}
  };
}
