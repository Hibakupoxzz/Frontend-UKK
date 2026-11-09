<template>
  <div class="atasan-page">
    <div class="breadcrumb">
      <span>Beranda</span><AppIcon name="chevron-right" class="crumb-sep" /><strong>Dashboard</strong>
    </div>

    <header class="page-header">
      <div>
        <h1>Dashboard Atasan</h1>
        <p>Pantau pengajuan dan perjalanan dinas tim Anda.</p>
      </div>
      <label class="period-control">
        <span>Periode</span>
        <select v-model="period" aria-label="Periode dashboard">
          <option value="bulan-ini">Bulan ini</option>
          <option value="kuartal-ini">Kuartal ini</option>
          <option value="tahun-ini">Tahun ini</option>
        </select>
      </label>
    </header>

    <div v-if="error" class="data-error" role="alert">
      <strong>Data gagal dimuat</strong>
      <span>{{ error }}</span>
    </div>

    <section class="metrics" aria-label="Ringkasan perjalanan tim">
      <AtasanMetricCard title="Pengajuan Perjalanan Tim" :value="metricValue(metrics.total)" icon="file-text" />
      <AtasanMetricCard title="Menunggu Persetujuan" :value="metricValue(metrics.pending)" icon="clock" />
      <AtasanMetricCard title="Perjalanan Berlangsung" :value="metricValue(metrics.ongoing)" icon="navigation" />
      <AtasanMetricCard title="Perjalanan Selesai" :value="metricValue(metrics.completed)" icon="check-circle" />
    </section>

    <section class="content-grid">
      <article class="panel">
        <div class="panel-heading">
          <div>
            <h2>Pengajuan Menunggu Persetujuan</h2>
            <p>Pengajuan yang berada dalam kewenangan Anda.</p>
          </div>
          <NuxtLink to="/atasan/persetujuan" class="text-link">Lihat semua</NuxtLink>
        </div>

        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Pegawai</th>
                <th>Tujuan / Keperluan</th>
                <th>Tanggal</th>
                <th>Estimasi / Realisasi</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="loading && pendingRequests.length === 0">
                <td colspan="6" class="empty-cell">Memuat data pengajuan...</td>
              </tr>
              <tr v-else-if="pendingRequests.length === 0">
                <td colspan="6" class="empty-cell">
                  Belum ada data pengajuan untuk ditampilkan.
                </td>
              </tr>
              <tr v-for="request in pendingRequests" :key="request.id">
                <td>{{ request.employee }}</td>
                <td>{{ request.destination }}</td>
                <td>{{ request.date }}</td>
                <td>{{ request.estimate }} / {{ request.realization }}</td>
                <td><span class="status" :class="request.statusClass">{{ request.status }}</span></td>
                <td><NuxtLink :to="`/atasan/persetujuan/${request.id}`" class="text-link">Detail</NuxtLink></td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <aside class="side-panels">
        <article class="panel">
          <div class="panel-heading">
            <div><h2>Keputusan Terbaru</h2><p>Riwayat keputusan pengajuan.</p></div>
          </div>
          <div v-if="loading && decisions.length === 0" class="empty-state">Memuat data keputusan...</div>
          <div v-else-if="decisions.length === 0" class="empty-state">Belum ada keputusan yang dapat ditampilkan.</div>
          <ul v-else class="side-list">
            <li v-for="activity in decisions" :key="activity.id" class="side-item">
              <NuxtLink :to="`/atasan/perjalanan-tim/${activity.trip_id}`" class="side-title link">{{ activity.title }}</NuxtLink>
              <span class="side-meta">{{ activity.detail ?? '' }} · {{ formatDate(activity.at) }}</span>
              <span class="status" :class="decisionToneClass(activity.tone)">{{ decisionToneLabel(activity.tone) }}</span>
            </li>
          </ul>
        </article>

        <article class="panel">
          <div class="panel-heading">
            <div><h2>Perjalanan Tim Saat Ini</h2><p>Perjalanan yang sedang berlangsung.</p></div>
          </div>
          <div v-if="loading && ongoingTrips.length === 0" class="empty-state">Memuat data perjalanan...</div>
          <div v-else-if="ongoingTrips.length === 0" class="empty-state">Belum ada data perjalanan aktif.</div>
          <ul v-else class="side-list">
            <li v-for="trip in ongoingTrips" :key="trip.id" class="side-item">
              <span class="side-title">{{ trip.user?.name ?? '—' }}</span>
              <span class="side-meta">{{ trip.tujuan }} · {{ formatDateRange(trip.tanggal_berangkat, trip.tanggal_pulang) }}</span>
              <span class="status" :class="tripStatusClass(trip.status)">{{ tripStatusLabel(trip.status) }}</span>
            </li>
          </ul>
          <NuxtLink to="/atasan/perjalanan-tim" class="text-link">Buka perjalanan tim</NuxtLink>
        </article>

        <article class="panel">
          <div class="panel-heading">
            <div><h2>Pagu Departemen</h2><p>Periode berjalan · {{ user?.department ?? '—' }}</p></div>
          </div>
          <div v-if="myBudget" class="budget-body">
            <div class="budget-row">
              <span>Terpakai</span>
              <strong>{{ formatCurrency(myBudget.terpakai) }}</strong>
            </div>
            <div class="budget-row">
              <span>Sisa</span>
              <strong :class="myBudget.sisa < 0 ? 'negative' : 'positive'">{{ formatCurrency(myBudget.sisa) }}</strong>
            </div>
            <div class="progress" role="progressbar" :aria-valuenow="budgetPercent" aria-valuemin="0" aria-valuemax="100">
              <div class="progress-bar" :class="{ over: budgetPercent >= 100 }" :style="{ width: `${Math.min(budgetPercent, 100)}%` }" />
            </div>
            <span class="budget-meta">{{ formatCurrency(myBudget.pagu) }} pagu · {{ budgetPercent }}% terpakai</span>
          </div>
          <div v-else class="empty-state">Belum ada pagu untuk departemen Anda bulan ini.</div>
        </article>
      </aside>
    </section>

    <DashboardTripCalendar :trip-link="(id) => `/atasan/perjalanan-tim/${id}`" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { DashboardActivity, Trip } from '~/types/api'
import { useApprovals } from '~/composables/useApprovals'
import { useAuth } from '~/composables/useAuth'
import { useBudgets } from '~/composables/useBudgets'
import { useDashboard } from '~/composables/useDashboard'
import { useTrips } from '~/composables/useTrips'
import { formatCurrency, formatDate, formatDateRange, formatNumber, tripStatusClass, tripStatusLabel } from '~/utils/format'

definePageMeta({ layout: 'atasan' })

interface PendingRequest {
  id: string
  employee: string
  destination: string
  date: string
  estimate: string
  realization: string
  status: string
  statusClass: string
}

const period = ref('bulan-ini')

const { summary, loading: dashboardLoading, error: dashboardError, fetchDashboard } = useDashboard()
const { user } = useAuth()
const { budgets, fetchBudgets } = useBudgets()
const { approvals, loading: approvalsLoading, error: approvalsError, fetchApprovals } = useApprovals()
const { trips, loading: tripsLoading, error: tripsError, fetchTrips } = useTrips()

const loading = computed(() => dashboardLoading.value || approvalsLoading.value || tripsLoading.value)
const error = computed(() => dashboardError.value ?? approvalsError.value ?? tripsError.value)

const perStatus = computed(() => summary.value?.per_status)

const metrics = computed(() => ({
  total: summary.value?.total_perjalanan ?? trips.value.length,
  pending: summary.value?.menunggu_approval ?? perStatus.value?.diajukan ?? approvals.value.length,
  ongoing: perStatus.value?.berjalan ?? trips.value.filter((trip) => trip.status === 'berjalan').length,
  completed: perStatus.value
    ? (perStatus.value.selesai ?? 0) + (perStatus.value.lengkap ?? 0)
    : trips.value.filter((trip) => trip.status === 'selesai' || trip.status === 'lengkap').length,
}))

const metricValue = (value: number) => {
  if (!summary.value && (loading.value || error.value)) return '—'
  return formatNumber(value)
}

const pendingRequests = computed<PendingRequest[]>(() => approvals.value.slice(0, 5).map((trip) => ({
  id: String(trip.id),
  employee: trip.user?.name ?? '—',
  destination: trip.tujuan,
  date: formatDate(trip.tanggal_berangkat),
  estimate: trip.estimasi_biaya === null ? '—' : formatCurrency(trip.estimasi_biaya),
  realization: formatCurrency(trip.total_biaya),
  status: tripStatusLabel(trip.status),
  statusClass: tripStatusClass(trip.status),
})))

const decisions = computed<DashboardActivity[]>(() => (summary.value?.aktivitas_terbaru ?? [])
  .filter((activity) => activity.kind === 'approval')
  .slice(0, 5))

const decisionToneClass = (tone: string) => (tone === 'success' ? 'approved' : 'rejected')
const decisionToneLabel = (tone: string) => (tone === 'success' ? 'Disetujui' : 'Ditolak')

const ongoingTrips = computed<Trip[]>(() => trips.value.filter((trip) => trip.status === 'berjalan').slice(0, 5))

const budgetPeriode = computed(() => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
})

const myBudget = computed(() => {
  const department = user.value?.department
  if (!department) return null
  return budgets.value.find((budget) => budget.department === department) ?? null
})

const budgetPercent = computed(() => {
  if (!myBudget.value || !myBudget.value.pagu || myBudget.value.pagu <= 0) {
    return myBudget.value && myBudget.value.terpakai > 0 ? 100 : 0
  }
  return Math.round((Number(myBudget.value.terpakai) / Number(myBudget.value.pagu)) * 100)
})

const loadTrips = async () => {
  const firstPage = await fetchTrips({ page: 1 })
  const allTrips = [...firstPage.data]
  const lastPage = firstPage.meta?.last_page ?? 1

  for (let page = 2; page <= lastPage; page += 1) {
    const nextPage = await fetchTrips({ page })
    allTrips.push(...nextPage.data)
  }

  trips.value = allTrips
}

onMounted(async () => {
  await Promise.allSettled([
    fetchDashboard(),
    fetchApprovals(1),
    loadTrips(),
    fetchBudgets(budgetPeriode.value),
  ])
})
</script>

<style scoped>
.atasan-page { min-height: calc(100vh - 70px); padding: 26px 28px; background: #f5f6f8; }
.breadcrumb { display: flex; gap: 9px; margin-bottom: 8px; color: #8792a3; font-size: 11px; }
.breadcrumb strong { color: var(--text); font-weight: 600; }
.page-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 18px; margin-bottom: 18px; }
.page-header h1 { margin: 0; color: var(--text); font-size: 24px; }
.page-header p, .panel-heading p { margin: 6px 0 0; color: var(--text-muted); font-size: 12px; }
.period-control { display: flex; flex-direction: column; gap: 6px; color: var(--text-muted); font-size: 11px; }
.period-control select, .filters input, .filters select { min-height: 38px; padding: 0 11px; border: 1px solid var(--border); border-radius: 7px; background: var(--white); color: var(--text); font: inherit; }
.metrics { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin: 18px 0; }
.content-grid { display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(250px, 0.85fr); gap: 16px; }
.panel { min-width: 0; padding: 18px; border: 1px solid var(--border); border-radius: 10px; background: var(--white); }
.panel-heading { display: flex; align-items: flex-start; justify-content: space-between; gap: 14px; margin-bottom: 16px; }
.panel-heading h2 { margin: 0; color: var(--text); font-size: 14px; }
.text-link { color: var(--primary); font-size: 11px; font-weight: 600; white-space: nowrap; }
.table-wrap { width: 100%; overflow-x: auto; }
table { width: 100%; min-width: 650px; border-collapse: collapse; text-align: left; }
th { padding: 11px 9px; background: #f8fafc; color: #788397; font-size: 10px; font-weight: 600; }
td { padding: 13px 9px; border-bottom: 1px solid #edf0f4; color: var(--text); font-size: 11px; }
.empty-cell { height: 92px; color: var(--text-muted); text-align: center; }
.status { display: inline-block; padding: 5px 8px; border-radius: 20px; background: #fff5dc; color: #9a6a08; font-size: 10px; white-space: nowrap; }
.status.approved { background: #e8f7ef; color: #15803d; }
.status.rejected { background: #fdecec; color: #b42318; }
.status.ongoing { background: #e8efff; color: #315bb5; }
.status.completed { background: #eaf7f1; color: #15803d; }
.status.draft { background: #eef1f5; color: #667085; }
.side-panels { display: grid; gap: 16px; align-content: start; }
.empty-state { padding: 14px 0 18px; color: var(--text-muted); font-size: 11px; }
.side-list { display: grid; gap: 11px; margin: 0 0 14px; padding: 0; list-style: none; }
.side-item { display: grid; gap: 4px; padding-bottom: 11px; border-bottom: 1px solid #edf0f4; }
.side-item:last-child { padding-bottom: 0; border-bottom: none; }
.side-title { color: var(--text); font-size: 12px; font-weight: 600; }
.side-title.link { color: var(--primary); text-decoration: none; }
.side-title.link:hover { text-decoration: underline; }
.budget-body { display: grid; gap: 8px; }
.budget-row { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; font-size: 11px; color: var(--text-muted); }
.budget-row strong { color: var(--text); font-size: 13px; }
.budget-row strong.negative { color: #b42318; }
.budget-row strong.positive { color: #15803d; }
.progress { height: 8px; border-radius: 999px; background: #eef1f5; overflow: hidden; }
.progress-bar { height: 100%; border-radius: 999px; background: var(--primary); }
.progress-bar.over { background: #dc2626; }
.budget-meta { color: var(--text-muted); font-size: 10px; }
.side-meta { color: var(--text-muted); font-size: 10px; }
.side-item .status { justify-self: start; }
.data-error { display: flex; flex-direction: column; gap: 5px; margin-bottom: 4px; padding: 14px 16px; border: 1px solid #f3c7c7; border-radius: 8px; background: #fff7f7; color: #b42318; font-size: 12px; line-height: 1.5; }
.data-error strong { font-size: 12px; }
@media (max-width: 1100px) { .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); } .content-grid { grid-template-columns: 1fr; } .side-panels { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 650px) { .atasan-page { padding: 18px 15px; } .page-header { align-items: flex-start; flex-direction: column; } .page-header h1 { font-size: 21px; } .metrics { gap: 10px; } .side-panels { grid-template-columns: 1fr; } }
@media (max-width: 390px) { .metrics { grid-template-columns: 1fr; } }
</style>
