<template>
  <div class="dashboard-page">
    <div class="dashboard-header">
      <div>
        <h1>Dashboard Finance</h1>
        <p>Ringkasan keuangan perjalanan dinas</p>
      </div>
    </div>

    <div v-if="error" class="data-error" role="alert">{{ error }}</div>

    <!-- Summary Cards -->
    <div class="summary-grid">
      <DashboardSummaryCard
        title="Total Pengeluaran"
        :value="formatCurrency(totalExpenses)"
        icon="💰"
      />

      <DashboardSummaryCard
        title="Jumlah Pengeluaran"
        :value="String(expenseRows.length)"
        icon="▤"
      />

      <DashboardSummaryCard
        title="Tanpa Bukti"
        :value="formatCurrency(withoutReceipt)"
        icon="⏳"
      />

      <DashboardSummaryCard
        title="Dengan Bukti"
        :value="formatCurrency(withReceipt)"
        icon="✓"
      />
    </div>

    <!-- Charts & Tables -->
    <div class="dashboard-middle">
      <!-- Expense Trend Chart -->
      <section class="chart-card">
        <div class="section-header">
          <h2>Tren Pengeluaran Bulanan</h2>
        </div>
        <div v-if="loading" class="chart-empty">Memuat pengeluaran...</div>
        <div v-else-if="monthlyExpenses.length === 0" class="chart-empty">
          Belum ada pengeluaran tercatat.
        </div>
        <div v-else class="chart">
          <div
            v-for="item in monthlyExpenses"
            :key="item.month"
            class="chart-item"
          >
            <div class="bar-wrapper">
              <div
                class="bar"
                :style="{ height: `${item.percentage}%` }"
              ></div>
            </div>
            <span>{{ item.month }}</span>
            <span class="bar-value">{{ formatCurrency(item.value) }}</span>
          </div>
        </div>
      </section>

      <!-- Status Distribution -->
      <section class="status-card">
        <div class="section-header">
          <h2>Status Perjalanan</h2>
        </div>
        <div class="status-grid">
          <div
            v-for="status in statusData"
            :key="status.label"
            class="status-item"
          >
            <div class="status-indicator" :class="status.class"></div>
            <div class="status-info">
              <span class="status-label">{{ status.label }}</span>
              <span class="status-count">{{ status.value }} perjalanan</span>
            </div>
          </div>
        </div>
      </section>
    </div>

    <!-- Recent Expenses -->
    <section class="queue-card">
      <div class="section-header">
        <h2>Pengeluaran Terbaru</h2>
        <NuxtLink to="/finance/laporan" class="view-all">Lihat Semua</NuxtLink>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Pegawai</th>
              <th>Tujuan</th>
              <th>Tanggal</th>
              <th>Jumlah</th>
              <th>Bukti</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && expenseRows.length === 0">
              <td colspan="6" class="table-state">Memuat pengeluaran...</td>
            </tr>
            <tr v-else-if="expenseRows.length === 0">
              <td colspan="6" class="table-state">Belum ada pengeluaran tercatat.</td>
            </tr>
            <tr v-for="(row, index) in recentExpenses" :key="`${row.employee}-${row.dateKey}-${index}`">
              <td>{{ index + 1 }}</td>
              <td>{{ row.employee }}</td>
              <td>{{ row.destination }}</td>
              <td>{{ row.date }}</td>
              <td>{{ formatCurrency(row.amount) }}</td>
              <td>
                <span class="status-badge" :class="row.receipts > 0 ? 'completed' : 'waiting'">
                  {{ row.receipts > 0 ? `${row.receipts} file` : 'Belum ada' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Recent Trips -->
    <section class="payments-card">
      <div class="section-header">
        <h2>Perjalanan Terbaru</h2>
        <NuxtLink to="/finance/laporan" class="view-all">Lihat Semua</NuxtLink>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Pegawai</th>
              <th>Tujuan</th>
              <th>Berangkat</th>
              <th>Estimasi / Realisasi</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="recentTrips.length === 0">
              <td colspan="6" class="table-state">Belum ada perjalanan.</td>
            </tr>
            <tr v-for="(trip, index) in recentTrips" :key="trip.id">
              <td>{{ index + 1 }}</td>
              <td>{{ trip.user?.name || '—' }}</td>
              <td>{{ trip.tujuan }}</td>
              <td>{{ formatDate(trip.tanggal_berangkat) }}</td>
              <td>
                {{ trip.estimasi_biaya === null ? '—' : formatCurrency(Number(trip.estimasi_biaya)) }}
                / {{ formatCurrency(Number(trip.total_biaya ?? 0)) }}
              </td>
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

    <!-- Payment Queue -->
    <section class="queue-card">
      <div class="section-header">
        <h2>Pembayaran Menunggu Aksi</h2>
        <NuxtLink to="/finance/pembayaran" class="view-all">Lihat Semua</NuxtLink>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Pegawai</th>
              <th>Tujuan</th>
              <th>Diajukan</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="pendingPayments.length === 0">
              <td colspan="5" class="table-state">Tidak ada pengajuan pembayaran yang menunggu.</td>
            </tr>
            <tr v-for="(payment, index) in pendingPayments" :key="payment.id">
              <td>{{ index + 1 }}</td>
              <td>{{ payment.trip?.user?.name || payment.requested_by?.name || '—' }}</td>
              <td>{{ payment.trip?.tujuan || '—' }}</td>
              <td>{{ formatCurrency(payment.jumlah_diajukan) }}</td>
              <td>
                <span class="status-badge" :class="payment.status === 'disetujui' ? 'approved' : 'waiting'">
                  {{ payment.status_label }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import DashboardSummaryCard from '~/components/dashboard/SummaryCard.vue'
import { useDashboard } from '~/composables/useDashboard'
import { useReports } from '~/composables/useReports'
import { usePayments } from '~/composables/usePayments'
import { formatCurrency, formatDate, tripStatusClass, tripStatusLabel } from '~/utils/format'
import type { TripStatus } from '~/types/api'

const { summary, error: dashboardError, fetchDashboard } = useDashboard()
const {
  expenseReport,
  loading,
  error: reportError,
  fetchExpenseReport,
} = useReports()

const { payments, fetchPayments } = usePayments()

const error = computed(() => dashboardError.value ?? reportError.value ?? '')

const asText = (value: string | number | null | undefined) =>
  (value === null || value === undefined ? '—' : String(value))
const asNumber = (value: string | number | null | undefined) => Number(value) || 0

const expenseRows = computed(() => (expenseReport.value?.rows ?? []).map((row) => {
  const date = asText(row[3])
  const [day, month, year] = date.split('-')

  return {
    employee: asText(row[1]),
    destination: asText(row[2]),
    date,
    dateKey: `${year}-${month}-${day}`,
    jenis: asText(row[4]),
    keterangan: asText(row[5]),
    amount: asNumber(row[6]),
    receipts: asNumber(row[7]),
  }
}))

const recentExpenses = computed(() => [...expenseRows.value].reverse().slice(0, 5))

const totalExpenses = computed(() => expenseRows.value.reduce((sum, row) => sum + row.amount, 0))
const withReceipt = computed(() =>
  expenseRows.value.filter((row) => row.receipts > 0).reduce((sum, row) => sum + row.amount, 0))
const withoutReceipt = computed(() =>
  expenseRows.value.filter((row) => row.receipts === 0).reduce((sum, row) => sum + row.amount, 0))

const monthlyExpenses = computed(() => {
  const totals = new Map<string, number>()

  for (const row of expenseRows.value) {
    const month = row.dateKey.slice(0, 7)
    if (month && !month.includes('undefined')) {
      totals.set(month, (totals.get(month) ?? 0) + row.amount)
    }
  }

  const entries = Array.from(totals.entries()).sort(([a], [b]) => a.localeCompare(b))
  const max = entries.reduce((highest, [, total]) => Math.max(highest, total), 0)

  return entries.map(([month, total]) => ({
    month: new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(new Date(`${month}-01`)),
    value: total,
    percentage: max > 0 ? Math.max(8, Math.round((total / max) * 100)) : 0,
  }))
})

const statusLabels: Record<TripStatus, { label: string; class: string }> = {
  draft: { label: 'Draft', class: 'draft' },
  diajukan: { label: 'Menunggu Persetujuan', class: 'waiting' },
  disetujui: { label: 'Disetujui', class: 'approved' },
  ditolak: { label: 'Ditolak', class: 'rejected' },
  berjalan: { label: 'Berlangsung', class: 'ongoing' },
  selesai: { label: 'Selesai', class: 'completed' },
  lengkap: { label: 'Lengkap', class: 'completed' },
}

const statusData = computed(() => {
  const perStatus = summary.value?.per_status ?? ({} as Record<TripStatus, number>)

  return (Object.keys(perStatus) as TripStatus[])
    .map((status) => ({
      label: statusLabels[status]?.label ?? status,
      class: statusLabels[status]?.class ?? 'draft',
      value: perStatus[status] ?? 0,
    }))
})

const recentTrips = computed(() => summary.value?.terbaru?.slice(0, 5) ?? [])

const pendingPayments = computed(() =>
  payments.value
    .filter((payment) => payment.status === 'diajukan' || payment.status === 'disetujui')
    .slice(0, 5))

onMounted(async () => {
  try {
    await Promise.all([
      fetchDashboard(),
      fetchExpenseReport(),
      fetchPayments({ per_page: 100 }),
    ])
  } catch {
    // pesan error sudah disimpan oleh composable
  }
})
</script>

<style scoped>
.dashboard-page {
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

.data-error {
  margin-bottom: 16px;
  padding: 11px 14px;
  border: 1px solid #f4c7c7;
  border-radius: 8px;
  background: #fff5f5;
  color: #b42318;
  font-size: 11px;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.dashboard-middle {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-top: 24px;
}

.chart-card,
.status-card {
  flex: 1;
  min-width: 0;
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

.view-all:hover {
  text-decoration: underline;
}

.chart-card,
.status-card,
.queue-card,
.payments-card {
  padding: 20px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.queue-card,
.payments-card {
  margin-top: 16px;
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
  width: 24px;
  max-width: 100%;
  background: var(--primary);
  border-radius: 5px 5px 0 0;
  transition: height 0.2s ease;
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

.chart-empty {
  padding: 28px 12px;
  text-align: center;
  font-size: 11px;
  color: #8792a5;
}

.status-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: #fafbfc;
  border-radius: 8px;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.status-indicator.draft { background: #94a3b8; }
.status-indicator.waiting { background: #f59e0b; }
.status-indicator.approved { background: #2563eb; }
.status-indicator.rejected { background: #ef5350; }
.status-indicator.ongoing { background: #f59e0b; }
.status-indicator.completed { background: #16a34a; }

.status-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
}

.status-label {
  font-size: 12px;
  color: var(--text);
}

.status-count {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.table-wrapper {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  table-layout: fixed;
}

thead {
  background: #f3f4f6;
}

th {
  padding: 10px 12px;
  text-align: left;
  font-size: 9px;
  font-weight: 600;
  color: #718096;
}

td {
  padding: 12px;
  border-bottom: 1px solid #e5e8ee;
  font-size: 10px;
  color: #344054;
  vertical-align: middle;
}

tbody tr:last-child td {
  border-bottom: none;
}

tbody tr:hover {
  background: #fafbfc;
}

.table-state {
  padding: 22px 12px;
  text-align: center;
  font-size: 10px;
  color: #8792a5;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 9px;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.draft { background: #eef1f7; color: #667085; }
.status-badge.waiting { background: #fff3df; color: #b45309; }
.status-badge.approved { background: #e8efff; color: var(--primary); }
.status-badge.rejected { background: #ffe8e8; color: #ef5350; }
.status-badge.ongoing { background: #fff3df; color: #b45309; }
.status-badge.completed { background: #dff7ef; color: #18a77c; }

/* RESPONSIVE */
@media (max-width: 1023px) {
  .dashboard-page {
    padding: 22px;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dashboard-middle {
    flex-direction: column;
    align-items: stretch;
  }
}

@media (max-width: 767px) {
  .dashboard-page {
    padding: 16px;
  }

  .dashboard-header {
    margin-bottom: 18px;
  }

  .dashboard-header h1 {
    font-size: 21px;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px;
  }

  .chart-card,
  .status-card,
  .queue-card,
  .payments-card {
    padding: 16px;
  }

  .chart {
    gap: 8px;
  }

  .bar {
    width: 16px;
  }

  th, td {
    padding: 8px 6px;
    font-size: 9px;
  }
}

@media (max-width: 540px) {
  .summary-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 374px) {
  .dashboard-page {
    padding: 12px;
  }
}
</style>
