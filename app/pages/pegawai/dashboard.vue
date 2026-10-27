<template>
  <div class="pegawai-dashboard-page">
    <div class="dashboard-header">
      <div>
        <h1>Dashboard Pegawai</h1>
        <p>Ringkasan pengajuan dan perjalanan Anda</p>
      </div>
    </div>

    <p v-if="errorMessage" class="state-message error">{{ errorMessage }}</p>

    <!-- Summary Cards -->
    <div class="summary-grid">
      <DashboardSummaryCard
        title="Total Pengajuan"
        :value="summary?.total_perjalanan ?? 0"
        icon="📝"
      />

      <DashboardSummaryCard
        title="Menunggu Persetujuan"
        :value="summary?.per_status.diajukan ?? 0"
        icon="◷"
      />

      <DashboardSummaryCard
        title="Perjalanan Aktif"
        :value="summary?.per_status.berjalan ?? 0"
        icon="➤"
      />

      <DashboardSummaryCard
        title="Ringkasan Pengeluaran"
        :value="formatCurrency(summary?.total_biaya ?? 0)"
        icon="💰"
      />
    </div>

    <!-- Main Content -->
    <div class="middle-content">
      <!-- Upcoming Trips -->
      <section class="upcoming-trips-card">
        <div class="section-header">
          <h2>Jadwal Perjalanan Berikutnya</h2>
        </div>
        <div class="upcoming-trips">
          <div class="section-header">
            <div>
              <h2>Perjalanan Mendatang</h2>
              <p>Jadwal perjalanan yang akan datang</p>
            </div>
            <NuxtLink to="/pegawai/rencana" class="view-all">Lihat Semua</NuxtLink>
          </div>

          <p v-if="pageLoading" class="state-message">Memuat perjalanan...</p>
          <p v-else-if="upcomingTrips.length === 0" class="state-message">Belum ada perjalanan mendatang.</p>
          <div v-else class="trip-list">
            <div v-for="trip in upcomingTrips" :key="trip.id" class="trip-item">
              <div class="trip-top">
                <span class="route">{{ trip.tujuan }}</span>
                <span class="date">{{ formatDate(trip.tanggal_berangkat) }}</span>
              </div>
              <p>{{ trip.keperluan }}</p>
            </div>
          </div>
        </div>
      </section>

      <!-- Recent Activity -->
      <section class="recent-activity-card">
        <div class="section-header">
          <h2>Aktivitas Terbaru</h2>
        </div>

        <p v-if="pageLoading" class="state-message">Memuat aktivitas...</p>
        <p v-else-if="recentActivities.length === 0" class="state-message">Belum ada aktivitas perjalanan.</p>
        <div v-else class="activity-list">
          <article v-for="activity in recentActivities" :key="activity.id" class="activity-item">
            <div class="activity-icon">{{ activityIcon(activity.status) }}</div>
            <div class="activity-info">
              <p>Perjalanan dinas ke {{ activity.tujuan }}</p>
            </div>
            <span class="activity-status" :class="tripStatusClass(activity.status)">{{ activity.status_label || tripStatusLabel(activity.status) }}</span>
            <span class="activity-time">{{ relativeTime(activity.created_at) }}</span>
          </article>
        </div>
      </section>
    </div>

    <!-- Quick Actions -->
    <section class="quick-actions-card">
      <div class="section-header">
        <h2>Tindakan Cepat</h2>
      </div>
      <div class="quick-actions">
        <NuxtLink to="/pegawai/rencana" class="action-button">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 11l3 3L22 4"/></svg>
          <span>Buat Rencana Perjalanan</span>
        </NuxtLink>
        <NuxtLink to="/pegawai/pengeluaran" class="action-button">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2Zm0 14H4V8h16v10Zm-2-5h-4v2h4v-2Z"/></svg>
          <span>Ajukan Pengeluaran</span>
        </NuxtLink>
        <NuxtLink to="/pegawai/laporan" class="action-button">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8ZM16 8v8M12 12h6M12 16h6"/></svg>
          <span>Lihat Laporan Saya</span>
        </NuxtLink>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import DashboardSummaryCard from '~/components/dashboard/SummaryCard.vue'
import { useDashboard } from '~/composables/useDashboard'
import { useTrips } from '~/composables/useTrips'
import type { TripStatus } from '~/types/api'
import { formatCurrency, formatDate, tripStatusClass, tripStatusLabel } from '~/utils/format'

const {
  summary,
  error: dashboardError,
  fetchDashboard,
} = useDashboard()

const {
  trips,
  error: tripsError,
  fetchTrips,
} = useTrips()

const pageLoading = ref(true)

const errorMessage = computed(() => dashboardError.value ?? tripsError.value)

const upcomingTrips = computed(() => {
  return trips.value
    .filter(trip => trip.status === 'disetujui' || trip.status === 'berjalan')
    .slice()
    .sort((a, b) => a.tanggal_berangkat.localeCompare(b.tanggal_berangkat))
})

const recentActivities = computed(() => summary.value?.terbaru ?? [])

const activityIcon = (status: TripStatus): string => {
  switch (status) {
    case 'selesai':
    case 'lengkap':
    case 'disetujui':
      return '✓'
    case 'berjalan':
      return '➤'
    case 'diajukan':
      return '🕐'
    case 'ditolak':
      return '✕'
    default:
      return '📝'
  }
}

const relativeTime = (value: string): string => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return formatDate(value)

  const diffMinutes = Math.floor((Date.now() - date.getTime()) / 60000)

  if (diffMinutes < 1) return 'Baru saja'
  if (diffMinutes < 60) return `${diffMinutes} menit lalu`

  const diffHours = Math.floor(diffMinutes / 60)
  if (diffHours < 24) return `${diffHours} jam lalu`

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays < 30) return `${diffDays} hari lalu`

  return formatDate(value)
}

onMounted(async () => {
  try {
    await Promise.allSettled([fetchDashboard(), fetchTrips()])
  } finally {
    pageLoading.value = false
  }
})
</script>

<style scoped>
.pegawai-dashboard-page {
  width: 100%;
  min-height: calc(100vh - 70px);
  padding: 28px;
  background: #f5f6f8;
}

.dashboard-header {
  margin-bottom: 24px;
}

.dashboard-header h1 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: var(--text);
}

.dashboard-header p {
  margin: 5px 0 0;
  font-size: 12px;
  color: var(--text-muted);
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.middle-content {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-top: 24px;
}

.upcoming-trips-card,
.recent-activity-card,
.quick-actions-card {
  flex: 1;
  min-width: 0;
}

.upcoming-trips-card,
.quick-actions-card {
  padding: 20px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.section-header h2 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.view-all {
  font-size: 12px;
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
}

.view-all:hover { text-decoration: underline; }

.upcoming-trips {
  display: flex; flex-direction: column; gap: 12px;
}

.trip-list { display: flex; flex-direction: column; gap: 12px; }

.trip-item { padding: 12px; background: #f6f7f9; border-radius: 8px; }
.trip-item .route { padding: 4px 7px; background: #e8f0ff; border-radius: 4px; font-size: 10px; color: var(--primary); overflow-wrap: anywhere; }
.trip-item .date { font-size: 9px; color: var(--text-muted); }
.trip-item p { margin: 9px 0 0; font-size: 11px; line-height: 1.5; color: var(--text); }

.recent-activity-card {
  padding: 20px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.activity-list { display: flex; flex-direction: column; gap: 12px; }

.activity-item { display: flex; align-items: center; min-height: 52px; padding: 10px 0; border-bottom: 1px solid var(--border); }
.activity-item:last-child { border-bottom: none; }
.activity-item .activity-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; margin-right: 12px; background: #eef3ff; border-radius: 50%; font-size: 13px; }
.activity-item .activity-info { flex: 1; min-width: 0; }
.activity-item .activity-info p { margin: 0; font-size: 11px; line-height: 1.4; color: var(--text); overflow-wrap: anywhere; }
.activity-item .activity-status { margin-right: 14px; padding: 5px 8px; border-radius: 4px; font-size: 9px; white-space: nowrap; }
.activity-item .activity-status.waiting { background: #fff4df; color: #e99a00; }
.activity-item .activity-status.completed { background: #e5f8f0; color: #20a77a; }

.quick-actions-card {
  padding: 20px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.quick-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }

.action-button {
  display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px; background: var(--white);
  border: 1px solid var(--border);
  border-radius: 8px; font-size: 12px; font-weight: 500; cursor: pointer; transition: 0.2s;
}
.action-button:hover { border-color: var(--primary); }
.action-button svg { width: 20px; height: 20px; }
.action-button span { flex: 1; }

/* RESPONSIVE */
@media (max-width: 1023px) {
  .pegawai-dashboard-page { padding: 22px; }
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .middle-content { grid-template-columns: 1fr; gap: 12px; }
  .upcoming-trips-card, .recent-activity-card, .quick-actions-card { padding: 16px; }
  .quick-actions { grid-template-columns: 1fr; gap: 10px; }
  .action-button { padding: 10px; font-size: 11px; }
}

@media (max-width: 767px) {
  .pegawai-dashboard-page { padding: 16px; }
  .dashboard-header h1 { font-size: 21px; }
  .summary-grid { grid-template-columns: 1fr; gap: 12px; }
  .dashboard-header p { font-size: 11px; }
  .section-header h2 { font-size: 15px; }
  .view-all { font-size: 11px; }
  .upcoming-trips-card, .recent-activity-card, .quick-actions-card { padding: 12px; }
  .trip-item { padding: 8px; }
  .activity-item { padding: 6px 0; }
  .activity-status { padding: 3px 5px; font-size: 8px; }
  .quick-actions-card { padding: 12px; }
  .quick-actions { gap: 8px; }
  .action-button { padding: 8px; font-size: 10px; }
}

@media (max-width: 540px) {
  .summary-grid { grid-template-columns: 1fr; }
}

@media (max-width: 374px) {
  .pegawai-dashboard-page { padding: 12px; }
}
</style>