<template>
  <div class="atasan-page">
    <div class="breadcrumb"><NuxtLink to="/atasan/dashboard">Dashboard</NuxtLink><AppIcon name="chevron-right" class="crumb-sep" /><strong>Laporan</strong></div>

    <header class="page-header">
      <div><h1>Laporan Perjalanan Tim</h1><p>Ringkasan perjalanan dan biaya tim Anda.</p></div>
      <div class="header-actions">
        <label class="period-control"><span>Periode</span><select v-model="period" aria-label="Periode laporan"><option value="">Semua periode</option><option value="month">Bulan ini</option><option value="quarter">Kuartal ini</option><option value="year">Tahun ini</option></select></label>
        <button class="export-button" type="button" :disabled="exporting || loading" @click="handleExport">
          {{ exporting ? 'Menyiapkan...' : 'Ekspor Laporan' }}
        </button>
      </div>
    </header>

    <div v-if="error" class="data-error" role="alert">
      <strong>Data gagal dimuat</strong>
      <span>{{ error }}</span>
    </div>
    <div v-if="exportError" class="data-error" role="alert">
      <strong>Ekspor gagal</strong>
      <span>{{ exportError }}</span>
    </div>

    <section class="metrics">
      <AtasanMetricCard title="Total Perjalanan" :value="metricValue(metrics.total)" icon="route" />
      <AtasanMetricCard title="Perjalanan Selesai" :value="metricValue(metrics.completed)" icon="check-circle" />
      <AtasanMetricCard title="Perjalanan Berlangsung" :value="metricValue(metrics.ongoing)" icon="navigation" />
      <AtasanMetricCard title="Total Biaya" :value="formatCurrency(metrics.totalBiaya)" icon="Rp" />
    </section>

    <section class="charts">
      <article class="panel chart-panel">
        <div class="panel-heading"><div><h2>Perjalanan per Bulan</h2><p>Jumlah perjalanan berdasarkan bulan keberangkatan.</p></div></div>
        <div v-if="monthlyCounts.length === 0" class="chart-empty">Belum ada data perjalanan untuk ditampilkan.</div>
        <ul v-else class="bar-list">
          <li v-for="item in monthlyCounts" :key="item.label" class="bar-item">
            <span class="bar-label">{{ item.label }}</span>
            <span class="bar-track"><span class="bar-fill" :style="{ width: `${item.percent}%` }" /></span>
            <span class="bar-value">{{ item.total }}</span>
          </li>
        </ul>
      </article>
      <article class="panel chart-panel">
        <div class="panel-heading"><div><h2>Distribusi Status Perjalanan</h2><p>Ringkasan status perjalanan tim.</p></div></div>
        <div v-if="statusCounts.length === 0" class="chart-empty">Belum ada data status untuk diringkas.</div>
        <ul v-else class="status-list">
          <li v-for="item in statusCounts" :key="item.status">
            <span class="status" :class="item.className">{{ item.label }}</span>
            <strong>{{ item.total }}</strong>
          </li>
        </ul>
      </article>
    </section>

    <section class="panel cost-panel">
      <div class="panel-heading"><div><h2>Ringkasan Biaya</h2><p>Total biaya tercatat dari pengeluaran perjalanan tim.</p></div></div>
      <div class="cost-summary">
        <div><span>Total Biaya</span><strong>{{ formatCurrency(metrics.totalBiaya) }}</strong></div>
        <div><span>Rata-rata per Perjalanan</span><strong>{{ formatCurrency(averageCost) }}</strong></div>
      </div>
    </section>

    <section class="panel report-panel">
      <div class="panel-heading"><div><h2>Rincian Perjalanan</h2><p>Data perjalanan tim sesuai periode dan status terpilih.</p></div></div>
      <div class="filters">
        <label><span class="sr-only">Cari pegawai atau tujuan</span><input v-model="search" type="search" placeholder="Cari pegawai atau tujuan" /></label>
        <select v-model="status" aria-label="Status laporan">
          <option value="">Semua status</option>
          <option value="diajukan">Menunggu Persetujuan</option>
          <option value="disetujui">Disetujui</option>
          <option value="berjalan">Berlangsung</option>
          <option value="selesai">Selesai</option>
          <option value="lengkap">Lengkap</option>
          <option value="ditolak">Ditolak</option>
        </select>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>ID Perjalanan</th><th>Nama Pegawai</th><th>Departemen</th><th>Tujuan</th><th>Tanggal Perjalanan</th><th>Estimasi / Realisasi</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            <tr v-if="loading && reportTrips.length === 0"><td colspan="8" class="empty-cell">Memuat laporan perjalanan...</td></tr>
            <tr v-else-if="filteredTrips.length === 0"><td colspan="8" class="empty-cell">{{ search || status ? 'Tidak ada laporan yang cocok dengan filter.' : 'Belum ada laporan perjalanan untuk ditampilkan.' }}</td></tr>
            <tr v-for="trip in filteredTrips" :key="trip.id">
              <td>{{ trip.id }}</td>
              <td>{{ trip.employee }}</td>
              <td>{{ trip.department }}</td>
              <td>{{ trip.destination }}</td>
              <td>{{ trip.date }}</td>
              <td>{{ trip.estimate }} / {{ trip.realization }}</td>
              <td><span class="status" :class="trip.statusClass">{{ trip.status }}</span></td>
              <td><NuxtLink :to="`/atasan/perjalanan-tim/${trip.id}`" class="detail-link">Detail</NuxtLink></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { TripStatus } from '~/types/api'
import { useTrips } from '~/composables/useTrips'
import { useDashboard } from '~/composables/useDashboard'
import { useReports } from '~/composables/useReports'
import { apiErrorMessage } from '~/composables/useApi'
import { formatCurrency, formatDateRange, periodRange, tripStatusClass, tripStatusLabel } from '~/utils/format'

definePageMeta({ layout: 'atasan' })

interface ReportTrip {
  id: number
  employee: string
  department: string
  destination: string
  date: string
  estimate: string
  realization: string
  status: string
  statusClass: string
  rawStatus: TripStatus
}

const { trips, loading: tripsLoading, error: tripsError, fetchTrips } = useTrips()
const { summary, loading: dashboardLoading, error: dashboardError, fetchDashboard } = useDashboard()
const { downloadReport } = useReports()

const period = ref('')
const status = ref('')
const search = ref('')
const exporting = ref(false)
const exportError = ref('')

let searchTimer: ReturnType<typeof setTimeout> | null = null

const loading = computed(() => tripsLoading.value || dashboardLoading.value)
const error = computed(() => tripsError.value ?? dashboardError.value ?? '')

const reportTrips = computed<ReportTrip[]>(() => trips.value.map((trip) => ({
  id: trip.id,
  employee: trip.user?.name ?? '—',
  department: trip.user?.department ?? '—',
  destination: trip.tujuan,
  date: formatDateRange(trip.tanggal_berangkat, trip.tanggal_pulang),
  estimate: trip.estimasi_biaya === null ? '—' : formatCurrency(trip.estimasi_biaya),
  realization: formatCurrency(trip.total_biaya),
  status: tripStatusLabel(trip.status),
  statusClass: tripStatusClass(trip.status),
  rawStatus: trip.status,
})))

const filteredTrips = computed(() => reportTrips.value)

const metrics = computed(() => ({
  total: summary.value?.total_perjalanan ?? reportTrips.value.length,
  completed: (summary.value?.per_status.selesai ?? 0) + (summary.value?.per_status.lengkap ?? 0),
  ongoing: summary.value?.per_status.berjalan ?? 0,
  totalBiaya: summary.value?.total_biaya ?? 0,
}))

const averageCost = computed(() => (metrics.value.total > 0 ? metrics.value.totalBiaya / metrics.value.total : 0))

const metricValue = (value: number | null | undefined) => (value === null || value === undefined ? '—' : String(value))

const statusCounts = computed(() => {
  const counts = new Map<TripStatus, number>()
  for (const trip of trips.value) {
    counts.set(trip.status, (counts.get(trip.status) ?? 0) + 1)
  }

  return Array.from(counts.entries())
    .map(([rawStatus, total]) => ({
      status: rawStatus,
      label: tripStatusLabel(rawStatus),
      className: tripStatusClass(rawStatus),
      total,
    }))
    .sort((a, b) => b.total - a.total)
})

const monthlyCounts = computed(() => {
  const counts = new Map<string, number>()
  for (const trip of trips.value) {
    const month = trip.tanggal_berangkat.slice(0, 7)
    counts.set(month, (counts.get(month) ?? 0) + 1)
  }

  const entries = Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b))
  const max = entries.reduce((highest, [, total]) => Math.max(highest, total), 0)

  return entries.map(([month, total]) => ({
    label: new Intl.DateTimeFormat('id-ID', { month: 'short', year: 'numeric' }).format(new Date(`${month}-01`)),
    total,
    percent: max > 0 ? Math.round((total / max) * 100) : 0,
  }))
})

const queryParams = () => ({
  ...periodRange(period.value),
  q: search.value.trim() || undefined,
  status: (status.value || undefined) as TripStatus | undefined,
})

const load = async () => {
  await Promise.all([
    fetchTrips(queryParams()),
    fetchDashboard(),
  ])
}

const handleExport = async () => {
  exportError.value = ''
  exporting.value = true

  try {
    await downloadReport('trips', 'pdf', queryParams())
  } catch (err) {
    exportError.value = apiErrorMessage(err, 'Gagal mengunduh laporan.')
  } finally {
    exporting.value = false
  }
}

watch(period, () => {
  load().catch(() => {})
})

watch(status, () => {
  load().catch(() => {})
})

watch(search, () => {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    load().catch(() => {})
  }, 400)
})

onMounted(() => {
  load().catch(() => {})
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
.header-actions { display: flex; align-items: flex-end; gap: 10px; }
.period-control { display: flex; flex-direction: column; gap: 6px; color: var(--text-muted); font-size: 11px; }
.period-control select, .filters input, .filters select { min-height: 38px; padding: 0 11px; border: 1px solid var(--border); border-radius: 7px; background: #fff; color: var(--text); font: inherit; font-size: 11px; }
.export-button { min-height: 38px; padding: 0 13px; border: 1px solid var(--primary); border-radius: 7px; background: var(--primary); color: #fff; font: inherit; font-size: 11px; font-weight: 600; cursor: pointer; }
.export-button:disabled { cursor: not-allowed; opacity: 0.55; }
.data-error { display: grid; gap: 3px; margin-bottom: 16px; padding: 12px 14px; border: 1px solid #f4c7c7; border-radius: 8px; background: #fff5f5; color: #b42318; font-size: 11px; }
.metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin: 18px 0; }
.charts { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px; }
.panel { min-width: 0; padding: 18px; border: 1px solid var(--border); border-radius: 10px; background: #fff; }
.panel-heading { margin-bottom: 15px; }
.panel-heading h2 { margin: 0; color: var(--text); font-size: 14px; }
.chart-empty { display: grid; min-height: 160px; place-items: center; padding: 18px; border: 1px dashed #d9e0ea; border-radius: 8px; color: var(--text-muted); font-size: 11px; text-align: center; }
.bar-list, .status-list { display: grid; gap: 11px; margin: 0; padding: 6px 0; list-style: none; }
.bar-item { display: grid; grid-template-columns: 90px 1fr 32px; align-items: center; gap: 9px; font-size: 11px; color: var(--text-muted); }
.bar-track { height: 9px; border-radius: 20px; background: #eef1f7; overflow: hidden; }
.bar-fill { display: block; height: 100%; border-radius: 20px; background: var(--primary); }
.bar-value { color: var(--text); font-weight: 600; text-align: right; }
.status-list li { display: flex; align-items: center; justify-content: space-between; padding: 7px 0; border-bottom: 1px solid #f1f3f7; }
.status-list li:last-child { border-bottom: 0; }
.status-list strong { color: var(--text); font-size: 13px; }
.cost-panel, .report-panel { margin-top: 16px; }
.cost-summary { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
.cost-summary > div { display: flex; flex-direction: column; gap: 5px; padding: 13px 15px; border: 1px solid #edf0f4; border-radius: 8px; background: #fafbfd; }
.cost-summary span { color: var(--text-muted); font-size: 11px; }
.cost-summary strong { color: var(--text); font-size: 16px; }
.filters { display: grid; grid-template-columns: minmax(220px, 1.4fr) minmax(160px, 0.7fr); gap: 10px; margin-bottom: 15px; }
.filters input, .filters select { width: 100%; }
.table-wrap { overflow-x: auto; }
table { width: 100%; min-width: 900px; border-collapse: collapse; text-align: left; }
th { padding: 11px 9px; background: #f8fafc; color: #788397; font-size: 10px; font-weight: 600; }
td { padding: 13px 9px; border-bottom: 1px solid #edf0f4; color: var(--text); font-size: 11px; }
.empty-cell { height: 105px; color: var(--text-muted); text-align: center; }
.status { padding: 5px 8px; border-radius: 20px; background: #edf1f7; color: #667085; font-size: 10px; white-space: nowrap; }
.status.draft { background: #eef1f7; color: #667085; }
.status.waiting { background: #fff3df; color: #ef9b16; }
.status.approved { background: #dff7ef; color: #18a77c; }
.status.rejected { background: #ffe8e8; color: #ef5350; }
.status.ongoing { background: #fff3df; color: #ef9b16; }
.status.completed { background: #dff7ef; color: #18a77c; }
.detail-link { font-size: 11px; font-weight: 600; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
@media (max-width: 1050px) { .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } .charts { grid-template-columns: 1fr; } }
@media (max-width: 650px) { .atasan-page { padding: 18px 15px; } .page-header { align-items: flex-start; flex-direction: column; } .page-header h1 { font-size: 21px; } .header-actions { width: 100%; align-items: stretch; flex-direction: column; } .filters { grid-template-columns: 1fr; } .cost-summary { grid-template-columns: 1fr; } }
@media (max-width: 390px) { .metrics { grid-template-columns: 1fr; } }
</style>
