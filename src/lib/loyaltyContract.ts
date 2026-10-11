// Kontrak resmi Membership & Loyalty API (PointLab).
// Modul ini SENGAJA bebas dependensi agar bisa diuji langsung di Node/tsx.
// Aturan utama diambil dari dokumen kontrak:
// - Coin lama (coin_balance, /api/users/{id}/earn-coins) tidak dipakai lagi.
// - Saldo resmi: loyalty_accounts.current_points.
// - Harga hadiah resmi: pointsCost.
// - Duplicate request ditangani dengan Idempotency-Key.

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

export function buildBalancePath(memberId: string): string {
  return `/api/members/${encodeURIComponent(memberId)}/loyalty/balance`;
}

export function buildEarnPath(memberId: string): string {
  return `/api/members/${encodeURIComponent(memberId)}/loyalty/points/earn`;
}

export function buildRewardsPath(): string {
  return "/api/rewards";
}

export function buildRedemptionsPath(memberId: string): string {
  return `/api/members/${encodeURIComponent(memberId)}/redemptions`;
}

export function buildRedeemPath(memberId: string, rewardId: string): string {
  return `/api/members/${encodeURIComponent(memberId)}/rewards/${encodeURIComponent(rewardId)}/redeem`;
}

// Pesan ramah pengguna untuk kode error resmi (bagian I kontrak).
export function loyaltyErrorMessage(status: number, code: unknown, fallback: string): string {
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
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

// Hanya hadiah ACTIVE, harga poin valid, dan stok masih ada yang dikembalikan.
export function parseRewardItems(value: unknown): RewardItem[] {
  if (!Array.isArray(value)) return [];
  return value
    .flatMap((item) => {
      if (!item || typeof item !== "object") return [];
      const data = item as Record<string, unknown>;
      const id = textOr(typeof data.id === "number" ? String(data.id) : data.id);
      const name = textOr(data.name);
      const pointsCost = finiteNumber(data.pointsCost ?? data.points_required);
      if (!id || !name || pointsCost === null || pointsCost < 0) return [];
      return [
        {
          id,
          code: textOr(data.code),
          name,
          description: textOr(data.description),
          pointsCost,
          stock: finiteNumber(data.stock),
          status: textOr(data.status, "ACTIVE").toUpperCase(),
          validFrom: textOr(data.validFrom ?? data.valid_from) || null,
          validUntil: textOr(data.validUntil ?? data.valid_until) || null,
          image: imageSource(data.image) ?? imageSource(data.image_url),
        },
      ];
    })
    .filter((reward) => reward.status === "ACTIVE" && (reward.stock === null || reward.stock > 0));
}

export function parseLoyaltyBalance(value: unknown, fallbackMemberId: string): LoyaltyBalance | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const currentPoints = finiteNumber(data.currentPoints ?? data.current_points);
  if (currentPoints === null || currentPoints < 0) return null;
  const memberId = textOr(data.memberId ?? data.member_id) || fallbackMemberId;
  return { memberId, currentPoints };
}

export function parseEarnResult(value: unknown): EarnPointsResult | null {
  if (!value || typeof value !== "object") return null;
  const data = value as Record<string, unknown>;
  const points = finiteNumber(data.points);
  if (points === null) return null;
  return {
    transactionId: textOr(data.transactionId ?? data.transaction_id),
    memberId: textOr(data.memberId ?? data.member_id),
    points,
    currentPoints: finiteNumber(data.currentPoints ?? data.current_points),
  };
}

export function parseRedemptionList(value: unknown): RedemptionResult[] {
  if (!Array.isArray(value)) return [];
  return value.flatMap((item) => {
    if (!item || typeof item !== "object") return [];
    const data = item as Record<string, unknown>;
    const redemptionId = textOr(data.redemptionId ?? data.redemption_id);
    const redemptionCode = textOr(data.redemptionCode ?? data.redemption_code);
    if (!redemptionId || !redemptionCode) return [];
    return [
      {
        redemptionId,
        rewardName: textOr(data.rewardName ?? data.reward_name, "Hadiah"),
        redemptionCode,
        status: textOr(data.status, "UNKNOWN").toUpperCase(),
        remainingPoints: finiteNumber(data.remainingPoints ?? data.remaining_points),
      },
    ];
  });
}

// Hasil redeem satu objek punya bentuk sama dengan satu baris riwayat.
export function parseRedeemResult(value: unknown): RedemptionResult | null {
  if (!value || typeof value !== "object") return null;
  return parseRedemptionList([value])[0] ?? null;
}
