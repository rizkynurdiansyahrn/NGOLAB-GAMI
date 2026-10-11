// Klien resmi Membership & Loyalty API (PointLab) untuk NgolabGammi.
// Semua endpoint mengikuti kontrak yang sudah dikunci:
//   GET  /api/members/{memberId}/loyalty/balance
//   POST /api/members/{memberId}/loyalty/points/earn
//   GET  /api/rewards
//   GET  /api/members/{memberId}/redemptions
//   POST /api/members/{memberId}/rewards/{rewardId}/redeem
// Kontrak coin lama (earn-coins, coin_balance) tidak digunakan lagi.
import { API_BASE_URL } from "./api";
import {
  buildBalancePath,
  buildEarnPath,
  buildRedeemPath,
  buildRedemptionsPath,
  buildRewardsPath,
  createIdempotencyKey,
  createGameSessionId,
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
  /** Base URL alternatif (dipakai untuk pengujian); bawaan API backend Membership. */
  baseUrl?: string;
}

async function loyaltyRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.token) headers.Authorization = `Bearer ${options.token}`;
  if (options.idempotencyKey) headers["Idempotency-Key"] = options.idempotencyKey;

  let response: Response;
  try {
    response = await fetch((options.baseUrl ?? API_BASE_URL) + path, {
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
    const fallback = typeof payload?.message === "string" && payload.message ? payload.message : "Permintaan ke layanan poin belum berhasil.";
    throw new LoyaltyError(loyaltyErrorMessage(response.status, code, fallback), response.status, typeof code === "string" ? code : null);
  }
  return (payload?.data ?? payload) as T;
}

/** Saldo resmi: loyalty_accounts.current_points. */
export async function getLoyaltyBalance(
  memberId: string,
  token: string | null,
  signal?: AbortSignal,
  baseUrl?: string,
): Promise<LoyaltyBalance | null> {
  const data = await loyaltyRequest<unknown>(buildBalancePath(memberId), { token, signal, baseUrl });
  return parseLoyaltyBalance(data, memberId);
}

/** Earn points resmi (menggantikan legacy earn-coins). */
export async function earnPoints(
  memberId: string,
  token: string | null,
  request: EarnPointsRequest,
  signal?: AbortSignal,
  baseUrl?: string,
): Promise<EarnPointsResult | null> {
  const data = await loyaltyRequest<unknown>(buildEarnPath(memberId), {
    method: "POST",
    token,
    body: request,
    signal,
    baseUrl,
  });
  return parseEarnResult(data);
}

/** Katalog hadiah (field harga resmi: pointsCost). */
export async function listRewards(signal?: AbortSignal, baseUrl?: string): Promise<RewardItem[]> {
  const data = await loyaltyRequest<unknown>(buildRewardsPath(), { signal, baseUrl });
  return parseRewardItems(data);
}

/** Riwayat penukaran hadiah milik member. */
export async function listRedemptions(
  memberId: string,
  token: string | null,
  signal?: AbortSignal,
  baseUrl?: string,
): Promise<RedemptionResult[]> {
  const data = await loyaltyRequest<unknown>(buildRedemptionsPath(memberId), { token, signal, baseUrl });
  return parseRedemptionList(data);
}

/** Tukar hadiah: server melakukan semuanya secara atomic. */
export async function redeemReward(
  memberId: string,
  rewardId: string,
  token: string | null,
  idempotencyKey: string,
  signal?: AbortSignal,
  baseUrl?: string,
): Promise<RedemptionResult | null> {
  const data = await loyaltyRequest<unknown>(buildRedeemPath(memberId, rewardId), {
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
