# Alur Aplikasi Eduabsen Travel App

Dokumen ini menjelaskan alur frontend (Nuxt) aplikasi perjalanan dinas:
autentikasi & otorisasi, siklus hidup perjalanan, pengeluaran/pembayaran,
pemesanan, dan navigasi per peran (role).

> Catatan: diagram menggambarkan **perilaku yang terlihat di frontend**.
> Perubahan status final (mis. penomoran level approval) dikendalikan oleh API.

## Peran (Role)

| Role | Ringkasan tugas |
| --- | --- |
| `admin` | Mengelola pengajuan, persetujuan, pemesanan, reimbursement, pagu anggaran, pengguna, log aktivitas, laporan. |
| `atasan` | Menyetujui/menolak pengajuan perjalanan tim (approval level pertama). |
| `hrd` | Persetujuan akhir, data pegawai, memantau pelaksanaan perjalanan, laporan. |
| `pegawai` | Membuat rencana perjalanan, mengelola pengeluaran & pembayaran, pelaksanaan. |
| `finance` | Memverifikasi & membayar pengeluaran, laporan keuangan. |

---

## 1. Autentikasi, Sesi, dan Routing

![1. Autentikasi, Sesi, dan Routing](images/alur-1-autentikasi-sesi-dan-routing.png)

```mermaid
flowchart TD
    Start([Pengguna membuka aplikasi]) --> Root["/"] --> Dash["/dashboard"]
    Dash --> Auth{Sudah login?<br/>localStorage}

    Auth -- Tidak --> Login["/admin/login"]
    Auth -- Ya --> Init["initAuth() baca user + token"]

    Login --> Pilih{Daftar akun?}
    Pilih -- Ya --> Register["/admin/register<br/>(akun dibuat admin)"]
    Register --> Login
    Pilih -- Tidak --> Post["POST /login"]

    Post --> Ok{Berhasil?}
    Ok -- Tidak --> Err["Tampilkan pesan error"]
    Err --> Login
    Ok -- Ya --> Save["Simpan user + token<br/>ke localStorage"]

    Init --> MW
    Save --> MW

    MW{{Middleware auth.global.ts}}
    MW --> Pub{Rute publik?<br/>/admin/login, /admin/register}
    Pub -- "Belum login, bukan rute publik" --> Login
    Pub -- "Sudah login, rute publik" --> RoleHome
    Pub -- Bukan --> Expired{password_expired?}

    Expired -- Ya --> Set["/admin/pengaturan<br/>(wajib ganti password)"]
    Expired -- Tidak --> Allowed{Rute diizinkan<br/>untuk role ini?}
    Allowed -- Tidak --> RoleHome
    Allowed -- Ya --> Page([Halaman ditampilkan])

    RoleHome{{ROLE_ROUTES}}
    RoleHome --> R1["/admin/dashboard"]
    RoleHome --> R2["/finance/dashboard"]
    RoleHome --> R3["/hrd/dashboard"]
    RoleHome --> R4["/pegawai/dashboard"]
    RoleHome --> R5["/atasan/dashboard"]
```

Keluar: tombol logout memanggil `logout()` → hapus sesi lokal → `POST /logout` → kembali ke `/admin/login`.

---

## 2. Siklus Hidup Perjalanan Dinas (end-to-end)

Status perjalanan: `draft → diajukan → disetujui → berjalan → selesai → lengkap`
(dapat juga berakhir `ditolak`).

![2. Siklus Hidup Perjalanan Dinas (end-to-end)](images/alur-2-siklus-hidup-perjalanan-dinas-end-to-end.png)

```mermaid
flowchart TD
    A(["Pegawai buka<br/>/pegawai/rencana"]) --> B["Isi tujuan, tanggal,<br/>keperluan, estimasi, kebutuhan"]
    B --> C["createTrip() → status: draft"]
    C --> D["submitTrip() → status: diajukan"]
    D --> Q{"Antrean persetujuan<br/>berjenjang"}

    Q --> Aug["Atasan: /atasan/persetujuan<br/>Tinjau → Setujui / Tolak"]
    Aug -- Tolak --> R["status: ditolak<br/>catatan wajib"]
    R -. "revisi, lalu ajukan ulang" .-> D

    Aug -- Setuju --> Q2["HRD: /hrd/persetujuan<br/>Keputusan akhir"]
    Q2 -- Tolak --> R
    Q2 -- Setuju --> E["status: disetujui"]

    E --> F["startTrip() → status: berjalan"]
    F --> G["Pelaksanaan<br/>/hrd/pelaksanaan · /hrd/detail-perjalanan"]
    G --> H["finishTrip() → status: selesai"]
    H --> I["complete() → status: lengkap"]
    I --> J(["Laporan dan arsip"])

    subgraph Admin["Admin juga dapat melakukan semua transisi"]
        K["/admin/pengajuan-perjalanan<br/>/admin/persetujuan<br/>/admin/DetailPerjalanan"]
    end
```

Aksi perjalanan yang tersedia di `useTrips` / `useApprovals`:
`submit`, `approve`, `reject`, `start`, `finish`, `complete`, `archive`,
`unarchive`, `duplicate`, unggah dokumen, unduh SPT/SPD, unduh kalender (`.ics`).

---

## 3. Pengeluaran & Pembayaran (Reimbursement)

![3. Pengeluaran & Pembayaran (Reimbursement)](images/alur-3-pengeluaran-pembayaran-reimbursement.png)

```mermaid
flowchart TD
    A(["Pegawai pilih perjalanan<br/>/pegawai/pengeluaran"]) --> B["createExpense()<br/>jenis, jumlah, tanggal"]
    B --> C["uploadReceipt()<br/>unggah bukti"]
    C --> D["requestPayment()<br/>POST /trips/:id/payments"]
    D --> P1["status pembayaran: diajukan"]

    P1 --> V{"Finance verifikasi<br/>/finance/pembayaran"}
    V -- rejectPayment --> P2["status: ditolak"]
    V -- verifyPayment --> P3["status: disetujui"]
    P3 --> Pay["payPayment()<br/>metode + no. referensi + bukti"]
    Pay --> P4["status: dibayar"]

    subgraph Sumber["Sumber input pengeluaran"]
        S1["/admin/reimbursement"]
        S2["/admin/DetailPerjalanan"]
    end
```

Pagu anggaran per departemen/periode dikelola di `/admin/anggaran`.

---

## 4. Pemesanan (Booking)

Jenis: tiket pesawat, tiket kereta, hotel, transport lokal, lainnya.

![4. Pemesanan (Booking)](images/alur-4-pemesanan-booking.png)

```mermaid
flowchart LR
    B1["dipesan"] -- konfirmasi --> B2["dikonfirmasi"]
    B1 -- batal --> B3["dibatalkan"]
    B2 -- selesai --> B4["selesai"]
    B2 -- batal --> B3
```

Dibuat/diubah dari `/admin/pemesanan` (dan opsi booking pada halaman pengeluaran pegawai).

---

## 5. Navigasi per Role

![5. Navigasi per Role](images/alur-5-navigasi-per-role.png)

```mermaid
flowchart LR
    Root([Aplikasi]) --> Admin["admin"]
    Root --> Atasan["atasan"]
    Root --> HRD["hrd"]
    Root --> Pegawai["pegawai"]
    Root --> Finance["finance"]

    Admin --> A1["Dashboard"]
    Admin --> A2["Pengajuan Perjalanan"]
    Admin --> A3["Persetujuan"]
    Admin --> A4["Pemesanan"]
    Admin --> A5["Reimbursement"]
    Admin --> A6["Laporan"]
    Admin --> A7["Perjalanan Dinas"]
    Admin --> A8["Data Pengguna"]
    Admin --> A9["Profil"]

    Atasan --> B1["Dashboard"]
    Atasan --> B2["Persetujuan"]
    Atasan --> B3["Perjalanan Tim"]
    Atasan --> B4["Laporan"]
    Atasan --> B5["Profil"]

    HRD --> C1["Dashboard"]
    HRD --> C2["Data Pegawai"]
    HRD --> C3["Pelaksanaan Perjalanan"]
    HRD --> C4["Laporan"]
    HRD --> C5["Profil"]

    Pegawai --> D1["Dashboard"]
    Pegawai --> D2["Rencana Perjalanan"]
    Pegawai --> D3["Pelaksanaan Perjalanan"]
    Pegawai --> D4["Pengeluaran Perjalanan"]
    Pegawai --> D5["Profil"]

    Finance --> E1["Dashboard"]
    Finance --> E2["Pengeluaran"]
    Finance --> E3["Pembayaran"]
    Finance --> E4["Laporan"]
    Finance --> E5["Profil"]
```

---

## 6. Peta Halaman (route)

| Route | Peran yang diizinkan |
| --- | --- |
| `/admin/*` | admin |
| `/finance/dashboard`, `/finance/pengeluaran`, `/finance/pembayaran`, `/finance/laporan` | finance |
| `/hrd/dashboard`, `/hrd/data-pegawai`, `/hrd/pelaksanaan`, `/hrd/persetujuan`, `/hrd/laporan`, `/hrd/detail-perjalanan/*`, `/hrd/pegawai-detail` | hrd |
| `/pegawai/dashboard`, `/pegawai/rencana`, `/pegawai/pengeluaran`, `/pegawai/laporan`, `/hrd/pelaksanaan` | pegawai |
| `/atasan/dashboard`, `/atasan/persetujuan`, `/atasan/persetujuan/*`, `/atasan/perjalanan-tim`, `/atasan/perjalanan-tim/*`, `/atasan/laporan` | atasan |
| `/admin/pengaturan` | semua peran (profil) |

Sumber aturan: `app/middleware/auth.global.ts` (`getAllowedRoutesForRole`) dan `app/utils/nav.ts`.
