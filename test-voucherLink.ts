// Uji helper tautan voucher (`src/lib/voucherLink.ts`) — memastikan URL
// voucher divalidasi ketat (hanya http/https, valid) dan saat env kosong
// tombol jatuh ke halaman redeem PoinLab produksi.
// Jalankan dari root repo: npx tsx test-voucherLink.ts
import {
  LOCAL_POINTLAB_REDEEM_URL,
  POINTLAB_REDEEM_URL,
  VOUCHER_HINT,
  VOUCHER_URL,
  defaultVoucherUrl,
  resolveVoucherUrl,
} from "./src/lib/voucherLink";

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean, detail?: unknown) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.log(
      `  FAIL  ${label}${detail === undefined ? "" : ` -> ${JSON.stringify(detail)}`}`,
    );
  }
}

// ── [1] resolveVoucherUrl: validasi URL ─────────────────────────────────
check("[1.1] URL https valid diterima", resolveVoucherUrl("https://point.ngolab.online/redeem") === "https://point.ngolab.online/redeem");
check("[1.2] URL http valid diterima", resolveVoucherUrl("http://localhost:5173/redeem") === "http://localhost:5173/redeem");
check("[1.3] spasi di pinggir dibuang", resolveVoucherUrl("  https://point.ngolab.online/redeem  ") === "https://point.ngolab.online/redeem");
check("[1.4] string kosong -> null", resolveVoucherUrl("") === null);
check("[1.5] spasi saja -> null", resolveVoucherUrl("   ") === null);
check("[1.6] bukan string (undefined) -> null", resolveVoucherUrl(undefined) === null);
check("[1.7] bukan string (number) -> null", resolveVoucherUrl(42) === null);
check("[1.8] bukan string (object) -> null", resolveVoucherUrl({}) === null);
check("[1.9] teks bukan URL -> null", resolveVoucherUrl("bukan-url") === null);
check("[1.10] protokol javascript: ditolak", resolveVoucherUrl("javascript:alert(1)") === null);
check("[1.11] protokol data: ditolak", resolveVoucherUrl("data:text/html,<script>") === null);

// ── [2] Default PoinLab ─────────────────────────────────────────────────
check("[2.1] konstanta redeem PoinLab produksi", POINTLAB_REDEEM_URL === "https://point.ngolab.online/redeem");
check("[2.2] petunjuk tampil saat URL belum diatur", typeof VOUCHER_HINT === "string" && VOUCHER_HINT.length > 0);
check("[2.3] dev memakai server PoinLab lokal (sesi SSO terpakai, tanpa login lagi)", defaultVoucherUrl(true) === LOCAL_POINTLAB_REDEEM_URL, defaultVoucherUrl(true));
check("[2.4] produksi memakai domain PoinLab resmi", defaultVoucherUrl(false) === POINTLAB_REDEEM_URL, defaultVoucherUrl(false));

// Di runner tsx, import.meta.env tidak diset → VITE_VOUCHER_URL kosong & DEV
// tidak aktif → VOUCHER_URL harus jatuh ke halaman redeem PoinLab produksi.
check("[2.5] env kosong & bukan dev -> VOUCHER_URL jatuh ke redeem PoinLab", VOUCHER_URL === POINTLAB_REDEEM_URL, VOUCHER_URL);

console.log(`\n${passed} lulus, ${failed} gagal — total ${passed + failed} assertion`);
if (failed > 0) process.exit(1);
