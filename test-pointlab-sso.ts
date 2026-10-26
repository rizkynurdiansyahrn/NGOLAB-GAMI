// Uji helper Redirect-Auth (SSO ringan) ke PointLab — sisi Ngolab-Gami.
// Memastikan: URL halaman resmi PointLab dibangun dengan parameter redirect
// & mode yang benar, dan token JWT dari fragment callback diekstrak aman.
// Jalankan dari root repo: npx tsx test-pointlab-sso.ts
import {
  DEFAULT_POINTLAB_AUTH_PAGE,
  buildPointLabLoginUrl,
  extractTokenFromLocationHash,
} from "./src/lib/pointlabSso";

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

const JWT = "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6InUtMSJ9.sig-123";

// ── [1] URL halaman resmi PointLab ──────────────────────────────────────
const loginUrl = buildPointLabLoginUrl("https://gami.ngolab.online/", "login", DEFAULT_POINTLAB_AUTH_PAGE);
check(
  "[1.1] base mengarah ke halaman auth resmi PointLab",
  loginUrl.startsWith(`${DEFAULT_POINTLAB_AUTH_PAGE}?`),
  loginUrl,
);
const loginParams = new URLSearchParams(loginUrl.split("?")[1] ?? "");
check("[1.2] parameter redirect ter-encode benar", loginParams.get("redirect") === "https://gami.ngolab.online/", loginUrl);
check("[1.3] prompt=login selalu dikirim", loginParams.get("prompt") === "login", loginUrl);
check("[1.3b] mode login tidak perlu param mode", loginParams.get("mode") === null, loginUrl);

const registerUrl = buildPointLabLoginUrl("http://localhost:3001/", "register", DEFAULT_POINTLAB_AUTH_PAGE);
const registerParams = new URLSearchParams(registerUrl.split("?")[1] ?? "");
check("[1.4] mode register dikirim", registerParams.get("mode") === "register", registerUrl);
check("[1.5] redirect dev localhost ter-encode", registerParams.get("redirect") === "http://localhost:3001/", registerUrl);
check("[1.5b] mode register juga prompt=login", registerParams.get("prompt") === "login", registerUrl);

// Di luar Vite (mis. `npx tsx`) import.meta.env.DEV tidak ada, jadi aman
// memakai URL produksi PointLab — test mengunci perilaku itu.
const defaultUrl = buildPointLabLoginUrl("http://localhost:3001/", "login");
check("[1.6] tanpa DEV memakai URL produksi", defaultUrl.startsWith(`${DEFAULT_POINTLAB_AUTH_PAGE}?`), defaultUrl);

// ── [2] Token dari fragment callback ────────────────────────────────────
check("[2.1] token JWT diekstrak dari #token=...", extractTokenFromLocationHash(`#token=${JWT}`) === JWT);
check("[2.2] token tanpa tanda # ditolak", extractTokenFromLocationHash(`token=${JWT}`) === null);
check("[2.3] hash kosong -> null", extractTokenFromLocationHash("") === null);
check("[2.4] fragment tanpa token -> null", extractTokenFromLocationHash("#foo=bar") === null);
check("[2.5] token kosong -> null", extractTokenFromLocationHash("#token=") === null);
check("[2.6] token dicari walau ada param lain di fragment", extractTokenFromLocationHash(`#state=abc&token=${JWT}`) === JWT);
check("[2.7] token dengan spasi dibuang pinggirnya", extractTokenFromLocationHash(`#token=%20${JWT}%20`) === JWT);

console.log(`\n${passed} lulus, ${failed} gagal — total ${passed + failed} assertion`);
if (failed > 0) process.exit(1);
