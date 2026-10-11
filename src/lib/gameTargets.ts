// Target poin per game: setiap game punya target BERBEDA untuk mendapatkan
// 10 poin. Pemain yang menutup (close/keluar) atau game over SEBELUM target
// tercapai tidak mendapatkan poin; setelah target tercapai, sesi berakhir
// (close atau game over) tetap mendapatkan 10 poin — selama kuota harian
// (10 poin/game/hari, 50 poin/hari, lihat gamePointsBudget.ts) masih ada.

export const POINTS_PER_GAME_TARGET = 10;

export interface GameTarget {
  /** Skor minimum yang harus dicapai pemain dalam satu sesi. */
  targetScore: number;
  /** Penjelasan target untuk HUD game dan halaman detail. */
  targetLabel: string;
}

const GAME_TARGETS: Record<string, GameTarget> = {
  'ngolab-catch': { targetScore: 150, targetLabel: 'Tangkap 15 item' },
  'ngolab-memory': { targetScore: 50, targetLabel: 'Temukan 5 pasangan kartu' },
  'ngolab-burger': { targetScore: 100, targetLabel: 'Kumpulkan skor 100' },
  'ngolab-doodle-road': { targetScore: 100, targetLabel: 'Selesaikan level pertama' },
  'ngolab-fitness-quiz': { targetScore: 60, targetLabel: 'Jawab benar 6 dari 10 soal' },
  'ngolab-astro-drift': { targetScore: 100, targetLabel: 'Hantam 4 target' },
  'ngolab-beat-bounce': { targetScore: 100, targetLabel: 'Kumpulkan skor 100' },
  'ngolab-neon-merge': { targetScore: 80, targetLabel: 'Kumpulkan skor 80' },
  'ngolab-glow-trail': { targetScore: 50, targetLabel: 'Capai 5 acuan benar' },
  'ngolab-sky-swipe': { targetScore: 100, targetLabel: 'Kumpulkan skor 100' },
  'ngolab-neon-slither': { targetScore: 100, targetLabel: 'Kumpulkan skor 100' },
};

const DEFAULT_TARGET: GameTarget = { targetScore: 100, targetLabel: 'Kumpulkan skor 100' };

/** Target untuk sebuah game; game yang belum terdaftar pakai target bawaan. */
export function getGameTarget(gameId: string): GameTarget {
  return GAME_TARGETS[gameId] || DEFAULT_TARGET;
}

/** True kalau skor sudah memenuhi target game tersebut. */
export function isTargetReached(score: number, gameId: string): boolean {
  const target = getGameTarget(gameId).targetScore;
  return Number.isFinite(score) && score >= target;
}

/**
 * Poin yang layak diterima untuk sebuah sesi game: 10 kalau target tercapai,
 * 0 kalau belum. Angka ini masih harus dicek terhadap kuota harian
 * (`decideAward` di gamePointsBudget.ts) sebelum dikirim ke server.
 */
export function pointsForScore(score: number, gameId: string): number {
  return isTargetReached(score, gameId) ? POINTS_PER_GAME_TARGET : 0;
}
