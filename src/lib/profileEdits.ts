import { DEFAULT_AVATAR, avatarUrlForApi } from "./userProfile";

// Kunci cadangan profil di perangkat: dipakai ketika server belum mengizinkan
// akun menyimpan profil (role Pelanggan dapat 403 pada PUT /api/users/{id}).
export const PROFILE_FALLBACK_KEY_PREFIX = "gami_profile_";

export interface ProfileFallback {
  name: string;
  phone: string;
  avatar: string;
  savedAt: number;
}

export interface ProfileUpdatePayload {
  nama: string;
  telp?: string;
  avatar_url?: string;
}

export function profileFallbackKey(userId: string): string {
  return `${PROFILE_FALLBACK_KEY_PREFIX}${userId}`;
}

// Sisakan tanda "+" di depan lalu buang semua selain angka.
export function sanitizePhoneInput(raw: unknown): string {
  if (typeof raw !== "string") return "";
  const trimmed = raw.trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  return plus + trimmed.replace(/\D/g, "");
}

export function isValidPhone(phone: string): boolean {
  return /^\+?\d{9,15}$/.test(phone);
}

export interface ProfileInputCheck {
  valid: boolean;
  nameError?: string;
  phoneError?: string;
}

export function validateProfileInput(name: unknown, phone?: unknown): ProfileInputCheck {
  const nameError =
    typeof name === "string" && name.trim().length >= 2
      ? undefined
      : "Nama minimal 2 karakter.";
  const rawPhone = typeof phone === "string" ? phone.trim() : "";
  const cleaned = sanitizePhoneInput(rawPhone);
  let phoneError: string | undefined;
  if (rawPhone.length > 0 && cleaned.replace("+", "").length === 0) {
    phoneError = "Nomor telepon hanya boleh berisi angka.";
  } else if (cleaned.length > 0 && !isValidPhone(cleaned)) {
    phoneError = "Nomor telepon belum benar (9-15 angka).";
  }
  return { valid: !nameError && !phoneError, nameError, phoneError };
}

export interface ProfileUpdateInput {
  userId: string;
  name: string;
  phone?: string;
  avatar?: string;
}

export function buildProfileUpdatePayload(input: ProfileUpdateInput): ProfileUpdatePayload {
  const payload: ProfileUpdatePayload = { nama: input.name.trim() };
  const cleaned = sanitizePhoneInput(input.phone);
  if (cleaned) payload.telp = cleaned;
  if (input.avatar) payload.avatar_url = avatarUrlForApi(input.avatar, input.userId);
  return payload;
}

export function serializeProfileFallback(input: {
  name: string;
  phone?: string;
  avatar: string;
  savedAt?: number;
}): string {
  const data: ProfileFallback = {
    name: input.name.trim(),
    phone: sanitizePhoneInput(input.phone),
    avatar: input.avatar || DEFAULT_AVATAR,
    savedAt: typeof input.savedAt === "number" ? input.savedAt : Date.now(),
  };
  return JSON.stringify(data);
}

export function parseProfileFallback(raw: string | null | undefined): ProfileFallback | null {
  if (typeof raw !== "string" || raw.trim().length === 0) return null;
  let data: Record<string, unknown>;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    data = parsed as Record<string, unknown>;
  } catch {
    return null;
  }
  const name = typeof data.name === "string" ? data.name.trim() : "";
  const avatar = typeof data.avatar === "string" ? data.avatar.trim() : "";
  if (!name || !avatar) return null;
  return {
    name,
    phone: sanitizePhoneInput(data.phone),
    avatar,
    savedAt:
      typeof data.savedAt === "number" && Number.isFinite(data.savedAt) && data.savedAt > 0
        ? data.savedAt
        : 0,
  };
}

// Data lokal dipasang DI ATAS data server agar pilihan pengguna tetap tampil
// sampai server benar-benar menyimpannya.
export function mergeProfileFallback<T extends { name: string; avatar: string; phone?: string }>(
  base: T,
  fallback: ProfileFallback | null
): T {
  if (!fallback) return base;
  return {
    ...base,
    name: fallback.name || base.name,
    avatar: fallback.avatar || base.avatar,
    phone: fallback.phone || base.phone,
  };
}

function storage(): Storage | null {
  try {
    return typeof localStorage !== "undefined" ? localStorage : null;
  } catch {
    return null;
  }
}

export function readProfileFallback(userId: string): ProfileFallback | null {
  const store = storage();
  if (!store || !userId) return null;
  try {
    return parseProfileFallback(store.getItem(profileFallbackKey(userId)));
  } catch {
    return null;
  }
}

export function writeProfileFallback(userId: string, input: { name: string; phone?: string; avatar: string }): void {
  const store = storage();
  if (!store || !userId) return;
  try {
    store.setItem(profileFallbackKey(userId), serializeProfileFallback(input));
  } catch {
    // Kuota penuh atau storage diblokir: perubahan tetap tampil di sesi ini.
  }
}

export function clearProfileFallback(userId: string): void {
  const store = storage();
  if (!store || !userId) return;
  try {
    store.removeItem(profileFallbackKey(userId));
  } catch {
    // tidak ada yang bisa dilakukan
  }
}
