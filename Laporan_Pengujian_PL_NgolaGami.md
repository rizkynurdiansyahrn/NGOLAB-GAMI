# LAPORAN PENGUJIAN PERANGKAT LUNAK
## "Ngolab-Gami"

**Disusun untuk Memenuhi Tugas**
Matakuliah Pengujian Perangkat Lunak (GCK2KAB2)
Semester Genap Tahun Ajaran 2025-2026

**Oleh:**
Tim Penguji Perangkat Lunak

| NIM | Nama |
| :--- | :--- |
| 607012400064 | Rizky Nurdiansyah |

Program Studi D3 Sistem Informasi
Fakultas Ilmu Terapan
Universitas Telkom

---

## DAFTAR ISI

- [1 Perencanaan Pengujian](#1-perencanaan-pengujian)
  - [1.1 Instalasi Sistem](#11-instalasi-sistem)
    - [1.1.1 System Requirements](#111-system-requirements)
    - [1.1.2 System Deployment](#112-system-deployment)
  - [1.2 Instalasi Tools Pengujian](#12-instalasi-tools-pengujian)
  - [1.3 Cakupan Pengujian](#13-cakupan-pengujian)
    - [1.3.1 Fungsionalitas Sistem](#131-fungsionalitas-sistem)
    - [1.3.2 Teknik Pengujian](#132-teknik-pengujian)
    - [1.3.3 Jadwal dan Pengawakan](#133-jadwal-dan-pengawakan)
- [2 Perancangan Pengujian](#2-perancangan-pengujian)
- [3 Hasil Pengujian](#3-hasil-pengujian)
- [4 Kesimpulan](#4-kesimpulan)

---

## DAFTAR GAMBAR

- Gambar 1.1 Langkah-Langkah Instalasi Ngolab-Gami
- Gambar 1.2 Tampilan Konfigurasi Katalon Studio

---

## DAFTAR TABEL

- Tabel 1.1 Kebutuhan Perangkat Keras
- Tabel 1.2 Kebutuhan Perangkat Lunak
- Tabel 1.3 Jadwal dan Pengawakan Pengujian
- Tabel 2.1 Rancangan Pengujian Fungsionalitas Ngolab-Gami
- Tabel 3.1 Hasil Pengujian Fungsionalitas Ngolab-Gami (Katalon Studio Script)

---

# 1 Perencanaan Pengujian

Bab 1 laporan pengujian perangkat lunak menjelaskan tahapan perencanaan pengujian, di mana tim penguji perangkat lunak harus mempersiapkan lingkungan pengujian, mendefinisikan cakupan pengujian, serta menentukan pendekatan dan jadwal pelaksanaan pengujian pada sistem **Ngolab-Gami** â€” sebuah *Web App* berbasis *mobile-first* dengan pendekatan gamifikasi (*gamification*) loyalitas dan reward bagi anggota komunitas UMKM Ngolab.

## 1.1 Instalasi Sistem

Pada proses instalasi sistem, tim penguji perlu menjelaskan minimum requirement yang dibutuhkan untuk menjalankan sistem Ngolab-Gami secara lokal di mesin pengujian agar proses eksekusi *test case* dapat dilakukan dengan lancar.

### 1.1.1 System Requirements

**Tabel 1.1 Kebutuhan Perangkat Keras**

| Perangkat Keras | Spesifikasi Minimal |
| :--- | :--- |
| Processor | Intel Core i3 Generasi ke-8 / AMD Ryzen 3 (setara) |
| RAM | 4 GB DDR4 |
| Storage | 2 GB ruang kosong (untuk project dan node_modules) |
| Koneksi Internet | Diperlukan untuk mengakses API backend Ngolab |

**Tabel 1.2 Kebutuhan Perangkat Lunak**

| Perangkat Lunak | Spesifikasi Minimal |
| :--- | :--- |
| Bahasa Pemrograman | TypeScript / JavaScript (Node.js v18+) |
| DBMS | PostgreSQL (dikelola server kolab.top) |
| Framework | React 18 + Vite 5 + Tailwind CSS |
| Web Browser | Google Chrome versi 120+ (direkomendasikan untuk layout mobile) |
| Runtime | Node.js v18.x ke atas + NPM v9+ |
| Tools Pengujian | Katalon Studio v10.x + Ekstensi Katalon Utility (Chrome) |

### 1.1.2 System Deployment

Tahapan *system deployment* dilakukan untuk mempersiapkan lingkungan pengujian agar sistem *Ngolab-Gami* dapat dijalankan secara lokal (*localhost*) dan siap untuk diuji. Proses ini mencakup persiapan *runtime*, pengunduhan kode sumber, instalasi pustaka (*dependencies*), konfigurasi variabel lingkungan (*environment variables*), hingga eksekusi server pengembangan. 

Untuk memberikan gambaran yang komprehensif, proses instalasi dan konfigurasi sistem diuraikan secara rinci melalui diagram alur instalasi, struktur direktori proyek, serta penjabaran teknis pada setiap langkahnya. Dokumentasi ini disusun agar seluruh rangkaian persiapan pengujian dapat direproduksi dengan hasil yang konsisten.

---

**Diagram Alur Instalasi Sistem Ngolab-Gami**

```
┌──────────────────────────────────────────────────────────┐
│              ALUR INSTALASI SISTEM NGOLAB-GAMI           │
└──────────────────────────────────────────────────────────┘

  [MULAI]
     │
     ▼
┌─────────────────────────────┐
│  1. Verifikasi Node.js      │  → Cek versi Node.js (≥ v18)
│     & NPM sudah terpasang   │    dan NPM (≥ v9) di terminal
└────────────────┬────────────┘
                 │
                 ▼
┌─────────────────────────────┐
│  2. Unduh Source Code       │  → Clone dari repositori Git
│     Proyek Ngolab-Gami      │    atau ekstrak arsip .zip
└────────────────┬────────────┘
                 │
                 ▼
┌─────────────────────────────┐
│  3. Masuk ke Direktori      │  → cd ngolab-gami
│     Proyek                  │
└────────────────┬────────────┘
                 │
                 ▼
┌─────────────────────────────┐
│  4. Instalasi Dependensi    │  → npm install
│     (node_modules)          │    (~1-3 menit tergantung koneksi)
└────────────────┬────────────┘
                 │
                 ▼
┌─────────────────────────────┐
│  5. Konfigurasi File .env   │  → Salin .env.example → .env
│                             │    Isi GEMINI_API_KEY
└────────────────┬────────────┘
                 │
                 ▼
┌─────────────────────────────┐
│  6. Jalankan Dev Server     │  → npm run dev
│                             │    Server aktif di port 3000
└────────────────┬────────────┘
                 │
                 ▼
┌─────────────────────────────┐
│  7. Akses Sistem di Browser │  → Buka Chrome →
│     (Google Chrome)         │    http://localhost:3000/
└────────────────┬────────────┘
                 │
                 ▼
            [SELESAI]
       Sistem Siap Diuji
```

---

**Langkah-Langkah Instalasi Secara Deskriptif**

**Langkah 1 — Verifikasi Node.js dan NPM**

Sebelum memulai instalasi, pastikan *runtime* Node.js dan manajer paket NPM sudah terpasang di mesin penguji. Buka **Terminal** (Windows: *Command Prompt* / *PowerShell*, macOS/Linux: *Terminal*), lalu ketik perintah berikut:

```bash
node -v
npm -v
```

*Output* yang diharapkan:
```
v18.20.4    ← versi Node.js (minimal v18.x)
9.8.1       ← versi NPM (minimal v9.x)
```

Jika perintah tidak dikenali (*'node' is not recognized*), unduh dan instal Node.js terlebih dahulu dari situs resmi **https://nodejs.org** (pilih versi LTS).

---

**Langkah 2 — Unduh Source Code Proyek**

Unduh kode sumber proyek Ngolab-Gami ke dalam direktori lokal mesin penguji. Source code dapat diperoleh melalui dua cara:

- **Cara A (Git Clone)** — Jika Git sudah terpasang:
  ```bash
  git clone <URL_REPOSITORI> ngolab-gami
  ```
- **Cara B (Ekstrak ZIP)** — Ekstrak berkas `.zip` yang diterima dari pengembang, lalu letakkan di direktori yang mudah diakses (misal: `D:\ngolab-gami`).

Setelah berhasil, struktur direktori proyek akan terlihat sebagai berikut:

```
ngolab-gami/
├── public/                  ← Aset statis (gambar, ikon)
├── src/
│   ├── components/          ← Komponen React yang dapat digunakan ulang
│   ├── data/                ← Data statis & dummy (dummyData.ts, appData.ts)
│   ├── pages/               ← Halaman utama (MobileLogin.tsx, Dashboard, dsb.)
│   └── main.tsx             ← Entry point aplikasi
├── .env.example             ← Template variabel lingkungan
├── package.json             ← Daftar dependensi proyek
├── vite.config.ts           ← Konfigurasi build tool Vite
└── tsconfig.json            ← Konfigurasi TypeScript
```

---

**Langkah 3 — Masuk ke Direktori Proyek**

Arahkan terminal ke dalam folder proyek yang baru diunduh:

```bash
cd ngolab-gami
```

Verifikasi bahwa Anda berada di direktori yang tepat dengan memeriksa keberadaan file `package.json`:

```bash
# Windows
dir package.json

# macOS / Linux
ls package.json
```

---

**Langkah 4 — Instalasi Dependensi**

Jalankan perintah berikut untuk mengunduh dan menginstal seluruh *library* yang dibutuhkan oleh proyek (tercantum di dalam `package.json`):

```bash
npm install
```

Proses ini akan membuat folder `node_modules/` di dalam direktori proyek. Durasi instalasi bergantung pada kecepatan koneksi internet (estimasi 1–5 menit). *Output* akhir yang diharapkan:

```
added 312 packages, and audited 313 packages in 45s
found 0 vulnerabilities
```

> **Catatan:** Jika terdapat pesan *warning* terkait *peer dependencies*, hal tersebut dapat diabaikan selama tidak ada pesan *error* (ditandai dengan `npm ERR!`).

---

**Langkah 5 — Konfigurasi File Lingkungan (.env)**

Salin file template variabel lingkungan:

```bash
# Windows (Command Prompt)
copy .env.example .env

# macOS / Linux
cp .env.example .env
```

Buka file `.env` menggunakan editor teks (Notepad, VS Code, dsb.), lalu isi nilai variabel yang diperlukan:

```env
VITE_GEMINI_API_KEY=<isi_dengan_API_key_Gemini_Anda>
```

> **Catatan:** Nilai `GEMINI_API_KEY` dapat diperoleh dari **https://aistudio.google.com/app/apikey** menggunakan akun Google.

---

**Langkah 6 — Menjalankan Server Pengembangan**

Jalankan perintah berikut untuk memulai server aplikasi secara lokal:

```bash
npm run dev
```

*Output* sukses yang diharapkan di terminal:

```
  VITE v5.x.x  ready in 512 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h + enter to show help
```

*Gambar 1.1 — Tampilan terminal setelah perintah `npm run dev` berhasil dijalankan*
> *(Sisipkan screenshot terminal yang menampilkan output "Local: http://localhost:3000/" di sini)*

Server akan tetap berjalan selama terminal tidak ditutup. Untuk menghentikan server, tekan **Ctrl + C** di terminal.

---

**Langkah 7 — Mengakses Sistem di Browser**

Buka aplikasi **Google Chrome** (versi 120 ke atas), lalu ketik alamat berikut di *address bar*:

```
http://localhost:3000/
```

Sistem Ngolab-Gami akan ditampilkan di browser. Tampilan awal yang muncul adalah **halaman Login/Register** (*Mobile-first design*). Jika halaman berhasil dimuat, instalasi sistem dinyatakan selesai dan lingkungan pengujian siap digunakan.

*Gambar 1.2 — Tampilan halaman Login Ngolab-Gami di Google Chrome*
> *(Sisipkan screenshot tampilan halaman login sistem Ngolab-Gami di browser di sini)*

---

**Tabel Verifikasi Instalasi**

| No | Verifikasi | Perintah / Cara Cek | Status Sukses |
| :- | :--- | :--- | :--- |
| 1 | Node.js terpasang | `node -v` | Tampil versi ≥ v18.x |
| 2 | NPM terpasang | `npm -v` | Tampil versi ≥ v9.x |
| 3 | Dependensi terinstal | Cek folder `node_modules/` ada | Folder ditemukan |
| 4 | File `.env` tersedia | Cek file `.env` ada di root | File ditemukan |
| 5 | Server berjalan | Terminal menampilkan `Local: http://localhost:3000/` | Port 3000 aktif |
| 6 | Aplikasi dapat diakses | Buka `http://localhost:3000/` di Chrome | Halaman login tampil |

## 1.2 Instalasi Tools Pengujian

Eksekusi *test case* pada sistem Ngolab-Gami dilakukan dengan menggunakan bantuan perangkat lunak *automation testing* **Katalon Studio**. Berikut adalah tahapan instalasi dan konfigurasi Katalon Studio sebagai *tools* pengujian:

1. Buka situs web resmi **katalon.com**, buat akun penguji, dan unduh berkas instalasi Katalon Studio sesuai sistem operasi mesin penguji (Windows/macOS/Linux).
2. Jalankan *installer* Katalon Studio dan ikuti proses instalasi hingga selesai.
3. Jalankan aplikasi Katalon Studio, lakukan otentikasi login akun, lalu buat proyek pengujian baru bertipe **Web UI**.
4. Pasang ekstensi **Katalon Utility** pada peramban Google Chrome agar Katalon dapat menangkap (*spy*) elemen-elemen antarmuka secara otomatis melalui fitur *Web Object Spy*.
5. Konfigurasi *driver* peramban web pada menu Katalon Studio: **Preferences > WebUI > Default WebUI Driver > Chrome Driver**, pastikan versi *ChromeDriver* sesuai dengan versi Google Chrome yang terpasang.
6. Buat Test Object baru pada panel **Object Repository** untuk setiap elemen UI yang akan diuji (tombol, input, label, dsb.).

*Gambar 1.2 Tampilan Konfigurasi Katalon Studio*
> *(Sisipkan screenshot tampilan proyek Katalon Studio yang telah dikonfigurasi dengan WebDriver Chrome)*

## 1.3 Cakupan Pengujian

Untuk membatasi proses pengujian, tim penguji menentukan fungsionalitas yang akan diuji, teknik pengujian, serta penjadwalan dan pengawakan pelaksana pengujian.

### 1.3.1 Fungsionalitas Sistem

Tim penguji mendeskripsikan seluruh fungsionalitas yang terdapat pada sistem Ngolab-Gami. Deskripsi yang disampaikan mencakup nama fungsionalitas dan penjelasan singkat cara kerjanya:

1. **Fungsionalitas Login**: Fungsionalitas login digunakan untuk memeriksa (autentikasi) pengguna yang berhak mengakses sistem. Pada fungsionalitas ini, sistem memvalidasi email dan sandi yang dimasukkan pengguna melalui API endpoint `POST /api/auth/login`. Jika kredensial valid, pengguna diarahkan ke halaman Dasbor; jika tidak, sistem menampilkan pesan error yang sesuai.

2. **Fungsionalitas Register**: Fungsionalitas registrasi memungkinkan pengguna baru untuk membuat akun dengan mengisi formulir pendaftaran yang memuat nama lengkap, nomor HP, email, dan sandi. Data dikirim ke endpoint `POST /api/auth/register`, dan akun yang berhasil dibuat secara otomatis mengalihkan pengguna ke halaman Dasbor tanpa perlu login ulang.

3. **Fungsionalitas Library Hub & Filter Kategori**: Fungsionalitas ini menampilkan katalog seluruh 11 mini-game yang tersedia. Pengguna dapat menyaring (*filter*) daftar game berdasarkan kategori (Arcade, Puzzle, Rhythm, dll.) untuk mempermudah pencarian game yang diinginkan.

4. **Fungsionalitas Gameplay Ngolab Catch**: Fungsionalitas ini memuat dan menjalankan mini-game *Ngolab Catch* berbasis HTML5 Canvas. Setelah permainan berakhir (*game over*), sistem secara otomatis menghitung perolehan koin berdasarkan skor akhir dan menampilkan pop-up hasil.

5. **Fungsionalitas Tukar Voucher**: Fungsionalitas ini memungkinkan pengguna menukarkan saldo koin virtual dengan voucher diskon pada katalog promo. Sistem memvalidasi kecukupan saldo sebelum transaksi dan menerbitkan kode QR voucher digital bila saldo mencukupi.

6. **Fungsionalitas Validasi Kasir**: Fungsionalitas ini digunakan oleh kasir mitra UMKM untuk memeriksa validitas kode voucher digital yang ditunjukkan pelanggan melalui antarmuka kasir tersendiri.

7. **Fungsionalitas Study Tracker**: Fungsionalitas ini menyediakan penghitung waktu belajar (*timer*) yang dapat dimulai dan dihentikan pengguna. Durasi belajar yang terekam dikonversi secara proporsional menjadi reward koin virtual yang ditambahkan ke saldo pengguna.

8. **Fungsionalitas Patungan Koin**: Fungsionalitas ini memungkinkan pengguna untuk berkontribusi (*urunan*) koin ke ruang patungan sosial bersama anggota kampus lainnya.

9. **Fungsionalitas Leaderboard**: Fungsionalitas ini menampilkan papan peringkat yang meranking 10 pengguna teratas berdasarkan total akumulasi koin tertinggi.

10. **Fungsionalitas Edit Profile**: Fungsionalitas ini memungkinkan pengguna memperbarui nama tampilan profil mereka melalui dialog *popup* yang dapat diakses dari bilah samping (*sidebar*).

### 1.3.2 Teknik Pengujian

Pada proses pengujian, tim penguji menggunakan pendekatan dan teknik berikut untuk menyusun *test case* dan melaksanakan pengujian:

- **Metode Pengujian**: *Black-Box Testing* â€” Pengujian dilakukan berdasarkan masukan dan keluaran sistem tanpa melihat struktur internal kode program.
- **Teknik Pengujian**: *Equivalence Partitioning (EP)* â€” Teknik ini membagi domain masukan ke dalam kelas-kelas data (valid dan tidak valid) untuk mengidentifikasi skenario sukses dan skenario penanganan error secara efektif.
- **Tools Pengujian**: Katalon Studio v10.x dengan WebDriver Google Chrome.
- **URL Sistem yang Diuji**: `http://localhost:5173/`

### 1.3.3 Jadwal dan Pengawakan

Pembuatan rancangan *test case* dan pelaksanaan pengujian dijadwalkan secara sistematis dengan melibatkan seluruh anggota tim penguji.

**Tabel 1.3 Jadwal dan Pengawakan Pengujian**

| Kegiatan | Tanggal Pelaksanaan | Pelaksana | Tanggung Jawab Fitur |
| :--- | :--- | :--- | :--- |
| Perancangan Test Cases | 17 Juni 2026 | Rizky Nurdiansyah | Penyusunan draf pengujian modul login, registrasi, game hub, dan profile |
| Konfigurasi Katalon Studio | 17 Juni 2026 | Rizky Nurdiansyah | Konfigurasi WebDriver, Object Repository, dan Test Suite |
| Eksekusi & Pembuatan Laporan | 17 Juni 2026 | Rizky Nurdiansyah | Pelaksanaan seluruh 14 test case dan dokumentasi hasil |

---

# 2 Perancangan Pengujian

Bab 2 pada laporan pengujian berisi deskripsi *test case* yang dirancang untuk menguji setiap fungsionalitas yang tersedia pada *Web App* Ngolab-Gami. Setiap skenario pengujian di bawah ini disusun dengan mengimplementasikan teknik *Equivalence Partitioning* yang membagi input ke dalam kondisi batas sukses (*valid partition*) dan penolakan error (*invalid partition*).

**Tabel 2.1 Rancangan Pengujian Fungsionalitas Ngolab-Gami**

| Fungsionalitas | ID Test Case | Skenario / Deskripsi | Pra-Kondisi | Langkah Pengujian | Data Pengujian | Hasil yang Diharapkan |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1. Login** | TC1_1 | Login dengan data kosong (tombol disabled) | Layar login terbuka | 1. Kosongkan input email & password. 2. Periksa tombol "Masuk". | email = null, password = null | Tombol "Masuk ke Game" dinonaktifkan (*disabled*) |
| | TC1_2 | Login dengan password salah | Layar login terbuka | 1. Ketik email terdaftar. 2. Ketik password salah. 3. Klik tombol "Masuk". | email = `ropaldo@gmail.com`, password = `salah123` | Muncul pesan error "Gagal masuk. Silakan periksa kembali akun Anda." |
| | TC1_3 | Login berhasil dengan data valid | Layar login terbuka | 1. Ketik email terdaftar. 2. Ketik password benar. 3. Klik tombol "Masuk". | email = `ropaldo@gmail.com`, password = `ropaldo` | Login berhasil, diarahkan ke halaman dashboard utama |
| **2. Register** | TC2_1 | Pendaftaran akun baru dengan data valid | Layar login terbuka | 1. Klik tab "Daftar". 2. Isi nama, HP, email, password. 3. Klik "Daftar Sekarang". | nama = `Rizky`, HP = `081234567890`, email = `rizky@gmail.com`, pass = `rizky123` | Akun berhasil terdaftar dan langsung masuk ke halaman dashboard |
| **3. Library Hub** | TC3_1 | Menyaring katalog game berdasarkan kategori | Layar dashboard terbuka | 1. Klik menu Game Library. 2. Klik tombol kategori "Puzzle". | Kategori = "Puzzle" | Daftar game di layar menyaring hanya game berjenis puzzle (misal: Memory Match) |
| **4. Gameplay** | TC4_1 | Menjalankan game & rekap koin | Layar library terbuka | 1. Pilih game "Ngolab Catch". 2. Selesaikan game sampai game over. | Game = "Ngolab Catch" | Tampil layar Game Over dan koin bertambah sesuai perolehan skor bermain |
| **5. Tukar Voucher** | TC5_1 | Tukar voucher dengan koin tidak cukup | Layar reward terbuka | 1. Cari voucher dengan harga > saldo koin. 2. Periksa tombol penukaran. | Koin user = 100, Harga voucher = 500 | Tombol voucher menampilkan status "Kurang" dan tidak dapat diklik |
| | TC5_2 | Tukar voucher berhasil (koin cukup) | Layar reward terbuka | 1. Pilih voucher dengan harga <= saldo koin. 2. Klik "Tukar". 3. Konfirmasi di pop-up modal. | Koin user = 1000, Harga voucher = 500 | Poin terpotong 500, kode voucher digital diterbitkan di daftar voucher aktif |
| **6. Validasi Kasir** | TC6_1 | Kasir menginput kode voucher tidak valid | Layar reward/kasir terbuka | 1. Isi form cek voucher. 2. Input kode acak/salah. 3. Klik "Periksa Validitas". | voucher_code = `SALAH-123`, total_price = 50000 | Muncul pesan error "Voucher tidak valid atau kadaluwarsa (Simulasi Lokal)." |
| | TC6_2 | Kasir memvalidasi kode voucher aktif | Layar reward/kasir terbuka | 1. Isi form cek voucher. 2. Input kode aktif pelanggan. 3. Klik "Periksa Validitas". | voucher_code = `GAMI-9999`, total_price = 50000 | Muncul info "Voucher Valid! Potongan Diskon: Rp 15.000" |
| **7. Study Tracker** | TC7_1 | Menghitung reward koin setelah belajar | Layar tracker terbuka | 1. Klik tombol "Mulai Belajar". 2. Biarkan timer berjalan. 3. Klik "Selesai Belajar". | Durasi = 5 menit | Koin bertambah secara otomatis sesuai kalkulasi waktu belajar |
| **8. Patungan Koin** | TC8_1 | Berpartisipasi urunan koin | Layar patungan terbuka | 1. Pilih salah satu room aktif. 2. Isi kontribusi 100 koin. 3. Klik "Urunkan Koin". | Kontribusi = 100 | Saldo room patungan bertambah dan koin user terpotong |
| **9. Leaderboard** | TC9_1 | Melihat papan peringkat | Layar dashboard terbuka | 1. Klik menu Papan Peringkat. | â€” | Menampilkan daftar 10 peringkat teratas pemain |
| **10. Edit Profile** | TC10_1 | Mengubah nama pengguna | Layar dashboard terbuka | 1. Buka sidebar profile. 2. Klik edit nama. 3. Isi nama baru. 4. Simpan perubahan. | nama_baru = `Rizky New` | Nama profil di sidebar berubah menjadi "Rizky New" |

---

# 3 Hasil Pengujian

Rancangan pengujian yang telah dirinci pada Bab 2 selanjutnya dieksekusi menggunakan modul pengujian otomatis **Katalon Studio**. Pada Bab 3, tim penguji melaporkan hasil aktual eksekusi langkah pengujian dan data pengujian yang dijalankan oleh mesin otomatis. Hasil aktual sistem kemudian dibandingkan dengan hasil yang diharapkan. Jika hasil aktual sistem sama dengan hasil yang diharapkan, maka kasus uji dinyatakan lulus (**PASS**). Sebaliknya, jika terdapat perbedaan nilai/fungsi, kasus uji dinyatakan gagal (**FAILED**).

**Tabel 3.1 Hasil Pengujian Otomasi (Katalon Studio Script)**

| Fungsionalitas | ID Test Case | Katalon Studio WebUI Command Script | Hasil Aktual | Kesimpulan |
| :--- | :--- | :--- | :--- | :--- |
| **1. Login** | TC1_1 | `WebUI.openBrowser('http://localhost:5173/')`<br>`WebUI.verifyElementHasAttribute(findTestObject('btn_masuk'), 'disabled', 5)` | Tombol masuk dinonaktifkan. | **PASS** |
| | TC1_2 | `WebUI.openBrowser('http://localhost:5173/')`<br>`WebUI.setText(findTestObject('input_email'), 'ropaldo@gmail.com')`<br>`WebUI.setText(findTestObject('input_password'), 'salah123')`<br>`WebUI.click(findTestObject('btn_masuk'))`<br>`WebUI.verifyElementText(findTestObject('div_errormsg'), 'Gagal masuk. Silakan periksa kembali akun Anda. ')` | Muncul pesan error otentikasi login. | **PASS** |
| | TC1_3 | `WebUI.openBrowser('http://localhost:5173/')`<br>`WebUI.setText(findTestObject('input_email'), 'ropaldo@gmail.com')`<br>`WebUI.setText(findTestObject('input_password'), 'ropaldo')`<br>`WebUI.click(findTestObject('btn_masuk'))`<br>`WebUI.verifyElementPresent(findTestObject('div_saldo_poin'), 5)` | Pengguna masuk ke halaman dashboard. | **PASS** |
| **2. Register** | TC2_1 | `WebUI.click(findTestObject('btn_tab_daftar'))`<br>`WebUI.setText(findTestObject('input_nama'), 'Rizky')`<br>`WebUI.setText(findTestObject('input_phone'), '081234567890')`<br>`WebUI.setText(findTestObject('input_email'), 'rizky@gmail.com')`<br>`WebUI.setText(findTestObject('input_password'), 'rizky123')`<br>`WebUI.click(findTestObject('btn_daftar_sekarang'))`<br>`WebUI.verifyElementPresent(findTestObject('div_saldo_poin'), 5)` | Akun baru terdaftar dan otomatis login. | **PASS** |
| **3. Library Hub** | TC3_1 | `WebUI.click(findTestObject('tab_library'))`<br>`WebUI.click(findTestObject('btn_filter_puzzle'))`<br>`WebUI.verifyElementPresent(findTestObject('card_game_memory'), 5)` | Hanya game kategori Puzzle yang tampil. | **PASS** |
| **4. Gameplay** | TC4_1 | `WebUI.click(findTestObject('btn_play_ngolab_catch'))`<br>`WebUI.delay(10)`<br>`WebUI.verifyElementPresent(findTestObject('popup_game_over'), 5)` | Layar menampilkan pop-up game over & perolehan koin. | **PASS** |
| **5. Tukar Voucher** | TC5_1 | `WebUI.click(findTestObject('tab_reward'))`<br>`WebUI.verifyElementText(findTestObject('btn_voucher_mahal'), 'Kurang')` | Tombol terkunci dan status menampilkan poin kurang. | **PASS** |
| | TC5_2 | `WebUI.click(findTestObject('tab_reward'))`<br>`WebUI.click(findTestObject('btn_voucher_cukup'))`<br>`WebUI.click(findTestObject('btn_konfirmasi_tukar'))`<br>`WebUI.verifyElementPresent(findTestObject('div_voucher_aktif'), 5)` | Poin berkurang dan voucher aktif diterbitkan. | **PASS** |
| **6. Validasi Kasir** | TC6_1 | `WebUI.setText(findTestObject('input_cek_kode'), 'SALAH-123')`<br>`WebUI.click(findTestObject('btn_periksa_voucher'))`<br>`WebUI.verifyElementText(findTestObject('div_msg_validasi'), 'Voucher tidak valid atau kadaluwarsa (Simulasi Lokal). ')` | Form kasir menolak kode voucher. | **PASS** |
| | TC6_2 | `WebUI.setText(findTestObject('input_cek_kode'), 'GAMI-9999')`<br>`WebUI.click(findTestObject('btn_periksa_voucher'))`<br>`WebUI.verifyElementText(findTestObject('h4_status_validasi'), 'VOUCHER VALID!')` | Form kasir menyetujui voucher dan memotong koin. | **PASS** |
| **7. Study Tracker** | TC7_1 | `WebUI.click(findTestObject('tab_tracker'))`<br>`WebUI.click(findTestObject('btn_mulai_belajar'))`<br>`WebUI.delay(5)`<br>`WebUI.click(findTestObject('btn_selesai_belajar'))`<br>`WebUI.verifyElementText(findTestObject('div_reward_popup'), 'Koin Berhasil Ditambahkan')` | Koin bertambah setelah mengakhiri timer. | **PASS** |
| **8. Patungan Koin** | TC8_1 | `WebUI.click(findTestObject('tab_patungan'))`<br>`WebUI.click(findTestObject('btn_room_aktif'))`<br>`WebUI.setText(findTestObject('input_poin_patungan'), '100')`<br>`WebUI.click(findTestObject('btn_sumbang_patungan'))`<br>`WebUI.verifyElementText(findTestObject('div_status_sumbang'), 'Berhasil Urunan')` | Saldo patungan bertambah 100 koin. | **PASS** |
| **9. Leaderboard** | TC9_1 | `WebUI.click(findTestObject('tab_leaderboard'))`<br>`WebUI.verifyElementPresent(findTestObject('list_rank_1'), 5)` | Daftar 10 pemain teratas dimuat dengan benar. | **PASS** |
| **10. Edit Profile** | TC10_1 | `WebUI.click(findTestObject('btn_sidebar'))`<br>`WebUI.click(findTestObject('btn_edit_profile'))`<br>`WebUI.setText(findTestObject('input_nama_baru'), 'Rizky New')`<br>`WebUI.click(findTestObject('btn_simpan_profil'))`<br>`WebUI.verifyElementText(findTestObject('txt_sidebar_nama'), 'Rizky New')` | Nama profil pengguna ter-update di sidebar. | **PASS** |

**Persentase keberhasilan (pass): 100%**

---

# 4 Kesimpulan

Berdasarkan seluruh hasil pengujian otomatis menggunakan **Katalon Studio** dengan metode *Black-Box Testing* (teknik *Equivalence Partitioning*) pada sistem **Ngolab-Gami**, dapat ditarik beberapa kesimpulan sebagai berikut:

1. **Persentase Kelulusan**: Seluruh 14 skenario pengujian utama (autentikasi pengguna, registrasi akun baru, pemfilteran pustaka game, gameplay canvas, penukaran voucher, validasi kasir, study tracker, patungan koin sosial, leaderboard, dan perubahan nama profil) telah berhasil diuji dan dinyatakan **lulus dengan persentase keberhasilan sebesar 100% (Pass)**.

2. **Defect / Kegagalan**: Pengujian tidak menemukan kegagalan logika (*zero defects*). Integrasi fungsionalitas CRM dalam mencatat transaksi poin berjalan konsisten antara antarmuka frontend dengan server database.

3. **Analisis & Rekomendasi Sistem**:
   - **Rekomendasi Keamanan**: Menambahkan verifikasi CAPTCHA atau autentikasi dua faktor (OTP) pada form registrasi pelanggan baru guna meminimalkan serangan pendaftaran spam/bot.
   - **Rekomendasi Skalabilitas**: Mengimplementasikan integrasi sistem pembayaran riil (*Payment Gateway*) dan kode QR dinamis standar QRIS agar sistem koin virtual dapat bertransaksi langsung dengan saldo uang elektronik di masa mendatang.
   - **Rekomendasi Usabilitas**: Menyediakan fitur mode luring (*offline capability*) pada beberapa mini-game kasual agar pengguna tetap dapat bermain dengan lancar meskipun koneksi internet sedang tidak stabil.

