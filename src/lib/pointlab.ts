// Klien Membership & Loyalty API (PointLab) untuk NgolabGammi.
// Kontrak NYATA terverifikasi live 14 Oktober 2026 (lihat komentar lengkap di
// src/lib/loyaltyContract.ts). Perubahan penting dari kontrak asumsi lama:
//   - Base URL PointLab (bukan GeastEats): POINTLAB_API_BASE_URL di api.ts
//     (dev: proxy /pointlab-api; produksi: https://point.ngolab.online).
//   - Saldo: GET /api/members/{memberId}/points  -> { memberId, points, ... }
//   - Katalog: GET /api/rewards                  -> { promos: [...] }
//   - Voucher saya: GET /api/rewards/my (Bearer)
//   - Redeem: POST /api/rewards/{rewardId}/redeem (Bearer + Idempotency-Key)
//   - memberId = user.id dari respons login/register PointLab.
// Endpoint earn BELUM di-deploy server: klien mencoba path kontrak
// terdokumentasi, lalu path pola MVC; kalau dua-duanya 404 -> LoyaltyError
// ber-kode EARN_NOT_AVAILABLE (UI menampilkan "belum aktif", poin tetap
// tercatat lokal sesuai mekanisme kuota harian yang ada).
import { POINTLAB_API_BASE_URL } from "./api";
import {
  buildBalancePath,
  buildEarnAltPath,
  buildEarnPath,
  buildMyVouchersPath,
  buildRedeemPath,
  buildRewardsPath,
  createIdempotencyKey,
  createGameSessionId,
  EARN_NOT_AVAILABLE,
  loyaltyErrorMessage,
  parseEarnResult,
  parseLoyaltyBalance,
  parseRedeemResult,
  parseRedemptionList,
  parseRewardItems,
} from "./loyaltyContract";
import type {
  EarnPointsRequest,
  EarnPointsResult,
  LoyaltyBalance,
  RedemptionResult,
  RewardItem,
} from "./loyaltyContract";

export * from "./loyaltyContract";

export class LoyaltyError extends Error {
  status: number;
  code: string | null;

  constructor(message: string, status: number, code: string | null) {
    super(message);
    this.name = "LoyaltyError";
    this.status = status;
    this.code = code;
  }
}

interface RequestOptions {
  method?: "GET" | "POST";
  token?: string | null;
  body?: unknown;
  idempotencyKey?: string;
  signal?: AbortSignal;
  /** Base URL alternatif (dipakai untuk pengujian); bawaan server PointLab. */
  baseUrl?: string;
}

async function loyaltyRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;

  let response: Response;
  try {
    response = await fetch((options.baseUrl ?? POINTLAB_API_BASE_URL) + path, {
      method: options.method ?? "GET",
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      cache: "no-store",
      signal: options.signal,
    });
  } catch {
    throw new LoyaltyError("Layanan poin belum dapat dihubungi. Periksa koneksi lalu coba lagi.", 0, null);
  }

  const payload = await response.json().catch(() => null);
  if (!response.ok || payload?.success === false) {
    const code = payload?.error?.code ?? payload?.code;
    const fallback =
      (typeof payload?.message === "string" && payload.message && payload.message) ||
      (typeof payload?.error === "string" && payload.error && payload.error) ||
      "Permintaan ke layanan poin belum berhasil.";
    throw new LoyaltyError(loyaltyErrorMessage(response.status, code, fallback), response.status, typeof code === "string" ? code : null);
  }
  return (payload?.data ?? payload) as T;
}

/** Saldo poin resmi per-member: GET /api/members/{memberId}/points. */
export async function getLoyaltyBalance(
  memberId: string,
  token: string | null,
  signal?: AbortSignal,
  baseUrl?: string,
): Promise<LoyaltyBalance | null> {
  const data = await loyaltyRequest<unknown>(buildBalancePath(memberId), { token, signal, baseUrl });
  return parseLoyaltyBalance(data, memberId);
}

/**
 * Kirim poin hasil aktivitas ke server. Endpoint earn belum di-deploy:
 * coba path kontrak terdokumentasi, lalu path pola MVC. Kalau dua-duanya
 * 404, lempar EARN_NOT_AVAILABLE (bukan error misterius) supaya pemanggil
 * bisa menampilkan alasan yang jujur ke pengguna.
 */
export async function earnPoints(
  memberId: string,
  token: string | null,
  request: EarnPointsRequest,
  signal?: AbortSignal,
  baseUrl?: string,
): Promise<EarnPointsResult | null> {
  const options: RequestOptions = {
    method: "POST",
    token,
    body: request,
    idempotencyKey: request.idempotencyKey,
    signal,
    baseUrl,
  };
  try {
    const data = await loyaltyRequest<unknown>(buildEarnPath(memberId), options);
    return parseEarnResult(data);
  } catch (error) {
    if (!(error instanceof LoyaltyError) || error.status !== 404) throw error;
  }
  try {
    const data = await loyaltyRequest<unknown>(buildEarnAltPath(memberId), options);
    return parseEarnResult(data);
  } catch (error) {
    if (error instanceof LoyaltyError && error.status === 404) {
      throw new LoyaltyError(
        loyaltyErrorMessage(404, EARN_NOT_AVAILABLE, "Endpoint earn poin belum tersedia di server."),
        404,
        EARN_NOT_AVAILABLE,
      );
    }
    throw error;
  }
}

/** Katalog hadiah (harga resmi pointsCost; parser menerima bentuk {promos:[...]}). */
export async function listRewards(signal?: AbortSignal, baseUrl?: string): Promise<RewardItem[]> {
  const data = await loyaltyRequest<unknown>(buildRewardsPath(), { signal, baseUrl });
  return parseRewardItems(data);
}

/** Voucher milik member yang login (Bearer token). */
export async function listRedemptions(
  memberId: string,
  token: string | null,
  signal?: AbortSignal,
  baseUrl?: string,
): Promise<RedemptionResult[]> {
  void memberId; // identitas datang dari token, bukan path
  const data = await loyaltyRequest<unknown>(buildMyVouchersPath(), { token, signal, baseUrl });
  return parseRedemptionList(data);
}

/**
 * Tukar hadiah: server cek saldo, potong poin, terbitkan voucher.
 * Respons nyata: { message, voucher, remainingPoints, current_balance }.
 */
export async function redeemReward(
  rewardId: string,
  token: string | null,
  idempotencyKey: string,
  signal?: AbortSignal,
  baseUrl?: string,
): Promise<RedemptionResult | null> {
  const data = await loyaltyRequest<unknown>(buildRedeemPath(rewardId), {
    method: "POST",
    token,
    body: {},
    idempotencyKey,
    signal,
    baseUrl,
  });
  return parseRedeemResult(data);
}

export { createIdempotencyKey, createGameSessionId };
