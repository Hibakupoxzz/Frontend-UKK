<template>
  <div class="atasan-page">
    <div class="breadcrumb"><NuxtLink to="/atasan/dashboard">Dashboard</NuxtLink><AppIcon name="chevron-right" class="crumb-sep" /><strong>Perjalanan Tim</strong></div>

    <header class="page-header">
      <div><h1>Perjalanan Tim</h1><p>Pantau jadwal dan status perjalanan dinas anggota tim.</p></div>
      <label class="period-control"><span>Periode</span><select v-model="period" aria-label="Periode perjalanan tim"><option value="">Semua periode</option><option value="month">Bulan ini</option><option value="quarter">Kuartal ini</option><option value="year">Tahun ini</option></select></label>
    </header>

    <div v-if="error" class="data-error" role="alert">
      <strong>Data gagal dimuat</strong>
      <span>{{ error }}</span>
    </div>

    <section class="metrics">
      <AtasanMetricCard title="Total Perjalanan Tim" :value="metricValue(trips.length)" icon="route" />
      <AtasanMetricCard title="Menunggu Keberangkatan" :value="metricValue(metrics.approved)" icon="clock" />
      <AtasanMetricCard title="Sedang Berlangsung" :value="metricValue(metrics.ongoing)" icon="navigation" />
      <AtasanMetricCard title="Perjalanan Selesai" :value="metricValue(metrics.completed)" icon="check-circle" />
    </section>

    <section class="panel">
      <div class="filters">
        <label><span class="sr-only">Cari pegawai atau tujuan</span><input v-model="search" type="search" placeholder="Cari pegawai atau tujuan" /></label>
        <select v-model="status" aria-label="Status perjalanan"><option value="">Semua status</option><option value="disetujui">Menunggu keberangkatan</option><option value="berjalan">Berlangsung</option><option value="selesai">Selesai</option></select>
        <select v-model="department" aria-label="Departemen">
          <option value="">Semua departemen</option>
          <option v-for="option in departments" :key="option" :value="option">{{ option }}</option>
        </select>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID Perjalanan</th><th>Nama Pegawai</th><th>Tujuan</th><th>Tanggal Berangkat</th><th>Tanggal Kembali</th><th>Estimasi / Realisasi</th><th>Status Perjalanan</th><th>Aksi</th></tr></thead>
          <tbody>
            <tr v-if="loading && trips.length === 0"><td colspan="8" class="empty-cell">Memuat data perjalanan tim...</td></tr>
            <tr v-else-if="filteredTrips.length === 0"><td colspan="8" class="empty-cell">{{ search || status || period || department ? 'Tidak ada perjalanan yang cocok dengan filter.' : 'Belum ada data perjalanan tim untuk ditampilkan.' }}</td></tr>
            <tr v-for="trip in filteredTrips" :key="trip.id"><td>{{ trip.id }}</td><td>{{ trip.employee }}</td><td>{{ trip.destination }}</td><td>{{ trip.departure }}</td><td>{{ trip.returnDate }}</td><td>{{ trip.estimate }} / {{ trip.realization }}</td><td><span class="status" :class="trip.statusClass">{{ trip.status }}</span></td><td><NuxtLink :to="`/atasan/perjalanan-tim/${trip.id}`" class="detail-link">Detail</NuxtLink></td></tr>
          </tbody>
        </table>
      </div>

      <div class="table-footer">
        <span class="showing-text">
          Menampilkan {{ filteredTrips.length }} dari {{ totalTrips }} perjalanan
        </span>

        <div v-if="lastPage > 1" class="pagination">
          <button
            v-for="pageNumber in lastPage"
            :key="pageNumber"
            class="page-button"
            :class="{ active: pageNumber === page }"
            type="button"
            @click="changePage(pageNumber)"
          >
            {{ pageNumber }}
          </button>
        </div>
      </div>
    </section>

    <section class="panel schedule-panel">
      <div class="panel-heading"><div><h2>Jadwal Perjalanan Terdekat</h2><p>Agenda perjalanan tim yang akan datang.</p></div></div>
      <div v-if="loading && upcomingTrips.length === 0" class="empty-schedule">Memuat jadwal perjalanan...</div>
      <div v-else-if="upcomingTrips.length === 0" class="empty-schedule">Belum ada jadwal yang dapat ditampilkan.</div>
      <ul v-else class="schedule-list">
        <li v-for="trip in upcomingTrips" :key="trip.id">
          <div class="schedule-info">
            <strong>{{ trip.employee }}</strong>
            <span>{{ trip.destination }}</span>
          </div>
          <div class="schedule-date">
            <span>{{ trip.departure }}</span>
            <NuxtLink :to="`/atasan/perjalanan-tim/${trip.id}`" class="detail-link">Detail</NuxtLink>
          </div>
        </li>
      </ul>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { TripStatus } from '~/types/api'
import { useTrips } from '~/composables/useTrips'
import { useDashboard } from '~/composables/useDashboard'
import { formatCurrency, formatDate, formatNumber, periodRange, tripStatusClass, tripStatusLabel } from '~/utils/format'

definePageMeta({ layout: 'atasan' })

interface TeamTrip {
  id: number
  employee: string
  destination: string
  departure: string
  departureRaw: string
  returnDate: string
  estimate: string
  realization: string
  status: string
  statusClass: string
  rawStatus: TripStatus
  department: string
}

const { trips: tripData, meta, loading, error, fetchTrips } = useTrips()
const { summary, fetchDashboard } = useDashboard()

// Jadwal terdekat diambil terpisah agar tidak terpengaruh paginasi tabel.
const { trips: upcomingData, fetchTrips: fetchUpcoming } = useTrips()

const search = ref('')
const status = ref('')
const period = ref('')
const department = ref('')

const trips = computed<TeamTrip[]>(() => tripData.value.map((trip) => ({
  id: trip.id,
  employee: trip.user?.name ?? '—',
  destination: trip.tujuan,
  departure: formatDate(trip.tanggal_berangkat),
  departureRaw: trip.tanggal_berangkat,
  returnDate: formatDate(trip.tanggal_pulang),
  estimate: trip.estimasi_biaya === null ? '—' : formatCurrency(trip.estimasi_biaya),
  realization: formatCurrency(trip.total_biaya),
  status: tripStatusLabel(trip.status),
  statusClass: tripStatusClass(trip.status),
  rawStatus: trip.status,
  department: trip.user?.department ?? '—',
})))

const perStatus = computed(() => summary.value?.per_status)

const metrics = computed(() => ({
  approved: perStatus.value?.disetujui ?? trips.value.filter((trip) => trip.rawStatus === 'disetujui').length,
  ongoing: perStatus.value?.berjalan ?? trips.value.filter((trip) => trip.rawStatus === 'berjalan').length,
  completed: perStatus.value
    ? perStatus.value.selesai + perStatus.value.lengkap
    : trips.value.filter((trip) => trip.rawStatus === 'selesai' || trip.rawStatus === 'lengkap').length,
}))

const metricValue = (value: number) => {
  if (loading.value && trips.value.length === 0) return '—'
  return formatNumber(value)
}

const departments = computed(() => {
  const values = new Set(
    trips.value
      .map((trip) => trip.department)
      .filter((value) => value && value !== '—'),
  )

  // Pertahankan pilihan aktif walau server memfilter baris yang tampil.
  if (department.value) values.add(department.value)

  return Array.from(values).sort((a, b) => a.localeCompare(b))
})

// Filter berjalan di server (nama/tujuan/keperluan, status, departemen, periode).
const filteredTrips = computed(() => trips.value)

const upcomingTrips = computed(() => {
  const today = new Date().toISOString().slice(0, 10)

  return upcomingData.value
    .filter((trip) => trip.status === 'disetujui' && trip.tanggal_berangkat >= today)
    .map((trip) => ({
      id: trip.id,
      employee: trip.user?.name ?? '—',
      destination: trip.tujuan,
      departure: formatDate(trip.tanggal_berangkat),
      departureRaw: trip.tanggal_berangkat,
    }))
    .sort((a, b) => a.departureRaw.localeCompare(b.departureRaw))
    .slice(0, 5)
})

const currentParams = () => ({
  q: search.value.trim() || undefined,
  status: (status.value || undefined) as TripStatus | undefined,
  department: department.value || undefined,
  ...periodRange(period.value),
})

const loadTrips = async () => {
  await fetchTrips({ ...currentParams(), page: page.value }).catch(() => {})
}

const reloadFilters = async () => {
  page.value = 1
  await loadTrips()
}

const changePage = async (value: number) => {
  const lastPage = meta.value?.last_page ?? 1
  if (value < 1 || value > lastPage || value === page.value) return
  page.value = value
  await loadTrips()
}

const lastPage = computed(() => Math.max(meta.value?.last_page ?? 1, 1))
const totalTrips = computed(() => meta.value?.total ?? trips.value.length)

const page = ref(1)

let searchTimer: ReturnType<typeof setTimeout> | null = null

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    reloadFilters().catch(() => {})
  }, 400)
})

watch([status, period, department], () => {
  reloadFilters().catch(() => {})
})

onMounted(async () => {
  try {
    await Promise.all([
      loadTrips(),
      fetchDashboard(),
      fetchUpcoming({ status: 'disetujui', per_page: 100 }).catch(() => null),
    ])
  } catch {
    // Pesan error sudah disimpan oleh composable.
  }
})
</script>

<style scoped>
.atasan-page { min-height: calc(100vh - 70px); padding: 26px 28px; background: #f5f6f8; }
.breadcrumb { display: flex; gap: 9px; margin-bottom: 8px; color: #8792a3; font-size: 11px; }
.breadcrumb a, .detail-link { color: var(--primary); }
.breadcrumb strong { color: var(--text); font-weight: 600; }
.page-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; margin-bottom: 18px; }
.page-header h1 { margin: 0; color: var(--text); font-size: 24px; }
.page-header p, .panel-heading p { margin: 6px 0 0; color: var(--text-muted); font-size: 12px; }
.period-control { display: flex; flex-direction: column; gap: 6px; color: var(--text-muted); font-size: 11px; }
.period-control select, .filters input, .filters select { min-height: 38px; padding: 0 11px; border: 1px solid var(--border); border-radius: 7px; background: #fff; color: var(--text); font: inherit; font-size: 11px; }
.metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin: 18px 0; }
.panel { padding: 18px; border: 1px solid var(--border); border-radius: 10px; background: var(--white); }
.filters { display: grid; grid-template-columns: minmax(220px, 1.4fr) repeat(2, minmax(160px, 1fr)); gap: 10px; margin-bottom: 16px; }
.filters input, .filters select { width: 100%; }
.table-wrap { overflow-x: auto; }
table { width: 100%; min-width: 920px; border-collapse: collapse; text-align: left; }
th { padding: 11px 9px; background: #f8fafc; color: #788397; font-size: 10px; font-weight: 600; }
td { padding: 13px 9px; border-bottom: 1px solid #edf0f4; color: var(--text); font-size: 11px; }
.empty-cell { height: 100px; color: var(--text-muted); text-align: center; }
.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 4px 0;
}
.showing-text { font-size: 10px; color: #788397; }
.pagination { display: flex; flex-wrap: wrap; gap: 6px; }
.page-button {
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--white);
  color: var(--text);
  font-family: inherit;
  font-size: 11px;
  cursor: pointer;
}
.page-button.active { border-color: var(--primary); background: var(--primary); color: #fff; }
.status { display: inline-block; padding: 5px 8px; border-radius: 20px; background: #fff5dc; color: #9a6a08; font-size: 10px; white-space: nowrap; }
.status.approved { background: #e8f7ef; color: #15803d; }
.status.rejected { background: #fdecec; color: #b42318; }
.status.ongoing { background: #e8efff; color: #315bb5; }
.status.completed { background: #eaf7f1; color: #15803d; }
.status.draft { background: #eef1f5; color: #667085; }
.detail-link { font-size: 11px; font-weight: 600; }
.schedule-panel { margin-top: 16px; }
.panel-heading h2 { margin: 0; color: var(--text); font-size: 14px; }
.empty-schedule { padding: 14px 0 5px; color: var(--text-muted); font-size: 11px; }
.schedule-list { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; }
.schedule-list li { display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 10px; padding-bottom: 10px; border-bottom: 1px solid #edf0f4; }
.schedule-list li:last-child { padding-bottom: 0; border-bottom: none; }
.schedule-info { display: grid; gap: 4px; }
.schedule-info strong { color: var(--text); font-size: 12px; font-weight: 600; }
.schedule-info span, .schedule-date span { color: var(--text-muted); font-size: 10px; }
.schedule-date { display: flex; align-items: center; gap: 12px; }
.data-error { display: flex; flex-direction: column; gap: 5px; margin-bottom: 4px; padding: 14px 16px; border: 1px solid #f3c7c7; border-radius: 8px; background: #fff7f7; color: #b42318; font-size: 12px; line-height: 1.5; }
.data-error strong { font-size: 12px; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media (max-width: 1050px) { .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } .filters { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 650px) { .atasan-page { padding: 18px 15px; } .page-header { align-items: flex-start; flex-direction: column; } .page-header h1 { font-size: 21px; } .filters { grid-template-columns: 1fr; } }
@media (max-width: 390px) { .metrics { grid-template-columns: 1fr; } }
</style>
