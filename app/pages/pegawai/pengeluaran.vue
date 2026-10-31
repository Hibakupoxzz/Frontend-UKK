<template>
  <div class="pegawai-pengeluaran-page">
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <NuxtLink to="/dashboard">Dashboard</NuxtLink>
      <span>›</span>
      <NuxtLink to="/pegawai/dashboard">Pegawai</NuxtLink>
      <span>›</span>
      <strong>Pengeluaran Perjalanan</strong>
    </div>

    <!-- Header -->
    <div class="page-header">
      <h1>Pengeluaran Perjalanan Saya</h1>
      <button class="add-button" type="button" :disabled="!canAddExpense" :title="canAddExpense ? '' : 'Pengeluaran hanya dapat dicatat saat perjalanan berlangsung atau selesai.'" @click="showForm = !showForm">
        {{ showForm ? 'Tutup Form' : '+ Tambah Pengeluaran' }}
      </button>
    </div>

    <div v-if="errorMessage" class="data-error" role="alert">{{ errorMessage }}</div>
    <div v-if="receiptError" class="data-error" role="alert">{{ receiptError }}</div>
    <div v-if="receiptMessage" class="data-success" role="status">{{ receiptMessage }}</div>
    <div v-if="paymentError" class="data-error" role="alert">{{ paymentError }}</div>
    <div v-if="paymentMessage" class="data-success" role="status">{{ paymentMessage }}</div>

    <!-- Form Tambah Pengeluaran -->
    <div v-if="showForm" class="expense-form-card">
      <p v-if="!canAddExpense" class="form-message error">
        Pengeluaran hanya dapat dicatat saat perjalanan berstatus Berlangsung atau Selesai.
      </p>
      <div class="form-grid">
        <div class="filter-group">
          <label>Jenis Pengeluaran</label>
          <select v-model="form.jenis">
            <option value="transportasi">Transportasi</option>
            <option value="penginapan">Penginapan</option>
            <option value="konsumsi">Konsumsi</option>
            <option value="lainnya">Lainnya</option>
          </select>
        </div>
        <div class="filter-group">
          <label>Jumlah (Rp)</label>
          <input v-model="form.jumlah" type="number" min="0" step="1" placeholder="0" />
        </div>
        <div class="filter-group">
          <label>Tanggal</label>
          <input v-model="form.tanggal" type="date" />
        </div>
        <div class="filter-group">
          <label>Keterangan</label>
          <input v-model="form.keterangan" type="text" placeholder="Keterangan pengeluaran" />
        </div>
      </div>
      <div class="form-actions">
        <button class="cancel-button" type="button" :disabled="submitting" @click="showForm = false">Batal</button>
        <button class="submit-button" type="button" :disabled="submitting || !selectedTripId" @click="handleCreate">
          {{ submitting ? 'Menyimpan...' : 'Simpan Pengeluaran' }}
        </button>
      </div>
      <p v-if="formMessage" class="form-message success" role="status">{{ formMessage }}</p>
      <p v-if="formError" class="form-message error" role="alert">{{ formError }}</p>
    </div>

    <!-- Summary -->
    <div class="summary">
      <div class="summary-item">
        <div class="summary-icon blue">💰</div>
        <div>
          <p>Total Pengeluaran</p>
          <h2>{{ formatCurrency(totalExpense) }}</h2>
        </div>
      </div>
      <div class="summary-item">
        <div class="summary-icon orange">⏳</div>
        <div>
          <p>Tanpa Bukti</p>
          <h2>{{ formatCurrency(unverified) }}</h2>
        </div>
      </div>
      <div class="summary-item">
        <div class="summary-icon green">✅</div>
        <div>
          <p>Dengan Bukti</p>
          <h2>{{ formatCurrency(verified) }}</h2>
        </div>
      </div>
    </div>

    <!-- Reimbursement -->
    <section v-if="selectedTrip" class="reimburse-card">
      <div class="reimburse-info">
        <h2>Reimbursement Perjalanan</h2>
        <p v-if="activePayment">
          Pengajuan pembayaran <strong>{{ activePayment.status_label }}</strong> sebesar
          {{ formatCurrency(activePayment.jumlah_diajukan) }}.
        </p>
        <p v-else-if="canRequestPayment">
          Perjalanan sudah selesai. Ajukan seluruh pengeluaran
          ({{ formatCurrency(totalBiaya) }}) untuk dibayar oleh Finance.
        </p>
        <p v-else>
          Pembayaran dapat diajukan setelah perjalanan berstatus Selesai dan memiliki pengeluaran.
        </p>
      </div>
      <button
        v-if="canRequestPayment"
        type="button"
        class="add-button"
        :disabled="requestingPayment"
        @click="handleRequestPayment"
      >
        {{ requestingPayment ? 'Mengajukan...' : 'Ajukan Pembayaran' }}
      </button>
      <span v-else-if="activePayment" class="status-badge" :class="`pay-${activePayment.status}`">
        {{ activePayment.status_label }}
      </span>
    </section>

    <!-- Filter Card -->
    <div class="filter-card">
      <div class="filter-group trip-group">
        <label>Perjalanan</label>
        <select v-model="selectedTripId">
          <option :value="null" disabled>{{ tripsLoading ? 'Memuat perjalanan...' : 'Pilih perjalanan' }}</option>
          <option v-for="trip in trips" :key="trip.id" :value="trip.id">
            {{ trip.tujuan }} · {{ formatDate(trip.tanggal_berangkat) }} · {{ tripStatusLabel(trip.status) }}
          </option>
        </select>
      </div>

      <div class="filter-group search-group">
        <label>Cari Kategori / Keterangan</label>
        <div class="search-input">
          <svg viewBox="0 0 24 24"><path d="M10.5 4a6.5 6.5 0 1 0 4.08 11.56l4.43 4.43 1.41-1.41-4.43-4.43A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z"/></svg>
          <input v-model="search" type="text" placeholder="Cari..." />
        </div>
      </div>

      <div class="filter-group">
        <label>Kategori</label>
        <select v-model="selectedCategory">
          <option value="">Semua</option>
          <option value="Transportasi">Transportasi</option>
          <option value="Penginapan">Penginapan</option>
          <option value="Konsumsi">Konsumsi</option>
          <option value="Lainnya">Lainnya</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Status</label>
        <select v-model="selectedStatus">
          <option value="">Semua</option>
          <option value="menunggu">Tanpa Bukti</option>
          <option value="verified">Dengan Bukti</option>
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
              <th>Kategori</th>
              <th>Tanggal Transaksi</th>
              <th>Nominal</th>
              <th>Keterangan</th>
              <th>Bukti</th>
              <th class="action-column">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="expensesLoading">
              <td colspan="7" class="table-state">Memuat data pengeluaran...</td>
            </tr>
            <tr v-else-if="!selectedTripId">
              <td colspan="7" class="table-state">Pilih perjalanan untuk melihat pengeluaran.</td>
            </tr>
            <tr v-else-if="filteredExpenses.length === 0">
              <td colspan="7" class="table-state">Belum ada pengeluaran pada perjalanan ini.</td>
            </tr>
            <tr v-for="(expense, index) in filteredExpenses" :key="expense.id">
              <td>{{ index + 1 }}</td>
              <td>{{ expense.category }}</td>
              <td>{{ expense.date }}</td>
              <td>{{ formatCurrency(expense.amount) }}</td>
              <td>{{ expense.keterangan }}</td>
              <td>
                <div v-if="expense.receipts.length" class="receipt-list">
                  <a
                    v-for="receipt in expense.receipts"
                    :key="receipt.id"
                    :href="receipt.url"
                    target="_blank"
                    rel="noopener"
                    class="file-link"
                  >
                    Lihat Bukti
                  </a>
                  <button
                    v-if="canAddExpense"
                    type="button"
                    class="text-danger"
                    :disabled="receiptLoadingId === expense.id"
                    @click="handleReceiptDelete(expense.id, receipt.id)"
                  >
                    Hapus
                  </button>
                </div>
                <div v-else class="receipt-empty">
                  <span class="no-file">Belum ada file</span>
                </div>

                <label v-if="canAddExpense" class="upload-button">
                  {{ receiptLoadingId === expense.id ? 'Mengunggah...' : (expense.receipts.length ? '+ Tambah' : 'Upload') }}
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    :disabled="receiptLoadingId === expense.id"
                    @change="handleReceiptUpload(expense.id, $event)"
                  />
                </label>
              </td>
              <td>
                <span class="status-badge" :class="expense.status">
                  {{ expense.status === 'verified' ? 'Dengan Bukti' : 'Tanpa Bukti' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div class="expense-cards">
        <article v-for="(expense, index) in filteredExpenses" :key="`card-${expense.id}`" class="expense-card">
          <div class="expense-card-header">
            <span class="expense-card-number">#{{ index + 1 }}</span>
          </div>
          <div class="expense-card-title">{{ expense.category }}</div>
          <div class="expense-card-subtitle">{{ expense.date }}</div>
          <dl class="expense-card-details">
            <div>
              <dt>Nominal</dt>
              <dd>{{ formatCurrency(expense.amount) }}</dd>
            </div>
            <div>
              <dt>Keterangan</dt>
              <dd>{{ expense.keterangan }}</dd>
            </div>
            <div v-if="expense.receipts.length">
              <dt>Bukti Transaksi</dt>
              <dd>
                <div class="receipt-list">
                  <a
                    v-for="receipt in expense.receipts"
                    :key="receipt.id"
                    :href="receipt.url"
                    target="_blank"
                    rel="noopener"
                    class="file-link"
                  >
                    Lihat Bukti
                  </a>
                  <button
                    v-if="canAddExpense"
                    type="button"
                    class="text-danger"
                    :disabled="receiptLoadingId === expense.id"
                    @click="handleReceiptDelete(expense.id, receipt.id)"
                  >
                    Hapus
                  </button>
                </div>
              </dd>
            </div>
          </dl>
          <div class="expense-card-actions">
            <span class="status-badge" :class="expense.status">
              {{ expense.status === 'verified' ? 'Dengan Bukti' : 'Tanpa Bukti' }}
            </span>
            <label v-if="canAddExpense" class="upload-button">
              {{ receiptLoadingId === expense.id ? 'Mengunggah...' : 'Upload Bukti' }}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                :disabled="receiptLoadingId === expense.id"
                @change="handleReceiptUpload(expense.id, $event)"
              />
            </label>
          </div>
        </article>
        <p v-if="expensesLoading" class="empty-state">Memuat data pengeluaran...</p>
        <p v-else-if="!selectedTripId" class="empty-state">Pilih perjalanan untuk melihat pengeluaran.</p>
        <p v-else-if="filteredExpenses.length === 0" class="empty-state">Belum ada pengeluaran pada perjalanan ini.</p>
      </div>

      <!-- Pagination -->
      <div class="table-footer">
        <span class="showing-text">Menampilkan {{ filteredExpenses.length }} dari {{ expenses.length }} data</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { ExpenseType, Payment } from '~/types/api'
import { useTrips } from '~/composables/useTrips'
import { useExpenses } from '~/composables/useExpenses'
import { usePayments } from '~/composables/usePayments'
import { apiErrorMessage } from '~/composables/useApi'
import { expenseTypeLabel, formatCurrency, formatDate, tripStatusLabel } from '~/utils/format'

const { trips, loading: tripsLoading, error: tripsError, fetchTrips } = useTrips()
const {
  expenses,
  totalBiaya,
  loading: expensesLoading,
  error: expensesError,
  fetchExpenses,
  createExpense,
  uploadReceipt,
  deleteReceipt,
} = useExpenses()

const { payments: tripPayments, fetchPayments, requestPayment } = usePayments()

const search = ref('')
const selectedCategory = ref('')
const selectedStatus = ref('')
const selectedTripId = ref<number | null>(null)

const showForm = ref(false)
const submitting = ref(false)
const formMessage = ref('')
const formError = ref('')

const receiptLoadingId = ref<number | null>(null)
const receiptError = ref('')
const receiptMessage = ref('')

const requestingPayment = ref(false)
const paymentError = ref('')
const paymentMessage = ref('')

const today = () => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const form = reactive({
  jenis: 'transportasi' as ExpenseType,
  jumlah: '' as string | number,
  tanggal: today(),
  keterangan: '',
})

const errorMessage = computed(() => tripsError.value ?? expensesError.value ?? '')

const selectedTrip = computed(() => trips.value.find((trip) => trip.id === selectedTripId.value) ?? null)
const canAddExpense = computed(() => !!selectedTrip.value && ['berjalan', 'selesai'].includes(selectedTrip.value.status))

const activePayment = computed<Payment | null>(() =>
  tripPayments.value.find((payment) => ['diajukan', 'disetujui', 'dibayar'].includes(payment.status)) ?? null)

const canRequestPayment = computed(() =>
  !!selectedTrip.value
  && ['selesai', 'lengkap'].includes(selectedTrip.value.status)
  && totalBiaya.value > 0
  && !activePayment.value)

const rows = computed(() => expenses.value.map((expense) => ({
  id: expense.id,
  category: expenseTypeLabel(expense.jenis),
  rawCategory: expense.jenis,
  date: formatDate(expense.tanggal),
  amount: expense.jumlah,
  keterangan: expense.keterangan || '—',
  status: expense.receipts?.length ? 'verified' : 'menunggu',
  receipts: expense.receipts ?? [],
})))

const filteredExpenses = computed(() => {
  return rows.value.filter((expense) => {
    const query = search.value.toLowerCase()
    const searchMatch = !query
      || expense.category.toLowerCase().includes(query)
      || expense.keterangan.toLowerCase().includes(query)

    const categoryMatch = !selectedCategory.value || expense.category === selectedCategory.value
    const statusMatch = !selectedStatus.value || expense.status === selectedStatus.value

    return searchMatch && categoryMatch && statusMatch
  })
})

const totalExpense = computed(() => totalBiaya.value)
const unverified = computed(() => rows.value.filter((row) => row.status === 'menunggu').reduce((sum, row) => sum + row.amount, 0))
const verified = computed(() => rows.value.filter((row) => row.status === 'verified').reduce((sum, row) => sum + row.amount, 0))

const loadExpenses = async () => {
  if (!selectedTripId.value) {
    expenses.value = []
    totalBiaya.value = 0
    return
  }

  await fetchExpenses(selectedTripId.value)
}

const loadPayment = async () => {
  if (!selectedTripId.value) {
    tripPayments.value = []
    return
  }

  try {
    await fetchPayments({ trip_id: selectedTripId.value, per_page: 100 })
  } catch {
    // pesan error sudah disimpan oleh composable
  }
}

const handleRequestPayment = async () => {
  if (!selectedTripId.value) return

  paymentError.value = ''
  paymentMessage.value = ''
  requestingPayment.value = true

  try {
    await requestPayment(selectedTripId.value)
    paymentMessage.value = 'Pengajuan pembayaran berhasil dikirim ke Finance.'
    await loadPayment()
  } catch (err) {
    paymentError.value = apiErrorMessage(err, 'Gagal mengajukan pembayaran.')
  } finally {
    requestingPayment.value = false
  }
}

const handleCreate = async () => {
  formMessage.value = ''
  formError.value = ''

  const jumlah = Number(form.jumlah)

  if (!selectedTripId.value) {
    formError.value = 'Pilih perjalanan terlebih dahulu.'
    return
  }

  if (!canAddExpense.value) {
    formError.value = 'Pengeluaran hanya dapat dicatat saat perjalanan berstatus Berlangsung atau Selesai.'
    return
  }

  if (!Number.isFinite(jumlah) || jumlah <= 0) {
    formError.value = 'Jumlah pengeluaran harus lebih dari 0.'
    return
  }

  if (!form.tanggal) {
    formError.value = 'Tanggal pengeluaran wajib diisi.'
    return
  }

  submitting.value = true

  try {
    await createExpense(selectedTripId.value, {
      jenis: form.jenis,
      jumlah,
      tanggal: form.tanggal,
      keterangan: form.keterangan.trim() || null,
    })

    formMessage.value = 'Pengeluaran berhasil disimpan.'
    form.jumlah = ''
    form.keterangan = ''
    form.tanggal = today()
    showForm.value = false
    await loadExpenses()
  } catch (err) {
    formError.value = apiErrorMessage(err, 'Gagal menyimpan pengeluaran.')
  } finally {
    submitting.value = false
  }
}

const handleReceiptUpload = async (expenseId: number, event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  receiptError.value = ''
  receiptMessage.value = ''

  if (!file) return

  if (file.size > 2 * 1024 * 1024) {
    receiptError.value = 'Ukuran file maksimal 2 MB.'
    input.value = ''
    return
  }

  receiptLoadingId.value = expenseId

  try {
    await uploadReceipt(expenseId, file)
    await loadExpenses()
    receiptMessage.value = 'Bukti berhasil diunggah.'
  } catch (err) {
    receiptError.value = apiErrorMessage(err, 'Gagal mengunggah bukti.')
  } finally {
    receiptLoadingId.value = null
    input.value = ''
  }
}

const handleReceiptDelete = async (expenseId: number, receiptId: number) => {
  if (!window.confirm('Hapus bukti ini?')) return

  receiptError.value = ''
  receiptMessage.value = ''
  receiptLoadingId.value = expenseId

  try {
    await deleteReceipt(receiptId)
    await loadExpenses()
    receiptMessage.value = 'Bukti dihapus.'
  } catch (err) {
    receiptError.value = apiErrorMessage(err, 'Gagal menghapus bukti.')
  } finally {
    receiptLoadingId.value = null
  }
}

watch(selectedTripId, () => {
  formError.value = ''
  formMessage.value = ''
  paymentError.value = ''
  paymentMessage.value = ''
  loadExpenses().catch(() => {})
  loadPayment()
})

onMounted(async () => {
  try {
    await fetchTrips({ page: 1 })
    if (trips.value.length > 0) {
      selectedTripId.value = trips.value[0]?.id ?? null
    }
  } catch {
    // error sudah disimpan di composable
  }
})
</script>

<style scoped>
.pegawai-pengeluaran-page {
  width: 100%;
  min-height: calc(100vh - 70px);
  padding: 24px 28px;
  background: #f5f6f8;
}

.breadcrumb {
  display: flex; align-items: center; gap: 8px; margin-bottom: 4px; font-size: 9px; color: #9aa4b5;
}
.breadcrumb a { color: #9aa4b5; text-decoration: none; }
.breadcrumb a:hover { color: var(--primary); }
.breadcrumb strong { color: var(--text); font-weight: 600; }

.page-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
.page-header h1 { margin: 0; font-size: 23px; font-weight: 700; color: var(--text); }
.add-button { min-height: 34px; padding: 0 13px; border: 1px solid var(--primary); border-radius: 7px; background: var(--primary); color: #fff; font-family: inherit; font-size: 10px; font-weight: 600; cursor: pointer; }
.add-button:disabled { cursor: not-allowed; opacity: 0.55; }
.data-error { margin-bottom: 16px; padding: 11px 14px; border: 1px solid #f4c7c7; border-radius: 8px; background: #fff5f5; color: #b42318; font-size: 11px; }
.data-success { margin-bottom: 16px; padding: 11px 14px; border: 1px solid #bfe8d8; border-radius: 8px; background: #f1fbf7; color: #147a5b; font-size: 11px; }

/* FORM */
.expense-form-card { padding: 16px; margin-bottom: 20px; background: var(--white); border: 1px solid var(--border); border-radius: 10px; }
.form-grid { display: grid; grid-template-columns: 170px 160px 170px minmax(200px, 1fr); gap: 12px; }
.form-grid .filter-group input { height: 31px; box-sizing: border-box; padding: 0 10px; border: 1px solid #dce2eb; border-radius: 6px; background: var(--white); color: var(--text); font-family: inherit; font-size: 10px; outline: none; }
.form-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 14px; }
.cancel-button, .submit-button { min-height: 32px; padding: 0 13px; border-radius: 6px; font-family: inherit; font-size: 10px; cursor: pointer; }
.cancel-button { border: 1px solid var(--primary); background: var(--white); color: var(--primary); }
.submit-button { border: 1px solid var(--primary); background: var(--primary); color: var(--white); }
.cancel-button:disabled, .submit-button:disabled { cursor: not-allowed; opacity: 0.6; }
.form-message { margin: 10px 0 0; font-size: 11px; }
.form-message.success { color: #18a77c; }
.form-message.error { color: #dc2626; }

/* SUMMARY */
.summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; margin-bottom: 24px; }
.summary-item { min-width: 0; min-height: 78px; display: flex; align-items: center; gap: 12px; padding: 14px; background: var(--white); border: 1px solid var(--border); border-radius: 9px; }
.summary-icon { width: 36px; height: 36px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; border-radius: 8px; font-size: 16px; }
.summary-icon.blue { background: #e9f0ff; color: var(--primary); }
.summary-icon.orange { background: #fff3df; color: #f59e0b; }
.summary-icon.green { background: #e3f8ef; color: #16a34a; }
.summary-item > div:last-child { min-width: 0; }
.summary-item p { margin: 0 0 3px; font-size: 9px; color: #7b8799; }
.summary-item h2 { margin: 0; font-size: 15px; line-height: 1.1; color: var(--text); font-weight: 700; }

/* REIMBURSEMENT */
.reimburse-card { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 14px; padding: 16px 18px; margin-bottom: 20px; background: var(--white); border: 1px solid var(--border); border-radius: 10px; }
.reimburse-info { min-width: 0; }
.reimburse-info h2 { margin: 0 0 4px; font-size: 13px; font-weight: 700; color: var(--text); }
.reimburse-info p { margin: 0; font-size: 11px; line-height: 1.5; color: var(--text-muted); }
.pay-diajukan { background: #fff3df; color: #b45309; }
.pay-disetujui { background: #e9f0ff; color: #1d4ed8; }
.pay-ditolak { background: #fee2e2; color: #b42318; }
.pay-dibayar { background: #dff7ef; color: #18a77c; }

/* FILTER CARD */
.filter-card { display: grid; grid-template-columns: minmax(190px, 0.8fr) minmax(240px, 1fr) 160px 160px; gap: 14px; padding: 16px; margin-bottom: 24px; background: var(--white); border: 1px solid var(--border); border-radius: 10px; }
.filter-group { display: flex; flex-direction: column; gap: 6px; }
.filter-group label { font-size: 9px; font-weight: 600; color: #667085; }
.search-input, .date-input { height: 31px; display: flex; align-items: center; border: 1px solid #dce2eb; border-radius: 6px; background: var(--white); }
.search-input svg, .date-input svg { width: 14px; height: 14px; margin: 0 8px; fill: #718096; flex-shrink: 0; }
.search-input input, .date-input input, .filter-group select { width: 100%; height: 31px; box-sizing: border-box; border: 1px solid #dce2eb; border-radius: 6px; background: var(--white); color: var(--text); outline: none; font-family: inherit; font-size: 10px; }
.search-input input { border: none; }
.date-input input { border: none; padding: 0 0 0 4px; }
.filter-group select { padding: 0 10px; }
.search-input input:focus, .date-input input:focus, .filter-group select:focus { outline: none; }

/* TABLE */
.table-card { background: var(--white); border: 1px solid var(--border); border-radius: 11px; overflow: hidden; }
.table-wrapper { padding: 18px; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; table-layout: fixed; }
thead { background: #f3f4f6; }
th { padding: 10px 12px; text-align: left; font-size: 9px; font-weight: 600; color: #718096; }
td { padding: 14px 12px; border-bottom: 1px solid #e5e8ee; font-size: 10px; color: #344054; vertical-align: middle; }
tbody tr:last-child td { border-bottom: none; }
.no-column { width: 30px; }
.action-column { width: 70px; text-align: center; }

.status-badge { display: inline-flex; align-items: center; padding: 4px 9px; border-radius: 5px; font-size: 9px; font-weight: 600; white-space: nowrap; }
.waiting, .menunggu { background: #fff3df; color: #ef9b16; }
.verified { background: #dff7ef; color: #18a77c; }

.detail-button { display: inline-block; margin: auto; border: none; background: transparent; color: #1769ff; font-family: inherit; font-size: 10px; font-weight: 600; cursor: pointer; text-decoration: none; }
.detail-button:hover { text-decoration: underline; }
.file-link { color: #1769ff; font-size: 10px; font-weight: 600; text-decoration: none; }
.file-link:hover { text-decoration: underline; }
.no-file { color: #9aa4b5; font-size: 10px; }
.receipt-list { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.receipt-empty { margin-bottom: 4px; }
.upload-button { display: inline-flex; align-items: center; margin-top: 6px; padding: 3px 8px; border: 1px dashed #b9c4d4; border-radius: 5px; color: #1769ff; font-size: 9px; font-weight: 600; cursor: pointer; }
.upload-button:hover { border-color: #1769ff; background: #f5f8ff; }
.upload-button input { display: none; }
.text-danger { padding: 0; border: 0; background: transparent; color: #b42318; font-family: inherit; font-size: 9px; font-weight: 600; cursor: pointer; }
.text-danger:disabled { cursor: not-allowed; opacity: 0.6; }
.table-state { height: 90px; text-align: center; color: #8792a5; font-size: 11px; }

/* MOBILE CARDS */
.expense-cards { display: none; }
.expense-card { padding: 14px; background: var(--white); border: 1px solid var(--border); border-radius: 10px; }
.expense-card-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.expense-card-number { font-size: 10px; color: #9aa4b5; }
.expense-card-title { display: block; color: var(--text); font-size: 14px; font-weight: 700; line-height: 1.35; overflow-wrap: anywhere; }
.expense-card-subtitle { margin-top: 4px; font-size: 11px; color: var(--text-muted); }
.expense-card-details { display: grid; grid-template-columns: 1fr; gap: 8px; margin: 12px 0; }
.expense-card-details > div { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.expense-card-details dt { font-size: 10px; color: #8792a5; }
.expense-card-details dd { margin: 0; font-size: 11px; font-weight: 500; color: var(--text); text-align: right; }
.expense-card-actions { display: flex; justify-content: flex-end; padding-top: 10px; border-top: 1px solid #eef1f5; }
.expense-card-actions .detail-button { width: 100%; min-height: 40px; border: 1px solid var(--primary); border-radius: 7px; background: #f5f8ff; }

.empty-state { padding: 28px 16px; text-align: center; font-size: 12px; color: #8792a5; }

/* FOOTER */
.table-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px 18px; }
.showing-text { font-size: 9px; color: #718096; }
.pagination { display: flex; gap: 6px; }
.page-button { width: 25px; height: 25px; border: 1px solid #dce2eb; border-radius: 5px; background: var(--white); color: var(--text); font-family: inherit; font-size: 9px; cursor: pointer; }
.page-button.active { border-color: var(--primary); background: var(--primary); color: var(--white); }

/* RESPONSIVE */
@media (max-width: 1023px) { .pegawai-pengeluaran-page { padding: 20px; } .filter-card { grid-template-columns: 1fr 1fr; } .form-grid { grid-template-columns: 1fr 1fr; } table { min-width: 0; table-layout: fixed; } th { padding: 9px 6px; } td { padding: 11px 6px; font-size: 9px; } .status-badge { padding: 3px 7px; font-size: 8.5px; } .detail-button { font-size: 9px; } }

@media (max-width: 767px) { .pegawai-pengeluaran-page { padding: 16px; } .filter-card { grid-template-columns: 1fr; padding: 14px; gap: 12px; margin-bottom: 16px; } .form-grid { grid-template-columns: 1fr; } .page-header h1 { font-size: 20px; } .filter-group input, .filter-group select { font-size: 16px; } .table-wrapper { display: none; } .table-footer { flex-direction: column; align-items: flex-start; gap: 10px; padding: 0 14px 14px; } .pagination { flex-wrap: wrap; } .expense-cards { display: flex; flex-direction: column; gap: 12px; padding: 14px; } .table-card { border: none; background: transparent; overflow: visible; } .summary { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; } .summary-item { padding: 12px; gap: 10px; } .summary-item h2 { font-size: 14px; } .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .expense-card { padding: 12px; } .empty-state { padding: 20px 12px; font-size: 11px; } }

@media (max-width: 540px) { .summary { grid-template-columns: 1fr; } }

@media (max-width: 374px) { .pegawai-pengeluaran-page { padding: 12px; } }
</style>