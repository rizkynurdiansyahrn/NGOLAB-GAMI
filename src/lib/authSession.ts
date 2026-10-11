import type { AuthSession } from "./userProfile";

/**
 * Penyimpanan sesi login di browser agar pengguna tidak perlu login ulang
 * setiap halaman dimuat ulang (refresh) atau aplikasi dibuka kembali.
 * Token yang sama tetap dikirim ke API seperti biasa setelah dipulihkan.
 */

const STORAGE_KEY = "ngolab.session.v1";
// Sesi kedaluwarsa setelah 30 hari; sesi lama dibersihkan otomatis.
const MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;

interface StoredSession extends AuthSession {
  savedAt: number;
}

function storage(): Storage | null {
  try {
    if (typeof window === "undefined" || !window.localStorage) return null;
    // Mode privat sebagian browser melempar error saat menulis.
    const probeKey = `${STORAGE_KEY}.probe`;
    window.localStorage.setItem(probeKey, "1");
    window.localStorage.removeItem(probeKey);
    return window.localStorage;
  } catch {
    return null;
  }
}

function isValidSession(value: unknown): value is StoredSession {
  if (!value || typeof value !== "object") return false;
  const session = value as Partial<StoredSession>;
  return (
    typeof session.token === "string" &&
    session.token.trim().length > 0 &&
    !!session.user &&
    typeof session.user === "object" &&
    typeof (session.user as { id?: unknown }).id === "string" &&
    (session.user as { id: string }).id.trim().length > 0 &&
    Number.isFinite(session.savedAt)
  );
}

export function saveAuthSession(session: AuthSession): void {
  const store = storage();
  if (!store) return;
  try {
    const stored: StoredSession = { ...session, savedAt: Date.now() };
    store.setItem(STORAGE_KEY, JSON.stringify(stored));
  } catch {
    // Penyimpanan penuh atau ditolak browser; sesi tetap berjalan di memori.
  }
}

export function loadAuthSession(): AuthSession | null {
  const store = storage();
  if (!store) return null;
  try {
    const raw = store.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as unknown;
    if (!isValidSession(parsed)) return null;
    if (Date.now() - parsed.savedAt > MAX_AGE_MS) {
      store.removeItem(STORAGE_KEY);
      return null;
    }
    return { user: parsed.user, token: parsed.token };
  } catch {
    return null;
  }
}

export function clearAuthSession(): void {
  const store = storage();
  if (!store) return;
  try {
    store.removeItem(STORAGE_KEY);
  } catch {
    // Tidak ada yang perlu ditangani bila penghapusan gagal.
  }
}
