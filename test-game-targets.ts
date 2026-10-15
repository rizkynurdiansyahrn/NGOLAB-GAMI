// Uji target poin per game (target berbeda tiap game, poin biner 10/0).
// Jalankan dari root repo: npx tsx test-game-targets.ts
import {
  POINTS_PER_GAME_TARGET,
  getGameTarget,
  isTargetReached,
  pointsForScore,
} from "./src/lib/gameTargets";

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

console.log("[1] Poin biner: 10 kalau target tercapai, 0 kalau belum");
check("poin target = 10", POINTS_PER_GAME_TARGET === 10);
check("catch skor 150 -> 10 poin", pointsForScore(150, 'ngolab-catch') === 10);
check("catch skor 149 -> 0 poin", pointsForScore(149, 'ngolab-catch') === 0);
check("catch skor 0 (buka lalu close) -> 0 poin", pointsForScore(0, 'ngolab-catch') === 0);
check("catch skor 999 tetap 10 (bukan 99)", pointsForScore(999, 'ngolab-catch') === 10);

console.log("[2] Target berbeda tiap game");
check("quiz target 60", getGameTarget('ngolab-fitness-quiz').targetScore === 60);
check("memory target 50", getGameTarget('ngolab-memory').targetScore === 50);
check("traffic-escape target 100", getGameTarget('ngolab-traffic-escape').targetScore === 100);
check("neon-merge target 80", getGameTarget('ngolab-neon-merge').targetScore === 80);
check("glow-trail target 50", getGameTarget('ngolab-glow-trail').targetScore === 50);
check("semua game punya label target", [
  'ngolab-catch', 'ngolab-memory', 'ngolab-burger', 'ngolab-traffic-escape',
  'ngolab-fitness-quiz', 'ngolab-astro-drift', 'ngolab-beat-bounce',
  'ngolab-neon-merge', 'ngolab-glow-trail', 'ngolab-sky-swipe', 'ngolab-neon-slither',
].every((id) => getGameTarget(id).targetLabel.length > 0));

console.log("[3] Game tak dikenal pakai target bawaan 100");
check("default target 100", getGameTarget('game-yang-tidak-ada').targetScore === 100);
check("default: skor 100 -> 10 poin", pointsForScore(100, 'game-yang-tidak-ada') === 10);
check("default: skor 99 -> 0 poin", pointsForScore(99, 'game-yang-tidak-ada') === 0);

console.log("[4] Skor tidak valid tidak lolos target");
check("NaN -> belum tercapai", isTargetReached(NaN, 'ngolab-catch') === false);
check("Infinity -> tidak lolos (aman dari skor rusak)", isTargetReached(Infinity, 'ngolab-catch') === false);

console.log("[5] Skor persis di garis target dianggap tercapai");
check("quiz skor 60 pas", isTargetReached(60, 'ngolab-fitness-quiz'));
check("glow-trail skor 50 pas", isTargetReached(50, 'ngolab-glow-trail'));

console.log(`\nTotal: ${passed} lulus, ${failed} gagal`);
process.exit(failed === 0 ? 0 : 1);
