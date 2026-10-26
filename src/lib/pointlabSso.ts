/**
 * Redirect-Auth (SSO ringan) ke PointLab — sisi Ngolab-Gami.
 *
 * Alur:
 *   1. Pengunjung klik tombol login/daftar di Ngolab-Gami.
 *   2. Browser diarahkan ke halaman login/daftar RESMI PointLab
 *      (/auth?redirect=<url ngolab-gami>&mode=login|register).
 *      Ngolab-Gami TIDAK memuat form login/daftar tiruan.
 *   3. Setelah login/daftar berhasil di PointLab, PointLab mengembalikan
 *      pengguna ke url Ngolab-Gami dengan token JWT pada fragment URL:
 *      https://gami.ngolab.online/#token=<JWT>
 *   4. Ngolab-Gami memvalidasi token itu ke GET /api/users/profile (Bearer),
 *      lalu membuat sesi lokalnya sendiri (authSession).
 *
 * Modul ini sengaja tidak melakukan efek samping pada import; fungsi
 * redirect hanya dijalankan dari dalam handler klik React.
 */

/** Halaman auth resmi PointLab (produksi). */
export const DEFAULT_POINTLAB_AUTH_PAGE = "https://point.ngolab.online/auth";
/** Halaman auth PointLab saat development (jalankan PointLab via `npm run dev`). */
export const LOCAL_POINTLAB_AUTH_PAGE = "http://localhost:5173/auth";

const configured = (import.meta.env as Record<string, string | undefined> | undefined)
  ?.VITE_POINTLAB_AUTH_URL
  ?.replace(/\/+$/, "");

/** URL halaman auth PointLab yang dipakai aplikasi ini. */
export const POINTLAB_AUTH_PAGE = configured
  || ((import.meta.env as { DEV?: boolean } | undefined)?.DEV
    ? LOCAL_POINTLAB_AUTH_PAGE
    : DEFAULT_POINTLAB_AUTH_PAGE);

export type PointLabAuthMode = "login" | "register";

/** Bangun URL halaman resmi PointLab lengkap dengan parameter redirect & mode.
 *  Selalu menyertakan `prompt=login` agar tombol Login selalu memunculkan form
 *  kredensial PointLab (sesi lama di PointLab dibuang), bukan auto-masuk. */
export function buildPointLabLoginUrl(
  returnUrl: string,
  mode: PointLabAuthMode = "login",
  authPage: string = POINTLAB_AUTH_PAGE,
): string {
  const params = new URLSearchParams();
  if (returnUrl) params.set("redirect", returnUrl);
  if (mode === "register") params.set("mode", "register");
  params.set("prompt", "login");
  return `${authPage}?${params.toString()}`;
}

/** Ambil token JWT dari fragment URL yang dikembalikan PointLab (#token=...). */
export function extractTokenFromLocationHash(hash: string): string | null {
  if (!hash || !hash.startsWith("#")) return null;
  const params = new URLSearchParams(hash.slice(1));
  const token = params.get("token");
  return token && token.trim() ? token.trim() : null;
}

/** URL tab beranda Ngolab-Gami saat ini (tanpa fragment). */
export function currentReturnUrl(): string {
  if (typeof window === "undefined") return "";
  const { origin, pathname, search } = window.location;
  return `${origin}${pathname}${search}`;
}

/** Alihkan pengguna ke halaman login/daftar resmi PointLab. */
export function redirectToPointLabAuth(mode: PointLabAuthMode = "login"): void {
  if (typeof window === "undefined") return;
  window.location.href = buildPointLabLoginUrl(currentReturnUrl(), mode);
}
