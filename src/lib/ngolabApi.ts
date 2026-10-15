// Klien API publik Ngolab (layanan GeastEats / backend_ngolab) untuk Ngolab-Gami.
// Semua fungsi mengembalikan null (bukan throw) ketika request gagal, jaringan
// mati, server bukan 2xx, atau bentuk respons tidak sesuai — UI lalu memakai
// fallback. Base URL mengikuti pola src/lib/api.ts: proxy /membership-api di
// development, URL remote langsung di produksi.
import { API_BASE_URL } from "./api";
import {
  parseCoinPromos,
  parseLeaderboard,
  parseMenuCatalog,
  parseQueueStatus,
  type CoinPromo,
  type LeaderboardEntry,
  type MenuItem,
  type QueueStatus,
} from "./ngolabContract";

const DEFAULT_TIMEOUT_MS = 10_000;

interface RequestOptions {
  signal?: AbortSignal;
  /** Base URL alternatif (dipakai pengujian); bawaan API membership. */
  baseUrl?: string;
  timeoutMs?: number;
}

/**
 * GET JSON dengan timeout. Mengembalikan null untuk SEMUA kegagalan:
 * jaringan mati, timeout, dibatalkan caller, status non-2xx, atau JSON rusak.
 */
async function fetchJson(path: string, options: RequestOptions = {}): Promise<unknown | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const onCallerAbort = () => controller.abort();
  options.signal?.addEventListener("abort", onCallerAbort, { once: true });

  try {
    const response = await fetch((options.baseUrl ?? API_BASE_URL) + path, {
      method: "GET",
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return null;
    const payload: unknown = await response.json().catch(() => null);
    return payload;
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
    options.signal?.removeEventListener("abort", onCallerAbort);
  }
}

/** Papan peringkat koin: GET /api/leaderboard (publik). */
export async function fetchLeaderboard(signal?: AbortSignal, baseUrl?: string): Promise<LeaderboardEntry[] | null> {
  return parseLeaderboard(await fetchJson("/api/leaderboard", { signal, baseUrl }));
}

/** Katalog menu: GET /api/menu (publik). */
export async function fetchMenuCatalog(signal?: AbortSignal, baseUrl?: string): Promise<MenuItem[] | null> {
  return parseMenuCatalog(await fetchJson("/api/menu", { signal, baseUrl }));
}

/** Katalog promo tukar koin: GET /api/coin-promos (publik). */
export async function fetchCoinPromos(signal?: AbortSignal, baseUrl?: string): Promise<CoinPromo[] | null> {
  return parseCoinPromos(await fetchJson("/api/coin-promos", { signal, baseUrl }));
}

/** Status antrian dapur: GET /api/orders/queue-status (publik). */
export async function fetchQueueStatus(signal?: AbortSignal, baseUrl?: string): Promise<QueueStatus | null> {
  return parseQueueStatus(await fetchJson("/api/orders/queue-status", { signal, baseUrl }));
}
