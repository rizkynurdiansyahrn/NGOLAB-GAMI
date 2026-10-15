// Uji klien PointLab (src/lib/pointlab.ts) terhadap server tiruan yang
// mengimplementasikan kontrak NYATA PointLab (terverifikasi live 14 Okt 2026):
//   GET  /api/members/{id}/points, GET /api/rewards {promos},
//   GET  /api/rewards/my {vouchers}, POST /api/rewards/{id}/redeem,
//   earn: /loyalty/points/earn (404) lalu fallback /points/earn.
// Jalankan dari root repo: npx tsx test-pointlab.ts
import http from "node:http";
import {
  EARN_NOT_AVAILABLE,
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
const notFound = (method: string, path: string) => ({
  error: "Not Found",
  message: `Endpoint API ${method} ${path} tidak ditemukan pada server PointLab.`,
});

const server = http.createServer((req, res) => {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  const send = (status: number, payload: unknown) => {
    res.writeHead(status, { "Content-Type": "application/json" });
    res.end(JSON.stringify(payload));
  };
  const readBody = (): Promise<unknown> =>
    new Promise((resolve) => {
      let raw = "";
      req.on("data", (chunk) => { raw += String(chunk); });
      req.on("end", () => {
        try { resolve(raw ? JSON.parse(raw) : {}); } catch { resolve({}); }
      });
    });

  if (req.method === "GET" && url.pathname === "/api/rewards") {
    send(200, {
      promos: [
        { id: "cp-1", title: "Diskon 20% Ayam Bakar", desc: "ayam bakar", pointsRequired: 200, coin_cost: 200, validUntil: "2099-06-28", category: "Semua", code: "PROMO-cp-1", image_url: "/uploads/promos/cp-1.jpeg" },
        { id: "cp-2", title: "Beli 1 Gratis 1", pointsRequired: 400, validUntil: "2099-06-24", code: "PROMO-cp-2" },
        { id: "cp-3", title: "Promo kedaluwarsa", pointsRequired: 100, validUntil: "2026-01-01", code: "PROMO-cp-3" },
        { id: "cp-4", title: "Tanpa harga poin", validUntil: "2099-01-01" },
        { id: "cp-5", title: "Harga snake_case", points_required: 250, validUntil: "2099-01-01" },
      ],
    });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/members/mem-1/points") {
    send(200, { memberId: "mem-1", points: balance, coin_balance: balance, totalPoints: 8450, total_points: 8450, tier: "Study Buddy" });
    return;
  }

  if (req.method === "GET" && url.pathname === "/api/rewards/my") {
    send(200, {
      vouchers: [
        { id: "vcr-1", userId: "mem-1", promoId: "cp-1", title: "Diskon 20% Ayam Bakar", code: "PROMO-cp-1-AB12", voucher_code: "PROMO-cp-1-AB12", pointsSpent: 200, status: "unused", expiresAt: "2099-01-01" },
        { id: "vcr-2", title: "Tanpa kode", status: "unused" },
      ],
      rewards: [],
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/rewards/cp-1/redeem") {
    void readBody();
    const key = String(req.headers["idempotency-key"] ?? "");
    if (!key) {
      send(400, { error: "Idempotency-Key wajib disertakan." });
      return;
    }
    if (balance < 200) {
      send(400, { error: `Saldo poin Anda (${balance}) tidak mencukupi untuk menukar voucher ini (200 poin).` });
      return;
    }
    balance -= 200;
    send(200, {
      message: "Penukaran poin berhasil!",
      voucher: {
        id: "vcr-3",
        userId: "mem-1",
        promoId: "cp-1",
        title: "Diskon 20% Ayam Bakar",
        code: "PROMO-cp-1-XY99",
        voucher_code: "PROMO-cp-1-XY99",
        pointsSpent: 200,
        status: "unused",
        expiresAt: "2099-01-01",
      },
      remainingPoints: balance,
      current_balance: balance,
    });
    return;
  }

  if (req.method === "POST" && url.pathname === "/api/rewards/cp-mahal/redeem") {
    void readBody();
    send(400, { error: `Saldo poin Anda (${balance}) tidak mencukupi untuk menukar voucher ini (5000 poin).` });
    return;
  }

  // Earn: path kontrak terdokumentasi 404 (belum di-deploy), path pola MVC jalan.
  if (req.method === "POST" && url.pathname === "/api/members/mem-1/loyalty/points/earn") {
    send(404, notFound(req.method ?? "GET", url.pathname));
    return;
  }
  if (req.method === "POST" && url.pathname === "/api/members/mem-1/points/earn") {
    void readBody().then((body) => {
      const key = String(req.headers["idempotency-key"] ?? "");
      const previous = earnStore.get(key);
      if (previous) {
        if (JSON.stringify(previous.body) === JSON.stringify(body)) {
          send(200, { message: "Poin berhasil ditambahkan.", ...(previous.result as object) });
          return;
        }
        send(409, { success: false, error: { code: "IDEMPOTENCY_CONFLICT", message: "The idempotency key was already used for another request." } });
        return;
      }
      const result = { transactionId: "pl-tx-0001", memberId: "mem-1", points: (body as { points: number }).points, current_balance: balance + (body as { points: number }).points };
      earnStore.set(key, { body, result });
      send(201, { message: "Poin berhasil ditambahkan.", ...result });
    });
    return;
  }

  send(404, notFound(req.method ?? "GET", url.pathname));
});

async function main() {
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const baseUrl = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  console.log(`Server tiruan kontrak nyata di ${baseUrl}\n`);

  console.log("[1] Katalog hadiah (GET /api/rewards -> {promos})");
  const rewards = await listRewards(undefined, baseUrl);
  check("hanya promo aktif & belum kedaluwarsa & berharga yang lolos", rewards.length === 3, rewards.map((r) => r.id));
  check("harga resmi pointsRequired/coin_cost terbaca", rewards[0]?.pointsCost === 200, rewards[0]);
  check("fallback points_required snake_case terbaca", rewards[2]?.pointsCost === 250, rewards[2]);
  check("title dipetakan ke name + desc ke description", rewards[0]?.name === "Diskon 20% Ayam Bakar" && rewards[0]?.description === "ayam bakar");
  check("promo kedaluwarsa dibuang", !rewards.some((r) => r.id === "cp-3"));

  console.log("[2] Saldo (GET /api/members/{id}/points)");
  const saldo = await getLoyaltyBalance("mem-1", "token-abc", undefined, baseUrl);
  check("points terbaca sebagai currentPoints", saldo?.currentPoints === 1250, saldo);
  check("memberId mengikuti respons server", saldo?.memberId === "mem-1");

  console.log("[3] Earn (path kontrak 404 -> fallback path MVC)");
  const sessionId = createGameSessionId("ngolab-catch", new Date("2026-10-11T10:00:00.000Z"));
  check("session id memuat id game & unik", sessionId.startsWith("gammi-game-ngolab-catch-"));
  const earnRequest = {
    points: 10,
    source: "GAMIFICATION",
    referenceType: "GAME_SESSION",
    referenceId: sessionId,
    description: "Menyelesaikan target Ngolab Catch",
    idempotencyKey: sessionId,
  };
  const earnResult = await earnPoints("mem-1", "token-abc", earnRequest, undefined, baseUrl);
  check("earn sukses lewat path fallback", earnResult?.transactionId === "pl-tx-0001", earnResult);
  check("saldo terbaru dari earn terbaca", earnResult?.currentPoints === 1260, earnResult?.currentPoints);

  const earnUlang = await earnPoints("mem-1", "token-abc", earnRequest, undefined, baseUrl);
  check("request sama + key sama = hasil idempoten", earnUlang?.transactionId === earnResult?.transactionId);

  let conflictError: unknown;
  try {
    await earnPoints("mem-1", "token-abc", { ...earnRequest, points: 999 }, undefined, baseUrl);
  } catch (error) {
    conflictError = error;
  }
  check("key sama + payload beda = IDEMPOTENCY_CONFLICT", conflictError instanceof LoyaltyError && conflictError.code === "IDEMPOTENCY_CONFLICT");
  check("pesan konflik ramah pengguna", conflictError instanceof Error && conflictError.message.includes("diproses dengan data berbeda"));

  console.log("[3b] Earn untuk member tanpa endpoint (dua path 404)");
  let unavailable: unknown;
  try {
    await earnPoints("mem-x", "token-abc", earnRequest, undefined, baseUrl);
  } catch (error) {
    unavailable = error;
  }
  check(
    "endpoint earn belum ada = EARN_NOT_AVAILABLE",
    unavailable instanceof LoyaltyError && unavailable.code === EARN_NOT_AVAILABLE,
    unavailable instanceof Error ? unavailable.message : unavailable,
  );
  check(
    "pesan earn belum aktif jujur ke pengguna",
    unavailable instanceof Error && unavailable.message.includes("belum aktif"),
    unavailable instanceof Error ? unavailable.message : unavailable,
  );

  console.log("[4] Voucher saya (GET /api/rewards/my -> {vouchers})");
  const vouchers = await listRedemptions("mem-1", "token-abc", undefined, baseUrl);
  check("voucher valid terbaca, yang tanpa kode dibuang", vouchers.length === 1 && vouchers[0]?.redemptionCode === "PROMO-cp-1-AB12", vouchers);
  check("judul promo jadi nama hadiah", vouchers[0]?.rewardName === "Diskon 20% Ayam Bakar");

  console.log("[5] Redeem (POST /api/rewards/{id}/redeem)");
  const key = createIdempotencyKey();
  check("idempotency key terbentuk", /^[0-9a-f-]{36}$/.test(key), key);
  const redeemed = await redeemReward("cp-1", "token-abc", key, undefined, baseUrl);
  check("redeem sukses + kode voucher dari objek voucher", redeemed?.redemptionCode === "PROMO-cp-1-XY99", redeemed);
  check("status voucher terbaca (UNUSED)", redeemed?.status === "UNUSED", redeemed?.status);
  check("sisa poin terbaru terbaca", redeemed?.remainingPoints === 1050, redeemed?.remainingPoints);

  let insufficient: unknown;
  try {
    await redeemReward("cp-mahal", "token-abc", createIdempotencyKey(), undefined, baseUrl);
  } catch (error) {
    insufficient = error;
  }
  check("poin kurang = pesan saldo dari server diteruskan", insufficient instanceof LoyaltyError && insufficient.status === 400 && insufficient.message.includes("tidak mencukupi"), insufficient instanceof Error ? insufficient.message : insufficient);

  console.log("[6] Gangguan layanan");
  let serverDown: unknown;
  try {
    await getLoyaltyBalance("mem-1", "token-abc", undefined, "http://127.0.0.1:1");
  } catch (error) {
    serverDown = error;
  }
  check("layanan tak terjangkau = pesan koneksi", serverDown instanceof LoyaltyError && serverDown.message.includes("belum dapat dihubungi"));

  server.close();
  console.log(`\nTotal: ${passed} lulus, ${failed} gagal`);
  process.exit(failed === 0 ? 0 : 1);
}

void main();
