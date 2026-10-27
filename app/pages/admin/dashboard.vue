<template>
  <div class="dashboard">

    <!-- Header -->
    <div class="dashboard-header">
      <div>
        <h1>Dashboard</h1>
        <p>Selamat datang kembali, {{ user?.name ?? 'Pengguna' }}</p>
      </div>

      <LayoutPageactions />
    </div>

    <!-- State -->
    <div
      v-if="error"
      class="state-banner error-banner"
    >
      <span>{{ error }}</span>
      <button
        type="button"
        :disabled="loading"
        @click="loadDashboard"
      >
        Coba Lagi
      </button>
    </div>

    <div
      v-else-if="loading && !summary"
      class="state-banner"
    >
      Memuat data dashboard...
    </div>

    <!-- Summary Cards -->
    <div class="summary-grid">
      <DashboardSummaryCard
        title="Total Perjalanan"
        :value="metric(summary?.total_perjalanan)"
        icon="✈"
      />

      <DashboardSummaryCard
        title="Menunggu Persetujuan"
        :value="metric(summary?.per_status?.diajukan)"
        icon="◷"
      />

      <DashboardSummaryCard
        title="Dalam Perjalanan"
        :value="metric(summary?.per_status?.berjalan)"
        icon="➤"
      />

      <DashboardSummaryCard
        title="Selesai"
        :value="metric(summary?.per_status?.selesai)"
        icon="✓"
      />
    </div>

    <!-- Chart & Upcoming Trips -->
    <div class="dashboard-middle">
      <div class="travel-summary">
        <div class="summary-header">
          <div>
            <h2>Ringkasan Perjalanan</h2>
            <p>Distribusi perjalanan berdasarkan status</p>
            <p class="total-cost">
              Total biaya: {{ formatCurrency(summary?.total_biaya) }}
            </p>
          </div>

          <button
            class="more-button"
            type="button"
          >
            •••
          </button>
        </div>

        <div
          v-if="hasChartData"
          class="chart"
        >
          <div
            v-for="item in chartData"
            :key="item.key"
            class="chart-item"
          >
            <div class="bar-area">
              <span class="bar-value">{{ item.value }}</span>

              <div
                class="bar"
                :style="{ height: barHeight(item.value) }"
                :title="`${item.label}: ${item.value}`"
              ></div>
            </div>

            <span class="month">
              {{ item.label }}
            </span>
          </div>
        </div>

        <p
          v-else
          class="state-empty"
        >
          Belum ada data perjalanan.
        </p>
      </div>

      <div class="upcoming-trips">
        <div class="section-header">
          <div>
            <h2>Perjalanan Mendatang</h2>
            <p>Jadwal perjalanan yang akan datang</p>
          </div>

          <NuxtLink to="/admin/perjalanan-dinas">
            Lihat Semua
          </NuxtLink>
        </div>

        <div
          v-if="upcomingTrips.length"
          class="trip-list"
        >
          <div
            v-for="trip in upcomingTrips"
            :key="trip.id"
            class="trip-item"
          >
            <div class="trip-top">
              <span class="route">{{ trip.route }}</span>
              <span class="date">{{ trip.date }}</span>
            </div>

            <p>{{ trip.description }}</p>
          </div>
        </div>

        <p
          v-else
          class="state-empty"
        >
          Belum ada perjalanan mendatang.
        </p>
      </div>
    </div>

    <!-- Recent Activities -->
    <div class="recent-activities">
      <div class="section-header">
        <div>
          <h2>Aktivitas Terbaru</h2>
          <p>Aktivitas terbaru pada sistem</p>
        </div>

        <NuxtLink to="/admin/perjalanan-dinas">
          Lihat Semua
        </NuxtLink>
      </div>

      <div
        v-if="recentActivities.length"
        class="activity-list"
      >
        <div
          v-for="activity in recentActivities"
          :key="activity.id"
          class="activity-item"
        >
          <div class="activity-icon">
            {{ activity.icon }}
          </div>

          <div class="activity-info">
            <p>{{ activity.title }}</p>
          </div>

          <span
            class="activity-status"
            :class="activity.statusClass"
          >
            {{ activity.status }}
          </span>

          <span class="activity-time">
            {{ activity.time }}
          </span>
        </div>
      </div>

      <p
        v-else
        class="state-empty"
      >
        Belum ada aktivitas terbaru.
      </p>
    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useDashboard } from '~/composables/useDashboard'
import { formatCurrency, formatDate, formatNumber, tripStatusClass, tripStatusLabel } from '~/utils/format'
import type { Trip, TripStatus } from '~/types/api'

const { user } = useAuth()
const { summary, loading, error, fetchDashboard } = useDashboard()

const STATUS_ORDER: TripStatus[] = [
  'draft',
  'diajukan',
  'disetujui',
  'ditolak',
  'berjalan',
  'selesai',
  'lengkap',
]

const STATUS_CHART_LABELS: Record<TripStatus, string> = {
  draft: 'Draft',
  diajukan: 'Diajukan',
  disetujui: 'Disetujui',
  ditolak: 'Ditolak',
  berjalan: 'Berjalan',
  selesai: 'Selesai',
  lengkap: 'Lengkap',
}

const loadDashboard = async () => {
  try {
    await fetchDashboard()
  } catch {
    // Pesan error sudah disediakan oleh composable useDashboard.
  }
}

onMounted(() => {
  void loadDashboard()
})

const metric = (value: number | undefined): string => {
  if (!summary.value) return loading.value ? '…' : '—'

  return formatNumber(value ?? 0)
}

const chartData = computed(() => {
  return STATUS_ORDER.map(status => ({
    key: status,
    label: STATUS_CHART_LABELS[status],
    value: summary.value?.per_status?.[status] ?? 0,
  }))
})

const maxChartValue = computed(() => {
  return Math.max(1, ...chartData.value.map(item => item.value))
})

const barHeight = (value: number): string => {
  if (value <= 0) return '0px'

  return `${Math.max(8, Math.round((value / maxChartValue.value) * 130))}px`
}

const hasChartData = computed(() => {
  return chartData.value.some(item => item.value > 0)
})

const statusIcon = (status: TripStatus): string => {
  switch (status) {
    case 'diajukan':
      return '◷'
    case 'disetujui':
      return '✓'
    case 'ditolak':
      return '✕'
    case 'berjalan':
      return '➤'
    case 'selesai':
    case 'lengkap':
      return '✓'
    default:
      return '✎'
  }
}

const recentActivities = computed(() => {
  return (summary.value?.terbaru ?? []).slice(0, 5).map((trip: Trip) => ({
    id: trip.id,
    icon: statusIcon(trip.status),
    title: `Perjalanan dinas ke ${trip.tujuan}`,
    status: trip.status_label || tripStatusLabel(trip.status),
    statusClass: tripStatusClass(trip.status),
    time: formatDate(trip.created_at),
  }))
})

const upcomingTrips = computed(() => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return [...(summary.value?.terbaru ?? [])]
    .filter((trip) => {
      const departure = new Date(trip.tanggal_berangkat)

      return !Number.isNaN(departure.getTime()) && departure >= today
    })
    .sort((a, b) => a.tanggal_berangkat.localeCompare(b.tanggal_berangkat))
    .slice(0, 3)
    .map(trip => ({
      id: trip.id,
      route: trip.tujuan,
      date: formatDate(trip.tanggal_berangkat),
      description: trip.keperluan,
    }))
})
</script>

<style scoped>
.dashboard {
  width: 100%;
  min-height: calc(100vh - 70px);
  padding: 28px;
  background: #f5f6f8;
}

/* =========================
   HEADER
========================= */

.dashboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 24px;
}

.dashboard-header > div {
  min-width: 0;
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

/* =========================
   STATE
========================= */

.state-banner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;

  margin-bottom: 16px;
  padding: 10px 14px;

  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 8px;

  font-size: 11px;
  color: var(--text-muted);
}

.error-banner {
  border-color: #ffd1d1;
  background: #fff5f5;
  color: #ef5350;
}

.state-banner button {
  flex-shrink: 0;

  padding: 4px 10px;

  border: 1px solid currentColor;
  border-radius: 5px;

  background: transparent;
  color: inherit;

  font-family: inherit;
  font-size: 10px;
  font-weight: 600;

  cursor: pointer;
}

.state-banner button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.state-empty {
  margin: 0;
  padding: 24px 12px;

  text-align: center;

  font-size: 11px;
  color: #8792a5;
}

/* =========================
   SUMMARY CARDS
========================= */

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

/* =========================
   MIDDLE SECTION
========================= */

.dashboard-middle {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-top: 24px;
}

.dashboard-middle > :first-child {
  flex: 1;
  min-width: 0;
}

/* =========================
   TRAVEL SUMMARY
========================= */

.travel-summary {
  flex: 1;
  min-width: 0;

  padding: 20px;

  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.summary-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.summary-header h2 {
  margin: 0;

  font-size: 16px;
  font-weight: 600;
  color: var(--text);
}

.summary-header p {
  margin: 5px 0 0;

  font-size: 11px;
  color: var(--text-muted);
}

.summary-header .total-cost {
  margin-top: 6px;

  font-size: 11px;
  font-weight: 600;
  color: var(--text);
}

.more-button {
  flex-shrink: 0;

  border: none;
  background: transparent;

  font-size: 16px;
  color: var(--text-muted);

  cursor: pointer;
}

.chart {
  height: 180px;

  margin-top: 24px;

  display: flex;
  align-items: flex-end;
  gap: 12px;
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

.bar-area {
  width: 100%;
  height: 150px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;

  gap: 4px;
}

.bar-value {
  font-size: 9px;
  color: #718096;
}

.bar {
  width: 18px;
  max-width: 100%;

  max-height: 130px;

  background: var(--primary);

  border-radius: 5px 5px 0 0;

  transition: height 0.2s ease;
}

.month {
  font-size: 9px;
  color: var(--text-muted);
  text-align: center;
}

/* =========================
   UPCOMING TRIPS
========================= */

.upcoming-trips {
  width: 300px;
  flex-shrink: 0;
  padding: 20px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 16px;
}

.section-header h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 600;
  color: var(--text);
}

.section-header p {
  margin: 5px 0 0;
  font-size: 10px;
  color: var(--text-muted);
  line-height: 1.4;
}

.section-header a {
  flex-shrink: 0;
  font-size: 10px;
  color: var(--primary);
  text-decoration: none;
}

.trip-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.trip-item {
  padding: 12px;
  background: #f6f7f9;
  border-radius: 8px;
}

.trip-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
}

.route {
  padding: 4px 7px;
  background: #e8f0ff;
  border-radius: 4px;
  font-size: 10px;
  color: var(--primary);

  overflow-wrap: anywhere;
}

.date {
  font-size: 9px;
  color: var(--text-muted);
}

.trip-item p {
  margin: 9px 0 0;
  font-size: 11px;
  line-height: 1.5;
  color: var(--text);
}

/* =========================
   RECENT ACTIVITIES
========================= */

.recent-activities {
  margin-top: 24px;
  padding: 20px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.activity-list {
  display: flex;
  flex-direction: column;
}

.activity-item {
  display: flex;
  align-items: center;
  min-height: 52px;
  padding: 10px 0;
  border-bottom: 1px solid var(--border);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  background: #eef3ff;
  border-radius: 50%;
  font-size: 13px;
}

.activity-info {
  flex: 1;
  min-width: 0;
}

.activity-info p {
  margin: 0;
  font-size: 11px;
  line-height: 1.4;
  color: var(--text);

  overflow-wrap: anywhere;
}

.activity-status {
  margin-right: 14px;
  padding: 5px 8px;
  border-radius: 4px;
  font-size: 9px;
  white-space: nowrap;
}

.activity-status.waiting {
  background: #fff4df;
  color: #e99a00;
}

.activity-status.completed {
  background: #e5f8f0;
  color: #20a77a;
}

.activity-status.approved {
  background: #e8efff;
  color: var(--primary);
}

.activity-status.rejected {
  background: #ffe8e8;
  color: #ef5350;
}

.activity-status.ongoing {
  background: #fff3df;
  color: #ef9b16;
}

.activity-status.draft {
  background: #eef2f6;
  color: #667085;
}

.activity-time {
  width: 55px;
  flex-shrink: 0;
  font-size: 9px;
  color: var(--text-muted);
  text-align: right;
}

/* =========================
   RESPONSIVE
========================= */

@media (max-width: 1023px) {
  .dashboard {
    padding: 22px;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-middle {
    flex-direction: column;
    align-items: stretch;
  }

  .upcoming-trips {
    width: 100%;
  }
}

@media (max-width: 767px) {
  .dashboard {
    padding: 16px;
  }

  .dashboard-header {
    align-items: flex-start;
    flex-wrap: wrap;
    gap: 12px;
    margin-bottom: 18px;
  }

  .dashboard-header h1 {
    font-size: 21px;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .dashboard-middle {
    gap: 12px;
    margin-top: 18px;
  }

  .travel-summary {
    padding: 16px;
  }

  .chart {
    gap: 6px;
    margin-top: 18px;
  }

  .bar {
    width: 12px;
  }

  .month {
    font-size: 8px;
  }

  .upcoming-trips {
    padding: 16px;
  }

  .section-header {
    margin-bottom: 12px;
  }

  .recent-activities {
    margin-top: 18px;
    padding: 16px;
  }

  .activity-item {
    display: grid;
    grid-template-columns: 32px minmax(0, 1fr);
    column-gap: 12px;
    row-gap: 7px;

    align-items: start;

    padding: 12px 0;
  }

  .activity-icon {
    grid-row: 1 / 3;
    margin-right: 0;
  }

  .activity-info {
    grid-column: 2;
  }

  .activity-status {
    grid-column: 2;
    justify-self: start;

    margin-right: 0;
  }

  .activity-time {
    grid-column: 2;
    width: auto;

    text-align: left;
  }
}

@media (max-width: 540px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }

  .chart {
    gap: 4px;
  }

  .bar {
    width: 9px;
  }
}

@media (max-width: 374px) {
  .dashboard {
    padding: 12px;
  }

  .travel-summary {
    padding: 14px;
  }

  .recent-activities {
    padding: 12px;
  }

  .activity-info p {
    font-size: 10.5px;
  }
}
</style>
