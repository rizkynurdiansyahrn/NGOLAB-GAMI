# Integrasi Auth PointLab ↔ Ngolab-Gami — Redirect Auth (SSO ringan)

Status: SELESAI di sisi kode (15 Oktober 2026). Butuh 1 langkah deploy di PointLab
agar alur redirect aktif di produksi (lihat bagian "Deploy").

## Arsitektur singkat

Ngolab-Gami TIDAK lagi memuat form login/daftar tiruan. Alur resmi:

1. Pengunjung di halaman utama Ngolab-Gami menekan Login / Daftar.
2. Ngolab-Gami mengalihkan browser ke halaman autentikasi RESMI PointLab:
   `https://point.ngolab.online/auth?redirect=<url balik Ngolab-Gami>&mode=login|register`
   Kredensial hanya dimasukkan di PointLab.
3. Setelah login/daftar berhasil, PointLab mengembalikan pengguna ke Ngolab-Gami
   dengan token JWT pada FRAGMENT URL (tidak dikirim ke server/log):
   `https://<url-gami>/#token=<JWT>`
4. Ngolab-Gami memvalidasinya ke `GET /api/users/profile` (Bearer), lalu membuat
   sesi lokalnya sendiri (`ngolab.session.v1` di localStorage) dan membuka beranda.
5. Jika pengguna SUDAH login di PointLab (token `pointlab_token` ada) dan datang
   lewat URL redirect, PointLab langsung mengembalikan token tanpa menampilkan
   form lagi.

Keamanan:
- Daftar izin host redirect di sisi PointLab: hanya `gami.ngolab.online`,
  `localhost`, `127.0.0.1` (localhost boleh http untuk dev; produksi wajib https)
  → mencegah open-redirect / phishing.
- Token JWT diverifikasi ke server sebelum dipakai; fragment segera dibersihkan
  dari URL (`history.replaceState`) agar tidak tersimpan di riwayat.
- Ngolab-Gami tidak pernah menerima atau menyimpan password.
- **Paksa login ulang (`prompt=login`)**: setiap kali tombol Login/Daftar di
  Ngolab-Gami ditekan, URL ke PointLab selalu membawa `prompt=login`. Kalau
  browser masih menyimpan sesi PointLab (`pointlab_token`), PointLab memakainya
  TIDAK lagi untuk auto-masuk — sesi lama dibuang dan form kredensial
  ditampilkan, sehingga setelah logout di Ngolab-Gami pengguna bisa masuk lagi
  (bahkan dengan akun berbeda) lewat halaman login PointLab. Tanpa parameter
  ini (mis. aplikasi mitra lain membuka link polos), perilaku lama tetap:
  sudah login di PointLab → token langsung dikembalikan tanpa form.

## Perubahan sisi Ngolab-Gami (repo ini)

| File | Perubahan |
|---|---|
| `src/lib/pointlabSso.ts` (baru) | helper murni: `buildPointLabLoginUrl`, `extractTokenFromLocationHash`, `redirectToPointLabAuth`, `POINTLAB_AUTH_PAGE` |
| `src/pages/MobileLogin.tsx` | form tiruan DIHAPUS → layar redirect "Masuk dengan akun PointLab" + tombol + info keamanan |
| `src/App.tsx` | konsumsi callback `#token=...`: validasi ke PointLab, buat sesi, buka hub; gagal → notifikasi + layar redirect |
| `src/pages/LandingPage.tsx` | penyesuaian teks ("Login / Daftar (PointLab)") |
| `test-pointlab-sso.ts` (baru) | 13 assertion URL & ekstraksi token |

Env opsional: `VITE_POINTLAB_AUTH_URL` (default produksi `https://point.ngolab.online/auth`;
saat development otomatis `http://localhost:5173/auth`).

## Perubahan sisi PointLab (untuk teman/backend — clone `Ngolab/PointLab`)

| File | Perubahan |
|---|---|
| `src/lib/ssoRedirect.js` (baru) | `readRedirectParam`, `readModeParam`, `isAllowedRedirect` (allowlist host), `buildReturnUrl` |
| `src/pages/Auth.jsx` | baca param `redirect` & `mode`; setelah login/daftar sukses, kembalikan token via fragment bila redirect valid |
| `src/App.jsx` | `PublicOnlyRoute`: bila sudah login + datang via redirect → langsung kembalikan token (komponen `SsoReturn`) |

Semua perubahan menjaga perilaku lama: tanpa param `redirect`, login tetap
menuju `/dashboard` PointLab seperti biasa.

## Deploy (yang perlu dilakukan tim PointLab)

1. Commit & deploy perubahan 3 file di atas ke `point.ngolab.online`.
2. Pastikan origin Ngolab-Gami produksi masuk allowlist
   (`gami.ngolab.online` — sudah ada di kode; sesuaikan bila domain berbeda).
3. Setelah deploy, uji satu kali: klik Login di Ngolab-Gami → login di PointLab
   → kembali otomatis ke beranda Ngolab-Gami.

Catatan: sebelum PointLab di-deploy, tombol Login di Ngolab-Gami memproduksi
mengarah ke PointLab yang belum kenal param redirect (pengguna mendarat di
dashboard PointLab). Ini normal sampai langkah deploy di atas selesai.

## Verifikasi yang sudah dilakukan (dev, 15 Okt 2026)

- URL redirect & ekstraksi token: 13/13 assertion lulus.
- Alur nyata browser: PointLab dev `/auth?redirect=http://localhost:3001/`
  → token diteruskan kembali ke Ngolab-Gami (`#token=...`) → sesi dibuat
  (user "Uji Integrasi Gami", memberId `u-1791989531265`) → beranda menampilkan
  saldo "100 PTS" dari `GET /api/members/{id}/points`.
- Token palsu ditolak, fragment dibersihkan, tidak ada sesi dibuat.
- `npm run lint` bersih, `npm run build` sukses, 254 assertion lulus di 10 file test.
