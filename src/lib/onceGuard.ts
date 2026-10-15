/**
 * Penjaga pemanggilan ganda (once guard) untuk evaluasi sesi game.
 *
 * Satu sesi permainan bisa dipicu dari beberapa jalur sekaligus — game over
 * alami, tombol keluar di dalam game, dan tombol close di header container.
 * Tanpa penjaga, `finishSession` bisa berjalan dua kali dan mengirim dua
 * request earn poin (dengan idempotency key berbeda) ke layanan loyalty.
 *
 * Modul ini sengaja murni (tanpa DOM/localStorage) supaya bisa dites dengan
 * skrip standalone seperti modul src/lib lainnya. Jalankan dari root repo:
 *   npx tsx test-once-guard.ts
 */

export interface OnceGuard {
  /** Apakah sesi sudah pernah diklaim (diproses atau sedang diproses). */
  isClaimed(): boolean;
  /**
   * Coba klaim sesi ini.
   * @returns token unik (id sesi) bila berhasil, atau null bila sesi sudah
   *          pernah diklaim sebelumnya — pemanggil harus berhenti.
   */
  claim(): string | null;
  /** Bebaskan penjaga untuk sesi baru (mis. game berikutnya). */
  reset(): void;
}

/**
 * @param createToken fungsi pembuat id unik (mis. createGameSessionId).
 */
export function createOnceGuard(createToken: () => string): OnceGuard {
  let claimedToken: string | null = null;

  return {
    isClaimed() {
      return claimedToken !== null;
    },
    claim() {
      if (claimedToken !== null) return null;
      const token = createToken();
      claimedToken = token;
      return token;
    },
    reset() {
      claimedToken = null;
    },
  };
}
