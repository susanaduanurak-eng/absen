# 🚀 PANDUAN LENGKAP DEPLOY KE HOSTINGER (PHP + MySQL + HTML/REACT)

Aplikasi **Absensi & Jurnal SMKN 1 Poco Ranaka** sekarang sudah dilengkapi dengan backend **PHP (PDO MySQL)** dan konfigurasi **Apache / LiteSpeed (.htaccess)** sehingga dapat berjalan 100% di hosting standar Hostinger (cPanel / hPanel) tanpa memerlukan server Node.js terpisah!

---

## 📋 Ringkasan File Siap Deploy
Setelah proses build selesai (`npm run build`), folder `dist/` akan memuat seluruh struktur lengkap:
* `index.html` *(Tampilan utama aplikasi React)*
* `assets/` *(File JS & CSS hasil kompilasi)*
* `api/`
  * `config.php` *(File pengaturan koneksi database MySQL Hostinger)*
  * `db.php` *(Koneksi PDO & helper)*
  * `index.php` *(Router API backend)*
  * `test.php` *(Halaman tes koneksi database & server)*
* `.htaccess` *(Routing otomatis API & Single Page Application)*

---

## 🛠️ Langkah-Langkah Deploy ke Hostinger

### LANGKAH 1: Buat Database MySQL di Hostinger
1. Masuk ke **hPanel Hostinger** (atau cPanel).
2. Buka menu **Databases** -> **MySQL Databases**.
3. Buat database baru:
   * **Nama Database**: misal `u123456789_absensi`
   * **Username**: misal `u123456789_admin`
   * **Password**: buat password yang aman (misal `PocoRanaka2026!`)
4. Klik **Create** / **Buat**.
5. Buka **phpMyAdmin** untuk database tersebut, lalu klik tab **Import**.
6. Pilih file `database.sql` dari project ini, lalu klik **Go / Kirim** untuk membuat seluruh tabel dan data awal.

---

### LANGKAH 2: Konfigurasi Database di File `api/config.php`
Buka file `api/config.php` (atau `public/api/config.php`) dan ubah bagian database sesuai data database yang Anda buat di Langkah 1:

```php
return [
    'db' => [
        'host'     => 'localhost', // Tetap localhost di Hostinger
        'port'     => '3306',
        'dbname'   => 'u123456789_absensi',            // Ganti nama DB Anda
        'username' => 'u123456789_admin',              // Ganti username DB Anda
        'password' => 'PocoRanaka2026!',               // Ganti password DB Anda
        'charset'  => 'utf8mb4',
    ],
    'app' => [
        'timezone' => 'Asia/Makassar', // WITA
    ]
];
```

---

### LANGKAH 3: Build Aplikasi Frontend
Jalankan perintah build:
```bash
npm run build
```
Perintah ini akan membuat folder **`dist/`** yang sudah berisi `index.html`, `assets/`, `api/`, dan `.htaccess`.

---

### LANGKAH 4: Upload ke Hostinger `public_html`
1. Buka menu **File Manager** di hPanel Hostinger.
2. Masuk ke folder **`public_html`** (atau sub-folder domain/subdomain Anda).
3. Hapus file `default.php` bawaan Hostinger (jika ada).
4. Upload seluruh isi yang ada di dalam folder **`dist/`** ke dalam `public_html`.
   *(Struktur di `public_html` harus langsung berisi `index.html`, folder `assets/`, folder `api/`, dan file `.htaccess`)*.

---

### LANGKAH 5: Uji Coba & Selesai! 🎉
1. Buka browser dan akses halaman diagnostik:
   ```
   https://domain-anda.com/api/test.php
   ```
   Halaman ini akan menampilkan status koneksi hijau **"Terhubung Sukses ✅"** dan daftar seluruh tabel.
2. Buka domain utama Anda:
   ```
   https://domain-anda.com/
   ```
3. Login menggunakan akun default:
   * **Admin**: Username `admin` | Password `admin123`
   * **Guru**: Username `guru` | Password `guru123`

---

## ❓ FAQ & Troubleshooting Hostinger
1. **Layar putih atau error 404 saat refresh halaman?**
   * Pastikan file `.htaccess` ter-upload ke `public_html`. Di Hostinger File Manager, aktifkan opsi *"Show Hidden Files"* untuk memastikan file `.htaccess` tidak terlewat.
2. **Foto kamera / GPS tidak aktif?**
   * Pastikan website Anda sudah menggunakan **HTTPS (SSL Aktif)** karena browser modern mewajibkan SSL untuk izin Kamera dan Geolocation GPS. Di Hostinger, Anda bisa mengaktifkan Free SSL di menu **SSL**.
