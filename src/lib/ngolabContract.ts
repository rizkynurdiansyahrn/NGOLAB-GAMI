// Kontrak data publik Ngolab (layanan GeastEats / backend_ngolab).
// Modul ini sengaja bebas dependensi (tidak ada fetch / import.meta.env)
// agar bisa diuji langsung dengan `npx tsx test-ngolab-contract.ts`.
//
// Semua parser defensif: kalau bentuk data tidak sesuai, kembalikan null
// (bukan throw) supaya UI bisa menampilkan fallback, bukan crash.
// Field snake_case dari API dipetakan ke camelCase di sini, sekali saja.

export interface LeaderboardEntry {
  rank: number;
  name: string;
  points: number;
  avatar: string;
}

export interface MenuItem {
  id: string;
  name: string;
  category: string;
  price: number;
  image: string;
  inStock: boolean;
}

export interface CoinPromo {
  id: string;
  title: string;
  description: string;
  coinCost: number;
  discountValue: number;
  discountType: string;
  minOrder: number;
  validUntil: string | null;
  imageUrl: string;
  isActive: boolean;
}

export interface QueueStatus {
  activeOrders: number;
  estimatedWaitMinutes: number;
  message: string;
}

/** Angka finit (menerima number atau string angka). null kalau tidak valid. */
export function toFiniteNumber(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Boolean longgar: true/1/"1" dianggap true. */
function toBoolean(value: unknown, fallback: boolean): boolean {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value !== 0;
  if (typeof value === "string") return value !== "" && value !== "0" && value !== "false";
  return fallback;
}

function toText(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

/**
 * GET /api/leaderboard -> [{rank, name, points, avatar}, ...]
 * rank yang hilang/rusak diganti nomor urut; entri tanpa nama dibuang.
 */
export function parseLeaderboard(raw: unknown): LeaderboardEntry[] | null {
  if (!Array.isArray(raw)) return null;
  const entries: LeaderboardEntry[] = [];
  raw.forEach((row, index) => {
    if (row === null || typeof row !== "object") return;
    const item = row as Record<string, unknown>;
    const name = toText(item.name);
    if (!name) return;
    const rank = toFiniteNumber(item.rank) ?? index + 1;
    const points = toFiniteNumber(item.points) ?? 0;
    entries.push({
      rank: Math.trunc(rank),
      name,
      points: Math.max(0, Math.trunc(points)),
      avatar: toText(item.avatar),
    });
  });
  return entries;
}

/**
 * GET /api/menu -> [{id, name, category, price, image, inStock, ...}, ...]
 * Item tanpa nama dibuang; harga tidak valid jadi 0 supaya UI tetap bisa render.
 */
export function parseMenuCatalog(raw: unknown): MenuItem[] | null {
  if (!Array.isArray(raw)) return null;
  const items: MenuItem[] = [];
  raw.forEach((row) => {
    if (row === null || typeof row !== "object") return;
    const item = row as Record<string, unknown>;
    const name = toText(item.name);
    if (!name) return;
    items.push({
      id: toText(item.id) || name,
      name,
      category: toText(item.category),
      price: toFiniteNumber(item.price) ?? 0,
      image: toText(item.image),
      inStock: toBoolean(item.inStock, true),
    });
  });
  return items;
}

/**
 * GET /api/coin-promos -> [{id, title, coin_cost, discount_value, ...}, ...]
 */
export function parseCoinPromos(raw: unknown): CoinPromo[] | null {
  if (!Array.isArray(raw)) return null;
  const promos: CoinPromo[] = [];
  raw.forEach((row) => {
    if (row === null || typeof row !== "object") return;
    const item = row as Record<string, unknown>;
    const title = toText(item.title);
    if (!title) return;
    const validUntil = toText(item.valid_until) || toText(item.validUntil);
    promos.push({
      id: toText(item.id) || title,
      title,
      description: toText(item.description),
      coinCost: toFiniteNumber(item.coin_cost ?? item.coinCost) ?? 0,
      discountValue: toFiniteNumber(item.discount_value ?? item.discountValue) ?? 0,
      discountType: toText(item.discount_type ?? item.discountType) || "fixed",
      minOrder: toFiniteNumber(item.min_order ?? item.minOrder) ?? 0,
      validUntil: validUntil || null,
      imageUrl: toText(item.image_url ?? item.imageUrl),
      isActive: toBoolean(item.is_active ?? item.isActive, true),
    });
  });
  return promos;
}

/**
 * GET /api/orders/queue-status -> {active_orders, estimated_wait_time_minutes, message}
 */
export function parseQueueStatus(raw: unknown): QueueStatus | null {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) return null;
  const item = raw as Record<string, unknown>;
  const message = toText(item.message);
  return {
    activeOrders: Math.max(0, Math.trunc(toFiniteNumber(item.active_orders) ?? 0)),
    estimatedWaitMinutes: Math.max(0, Math.trunc(toFiniteNumber(item.estimated_wait_time_minutes) ?? 0)),
    message,
  };
}

/** Normalisasi nama untuk mencocokkan baris leaderboard dengan user yang login. */
export function normalizeName(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}
