import { fork } from "node:child_process";
import path from "node:path";

function extractionError(message, code, cause) {
  return Object.assign(new Error(message, { cause }), { code });
}

export function extractSourceFile(file) {
  const kind = path.extname(file.originalname).slice(1).toLowerCase();
  if (!["pdf", "docx", "txt", "md"].includes(kind)) {
    return Promise.reject(
      new Error("Gunakan file PDF, DOCX, TXT, atau Markdown (.md)."),
    );
  }
  return new Promise((resolve, reject) => {
    let extractor;
    try {
      // PDF.js 5.x can crash the host when imported in worker_threads on Windows.
      // A separate process contains native failures and keeps the HTTP server alive.
      extractor = fork(new URL("./extract-source.process.mjs", import.meta.url), {
        execArgv: ["--max-old-space-size=192"],
        serialization: "advanced",
        stdio: ["ignore", "ignore", "ignore", "ipc"],
        windowsHide: true,
      });
    } catch (cause) {
      reject(extractionError(
        "Layanan pembaca file belum dapat dimulai. Jalankan ulang aplikasi dan coba lagi.",
        "EXTRACTOR_START_FAILED",
        cause,
      ));
      return;
    }
    let settled = false;
    const finish = (error, sections) => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      if (extractor.connected) extractor.disconnect();
      if (extractor.exitCode === null && !extractor.killed) extractor.kill();
      if (error) reject(error);
      else
        resolve({
          name: path.basename(file.originalname).slice(0, 200),
          kind,
          sections,
        });
    };
    const timeout = setTimeout(
      () =>
        finish(
          extractionError(
            "File terlalu lama diproses. Coba unggah bagian materi yang lebih kecil.",
            "EXTRACTOR_TIMEOUT",
          ),
        ),
      30_000,
    );
    extractor.once("message", (result) => {
      if (typeof result?.error === "string") {
        finish(new Error(result.error));
        return;
      }
      if (!Array.isArray(result?.sections) || !result.sections.length) {
        finish(extractionError(
          "Pembaca file mengirim respons yang tidak lengkap. Silakan unggah kembali.",
          "EXTRACTOR_INVALID_RESPONSE",
        ));
        return;
      }
      finish(null, result.sections);
    });
    extractor.on("error", (cause) =>
      finish(
        extractionError(
          "Layanan pembaca file belum dapat dimulai. Jalankan ulang aplikasi dan coba lagi.",
          "EXTRACTOR_START_FAILED",
          cause,
        ),
      ),
    );
    extractor.once("close", (code, signal) => {
      if (settled) return;
      console.error("Study Coach extractor stopped:", { kind, code, signal });
      finish(extractionError(
        "Pembacaan file terhenti. Coba unggah kembali atau tempel teks materinya sebagai catatan.",
        "EXTRACTOR_PROCESS_EXIT",
      ));
    });
    extractor.send({ bytes: file.buffer, kind }, (cause) => {
      if (cause) finish(extractionError(
        "File belum dapat dikirim ke pembaca materi. Silakan unggah kembali.",
        "EXTRACTOR_SEND_FAILED",
        cause,
      ));
    });
  });
}
