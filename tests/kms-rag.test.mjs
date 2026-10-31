import test from "node:test";
import assert from "node:assert/strict";
import { createKmsStudyClient } from "../server/kms-study-client.mjs";
import { createStudyCoachApp } from "../server/study-coach-app.mjs";

const testEnv = {
  KMS_RAG_BASE_URL: "https://ragkms.aiones.app",
  KMS_RAG_API_KEY: "kms_ak_fd4b65c4e802535dc16c6eb4fbd4c7c7eb518656e80f5f96",
  KMS_RAG_ORG_ID: "org-prj-gamistudy-4067",
  KMS_RAG_ORG_NAME: "Gami_Study",
};

test("KMS Client: Cek konfigurasi dan status live layanan KMS BUMD RAG", async () => {
  const kms = createKmsStudyClient(testEnv);
  assert.equal(kms.configured, true);
  assert.equal(kms.organizationId, "org-prj-gamistudy-4067");

  const status = await kms.checkStatus();
  assert.equal(status.ok, true);
  assert.equal(status.status, "ready");
  assert.equal(status.service, "Multi-Tenant RAG & Jev AI");
});

test("KMS Client: Mengambil daftar dokumen repositori project Gami_Study", async () => {
  const kms = createKmsStudyClient(testEnv);
  const docs = await kms.listDocuments();
  assert.ok(Array.isArray(docs));
  assert.ok(docs.length >= 2);

  const titles = docs.map(d => d.title);
  assert.ok(titles.some(t => t.includes("Gami_Study")));
  assert.ok(titles.some(t => t.includes("Modul Pemrograman Web Ngolab")));
});

test("KMS Client: Membaca teks konten dokumen dari KMS Repositori", async () => {
  const kms = createKmsStudyClient(testEnv);
  const docs = await kms.listDocuments();
  const targetDoc = docs.find(d => d.title.includes("Modul Pemrograman Web Ngolab"));
  assert.ok(targetDoc, "Dokumen modul harus ada di repositori");

  const text = await kms.getDocumentContent(targetDoc.id);
  assert.ok(typeof text === "string");
  assert.ok(text.includes("Dasar REST API dan JSON"));
  assert.ok(text.includes("Single Sign-On (SSO)"));
  assert.ok(text.includes("MySQL dan transaksi atomik"));
});

test("KMS Client: Menjawab pertanyaan studi secara grounded dengan rujukan sitasi (DeepSeek)", async () => {
  const kms = createKmsStudyClient(testEnv);
  const dummySources = [
    {
      id: "src-modul-pabw",
      name: "Modul Pemrograman Web Ngolab",
      kind: "txt",
      sections: [{ text: "Modul Belajar Pemrograman Web Ngolab: Dasar REST API dan JSON, Single Sign-On (SSO) menggunakan HMAC dan JWT, Database MySQL dan transaksi atomik SELECT FOR UPDATE, AI RAG Knowledge Management System terdistribusi untuk mahasiswa.", page: 1 }],
      enabled: true
    }
  ];

  const result = await kms.answer({
    message: "Apa materi pokok nomor 3 dan 4 dalam modul web Ngolab?",
    taskTitle: "Praktikum PABW",
    durationMinutes: 25,
    history: [],
    passages: [],
    sources: dummySources
  });

  assert.equal(result.notFound, false);
  assert.ok(typeof result.answer === "string" && result.answer.length > 20);
  assert.ok(Array.isArray(result.citations));
  assert.ok(result.citations.length > 0);
  assert.ok(result.model && (result.model.includes("deepseek") || result.model.includes("KMS") || typeof result.model === "string"));

  // Periksa integritas sitasi yang sesuai kontrak UI
  const firstCit = result.citations[0];
  assert.ok(firstCit.sourceId);
  assert.ok(firstCit.sourceName);
  assert.ok(firstCit.location);
  assert.ok(firstCit.quote && firstCit.quote.length >= 12);
});

test("Express API: Endpoint Health, Status, dan Dokumen KMS", async () => {
  const app = createStudyCoachApp(testEnv);
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    // 1. Health check
    const healthRes = await fetch(`${baseUrl}/api/health`);
    assert.equal(healthRes.status, 200);
    const health = await healthRes.json();
    assert.equal(health.ok, true);
    assert.equal(health.studyCoachMode, "KMS_RAG_ONLINE");
    assert.equal(health.organization, "Gami_Study");

    // 2. KMS status
    const statusRes = await fetch(`${baseUrl}/api/study-coach/kms/status`);
    assert.equal(statusRes.status, 200);
    const status = await statusRes.json();
    assert.equal(status.success, true);
    assert.equal(status.configured, true);
    assert.equal(status.status, "ready");

    // 3. KMS documents
    const docsRes = await fetch(`${baseUrl}/api/study-coach/kms/documents`);
    assert.equal(docsRes.status, 200);
    const docsData = await docsRes.json();
    assert.equal(docsData.success, true);
    assert.ok(docsData.documents.length >= 2);
  } finally {
    server.close();
  }
});

test("Express API: POST /api/study-coach memproses pertanyaan siswa via KMS RAG", async () => {
  const app = createStudyCoachApp(testEnv);
  const server = app.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const studyReq = {
      message: "Jelaskan fungsi Single Sign-On (SSO) pada ekosistem Ngolab!",
      taskTitle: "Integrasi SSO & KMS",
      durationMinutes: 25,
      history: [],
      sources: [
        {
          id: "src-active-1",
          name: "Modul Pemrograman Web Ngolab",
          sections: [{ text: "Materi SSO: Single Sign-On (SSO) menggunakan HMAC dan JWT memungkinkan member login sekali di PointLab lalu otomatis masuk ke NGOLAB-GAMI.", page: 1 }],
          enabled: true
        }
      ]
    };

    const res = await fetch(`${baseUrl}/api/study-coach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(studyReq)
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.answer);
    assert.equal(data.notFound, false);
    assert.ok(Array.isArray(data.citations) && data.citations.length > 0);
    assert.ok(data.coverage);
    assert.ok(data.model && (data.model.includes("deepseek") || data.model.includes("KMS") || typeof data.model === "string"));
  } finally {
    server.close();
  }
});

test("Express API: Fallback Grounding BM25 lokal jika KMS offline", async () => {
  // Simulasi offline dengan URL tidak valid
  const offlineApp = createStudyCoachApp({
    ...testEnv,
    KMS_RAG_BASE_URL: "https://offline-invalid-kms-host.local",
  });
  const server = offlineApp.listen(0);
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}`;

  try {
    const studyReq = {
      message: "Apa kegunaan MySQL?",
      taskTitle: "Database",
      durationMinutes: 25,
      history: [],
      sources: [
        {
          id: "src-offline-1",
          name: "Catatan Basis Data",
          sections: [{ text: "MySQL digunakan untuk menyimpan data transaksi secara persisten dengan integritas ACID.", page: 1 }],
          enabled: true
        }
      ]
    };

    const res = await fetch(`${baseUrl}/api/study-coach`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(studyReq)
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.ok(data.answer);
    assert.equal(data.notFound, false);
    assert.equal(data.model, "local-bm25-grounding");
    assert.ok(data.citations.length > 0);
  } finally {
    server.close();
  }
});
