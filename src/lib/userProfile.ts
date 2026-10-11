import type { AppUser } from "../data/appData";

export const DEFAULT_AVATAR = "/avatar-placeholder.svg";

export interface AuthSession {
  user: AppUser;
  token: string;
}

function textValue(...values: unknown[]): string | undefined {
  return values.find((value): value is string => typeof value === "string" && value.trim().length > 0)?.trim();
}

function nonNegativeNumber(value: unknown, fallback: number): number {
  if (value === null || value === undefined || value === "" || typeof value === "boolean") return fallback;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? number : fallback;
}

function normalizeAvatar(source: string | undefined, userId: string): string {
  if (!source) return DEFAULT_AVATAR;

  try {
    const url = new URL(source);
    // Registration assigns this random photo automatically. Display our
    // standard avatar while preserving photos the user selected themselves.
    if (url.hostname === "picsum.photos" &&
        decodeURIComponent(url.pathname).replace(/\/$/, "") === `/seed/${userId}/100/100`) {
      return DEFAULT_AVATAR;
    }
  } catch {
    // Local avatar paths are already relative to this frontend.
  }

  return source;
}

export function avatarUrlForApi(avatar: string, userId: string): string {
  // Restore the API's existing default instead of storing a localhost asset
  // URL in the shared profile. This frontend displays that default as an icon.
  return avatar === DEFAULT_AVATAR
    ? `https://picsum.photos/seed/${encodeURIComponent(userId)}/100/100`
    : avatar;
}

// Merge only fields supplied by the API. Partial profile responses must not
// replace the login avatar or account details with demonstration data.
export function normalizeUserProfile(value: unknown, previous?: AppUser): AppUser {
  const data = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const id = data.id !== undefined && data.id !== null ? String(data.id) : previous?.id ?? "";
  const points = nonNegativeNumber(data.currentPoints ?? data.points, Number.NaN);
  const rank = nonNegativeNumber(data.rank, previous?.rank ?? 0);

  return {
    id,
    name: textValue(data.nama, data.name, previous?.name) ?? "Nama akun belum tersedia",
    avatar: normalizeAvatar(textValue(data.avatar_url, data.avatar, previous?.avatar), id),
    // The legacy coin_balance field is not a Loyalty Points balance.
    points: Number.isFinite(points) ? points : previous?.points ?? 0,
    pointsAvailable: data.pointsAvailable === false ? false : Number.isFinite(points) ? true : previous?.pointsAvailable ?? false,
    level: Math.max(1, nonNegativeNumber(data.level, previous?.level ?? 1)),
    exp: nonNegativeNumber(data.exp, previous?.exp ?? 0),
    nextExp: Math.max(1, nonNegativeNumber(data.nextExp, previous?.nextExp ?? 100)),
    streak: nonNegativeNumber(data.streak, previous?.streak ?? 0),
    gamesPlayed: nonNegativeNumber(data.gamesPlayed, previous?.gamesPlayed ?? 0),
    gamesThisWeek: nonNegativeNumber(data.gamesThisWeek, previous?.gamesThisWeek ?? 0),
    rank: rank > 0 ? rank : undefined,
    memberId: textValue(data.memberId, data.member_id, previous?.memberId),
    email: textValue(data.email, previous?.email),
    phone: textValue(data.phone, data.phone_number, previous?.phone),
    role: textValue(data.role, previous?.role),
  };
}
