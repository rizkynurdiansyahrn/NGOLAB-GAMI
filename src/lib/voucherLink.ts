// Tombol "Voucher" (bottom nav & halaman Profil): penghubung ke halaman
// penukaran voucher/reward di PoinLab. URL bisa diisi lewat env
// VITE_VOUCHER_URL; selama kosong dipakai halaman redeem PoinLab produksi,
// jadi tombol langsung berfungsi tanpa konfigurasi tambahan.
export const POINTLAB_REDEEM_URL = "https://point.ngolab.online/redeem";
/** Halaman redeem PoinLab saat development (server PoinLab lokal, port 5173). */
export const LOCAL_POINTLAB_REDEEM_URL = "http://localhost:5173/redeem";

/**
 * URL redeem bawaan sesuai environment: dev memakai server PoinLab lokal
 * supaya sesi SSO yang sudah terbentuk di 5173 terpakai (user tidak diminta
 * login lagi), produksi memakai domain PoinLab resmi.
 */
export function defaultVoucherUrl(isDev: boolean): string {
  return isDev ? LOCAL_POINTLAB_REDEEM_URL : POINTLAB_REDEEM_URL;
}

export const VOUCHER_HINT =
  "URL voucher belum diatur. Hubungi pengelola NGOLAB untuk menautkan halaman voucher.";

export function resolveVoucherUrl(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const url = raw.trim();
  if (!url) return null;
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

// URL efektif: env VITE_VOUCHER_URL kalau valid, kalau tidak halaman redeem
// PoinLab sesuai environment (dev = server lokal 5173, sesi SSO terpakai).
const isDev = (import.meta.env as { DEV?: boolean } | undefined)?.DEV === true;

export const VOUCHER_URL: string | null =
  resolveVoucherUrl(import.meta.env?.VITE_VOUCHER_URL) ?? defaultVoucherUrl(isDev);
