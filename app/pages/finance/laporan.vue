<template>
  <div class="report-page">
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <NuxtLink to="/dashboard">Dashboard</NuxtLink>
      <span>›</span>
      <NuxtLink to="/finance/dashboard">Finance</NuxtLink>
      <span>›</span>
      <strong>Laporan</strong>
    </div>

    <!-- Header -->
    <div class="page-header">
      <h1>Laporan Keuangan</h1>
    </div>

    <!-- Summary Stats -->
    <div class="summary-grid">
      <div class="summary-card">
        <div class="summary-icon blue">
          ✈
        </div>
        <div>
          <p>Total Pengeluaran</p>
          <h2>{{ formatCurrency(totalExpenses) }}</h2>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon green">
          ▤
        </div>
        <div>
          <p>Jumlah Pengeluaran</p>
          <h2>{{ expenseRows.length }}</h2>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon cyan">
          ▤
        </div>
        <div>
          <p>Tanpa Bukti</p>
          <h2>{{ formatCurrency(withoutReceipt) }}</h2>
        </div>
      </div>
      <div class="summary-card">
        <div class="summary-icon orange">
          ││
        </div>
        <div>
          <p>Dengan Bukti</p>
          <h2>{{ formatCurrency(withReceipt) }}</h2>
        </div>
      </div>
    </div>

    <!-- Filter -->
    <div class="filter-section">
      <select v-model="selectedYear" aria-label="Tahun laporan">
        <option v-for="year in yearOptions" :key="year" :value="String(year)">Tahun {{ year }}</option>
      </select>

      <button
        class="export-button"
        type="button"
        :disabled="exporting || loading"
        @click="exportReport('pdf')"
      >
        {{ exporting ? 'Menyiapkan...' : '↓ Ekspor PDF' }}
      </button>

      <button
        class="export-button"
        type="button"
        :disabled="exporting || loading"
        @click="exportReport('xlsx')"
      >
        ↓ Ekspor Excel
      </button>
    </div>

    <div v-if="error" class="data-error" role="alert">{{ error }}</div>
    <div v-if="exportError" class="data-error" role="alert">{{ exportError }}</div>

    <!-- Chart Section -->
    <section class="expense-card">
      <div class="section-header">
        <h2>Pengeluaran per Bulan</h2>
      </div>
      <div v-if="loading" class="chart-empty">Memuat laporan...</div>
      <div v-else-if="monthlyExpenses.length === 0" class="chart-empty">
        Belum ada pengeluaran pada periode ini.
      </div>
      <div v-else class="chart">
        <div v-for="item in monthlyExpenses" :key="item.month" class="chart-item">
          <div class="bar-wrapper">
            <div class="bar" :style="{ height: `${item.percentage}%` }"></div>
          </div>
          <span>{{ item.month }}</span>
          <span class="bar-value">{{ formatCurrency(item.value) }}</span>
        </div>
      </div>
      <div class="chart-footer">
        <span>{{ expenseFooter || 'Total pengeluaran: Rp 0' }}</span>
      </div>
    </section>

    <!-- Report Table -->
    <section class="history-card">
      <h2>Rincian Pengeluaran</h2>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Pegawai</th>
              <th>Tujuan</th>
              <th>Tanggal</th>
              <th>Jenis</th>
              <th>Jumlah</th>
              <th>Bukti</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && expenseRows.length === 0">
              <td colspan="7" class="table-state">Memuat laporan...</td>
            </tr>
            <tr v-else-if="expenseRows.length === 0">
              <td colspan="7" class="table-state">Belum ada pengeluaran pada periode ini.</td>
            </tr>
            <tr v-for="(row, index) in expenseRows" :key="`${row.employee}-${row.dateKey}-${index}`">
              <td>{{ index + 1 }}</td>
              <td>
                <strong>{{ row.employee }}</strong>
              </td>
              <td>{{ row.destination }}</td>
              <td>{{ row.date }}</td>
              <td>{{ row.jenis }}</td>
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

      <!-- Mobile cards -->
      <div class="report-cards">
        <article v-for="(row, index) in expenseRows" :key="`card-${index}`" class="report-card">
          <div class="report-card-header">
            <span class="report-card-number">Pengeluaran #{{ index + 1 }}</span>
            <span class="status-badge" :class="row.receipts > 0 ? 'completed' : 'waiting'">
              {{ row.receipts > 0 ? 'Dengan Bukti' : 'Tanpa Bukti' }}
            </span>
          </div>

          <h3 class="report-card-title">{{ row.destination }}</h3>

          <dl class="report-card-details">
            <div>
              <dt>Pegawai</dt>
              <dd>{{ row.employee }}</dd>
            </div>

            <div>
              <dt>Tanggal</dt>
              <dd>{{ row.date }}</dd>
            </div>

            <div>
              <dt>Jenis</dt>
              <dd>{{ row.jenis }}</dd>
            </div>

            <div>
              <dt>Jumlah</dt>
              <dd>{{ formatCurrency(row.amount) }}</dd>
            </div>
          </dl>
        </article>
        <p v-if="expenseRows.length === 0" class="empty-state">Belum ada pengeluaran pada periode ini.</p>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useReports } from '~/composables/useReports'
import { apiErrorMessage } from '~/composables/useApi'
import { formatCurrency } from '~/utils/format'

const currentYear = new Date().getFullYear()

const selectedYear = ref(String(currentYear))
const exporting = ref(false)
const exportError = ref('')

const { expenseReport, loading, error, fetchExpenseReport, downloadReport } = useReports()

const yearOptions = computed(() => {
  const years = new Set<number>([currentYear, currentYear - 1, currentYear - 2])
  return Array.from(years).sort((a, b) => b - a)
})

const asText = (value: string | number | null | undefined) => (value === null || value === undefined ? '—' : String(value))
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

const totalExpenses = computed(() => expenseRows.value.reduce((sum, row) => sum + row.amount, 0))
const withReceipt = computed(() => expenseRows.value.filter((row) => row.receipts > 0).reduce((sum, row) => sum + row.amount, 0))
const withoutReceipt = computed(() => expenseRows.value.filter((row) => row.receipts === 0).reduce((sum, row) => sum + row.amount, 0))

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

const expenseFooter = computed(() => expenseReport.value?.footer ?? '')

const queryParams = () => ({
  dari: `${selectedYear.value}-01-01`,
  sampai: `${selectedYear.value}-12-31`,
})

const load = async () => {
  await fetchExpenseReport(queryParams())
}

const exportReport = async (format: 'pdf' | 'xlsx') => {
  exportError.value = ''
  exporting.value = true

  try {
    await downloadReport('expenses', format, queryParams())
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
.report-page {
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

/* SUMMARY GRID */
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
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 9px;
}

.summary-icon {
  width: 36px; height: 36px;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px; font-size: 16px;
}

.summary-icon.blue { background: #e9f0ff; color: var(--primary); }
.summary-icon.green { background: #e3f8ef; color: #10b981; }
.summary-icon.cyan { background: #e5f7fc; color: #0891b2; }
.summary-icon.orange { background: #fff3df; color: #f59e0b; }

.summary-card > div:last-child { min-width: 0; }
.summary-card p { margin: 0 0 3px; font-size: 9px; color: #7b8799; }
.summary-card h2 { margin: 0; font-size: 17px; line-height: 1.1; color: var(--text); font-weight: 700; }

/* FILTER */
.filter-section {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
}

.filter-section select {
  height: 30px; padding: 0 12px;
  border: 1px solid #dce2eb; border-radius: 6px;
  background: var(--white); color: #475569;
  font-family: inherit; font-size: 9px; outline: none;
}

.export-button {
  height: 30px;
  display: flex; align-items: center; justify-content: center;
  gap: 7px; margin-left: auto;
  padding: 0 15px;
  border: none; border-radius: 6px;
  background: var(--primary); color: var(--white);
  font-family: inherit; font-size: 9px; font-weight: 600; cursor: pointer;
}

.export-button:hover { opacity: 0.9; }
.export-button:disabled { cursor: not-allowed; opacity: 0.6; }

.data-error { margin-bottom: 16px; padding: 11px 14px; border: 1px solid #f4c7c7; border-radius: 8px; background: #fff5f5; color: #b42318; font-size: 11px; }
.chart-empty { padding: 28px 12px; text-align: center; font-size: 11px; color: #8792a5; }
.table-state { padding: 22px 12px; text-align: center; font-size: 10px; color: #8792a5; }
.empty-state { padding: 20px 12px; text-align: center; font-size: 11px; color: #8792a5; }

.bar-value { font-size: 8px; font-weight: 600; color: var(--primary); }

.status-badge { display: inline-flex; align-items: center; padding: 4px 8px; border-radius: 4px; font-size: 8px; font-weight: 600; white-space: nowrap; }
.status-badge.waiting { background: #fff3df; color: #b45309; }
.status-badge.completed { background: #e8f7ef; color: #15803d; }

/* CHART SECTION */
.expense-card {
  padding: 16px; background: var(--white); border: 1px solid var(--border); border-radius: 10px;
}

.expense-card h2 { margin: 0; font-size: 14px; font-weight: 700; color: var(--text); }

.chart {
  height: 185px; display: flex; align-items: flex-end; gap: 10px; margin-top: 18px;
}

.chart-item { flex: 1; height: 100%; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 7px; }

.bar-wrapper { width: 100%; height: 145px; display: flex; align-items: flex-end; justify-content: center; }

.bar { width: 70%; max-width: 40px; min-height: 15px; border-radius: 4px 4px 0 0; background: var(--primary); }

.chart-item span { font-size: 8px; color: #7b8799; }

.chart-footer { display: flex; align-items: center; justify-content: space-between; margin-top: 12px; font-size: 8px; color: #9aa4b5; }

.chart-footer button { padding: 0; border: none; background: transparent; color: var(--primary); font-family: inherit; font-size: 8px; cursor: pointer; }

/* HISTORY CARD */
.history-card { padding: 16px; background: var(--white); border: 1px solid var(--border); border-radius: 10px; }

.history-card h2 { margin: 0; font-size: 14px; font-weight: 700; color: var(--text); }

.table-wrapper { margin-top: 12px; overflow-x: auto; }

table { width: 100%; border-collapse: collapse; table-layout: fixed; }
thead { background: #f3f4f6; }
th { padding: 8px; text-align: left; font-size: 8px; font-weight: 600; color: #718096; }
td { padding: 11px 8px; border-bottom: 1px solid #e5e8ee; font-size: 8px; color: #718096; vertical-align: middle; }
tbody tr:last-child td { border-bottom: none; }
td strong { display: block; color: var(--text); font-size: 8px; line-height: 1.3; }

/* TABLE ACTIONS */
.table-actions { display: flex; align-items: center; justify-content: center; gap: 8px; }

.table-actions button { padding: 0; border: none; background: transparent; color: var(--primary); font-size: 11px; cursor: pointer; }
.table-actions button:last-child { color: #64748b; }

/* MOBILE CARDS */
.report-cards { display: none; }

.report-card { padding: 14px; background: var(--white); border: 1px solid var(--border); border-radius: 10px; }

.report-card-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 6px; margin-bottom: 8px; }

.report-card-number { font-size: 10px; color: #9aa4b5; }

.report-card-title { margin: 0; font-size: 13px; font-weight: 700; line-height: 1.4; color: var(--text); overflow-wrap: anywhere; }

.report-card-details { display: grid; gap: 7px; margin: 12px 0; }

.report-card-details > div { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }

.report-card-details dt { font-size: 10px; color: #8792a5; }

.report-card-details dd { margin: 0; font-size: 11px; color: var(--text); text-align: right; }

.report-card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; padding-top: 10px; border-top: 1px solid #eef1f5; }

.report-card-actions button { min-height: 40px; border: 1px solid var(--primary); border-radius: 7px; background: #f5f8ff; color: var(--primary); font-family: inherit; font-size: 12px; font-weight: 600; cursor: pointer; }

.report-card-actions button:last-child { background: var(--primary); color: var(--white); }

/* RESPONSIVE */
@media (max-width: 1000px) {
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .report-content { grid-template-columns: 1fr; }
  .page { padding: 20px; }
}

@media (max-width: 767px) {
  .report-page { padding: 16px; }
  .filter-section { flex-wrap: wrap; gap: 10px; margin-bottom: 18px; }
  .filter-section select { flex: 1 1 150px; min-width: 0; height: 40px; font-size: 16px; }
  .export-button { flex: 1 1 100%; height: 40px; margin-left: 0; font-size: 12px; }
  .summary-grid { gap: 10px; margin-bottom: 18px; }
  .summary-card { padding: 12px; gap: 10px; }
  .summary-card h2 { font-size: 15px; overflow-wrap: anywhere; }
  .report-card h2 { font-size: 15px; overflow-wrap: anywhere; }
  .chart { gap: 6px; }
  .bar { width: 50px; }
  .table-wrapper { display: none; }
  .report-cards { display: flex; flex-direction: column; gap: 12px; margin-top: 14px; }
  .report-card { padding: 14px; }
  .report-card-actions button { height: 40px; padding: 0 4px; font-size: 11px; }
  .report-card-actions button:last-child { height: 40px; padding: 0 4px; font-size: 11px; }
}

@media (max-width: 540px) {
  .filter-section select { flex: 1 1 100%; }
  .summary-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 374px) {
  .report-page { padding: 12px; }
  .summary-grid { grid-template-columns: 1fr; }
  .summary-card h2 { font-size: 17px; }
}
</style>