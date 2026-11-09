<template>
  <div class="budget-page">
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <NuxtLink to="/dashboard">Dashboard</NuxtLink>
      <AppIcon name="chevron-right" class="crumb-sep" />
      <strong>Pagu Anggaran</strong>
    </div>

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1>Pagu Anggaran Departemen</h1>
        <p>Batas total estimasi perjalanan per departemen per bulan keberangkatan.</p>
      </div>

      <LayoutPageactions />
    </div>

    <div v-if="error" class="state-banner error-banner" role="alert">
      <span>{{ error }}</span>
      <button type="button" :disabled="loading" @click="reload">Coba Lagi</button>
    </div>

    <!-- Filter + tambah -->
    <div class="filter-card">
      <div class="filter-group">
        <label for="filter-periode">Periode</label>
        <input id="filter-periode" v-model="periode" type="month" />
      </div>

      <button type="button" class="ghost-button" :disabled="!periode" @click="clearPeriode">
        Semua Periode
      </button>

      <button type="button" class="primary-button" @click="showForm = !showForm">
        {{ showForm ? 'Tutup Form' : '+ Tambah Pagu' }}
      </button>

      <button
        type="button"
        class="ghost-button"
        :disabled="exporting || loading"
        @click="handleExport('pdf')"
      >
        {{ exporting ? 'Menyiapkan...' : 'Ekspor PDF' }}
      </button>

      <button
        type="button"
        class="ghost-button"
        :disabled="exporting || loading"
        @click="handleExport('xlsx')"
      >
        Ekspor Excel
      </button>
    </div>

    <p v-if="exportError" class="form-message error" role="alert">{{ exportError }}</p>

    <!-- Create form -->
    <section v-if="showForm" class="form-card">
      <h2>Tambah Pagu Anggaran</h2>

      <p v-if="formError" class="form-message error" role="alert">{{ formError }}</p>

      <form @submit.prevent="handleCreate">
        <div class="form-grid">
          <div class="form-group">
            <label for="budget-department">Departemen</label>
            <input
              id="budget-department"
              v-model="form.department"
              type="text"
              placeholder="Contoh: Marketing"
              :disabled="saving"
              required
            />
          </div>

          <div class="form-group">
            <label for="budget-periode">Periode (Bulan)</label>
            <input id="budget-periode" v-model="form.periode" type="month" :disabled="saving" required />
          </div>

          <div class="form-group full">
            <label for="budget-pagu">Pagu (Rp)</label>
            <input
              id="budget-pagu"
              v-model.number="form.pagu"
              type="number"
              min="0"
              step="1000"
              placeholder="0"
              :disabled="saving"
              required
            />
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="primary-button" :disabled="saving">
            {{ saving ? 'Menyimpan...' : 'Simpan Pagu' }}
          </button>
        </div>
      </form>
    </section>

    <!-- Table -->
    <div class="table-card">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Departemen</th>
              <th>Periode</th>
              <th>Pagu</th>
              <th>Terpakai</th>
              <th>Sisa</th>
              <th>Pemakaian</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && budgets.length === 0">
              <td colspan="7" class="table-state">Memuat pagu anggaran...</td>
            </tr>
            <tr v-else-if="budgets.length === 0">
              <td colspan="7" class="table-state">Belum ada pagu anggaran untuk periode ini.</td>
            </tr>
            <tr v-for="budget in budgets" :key="budget.id">
              <td>{{ budget.department }}</td>
              <td>{{ formatPeriode(budget.periode) }}</td>
              <td>{{ formatCurrency(budget.pagu) }}</td>
              <td>{{ formatCurrency(budget.terpakai) }}</td>
              <td :class="budget.sisa < 0 ? 'over-budget' : 'under-budget'">
                {{ formatCurrency(budget.sisa) }}
              </td>
              <td>
                <div class="progress" role="progressbar" :aria-valuenow="usagePercent(budget)" aria-valuemin="0" aria-valuemax="100">
                  <div
                    class="progress-bar"
                    :class="{ over: usagePercent(budget) >= 100 }"
                    :style="{ width: `${Math.min(usagePercent(budget), 100)}%` }"
                  />
                </div>
                <span class="progress-label">{{ usagePercent(budget) }}%</span>
              </td>
              <td>
                <div class="row-actions">
                  <button
                    type="button"
                    class="text-button"
                    :disabled="editingId !== null"
                    @click="startEdit(budget)"
                  >
                    Ubah
                  </button>
                  <button
                    type="button"
                    class="text-danger"
                    :disabled="editingId !== null"
                    @click="handleDelete(budget.id)"
                  >
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Edit form -->
    <section v-if="editingId !== null" class="form-card">
      <h2>Ubah Pagu — {{ editForm.department }} ({{ formatPeriode(editForm.periode) }})</h2>

      <p v-if="formError" class="form-message error" role="alert">{{ formError }}</p>

      <form @submit.prevent="handleUpdate">
        <div class="form-grid">
          <div class="form-group full">
            <label for="edit-pagu">Pagu (Rp)</label>
            <input
              id="edit-pagu"
              v-model.number="editForm.pagu"
              type="number"
              min="0"
              step="1000"
              :disabled="saving"
              required
            />
          </div>
        </div>

        <div class="form-actions split">
          <button type="button" class="ghost-button" :disabled="saving" @click="cancelEdit">
            Batal
          </button>
          <button type="submit" class="primary-button" :disabled="saving">
            {{ saving ? 'Menyimpan...' : 'Simpan Perubahan' }}
          </button>
        </div>
      </form>
    </section>

    <p class="page-note">
      Pengajuan perjalanan dengan estimasi yang melampaui sisa pagu akan ditolak sistem.
      Tanpa baris pagu, departemen tidak dibatasi.
    </p>
  </div>
</template>

<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import type { Budget, TripQuery } from '~/types/api'
import { useBudgets } from '~/composables/useBudgets'
import { useReports } from '~/composables/useReports'
import { apiErrorMessage } from '~/composables/useApi'
import { formatCurrency } from '~/utils/format'

const { budgets, loading, error, fetchBudgets, createBudget, updateBudget, deleteBudget } = useBudgets()
const { downloadReport } = useReports()

const currentPeriode = () => {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

const periode = ref(currentPeriode())
const showForm = ref(false)
const saving = ref(false)
const formError = ref('')
const editingId = ref<number | null>(null)
const exporting = ref(false)
const exportError = ref('')

const form = reactive({
  department: '',
  periode: currentPeriode(),
  pagu: '' as number | '',
})

const editForm = reactive({
  department: '',
  periode: '',
  pagu: 0,
})

const formatPeriode = (value: string) => {
  const date = new Date(`${value}-01`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(date)
}

const usagePercent = (budget: Budget) => {
  if (!budget.pagu || budget.pagu <= 0) return budget.terpakai > 0 ? 100 : 0
  return Math.round((Number(budget.terpakai) / Number(budget.pagu)) * 100)
}

const reload = async () => {
  await fetchBudgets(periode.value || undefined).catch(() => {})
}

watch(periode, () => {
  void reload()
})

const clearPeriode = () => {
  periode.value = ''
}

const handleExport = async (format: 'pdf' | 'xlsx') => {
  exportError.value = ''
  exporting.value = true

  try {
    await downloadReport('budgets', format, { periode: periode.value || undefined } as TripQuery)
  } catch (err) {
    exportError.value = apiErrorMessage(err, 'Gagal mengunduh laporan pagu.')
  } finally {
    exporting.value = false
  }
}

const handleCreate = async () => {
  formError.value = ''

  const pagu = Number(form.pagu)

  if (!form.department.trim() || !form.periode || !Number.isFinite(pagu) || pagu < 0) {
    formError.value = 'Departemen, periode, dan pagu wajib diisi dengan benar.'
    return
  }

  saving.value = true

  try {
    await createBudget({
      department: form.department.trim(),
      periode: form.periode,
      pagu,
    })

    form.department = ''
    form.pagu = ''
    showForm.value = false
    await reload()
  } catch (err) {
    formError.value = apiErrorMessage(err, 'Gagal menyimpan pagu.')
  } finally {
    saving.value = false
  }
}

const startEdit = (budget: Budget) => {
  formError.value = ''
  editingId.value = budget.id
  editForm.department = budget.department
  editForm.periode = budget.periode
  editForm.pagu = Number(budget.pagu)
}

const cancelEdit = () => {
  editingId.value = null
  formError.value = ''
}

const handleUpdate = async () => {
  if (editingId.value === null) return

  const pagu = Number(editForm.pagu)

  if (!Number.isFinite(pagu) || pagu < 0) {
    formError.value = 'Pagu wajib diisi dengan benar.'
    return
  }

  saving.value = true
  formError.value = ''

  try {
    await updateBudget(editingId.value, {
      department: editForm.department,
      periode: editForm.periode,
      pagu,
    })

    editingId.value = null
    await reload()
  } catch (err) {
    formError.value = apiErrorMessage(err, 'Gagal menyimpan perubahan.')
  } finally {
    saving.value = false
  }
}

const handleDelete = async (id: number) => {
  if (!window.confirm('Hapus pagu anggaran ini?')) return

  try {
    await deleteBudget(id)
    await reload()
  } catch (err) {
    error.value = apiErrorMessage(err, 'Gagal menghapus pagu.')
  }
}

onMounted(() => {
  void reload()
})
</script>

<style scoped>
.budget-page {
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
  margin-bottom: 20px;
}

.page-header h1 { margin: 0; font-size: 23px; font-weight: 700; color: var(--text); }
.page-header p { margin: 5px 0 0; font-size: 11px; color: var(--text-muted); }

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

.error-banner { border-color: #ffd1d1; background: #fff5f5; color: #ef5350; }
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

.filter-card {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 16px;
  padding: 14px 16px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--white);
}

.filter-group { display: flex; flex-direction: column; gap: 6px; }
.filter-group label { font-size: 9px; font-weight: 600; color: var(--text); }
.filter-group input {
  padding: 8px 10px;
  border: 1px solid #dce2eb;
  border-radius: 6px;
  background: var(--white);
  color: var(--text);
  font-family: inherit;
  font-size: 10px;
  outline: none;
}

.primary-button {
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid var(--primary);
  border-radius: 6px;
  background: var(--primary);
  color: var(--white);
  font-family: inherit;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
}

.primary-button:hover { opacity: 0.9; }
.primary-button:disabled { cursor: not-allowed; opacity: 0.6; }

.ghost-button {
  min-height: 34px;
  padding: 0 14px;
  border: 1px solid #dce2eb;
  border-radius: 6px;
  background: var(--white);
  color: #667085;
  font-family: inherit;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
}

.ghost-button:disabled { cursor: not-allowed; opacity: 0.55; }

.form-card {
  margin-bottom: 16px;
  padding: 18px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--white);
}

.form-card h2 { margin: 0 0 14px; font-size: 14px; font-weight: 700; color: var(--text); }

.form-message {
  margin: 0 0 12px;
  padding: 9px 11px;
  border: 1px solid #f4c7c7;
  border-radius: 7px;
  background: #fff5f5;
  color: #b42318;
  font-size: 10px;
  line-height: 1.5;
}

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group.full { grid-column: 1 / -1; }
.form-group label { font-size: 9px; font-weight: 600; color: var(--text); }

.form-group input {
  width: 100%;
  box-sizing: border-box;
  padding: 8px 10px;
  border: 1px solid #dce2eb;
  border-radius: 6px;
  background: var(--white);
  color: var(--text);
  font-family: inherit;
  font-size: 10px;
  outline: none;
}

.form-group input:focus { border-color: var(--primary); }
.form-actions { display: flex; justify-content: flex-end; }
.form-actions.split { justify-content: space-between; }

.table-card {
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--white);
  overflow: hidden;
}

.table-wrapper { overflow-x: auto; }
table { width: 100%; border-collapse: collapse; table-layout: auto; }
thead { background: #f3f4f6; }

th {
  padding: 8px;
  text-align: left;
  font-size: 8px;
  font-weight: 600;
  color: #718096;
  white-space: nowrap;
}

td {
  padding: 11px 8px;
  border-bottom: 1px solid #e5e8ee;
  font-size: 10px;
  color: #374151;
  vertical-align: middle;
}

tbody tr:last-child td { border-bottom: none; }
.table-state { text-align: center; color: #8792a5; }

td.over-budget { color: #b42318; font-weight: 600; }
td.under-budget { color: #15803d; font-weight: 600; }

.progress {
  min-width: 110px;
  height: 8px;
  border-radius: 999px;
  background: #eef1f5;
  overflow: hidden;
}

.progress-bar { height: 100%; border-radius: 999px; background: var(--primary); }
.progress-bar.over { background: #dc2626; }
.progress-label { font-size: 9px; color: #8792a5; }

.row-actions { display: flex; align-items: center; gap: 8px; }

.text-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: var(--primary);
  font: inherit;
  font-size: 9px;
  font-weight: 600;
  cursor: pointer;
}

.text-button:disabled { cursor: not-allowed; opacity: 0.55; }

.text-danger {
  padding: 0;
  border: 0;
  background: transparent;
  color: #b42318;
  font: inherit;
  font-size: 9px;
  cursor: pointer;
}

.page-note {
  margin: 14px 0 0;
  padding: 9px 11px;
  border: 1px dashed #dce2eb;
  border-radius: 7px;
  background: #fafbfc;
  color: #8792a5;
  font-size: 9px;
  line-height: 1.6;
}

@media (max-width: 767px) {
  .budget-page { padding: 16px; }
  .page-header h1 { font-size: 20px; }
  .form-grid { grid-template-columns: 1fr; }
  .filter-group { flex: 1 1 140px; }
}
</style>
