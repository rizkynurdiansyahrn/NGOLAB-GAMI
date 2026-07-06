# Entity Relationship Diagram (ERD) - Ngolab-Gami

Berikut adalah Entity Relationship Diagram (ERD) untuk sistem **Ngolab-Gami** yang memetakan hubungan antar entitas berdasarkan struktur database admin dan fungsionalitas yang ada pada sistem (autentikasi pengguna, sistem gamifikasi koin/poin, voucher promo, riwayat belajar, patungan koin, dan lencana/badges).

## Diagram Visual

![Entity Relationship Diagram (ERD) Ngolab-Gami](C:/Users/Rizky Nurdiansyah/.gemini/antigravity-ide/brain/43c3cd71-7520-42d1-812b-54a48f9e227e/ngolab_gami_erd_1781676000300.png)

## Deskripsi Entitas & Relasi

1. **users** (Pengguna/Member Ngolab)
   * Menyimpan profil pengguna, tingkat level, status streak harian, dan akumulasi saldo poin/koin.
   * Relasi:
     * One-to-Many ke `user_vouchers` (Voucher yang diklaim)
     * One-to-Many ke `study_sessions` (Riwayat tracker belajar)
     * One-to-Many ke `patungan_rooms` (Sebagai pembuat room patungan)
     * One-to-Many ke `patungan_contributions` (Sebagai kontributor patungan)
     * One-to-Many ke `user_badges` (Lencana yang dimiliki)

2. **coin_promos** (Katalog Voucher & Promo)
   * Menyimpan informasi voucher yang disediakan oleh merchant/tenant di area Ngolab, seperti kategori (Food/Beverage/Merch), nama promo, deskripsi, dan harga poin.
   * Relasi:
     * One-to-Many ke `user_vouchers`

3. **user_vouchers** (Voucher yang Diklaim)
   * Entitas penghubung (transaksional) penukaran voucher oleh pengguna. Menyimpan kode unik voucher yang digunakan kasir untuk validasi dan status penggunaan (`active` / `used`).
   * Relasi:
     * Many-to-One ke `users`
     * Many-to-One ke `coin_promos`

4. **study_sessions** (Misi Belajar / Study Tracker)
   * Menyimpan durasi belajar mandiri pengguna dan jumlah koin/poin reward yang diperoleh dari aktivitas belajar tersebut.
   * Relasi:
     * Many-to-One ke `users`

5. **patungan_rooms** (Room Patungan Koin)
   * Fitur sosial di mana pengguna dapat mengumpulkan koin bersama-sama untuk target reward tertentu.
   * Relasi:
     * Many-to-One ke `users` (Pembuat room/creator)
     * One-to-Many ke `patungan_contributions`

6. **patungan_contributions** (Kontribusi Patungan)
   * Mencatat detail jumlah koin yang disumbangkan oleh pengguna tertentu ke room patungan tertentu.
   * Relasi:
     * Many-to-One ke `patungan_rooms`
     * Many-to-One ke `users`

7. **badges** (Lencana Pencapaian)
   * Menyimpan data master lencana/penghargaan yang bisa diperoleh pengguna.
   * Relasi:
     * One-to-Many ke `user_badges`

8. **user_badges** (Lencana Pengguna)
   * Entitas relasi Many-to-Many antara `users` dan `badges` untuk mencatat lencana apa saja yang sudah berhasil dibuka oleh pengguna.
   * Relasi:
     * Many-to-One ke `users`
     * Many-to-One ke `badges`

9. **admins** (Administrator/Kasir Tenant)
   * Menyimpan data kredensial pengelola atau kasir tenant untuk melakukan validasi voucher di meja kasir dan manajemen master data voucher/promo.
