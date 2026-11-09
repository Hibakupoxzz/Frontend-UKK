<template>
  <div class="pegawai-laporansaya-page">
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <NuxtLink to="/dashboard">Dashboard</NuxtLink>
      <AppIcon name="chevron-right" class="crumb-sep" />
      <NuxtLink to="/pegawai/dashboard">Pegawai</NuxtLink>
      <AppIcon name="chevron-right" class="crumb-sep" />
      <strong>Laporan Saya</strong>
    </div>

    <!-- Header -->
    <div class="page-header">
      <h1>Laporan Saya</h1>
      <div class="page-actions">
        <button class="export-button" type="button" :disabled="exporting || loading" @click="handleExport('pdf')">
          {{ exporting ? 'Menyiapkan...' : 'Ekspor PDF' }}
        </button>
        <button class="export-button outline" type="button" :disabled="exporting || loading" @click="handleExport('xlsx')">
          Ekspor Excel
        </button>
      </div>
    </div>

    <div v-if="error" class="data-error" role="alert">{{ error }}</div>
    <div v-if="exportError" class="data-error" role="alert">{{ exportError }}</div>

    <!-- Summary -->
    <div class="summary">
      <div class="summary-item">
        <div class="summary-icon cyan"><AppIcon name="route" /></div>
        <div>
          <p>Total Perjalanan</p>
          <h2>{{ totalTrips }}</h2>
        </div>
      </div>
      <div class="summary-item">
        <div class="summary-icon green"><AppIcon name="wallet" /></div>
        <div>
          <p>Total Pengeluaran</p>
          <h2>{{ formatCurrency(totalExpense) }}</h2>
        </div>
      </div>
      <div class="summary-item">
        <div class="summary-icon blue"><AppIcon name="check-circle" /></div>
        <div>
          <p>Status Akhir</p>
          <h2>{{ statusText }}</h2>
        </div>
      </div>
    </div>

    <!-- Personal Trip History -->
    <section class="trip-history-card">
      <div class="section-header">
        <h2>Riwayat Perjalanan Saya</h2>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th class="no-column">No</th>
              <th>Tujuan</th>
              <th>Tanggal</th>
              <th>Status</th>
              <th class="action-column">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && personalTrips.length === 0">
              <td colspan="5" class="table-state">Memuat laporan perjalanan...</td>
            </tr>
            <tr v-else-if="personalTrips.length === 0">
              <td colspan="5" class="table-state">Belum ada riwayat perjalanan.</td>
            </tr>
            <tr v-for="(trip, index) in personalTrips" :key="trip.id">
              <td>{{ index + 1 }}</td>
              <td>{{ trip.destination }}</td>
              <td>{{ trip.startDate }} - {{ trip.endDate }}</td>
              <td><span class="status-badge" :class="trip.statusClass">{{ trip.status }}</span></td>
              <td>
                <NuxtLink to="/pegawai/pengeluaran" class="detail-button">Pengeluaran</NuxtLink>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div class="trip-cards">
        <article v-for="(trip, index) in personalTrips" :key="`card-${trip.id}`" class="trip-card">
          <div class="trip-card-header">
            <span class="trip-card-number">Perjalanan #{{ index + 1 }}</span>
            <span class="status-badge" :class="trip.statusClass">{{ trip.status }}</span>
          </div>
          <div class="trip-card-title">{{ trip.destination }}</div>
          <dl class="trip-card-details">
            <div>
              <dt>Tanggal Berangkat</dt>
              <dd>{{ trip.startDate }}</dd>
            </div>
            <div>
              <dt>Tanggal Kembali</dt>
              <dd>{{ trip.endDate }}</dd>
            </div>
          </dl>
          <div class="trip-card-actions">
            <NuxtLink to="/pegawai/pengeluaran" class="detail-button">Lihat Pengeluaran</NuxtLink>
          </div>
        </article>
        <p v-if="loading && personalTrips.length === 0" class="empty-state">Memuat laporan perjalanan...</p>
        <p v-else-if="personalTrips.length === 0" class="empty-state">Belum ada riwayat perjalanan.</p>
      </div>

      <!-- Pagination -->
      <div class="table-footer">
        <span class="showing-text">Menampilkan {{ personalTrips.length }} dari {{ totalTrips }} perjalanan</span>
      </div>
    </section>

    <!-- My Bookings -->
    <section class="trip-history-card">
      <div class="section-header">
        <h2>Pemesanan Saya</h2>
      </div>
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th class="no-column">No</th>
              <th>Perjalanan</th>
              <th>Jenis</th>
              <th>Vendor / Kode</th>
              <th>Tanggal</th>
              <th>Harga</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="bookingsLoading && myBookings.length === 0">
              <td colspan="7" class="table-state">Memuat pemesanan...</td>
            </tr>
            <tr v-else-if="myBookings.length === 0">
              <td colspan="7" class="table-state">Belum ada pemesanan tiket atau penginapan.</td>
            </tr>
            <tr v-for="(booking, index) in myBookings" :key="booking.id">
              <td>{{ index + 1 }}</td>
              <td>{{ booking.trip?.tujuan ?? '—' }}</td>
              <td>{{ booking.jenis_label }}</td>
              <td>
                {{ booking.vendor_name ?? booking.vendor ?? '—' }}
                <span v-if="booking.kode_booking" class="booking-code">{{ booking.kode_booking }}</span>
              </td>
              <td>{{ formatDate(booking.tanggal) }}</td>
              <td>{{ formatCurrency(booking.harga) }}</td>
              <td><span class="status-badge" :class="bookingStatusClass(booking.status)">{{ booking.status_label }}</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Expense Summary -->
    <section class="expense-summary-card">
      <div class="section-header">
        <h2>Ringkasan Pengeluaran Saya</h2>
      </div>
      <div class="summary" style="grid-template-columns: repeat(2, 1fr); gap: 10px;">
        <div class="summary-item">
          <div class="summary-icon orange"><AppIcon name="hourglass" /></div>
          <div>
            <p>Tanpa Bukti</p>
            <h2>{{ formatCurrency(unverifiedExpense) }}</h2>
          </div>
        </div>
        <div class="summary-item">
          <div class="summary-icon green"><AppIcon name="check-circle" /></div>
          <div>
            <p>Dengan Bukti</p>
            <h2>{{ formatCurrency(verifiedExpense) }}</h2>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { BookingStatus } from '~/types/api'
import { useReports } from '~/composables/useReports'
import { useDashboard } from '~/composables/useDashboard'
import { useBookings } from '~/composables/useBookings'
import { apiErrorMessage } from '~/composables/useApi'
import { formatCurrency, formatDate } from '~/utils/format'

const { tripReport, expenseReport, loading: reportsLoading, error: reportsError, fetchTripReport, fetchExpenseReport, downloadReport } = useReports()
const { summary, loading: dashboardLoading, error: dashboardError, fetchDashboard } = useDashboard()
const { bookings: myBookings, loading: bookingsLoading, fetchBookings } = useBookings()

const exporting = ref(false)
const exportError = ref('')

const loading = computed(() => reportsLoading.value || dashboardLoading.value || bookingsLoading.value)
const error = computed(() => reportsError.value ?? dashboardError.value ?? '')

const asText = (value: string | number | null | undefined) => (value === null || value === undefined ? '—' : String(value))
const asNumber = (value: string | number | null | undefined) => Number(value) || 0

const STATUS_CLASS: Record<string, string> = {
  Draft: 'draft',
  Diajukan: 'waiting',
  Disetujui: 'approved',
  Ditolak: 'rejected',
  Berjalan: 'ongoing',
  Selesai: 'completed',
  Lengkap: 'completed',
}

const personalTrips = computed(() => (tripReport.value?.rows ?? []).map((row, index) => ({
  id: asNumber(row[0]) || index + 1,
  destination: asText(row[3]),
  startDate: asText(row[4]),
  endDate: asText(row[5]),
  status: asText(row[6]),
  statusClass: STATUS_CLASS[asText(row[6])] ?? 'draft',
  total: asNumber(row[7]),
})))

const expenseRows = computed(() => (expenseReport.value?.rows ?? []).map((row) => ({
  amount: asNumber(row[6]),
  receipts: asNumber(row[7]),
})))

const totalTrips = computed(() => summary.value?.total_perjalanan ?? personalTrips.value.length)
const totalExpense = computed(() => expenseRows.value.reduce((sum, row) => sum + row.amount, 0) || summary.value?.total_biaya || 0)
const unverifiedExpense = computed(() => expenseRows.value.filter((row) => row.receipts === 0).reduce((sum, row) => sum + row.amount, 0))
const verifiedExpense = computed(() => expenseRows.value.filter((row) => row.receipts > 0).reduce((sum, row) => sum + row.amount, 0))

const statusText = computed(() => {
  if (totalTrips.value === 0) return 'Belum ada perjalanan'
  const completed = personalTrips.value.filter((trip) => trip.statusClass === 'completed').length
  return `${completed} perjalanan selesai`
})

const bookingStatusClass = (status: BookingStatus) => {
  switch (status) {
    case 'dikonfirmasi':
      return 'approved'
    case 'selesai':
      return 'completed'
    case 'dibatalkan':
      return 'rejected'
    default:
      return 'waiting'
  }
}

const handleExport = async (format: 'pdf' | 'xlsx') => {
  exportError.value = ''
  exporting.value = true

  try {
    await downloadReport('trips', format)
  } catch (err) {
    exportError.value = apiErrorMessage(err, 'Gagal mengunduh laporan.')
  } finally {
    exporting.value = false
  }
}

onMounted(() => {
  Promise.all([
    fetchTripReport(),
    fetchExpenseReport(),
    fetchDashboard(),
    fetchBookings({ per_page: 100 }),
  ]).catch(() => {})
})
</script>

<style scoped>
.pegawai-laporansaya-page {
  width: 100%;
  min-height: calc(100vh - 70px);
  padding: 24px 28px;
  background: #f5f6f8;
}

.breadcrumb { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 9px; color: #9aa4b5; }
.breadcrumb a { color: #9aa4b5; text-decoration: none; }
.breadcrumb a:hover { color: var(--primary); }
.breadcrumb strong { color: var(--text); font-weight: 600; }

.page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
.page-header h1 { margin: 0; font-size: 23px; font-weight: 700; color: var(--text); }
.page-actions { display: flex; gap: 8px; }
.export-button { min-height: 33px; padding: 0 13px; border: 1px solid var(--primary); border-radius: 7px; background: var(--primary); color: #fff; font-family: inherit; font-size: 10px; font-weight: 600; cursor: pointer; }
.export-button.outline { background: var(--white); color: var(--primary); }
.export-button:disabled { cursor: not-allowed; opacity: 0.55; }
.data-error { margin-bottom: 16px; padding: 11px 14px; border: 1px solid #f4c7c7; border-radius: 8px; background: #fff5f5; color: #b42318; font-size: 11px; }

/* SUMMARY */
.summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px; }
.summary-item { min-width: 0; min-height: 78px; display: flex; align-items: center; gap: 12px; padding: 14px; background: var(--white); border: 1px solid var(--border); border-radius: 9px; }
.summary-icon { width: 36px; height: 36px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-size: 16px; }
.summary-icon.cyan { background: #e5f7fc; color: #0891b2; }
.summary-icon.green { background: #e3f8ef; color: #16a34a; }
.summary-icon.blue { background: #e9f0ff; color: var(--primary); }
.summary-icon.orange { background: #fff3df; color: #f59e0b; }
.summary-item > div:last-child { min-width: 0; }
.summary-item p { margin: 0 0 3px; font-size: 9px; color: #7b8799; }
.summary-item h2 { margin: 0; font-size: 15px; line-height: 1.1; color: var(--text); font-weight: 700; }

/* TRIP HISTORY */
.trip-history-card { padding: 20px; background: var(--white); border: 1px solid var(--border); border-radius: 12px; }
.section-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.section-header h2 { margin: 0; font-size: 16px; font-weight: 600; color: var(--text); }

.trip-history-card table { width: 100%; border-collapse: collapse; table-layout: fixed; }
.trip-history-card thead { background: #f3f4f6; }
.trip-history-card th { padding: 10px 12px; text-align: left; font-size: 9px; font-weight: 600; color: #718096; }
.trip-history-card td { padding: 14px 12px; border-bottom: 1px solid #e5e8ee; font-size: 10px; color: #344054; vertical-align: middle; }
.trip-history-card tbody tr:last-child td { border-bottom: none; }
.trip-history-card .no-column { width: 30px; }
.trip-history-card .action-column { width: 70px; text-align: center; }

.status-badge { display: inline-flex; align-items: center; padding: 4px 9px; border-radius: 5px; font-size: 9px; font-weight: 600; white-space: nowrap; }
.status-badge.draft { background: #eef1f7; color: #667085; }
.booking-code { display: block; margin-top: 2px; font-size: 9px; color: #8792a5; }
.status-badge.waiting { background: #fff3df; color: #ef9b16; }
.status-badge.approved { background: #dff7ef; color: #18a77c; }
.status-badge.rejected { background: #ffe8e8; color: #ef5350; }
.status-badge.ongoing { background: #fff3df; color: #ef9b16; }
.status-badge.completed { background: #dff7ef; color: #18a77c; }
.table-state { height: 90px; text-align: center; color: #8792a5; font-size: 11px; }

.trip-cards { display: none; }
.trip-card { padding: 14px; background: var(--white); border: 1px solid var(--border); border-radius: 10px; }
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

/* EXPENSE SUMMARY */
.expense-summary-card { padding: 20px; background: var(--white); border: 1px solid var(--border); border-radius: 12px; margin-top: 24px; }
.expense-summary-card .summary { grid-template-columns: repeat(2, 1fr); gap: 8px; }

/* RESPONSIVE */
@media (max-width: 1023px) { .pegawai-laporansaya-page { padding: 20px; } .summary { grid-template-columns: repeat(2, minmax(0, 1fr)); } .trip-history-card table { min-width: 0; table-layout: fixed; } .trip-history-card th { padding: 9px 6px; } .trip-history-card td { padding: 11px 6px; font-size: 9px; } }

@media (max-width: 767px) { .pegawai-laporansaya-page { padding: 16px; } .page-header h1 { font-size: 20px; } .page-actions { width: 100%; } .export-button { flex: 1; } .summary { grid-template-columns: 1fr; gap: 10px; } .summary-item h2 { font-size: 14px; } .trip-history-card { padding: 16px; } .trip-history-card table { display: none; } .trip-cards { display: flex; flex-direction: column; gap: 12px; padding: 14px; } .trip-card { padding: 12px; } .expense-summary-card .summary { grid-template-columns: 1fr; } }

@media (max-width: 540px) { .summary { grid-template-columns: 1fr; } }

@media (max-width: 374px) { .pegawai-laporansaya-page { padding: 12px; } }
</style>