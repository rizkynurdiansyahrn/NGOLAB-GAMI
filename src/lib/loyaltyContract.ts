// Kontrak Membership & Loyalty API (PointLab) — DIVERIFIKASI LANGSUNG ke
// point.ngolab.online pada 14 Oktober 2026 (commit backend "API").
// Modul ini SENGAJA bebas dependensi agar bisa diuji langsung di Node/tsx.
//
// Kontrak NYATA yang terverifikasi live:
//   GET  /api/members/{memberId}            -> { member: {...} }
//   GET  /api/members/{memberId}/points     -> { memberId, points, coin_balance, totalPoints, tier }
//   GET  /api/rewards                       -> { promos: [...] }  (tanpa auth)
//   GET  /api/rewards/my                    -> { vouchers, rewards }  (Bearer)
//   POST /api/rewards/{rewardId}/redeem     -> { message, voucher, remainingPoints, current_balance }  (Bearer)
//   GET  /api/coins/balance | /api/coins/history (Bearer, per-user)
// memberId = user.id dari respons login/register (backend TIDAK memakai field "memberId").
//
// Endpoint earn poin BELUM ADA di server (semua varian path balas 404 JSON).
// Klien tetap mengirim ke path kontrak terdokumentasi; kalau 404, coba path
// pola MVC sekali lagi; kalau masih 404 -> EarnNotAvailable agar UI jujur.

export interface RewardItem {
  id: string;
  code: string;
  name: string;
  description: string;
  pointsCost: number;
  stock: number | null;
  status: string;
  validFrom: string | null;
  validUntil: string | null;
  image: string | null;
}

export interface LoyaltyBalance {
  memberId: string;
  currentPoints: number;
}

export interface EarnPointsRequest {
  points: number;
  source: string;
  referenceType: string;
  referenceId: string;
  description: string;
  idempotencyKey: string;
}

export interface EarnPointsResult {
  transactionId: string;
  memberId: string;
  points: number;
  currentPoints: number | null;
}

export interface RedemptionResult {
  redemptionId: string;
  rewardName: string;
  redemptionCode: string;
  status: string;
  remainingPoints: number | null;
}

/** Kode khusus klien: server belum menyediakan endpoint earn. */
export const EARN_NOT_AVAILABLE = "EARN_NOT_AVAILABLE";

export function createIdempotencyKey(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `idem-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

// ID sesi game unik: dipakai sebagai referenceId DAN idempotencyKey earn.
export function createGameSessionId(gameId: string, at: Date): string {
  const stamp = at.toISOString().replace(/[-:.TZ]/g, "");
  const random = Math.random().toString(36).slice(2, 8);
  return `gammi-game-${gameId}-${stamp}-${random}`;
}

// ── Path builder (kontrak nyata) ──────────────────────────────────────────
export function buildMemberPath(memberId: string): string {
  return `/api/members/${encodeURIComponent(memberId)}`;
}

/** Saldo poin resmi per-member (terverifikasi live). */
export function buildBalancePath(memberId: string): string {
  return `/api/members/${encodeURIComponent(memberId)}/points`;
}

/** Path earn sesuai kontrak yang diminta tim backend (belum di-deploy). */
export function buildEarnPath(memberId: string): string {
  return `/api/members/${encodeURIComponent(memberId)}/loyalty/points/earn`;
}

/** Path earn pola MVC (sesuai gaya endpoint /members/:id/points yang sudah ada). */
export function buildEarnAltPath(memberId: string): string {
  return `/api/members/${encodeURIComponent(memberId)}/points/earn`;
}

export function buildRewardsPath(): string {
  return "/api/rewards";
}

export function buildMyVouchersPath(): string {
  return "/api/rewards/my";
}

export function buildRedemptionsPath(memberId: string): string {
  // Voucher milik member dibaca lewat token; memberId dipakai sebagai label.
  void memberId;
  return buildMyVouchersPath();
}

/** Redeem nyata: identitas dari Bearer token, rewardId di path. */
export function buildRedeemPath(rewardId: string): string {
  return `/api/rewards/${encodeURIComponent(rewardId)}/redeem`;
}

// Pesan ramah pengguna untuk kode error resmi (bagian I kontrak).
export function loyaltyErrorMessage(status: number, code: unknown, fallback: string): string {
  if (code === EARN_NOT_AVAILABLE) {
    return "Penyimpanan poin ke server belum aktif. Poin tetap tercatat di perangkat ini.";
  }
  if (status === 409) {
    switch (code) {
      case "INSUFFICIENT_POINTS":
        return "Poin kamu belum cukup untuk menukarkan hadiah ini.";
      case "REWARD_OUT_OF_STOCK":
        return "Hadiah ini sudah habis.";
      case "REWARD_EXPIRED":
        return "Hadiah ini sudah tidak berlaku.";
      case "IDEMPOTENCY_CONFLICT":
        return "Permintaan ini sudah diproses dengan data berbeda. Muat ulang halaman lalu coba lagi.";
      default:
        return "Permintaan ditolak server. Silakan coba lagi.";
    }
  }
  if (status === 401 || status === 403) return "Sesi kamu berakhir. Silakan masuk kembali.";
  if (status === 404) return "Layanan poin atau data yang diminta tidak ditemukan.";
  if (status >= 500) return "Layanan poin sedang gangguan. Silakan coba lagi nanti.";
  return fallback;
}

function textOr(value: unknown, fallback = ""): string {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

function imageSource(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value && typeof value === "object" && "url" in value && typeof (value as { url: unknown }).url === "string") {
    const url = (value as { url: string }).url.trim();
    return url || null;
  }
  return null;
}

function finiteNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

/** Ambil array dari respons apa pun: array langsung atau {promos|rewards|vouchers|redemptions|history|data:[...]}. */
function arrayOf(value: unknown, keys: string[]): unknown[] {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") {
    const data = value as Record<string, unknown>;
    for (const key of keys) {
      if (Array.isArray(data[key])) return data[key] as unknown[];
    }
  }
  return [];
}

// Hanya hadiah aktif, harga poin valid, dan belum kedaluwarsa yang dikembalikan.
// `now` bisa disuntik untuk pengujian.
export function parseRewardItems(value: unknown, now: Date = new Date()): RewardItem[] {
  const items = arrayOf(value, ["promos", "rewards", "vouchers", "data"]);
  const today = now.getTime();
  return items
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const data = item as Record<string, unknown>;
      const id = textOr(typeof data.id === "number" ? String(data.id) : data.id);
      const name = textOr(data.name, textOr(data.title));
      const pointsCost = finiteNumber(
        data.pointsCost ?? data.points_required ?? data.pointsRequired ?? data.coin_cost ?? data.coinCost,
      );
      if (!id || !name || pointsCost === null || pointsCost < 0) return [];
      const validUntil = textOr(data.validUntil ?? data.valid_until) || null;
      // "30 Hari" atau teks non-tanggal dibiarkan lolos; tanggal masa lalu dibuang.
      const expiry = validUntil ? Date.parse(validUntil) : Number.NaN;
      if (Number.isFinite(expiry) && expiry < today) return [];
      const stock = finiteNumber(data.stock);
      return [
        {
          id,
          code: textOr(data.code),
          name,
          description: textOr(data.description, textOr(data.desc)),
          pointsCost,
          stock,
          status: textOr(data.status, "ACTIVE").toUpperCase(),
          validFrom: textOr(data.validFrom ?? data.valid_from) || null,
          validUntil,
          image: imageSource(data.image) ?? imageSource(data.image_url),
        },
      ];
    })
    .filter((reward) => reward.status === "ACTIVE" && (reward.stock === null || reward.stock > 0));
}

export function parseLoyaltyBalance(value: unknown, fallbackMemberId: string): LoyaltyBalance | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const currentPoints = finiteNumber(
    data.currentPoints ?? data.current_points ?? data.points ?? data.balance ?? data.coin_balance,
  );
  if (currentPoints === null || currentPoints < 0) return null;
  const memberId = textOr(data.memberId ?? data.member_id) || fallbackMemberId;
  return { memberId, currentPoints };
}

export function parseEarnResult(value: unknown): EarnPointsResult | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const points = finiteNumber(data.points ?? data.pointsAdded);
  if (points === null) return null;
  return {
    transactionId: textOr(data.transactionId ?? data.transaction_id ?? data.id),
    memberId: textOr(data.memberId ?? data.member_id),
    points,
    currentPoints: finiteNumber(data.currentPoints ?? data.current_points ?? data.current_balance ?? data.remainingPoints),
  };
}

export function parseRedemptionList(value: unknown): RedemptionResult[] {
  const items = arrayOf(value, ["vouchers", "redemptions", "rewards", "history", "data"]);
  return items.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const data = item as Record<string, unknown>;
    const redemptionId = textOr(data.redemptionId ?? data.redemption_id ?? data.id ?? data.voucherId);
    const redemptionCode = textOr(data.redemptionCode ?? data.redemption_code ?? data.code ?? data.voucher_code);
    if (!redemptionId || !redemptionCode) return [];
    return [
      {
        redemptionId,
        rewardName: textOr(data.rewardName ?? data.reward_name ?? data.title ?? data.name, "Hadiah"),
        redemptionCode,
        status: textOr(data.status, "UNKNOWN").toUpperCase(),
        remainingPoints: finiteNumber(data.remainingPoints ?? data.remaining_points ?? data.current_balance),
      },
    ];
  });
}

// Hasil redeem nyata: { message, voucher, remainingPoints, current_balance }.
export function parseRedeemResult(value: unknown): RedemptionResult | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  if (data.voucher && typeof data.voucher === "object") {
    const voucher = data.voucher as Record<string, unknown>;
    return parseRedemptionList([{ ...voucher, remainingPoints: data.remainingPoints ?? data.current_balance }])[0] ?? null;
  }
  return parseRedemptionList([data])[0] ?? null;
}
