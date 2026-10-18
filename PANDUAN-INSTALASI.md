# PANDUAN INSTALASI — SIBYAN
Sistem Informasi Bayar dan Administrasi Santri · Pesantren Musholla Hidayatus Sibyan Bades

Arsitektur: **Frontend** (HTML/CSS/JS) di **GitHub Pages** ⇄ **Backend** Google Apps Script (API JSON) ⇄ **Google Sheets + Drive**. Biaya nol.

Kerjakan berurutan: **A (backend) → B (isi alamat API) → C (GitHub Pages) → D (uji)**.

---

## A. Pasang Backend (Google Apps Script)

1. Buka <https://script.google.com> → **Proyek baru**.
2. Ubah nama berkas `Code.gs` menjadi `Kode`, hapus isinya, lalu **tempel seluruh isi `Kode.gs`** (berkas terpisah yang Anda unduh).
3. Pilih fungsi **`setupAppEnvironment`** pada menu dropdown → klik ▶ **Run**.
   - Klik **Review permissions** → pilih akun Google Anda → **Advanced** → **Go to … (unsafe)** → **Allow**. (Peringatan ini normal untuk skrip buatan sendiri.)
   - Buka **Execution log**. Catat baris **Username: admin** dan **Password: …** (hanya tampil sekali).
   - ⚠️ Jalankan **hanya sekali**. Bila dijalankan lagi, sistem menolak membuat ulang (aman).
   - Hasilnya: folder Drive `📁 SIBYAN…` (berisi `Foto_Santri`, `Logo`, `Ekspor`) dan spreadsheet `🗃️ Database - SIBYAN…`.
4. **Deploy → New deployment → ⚙ Web app**
   - *Execute as*: **Me**
   - *Who has access*: **Anyone**
   - Klik **Deploy**, lalu **salin URL yang berakhiran `/exec`**.
5. ⚠️ Setiap kali Anda mengubah `Kode.gs` di kemudian hari: **Deploy → Manage deployments → ✏ Edit → Version: New version → Deploy**. Tanpa ini perubahan tidak aktif.

Lupa password admin? Ubah `PASSWORD_BARU` di dalam fungsi `resetPasswordAdmin`, jalankan sekali, lalu kembalikan nilainya ke `GANTI_DI_SINI`.

## B. Isi alamat API di frontend

1. Ekstrak `sibyan-spp-pesantren.zip`. Hasilnya **satu folder bernama `sibyan-spp-pesantren`**.
2. Buka `sibyan-spp-pesantren/js/config.js` dengan Notepad. Ganti:
   ```js
   const GAS_URL = 'ISI_DENGAN_URL_EXEC_ANDA';
   ```
   dengan URL `/exec` dari langkah A4 (tetap di dalam tanda kutip). Simpan.

## C. Terbitkan ke GitHub Pages (lewat terminal)

> **Folder kerja Anda = `sibyan-spp-pesantren`** — folder yang **langsung berisi `index.html`**. Semua perintah `git` di bawah dijalankan **di dalam folder itu**, bukan di folder induknya.

1. Pasang **Git**: <https://git-scm.com/download/win> (Windows, pengaturan default). Mac: ketik `git --version` di Terminal.
2. Buat akun <https://github.com>. Lalu **+ → New repository** → nama mis. `sibyan` → **Public** → **jangan** centang README/.gitignore/license → **Create repository**.
3. Buka folder `sibyan-spp-pesantren` di File Explorer, klik address bar, ketik `powershell`, Enter.
4. **Periksa dulu** isi folder:
   ```powershell
   dir
   ```
   Harus terlihat **`index.html`**, `css`, `js`, `assets` di baris-baris teratas. Jika yang terlihat folder `sibyan-spp-pesantren` lagi, Anda satu level terlalu tinggi — `cd sibyan-spp-pesantren` dulu.
5. Setup identitas (sekali seumur komputer):
   ```powershell
   git config --global user.name "Nama Anda"
   git config --global user.email "email@akun-github-anda.com"
   ```
6. Kirim pertama kali (satu per satu):
   ```powershell
   git init
   git add .
   git commit -m "Upload pertama"
   git branch -M main
   git remote add origin https://github.com/USERNAME/sibyan.git
   git push -u origin main
   ```
   Ganti `USERNAME` dan `sibyan` sesuai milik Anda. Saat diminta *Password*, pakai **Personal Access Token** (bukan password akun): <https://github.com/settings/tokens> → *Generate new token (classic)* → centang **repo** → salin token `ghp_…`. Saat menempel token, layar terlihat kosong — itu normal; tekan Enter.
7. Di GitHub: repo → **Settings → Pages** → *Source*: **Deploy from a branch** → Branch **main** / **(root)** → **Save**. Tunggu 1–2 menit; muncul alamat `https://USERNAME.github.io/sibyan/`.
8. **Update di kemudian hari** (mis. mengganti `config.js` atau logo), dari folder yang sama:
   ```powershell
   git add .
   git commit -m "Perbarui"
   git push
   ```
   Tampil lama? Tekan **Ctrl+Shift+R**.

## D. Konfigurasi awal & uji

1. Buka alamat situs → **Masuk Portal** → login `admin` + password dari langkah A3 → **Akun Saya** → ganti username/password.
2. **Pengaturan** → isi identitas pesantren, **kontak WhatsApp Bendahara**, unggah logo; cek **Master Kelas** (awal: Ula, Wustho, Ulya) dan **Tarif SPP** (awal: Rp 25.000/pekan semua kelas sejak 2000 — ubah sesuai kenyataan, tambahkan tarif baru dengan tanggal berlaku).
3. **Data Santri → Impor Massal** (unduh template) atau tambah satu per satu. Buat akun **Bendahara** dan akun **Wali** di **Pengaturan → Akun Pengguna** (wali dihubungkan ke NIS anaknya).
4. Checklist UAT (sesuai PRD):
   - [ ] Beranda publik tidak menampilkan alamat, kontak, nominal, foto.
   - [ ] Login wali hanya memperlihatkan anaknya; akun Bendahara tidak bisa menghapus data/mengubah tarif.
   - [ ] Tunggakan 5–10 santri sampel cocok dengan hitungan manual (termasuk yang masuk 3+ tahun lalu).
   - [ ] **Tandai Lunas Sekaligus** satu kelas penuh tanpa duplikasi (ulangi klik: yang sudah lunas dilewati).
   - [ ] Impor Excel menolak baris tidak valid dengan alasan jelas.
   - [ ] Ekspor Excel/PDF sama dengan tabel di layar; nota tercetak benar; QR kartu santri terbaca.
   - [ ] Nyaman di HP dan laptop; uji ringan simulasi hari Jumat.

## Fitur v3: Absensi, Pelanggaran, Berita, Buku SPP, WhatsApp Otomatis, Matriks Centang

> **Memperbarui dari versi sebelumnya (data aman):**
> 1. Tempel `Kode-gs.txt` baru ke `Kode.gs` di Apps Script (ganti seluruh isi).
> 2. **Wajib sekali:** pilih fungsi **`pasangTrigger`** → ▶ **Run** → *Review permissions → Allow*. (Fitur baru butuh izin tambahan: kirim WhatsApp lewat internet & pewaktu 1 menit.) Log harus menampilkan "Trigger notifikasi (1 menit) aktif".
> 3. **Deploy → Manage deployments → ✏ Edit → Version: New version → Deploy**.
> 4. Frontend: ganti berkas dari ZIP **kecuali `js/config.js`** milik Anda, lalu `git add .` → `git commit -m "v3"` → `git push`. Tekan **Ctrl+Shift+R** di peramban.
> Sheet baru (Absensi, Pelanggaran, Berita, AntrianNotif, BlastWA, CRM_Kontak, CRM_Interaksi, Libur) dibuat otomatis.

### 1. Absensi santri (menu **Absensi Santri**)
Pilih tanggal, sesi (mis. Subuh/Maghrib/Diniyah — atur di **Pengaturan → Identitas → Sesi absensi**) dan kelas. Semua santri bawaannya *Hadir*; ketuk **I** (izin), **S** (sakit), **A** (alpa) hanya untuk yang tidak hadir, lalu **Simpan**. Tab **Rekap** menampilkan hadir/izin/sakit/alpa dan persentase per bulan (bisa diekspor Excel). Wali melihat kehadiran anaknya di tab **Santri**.

### 2. Catatan pelanggaran (menu **Catatan Pelanggaran**)
Catat santri, tanggal, tingkat (ringan ±5 / sedang ±10 / berat ±25 poin, bisa diubah), jenis, uraian, sanksi. Bisa difilter per kelas/tingkat/tanggal. Bendahara dan Super Admin boleh mencatat; **hanya Super Admin yang menghapus** (tercatat di Log Audit). Wali melihat catatan anaknya sendiri.

### 3. Berita & pengumuman (menu **Berita**)
Tulis berita, pilih kategori, unggah **1 sampai 6 gambar** (dikecilkan otomatis), pilih *Terbit* atau *Draf*, boleh disematkan di atas. Berita terbit **langsung muncul bersama gambarnya** di beranda publik dan di tab **Berita** portal wali. Gambar disimpan di folder Drive `Berita` dan dibuat *publik (siapa saja yang punya tautan)* agar tampil tanpa login — **jangan unggah foto santri atau data pribadi di berita**.

### 4. Ikon mata pada password
Semua kolom password (login, Akun Saya, buat akun, token Fonnte) punya ikon 👁 untuk menampilkan/menyembunyikan.

### 5. Buku SPP PDF (20 × 14,5 cm, landscape)
- **Admin:** Data Santri → ikon *Detail* → tombol **Buku SPP (PDF)**.
- **Wali:** tab **Kuitansi** → kartu **Buku SPP** → **PDF**.
Isi: sampul, tabel per tahun (bulan × Pekan 1–4 berwarna: hijau lunas + tanggal bayar, merah tunggak, biru libur, kuning sebagian), total dibayar & sisa, ringkasan iuran, serta kolom tanda tangan wali dan bendahara. Saat mencetak, pilih ukuran kertas **Custom 200 × 145 mm** atau "Actual size".

### 6. Notifikasi WhatsApp otomatis saat ada pembayaran (Fonnte)
Pola: pembayaran → pesan masuk **antrean** → langsung dikirim (±1–2 detik) → bila gagal diulang otomatis oleh trigger 1 menit (maks. 3×). Kasir tidak pernah menunggu Fonnte.
1. Daftar di <https://fonnte.com>, hubungkan nomor WhatsApp pesantren, salin **Token**.
2. Menu **WhatsApp & Notifikasi → Konfigurasi** (Super Admin): tempel token → **Cek Perangkat** (harus *connect*) → **Kirim Tes WA** ke nomor Anda → geser saklar **AKTIF** → **Simpan Konfigurasi**.
3. **Matriks Notifikasi** mengatur kejadian mana yang mengirim WA: *Pembayaran SPP* dan *Pembayaran iuran* (aktif bawaan), *Santri alpa* dan *Pelanggaran dicatat* (mati bawaan, karena sensitif). Isi pesan bisa diubah per kejadian.
4. Token **hanya** disimpan di Script Properties, tidak pernah tertulis di spreadsheet atau tampil lagi di layar. Wali tidak dikirimi pesan bila nomor HP wali kosong/tidak valid (pembayaran tetap berhasil).
5. Tab **Antrean** memantau Menunggu / Terkirim / Gagal; tombol **Ulangi yang Gagal**.
- **Blast** (tab Blast): kirim pengingat tunggakan atau pengumuman ke banyak wali per batch **10/20/50**, jeda antarpesan 5 detik (atau 3-8). Nomor ganda, tidak valid, dan yang *opt-out* otomatis dibuang. Disarankan mulai dari batch 10. Server melanjutkan batch berikutnya tiap menit walau halaman ditutup; **Hentikan** membatalkan sisa pesan.
- **CRM Kontak**: nomor wali disinkron otomatis dari data santri (satu kontak per nomor; kakak-adik digabung). Bisa diberi tag/catatan, ditandai opt-out, dicek apakah nomor terdaftar WhatsApp, diimpor (kontak manual: ustadz/donatur), digabung bila duplikat. Mengubah nama/nomor kontak wali otomatis memperbarui data santri. Ekspor hanya Super Admin.
- Kanal email **tidak dipakai** (sesuai PRD); kolom email di CRM hanya sebagai data.
- Biaya pesan mengikuti paket Fonnte Anda. Hindari mengirim pesan yang sama ke ratusan nomor sekaligus untuk menekan risiko nomor diblokir WhatsApp.

### 7. Matriks centang pelunasan (**Laporan & Audit → Matriks Centang**, atau tombol di halaman SPP)
Tabel seluruh santri × tiap pekan (maks. 6 bulan): ✓ lunas, ✗ menunggak, ◐ sebagian, · belum jatuh tempo, L libur. Kolom **Lunas s.d.** memperlihatkan sampai pekan mana santri sudah melunasi berurutan; baris bawah menghitung jumlah lunas per pekan. Bisa difilter per kelas, diekspor Excel, dan dicetak.

### Keamanan tambahan
Teks isian yang berawalan `=`, `+`, `-`, `@` kini tidak lagi dieksekusi sebagai rumus Google Sheets.

## Fitur v3.2: Pembayaran di muka (kelebihan bayar masuk ke pekan berikutnya)

Bila santri membayar **lebih** dari yang jatuh tempo, kelebihannya otomatis mengisi pekan-pekan berikutnya, bulan demi bulan, sampai nominalnya habis — dan **tercentang** di matriks.
- **Urutan alokasi:** tunggakan terlama lebih dulu, lalu pekan berjalan, lalu pekan-pekan ke depan. Pekan yang bertepatan dengan **libur/bebas bayar dilewati** (tidak memakan kredit).
- **Cara mencatat:** cukup pakai **Bayar** di halaman SPP dengan pilihan *Bayar bebas* dan isi nominal total (mis. Rp 175.000 = 7 pekan × Rp 25.000). Boleh juga membayar pekan tertentu dengan nominal lebih besar; sisanya mengalir ke depan.
- **Memantau sampai kapan dibayar:**
  - **Matriks Centang** otomatis memanjang ke bulan-bulan yang sudah dibayar di muka (maks. 3 bulan ke depan). Centang biru-hijau (✓) = dibayar di muka; ◐ = pekan terakhir yang baru terbayar sebagian. Kolom **Lunas s.d.** menunjukkan pekan terakhir yang lunas, mis. *Pekan 3 November 2026 (+4 pekan di muka)*.
  - Halaman **SPP Mingguan**: pilih bulan depan untuk melihat sel **Di muka**; kolom Tunggakan menampilkan *s.d. …* bagi santri yang lunas. Anda juga bisa memakai **Tandai Lunas Sekaligus** untuk pekan di bulan depan.
  - **Nota** dan **WhatsApp pembayaran** memuat baris *Lunas sampai: …* (variabel baru `{lunas_sampai}`).
  - **Portal wali** menampilkan banner *Dibayar di muka sampai …*; **Buku SPP PDF** memuat bulan-bulan yang sudah dibayar di muka (ditandai "(muka)").
- Pembayaran di muka **tidak dihitung sebagai tunggakan** dan tidak mengubah laporan kas (pemasukan tetap dicatat pada tanggal bayar).
- Bila tarif berubah, pekan di muka yang sudah terlanjur terhitung ikut dihitung ulang memakai tarif yang berlaku pada bulan tersebut (kredit tetap Rp yang sama).

## Fitur v3.1: Aktivitas Wali, ajakan memasang aplikasi, pembaruan otomatis, diagnosa

### Aktivitas Wali (menu **Aktivitas Wali**)
Memantau siapa yang sudah login dan membuka tagihan/kuitansi anaknya. Tabel per akun wali: terakhir login, terakhir mengecek tagihan (merah/kuning bila lama), jumlah membuka, perangkat (Android/iPhone/…) dan apakah **aplikasi sudah dipasang**. Kartu ringkasan (bisa diklik sebagai filter): belum pernah login, cek tagihan 7 hari, **menunggak & belum cek** (prioritas penagihan), pemasang aplikasi. Urutan bawaan: wali yang menunggak dan belum mengecek berada di atas. Tombol **WA** per baris membuka WhatsApp dengan pesan ajakan/pengingat (berisi username, bukan password); tombol **Blast** di atas mengirim ke banyak wali sekaligus. Profil santri juga menampilkan kapan wali terakhir mengecek tagihan.
- Dicatat server saat wali login dan membuka halaman (pembukaan berulang dalam 10 menit dihitung satu kali). Pengunjung beranda publik anonim, jadi tidak tercatat.
- Perlu akun wali yang sudah dibuat di Pengaturan → Akun Pengguna.

### Popup ajakan memasang aplikasi (untuk wali)
Setelah wali login dan belum memasang aplikasi, muncul popup **"Pasang SIBYAN di HP Anda"** (sekali per sesi) dengan tombol **Pasang Sekarang** (Android/Chrome langsung memunculkan dialog pasang; iPhone/lainnya menampilkan langkah manual), **Nanti saja** (muncul lagi 7 hari kemudian) dan **Jangan tampilkan lagi**. Tidak muncul bila aplikasi sudah dipasang.

### Pembaruan otomatis & pemeriksa versi
- Semua berkas diberi nomor versi (`?v=3.2.0`) dan service worker selalu memeriksa pembaruan ke server, sehingga versi baru tidak lagi tertahan di cache. Bila ada versi baru, muncul banner **"Muat ulang sekarang"**.
- Bila server Apps Script masih versi lama, admin melihat banner kuning beserta caranya memperbarui. Versi tampil di sidebar (Aplikasi vX · Server vY).
- **`cek.html`** (buka `alamat-situs/cek.html`) adalah pemeriksa mandiri: mengecek setiap berkas di GitHub Pages, versi `index.html`, versi server Apps Script, dan isi cache peramban — lalu menuliskan masalahnya dalam bahasa sederhana. Tombol **Bersihkan cache & muat ulang** tersedia di sana. Halaman ini tetap berfungsi walau aplikasi utama masih versi lama, jadi **unggah `cek.html` lebih dulu** bila menu baru tidak muncul.

### Jika menu/fitur baru tidak muncul — urutan pemeriksaan
1. Buka `https://USERNAME.github.io/NAMA-REPO/cek.html` dan ikuti daftar masalahnya.
2. **Cara paling aman mengganti seluruh isi repo** (PowerShell, di folder repo yang berisi `index.html`):
```powershell
Copy-Item js\config.js ..\config.backup.js              # simpan config Anda
Get-ChildItem -Exclude .git | Remove-Item -Recurse -Force # kosongkan isi (folder .git aman)
Copy-Item -Recurse -Force "C:\LOKASI\ZIP-BARU\sibyan-spp-pesantren\*" .
Copy-Item ..\config.backup.js js\config.js -Force        # kembalikan config
git add -A
git commit -m "Update v3.1"
git push
git log --oneline -3                                      # pastikan commit terbaru tampil
```
3. Di github.com, buka repo → folder `js`: harus ada `pages-wa.js`, `pages-aktivitas.js`, `pages-absensi.js`, `pages-berita.js`. Tab **Actions** harus hijau (build Pages selesai).
4. Server: tempel `Kode-gs.txt` terbaru → jalankan `pasangTrigger` → Deploy **New version**.
5. HP/komputer: buka `cek.html` → **Bersihkan cache & muat ulang**.

### Fonnte rinci
Lihat berkas **PANDUAN-FONNTE.md** (langkah menghubungkan, arti tiap pengaturan, jam kirim, batas harian, uji, pemecahan masalah).

## Fitur: Tambah Kelas & Libur / Bebas Bayar (Super Admin)

**Tambah kelas** — dua cara:
- Menu **Pengaturan → Master Kelas → Tambah**; atau
- Langsung dari form santri: tautan **+ Kelas baru** di samping pilihan kelas.
Kelas baru otomatis memakai tarif "Semua kelas"; atur tarif khusus di **Pengaturan → Tarif SPP**.

**Libur & bebas bayar** — menu **Pengaturan → Libur & Bebas Bayar → Tambah Libur**:
- Isi *Keterangan* (mis. "Libur Ramadhan & Idul Fitri"), pilih *semua kelas* atau satu kelas, lalu tanggal *Mulai* dan *Sampai*.
- Pintasan **satu bulan penuh**: pilih bulannya, tanggal terisi otomatis. Untuk rentang lintas bulan (mis. 1 Ramadhan s.d. Idul Fitri) isi tanggalnya langsung.
- Libur satu hari: isi Mulai = Sampai.
- **Hanya hari Jumat dalam rentang** yang dibebaskan. Tagihan, tunggakan, dasbor, dan portal wali dihitung ulang otomatis; di tabel SPP muncul label **Libur**; "Tandai Lunas Sekaligus" melewati santri pada pekan libur.
- Menghapus libur mengembalikan tagihan seperti semula. Pembayaran yang sudah masuk pada pekan yang kemudian dibebaskan tidak hilang, dihitung sebagai kredit untuk tunggakan terlama.

**Memperbarui dari versi sebelumnya:** tempel `Kode.gs` yang baru → **Deploy → Manage deployments → ✏ Edit → New version → Deploy**. Sheet `Libur` dibuat otomatis, data lama tidak berubah. Untuk frontend, ganti berkas lalu `git add .` → `git commit -m "Fitur libur"` → `git push` (pertahankan `js/config.js` Anda yang sudah berisi GAS_URL).

## Cara kerja hitungan tagihan (asumsi PRD yang diterapkan)
- Satu bulan = **4 angsuran**; angsuran ke-*k* jatuh tempo pada **Jumat ke-*k*** bulan itu.
- Tagihan dihitung **sejak bulan masuk** santri sampai bulan berjalan; angsuran dianggap menunggak mulai **sehari setelah** hari Jumat jatuh tempo.
- **Tunggakan = tagihan jatuh tempo − total dibayar.** Pembayaran "bebas" (angsuran 0) dialokasikan otomatis ke tunggakan **terlama**.
- Perubahan tarif berlaku mulai tanggalnya; periode lalu tetap memakai tarif lama.
- Kelas yang tercatat adalah kelas **saat ini** (belum ada riwayat kenaikan kelas).

## Printer thermal Bluetooth
Nota memakai format struk 58 mm. Di Android, pasang aplikasi pencetak (mis. **RawBT**), sambungkan printer, lalu tekan **Cetak Thermal** dan pilih printer pada dialog cetak.

## Pemecahan masalah singkat
| Gejala | Penyebab / solusi |
|---|---|
| Situs 404 padahal git sukses | `git init` dijalankan di folder induk. Ulangi dari folder yang berisi `index.html` (`git push -u origin main --force` setelah `git init` baru). |
| Halaman tanpa warna / CSS 404 | Struktur folder rusak (mis. upload lewat web GitHub). Selalu push lewat terminal. |
| "GAS_URL belum diisi" | Edit `js/config.js`, lalu `git add . && git commit -m "config" && git push`. |
| "Tidak dapat terhubung ke server" | Deploy belum diset *Anyone*, atau lupa **New version** setelah ubah kode. |
| Login selalu salah | Gagal 5× dikunci 10 menit. Tunggu, atau pakai `resetPasswordAdmin`. |
| Error CORS di Console | Pastikan URL berakhiran `/exec` (bukan `/dev`) dan akses *Anyone*. |
| Notifikasi WA tidak terkirim | Cek tab Antrean. Pastikan token terisi, saklar AKTIF, perangkat Fonnte *connect*, dan fungsi `pasangTrigger` sudah dijalankan. |
| Server lambat setelah ± puluhan ribu transaksi | Arsipkan transaksi tahun lama ke spreadsheet lain. |
