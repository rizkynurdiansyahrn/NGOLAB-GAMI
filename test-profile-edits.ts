// Tes modul edit profil & tautan voucher (murni, tanpa DOM).
import {
  buildProfileUpdatePayload,
  clearProfileFallback,
  isValidPhone,
  mergeProfileFallback,
  parseProfileFallback,
  PROFILE_FALLBACK_KEY_PREFIX,
  profileFallbackKey,
  readProfileFallback,
  sanitizePhoneInput,
  serializeProfileFallback,
  validateProfileInput,
  writeProfileFallback,
} from "./src/lib/profileEdits";
import { resolveVoucherUrl, VOUCHER_HINT, VOUCHER_URL } from "./src/lib/voucherLink";
import { DEFAULT_AVATAR } from "./src/lib/userProfile";

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean, detail?: unknown): void {
  if (condition) {
    passed += 1;
    console.log(`  ok  ${label}`);
  } else {
    failed += 1;
    console.error(`  FAIL ${label}`, detail ?? "");
  }
}

console.log("sanitize & validasi telepon");
check("angka dibersihkan dari format", sanitizePhoneInput("0812-3456 7890") === "081234567890");
check("tanda + dipertahankan", sanitizePhoneInput("+62 812 3456") === "+628123456");
check("input non-string jadi kosong", sanitizePhoneInput(undefined) === "");
check("nomor 12 angka valid", isValidPhone("081234567890"));
check("nomor internasional valid", isValidPhone("+628123456789"));
check("nomor terlalu pendek ditolak", !isValidPhone("0812345"));
check("nomor dengan huruf ditolak", !isValidPhone("0812abc3456"));
check("nomor 16 angka ditolak", !isValidPhone("6281234567890123"));

console.log("validateProfileInput");
check("nama kosong ditolak", !validateProfileInput("  ").valid);
check("nama 1 karakter ditolak", !validateProfileInput("A").valid);
check("nama valid diterima", validateProfileInput("Rizky").valid);
check("telepon kosong diperbolehkan (opsional)", validateProfileInput("Rizky", "").valid);
check("telepon tidak wajar ditolak", !validateProfileInput("Rizky", "123").valid);
check("telepon non-angka ditolak", !validateProfileInput("Rizky", "abcdefghij").valid);
check("telepon bersih dari pemformatan diterima", validateProfileInput("Rizky", "0812-3456-7890").valid);

console.log("buildProfileUpdatePayload");
const payload = buildProfileUpdatePayload({
  userId: "u-1",
  name: "  Rizky  ",
  phone: "0812-3456 7890",
  avatar: DEFAULT_AVATAR,
});
check("nama dipangkas", payload.nama === "Rizky");
check("telp dikirim bersih", payload.telp === "081234567890");
check("avatar standar dikirim sebagai URL bawaan API", payload.avatar_url === "https://picsum.photos/seed/u-1/100/100");
check(
  "avatar khusus dikirim apa adanya",
  buildProfileUpdatePayload({ userId: "u-1", name: "A", avatar: "https://x.test/a.jpg" }).avatar_url === "https://x.test/a.jpg"
);
check("tanpa telepon tidak mengirim telp", buildProfileUpdatePayload({ userId: "u-1", name: "A" }).telp === undefined);

console.log("serialize / parse cadangan");
const raw = serializeProfileFallback({ name: "  Rizky ", phone: " 0812 ", avatar: "data:image/jpeg;base64,AAA", savedAt: 1700000000000 });
const parsed = parseProfileFallback(raw);
check("nama dipangkas", parsed?.name === "Rizky");
check("telepon dibersihkan", parsed?.phone === "0812");
check("avatar utuh", parsed?.avatar === "data:image/jpeg;base64,AAA");
check("savedAt dipertahankan", parsed?.savedAt === 1700000000000);
check("JSON rusak ditolak", parseProfileFallback("{bukan json") === null);
check("nilai kosong ditolak", parseProfileFallback("") === null);
check("tanpa nama ditolak", parseProfileFallback(JSON.stringify({ phone: "0812" })) === null);
check("tanpa avatar ditolak", parseProfileFallback(JSON.stringify({ name: "Rizky" })) === null);

console.log("mergeProfileFallback");
const merged = mergeProfileFallback(
  { name: "Server", avatar: "/avatar-placeholder.svg", phone: "0800", points: 10 },
  { name: "Lokal", phone: "0812", avatar: "data:image/jpeg;base64,BBB", savedAt: 1 }
);
check("nama lokal menang", merged.name === "Lokal");
check("avatar lokal menang", merged.avatar === "data:image/jpeg;base64,BBB");
check("telepon lokal menang", merged.phone === "0812");
check("field lain dipertahankan", merged.points === 10);
check("tanpa cadangan data tidak berubah", mergeProfileFallback({ name: "A", avatar: "b" }, null).name === "A");

console.log("kunci penyimpanan");
check("format kunci", profileFallbackKey("u-9") === `${PROFILE_FALLBACK_KEY_PREFIX}u-9`);

console.log("resolveVoucherUrl");
check("URL https valid", resolveVoucherUrl("  https://voucher.test/halaman?a=1  ") === "https://voucher.test/halaman?a=1");
check("URL http valid", resolveVoucherUrl("http://voucher.test") === "http://voucher.test/");
check("kosong ditolak", resolveVoucherUrl("") === null);
check("spasi ditolak", resolveVoucherUrl("   ") === null);
check("javascript: ditolak", resolveVoucherUrl("javascript:alert(1)") === null);
check("bukan URL ditolak", resolveVoucherUrl("voucher.test") === null);
check("non-string ditolak", resolveVoucherUrl(42) === null);
check("hint tersedia", typeof VOUCHER_HINT === "string" && VOUCHER_HINT.length > 10);
check("VOUCHER_URL null saat env kosong", VOUCHER_URL === null);

console.log(`\n${passed}/${passed + failed} lulus`);
if (failed > 0) process.exit(1);
