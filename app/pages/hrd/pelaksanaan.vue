<template>
  <div class="hrd-pelaksanaan-page">
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <NuxtLink to="/dashboard">Dashboard</NuxtLink>
      <AppIcon name="chevron-right" class="crumb-sep" />
      <NuxtLink to="/hrd/dashboard">HRD</NuxtLink>
      <AppIcon name="chevron-right" class="crumb-sep" />
      <strong>Pelaksanaan Perjalanan</strong>
    </div>

    <!-- Header -->
    <div class="page-header">
      <h1>Pelaksanaan Perjalanan Dinas</h1>
    </div>

    <!-- Summary Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon cyan"><AppIcon name="receipt" /></div>
        <div>
          <p>Total Perjalanan</p>
          <h2>{{ totalTrips }}</h2>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange"><AppIcon name="hourglass" /></div>
        <div>
          <p>Menunggu Persetujuan</p>
          <h2>{{ pendingCount }}</h2>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green"><AppIcon name="check-circle" /></div>
        <div>
          <p>Selesai</p>
          <h2>{{ completedCount }}</h2>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon blue"><AppIcon name="navigation" /></div>
        <div>
          <p>Sedang Berlangsung</p>
          <h2>{{ ongoingCount }}</h2>
        </div>
      </div>
    </div>

    <div v-if="error" class="data-error" role="alert">{{ error }}</div>

    <!-- Filter Card -->
    <div class="filter-card">
      <div class="filter-group search-group">
        <label>Cari Pegawai / Tujuan</label>
        <div class="search-input">
          <AppIcon name="search" />
          <input v-model="search" type="text" placeholder="Cari..." />
        </div>
      </div>

      <div class="filter-group">
        <label>Status</label>
        <select v-model="selectedStatus">
          <option value="">Semua</option>
          <option value="diajukan">Menunggu</option>
          <option value="berjalan">Berlangsung</option>
          <option value="selesai">Selesai</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Departemen</label>
        <select v-model="selectedDepartment">
          <option value="">Semua</option>
          <option v-for="department in departmentOptions" :key="department" :value="department">
            {{ department }}
          </option>
        </select>
      </div>
    </div>

    <!-- Table Card -->
    <div class="table-card">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th class="no-column">No</th>
              <th>Pegawai</th>
              <th>Tujuan</th>
              <th>Tanggal Berangkat</th>
              <th>Tanggal Kembali</th>
              <th>Status</th>
              <th class="action-column">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && trips.length === 0">
              <td colspan="7" class="table-state">Memuat data perjalanan...</td>
            </tr>
            <tr v-else-if="filteredTrips.length === 0">
              <td colspan="7" class="table-state">Tidak ada data perjalanan.</td>
            </tr>
            <tr v-for="(trip, index) in filteredTrips" :key="trip.id">
              <td>{{ index + 1 }}</td>
              <td>{{ trip.user?.name || '—' }}</td>
              <td>{{ trip.tujuan }}</td>
              <td>{{ formatDate(trip.tanggal_berangkat) }}</td>
              <td>{{ formatDate(trip.tanggal_pulang) }}</td>
              <td>
                <span class="status-badge" :class="tripStatusClass(trip.status)">
                  {{ tripStatusLabel(trip.status) }}
                </span>
              </td>
              <td>
                <NuxtLink :to="`/hrd/detail-perjalanan/${trip.id}`" class="detail-button">Detail</NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div class="trip-cards">
        <article v-for="(trip, index) in filteredTrips" :key="`card-${trip.id}`" class="trip-card">
          <div class="trip-card-header">
            <span class="trip-card-number">Perjalanan #{{ index + 1 }}</span>
            <span class="status-badge" :class="tripStatusClass(trip.status)">
              {{ tripStatusLabel(trip.status) }}
            </span>
          </div>
          <div class="trip-card-title">{{ trip.tujuan }}</div>
          <dl class="trip-card-details">
            <div>
              <dt>Pegawai</dt>
              <dd>{{ trip.user?.name || '—' }}</dd>
            </div>
            <div>
              <dt>Departemen</dt>
              <dd>{{ trip.user?.department || '—' }}</dd>
            </div>
            <div>
              <dt>Tanggal Berangkat</dt>
              <dd>{{ formatDate(trip.tanggal_berangkat) }}</dd>
            </div>
            <div>
              <dt>Tanggal Kembali</dt>
              <dd>{{ formatDate(trip.tanggal_pulang) }}</dd>
            </div>
          </dl>
          <div class="trip-card-actions">
            <NuxtLink :to="`/hrd/detail-perjalanan/${trip.id}`" class="detail-button">Detail</NuxtLink>
          </div>
        </article>
        <p v-if="filteredTrips.length === 0" class="empty-state">Tidak ada data perjalanan.</p>
      </div>

      <!-- Pagination -->
      <div class="table-footer">
        <span class="showing-text">Menampilkan {{ filteredTrips.length }} dari {{ meta?.total ?? filteredTrips.length }} data</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { TripQuery } from '~/types/api'
import { useTrips } from '~/composables/useTrips'
import { useDashboard } from '~/composables/useDashboard'
import { formatDate, tripStatusClass, tripStatusLabel } from '~/utils/format'

const search = ref('')
const selectedStatus = ref('')
const selectedDepartment = ref('')

const { trips, meta, loading, error, fetchTrips } = useTrips()
const { summary, fetchDashboard } = useDashboard()

let searchTimer: ReturnType<typeof setTimeout> | null = null

const departmentOptions = computed(() => {
  const values = new Set<string>()

  for (const trip of trips.value) {
    if (trip.user?.department) values.add(trip.user.department)
  }

  // Pertahankan pilihan aktif walau server memfilter baris yang tampil.
  if (selectedDepartment.value) values.add(selectedDepartment.value)

  return Array.from(values).sort((a, b) => a.localeCompare(b))
})

// Filter berjalan di server; status "selesai" mencakup "lengkap".
const filteredTrips = computed(() => trips.value)

const perStatus = computed(() => summary.value?.per_status)

const totalTrips = computed(() => summary.value?.total_perjalanan ?? trips.value.length)
const pendingCount = computed(
  () => perStatus.value?.diajukan ?? trips.value.filter((trip) => trip.status === 'diajukan').length,
)
const completedCount = computed(
  () => (perStatus.value ? (perStatus.value.selesai + perStatus.value.lengkap) : trips.value.filter((trip) => trip.status === 'selesai' || trip.status === 'lengkap').length),
)
const ongoingCount = computed(
  () => perStatus.value?.berjalan ?? trips.value.filter((trip) => trip.status === 'berjalan').length,
)

const reload = async () => {
  await fetchTrips({
    per_page: 100,
    q: search.value.trim() || undefined,
    status: (selectedStatus.value || undefined) as TripQuery['status'],
    department: selectedDepartment.value || undefined,
  }).catch(() => {})
}

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    void reload()
  }, 400)
})

watch([selectedStatus, selectedDepartment], () => {
  void reload()
})

onMounted(async () => {
  try {
    await Promise.all([reload(), fetchDashboard()])
  } catch {
    // pesan error sudah disimpan oleh composable
  }
})
</script>

<style scoped>
.hrd-pelaksanaan-page {
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
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}

.page-header h1 { margin: 0; font-size: 23px; font-weight: 700; color: var(--text); }

/* STATS GRID */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}

.stat-card {
  min-width: 0;
  min-height: 78px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 14px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 9px;
}

.stat-icon {
  width: 36px; height: 36px;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px; font-size: 16px;
}

.stat-icon.cyan { background: #e5f7fc; color: #0891b2; }
.stat-icon.orange { background: #fff3df; color: #f59e0b; }
.stat-icon.green { background: #e3f8ef; color: #16a34a; }
.stat-icon.blue { background: #e9f0ff; color: var(--primary); }

.stat-card > div:last-child { min-width: 0; }
.stat-card p { margin: 0 0 3px; font-size: 9px; color: #7b8799; }
.stat-card h2 { margin: 0; font-size: 15px; line-height: 1.1; color: var(--text); font-weight: 700; }

/* FILTER CARD */
.filter-card {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) 195px 195px;
  gap: 14px;
  padding: 16px;
  margin-bottom: 24px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 10px;
}

.filter-group { display: flex; flex-direction: column; gap: 6px; }
.filter-group label { font-size: 9px; font-weight: 600; color: #667085; }

.search-input, .date-input {
  height: 31px; display: flex; align-items: center;
  border: 1px solid #dce2eb; border-radius: 6px; background: var(--white);
}
.search-input svg, .date-input svg { width: 14px; height: 14px; margin: 0 8px; color: #718096; flex-shrink: 0; }
.search-input input, .date-input input, .filter-group select {
  width: 100%; height: 31px; box-sizing: border-box;
  border: 1px solid #dce2eb; border-radius: 6px;
  background: var(--white); color: var(--text);
  outline: none; font-family: inherit; font-size: 10px;
}
.search-input input { border: none; }
.date-input input { border: none; padding: 0 0 0 4px; }
.filter-group select { padding: 0 10px; }
.search-input input:focus, .date-input input:focus, .filter-group select:focus { outline: none; }

/* TABLE */
.table-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 11px;
  overflow: hidden;
}

.table-wrapper { padding: 18px; overflow-x: auto; }

table { width: 100%; border-collapse: collapse; table-layout: fixed; }
thead { background: #f3f4f6; }
th { padding: 10px 12px; text-align: left; font-size: 9px; font-weight: 600; color: #718096; }
td { padding: 14px 12px; border-bottom: 1px solid #e5e8ee; font-size: 10px; color: #344054; vertical-align: middle; }
tbody tr:last-child td { border-bottom: none; }
.no-column { width: 30px; }
.action-column { width: 70px; text-align: center; }

.status-badge {
  display: inline-flex; align-items: center;
  padding: 4px 9px; border-radius: 5px;
  font-size: 9px; font-weight: 600; white-space: nowrap;
}
.waiting { background: #fff3df; color: #ef9b16; }
.draft { background: #eef1f7; color: #667085; }
.approved { background: #e8efff; color: var(--primary); }
.rejected { background: #ffe8e8; color: #ef5350; }
.ongoing { background: #fff3df; color: #ef9b16; }
.completed { background: #dff7ef; color: #18a77c; }
.data-error { margin-bottom: 16px; padding: 11px 14px; border: 1px solid #f4c7c7; border-radius: 8px; background: #fff5f5; color: #b42318; font-size: 11px; }
.table-state { padding: 22px 12px; text-align: center; font-size: 10px; color: #8792a5; }

.detail-button {
  display: inline-block; margin: auto;
  border: none; background: transparent;
  color: #1769ff; font-family: inherit; font-size: 10px; font-weight: 600; cursor: pointer; text-decoration: none;
}
.detail-button:hover { text-decoration: underline; }
.detail-button.disabled { color: #9aa4b5; cursor: not-allowed; }
.detail-button.disabled:hover { text-decoration: none; }

/* MOBILE CARDS */
.trip-cards { display: none; }
.trip-card {
  padding: 14px; background: var(--white); border: 1px solid var(--border); border-radius: 10px;
}
.trip-card-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.trip-card-number { font-size: 10px; color: #9aa4b5; }
.trip-card-title { display: block; color: var(--text); font-size: 14px; font-weight: 700; line-height: 1.35; overflow-wrap: anywhere; }
.trip-card-details { display: grid; grid-template-columns: 1fr; gap: 8px; margin: 12px 0; }
.trip-card-details > div { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.trip-card-details dt { font-size: 10px; color: #8792a5; }
.trip-card-details dd { margin: 0; font-size: 11px; font-weight: 500; color: var(--text); text-align: right; }
.trip-card-actions { display: flex; justify-content: flex-end; padding-top: 10px; border-top: 1px solid #eef1f5; }
.trip-card-actions .detail-button { width: 100%; min-height: 40px; border: 1px solid var(--primary); border-radius: 7px; background: #f5f8ff; }

.empty-state { padding: 28px 16px; text-align: center; font-size: 12px; color: #8792a5; }

/* FOOTER */
.table-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px 18px; }
.showing-text { font-size: 9px; color: #718096; }
.pagination { display: flex; gap: 6px; }
.page-button { width: 25px; height: 25px; border: 1px solid #dce2eb; border-radius: 5px; background: var(--white); color: var(--text); font-family: inherit; font-size: 9px; cursor: pointer; }
.page-button.active { border-color: var(--primary); background: var(--primary); color: var(--white); }

/* RESPONSIVE */
@media (max-width: 1023px) {
  .hrd-pelaksanaan-page { padding: 20px; }
  table { min-width: 0; table-layout: fixed; }
  th { padding: 9px 6px; } td { padding: 11px 6px; font-size: 9px; }
  .status-badge { padding: 3px 7px; font-size: 8.5px; }
  .detail-button { font-size: 9px; }
}

@media (max-width: 767px) {
  .hrd-pelaksanaan-page { padding: 16px; }
  .page-header h1 { font-size: 20px; }
  .filter-card { grid-template-columns: 1fr; padding: 14px; gap: 12px; margin-bottom: 16px; }
  .page-header h1 { font-size: 20px; }
  .filter-group input, .filter-group select { font-size: 16px; }
  .table-wrapper { display: none; }
  .table-footer { flex-direction: column; align-items: flex-start; gap: 10px; padding: 0 14px 14px; }
  .pagination { flex-wrap: wrap; }
  .trip-cards { display: flex; flex-direction: column; gap: 12px; padding: 14px; }
  .table-card { border: none; background: transparent; overflow: visible; }
  .trip-card { padding: 12px; }
  .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .stat-card { padding: 12px; gap: 10px; }
  .stat-card h2 { font-size: 14px; }
}

@media (max-width: 540px) {
  .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 374px) {
  .hrd-pelaksanaan-page { padding: 12px; }
  .trip-cards { padding: 10px; }
}
</style>