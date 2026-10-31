<template>
  <div class="page">
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <NuxtLink to="/dashboard">Dashboard</NuxtLink>
      <span>›</span>
      <NuxtLink to="/finance/dashboard">Finance</NuxtLink>
      <span>›</span>
      <strong>Pengeluaran</strong>
    </div>

    <!-- Header -->
    <div class="page-header">
      <h1>Pengeluaran Perjalanan Dinas</h1>
    </div>

    <!-- Summary Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">💰</div>
        <div>
          <p>Total Pengeluaran</p>
          <h2>{{ formatCurrency(stats.total) }}</h2>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">▤</div>
        <div>
          <p>Jumlah Pengeluaran</p>
          <h2>{{ stats.count }}</h2>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon cyan">⏳</div>
        <div>
          <p>Tanpa Bukti</p>
          <h2>{{ formatCurrency(stats.withoutReceipt) }}</h2>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">✓</div>
        <div>
          <p>Dengan Bukti</p>
          <h2>{{ formatCurrency(stats.withReceipt) }}</h2>
        </div>
      </div>
    </div>

    <div v-if="error" class="data-error" role="alert">{{ error }}</div>

    <!-- Filter Card -->
    <div class="filter-card">
      <div class="filter-group search-group">
        <label>Cari Pegawai / Tujuan</label>
        <div class="search-input">
          <svg viewBox="0 0 24 24"><path d="M10.5 4a6.5 6.5 0 1 0 4.08 11.56l4.43 4.43 1.41-1.41-4.43-4.43A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z"/></svg>
          <input v-model="search" type="text" placeholder="Cari..." />
        </div>
      </div>

      <div class="filter-group">
        <label>Periode</label>
        <select v-model="selectedPeriod">
          <option value="">Semua Periode</option>
          <option v-for="option in periodOptions" :key="option.value" :value="option.value">
            {{ option.label }}
          </option>
        </select>
      </div>

      <div class="filter-group">
        <label>Bukti</label>
        <select v-model="selectedReceipt">
          <option value="">Semua</option>
          <option value="with">Dengan Bukti</option>
          <option value="without">Tanpa Bukti</option>
        </select>
      </div>
    </div>

    <!-- Table Card -->
    <div class="table-card">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th class="no-column">No</th>
              <th>Pegawai</th>
              <th>Tujuan</th>
              <th>Tanggal</th>
              <th>Jenis</th>
              <th>Keterangan</th>
              <th>Jumlah</th>
              <th>Bukti</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && rows.length === 0">
              <td colspan="8" class="table-state">Memuat data pengeluaran...</td>
            </tr>
            <tr v-else-if="filteredRows.length === 0">
              <td colspan="8" class="table-state">Tidak ada data pengeluaran.</td>
            </tr>
            <tr v-for="(item, index) in filteredRows" :key="item.key">
              <td>{{ index + 1 }}</td>
              <td>{{ item.employee }}</td>
              <td>{{ item.destination }}</td>
              <td>{{ item.date }}</td>
              <td>{{ item.jenis }}</td>
              <td>{{ item.keterangan }}</td>
              <td>{{ formatCurrency(item.amount) }}</td>
              <td>
                <span class="status-badge" :class="item.receipts > 0 ? 'completed' : 'waiting'">
                  {{ item.receipts > 0 ? `${item.receipts} file` : 'Belum ada' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div class="expense-cards">
        <article v-for="(item, index) in filteredRows" :key="`card-${item.key}`" class="expense-card">
          <div class="expense-card-header">
            <span class="expense-card-number">#{{ index + 1 }}</span>
            <span class="status-badge" :class="item.receipts > 0 ? 'completed' : 'waiting'">
              {{ item.receipts > 0 ? 'Dengan Bukti' : 'Tanpa Bukti' }}
            </span>
          </div>
          <div class="expense-card-title">{{ item.employee }}</div>
          <div class="expense-card-subtitle">{{ item.destination }} - {{ item.date }}</div>
          <dl class="expense-card-details">
            <div>
              <dt>Jenis</dt>
              <dd>{{ item.jenis }}</dd>
            </div>
            <div>
              <dt>Keterangan</dt>
              <dd>{{ item.keterangan }}</dd>
            </div>
            <div>
              <dt>Jumlah</dt>
              <dd>{{ formatCurrency(item.amount) }}</dd>
            </div>
            <div>
              <dt>Bukti</dt>
              <dd>{{ item.receipts > 0 ? `${item.receipts} file` : 'Belum ada' }}</dd>
            </div>
          </dl>
        </article>
        <p v-if="!loading && filteredRows.length === 0" class="empty-state">Tidak ada data pengeluaran.</p>
      </div>

      <!-- Footer -->
      <div class="table-footer">
        <span class="showing-text">Menampilkan {{ filteredRows.length }} dari {{ rows.length }} data</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useReports } from '~/composables/useReports'
import { formatCurrency } from '~/utils/format'

const search = ref('')
const selectedPeriod = ref('')
const selectedReceipt = ref('')

const { expenseReport, loading, error, fetchExpenseReport } = useReports()

const asText = (value: string | number | null | undefined) =>
  (value === null || value === undefined ? '—' : String(value))
const asNumber = (value: string | number | null | undefined) => Number(value) || 0

const rows = computed(() => (expenseReport.value?.rows ?? []).map((row, index) => {
  const date = asText(row[3])
  const [day, month, year] = date.split('-')

  return {
    key: `${date}-${index}`,
    employee: asText(row[1]),
    destination: asText(row[2]),
    date,
    dateKey: `${year}-${month}-${day}`,
    periodKey: `${year}-${month}`,
    jenis: asText(row[4]),
    keterangan: asText(row[5]),
    amount: asNumber(row[6]),
    receipts: asNumber(row[7]),
  }
}))

const periodOptions = computed(() => {
  const months = new Map<string, string>()

  for (const row of rows.value) {
    if (!row.periodKey || row.periodKey.includes('undefined')) continue
    if (months.has(row.periodKey)) continue

    const label = new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' })
      .format(new Date(`${row.periodKey}-01`))

    months.set(row.periodKey, label)
  }

  return Array.from(months.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([value, label]) => ({ value, label }))
})

const filteredRows = computed(() => {
  const query = search.value.trim().toLowerCase()

  return rows.value.filter((item) => {
    const searchMatch = !query
      || item.employee.toLowerCase().includes(query)
      || item.destination.toLowerCase().includes(query)

    const periodMatch = !selectedPeriod.value || item.periodKey === selectedPeriod.value
    const receiptMatch = !selectedReceipt.value
      || (selectedReceipt.value === 'with' && item.receipts > 0)
      || (selectedReceipt.value === 'without' && item.receipts === 0)

    return searchMatch && periodMatch && receiptMatch
  })
})

const stats = computed(() => {
  const total = rows.value.reduce((sum, row) => sum + row.amount, 0)
  const withReceipt = rows.value
    .filter((row) => row.receipts > 0)
    .reduce((sum, row) => sum + row.amount, 0)

  return {
    total,
    count: rows.value.length,
    withReceipt,
    withoutReceipt: total - withReceipt,
  }
})

onMounted(async () => {
  try {
    await fetchExpenseReport()
  } catch {
    // pesan error sudah disimpan oleh composable
  }
})
</script>

<style scoped>
.page {
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

/* STATS GRID */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 14px;
  margin-bottom: 24px;
}

.stat-card {
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

.stat-icon {
  width: 36px; height: 36px;
  flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  border-radius: 8px; font-size: 16px;
}

.stat-icon.blue { background: #e9f0ff; color: var(--primary); }
.stat-icon.orange { background: #fff3df; color: #f59e0b; }
.stat-icon.cyan { background: #e5f7fc; color: #0891b2; }
.stat-icon.green { background: #e3f8ef; color: #10b981; }

.stat-card > div:last-child { min-width: 0; }
.stat-card p { margin: 0 0 3px; font-size: 9px; color: #7b8799; }
.stat-card h2 { margin: 0; font-size: 15px; line-height: 1.1; color: var(--text); font-weight: 700; }

.data-error { margin-bottom: 16px; padding: 11px 14px; border: 1px solid #f4c7c7; border-radius: 8px; background: #fff5f5; color: #b42318; font-size: 11px; }

/* FILTER CARD */
.filter-card {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) 195px 195px;
  gap: 14px;
  padding: 16px;
  margin-bottom: 24px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 10px;
}

.filter-group { display: flex; flex-direction: column; gap: 6px; }
.filter-group label { font-size: 9px; font-weight: 600; color: #667085; }

.search-input, .date-input {
  height: 31px; display: flex; align-items: center;
  border: 1px solid #dce2eb; border-radius: 6px; background: var(--white);
}
.search-input svg, .date-input svg { width: 14px; height: 14px; margin: 0 8px; fill: #718096; flex-shrink: 0; }
.search-input input, .date-input input, .filter-group select {
  width: 100%; height: 31px; box-sizing: border-box;
  border: 1px solid #dce2eb; border-radius: 6px;
  background: var(--white); color: var(--text);
  outline: none; font-family: inherit; font-size: 10px;
}
.search-input input { border: none; }
.date-input input { border: none; padding: 0 0 0 4px; }
.filter-group select { padding: 0 10px; }
.search-input input:focus, .date-input input:focus, .filter-group select:focus { outline: none; }

/* TABLE */
.table-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 11px;
  overflow: hidden;
}

.table-wrapper { padding: 18px; overflow-x: auto; }

table { width: 100%; border-collapse: collapse; table-layout: fixed; }
thead { background: #f3f4f6; }
th { padding: 10px 12px; text-align: left; font-size: 9px; font-weight: 600; color: #718096; }
td { padding: 14px 12px; border-bottom: 1px solid #e5e8ee; font-size: 10px; color: #344054; vertical-align: middle; }
tbody tr:last-child td { border-bottom: none; }
.no-column { width: 30px; }
.table-state { padding: 22px 12px; text-align: center; font-size: 10px; color: #8792a5; }

.status-badge {
  display: inline-flex; align-items: center;
  padding: 4px 9px; border-radius: 5px;
  font-size: 9px; font-weight: 600; white-space: nowrap;
}
.waiting, .pending { background: #fff3df; color: #ef9b16; }
.completed { background: #dff7ef; color: #18a77c; }

/* MOBILE CARDS */
.expense-cards { display: none; }
.expense-card {
  padding: 14px; background: var(--white); border: 1px solid var(--border); border-radius: 10px;
}
.expense-card-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.expense-card-number { font-size: 10px; color: #9aa4b5; }
.expense-card-title { display: block; color: var(--text); font-size: 14px; font-weight: 700; line-height: 1.35; }
.expense-card-subtitle { margin-top: 4px; font-size: 11px; color: var(--text-muted); }
.expense-card-details { display: grid; grid-template-columns: 1fr; gap: 8px; margin: 12px 0; }
.expense-card-details > div { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.expense-card-details dt { font-size: 10px; color: #8792a5; }
.expense-card-details dd { margin: 0; font-size: 11px; font-weight: 500; color: var(--text); text-align: right; }

.empty-state { padding: 28px 16px; text-align: center; font-size: 12px; color: #8792a5; }

/* FOOTER */
.table-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px 18px; }
.showing-text { font-size: 9px; color: #718096; }

/* RESPONSIVE */
@media (max-width: 1023px) {
  .page { padding: 20px; }
  .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .filter-card { grid-template-columns: 1fr 1fr; }
  .search-group { grid-column: 1 / -1; }
  table { min-width: 0; table-layout: fixed; }
  th { padding: 9px 6px; } td { padding: 11px 6px; font-size: 9px; }
  .status-badge { padding: 3px 7px; font-size: 8.5px; }
}

@media (max-width: 767px) {
  .page { padding: 16px; }
  .filter-card { grid-template-columns: 1fr; padding: 14px; gap: 12px; margin-bottom: 16px; }
  .page-header h1 { font-size: 20px; }
  .filter-group input, .filter-group select { font-size: 16px; }
  .date-input svg { display: none; }
  .table-wrapper { display: none; }
  .table-footer { flex-direction: column; align-items: flex-start; gap: 10px; padding: 0 14px 14px; }
  .expense-cards { display: flex; flex-direction: column; gap: 12px; padding: 14px; }
  .table-card { border: none; background: transparent; overflow: visible; }
  .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .stat-card { padding: 12px; gap: 10px; }
  .stat-card h2 { font-size: 14px; }
}

@media (max-width: 540px) {
  .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 374px) {
  .page { padding: 12px; }
  .stats-grid { grid-template-columns: 1fr; }
  .expense-cards { padding: 10px; }
}
</style>
