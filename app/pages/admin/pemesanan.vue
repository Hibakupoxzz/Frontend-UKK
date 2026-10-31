<template>
  <div class="page">
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <NuxtLink to="/dashboard">Dashboard</NuxtLink>
      <span>›</span>
      <NuxtLink to="/admin/perjalanan-dinas">Perjalanan Dinas</NuxtLink>
      <span>›</span>
      <strong>Pemesanan</strong>
    </div>

    <!-- Header -->
    <div class="page-header">
      <h1>Pemesanan Tiket &amp; Penginapan</h1>
    </div>

    <!-- Unavailable notice -->
    <section class="notice-card">
      <div class="notice-icon">🔒</div>
      <div class="notice-body">
        <h2>Modul pemesanan belum tersedia</h2>
        <p>
          Backend belum memiliki data atau endpoint untuk pencarian tiket, hotel,
          maupun transportasi. Karena itu halaman pemesanan tidak menampilkan
          hasil pencarian atau daftar harga.
        </p>
        <p>
          Perjalanan dinas tetap dapat dicatat dan dipantau melalui menu Perjalanan
          Dinas. Dokumen pendukung seperti tiket atau bukti pemesanan dapat diunggah
          pada detail perjalanan.
        </p>
        <div class="notice-actions">
          <NuxtLink to="/admin/perjalanan-dinas" class="primary-link">Lihat Perjalanan Dinas</NuxtLink>
          <NuxtLink to="/admin/laporan" class="secondary-link">Lihat Laporan</NuxtLink>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// Modul pemesanan belum memiliki dukungan backend.
</script>

<style scoped>
.page {
  width: 100%;
  min-height: calc(100vh - 70px);
  padding: 24px 28px;
  background: #f5f6f8;
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  font-size: 9px;
  color: #9aa4b5;
}

.breadcrumb a { color: #9aa4b5; text-decoration: none; }
.breadcrumb a:hover { color: var(--primary); }
.breadcrumb strong { color: var(--text); font-weight: 600; }

.page-header {
  margin-bottom: 24px;
}

.page-header h1 { margin: 0; font-size: 23px; font-weight: 700; color: var(--text); }

.notice-card {
  display: flex;
  align-items: flex-start;
  gap: 18px;
  padding: 24px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 11px;
}

.notice-icon {
  width: 44px; height: 44px;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border-radius: 10px;
  background: #eef2ff;
  font-size: 20px;
}

.notice-body h2 { margin: 0 0 10px; font-size: 16px; font-weight: 700; color: var(--text); }
.notice-body p { margin: 0 0 10px; font-size: 12px; line-height: 1.6; color: var(--text-muted); }
.notice-body p:last-of-type { margin-bottom: 18px; }

.notice-actions { display: flex; flex-wrap: wrap; gap: 10px; }

.primary-link,
.secondary-link {
  display: inline-flex;
  align-items: center;
  min-height: 36px;
  padding: 0 16px;
  border-radius: 7px;
  font-size: 11px;
  font-weight: 600;
  text-decoration: none;
}

.primary-link { background: var(--primary); color: var(--white); }
.primary-link:hover { opacity: 0.9; }

.secondary-link { border: 1px solid var(--primary); background: #f5f8ff; color: var(--primary); }
.secondary-link:hover { background: #eaf0ff; }

@media (max-width: 767px) {
  .page { padding: 16px; }
  .page-header h1 { font-size: 20px; }
  .notice-card { flex-direction: column; gap: 14px; padding: 18px; }
}
</style>
