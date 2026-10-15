// Bantuan tampilan & pesan untuk alur autentikasi (login/daftar).
// Modul ini SENGAJA murni (tanpa fetch, tanpa import.meta.env) supaya bisa
// diuji langsung dengan `npx tsx test-authUi.ts`.
//
// Kontrak pesan error TERVERIFIKASI (server PoinLab):
//   "NIM/Email dan Password wajib diisi."
//   "NIM atau Email sudah terdaftar."
//   "Akun tidak ditemukan. Periksa kembali NIM atau Email Anda."
//   "Password yang Anda masukkan salah. Silakan coba lagi."
//   "Password minimal 6 karakter."
// Server menjawab field `error`; GeastEats memakai field `message`.

import type { IdentityProvider } from "./identity";

/** Jenis galat autentikasi yang bisa dikenali dari pesan server. */
export type AuthErrorKind =
  /** NIM/Email sudah terdaftar → pengguna sudah punya akun, sarankan login. */
  | "duplicate"
  /** Akun (NIM/Email) tidak ditemukan di server. */
  | "not-found"
  /** Password yang dimasukkan salah. */
  | "wrong-password"
  /** Field wajib (identifier/NIM/password) kosong. */
  | "missing-field"
  /** Password lebih pendek dari minimum (6 karakter). */
  | "weak-password"
  /** Tidak bisa mengenali galat (fallback ke pesan server). */
  | "unknown";

/** Galat jaringan/gagal fetch (dibedakan agar copy-nya jelas). */
export const AUTH_NETWORK_ERROR = "network";

export type AuthFailureKind = AuthErrorKind | typeof AUTH_NETWORK_ERROR;

export interface AuthFeedback {
  /** Jenis galat (untuk logika UI, mis. menawarkan pindah ke tab login). */
  kind: AuthFailureKind;
  /** Pesan siap tampil untuk pengguna (Bahasa Indonesia). */
  notice: string;
  /** true kalau pengguna sebaiknya diarahkan ke form login, bukan daftar. */
  suggestLogin: boolean;
}

/** Ambil pesan galat dari respons server (PointLab: `error`, GeastEats: `message`). */
export function authErrorMessage(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const data = payload as Record<string, unknown>;
  const error = typeof data.error === "string" ? data.error : "";
  const message = typeof data.message === "string" ? data.message : "";
  return (error || message).trim();
}

/** Kenali jenis galat dari teks pesan server (peka huruf besar/kecil). */
export function classifyAuthError(message: string): AuthErrorKind {
  const text = message.toLowerCase();
  if (!text) return "unknown";
  if (text.includes("sudah terdaftar")) return "duplicate";
  if (text.includes("tidak ditemukan")) return "not-found";
  if (text.includes("salah")) return "wrong-password";
  if (text.includes("wajib diisi")) return "missing-field";
  if (text.includes("minimal")) return "weak-password";
  return "unknown";
}

/** Copy ramah pengguna untuk setiap jenis galat yang dikenal. */
export function friendlyAuthNotice(kind: AuthErrorKind): string {
  switch (kind) {
    case "duplicate":
      return "NIM/Email ini sudah terdaftar — berarti kamu sudah punya akun PoinLab. Tidak perlu daftar lagi, silakan masuk dengan akun tersebut.";
    case "not-found":
      return "Akun tidak ditemukan. Periksa kembali NIM/Email-mu.";
    case "wrong-password":
      return "Password salah. Silakan coba lagi.";
    case "missing-field":
      return "Lengkapi dulu NIM/Email dan password.";
    case "weak-password":
      return "Password minimal 6 karakter.";
    default:
      return "";
  }
}

/**
 * Ubah respons galat server (atau galat jaringan) menjadi pesan + saran
 * untuk pengguna. Kalau jenisnya tidak dikenal, pesan asli server
 * ditampilkan apa adanya agar tetap informatif.
 */
export function feedbackFromAuthError(
  payload: unknown,
  options: { network?: boolean } = {},
): AuthFeedback {
  if (options.network) {
    return {
      kind: AUTH_NETWORK_ERROR,
      notice: "Gagal menghubungi server. Periksa koneksi internetmu lalu coba lagi.",
      suggestLogin: false,
    };
  }
  const serverMessage = authErrorMessage(payload);
  const kind = classifyAuthError(serverMessage);
  const notice = friendlyAuthNotice(kind) || serverMessage || "Belum berhasil. Silakan coba lagi.";
  return { kind, notice, suggestLogin: kind === "duplicate" };
}

/** Label kolom identitas agar pengguna tahu akun mana yang dipakai. */
export function identifierFieldLabel(provider: IdentityProvider): string {
  return provider === "pointlab"
    ? "NIM atau Email akun PoinLab-mu"
    : "Email atau Nomor Telepon";
}

/**
 * Kalimat pembuka kartu auth yang menjelaskan satu akun dipakai bersama,
 * supaya pengguna yang sudah punya akun PoinLab tidak mendaftar ulang.
 */
export function accountSharingIntro(
  provider: IdentityProvider,
  mode: "login" | "register",
): string {
  if (provider === "pointlab") {
    return mode === "login"
      ? "Satu akun untuk PoinLab & Ngolab-Gami. Sudah punya akun PoinLab? Langsung masuk pakai NIM/Email + password yang sama — poin, tier, dan riwayatmu terbawa otomatis."
      : "Belum pernah pakai PoinLab? Daftar sekali di sini — akun yang sama otomatis bisa dipakai di PoinLab juga.";
  }
  return mode === "login"
    ? "Masuk memakai akun Ngolab kamu."
    : "Daftar sekali, akun yang sama dipakai di seluruh layanan Ngolab.";
}
