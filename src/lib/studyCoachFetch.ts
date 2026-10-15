/**
 * fetch() helper yang tahan terhadap gangguan sesaat layanan RAG.
 *
 * Server Study Coach meneruskan setiap pertanyaan ke layanan RAG eksternal.
 * Layanan itu sesekali memutus permintaan yang lama (sekitar 40 detik) dengan
 * status 502/503, padahal pertanyaan yang sama berhasil saat dikirim ulang.
 * Helper ini hanya mencoba ulang kegagalan sesaat (koneksi terputus, timeout,
 * dan status 408/425/429/502/503/504) dan melaporkan setiap percobaan ulang
 * agar antarmuka dapat menampilkan progres. Kesalahan validasi, izin, dan
 * lainnya tidak diulang agar tidak membuang waktu pengguna.
 */

export interface RetryInfo {
  /** Nomor percobaan yang baru gagal (1 = percobaan pertama). */
  attempt: number;
  /** Total rencana percobaan. */
  attempts: number;
  /** Alasan singkat, misalnya "HTTP 502". */
  reason: string;
  /** Jeda sebelum percobaan berikutnya, dalam milidetik. */
  waitMs: number;
}

export interface FetchRetryOptions {
  /** Total percobaan termasuk yang pertama. Bawaan: 3. */
  attempts?: number;
  /** Batas waktu setiap percobaan, milidetik. Bawaan: 90_000. */
  timeoutMs?: number;
  /** Sinyal milik pemanggil; saat di-abort semua percobaan berhenti. */
  signal?: AbortSignal;
  /** Dipanggil di antara percobaan agar UI dapat memberi tahu pengguna. */
  onRetry?: (info: RetryInfo) => void;
}

const RETRYABLE_STATUSES = new Set([408, 425, 429, 502, 503, 504]);
const RETRY_WAITS_MS = [2_000, 6_000, 15_000];

/**
 * Header bawaan untuk permintaan Study Coach. Server menolak permintaan tanpa
 * token (header x-study-coach-token) ketika STUDY_COACH_TOKEN aktif di server,
 * sehingga kuota RAG berbayar tidak bisa dipakai orang lain.
 */
export function studyCoachHeaders(
  extra: Record<string, string> = {},
): Record<string, string> {
  const token = import.meta.env?.VITE_STUDY_COACH_TOKEN;
  return typeof token === "string" && token.trim()
    ? { ...extra, "x-study-coach-token": token.trim() }
    : extra;
}

function wait(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason);
      return;
    }
    const onAbort = () => {
      clearTimeout(timer);
      reject(signal?.reason);
    };
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve();
    }, ms);
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

export async function fetchWithRetry(
  input: RequestInfo | URL,
  init: RequestInit = {},
  options: FetchRetryOptions = {},
): Promise<Response> {
  const attempts = Math.max(1, options.attempts ?? 3);
  const timeoutMs = options.timeoutMs ?? 90_000;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    if (options.signal?.aborted) throw options.signal.reason;
    const isLast = attempt === attempts;
    const nextWaitMs = RETRY_WAITS_MS[attempt - 1] ?? 15_000;
    try {
      const response = await fetch(input, {
        ...init,
        signal: AbortSignal.any([
          ...(init.signal ? [init.signal] : []),
          ...(options.signal ? [options.signal] : []),
          AbortSignal.timeout(timeoutMs),
        ]),
      });
      if (response.ok || isLast) return response;
      if (!RETRYABLE_STATUSES.has(response.status)) return response;
      // Tubuh respons percobaan gagal tidak dibutuhkan; bebaskan koneksinya.
      await response.body?.cancel().catch(() => {});
      if (options.signal?.aborted) throw options.signal.reason;
      options.onRetry?.({
        attempt,
        attempts,
        reason: `HTTP ${response.status}`,
        waitMs: nextWaitMs,
      });
      await wait(nextWaitMs, options.signal);
    } catch (error) {
      if (isLast || options.signal?.aborted) throw error;
      // Hanya kesalahan jaringan sesaat dan timeout percobaan yang diulang.
      const retryable =
        error instanceof TypeError ||
        (error instanceof Error && error.name === "TimeoutError");
      if (!retryable) throw error;
      options.onRetry?.({
        attempt,
        attempts,
        reason: error instanceof Error ? error.name : "network",
        waitMs: nextWaitMs,
      });
      await wait(nextWaitMs, options.signal);
    }
  }
  // Loop di atas selalu return atau throw; baris ini hanya penjaga tipe.
  throw new DOMException("Permintaan tidak dapat diselesaikan.", "AbortError");
}
