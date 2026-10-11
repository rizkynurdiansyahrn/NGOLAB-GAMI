import {
  MAX_SOURCE_CHARACTERS,
  MAX_PDF_PAGES,
} from "../shared/studyCoachLimits.mjs";

function cleanText(text) {
  return text
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, " ")
    .trim();
}

async function extract({ bytes, kind }) {
  const buffer = Buffer.from(bytes);
  let sections;
  if (kind === "pdf") {
    if (buffer.indexOf("%PDF-") < 0 || buffer.indexOf("%PDF-") > 1024)
      throw new Error("File ini bukan PDF yang valid.");
    const { PDFParse } = await import("pdf-parse");
    const parser = new PDFParse({ data: new Uint8Array(buffer), verbosity: 0 });
    try {
      const info = await parser.getInfo();
      if (info.total > MAX_PDF_PAGES)
        throw new Error(
          `PDF maksimal ${MAX_PDF_PAGES} halaman. Unggah bab yang ingin dipelajari saja.`,
        );
      const result = await parser.getText({ pageJoiner: "" });
      sections = result.pages
        .map((page) => ({ page: page.num, text: cleanText(page.text) }))
        .filter((page) => page.text);
    } finally {
      await parser.destroy();
    }
  } else if (kind === "docx") {
    if (buffer.subarray(0, 2).toString() !== "PK")
      throw new Error("File ini bukan DOCX yang valid.");
    const mammoth = (await import("mammoth")).default;
    const result = await mammoth.extractRawText({ buffer });
    sections = [{ text: cleanText(result.value) }];
  } else {
    const encoding =
      buffer[0] === 0xff && buffer[1] === 0xfe ? "utf-16le" : "utf-8";
    let text;
    try {
      text = new TextDecoder(encoding, { fatal: true }).decode(buffer);
    } catch {
      throw new Error(
        "Teks tidak dapat dibaca. Simpan file sebagai UTF-8 atau tempel isinya sebagai catatan.",
      );
    }
    if (text.includes("\u0000"))
      throw new Error("File tidak berisi teks yang dapat dibaca.");
    sections = [{ text: cleanText(text) }];
  }
  const characters = sections.reduce(
    (total, section) => total + section.text.length,
    0,
  );
  if (!characters)
    throw new Error(
      kind === "pdf"
        ? "PDF berhasil dibuka, tetapi tidak memiliki teks yang bisa diambil. PDF hasil scan atau tulisan tangan memerlukan OCR (mengubah gambar menjadi teks). Gunakan PDF berisi teks atau tempel hasil OCR sebagai catatan."
        : "Tidak ada teks yang terbaca dalam file ini. Tempel materi sebagai catatan.",
    );
  if (characters > MAX_SOURCE_CHARACTERS)
    throw new Error(
      `Materi terlalu panjang. Maksimal ${MAX_SOURCE_CHARACTERS.toLocaleString("id-ID")} karakter per sumber; pisahkan menjadi beberapa bab.`,
    );
  return sections;
}

// Stop this document job if the HTTP server exits or cancels extraction.
process.once("disconnect", () => process.exit(0));
process.once("message", async (job) => {
  let result;
  try {
    result = { sections: await extract(job) };
  } catch (error) {
    const knownErrors = [
      "File ini",
      "PDF maksimal",
      "PDF berhasil dibuka",
      "Teks tidak",
      "File tidak",
      "Tidak ada teks",
      "Materi terlalu",
    ];
    const message =
      error instanceof Error &&
      knownErrors.some((prefix) => error.message.startsWith(prefix))
        ? error.message
        : "File belum dapat dibaca. Pastikan file tidak rusak atau dilindungi kata sandi.";
    result = { error: message };
  }
  if (process.connected) {
    process.send(result, (error) => {
      if (error) process.exitCode = 1;
      if (process.connected) process.disconnect();
    });
  }
});
