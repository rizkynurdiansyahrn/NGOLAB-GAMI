// Lapisan identitas Ngolab-Gami: memetakan form aplikasi ke kontrak auth tiap
// penyedia. Modul ini SENGAJA murni (tanpa fetch, tanpa import.meta.env) agar
// bisa diuji langsung dengan `npx tsx test-identity.ts`.
//
// Kontrak auth TERVERIFIKASI:
//   geasteats (aktif): POST /api/auth/login  { email | phone_number, password }
//                      POST /api/auth/register { name, phone_number, email, password }
//   pointlab:          POST /api/auth/login  { identifier, password }
//                      POST /api/auth/register { nim, password(min 6), nama?, email?, phone? }
// Kedua penyedia membalas { token, user }. PointLab TIDAK memakai field
// "memberId" — identitas member memakai user.id.

export type IdentityProvider = "geasteats" | "pointlab";

export interface RegisterInput {
  name: string;
  phone: string;
  email: string;
  password: string;
  /** Wajib saat provider pointlab (NIM mahasiswa). */
  nim?: string;
}

export interface AuthPayload {
  token: string;
  user: Record<string, unknown>;
}

export const AUTH_LOGIN_PATH = "/api/auth/login";
export const AUTH_REGISTER_PATH = "/api/auth/register";

export function isIdentityProvider(value: unknown): value is IdentityProvider {
  return value === "geasteats" || value === "pointlab";
}

/** Body login sesuai kontrak penyedia. */
export function loginRequestBody(
  provider: IdentityProvider,
  identifier: string,
  password: string,
): Record<string, string> {
  const trimmed = identifier.trim();
  if (provider === "pointlab") {
    return { identifier: trimmed, password };
  }
  return trimmed.includes("@") ? { email: trimmed, password } : { phone_number: trimmed, password };
}

/** Body register sesuai kontrak penyedia (PointLab: nim wajib). */
export function registerRequestBody(
  provider: IdentityProvider,
  input: RegisterInput,
): Record<string, string> {
  if (provider === "pointlab") {
    return {
      nim: (input.nim ?? "").trim(),
      password: input.password,
      nama: input.name.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
    };
  }
  return {
    name: input.name.trim(),
    phone_number: input.phone.trim(),
    email: input.email.trim(),
    password: input.password,
  };
}

/** Field yang wajib diisi di form pendaftaran, per penyedia. */
export function registerRequiredFields(
  provider: IdentityProvider,
): Array<"name" | "phone" | "email" | "nim" | "password"> {
  if (provider === "pointlab") return ["nim", "password"];
  return ["name", "phone", "email", "password"];
}

/**
 * Objek user siap untuk normalizeUserProfile. PointLab tidak punya field
 * memberId — user.id yang dipakai sebagai memberId di endpoint loyalty.
 */
export function toProfilePayload(
  provider: IdentityProvider,
  user: unknown,
): Record<string, unknown> {
  const data = user && typeof user === "object" ? { ...(user as Record<string, unknown>) } : {};
  if (provider === "pointlab") {
    const id = data.id;
    if (id !== undefined && id !== null) data.memberId = String(id);
  }
  return data;
}

/** memberId untuk endpoint loyalty: pointlab -> user.id; geasteats -> memberId. */
export function memberIdFor(provider: IdentityProvider, user: unknown): string | null {
  const data = user && typeof user === "object" ? (user as Record<string, unknown>) : {};
  if (provider === "pointlab") {
    return data.id !== undefined && data.id !== null && String(data.id) ? String(data.id) : null;
  }
  const memberId = data.memberId ?? data.member_id;
  return typeof memberId === "string" && memberId.trim() ? memberId.trim() : null;
}

/** Respons auth sah: ada user.id dan token string. */
export function isAuthResponseValid(payload: unknown): payload is AuthPayload {
  if (!payload || typeof payload !== "object") return false;
  const data = payload as Record<string, unknown>;
  const user = data.user;
  return (
    typeof data.token === "string" &&
    !!user &&
    typeof user === "object" &&
    (user as Record<string, unknown>).id !== undefined &&
    (user as Record<string, unknown>).id !== null
  );
}

// ── Profil (muat & simpan) ────────────────────────────────────────────────

/**
 * Path untuk MEMUAT profil akun terdaftar.
 * pointlab: satu path untuk semua akun (identitas dari token Bearer).
 * geasteats: per user id.
 */
export function profileFetchPath(provider: IdentityProvider, userId: string): string {
  if (provider === "pointlab") return "/api/users/profile";
  return `/api/users/${encodeURIComponent(userId)}/recommendations`;
}

/** Path untuk MENYIMPAN profil akun terdaftar. */
export function profileUpdatePath(provider: IdentityProvider, userId: string): string {
  if (provider === "pointlab") return "/api/users/profile";
  return `/api/users/${encodeURIComponent(userId)}`;
}

export interface ProfileUpdateInput {
  userId: string;
  name: string;
  phone?: string;
  avatar?: string;
}

/**
 * Body simpan profil sesuai kontrak tiap penyedia:
 * pointlab UPDATE users SET nama/phone/avatar_url; geasteats {nama, telp?}.
 * Avatar data URL tidak dikirim ke server (tidak didukung kedua penyedia).
 */
export function profileUpdateBody(
  provider: IdentityProvider,
  input: ProfileUpdateInput,
): Record<string, string> {
  const body: Record<string, string> = { nama: input.name.trim() };
  const phone = (input.phone ?? "").trim();
  if (phone) {
    if (provider === "pointlab") body.phone = phone;
    else body.telp = phone;
  }
  if (input.avatar && !input.avatar.startsWith("data:")) {
    body.avatar_url = input.avatar;
  }
  return body;
}

/** field nama di respons profil (pointlab "nama", geasteats "name"). */
export function profileNameField(provider: IdentityProvider): string {
  return provider === "pointlab" ? "nama" : "name";
}

/**
 * Validasi respons profil di sessionStorage. pointlab: cukup user.id cocok
 * dengan pemilik sesi; geasteats: identik (server memfilter per sesi Pelanggan).
 */
export function profileUserMatches(
  provider: IdentityProvider,
  payload: unknown,
  userId: string,
): boolean {
  if (!payload || typeof payload !== "object") return false;
  const user = (payload as Record<string, unknown>).user;
  if (!user || typeof user !== "object") return false;
  const id = (user as Record<string, unknown>).id;
  if (id === undefined || id === null) return false;
  return String(id) === userId;
}

/**
 * memberId dari respons profil: pointlab memakai user.id (sama seperti saat
 * login); geasteats memakai field memberId bila ada.
 */
export function memberIdFromProfileUser(
  provider: IdentityProvider,
  payload: unknown,
): string | null {
  if (!payload || typeof payload !== "object") return null;
  const user = (payload as Record<string, unknown>).user;
  if (!user || typeof user !== "object") return null;
  const data = user as Record<string, unknown>;
  if (provider === "pointlab") {
    return data.id !== undefined && data.id !== null && String(data.id) ? String(data.id) : null;
  }
  const memberId = data.memberId ?? data.member_id;
  return typeof memberId === "string" && memberId.trim() ? memberId.trim() : null;
}
