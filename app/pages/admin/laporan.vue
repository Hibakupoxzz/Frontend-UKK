<template>
  <div class="report-page">

    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <NuxtLink to="/dashboard">Dashboard</NuxtLink>
      <span>›</span>
      <strong>Laporan</strong>
    </div>

    <!-- Header -->
    <div class="page-header">
      <h1>Laporan Perjalanan</h1>

      <LayoutPageactions />
    </div>

    <!-- Filter -->
    <div class="filter-section">

      <select v-model="selectedYear" aria-label="Tahun laporan">
        <option v-for="year in yearOptions" :key="year" :value="String(year)">Tahun {{ year }}</option>
      </select>

      <select v-model="selectedDepartment" aria-label="Departemen laporan">
        <option value="">Semua Departemen</option>
        <option v-for="department in departmentOptions" :key="department" :value="department">
          Departemen: {{ department }}
        </option>
      </select>

      <button
        class="export-button"
        type="button"
        :disabled="exporting || loading"
        @click="exportReport('pdf')"
      >
        ↓
        {{ exporting ? 'Menyiapkan...' : 'Ekspor PDF' }}
      </button>

      <button
        class="export-button"
        type="button"
        :disabled="exporting || loading"
        @click="exportReport('xlsx')"
      >
        ↓
        Ekspor Excel
      </button>

    </div>

    <div v-if="error" class="data-error" role="alert">{{ error }}</div>
    <div v-if="exportError" class="data-error" role="alert">{{ exportError }}</div>

    <!-- Summary Cards -->
    <div class="summary-grid">

      <div class="summary-card">
        <div class="summary-icon blue">
          ✈
        </div>

        <div>
          <p>Total Perjalanan</p>
          <h2>{{ totalTrips }}</h2>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-icon green">
          ▤
        </div>

        <div>
          <p>Total Biaya</p>
          <h2>{{ formatCurrency(totalBiaya) }}</h2>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-icon cyan">
          ▤
        </div>

        <div>
          <p>Rata-rata Biaya</p>
          <h2>{{ formatCurrency(averageCost) }}</h2>
        </div>
      </div>

      <div class="summary-card">
        <div class="summary-icon orange">
          ││
        </div>

        <div>
          <p>Perjalanan Bulan Ini</p>
          <h2>{{ tripsThisMonth }}</h2>
        </div>
      </div>

    </div>

    <!-- Main Content -->
    <div class="report-content">

      <!-- Chart -->
      <section class="expense-card">

        <div class="section-header">
          <h2>Pengeluaran per Bulan</h2>
        </div>

        <div v-if="monthlyExpenses.length === 0" class="chart-empty">
          Belum ada pengeluaran pada periode ini.
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
                :style="{ height: `${item.value}px` }"
                :title="formatCurrency(item.total)"
              ></div>
            </div>

            <span>{{ item.month }}</span>

          </div>

        </div>

        <div class="chart-footer">
          <span>{{ expenseFooter || 'Total pengeluaran: Rp 0' }}</span>
        </div>

      </section>

      <!-- Report Table -->
      <section class="history-card">

        <h2>Rincian Laporan Perjalanan</h2>

        <div class="table-wrapper">

          <table>

            <thead>
              <tr>
                <th>No</th>
                <th>Pegawai</th>
                <th>Departemen</th>
                <th>Tujuan</th>
                <th>Berangkat</th>
                <th>Pulang</th>
                <th>Status</th>
                <th>Realisasi Biaya</th>
                <th>Estimasi Biaya</th>
                <th>Selisih</th>
              </tr>
            </thead>

            <tbody>
              <tr v-if="loading && reportTrips.length === 0">
                <td colspan="10" class="table-state">Memuat laporan...</td>
              </tr>
              <tr v-else-if="reportTrips.length === 0">
                <td colspan="10" class="table-state">Belum ada perjalanan pada periode ini.</td>
              </tr>
              <tr
                v-for="(trip, index) in reportTrips"
                :key="`${trip.employee}-${trip.destination}-${index}`"
              >
                <td>{{ index + 1 }}</td>
                <td><strong>{{ trip.employee }}</strong></td>
                <td>{{ trip.department }}</td>
                <td>{{ trip.destination }}</td>
                <td>{{ trip.start }}</td>
                <td>{{ trip.end }}</td>
                <td><span class="status-badge" :class="trip.statusClass">{{ trip.status }}</span></td>
                <td>{{ formatCurrency(trip.total) }}</td>
                <td>{{ formatCurrencyOrDash(trip.estimate) }}</td>
                <td :class="varianceClass(trip.difference)">{{ formatCurrencyOrDash(trip.difference) }}</td>
              </tr>
            </tbody>

          </table>

        </div>

        <!-- Mobile cards -->
        <div class="report-cards">
          <article
            v-for="(trip, index) in reportTrips"
            :key="`card-${trip.employee}-${trip.destination}-${index}`"
            class="report-card"
          >
            <div class="report-card-header">
              <span class="report-card-number">#{{ index + 1 }}</span>
              <span class="status-badge" :class="trip.statusClass">{{ trip.status }}</span>
            </div>

            <h3 class="report-card-title">
              {{ trip.employee }} · {{ trip.destination }}
            </h3>

            <dl class="report-card-details">
              <div>
                <dt>Departemen</dt>
                <dd>{{ trip.department }}</dd>
              </div>

              <div>
                <dt>Tanggal</dt>
                <dd>{{ trip.start }} - {{ trip.end }}</dd>
              </div>

              <div>
                <dt>Realisasi Biaya</dt>
                <dd>{{ formatCurrency(trip.total) }}</dd>
              </div>
              <div>
                <dt>Estimasi Biaya</dt>
                <dd>{{ formatCurrencyOrDash(trip.estimate) }}</dd>
              </div>
              <div>
                <dt>Selisih</dt>
                <dd :class="varianceClass(trip.difference)">{{ formatCurrencyOrDash(trip.difference) }}</dd>
              </div>
            </dl>
          </article>
          <p v-if="loading && reportTrips.length === 0" class="empty-state">Memuat laporan...</p>
          <p v-else-if="reportTrips.length === 0" class="empty-state">Belum ada perjalanan pada periode ini.</p>
        </div>

      </section>

    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useReports } from '~/composables/useReports'
import { apiErrorMessage } from '~/composables/useApi'
import { formatCurrency } from '~/utils/format'

const { tripReport, expenseReport, loading, error, fetchTripReport, fetchExpenseReport, downloadReport } = useReports()

const currentYear = new Date().getFullYear()
const yearOptions = [currentYear, currentYear - 1, currentYear - 2]

const selectedYear = ref(String(currentYear))
const selectedDepartment = ref('')
const exporting = ref(false)
const exportError = ref('')

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

interface ReportTrip {
  employee: string
  department: string
  destination: string
  start: string
  end: string
  status: string
  statusClass: string
  total: number
  estimate: number | null
  difference: number | null
  monthKey: string
}

const allTrips = computed<ReportTrip[]>(() => (tripReport.value?.rows ?? []).map((row) => {
  const start = asText(row[4])
  const [day, month, year] = start.split('-')

  return {
    employee: asText(row[1]),
    department: asText(row[2]),
    destination: asText(row[3]),
    start,
    end: asText(row[5]),
    status: asText(row[6]),
    statusClass: STATUS_CLASS[asText(row[6])] ?? 'draft',
    total: asNumber(row[7]),
    estimate: row[8] === null || row[8] === undefined ? null : asNumber(row[8]),
    difference: row[9] === null || row[9] === undefined ? null : asNumber(row[9]),
    monthKey: `${year}-${month}-${day}`,
  }
}))

const formatCurrencyOrDash = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : formatCurrency(value)

const varianceClass = (value: number | null | undefined) => {
  if (value === null || value === undefined || value === 0) return ''
  return value > 0 ? 'over-budget' : 'under-budget'
}

const departmentOptions = computed(() => {
  const values = new Set<string>()
  for (const trip of allTrips.value) {
    if (trip.department && trip.department !== '—') values.add(trip.department)
  }
  return Array.from(values).sort((a, b) => a.localeCompare(b))
})

const reportTrips = computed(() => {
  if (!selectedDepartment.value) return allTrips.value
  return allTrips.value.filter((trip) => trip.department === selectedDepartment.value)
})

const departmentsByEmployee = computed(() => {
  const map = new Map<string, string>()
  for (const trip of allTrips.value) {
    if (!map.has(trip.employee)) map.set(trip.employee, trip.department)
  }
  return map
})

const expenseRows = computed(() => {
  return (expenseReport.value?.rows ?? [])
    .map((row) => {
      const employee = asText(row[1])
      const [day, month, year] = asText(row[3]).split('-')

      return {
        employee,
        department: departmentsByEmployee.value.get(employee) ?? '—',
        amount: asNumber(row[6]),
        monthKey: `${year}-${month}-${day}`,
      }
    })
    .filter((row) => !selectedDepartment.value || row.department === selectedDepartment.value)
})

const totalTrips = computed(() => reportTrips.value.length)
const totalBiaya = computed(() => reportTrips.value.reduce((sum, trip) => sum + trip.total, 0))
const averageCost = computed(() => (totalTrips.value > 0 ? totalBiaya.value / totalTrips.value : 0))

const tripsThisMonth = computed(() => {
  const now = new Date()
  const key = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  return reportTrips.value.filter((trip) => trip.monthKey.startsWith(key)).length
})

const monthlyExpenses = computed(() => {
  const counts = new Map<string, number>()

  for (const row of expenseRows.value) {
    const month = row.monthKey.slice(0, 7)
    if (!month.includes('undefined')) {
      counts.set(month, (counts.get(month) ?? 0) + row.amount)
    }
  }

  const entries = Array.from(counts.entries()).sort(([a], [b]) => a.localeCompare(b))
  const max = entries.reduce((highest, [, total]) => Math.max(highest, total), 0)

  return entries.map(([month, total]) => ({
    month: new Intl.DateTimeFormat('id-ID', { month: 'short' }).format(new Date(`${month}-01`)),
    total,
    value: max > 0 ? Math.max(6, Math.round((total / max) * 130)) : 0,
  }))
})

const expenseFooter = computed(() => expenseReport.value?.footer ?? '')

const queryParams = () => ({
  dari: `${selectedYear.value}-01-01`,
  sampai: `${selectedYear.value}-12-31`,
})

const load = async () => {
  await Promise.all([
    fetchTripReport(queryParams()),
    fetchExpenseReport(queryParams()),
  ])
}

const exportReport = async (format: 'pdf' | 'xlsx') => {
  exportError.value = ''
  exporting.value = true

  try {
    await downloadReport('trips', format, queryParams())
  } catch (err) {
    exportError.value = apiErrorMessage(err, 'Gagal mengunduh laporan.')
  } finally {
    exporting.value = false
  }
}

watch(selectedYear, () => {
  load().catch(() => {})
})

onMounted(() => {
  load().catch(() => {})
})
</script>

<style scoped>
/* =========================
   PAGE
========================= */

.report-page {
  width: 100%;
  min-height: calc(100vh - 70px);

  padding: 24px 28px;

  background: #f5f6f8;
}

/* =========================
   BREADCRUMB
========================= */

.breadcrumb {
  display: flex;
  align-items: center;

  gap: 8px;

  margin-bottom: 4px;

  font-size: 9px;

  color: #9aa4b5;
}

.breadcrumb a {
  color: #9aa4b5;

  text-decoration: none;
}

.breadcrumb strong {
  color: var(--text);

  font-weight: 600;
}

/* =========================
   HEADER
========================= */

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;

  margin-bottom: 20px;
}

.page-header h1 {
  margin: 0;

  font-size: 23px;

  font-weight: 700;

  color: var(--text);
}

/* =========================
   FILTER
========================= */

.filter-section {
  display: flex;
  align-items: center;

  gap: 12px;

  margin-bottom: 24px;
}

.filter-section select {
  height: 30px;

  padding: 0 12px;

  border: 1px solid #dce2eb;

  border-radius: 6px;

  background: var(--white);

  color: #475569;

  font-family: inherit;

  font-size: 9px;

  outline: none;
}

.export-button {
  height: 30px;

  display: flex;
  align-items: center;

  gap: 7px;

  margin-left: auto;

  padding: 0 15px;

  border: none;

  border-radius: 6px;

  background: var(--primary);

  color: var(--white);

  font-family: inherit;

  font-size: 9px;

  font-weight: 600;

  cursor: pointer;
}

.export-button:hover {
  opacity: 0.9;
}

.export-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.export-button + .export-button {
  margin-left: 0;
}

/* =========================
   SUMMARY
========================= */

.summary-grid {
  display: grid;

  grid-template-columns: repeat(4, 1fr);

  gap: 14px;

  margin-bottom: 24px;
}

.summary-card {
  min-width: 0;
  min-height: 78px;

  display: flex;
  align-items: center;
  gap: 12px;

  padding: 14px;

  box-sizing: border-box;

  background: var(--white);

  border: 1px solid var(--border);

  border-radius: 9px;
}

.summary-card > div:last-child {
  min-width: 0;
}

.summary-icon {
  width: 36px;
  height: 36px;

  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 8px;

  font-size: 16px;
}

.summary-icon.blue {
  background: #e9f0ff;
  color: var(--primary);
}

.summary-icon.green {
  background: #e3f8ef;
  color: #10b981;
}

.summary-icon.cyan {
  background: #e5f7fc;
  color: #0891b2;
}

.summary-icon.orange {
  background: #fff3df;
  color: #f59e0b;
}

.summary-card p {
  margin: 0 0 3px;

  font-size: 9px;

  color: #7b8799;
}

.summary-card h2 {
  margin: 0;

  font-size: 17px;

  line-height: 1.1;

  color: var(--text);

  font-weight: 700;
}

.summary-card h2 span {
  font-size: 11px;
}

/* =========================
   CONTENT
========================= */

.report-content {
  display: grid;

  grid-template-columns: minmax(0, 1fr) minmax(0, 1.35fr);

  gap: 18px;
}

/* =========================
   EXPENSE
========================= */

.expense-card,
.history-card {
  padding: 16px;

  background: var(--white);

  border: 1px solid var(--border);

  border-radius: 10px;
}

.expense-card h2,
.history-card h2 {
  margin: 0;

  font-size: 14px;

  font-weight: 700;

  color: var(--text);
}

/* =========================
   CHART
========================= */

.chart {
  height: 185px;

  display: flex;
  align-items: flex-end;

  gap: 10px;

  margin-top: 18px;
}

.chart-item {
  flex: 1;

  height: 100%;

  display: flex;
  flex-direction: column;

  align-items: center;
  justify-content: flex-end;

  gap: 7px;
}

.bar-wrapper {
  width: 100%;
  height: 145px;

  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bar {
  width: 70%;

  max-width: 40px;

  min-height: 15px;

  border-radius: 4px 4px 0 0;

  background: var(--primary);
}

.chart-item span {
  font-size: 8px;

  color: #7b8799;
}

.chart-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-top: 12px;

  font-size: 8px;

  color: #9aa4b5;
}

.chart-footer button {
  padding: 0;

  border: none;

  background: transparent;

  color: var(--primary);

  font-family: inherit;

  font-size: 8px;

  cursor: pointer;
}

/* =========================
   TABLE
========================= */

.table-wrapper {
  margin-top: 12px;

  overflow-x: auto;
}

table {
  width: 100%;

  border-collapse: collapse;

  table-layout: auto;
}

thead {
  background: #f3f4f6;
}

th {
  padding: 8px;

  text-align: left;

  font-size: 8px;

  font-weight: 600;

  color: #718096;
}

td {
  padding: 11px 8px;

  border-bottom: 1px solid #e5e8ee;

  font-size: 8px;

  color: #718096;

  vertical-align: middle;
}

tbody tr:last-child td {
  border-bottom: none;
}

td.over-budget,
dd.over-budget {
  color: #b42318;
  font-weight: 600;
}

td.under-budget,
dd.under-budget {
  color: #15803d;
  font-weight: 600;
}

td strong {
  display: block;

  color: var(--text);

  font-size: 8px;

  line-height: 1.3;
}

th:first-child,
td:first-child {
  width: 25px;
}

th:nth-child(6),
th:nth-child(5),
td:nth-child(6),
td:nth-child(5) {
  white-space: nowrap;
}

/* =========================
   TABLE ACTION
========================= */

.table-actions {
  display: flex;
  align-items: center;
  justify-content: center;

  gap: 8px;
}

.table-actions button {
  padding: 0;

  border: none;

  background: transparent;

  color: var(--primary);

  font-size: 11px;

  cursor: pointer;
}

.table-actions button:last-child {
  color: #64748b;
}

/* =========================
   MOBILE CARDS
========================= */

.report-cards {
  display: none;
}

.data-error {
  margin-bottom: 16px;
  padding: 11px 14px;

  border: 1px solid #f4c7c7;
  border-radius: 8px;

  background: #fff5f5;
  color: #b42318;

  font-size: 10px;
}

.chart-empty {
  display: grid;
  min-height: 170px;
  margin-top: 18px;
  place-items: center;

  border: 1px dashed #d9e0ea;
  border-radius: 8px;

  color: #8792a5;
  font-size: 10px;
  text-align: center;
}

.table-state {
  height: 90px;

  color: #8792a5;
  font-size: 10px;
  text-align: center;
}

.empty-state {
  padding: 24px 12px;

  color: #8792a5;
  font-size: 10px;
  text-align: center;
}

.status-badge {
  display: inline-flex;
  align-items: center;

  padding: 4px 9px;

  border-radius: 5px;

  font-size: 9px;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.draft { background: #eef1f7; color: #667085; }
.status-badge.waiting { background: #fff3df; color: #ef9b16; }
.status-badge.approved { background: #dff7ef; color: #18a77c; }
.status-badge.rejected { background: #ffe8e8; color: #ef5350; }
.status-badge.ongoing { background: #fff3df; color: #ef9b16; }
.status-badge.completed { background: #dff7ef; color: #18a77c; }

.report-card {
  padding: 14px;

  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 10px;
}

.report-card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 6px;

  margin-bottom: 8px;
}

.report-card-number {
  font-size: 10px;
  color: #9aa4b5;
}

.report-card-period {
  padding: 3px 7px;

  border-radius: 4px;

  background: #eef3ff;
  color: var(--primary);

  font-size: 9px;
  font-weight: 600;
}

.report-card-title {
  margin: 0;

  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
  color: var(--text);

  overflow-wrap: anywhere;
}

.report-card-details {
  display: grid;
  gap: 7px;

  margin: 12px 0;
}

.report-card-details > div {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

.report-card-details dt {
  font-size: 10px;
  color: #8792a5;
}

.report-card-details dd {
  margin: 0;

  font-size: 11px;
  color: var(--text);
  text-align: right;
}

.report-card-actions {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;

  padding-top: 10px;
  border-top: 1px solid #eef1f5;
}

.report-card-actions button {
  min-height: 40px;

  border: 1px solid var(--primary);
  border-radius: 7px;

  background: #f5f8ff;
  color: var(--primary);

  font-family: inherit;
  font-size: 12px;
  font-weight: 600;

  cursor: pointer;
}

.report-card-actions button:last-child {
  background: var(--primary);
  color: var(--white);
}

/* =========================
   RESPONSIVE
========================= */

@media (max-width: 1000px) {
  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .report-content {
    grid-template-columns: 1fr;
  }

  .report-page {
    padding: 20px;
  }
}

@media (max-width: 767px) {
  .report-page {
    padding: 16px;
  }

  .filter-section {
    flex-wrap: wrap;
    gap: 10px;
    margin-bottom: 18px;
  }

  .filter-section select {
    flex: 1 1 150px;

    min-width: 0;
    height: 40px;

    font-size: 16px;
  }

  .export-button {
    flex: 1 1 100%;

    justify-content: center;

    height: 40px;
    margin-left: 0;

    font-size: 12px;
  }

  .summary-grid {
    gap: 10px;
    margin-bottom: 18px;
  }  .summary-card {
    padding: 12px;
    gap: 10px;
  }

  .summary-card h2 {
    font-size: 15px;
    overflow-wrap: anywhere;
  }

  .report-content {
    gap: 14px;
  }

  .expense-card,
  .history-card {
    padding: 14px;
  }

  .table-wrapper {
    display: none;
  }

  .report-cards {
    display: flex;
    flex-direction: column;
    gap: 12px;

    margin-top: 14px;
  }

  .chart {
    gap: 6px;
  }
}

@media (max-width: 540px) {
  .filter-section select {
    flex: 1 1 100%;
  }

  .summary-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 374px) {
  .report-page {
    padding: 12px;
  }

  .summary-grid {
    grid-template-columns: 1fr;
  }

  .summary-card h2 {
    font-size: 17px;
  }
}
</style>