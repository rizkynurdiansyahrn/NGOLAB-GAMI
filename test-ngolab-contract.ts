// Uji kontrak data publik Ngolab (GeastEats): parser defensif leaderboard,
// menu, promo koin, dan status antrian. Fixture di bawah diambil dari
// respons API produksi (curl geasteats.ngolab.online).
// Jalankan dari root repo: npx tsx test-ngolab-contract.ts
import {
  normalizeName,
  parseCoinPromos,
  parseLeaderboard,
  parseMenuCatalog,
  parseQueueStatus,
} from "./src/lib/ngolabContract";

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

console.log("[1] Leaderboard: GET /api/leaderboard");

const leaderboardFixture = [
  { rank: 1, name: "Ahmad Fauzi Fore Test", points: 1600, avatar: "https://picsum.photos/seed/user-1780648444622/100/100" },
  { rank: 2, name: "ahmad husen", points: 400, avatar: "https://picsum.photos/seed/607012400054/100/100" },
  { rank: 3, name: "ahamd", points: 130, avatar: "https://picsum.photos/seed/7049509454/100/100" },
];

const board = parseLeaderboard(leaderboardFixture);
check("3 entri terparse", board?.length === 3);
check("peringkat 1: Ahmad Fauzi Fore Test 1600 PT", board?.[0]?.rank === 1 && board?.[0]?.name === "Ahmad Fauzi Fore Test" && board?.[0]?.points === 1600);
check("avatar ikut terbawa", board?.[0]?.avatar === "https://picsum.photos/seed/user-1780648444622/100/100");
check("rank hilang -> nomor urut", parseLeaderboard([{ name: "Budi", points: 10 }])?.[0]?.rank === 1);
check("poin string \"1600\" dikonversi", parseLeaderboard([{ rank: 5, name: "Budi", points: "1600" }])?.[0]?.points === 1600);
check("poin NaN -> 0", parseLeaderboard([{ rank: 1, name: "Budi", points: "abc" }])?.[0]?.points === 0);
check("entri tanpa nama dibuang", parseLeaderboard([{ rank: 1, points: 10 }, { rank: 2, name: "Budi", points: 5 }])?.length === 1);
check("array rusak (bukan JSON array) -> null", parseLeaderboard({ message: "error" }) === null);
check("null -> null", parseLeaderboard(null) === null);
check("string -> null", parseLeaderboard("[]") === null);
check("array kosong -> array kosong (bukan null)", parseLeaderboard([])?.length === 0);

console.log("[2] Menu: GET /api/menu");

const menuFixture = [
  {
    id: "1791520379560", name: "Teh Pucuk Harum", category: "Retail", price: 4500, inStock: false,
    displayed: 0, stock: 0, outlet: "coworking", image: "/uploads/menus/menu-1791520379561-616.jpg",
    description: "", isActive: true, inventoryAvailable: false, availabilityOverride: "auto",
    availabilityReason: "", availabilityUpdatedBy: "", availabilityUpdatedAt: null,
    unavailableReason: "inventory", source: "local",
  },
  { id: "1791520353042", name: "Nipis Madu", category: "Retail", price: 5000, inStock: true, image: "" },
];

const menu = parseMenuCatalog(menuFixture);
check("2 menu terparse", menu?.length === 2);
check("harga 4500 number", menu?.[0]?.price === 4500);
check("inStock false dihormati", menu?.[0]?.inStock === false);
check("inStock true dihormati", menu?.[1]?.inStock === true);
check("kategori terbawa", menu?.[0]?.category === "Retail");
check("field ekstra (stock, outlet) tidak masuk", !("stock" in (menu?.[0] ?? {})));
check("harga string \"4500\" dikonversi", parseMenuCatalog([{ id: "1", name: "Kopi", price: "4500" }])?.[0]?.price === 4500);
check("inStock 1 -> true (boolean longgar)", parseMenuCatalog([{ id: "1", name: "Kopi", inStock: 1 }])?.[0]?.inStock === true);
check("item tanpa nama dibuang", parseMenuCatalog([{ id: "1", price: 100 }, { id: "2", name: "Teh" }])?.length === 1);
check("id hilang -> pakai nama sebagai id", parseMenuCatalog([{ name: "Teh", price: 100 }])?.[0]?.id === "Teh");
check("objek (bukan array) -> null", parseMenuCatalog({ menus: [] }) === null);

console.log("[3] Promo koin: GET /api/coin-promos");

const promoFixture = [
  {
    id: "cp-1789530889514", title: "Voucher Diskon 20% ", description: "Minimal 5000 pemebelian",
    coin_cost: 500, discount_type: "fixed", discount_value: 5000, min_order: 5000,
    max_usage: 10, used_count: 0, valid_until: "2026-09-29T17:00:00.000Z",
    is_active: 1, image_url: "/uploads/default_voucher.png", category: "Semua",
    created_at: "2026-09-15T20:54:49.000Z", updated_at: "2026-09-15T20:54:49.000Z",
  },
];

const promos = parseCoinPromos(promoFixture);
check("1 promo terparse", promos?.length === 1);
check("coin_cost -> coinCost 500", promos?.[0]?.coinCost === 500);
check("discount_value -> discountValue 5000", promos?.[0]?.discountValue === 5000);
check("discount_type -> discountType 'fixed'", promos?.[0]?.discountType === "fixed");
check("is_active 1 -> true", promos?.[0]?.isActive === true);
check("valid_until ISO string terbawa", promos?.[0]?.validUntil === "2026-09-29T17:00:00.000Z");
check("judul di-trim", promos?.[0]?.title === "Voucher Diskon 20%");
check("valid_until hilang -> null", parseCoinPromos([{ id: "1", title: "Promo" }])?.[0]?.validUntil === null);
check("is_active 0 -> false", parseCoinPromos([{ id: "1", title: "Promo", is_active: 0 }])?.[0]?.isActive === false);
check("menerima camelCase (coinCost) juga", parseCoinPromos([{ id: "1", title: "Promo", coinCost: 250 }])?.[0]?.coinCost === 250);
check("promo tanpa judul dibuang", parseCoinPromos([{ id: "1", coin_cost: 100 }])?.length === 0);
check("bukan array -> null", parseCoinPromos({ promos: [] }) === null);

console.log("[4] Status antrian: GET /api/orders/queue-status");

const queue = parseQueueStatus({ active_orders: 37, estimated_wait_time_minutes: 116, message: "Dapur Sedang Sibuk" });
check("activeOrders 37", queue?.activeOrders === 37);
check("estimatedWaitMinutes 116", queue?.estimatedWaitMinutes === 116);
check("message terbawa", queue?.message === "Dapur Sedang Sibuk");
check("angka negatif dijepit ke 0", parseQueueStatus({ active_orders: -5 })?.activeOrders === 0);
check("field hilang -> 0 / string kosong", parseQueueStatus({})?.message === "");
check("array -> null", parseQueueStatus([]) === null);
check("null -> null", parseQueueStatus(null) === null);

console.log("[5] normalizeName (pencocokan baris leaderboard dengan user login)");
check("spasi berlebih dirapikan", normalizeName("  Ahmad   Fauzi  ") === "ahmad fauzi");
check("case insensitive", normalizeName("AHMAD") === normalizeName("ahmad"));
check("nama kosong aman", normalizeName("") === "");

console.log(`\nTotal: ${passed} lulus, ${failed} gagal`);
process.exit(failed === 0 ? 0 : 1);
