<template>
  <div class="hrd-dashboard-page">
    <div class="dashboard-header">
      <div>
        <h1>Dashboard HRD</h1>
        <p>Monitoring perjalanan dinas dan data pegawai</p>
      </div>
    </div>

    <!-- Summary Cards -->
    <div class="summary-grid">
      <DashboardSummaryCard
        title="Total Pegawai"
        :value="employeeTotal"
        icon="👥"
      />

      <DashboardSummaryCard
        title="Total Pengguna"
        :value="userTotal"
        icon="✓"
      />

      <DashboardSummaryCard
        title="Dalam Perjalanan"
        :value="berjalanCount"
        icon="▶"
      />

      <DashboardSummaryCard
        title="Perjalanan Selesai"
        :value="selesaiCount"
        icon="✓"
      />
    </div>

    <div v-if="error" class="data-error" role="alert">{{ error }}</div>
    <div v-if="loading" class="data-loading">Memuat data dashboard...</div>

    <!-- Charts & Stats -->
    <div class="middle-content">
      <!-- Distribution by Department -->
      <section class="department-card">
        <div class="section-header">
          <h2>Distribusi Pegawai per Departemen</h2>
        </div>
        <div v-if="deptData.length === 0" class="chart-empty">
          Belum ada data departemen.
        </div>
        <div v-else class="chart">
          <div v-for="item in deptData" :key="item.dept" class="chart-item">
            <div class="bar-wrapper">
              <div class="bar" :style="{ width: `${item.percentage}%` }"></div>
            </div>
            <span class="dept-name">{{ item.dept }}</span>
            <span class="bar-value">{{ item.count }} orang</span>
          </div>
        </div>
      </section>

      <!-- Active Trips -->
      <section class="trips-card">
        <div class="section-header">
          <h2>Perjalanan yang Sedang Berlangsung</h2>
        </div>
        <div class="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Pegawai</th>
                <th>Tujuan</th>
                <th>Berangkat</th>
                <th>Kembali</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr v-if="tripsLoading && activeTrips.length === 0">
                <td colspan="6" class="table-state">Memuat perjalanan...</td>
              </tr>
              <tr v-else-if="activeTrips.length === 0">
                <td colspan="6" class="table-state">Tidak ada perjalanan yang sedang berlangsung.</td>
              </tr>
              <tr v-for="(trip, index) in activeTrips" :key="trip.id">
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
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <!-- Recent Activities -->
    <section class="recent-card">
      <div class="section-header">
        <h2>Aktivitas Terbaru</h2>
        <NuxtLink to="/hrd/pelaksanaan" class="view-all">Lihat Semua</NuxtLink>
      </div>
      <div class="activity-list">
        <p v-if="recentActivities.length === 0" class="table-state">Belum ada aktivitas.</p>
        <article v-for="activity in recentActivities" :key="activity.id" class="activity-item">
          <div class="activity-icon">{{ activity.icon }}</div>
          <div class="activity-info">
            <p>{{ activity.title }}</p>
          </div>
          <span class="activity-status" :class="activity.statusClass">{{ activity.status }}</span>
          <span class="activity-time">{{ activity.time }}</span>
        </article>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import DashboardSummaryCard from '~/components/dashboard/SummaryCard.vue'
import { useDashboard } from '~/composables/useDashboard'
import { useTrips } from '~/composables/useTrips'
import { useUsers } from '~/composables/useUsers'
import { formatDate, tripStatusClass, tripStatusLabel } from '~/utils/format'

const {
  summary,
  loading: dashboardLoading,
  error: dashboardError,
  fetchDashboard,
} = useDashboard()

const {
  trips: activeTrips,
  loading: tripsLoading,
  error: tripsError,
  fetchTrips,
} = useTrips()

const {
  users,
  loading: usersLoading,
  error: usersError,
  fetchUsers,
} = useUsers()

const loading = computed(() => dashboardLoading.value || tripsLoading.value || usersLoading.value)
const error = computed(() => dashboardError.value ?? tripsError.value ?? usersError.value ?? '')

const employeeTotal = computed(() => users.value.filter((user) => user.roles?.includes('pegawai')).length)
const userTotal = computed(() => users.value.length)

const berjalanCount = computed(() => summary.value?.per_status?.berjalan ?? 0)
const selesaiCount = computed(
  () => (summary.value?.per_status?.selesai ?? 0) + (summary.value?.per_status?.lengkap ?? 0),
)

const deptData = computed(() => {
  const counts = new Map<string, number>()

  for (const user of users.value) {
    if (!user.department) continue
    counts.set(user.department, (counts.get(user.department) ?? 0) + 1)
  }

  const entries = Array.from(counts.entries()).sort(([, a], [, b]) => b - a)
  const max = entries.reduce((highest, [, count]) => Math.max(highest, count), 0)

  return entries.map(([dept, count]) => ({
    dept,
    count,
    percentage: max > 0 ? Math.max(10, Math.round((count / max) * 100)) : 0,
  }))
})

const relativeTime = (value: string | null | undefined) => {
  if (!value) return '—'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return formatDate(value)

  const diff = Date.now() - date.getTime()
  const minutes = Math.floor(diff / 60_000)

  if (minutes < 1) return 'Baru saja'
  if (minutes < 60) return `${minutes} menit lalu`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} jam lalu`

  const days = Math.floor(hours / 24)
  if (days < 30) return `${days} hari lalu`

  return formatDate(value)
}

const recentActivities = computed(() => (summary.value?.terbaru ?? []).map((trip) => ({
  id: trip.id,
  icon: trip.status === 'diajukan' ? '🕐' : trip.status === 'berjalan' ? '▶' : '✓',
  title: `Perjalanan ke ${trip.tujuan} — ${trip.user?.name ?? 'Pegawai'}`,
  status: tripStatusLabel(trip.status),
  statusClass: tripStatusClass(trip.status),
  time: relativeTime(trip.created_at),
})))

onMounted(async () => {
  try {
    await Promise.all([
      fetchDashboard(),
      fetchTrips({ status: 'berjalan', per_page: 100 }),
      fetchUsers({ per_page: 100 }),
    ])
  } catch {
    // pesan error sudah disimpan oleh composable
  }
})
</script>

<style scoped>
.hrd-dashboard-page {
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

.department-card,
.trips-card,
.recent-card {
  flex: 1;
  min-width: 0;
}

.department-card {
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

.chart {
  height: 180px;
  display: flex;
  align-items: flex-end;
  gap: 16px;
}

.chart-item {
  flex: 1;
  min-width: 0;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
}

.bar-wrapper {
  width: 100%;
  height: 140px;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bar {
  width: 20px;
  max-width: 100%;
  background: var(--primary);
  border-radius: 5px 5px 0 0;
  transition: width 0.2s ease;
}

.chart-item span {
  font-size: 10px;
  color: var(--text-muted);
}

.bar-value {
  font-size: 9px;
  font-weight: 600;
  color: var(--primary);
}

.trips-card {
  padding: 20px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.trips-card table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.trips-card thead { background: #f3f4f6; }
.trips-card th { padding: 10px 12px; text-align: left; font-size: 9px; font-weight: 600; color: #718096; }
.trips-card td { padding: 12px; border-bottom: 1px solid #e5e8ee; font-size: 10px; color: #344054; vertical-align: middle; }
.trips-card tbody tr:last-child td { border-bottom: none; }
.trips-card tbody tr:hover { background: #fafbfc; }

.recent-card {
  padding: 20px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.activity-list { display: flex; flex-direction: column; gap: 12px; }

.activity-item { display: flex; align-items: center; min-height: 52px; padding: 10px 0; border-bottom: 1px solid var(--border); }
.activity-item:last-child { border-bottom: none; }

.activity-icon { width: 32px; height: 32px; display: flex; align-items: center; justify-content: center; margin-right: 12px; background: #eef3ff; border-radius: 50%; font-size: 13px; }
.activity-info { flex: 1; min-width: 0; }
.activity-info p { margin: 0; font-size: 11px; line-height: 1.4; color: var(--text); overflow-wrap: anywhere; }
.activity-status { margin-right: 14px; padding: 5px 8px; border-radius: 4px; font-size: 9px; white-space: nowrap; }
.activity-status.waiting { background: #fff4df; color: #e99a00; }
.activity-status.completed { background: #e5f8f0; color: #20a77a; }
.activity-status.approved { background: #e8efff; color: var(--primary); }

.activity-time { width: 55px; flex-shrink: 0; font-size: 9px; color: var(--text-muted); text-align: right; }

.view-all {
  font-size: 12px;
  color: var(--primary);
  text-decoration: none;
  font-weight: 500;
}

.view-all:hover { text-decoration: underline; }

.data-error { margin-bottom: 16px; padding: 11px 14px; border: 1px solid #f4c7c7; border-radius: 8px; background: #fff5f5; color: #b42318; font-size: 11px; }
.data-loading { margin-bottom: 16px; font-size: 11px; color: var(--text-muted); }
.chart-empty { padding: 28px 12px; text-align: center; font-size: 11px; color: #8792a5; }
.table-state { padding: 22px 12px; text-align: center; font-size: 10px; color: #8792a5; }

.status-badge { display: inline-flex; align-items: center; padding: 4px 8px; border-radius: 4px; font-size: 9px; font-weight: 600; white-space: nowrap; }
.status-badge.draft { background: #eef1f7; color: #667085; }
.status-badge.waiting { background: #fff4df; color: #e99a00; }
.status-badge.approved { background: #e8efff; color: var(--primary); }
.status-badge.rejected { background: #ffe8e8; color: #ef5350; }
.status-badge.ongoing { background: #fff4df; color: #e99a00; }
.status-badge.completed { background: #e5f8f0; color: #20a77a; }

/* RESPONSIVE */
@media (max-width: 1023px) {
  .hrd-dashboard-page { padding: 22px; }
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .middle-content { grid-template-columns: 1fr; gap: 12px; }
}

@media (max-width: 767px) {
  .hrd-dashboard-page { padding: 16px; }
  .dashboard-header h1 { font-size: 21px; }
  .summary-grid { grid-template-columns: 1fr; gap: 12px; }
  .section-header h2 { font-size: 15px; }
  .chart { gap: 8px; }
  .bar { width: 16px; }
  .activity-item { padding: 8px 0; }
  .activity-status { padding: 3px 6px; font-size: 8px; }
  .activity-time { width: auto; font-size: 8px; }
}

@media (max-width: 540px) {
  .summary-grid { grid-template-columns: 1fr; }
}

@media (max-width: 374px) {
  .hrd-dashboard-page { padding: 12px; }
}
</style>