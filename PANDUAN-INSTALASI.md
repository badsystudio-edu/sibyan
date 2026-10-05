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
| Server lambat setelah ± puluhan ribu transaksi | Arsipkan transaksi tahun lama ke spreadsheet lain. |
