// Uji aturan kuota poin game (10/game/hari, 50/hari total).
// Jalankan dari root repo: npx tsx test-game-points-budget.ts
import {
  DAILY_POINTS_LIMIT,
  GAME_POINTS_PER_DAY,
  capMessage,
  decideAward,
  emptyBudget,
  parseBudget,
  recordAward,
  remainingDaily,
  remainingForGame,
  todayKey,
} from "./src/lib/gamePointsBudget";

let passed = 0;
let failed = 0;

function check(label: string, condition: boolean, detail?: unknown) {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${label}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${label}${detail === undefined ? "" : ` -> ${JSON.stringify(detail)}`}`);
  }
}

const TODAY = "2026-10-11";

console.log("[1] Budget baru");
const fresh = emptyBudget(TODAY);
check("kuota game penuh", remainingForGame(fresh, "ngolab-catch") === GAME_POINTS_PER_DAY);
check("kuota harian penuh", remainingDaily(fresh) === DAILY_POINTS_LIMIT);
check("award pertama diizinkan", decideAward(fresh, "ngolab-catch", 25).points === GAME_POINTS_PER_DAY && decideAward(fresh, "ngolab-catch", 25).reason === "ok");

console.log("[2] Cap per game 10 poin/hari");
const afterOne = recordAward(fresh, "ngolab-catch", 10);
check("game catch tersisa 0", remainingForGame(afterOne, "ngolab-catch") === 0);
check("sesi kedua catch ditolak (reason game)", decideAward(afterOne, "ngolab-catch", 50).reason === "game" && decideAward(afterOne, "ngolab-catch", 50).points === 0);
check("game lain masih boleh", decideAward(afterOne, "ngolab-memory", 8).reason === "ok");
check("recordAward tidak mengubah budget lama", fresh.total === 0 && fresh.perGame["ngolab-catch"] === undefined);

console.log("[3] Cap harian 50 poin total");
let budget = emptyBudget(TODAY);
for (const game of ["g1", "g2", "g3", "g4", "g5"]) {
  budget = recordAward(budget, game, 10);
}
check("total 50 tercapai", budget.total === 50);
check("kuota harian 0", remainingDaily(budget) === 0);
check("game baru ditolak (reason daily)", decideAward(budget, "g6", 10).reason === "daily" && decideAward(budget, "g6", 10).points === 0);

console.log("[4] Pembatasan jumlah (poin mentah > sisa kuota)");
let partial = emptyBudget(TODAY);
partial = recordAward(partial, "g1", 8);
check("sisa game 2, minta 25 -> dapat 2", decideAward(partial, "g1", 25).points === 2);

console.log("[5] Reset harian & parsing penyimpanan");
check("budget tanggal lama direset", parseBudget({ date: "2026-10-10", perGame: { g1: 10 }, total: 50 }, TODAY).total === 0);
check("budget rusak dianggap kosong", parseBudget("bukan objek", TODAY).total === 0 && parseBudget(null, TODAY).perGame["g1"] === undefined);
check("budget valid terbaca", parseBudget({ date: TODAY, perGame: { g1: 5 }, total: 15 }, TODAY).total === 15);
check("nilai negatif/non-angka dibuang", parseBudget({ date: TODAY, perGame: { g1: -3, g2: "x" }, total: -1 }, TODAY).perGame.g1 === undefined);

console.log("[6] Pesan cap");
check("pesan cap harian menyebut 50", capMessage("daily").includes("50"));
check("pesan cap game menyebut 10", capMessage("game").includes("10"));
check("pesan menegaskan game tetap bisa main", capMessage("daily").includes("tetap bisa dimainkan"));

console.log("[7] Format tanggal lokal");
check("todayKey format YYYY-MM-DD", /^\d{4}-\d{2}-\d{2}$/.test(todayKey(new Date(2026, 9, 11))));
check("tanggal dipadded", todayKey(new Date(2026, 0, 5)) === "2026-01-05");

console.log(`\nTotal: ${passed} lulus, ${failed} gagal`);
process.exit(failed === 0 ? 0 : 1);
