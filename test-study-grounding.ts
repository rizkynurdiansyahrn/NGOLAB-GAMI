// Uji modul grounding Study Coach: validasi materi, pemilihan passage,
// dan verifikasi jawaban AI harus merujuk materi.
// Jalankan dari root repo: npx tsx test-study-grounding.ts
import {
  retrievePassages,
  validateGroundedAnswer,
  validateSources,
} from "./server/study-grounding.mjs";

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

const sources = [
  {
    id: "biol-1",
    name: "Catatan Biologi",
    kind: "note",
    sections: [
      { text: "Fotosintesis terjadi di kloroplas daun tumbuhan hijau." },
      { text: "Klorofil menyerap cahaya merah dan biru untuk energi." },
    ],
  },
  {
    id: "fis-1",
    name: "Catatan Fisika",
    kind: "note",
    enabled: false,
    sections: [{ text: "Hukum Newton membahas gaya dan percepatan benda." }],
  },
];

console.log("[1] validateSources");
expectThrow("array kosong ditolak", () => validateSources([]));
expectThrow("bukan array ditolak", () => validateSources("x"));
expectThrow("id dengan karakter aneh ditolak", () => validateSources([{ ...sources[0], id: "bad id!" }]));
expectThrow("id duplikat ditolak", () => validateSources([sources[0], sources[0]]));
expectThrow("section kosong ditolak", () => validateSources([{ ...sources[0], sections: [] }]));
expectThrow("halaman 0 ditolak", () => validateSources([{ ...sources[0], sections: [{ text: "abc", page: 0 }] }]));
expectThrow("halaman bukan bilangan bulat ditolak", () => validateSources([{ ...sources[0], sections: [{ text: "abc", page: 1.5 }] }]));
expectThrow("text bukan string ditolak", () => validateSources([{ ...sources[0], sections: [{ text: 42 }] }]));

const cleaned = validateSources(sources);
check("sumber disabled disaring", cleaned.length === 1);
check("karakter kontrol dibersihkan", validateSources([
  { ...sources[0], sections: [{ text: "teks\u0000kontrol\u001fbersih" }] },
])[0].sections[0].text === "teks kontrol bersih");
check("teks di-trim", validateSources([
  { ...sources[0], sections: [{ text: "  spasi tepi  " }] },
])[0].sections[0].text === "spasi tepi");

console.log("[2] retrievePassages");
const { passages, totalPassages } = retrievePassages(validateSources(sources), "di mana fotosintesis terjadi");
check("semua chunk terhitung", totalPassages === 2, totalPassages);
check("minimal satu passage terpilih", passages.length >= 1);
check("passage punya id berurutan", passages[0].passageId === "P1");
check("passage membawa sumber", passages.every((p) => typeof p.sourceId === "string" && p.sourceName.length > 0));
const broad = retrievePassages(validateSources(sources), "buatkan ringkasan materi");
check("pertanyaan luas tetap memilih passage", broad.passages.length >= 1);
check("riwayat user memperluas query", retrievePassages(
  validateSources(sources),
  "lanjutkan",
  [{ role: "user", text: "klorofil menyerap cahaya" }],
).passages.length >= 1);

console.log("[3] validateGroundedAnswer");
const groundedPayload = {
  answer: "Fotosintesis terjadi di kloroplas daun tumbuhan [1].",
  notFound: false,
  citations: [{ passageId: "P1", quote: "Fotosintesis terjadi di kloroplas" }],
};
const grounded = validateGroundedAnswer(groundedPayload, passages);
check("jawaban bersurat diterima", grounded.answer.includes("kloroplas"));
check("sitasi dipetakan ke sumber", grounded.citations[0].sourceId === "biol-1");
check("kutipan palsu diganti penggalan asli", grounded.citations[0].quote.startsWith("Fotosintesis"));

const notFound = validateGroundedAnswer({ answer: "", notFound: true, citations: [] }, passages);
check("notFound:true mengembalikan pesan standar", notFound.notFound === true && notFound.citations.length === 0);

expectThrow("payload tanpa struktur ditolak", () => validateGroundedAnswer("bukan json", passages));
expectThrow("jawaban tanpa sitasi ditolak", () => validateGroundedAnswer({ answer: "Fotosintesis [1]", notFound: false, citations: [] }, passages));
expectThrow("jawaban tanpa nomor rujukan ditolak", () => validateGroundedAnswer({
  answer: "Fotosintesis terjadi di kloroplas daun.",
  notFound: false,
  citations: [{ passageId: "P1", quote: "Fotosintesis terjadi di kloroplas" }],
}, passages));
expectThrow("jawaban terlalu panjang ditolak", () => validateGroundedAnswer({
  answer: "x".repeat(10_001) + " [1]",
  notFound: false,
  citations: [{ passageId: "P1", quote: "Fotosintesis" }],
}, passages));
check("sitasi ke passage lain diabaikan, bukan gagal", validateGroundedAnswer({
  answer: "Fotosintesis [1].",
  notFound: false,
  citations: [
    { passageId: "TIDAK-ADA", quote: "apa saja" },
    { passageId: "P1", quote: "Fotosintesis terjadi di kloroplas" },
  ],
}, passages).citations.length === 1);

console.log(`\nTotal: ${passed} lulus, ${failed} gagal`);
if (failed > 0) process.exit(1);
