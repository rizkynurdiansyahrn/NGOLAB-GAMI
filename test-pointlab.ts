// Uji klien PointLab (src/lib/pointlab.ts) terhadap server tiruan yang
// mengimplementasikan kontrak Membership & Loyalty API.
// Jalankan dari root repo: npx tsx test-pointlab.ts
import http from "node:http";
import {
  LoyaltyError,
  createGameSessionId,
  createIdempotencyKey,
  earnPoints,
  getLoyaltyBalance,
  listRedemptions,
  listRewards,
  redeemReward,
} from "./src/lib/pointlab";

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

const earnStore = new Map<string, { body: unknown; result: unknown }>();
let balance = 1250;

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  const send = (status: number, payload: unknown) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(payload));
  };

  if (req.method === "GET" && url.pathname === "/api/rewards") {
    send(200, {
      success: true,
      data: [
        { id: "rwd-001", code: "DISC50", name: "Diskon Rp5.000", description: "Voucher diskon", pointsCost: 500, stock: 20, status: "ACTIVE", validUntil: "2026-10-31T23:59:59+07:00" },
        { id: "rwd-002", name: "Hadiah nonaktif", pointsCost: 100, stock: 5, status: "INACTIVE" },
        { id: "rwd-003", name: "Hadiah habis", pointsCost: 100, stock: 0, status: "ACTIVE" },
        { id: "rwd-004", name: "Tanpa harga poin", stock: 5, status: "ACTIVE" },
        { id: "rwd-005", name: "Pakai nama DB", points_required: 250, stock: 3, status: "ACTIVE" },
      ],
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/members/mem-1/loyalty/balance") {
    send(200, { success: true, data: { memberId: "mem-1", currentPoints: balance } });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/members/mem-1/loyalty/points/earn") {
    const key = String(req.headers["idempotency-key"] ?? "");
    let body: unknown;
    req.on("data", (chunk) => { body = JSON.parse(String(chunk)); });
    req.on("end", () => {
      const previous = earnStore.get(key);
      const sameRequest = previous && JSON.stringify(previous.body) === JSON.stringify(body);
      if (sameRequest) {
        send(200, { success: true, data: previous.result });
        return;
      }
      if (previous) {
        send(409, { success: false, error: { code: "IDEMPOTENCY_CONFLICT", message: "The idempotency key was already used for another request." } });
        return;
      }
      const result = { transactionId: "ltx-20261008-000001", memberId: "mem-1", transactionType: "EARN", points: (body as { points: number }).points, currentPoints: 1350, referenceType: (body as { referenceType: string }).referenceType, referenceId: (body as { referenceId: string }).referenceId };
      earnStore.set(key, { body, result });
      send(201, { success: true, data: result });
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/members/mem-1/redemptions") {
    send(200, {
      success: true,
      data: [
        { redemptionId: "red-001", rewardId: "rwd-001", rewardName: "Diskon Rp5.000", pointsUsed: 500, redemptionCode: "NG-8X2K91", status: "COMPLETED", redeemedAt: "2026-10-08T18:30:00+07:00" },
        { redemptionId: "red-002", rewardName: "Gratis Kopi", redemptionCode: "NG-7QQ123", status: "COMPLETED" },
      ],
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/members/mem-1/rewards/rwd-001/redeem") {
    const key = String(req.headers["idempotency-key"] ?? "");
    if (!key) {
      send(400, { success: false, error: { code: "MISSING_IDEMPOTENCY_KEY", message: "Idempotency-Key header is required." } });
      return;
    }
    if (req.headers.authorization === "Bearer token-low") balance = 200;
    if (balance < 500) {
      send(409, { success: false, error: { code: "INSUFFICIENT_POINTS", message: "Insufficient points.", details: { requiredPoints: 500, currentPoints: balance } } });
      return;
    }
    balance -= 500;
    send(201, {
      success: true,
      data: { redemptionId: "red-20261008-000001", rewardId: "rwd-001", rewardName: "Diskon Rp5.000", pointsUsed: 500, remainingPoints: balance, redemptionCode: "NG-8X2K91", status: "COMPLETED", expiresAt: "2026-10-31T23:59:59+07:00", redeemedAt: "2026-10-08T19:10:00+07:00" },
    });
    return;
  }

  send(404, { success: false, error: { code: "NOT_FOUND", message: "Route not found." } });
});

async function main() {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const baseUrl = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  console.log(`Server tiruan kontrak di ${baseUrl}\n`);

  console.log("[1] Katalog hadiah");
  const rewards = await listRewards(undefined, baseUrl);
  check("hanya hadiah ACTIVE & stok ada yang lolos", rewards.length === 2, rewards.map((r) => r.id));
  check("field harga resmi pointsCost terbaca", rewards[0]?.pointsCost === 500);
  check("fallback points_required dari DB terbaca", rewards[1]?.pointsCost === 250);

  console.log("[2] Saldo resmi");
  const saldo = await getLoyaltyBalance("mem-1", "token-abc", undefined, baseUrl);
  check("currentPoints terbaca", saldo?.currentPoints === 1250, saldo);

  console.log("[3] Earn points");
  const sessionId = createGameSessionId("ngolab-catch", new Date("2026-10-11T10:00:00.000Z"));
  check("session id memuat id game & unik", sessionId.startsWith("gammi-game-ngolab-catch-"));
  const earnRequest = {
    points: 100,
    source: "GAMIFICATION",
    referenceType: "GAME_SESSION",
    referenceId: sessionId,
    description: "Bermain game Ngolab Catch",
    idempotencyKey: sessionId,
  };
  const earnResult = await earnPoints("mem-1", "token-abc", earnRequest, undefined, baseUrl);
  check("earn sukses mengembalikan transaksi", earnResult?.transactionId === "ltx-20261008-000001", earnResult);
  check("saldo terbaru dari earn terbaca", earnResult?.currentPoints === 1350);

  const earnUlang = await earnPoints("mem-1", "token-abc", earnRequest, undefined, baseUrl);
  check("request sama + key sama = hasil idempoten", earnUlang?.transactionId === earnResult?.transactionId);

  let conflictError: unknown;
  try {
    await earnPoints("mem-1", "token-abc", { ...earnRequest, points: 999 }, undefined, baseUrl);
  } catch (error) {
    conflictError = error;
  }
  check("key sama + payload beda = IDEMPOTENCY_CONFLICT", conflictError instanceof LoyaltyError && conflictError.code === "IDEMPOTENCY_CONFLICT", conflictError instanceof Error ? conflictError.message : conflictError);
  check("pesan konflik ramah pengguna", conflictError instanceof Error && conflictError.message.includes("diproses dengan data berbeda"));

  console.log("[4] Riwayat penukaran");
  const history = await listRedemptions("mem-1", "token-abc", undefined, baseUrl);
  check("riwayat lengkap & terurut", history.length === 2 && history[0]?.redemptionCode === "NG-8X2K91", history);

  console.log("[5] Redeem");
  const key = createIdempotencyKey();
  check("idempotency key terbentuk", /^[0-9a-f-]{36}$/.test(key), key);
  const redeemed = await redeemReward("mem-1", "rwd-001", "token-abc", key, undefined, baseUrl);
  check("redeem sukses + kode voucher", redeemed?.redemptionCode === "NG-8X2K91" && redeemed?.status === "COMPLETED", redeemed);
  check("sisa poin terbaru terbaca", redeemed?.remainingPoints === 750, redeemed?.remainingPoints);

  let insufficient: unknown;
  try {
    await redeemReward("mem-1", "rwd-001", "token-low", createIdempotencyKey(), undefined, baseUrl);
  } catch (error) {
    insufficient = error;
  }
  check("poin kurang = INSUFFICIENT_POINTS", insufficient instanceof LoyaltyError && insufficient.code === "INSUFFICIENT_POINTS");
  check("pesan poin kurang ramah pengguna", insufficient instanceof Error && insufficient.message === "Poin kamu belum cukup untuk menukarkan hadiah ini.");

  console.log("[6] Gangguan layanan");
  let serverDown: unknown;
  try {
    await getLoyaltyBalance("mem-1", "token-abc", undefined, "http://127.0.0.1:1");
  } catch (error) {
    serverDown = error;
  }
  check("layanan tak terjangkau = pesan koneksi", serverDown instanceof LoyaltyError && serverDown.message.includes("belum dapat dihubungi"), serverDown instanceof Error ? serverDown.message : serverDown);

  server.close();
  console.log(`\nTotal: ${passed} lulus, ${failed} gagal`);
  process.exit(failed === 0 ? 0 : 1);
}

void main();
