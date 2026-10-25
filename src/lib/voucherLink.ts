// Tombol "Voucher Teman": penghubung ke halaman voucher milik rekan
// (backend membership & loyalty di sisi rekan). URL diisi lewat env
// VITE_VOUCHER_URL; selama kosong, tombol tampil nonaktif dengan petunjuk.
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

export const VOUCHER_URL: string | null = resolveVoucherUrl(
  import.meta.env?.VITE_VOUCHER_URL || "http://localhost:5173/promo"
);

export const POINTLAB_URL: string | null = resolveVoucherUrl(
  import.meta.env?.VITE_POINTLAB_URL || "http://localhost:5173"
);

export function buildPointLabSsoUrl(
  targetUrl: string | null = VOUCHER_URL,
  accessToken?: string | null,
): string | null {
  if (!targetUrl) return null;
  if (!accessToken || !accessToken.trim()) return targetUrl;
  try {
    const parsed = new URL(targetUrl);
    parsed.hash = `token=${encodeURIComponent(accessToken.trim())}`;
    return parsed.toString();
  } catch {
    return targetUrl;
  }
}
