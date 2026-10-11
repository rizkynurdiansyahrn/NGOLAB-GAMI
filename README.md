# Ngolab Gami

Ngolab Gami adalah aplikasi mobile-first dengan mini-game kampus dan fitur Gami-Study untuk membantu pengguna mengatur sesi fokus.

## Menjalankan aplikasi secara lokal

**Prasyarat:** Node.js 22.16 atau lebih baru.

1. Pasang dependency dengan `npm install`.
2. Salin `.env.example` menjadi `.env`, lalu isi `RAG_API_KEY` dengan API key RAG. Key hanya dibaca backend Express; jangan gunakan awalan `VITE_` atau menaruhnya di kode frontend.
3. Jalankan `npm run dev`. Perintah ini menyediakan aplikasi dan layanan Study Coach dalam satu server pengembangan.
4. Buka `http://localhost:3000` dan biarkan terminal tetap berjalan. Port 3000 harus tersedia; aplikasi tidak berpindah otomatis ke port lain.

`npm run dev:api` tetap tersedia untuk menjalankan API secara terpisah di port `PORT` (bawaan 3001). Perintah tersebut tidak diperlukan untuk penggunaan normal dengan `npm run dev`. Setelah mengubah kode server atau konfigurasi `.env`, jalankan ulang `npm run dev`.

AI Study Coach memakai [API resmi RAG](https://rag.aiones.app/guide/integration/) dari server Express project ini. `RAG_API_URL` adalah **base URL API**, misalnya `https://rag.aiones.app/api/v1`, bukan endpoint chat. Alamat root lama otomatis diarahkan ke base API tersebut. Header diatur oleh `RAG_API_AUTH_HEADER` dan `RAG_API_AUTH_PREFIX`; nilai bawaan `Authorization: Bearer <key>`. Key memerlukan izin `read` dan `write`. API Membership tidak diubah.

## Belajar dengan AI Study Coach

1. Masuk ke Gami-Study dan pilih tugas belajar. Buka panel **AI Study Coach**.
2. Tambahkan file PDF yang berisi teks, DOCX, TXT, atau Markdown (.md). Gunakan **Tempel materi** untuk catatan, isi artikel, atau transkrip. Tautan saja belum diambil otomatis; tempel isi yang ingin dipelajari.
3. Gunakan **Lihat isi materi** untuk memastikan teks terbaca. PDF hasil scan belum didukung OCR; gunakan teks hasil OCR sebagai catatan.
4. Centang sumber yang akan digunakan. Ajukan pertanyaan, minta rangkuman, atau buat soal latihan berdasarkan materi.
5. Buka tombol **Rujukan materi** di jawaban untuk melihat nama sumber, halaman/bagian, dan kutipan aslinya.

Materi dan hingga 40 pesan terakhir disimpan di IndexedDB browser per akun dan ID tugas. Materi tidak tersinkron antar perangkat. Menambah, menghapus, atau mengubah pilihan sumber memulai percakapan baru. Mengubah judul tugas tidak menghapus sumber yang sudah tersimpan untuk ID tugas tersebut. Jika penyimpanan browser tidak tersedia, materi tetap bisa dipakai selama halaman terbuka.

Batas: 8 sumber per tugas, 10 MB per file, 200 halaman PDF, 100.000 karakter per sumber, dan 300.000 karakter total. Dokumen yang melebihi batas ditolak dengan penjelasan; isinya tidak dipotong diam-diam.

Jika layanan unggah tidak tersedia saat pengembangan, hentikan proses pengembangan lama, lalu jalankan ulang `npm run dev`. Buka `http://localhost:3000/api/health`; respons JSON dengan `ok: true` menandakan layanan lokal aktif. Unggah kembali setelah server siap. Pesan layanan tidak tersedia belum menunjukkan masalah pada isi PDF.

Ekstraksi PDF menggunakan [pdf-parse](https://github.com/mehmet-kozan/pdf-parse); DOCX dibaca sebagai teks menggunakan [Mammoth](https://github.com/mwilliamson/mammoth.js). File diproses sementara dalam proses Node terpisah dengan batas waktu 30 detik, kemudian teksnya dikembalikan ke browser. File asli tidak disimpan di server. Proses terpisah menghindari pola `worker_threads` yang memiliki [laporan crash PDF.js di Windows](https://github.com/mozilla/pdf.js/issues/21934). Jika pembaca file berhenti, permintaan mengembalikan error yang dapat dibaca dan server aplikasi tetap berjalan.

## Kontrak jawaban berdasarkan sumber

- `POST /api/study-coach/sources/file`: multipart dengan satu field file bernama `file`. Mengembalikan sumber dengan `id`, `name`, `kind`, dan `sections` berisi teks serta nomor halaman PDF.
- `POST /api/study-coach`: JSON berisi `message`, `sources` terpilih, `history`, `taskTitle`, dan `durationMinutes`. Permintaan tanpa sumber ditolak.
- Server memilih hingga 18 kutipan dari sumber aktif berdasarkan relevansi pertanyaan. Dokumen singkat disertakan seluruhnya; dokumen panjang menggunakan bagian terpilih. Coach diperintahkan menyatakan ketika kutipan belum mencukupi dan tidak mengklaim telah membaca seluruh dokumen.
- Server membuat `knowledge_base_id` dan `document_id` acak yang berbeda untuk setiap pertanyaan. Kutipan terpilih dikirim sebagai teks lewat `POST /api/v1/knowledge/index`, lalu status dipantau lewat `GET /api/v1/knowledge/{document_id}` hingga `completed`.
- Server memanggil `POST /api/v1/extract` dengan `query`, `output_schema`, dan batas eksplisit `knowledge_base_id` serta `document_ids`. Materi berada dalam indeks; teks sumber tidak dimasukkan ke field `query` yang dibatasi 8.000 karakter. Respons `data.items` dipetakan ke format jawaban di bawah. Sumber di luar ID sementara tersebut ditolak.
- Pengindeksan dapat memerlukan waktu sebelum jawaban dibuat. Batas pengindeksan 120 detik dan generasi 120 detik, dengan batas total permintaan lokal 270 detik. Tampilan menunggu maksimal 300 detik dan permintaan dibatalkan ketika pengguna berpindah tugas/akun.
- Setelah permintaan selesai atau dibatalkan, server meminta penghapusan dokumen sementara lewat `DELETE /api/v1/knowledge/{document_id}`. Jika worker masih memprosesnya atau layanan tidak dapat dihubungi, penghapusan dicoba ulang setiap 30 detik. Jurnal di `.study-coach-cache/` hanya menyimpan ID acak dan waktu pembuatan agar penghapusan dapat dilanjutkan setelah server hidup kembali. Jurnal ini tidak masuk Git. Penghapusan hanya berlaku untuk dokumen sementara yang dibuat aplikasi ini; log atau metadata layanan tetap mengikuti kebijakan operator RAG.

Contoh isi jawaban yang diminta dari layanan RAG (nomor `passageId` disediakan dalam request):

```json
{
  "answer": "Penjelasan dari materi [1].",
  "notFound": false,
  "citations": [
    { "passageId": "P1", "quote": "Kutipan persis dari sumber pengguna." }
  ]
}
```

Jika informasi tidak ditemukan, layanan mengembalikan `notFound: true` dan `citations: []`. Server menampilkan pesan keterbatasan materi. Untuk jawaban biasa, server mencocokkan ID kutipan, nomor rujukan, serta teks kutipan dengan sumber terpilih sebelum mengirim jawaban dan rujukannya ke browser. Rujukan yang tidak cocok menyebabkan jawaban ditolak. Pemeriksaan ini mengonfirmasi asal kutipan, tetapi tidak membuktikan kebenaran seluruh penjelasan AI; pengguna tetap dapat memeriksa kutipan dan konteksnya.

## Membuat build dan menjalankan server produksi

Jalankan `npm run build`, lalu `npm start`. Server Express akan menyajikan file build dari folder `dist` sekaligus menyediakan endpoint `/api/study-coach`.

## Catatan privasi

File asli dikirim ke server Express project ini untuk ekstraksi teks. Saat bertanya, browser mengirim sumber aktif ke server ini; hanya bagian teks yang dipilih diindeks sementara di layanan RAG. Pertanyaan, judul tugas, durasi sesi, dan beberapa pesan terakhir dikirim saat meminta jawaban. Sumber yang tidak dicentang tidak dikirim. Materi tersimpan di browser dan tidak masuk ke database Membership. Penghapusan indeks sementara dicoba setelah pertanyaan selesai; jika layanan sedang gagal, materi dapat tetap berada di RAG sampai penghapusan berhasil. Hindari materi yang tidak boleh dikirim ke layanan AI.
