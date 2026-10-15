// Uji penjaga pemanggilan ganda (once guard) sesi game.
// Jalankan dari root repo: npx tsx test-once-guard.ts
import { createOnceGuard } from "./src/lib/onceGuard";

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

let counter = 0;
function makeGuard() {
  counter = 0;
  return createOnceGuard(() => `sess-${++counter}`);
}

// Sesi hanya bisa diklaim sekali meski dipicu dari banyak jalur.
const guard = makeGuard();
const first = guard.claim();
check("klaim pertama mengembalikan token", first === "sess-1", first);
check("isClaimed true setelah klaim", guard.isClaimed());
check("klaim kedua ditolak (null)", guard.claim() === null);
check("klaim ketiga ditolak (null)", guard.claim() === null);

// Token yang sama dikembalikan berulang kali setelah gagal klaim.
const guard2 = makeGuard();
check("guard baru token pertama", guard2.claim() === "sess-1");
check("pemanggil kedua tidak mendapat token baru", guard2.claim() === null);

// Reset membebaskan penjaga untuk sesi berikutnya.
guard2.reset();
check("reset mengosongkan klaim", !guard2.isClaimed());
check("setelah reset boleh klaim lagi", guard2.claim() === "sess-2", counter);

// Skenario nyata: game over alami lalu pemain tekan close.
const guard3 = makeGuard();
const fromGameOver = guard3.claim(); // game over alami
const fromClose = guard3.claim(); // tombol close header
check("game over + close hanya satu klaim", fromGameOver !== null && fromClose === null);

console.log(`\nTotal: ${passed} lulus, ${failed} gagal`);
if (failed > 0) process.exit(1);
