/**
 * Test mandiri untuk src/lib/authUi.ts — jalankan: npx tsx test-authUi.ts
 * Menutup: pembacaan pesan error (field error/message), klasifikasi galat,
 * copy ramah pengguna, saran pindah ke login, label identitas, dan kalimat
 * pembuka "satu akun" (mencegah pengguna mendaftar ulang).
 */
import {
  accountSharingIntro,
  authErrorMessage,
  classifyAuthError,
  feedbackFromAuthError,
  friendlyAuthNotice,
  identifierFieldLabel,
} from "./src/lib/authUi";

let passed = 0;
let failed = 0;
const failures: string[] = [];

function check(label: string, actual: unknown, expected: unknown): void {
  const ok = JSON.stringify(actual) === JSON.stringify(expected);
  if (ok) {
    passed++;
  } else {
    failed++;
    failures.push(`${label}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

// ── authErrorMessage ───────────────────────────────────────────────────────
check("error message dari field error", authErrorMessage({ error: "NIM atau Email sudah terdaftar." }), "NIM atau Email sudah terdaftar.");
check("error message dari field message", authErrorMessage({ message: "Registrasi berhasil." }), "Registrasi berhasil.");
check("error diutamakan atas message", authErrorMessage({ error: "E", message: "M" }), "E");
check("spasi dirapikan", authErrorMessage({ error: "  Password minimal 6 karakter.  " }), "Password minimal 6 karakter.");
check("payload non-objek", authErrorMessage(null), "");
check("payload tanpa error/message", authErrorMessage({ token: "x" }), "");

// ── classifyAuthError ──────────────────────────────────────────────────────
check("duplicate", classifyAuthError("NIM atau Email sudah terdaftar."), "duplicate");
check("not-found", classifyAuthError("Akun tidak ditemukan. Periksa kembali NIM atau Email Anda."), "not-found");
check("wrong-password", classifyAuthError("Password yang Anda masukkan salah. Silakan coba lagi."), "wrong-password");
check("missing-field", classifyAuthError("NIM/Email dan Password wajib diisi."), "missing-field");
check("weak-password", classifyAuthError("Password minimal 6 karakter."), "weak-password");
check("unknown", classifyAuthError("Sesuatu yang tidak terduga."), "unknown");
check("empty", classifyAuthError(""), "unknown");
check("case-insensitive", classifyAuthError("nim atau email SUDAH TERDAFTAR."), "duplicate");

// ── friendlyAuthNotice ─────────────────────────────────────────────────────
check("notice duplicate", friendlyAuthNotice("duplicate"), "NIM/Email ini sudah terdaftar — berarti kamu sudah punya akun PoinLab. Tidak perlu daftar lagi, silakan masuk dengan akun tersebut.");
check("notice wrong-password", friendlyAuthNotice("wrong-password"), "Password salah. Silakan coba lagi.");
check("notice missing-field", friendlyAuthNotice("missing-field"), "Lengkapi dulu NIM/Email dan password.");
check("notice weak-password", friendlyAuthNotice("weak-password"), "Password minimal 6 karakter.");
check("notice not-found", friendlyAuthNotice("not-found"), "Akun tidak ditemukan. Periksa kembali NIM/Email-mu.");
check("notice unknown kosong", friendlyAuthNotice("unknown"), "");

// ── feedbackFromAuthError ──────────────────────────────────────────────────
const dup = feedbackFromAuthError({ error: "NIM atau Email sudah terdaftar." });
check("feedback duplicate kind", dup.kind, "duplicate");
check("feedback duplicate suggestLogin", dup.suggestLogin, true);
check("feedback duplicate notice", dup.notice, friendlyAuthNotice("duplicate"));
const wrong = feedbackFromAuthError({ error: "Password yang Anda masukkan salah. Silakan coba lagi." });
check("feedback wrong-password kind", wrong.kind, "wrong-password");
check("feedback wrong-password suggestLogin", wrong.suggestLogin, false);
const unknown = feedbackFromAuthError({ error: "Server sedang sibuk." });
check("feedback unknown pakai pesan server", unknown.notice, "Server sedang sibuk.");
check("feedback unknown suggestLogin", unknown.suggestLogin, false);
const empty = feedbackFromAuthError({});
check("feedback tanpa pesan", empty.notice, "Belum berhasil. Silakan coba lagi.");
const network = feedbackFromAuthError(null, { network: true });
check("feedback network kind", network.kind, "network");
check("feedback network notice", network.notice, "Gagal menghubungi server. Periksa koneksi internetmu lalu coba lagi.");
check("feedback network suggestLogin", network.suggestLogin, false);

// ── identifierFieldLabel ───────────────────────────────────────────────────
check("label pointlab", identifierFieldLabel("pointlab"), "NIM atau Email akun PoinLab-mu");
check("label geasteats", identifierFieldLabel("geasteats"), "Email atau Nomor Telepon");

// ── accountSharingIntro ────────────────────────────────────────────────────
const introLogin = accountSharingIntro("pointlab", "login");
check("intro login sebut PointLab", introLogin.includes("PoinLab"), true);
check("intro login ajak pakai akun yang ada", introLogin.includes("Sudah punya akun PoinLab"), true);
const introRegister = accountSharingIntro("pointlab", "register");
check("intro daftar sebut sekali", introRegister.includes("Daftar sekali di sini"), true);
check("intro daftar sebut dipakai di PoinLab", introRegister.includes("dipakai di PoinLab juga"), true);
check("intro beda antar mode", introLogin !== introRegister, true);
check("intro geasteats tidak kosong", accountSharingIntro("geasteats", "login").length > 0, true);

// ── ringkasan ──────────────────────────────────────────────────────────────
if (failed > 0) {
  console.error("GAGAL:");
  failures.forEach((f) => console.error(" - " + f));
  console.error(`${passed + failed} assertion: ${passed} lulus, ${failed} gagal`);
  process.exit(1);
}
console.log(`${passed} assertion lulus (authUi)`);
