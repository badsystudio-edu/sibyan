# PANDUAN FONNTE — Notifikasi WhatsApp SIBYAN (rinci)

Dokumen ini menjelaskan cara menghubungkan SIBYAN dengan **Fonnte** (layanan pengirim WhatsApp) dan arti setiap pengaturannya.
Langkah di sisi Fonnte mengikuti dokumentasi resmi di <https://docs.fonnte.com>; tampilan dasbor Fonnte dapat berubah sewaktu-waktu, jadi bila ada menu yang berbeda, ikuti petunjuk di layar Fonnte.

---

## 0. Cara kerja singkat
1. Bendahara mencatat pembayaran → SIBYAN menaruh pesan di **antrean** (kasir tidak menunggu).
2. Pesan langsung dikirim ke Fonnte (sekitar 1–2 detik). Bila gagal (mis. perangkat sedang terputus), **diulang otomatis maksimal 3 kali** oleh trigger 1 menit, lalu berstatus *Gagal* (bisa diulang manual).
3. Fonnte mengirim lewat **nomor WhatsApp pesantren** yang Anda tautkan seperti WhatsApp Web.

Yang Anda butuhkan: akun Fonnte, **satu nomor WhatsApp** (disarankan nomor khusus pesantren, bukan nomor pribadi), dan paket/kuota Fonnte. Setiap pesan memakai 1 kuota; cek jenis paket, harga, dan kuota terbaru di fonnte.com.

---

## 1. Menghubungkan nomor WhatsApp ke Fonnte
1. Buka <https://fonnte.com>, **daftar** dan masuk ke dasbor.
2. Buka menu **Device** → **Add Device**. Isi *nama perangkat* (mis. "SIBYAN Hidayatus Sibyan") dan **nomor WhatsApp** pesantren (format 08… atau 628…).
3. Klik **Connect**. Tunggu kode QR tampil.
4. Di **HP** pemilik nomor: WhatsApp → **Perangkat tertaut** (*Linked devices*) → **Tautkan perangkat** → **pindai QR** di layar komputer (sama seperti memakai WhatsApp Web).
5. Status perangkat di Fonnte berubah menjadi **connect**. Biarkan HP tetap hidup dan memiliki internet; jangan keluar dari "Perangkat tertaut".

## 2. Mengambil token
1. Di menu **Device**, pada baris perangkat Anda ada **Token**. Klik token itu — otomatis **tersalin** ke clipboard.
2. **Gunakan token perangkat**, *bukan* "account token" (token akun dipakai Fonnte untuk menambah/menghapus perangkat lewat API dan tidak cocok untuk mengirim pesan).
3. Token = kunci untuk mengirim pesan memakai nomor Anda. **Jangan dibagikan** lewat chat/screenshot. Jika bocor, buat ulang token di dasbor Fonnte.

## 3. Memberi izin & memasang pengirim otomatis (sekali)
Di editor Apps Script, pilih fungsi **`pasangTrigger`** → ▶ **Run** → *Review permissions → Allow*. Log menampilkan "Trigger notifikasi (1 menit) aktif". Lalu **Deploy → Manage deployments → ✏ Edit → New version → Deploy**.

## 4. Mengisi pengaturan di SIBYAN
Menu **WhatsApp & Notifikasi → Konfigurasi** (khusus Super Admin). Panel **Kesiapan** di atas halaman menampilkan centang untuk: token terisi, perangkat terhubung, trigger aktif, saklar aktif.

| Pengaturan | Isi / arti | Saran awal |
|---|---|---|
| **Token Fonnte** | Tempel token perangkat. Disimpan di server (Script Properties), tidak pernah tampil lagi — hanya tampil tersamar (mis. `AbCd••••xyz`). Kosongkan bila tidak ingin mengubah. | — |
| **Saklar AKTIF** | Menyalakan notifikasi otomatis. Mati = tidak ada pesan otomatis yang diantre. | Nyalakan setelah tes berhasil |
| **Jeda antarpesan (detik)** | Jarak waktu antarpesan dalam satu batch. Boleh rentang acak, mis. `5-10`. Jeda acak terlihat lebih alami. | `5-10` |
| **Ukuran batch bawaan blast** | Berapa pesan per putaran blast: 10, 20, atau 50. | `10` (naikkan bertahap) |
| **Alamat aplikasi** | Alamat situs untuk variabel `{link}` pada pesan. Terisi otomatis dari alamat Anda. | Biarkan |
| **Jam kirim (mulai–selesai)** | Di luar jam ini, *blast* dan notifikasi *absensi/pelanggaran* **ditunda** sampai jam kirim berikutnya. **Notifikasi pembayaran tetap dikirim kapan saja** (transaksional). | `06:00` – `20:00` |
| **Batas pesan per hari** | Pengaman: setelah tercapai, pengiriman berhenti sampai esok hari (20–5000). | `300` |
| **Deteksi otomatis nomor WA** | Mengecek kontak baru apakah nomornya terdaftar WhatsApp (memakai fitur *validate* Fonnte; perangkat harus terhubung). | Aktif |

Tombol di panel konfigurasi:
- **Cek Perangkat** — memeriksa status perangkat (harus *connect*), nomor, paket, kuota, tanggal berlaku.
- **Kirim Tes WA** — mengirim pesan tes ke nomor yang Anda isi.
- **Pasang Trigger 1 Menit** — memasang pengirim otomatis bila belum aktif.

### Matriks notifikasi (kejadian → kirim WA?)
| Kejadian | Bawaan | Keterangan |
|---|---|---|
| Pembayaran SPP diterima | **Aktif** | Dikirim ke wali: jumlah, tanggal, no. transaksi, sisa tunggakan |
| Pembayaran iuran diterima | **Aktif** | Dikirim ke wali |
| Santri alpa | Mati | Sensitif; aktifkan sesuai kebijakan |
| Pelanggaran dicatat | Mati | Sensitif; sebaiknya disampaikan langsung dahulu |

Tombol **Ubah pesan** membuka isi pesan. Variabel yang tersedia (ditulis dengan kurung kurawal):

| Variabel | Isi |
|---|---|
| `{nama}` | Nama wali (bila kosong: "Bapak/Ibu") |
| `{nama_santri}` `{nis}` `{kelas}` | Data santri |
| `{uraian}` `{jumlah}` `{tanggal}` `{trx}` `{sisa}` | Rincian pembayaran (jumlah tanpa "Rp", sisa = tunggakan SPP setelah bayar) |
| `{lunas_sampai}` | Sampai pekan mana SPP sudah lunas, termasuk pembayaran di muka (mis. *Pekan 3 November 2026*) |
| `{sesi}` | Sesi absensi |
| `{tingkat}` `{jenis}` `{sanksi}` | Data pelanggaran |
| `{total}` `{rincian}` | Total & rincian tunggakan (untuk blast) |
| `{username}` `{link}` | Nama pengguna wali & alamat aplikasi |
| `{institusi}` | Nama pesantren |

Gunakan `*teks*` untuk huruf tebal di WhatsApp. **Jangan menulis password wali di pesan.**

## 5. Uji menyeluruh (lakukan sebelum dipakai)
1. **Cek Perangkat** → status *connect*.
2. **Kirim Tes WA** ke nomor Anda → pesan tiba.
3. Buat satu santri uji dengan **nomor HP wali = nomor Anda**, catat pembayaran → pesan "Pembayaran SPP diterima" tiba dalam beberapa detik.
4. Buka tab **Antrean** → status *Terkirim*.
5. Setelah itu hapus/ubah data uji.

## 6. Memantau antrean (tab **Antrean**)
- **Menunggu** — belum dikirim (atau menunggu jam kirim/batas harian).
- **Terkirim**, **Gagal** (3× percobaan gagal; alasan tampil), **Batal** (blast dihentikan).
- **Proses Sekarang** — memicu pengiriman segera. **Ulangi yang Gagal** (Super Admin) — mengantre ulang pesan gagal setelah masalah diperbaiki.

## 7. Blast (pesan massal) — tab **Blast**
1. **Pilih sasaran**: wali yang menunggak, semua wali, *wali yang belum pernah login*, *tidak aktif > 14 hari*, *menunggak & belum cek tagihan*, atau kontak CRM (segmen/tag). Klik **Muat Penerima**.
2. (Opsional) **Deteksi Nomor WA** agar hanya mengirim ke nomor terdaftar WhatsApp.
3. Tulis pesan dengan variabel, lihat **pratinjau**, pilih **batch 10/20/50** dan **jeda**.
4. **Mulai Blast**. Nomor ganda, tidak valid, dan *opt-out* otomatis dibuang. Server melanjutkan satu batch per menit walau halaman ditutup; tombol **Hentikan** membatalkan sisa pesan.

**Praktik aman agar nomor tidak dibatasi WhatsApp** (saran umum, bukan jaminan):
- Mulai dari **batch 10**, jeda **≥ 5 detik**, naikkan bertahap.
- Kirim ke wali yang memang mengenal pesantren; hormati yang meminta berhenti (**opt-out** di CRM).
- Hindari pesan identik berisi tautan ke ratusan nomor sekaligus; sertakan nama wali/santri (variabel) agar pesan personal.
- Patuhi jam kirim; jangan mengirim malam hari.
- Hindari mengirim berulang ke nomor yang tidak merespons.

## 8. Pemecahan masalah
| Gejala | Penyebab & solusi |
|---|---|
| "device disconnected" / perangkat tidak *connect* | HP mati/tanpa internet, atau tautan perangkat terlepas. Buka dasbor Fonnte → hubungkan ulang dengan memindai QR. Pesan yang gagal bisa diulang lewat **Ulangi yang Gagal**. |
| "token invalid" | Token salah/kedaluwarsa, atau yang ditempel adalah token akun. Salin ulang **token perangkat**. |
| Pesan tertahan di **Menunggu** | Cek: saklar AKTIF? di luar *jam kirim*? *batas harian* tercapai? trigger aktif? Klik **Proses Sekarang** untuk melihat pesan info. |
| Pembayaran tercatat tapi wali tidak dikirimi | Nomor HP wali kosong/tidak valid (harus 08xxxxxxxxxx), event dimatikan di matriks, atau saklar mati. Pembayaran tetap sah. |
| Status *Gagal* terus | Lihat kolom alasan di tab Antrean. Umumnya perangkat terputus, kuota habis, atau nomor tujuan tidak terdaftar WhatsApp. |
| "Deteksi WA gagal" | Perangkat harus *connect*; fitur *validate* mungkin tidak tersedia di paket Anda. Deteksi hanya pelengkap, tidak wajib. |
| Kuota habis | Tambah paket di fonnte.com, lalu **Ulangi yang Gagal**. |
| Tombol Pasang Trigger gagal | Jalankan fungsi `pasangTrigger` dari editor Apps Script (memberi izin), lalu Deploy New version. |

## 9. Keamanan & privasi
- Token hanya di server; tidak tertulis di spreadsheet, tidak tampil di layar. Ganti token bila perangkat/akun berpindah tangan.
- Pesan notifikasi memuat nama anak dan nominal: pastikan **nomor HP wali benar** agar tidak terkirim ke orang lain.
- Notifikasi absensi/pelanggaran bersifat sensitif — aktifkan hanya bila disepakati pengurus.
- Kontak yang meminta berhenti ditandai **Opt-out** di CRM (blast tidak lagi dikirim; notifikasi transaksi pembayaran tetap dikirim).
