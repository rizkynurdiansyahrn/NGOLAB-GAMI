// Aturan poin game (sisi aplikasi):
// - Maksimal 10 poin per judul game per hari.
// - Maksimal 50 poin total per hari untuk semua game digabung.
// - Saat limit tercapai, game TETAP bisa dimainkan, hanya tidak
//   menghasilkan poin sampai reset hari berikutnya.
// Modul bebas dependensi agar bisa diuji langsung di Node.
//
// Catatan: kuota disimpan di perangkat (pola sama seperti Gami-Study).
// Untuk anti-curang penuh, validasi batas ini nanti perlu dipindah ke
// server PointLab (dihitung dari ledger loyalty_transactions).

export const GAME_POINTS_PER_DAY = 10;
export const DAILY_POINTS_LIMIT = 50;

export interface GamePointsBudget {
  /** Tanggal lokal YYYY-MM-DD; budget direset jika beda hari. */
  date: string;
  /** Poin yang sudah didapat per judul game hari ini. */
  perGame: Record<string, number>;
  /** Total poin semua game hari ini. */
  total: number;
}

export type CapReason = "ok" | "daily" | "game";

export interface AwardDecision {
  /** Poin yang boleh dikirim ke server (0 jika kena cap). */
  points: number;
  reason: CapReason;
}

export function todayKey(now: Date = new Date()): string {
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function gamePointsBudgetKey(userId: string | null): string {
  return `gami_game_points_${userId ?? "guest"}`;
}

export function emptyBudget(today: string = todayKey()): GamePointsBudget {
  return { date: today, perGame: {}, total: 0 };
}

// Budget dari localStorage: apa pun bentuk tak validnya dianggap budget kosong.
export function parseBudget(value: unknown, today: string = todayKey()): GamePointsBudget {
  if (!value || typeof value !== "object") return emptyBudget(today);
  const data = value as Record<string, unknown>;
  if (data.date !== today) return emptyBudget(today);
  const perGame: Record<string, number> = {};
  if (data.perGame && typeof data.perGame === "object") {
    for (const [gameId, points] of Object.entries(data.perGame as Record<string, unknown>)) {
      const number = Number(points);
      if (Number.isFinite(number) && number > 0) perGame[gameId] = Math.floor(number);
    }
  }
  const total = Number(data.total);
  return {
    date: today,
    perGame,
    total: Number.isFinite(total) && total > 0 ? Math.floor(total) : 0,
  };
}

export function pointsEarnedForGame(budget: GamePointsBudget, gameId: string): number {
  return budget.perGame[gameId] ?? 0;
}

export function remainingForGame(budget: GamePointsBudget, gameId: string): number {
  return Math.max(0, GAME_POINTS_PER_DAY - pointsEarnedForGame(budget, gameId));
}

export function remainingDaily(budget: GamePointsBudget): number {
  return Math.max(0, DAILY_POINTS_LIMIT - budget.total);
}

// Hitung berapa poin yang boleh didapat untuk satu sesi selesai.
export function decideAward(budget: GamePointsBudget, gameId: string, rawPoints: number): AwardDecision {
  const remainingDailyPoints = remainingDaily(budget);
  if (remainingDailyPoints <= 0) return { points: 0, reason: "daily" };
  const remainingGamePoints = remainingForGame(budget, gameId);
  if (remainingGamePoints <= 0) return { points: 0, reason: "game" };
  const requested = Number.isFinite(rawPoints) && rawPoints > 0 ? Math.floor(rawPoints) : 0;
  if (requested <= 0) return { points: 0, reason: "game" };
  const points = Math.min(requested, remainingGamePoints, remainingDailyPoints);
  if (points <= 0) return { points: 0, reason: "game" };
  return { points, reason: "ok" };
}

// Catat kuota HANYA setelah server mengonfirmasi earn berhasil,
// supaya kegagalan jaringan tidak membakar kuota pengguna.
export function recordAward(budget: GamePointsBudget, gameId: string, points: number): GamePointsBudget {
  const awarded = Number.isFinite(points) && points > 0 ? Math.floor(points) : 0;
  if (awarded <= 0) return budget;
  return {
    date: budget.date,
    perGame: { ...budget.perGame, [gameId]: pointsEarnedForGame(budget, gameId) + awarded },
    total: budget.total + awarded,
  };
}

export function capMessage(reason: CapReason): string {
  if (reason === "daily") {
    return `Limit poin harian (${DAILY_POINTS_LIMIT}) sudah tercapai. Game tetap bisa dimainkan, poin kembali besok.`;
  }
  return `Poin game ini sudah maksimal (${GAME_POINTS_PER_DAY}) untuk hari ini. Coba game lain atau main lagi besok.`;
}
