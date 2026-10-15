import { isIdentityProvider, type IdentityProvider } from "./identity";

const DEFAULT_API_BASE_URL = "https://geasteats.ngolab.online";

export const REMOTE_API_BASE_URL = (
  import.meta.env?.VITE_API_BASE_URL || DEFAULT_API_BASE_URL
).replace(/\/+$/, "");

// In development the Vite server forwards these requests to the remote API,
// so the browser only makes same-origin requests to localhost.
export const API_BASE_URL = import.meta.env?.DEV
  ? "/membership-api"
  : REMOTE_API_BASE_URL;

// Base URL PointLab (layanan membership & loyalty). Dev memakai proxy Vite
// (/pointlab-api) untuk menghindari CORS; produksi memakai URL langsung
// karena PointLab sudah mengirim Access-Control-Allow-Origin: * .
const DEFAULT_POINTLAB_API_BASE_URL = "https://point.ngolab.online";

export const REMOTE_POINTLAB_API_BASE_URL = (
  import.meta.env?.VITE_POINTLAB_API_BASE_URL || DEFAULT_POINTLAB_API_BASE_URL
).replace(/\/+$/, "");

export const POINTLAB_API_BASE_URL = import.meta.env?.DEV
  ? "/pointlab-api"
  : REMOTE_POINTLAB_API_BASE_URL;

// Penyedia identitas aktif. "pointlab" = bawaan (akun membership Ngolab:
// login/daftar/profil/poin memakai akun PointLab). "geasteats" masih bisa
// diaktifkan lewat VITE_IDENTITY_PROVIDER untuk memakai akun makanan/minuman.
const rawIdentityProvider = import.meta.env?.VITE_IDENTITY_PROVIDER;
export const IDENTITY_PROVIDER: IdentityProvider = isIdentityProvider(rawIdentityProvider)
  ? rawIdentityProvider
  : "pointlab";

// Base URL untuk panggilan identitas (auth + profil): PointLab saat provider
// pointlab aktif, GeastEats saat provider geasteats. Endpoint publik lain
// (leaderboard, menu) TETAP memakai API_BASE_URL GeastEats.
export const IDENTITY_API_BASE_URL = IDENTITY_PROVIDER === "pointlab" ? POINTLAB_API_BASE_URL : API_BASE_URL;

