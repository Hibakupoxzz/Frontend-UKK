# Alur Aplikasi per Role — Eduabsen Travel App

Kumpulan flowchart untuk **setiap peran pengguna**: `admin`, `atasan`, `hrd`,
`pegawai`, dan `finance`. Semua alur dimulai dari login dan bercabang ke
menu sesuai hak akses (`app/middleware/auth.global.ts` + `app/utils/nav.ts`).

Legenda umum: `[...]` = halaman/aksi, `{...}` = keputusan, `([...])` = awal/akhir.

> Lihat `docs/ALUR-APLIKASI.md` untuk alur lintas-role (siklus perjalanan, pembayaran, booking).

---

## 1. Admin

![1. Admin](images/role-1-admin.png)

```mermaid
flowchart TD
    Start([Login admin]) --> Dash["/admin/dashboard<br/>ringkasan seluruh perjalanan"]

    Dash --> M{Menu}

    M --> A["Pengajuan Perjalanan"]
    A --> A1["Isi form + unggah dokumen"]
    A1 --> A2{Simpan atau ajukan?}
    A2 -- Simpan --> A3["status: draft"]
    A2 -- Ajukan --> A4["submitTrip → status: diajukan"]

    M --> B["Persetujuan"]
    B --> B1["Tab: Menunggu / Disetujui / Ditolak"]
    B1 --> B2{"Tinjau pengajuan"}
    B2 -- Setujui --> B3["approve → lanjut ke persetujuan akhir"]
    B2 -- Tolak --> B4["reject + catatan wajib → ditolak"]

    M --> C["Pemesanan"]
    C --> C1{"Kelola"}
    C1 -- Booking --> C2["create / update status / delete"]
    C1 -- Vendor --> C3["tambah / aktif-nonaktif / hapus"]
    C1 -- Ekspor --> C4["PDF / Excel"]

    M --> D["Reimbursement"]
    D --> D1["Input pengeluaran + unggah bukti"]

    M --> E["Perjalanan Dinas"]
    E --> E1["Daftar + filter + arsip"]
    E1 --> E2["DetailPerjalanan"]
    E2 --> E3{"Aksi perjalanan"}
    E3 --> E4["submit / approve / reject"]
    E3 --> E5["start → berjalan<br/>finish → selesai<br/>complete → lengkap"]
    E3 --> E6["archive / unarchive"]
    E3 --> E7["kelola dokumen, estimasi,<br/>pengeluaran, komentar, kalender"]

    M --> F["Pagu Anggaran"]
    F --> F1["create / update / delete pagu<br/>+ ekspor PDF/Excel"]

    M --> G["Data Pengguna"]
    G --> G1["create / edit user,<br/>reset password, set atasan"]

    M --> H["Log Aktivitas"]
    H --> H1["lihat + filter jenis aksi"]

    M --> I["Laporan"]
    I --> I1["filter tahun & departemen<br/>+ ekspor PDF/Excel"]

    M --> J["Pengaturan"]
    J --> J1["edit profil, foto, tanda tangan"]
    J --> J2["preferensi notifikasi"]
    J --> J3["ganti password"]

    A4 --> End([Selesai])
    B3 --> End
    B4 --> End
    C2 --> End
    C3 --> End
    C4 --> End
    D1 --> End
    E4 --> End
    E5 --> End
    E6 --> End
    E7 --> End
    F1 --> End
    G1 --> End
    H1 --> End
    I1 --> End
    J1 --> End
    J2 --> End
    J3 --> End
```

---

## 2. Atasan

![2. Atasan](images/role-2-atasan.png)

```mermaid
flowchart TD
    Start([Login atasan]) --> Dash["/atasan/dashboard<br/>ringkasan tim"]

    Dash --> M{Menu}

    M --> A["Persetujuan"]
    A --> A1["Daftar pengajuan tim<br/>(filter status/periode/departemen)"]
    A1 --> A2["Tinjau /atasan/persetujuan/:id"]
    A2 --> A3{"Keputusan"}
    A3 -- Setujui --> A4["approve + catatan opsional"]
    A3 -- Tolak --> A5["reject + catatan (wajib)"]
    A4 --> A6["Lanjut ke Persetujuan Akhir HRD"]
    A5 --> A7["status: ditolak"]

    M --> B["Perjalanan Tim"]
    B --> B1["Monitor perjalanan tim<br/>(filter & ringkasan)"]
    B1 --> B2["Detail /atasan/perjalanan-tim/:id"]
    B2 --> B3["Lihat estimasi/realisasi, dokumen,<br/>unduh kalender (.ics)"]

    M --> C["Laporan"]
    C --> C1["Filter periode/departemen<br/>+ ekspor PDF/Excel"]

    M --> D["Pengaturan"]
    D --> D1["Edit profil & ganti password"]

    A6 --> End([Selesai])
    A7 --> End
    B3 --> End
    C1 --> End
    D1 --> End
```

---

## 3. HRD

![3. HRD](images/role-3-hrd.png)

```mermaid
flowchart TD
    Start([Login HRD]) --> Dash["/hrd/dashboard<br/>monitoring perjalanan & pegawai"]

    Dash --> M{Menu}

    M --> A["Persetujuan Akhir"]
    A --> A1["Antrean pengajuan<br/>yang sudah disetujui atasan"]
    A1 --> A2{"Keputusan final"}
    A2 -- Setujui --> A3["approve → status: disetujui"]
    A2 -- Tolak --> A4["reject + catatan → ditolak"]

    M --> B["Data Pegawai"]
    B --> B1["Daftar pegawai + filter<br/>(cari, departemen, role)"]
    B1 --> B2["Detail pegawai"]

    M --> C["Pelaksanaan Perjalanan"]
    C --> C1["Monitoring status perjalanan<br/>(total, menunggu, berlangsung, selesai)"]
    C1 --> C2["Detail /hrd/detail-perjalanan/:id<br/>lihat pengeluaran & unduh kalender"]

    M --> D["Laporan"]
    D --> D1["Filter tahun & departemen<br/>+ ekspor PDF/Excel"]

    M --> E["Pengaturan"]
    E --> E1["Edit profil & ganti password"]

    A3 --> End([Selesai])
    A4 --> End
    B2 --> End
    C2 --> End
    D1 --> End
    E1 --> End
```

---

## 4. Pegawai

![4. Pegawai](images/role-4-pegawai.png)

```mermaid
flowchart TD
    Start([Login pegawai]) --> Dash["/pegawai/dashboard<br/>ringkasan pengajuan & perjalanan"]

    Dash --> M{Menu}

    M --> A["Rencana Perjalanan"]
    A --> A1["Isi form: tujuan, tanggal,<br/>kebutuhan, estimasi"]
    A1 --> A2["createTrip → draft"]
    A2 --> A3["submitTrip → diajukan"]
    A3 --> A4(["Menunggu persetujuan atasan & HRD"])

    M --> B["Pelaksanaan Perjalanan"]
    B --> B1["Pantau status perjalanan yang<br/>disetujui/berlangsung"]

    M --> C["Pengeluaran Perjalanan"]
    C --> C1["Pilih perjalanan"]
    C1 --> C2{"Aksi"}
    C2 -- Catat pengeluaran --> C3["createExpense + uploadReceipt"]
    C2 -- Ajukan pembayaran --> C4["requestPayment → status diajukan"]
    C2 -- Booking --> C5["buat / edit / batal booking"]
    C2 -- Duplikat --> C6["duplicateTrip (tanggal baru)"]
    C2 -- Dokumen --> C7["unduh SPT/SPD, kalender (.ics)"]
    C2 -- Diskusi --> C8["tambah komentar perjalanan"]

    M --> D["Laporan"]
    D --> D1["Ringkasan + riwayat perjalanan<br/>+ ekspor PDF/Excel"]

    M --> E["Pengaturan"]
    E --> E1["Edit profil & ganti password"]

    A4 --> End([Selesai])
    B1 --> End
    C3 --> End
    C4 --> End
    C5 --> End
    C6 --> End
    C7 --> End
    C8 --> End
    D1 --> End
    E1 --> End
```

---

## 5. Finance

![5. Finance](images/role-5-finance.png)

```mermaid
flowchart TD
    Start([Login finance]) --> Dash["/finance/dashboard<br/>ringkasan keuangan"]

    Dash --> M{Menu}

    M --> A["Pengeluaran"]
    A --> A1["Daftar pengeluaran + filter<br/>(cari, periode, status bukti)"]

    M --> B["Pembayaran"]
    B --> B1["Daftar pembayaran + filter status"]
    B1 --> B2["Buka detail pembayaran"]
    B2 --> B3{"Verifikasi"}
    B3 -- Verify --> B4["verifyPayment<br/>status: disetujui"]
    B3 -- Reject --> B5["rejectPayment + catatan<br/>status: ditolak"]
    B4 --> B6["payPayment:<br/>metode + no. referensi + bukti<br/>status: dibayar"]

    M --> C["Laporan"]
    C --> C1["Filter tahun & departemen<br/>+ ekspor PDF/Excel"]

    M --> D["Pengaturan"]
    D --> D1["Edit profil & ganti password"]

    A1 --> End([Selesai])
    B5 --> End
    B6 --> End
    C1 --> End
    D1 --> End
```

---

## Ringkasan Hak Akses

| Role | Menu utama | Aksi kunci |
| --- | --- | --- |
| **admin** | Dashboard, Pengajuan, Persetujuan, Pemesanan, Reimbursement, Perjalanan Dinas, Anggaran, Data Pengguna, Log Aktivitas, Laporan, Pengaturan | Semua transisi perjalanan, kelola booking/vendor/pagu/pengguna |
| **atasan** | Dashboard, Persetujuan, Perjalanan Tim, Laporan, Pengaturan | Setujui/tolak pengajuan tim (level pertama) |
| **hrd** | Dashboard, Data Pegawai, Persetujuan Akhir, Pelaksanaan, Laporan, Pengaturan | Keputusan final pengajuan, data pegawai, monitoring |
| **pegawai** | Dashboard, Rencana, Pelaksanaan, Pengeluaran, Laporan, Pengaturan | Buat/lancarkan perjalanan, pengeluaran, pembayaran, booking |
| **finance** | Dashboard, Pengeluaran, Pembayaran, Laporan, Pengaturan | Verifikasi, tolak, dan proses pembayaran |
