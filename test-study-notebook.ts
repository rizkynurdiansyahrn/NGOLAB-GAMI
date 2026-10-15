// Uji normalizeNotebook dan perhitungan karakter catatan belajar (Gami Study).
// Jalankan dari root repo: npx tsx test-study-notebook.ts
import {
  notebookCharacterCount,
  normalizeNotebook,
  sourceCharacterCount,
  type StudySource,
} from "./src/lib/studyNotebook";

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean, detail?: unknown) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}${detail === undefined ? "" : ` -> ${JSON.stringify(detail)}`}`);
  }
}

function expectThrow(label: string, fn: () => unknown) {
  try {
    fn();
    failed += 1;
    console.log(`  FAIL  ${label} -> tidak melempar error`);
  } catch {
    passed += 1;
    console.log(`  PASS  ${label}`);
  }
}

const validSource: StudySource = {
  id: "src-1",
  name: "Catatan Biologi",
  kind: "note",
  enabled: true,
  sections: [{ text: "Fotosintesis mengubah cahaya menjadi energi kimia." }],
};

console.log("[1] Input tidak valid");
check("null -> notebook kosong", normalizeNotebook(null).sources.length === 0);
check("string -> notebook kosong", normalizeNotebook("bukan objek").messages.length === 0);
check("sumber tanpa section dibuang", normalizeNotebook({ sources: [{ ...validSource, sections: [] }] }).sources.length === 0);
check("kind tidak dikenal dibuang", normalizeNotebook({ sources: [{ ...validSource, kind: "exe" }] }).sources.length === 0);
check("id string kosong dibuang", normalizeNotebook({ sources: [{ ...validSource, id: "" }] }).sources.length === 0);
check("id duplikat: salah satu dibuang", normalizeNotebook({ sources: [validSource, validSource] }).sources.length === 1);

console.log("[2] Sumber valid");
const notebook = normalizeNotebook({ sources: [{ ...validSource, enabled: false }] });
check("sumber valid masuk", notebook.sources.length === 1);
check("enabled:false dipertahankan", notebook.sources[0].enabled === false);
check("enabled default true", normalizeNotebook({ sources: [validSource] }).sources[0].enabled === true);
check("section teks kosong dibuang", normalizeNotebook({
  sources: [{ ...validSource, sections: [{ text: "   " }, { text: "Isi nyata", page: 2 }] }],
}).sources[0].sections.length === 1);
check("halaman negatif dibuang", normalizeNotebook({
  sources: [{ ...validSource, sections: [{ text: "ABC", page: -3 }] }],
}).sources[0].sections[0].page === undefined);
check("nama dipotong spasi", normalizeNotebook({ sources: [{ ...validSource, name: "  Padat  " }] }).sources[0].name === "Padat");

console.log("[3] Pesan & sitasi");
const withMessages = normalizeNotebook({
  sources: [validSource],
  messages: [
    { role: "user", text: "apa itu fotosintesis?" },
    { role: "assistant", text: "Proses pengubahan cahaya [1]", citations: [{ sourceId: "src-1", sourceName: "Catatan Biologi", location: "Bagian 1", quote: "Fotosintesis mengubah cahaya" }] },
    { role: "system", text: "tidak boleh masuk" },
    { role: "user", text: "   " },
    { role: "assistant", text: "sitasi ngawur", citations: [{ sourceId: "tidak-ada", sourceName: "X", location: "Y", quote: "Z" }] },
  ],
});
check("hanya 3 pesan valid", withMessages.messages.length === 3, withMessages.messages.length);
check("sitasi ke sumber tak dikenal dibuang", (withMessages.messages[2]?.citations?.length ?? -1) === 0);
check("sitasi valid disimpan", (withMessages.messages[1]?.citations?.length ?? -1) === 1);

console.log("[4] Perhitungan karakter");
const source = { ...validSource, sections: [{ text: "12345" }, { text: "678" }] };
check("sourceCharacterCount menjumlah section", sourceCharacterCount(source) === 8);
check("notebookCharacterCount menjumlah sumber", notebookCharacterCount([source, source]) === 16);
check("sumber terlalu besar dibuang", normalizeNotebook({
  sources: [{ ...validSource, sections: [{ text: "x".repeat(300_000) }] }],
}).sources.length === 0);

console.log(`\nTotal: ${passed} lulus, ${failed} gagal`);
if (failed > 0) process.exit(1);
