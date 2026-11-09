# Alur Aplikasi (Versi Sederhana)

Penjelasan ini memakai bahasa sehari-hari, tanpa istilah teknis.
Cocok untuk dijelaskan kepada pengguna baru atau orang awam.

Bayangkan aplikasinya seperti ini: **pegawai mengajukan perjalanan dinas,
atasan dan HRD menyetujui, lalu bagian keuangan mengganti uang yang sudah
dikeluarkan.**

---

## 1. Alur Umum — Mulai dari Login

![1. Alur Umum — Mulai dari Login](images/simple-1-1-alur-umum-mulai-dari-login.png)

```mermaid
flowchart TD
    A([Buka aplikasi]) --> B[Login dengan email & sandi]
    B --> C{Login berhasil?}
    C -- Tidak --> D[Periksa email & sandi] --> B
    C -- Ya --> E[Lihat halaman utama]
    E --> F{Siapa Anda?}
    F --> G[Admin]
    F --> H[Atasan]
    F --> I[HRD]
    F --> J[Pegawai]
    F --> K[Keuangan]
    H --> L([Menu yang muncul<br/>sesuai jabatan])
    I --> L
    J --> L
    K --> L
    G --> L
```

Intinya: **satu aplikasi, tapi menu yang muncul berbeda-beda** tergantung
jabatan. Pegawai tidak melihat menu atasan, dan sebaliknya.

---

## 2. Alur Perjalanan Dinas (inti aplikasi)

![2. Alur Perjalanan Dinas (inti aplikasi)](images/simple-2-2-alur-perjalanan-dinas-inti-aplikasi.png)

```mermaid
flowchart TD
    A([Pegawai mau perjalanan dinas]) --> B["Isi pengajuan:<br/>tujuan, tanggal, perkiraan biaya"]
    B --> C[Kirim pengajuan]
    C --> D[Atasan memeriksa]
    D --> E{Atasan setuju?}
    E -- Tidak --> F[Pegawai perbaiki pengajuan]
    F --> C
    E -- Ya --> G[HRD memeriksa]
    G --> H{HRD setuju?}
    H -- Tidak --> F
    H -- Ya --> I[Perjalanan resmi disetujui]
    I --> J[Pegawai berangkat]
    J --> K[Perjalanan selesai]
    K --> L[Buat laporan]
    L --> M([Selesai])
```

Kuncinya: **butuh dua persetujuan** — atasan dulu, lalu HRD. Kalau salah satu
menolak, pengajuan dikembalikan untuk diperbaiki dan dikirim ulang.

---

## 3. Alur Uang — Pengeluaran & Penggantian Dana

![3. Alur Uang — Pengeluaran & Penggantian Dana](images/simple-3-3-alur-uang-pengeluaran-penggantian-dana.png)

```mermaid
flowchart TD
    A([Pegawai selesai perjalanan]) --> B["Catat pengeluaran<br/>(transport, hotel, makan)"]
    B --> C[Foto/unggah bukti atau nota]
    C --> D[Ajukan penggantian dana]
    D --> E[Bagian keuangan memeriksa]
    E --> F{Bukti lengkap?}
    F -- Tidak --> G[Lengkapi bukti] --> D
    F -- Ya --> H[Dana disetujui]
    H --> I[Dana dibayarkan ke pegawai]
    I --> J([Selesai])
```

Kuncinya: **tanpa bukti, dana tidak bisa dibayar.** Bagian keuangan
memeriksa dulu sebelum mentransfer.

---

## 4. Tugas Masing-masing Pengguna

### Admin — pengelola utama
![Admin — pengelola utama](images/simple-4-admin-pengelola-utama.png)

```mermaid
flowchart LR
    A([Login Admin]) --> B[Dashboard]
    B --> C[Kelola pengajuan perjalanan]
    B --> D[Kelola persetujuan]
    B --> E[Atur pemesanan tiket & hotel]
    B --> F[Kelola penggantian dana]
    B --> G[Atur pengguna & anggaran]
    B --> H[Lihat semua laporan]
```

### Atasan — penyetuju pertama
![Atasan — penyetuju pertama](images/simple-5-atasan-penyetuju-pertama.png)

```mermaid
flowchart LR
    A([Login Atasan]) --> B[Dashboard]
    B --> C[Lihat pengajuan anggota tim]
    C --> D{Setuju atau tolak?}
    D -- Setuju --> E[Diteruskan ke HRD]
    D -- Tolak --> F[Dikembalikan ke pegawai]
    B --> G[Pantau perjalanan tim]
    B --> H[Lihat laporan tim]
```

### HRD — penyetuju terakhir
![HRD — penyetuju terakhir](images/simple-6-hrd-penyetuju-terakhir.png)

```mermaid
flowchart LR
    A([Login HRD]) --> B[Dashboard]
    B --> C[Setujui pengajuan tahap akhir]
    B --> D[Lihat data pegawai]
    B --> E[Pantau perjalanan dinas]
    B --> F[Lihat laporan]
```

### Pegawai — pelaksana perjalanan
![Pegawai — pelaksana perjalanan](images/simple-7-pegawai-pelaksana-perjalanan.png)

```mermaid
flowchart LR
    A([Login Pegawai]) --> B[Dashboard]
    B --> C[Buat pengajuan perjalanan]
    B --> D[Pantau status pengajuan]
    B --> E[Catat pengeluaran & ajukan dana]
    B --> F[Lihat laporan saya]
```

### Keuangan — pembayar dana
![Keuangan — pembayar dana](images/simple-8-keuangan-pembayar-dana.png)

```mermaid
flowchart LR
    A([Login Keuangan]) --> B[Dashboard]
    B --> C[Lihat daftar pengeluaran]
    B --> D[Periksa & bayar penggantian dana]
    B --> E[Lihat laporan keuangan]
```

---

## Ringkasan Sekali Baca

| Siapa | Tugas utama | Contoh kalimat |
| --- | --- | --- |
| **Pegawai** | Mengajukan perjalanan & mencatat pengeluaran | "Saya mau dinas ke Surabaya." |
| **Atasan** | Menyetujui pengajuan anggota tim | "Saya setujui pengajuan ini." |
| **HRD** | Persetujuan terakhir & data pegawai | "Pengajuan ini saya setujui final." |
| **Keuangan** | Memeriksa bukti & membayar | "Bukti lengkap, dana saya transfer." |
| **Admin** | Mengelola semuanya | "Saya atur pengguna dan anggaran." |
