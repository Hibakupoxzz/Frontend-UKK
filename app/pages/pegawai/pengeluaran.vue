<template>
  <div class="pegawai-pengeluaran-page">
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <NuxtLink to="/dashboard">Dashboard</NuxtLink>
      <AppIcon name="chevron-right" class="crumb-sep" />
      <NuxtLink to="/pegawai/dashboard">Pegawai</NuxtLink>
      <AppIcon name="chevron-right" class="crumb-sep" />
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
        <div class="summary-icon blue"><AppIcon name="wallet" /></div>
        <div>
          <p>Total Pengeluaran</p>
          <h2>{{ formatCurrency(totalExpense) }}</h2>
        </div>
      </div>
      <div class="summary-item">
        <div class="summary-icon orange"><AppIcon name="hourglass" /></div>
        <div>
          <p>Tanpa Bukti</p>
          <h2>{{ formatCurrency(unverified) }}</h2>
        </div>
      </div>
      <div class="summary-item">
        <div class="summary-icon green"><AppIcon name="check-circle" /></div>
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

    <!-- Pemesanan Tiket & Penginapan -->
    <section v-if="selectedTrip" class="booking-card">
      <div class="booking-header">
        <div>
          <h2>Pemesanan Tiket &amp; Penginapan</h2>
          <p>Ajukan pemesanan untuk perjalanan ini. Admin akan mengonfirmasi dan memberi kode booking.</p>
        </div>
        <button class="add-button" type="button" @click="toggleBookingForm">
          {{ showBookingForm ? 'Tutup Form' : '+ Ajukan Pemesanan' }}
        </button>
      </div>

      <p v-if="bookingError" class="data-error" role="alert">{{ bookingError }}</p>
      <p v-if="bookingMessage" class="data-success" role="status">{{ bookingMessage }}</p>

      <div v-if="showBookingForm" class="booking-form">
        <div class="form-grid">
          <div class="filter-group">
            <label>Jenis Pemesanan</label>
            <select v-model="bookingForm.jenis" :disabled="bookingSubmitting">
              <option value="tiket_pesawat">Tiket Pesawat</option>
              <option value="tiket_kereta">Tiket Kereta</option>
              <option value="hotel">Hotel / Penginapan</option>
              <option value="transport_lokal">Transport Lokal</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>
          <div class="filter-group">
            <label>Tanggal Layanan</label>
            <input
              v-model="bookingForm.tanggal"
              type="date"
              :min="selectedTrip.tanggal_berangkat"
              :max="selectedTrip.tanggal_pulang"
              :disabled="bookingSubmitting"
            />
          </div>
          <div class="filter-group">
            <label>Vendor (Direktori)</label>
            <select v-model="bookingForm.vendor_id" :disabled="bookingSubmitting">
              <option :value="null">— Pilih / isi manual —</option>
              <option v-for="vendor in vendors" :key="vendor.id" :value="vendor.id">
                {{ vendor.nama }}
              </option>
            </select>
          </div>
          <div class="filter-group">
            <label>Vendor Manual</label>
            <input
              v-model="bookingForm.vendor"
              type="text"
              placeholder="Isi bila tidak ada di direktori"
              :disabled="bookingSubmitting || bookingForm.vendor_id !== null"
            />
          </div>
          <div class="filter-group">
            <label>Harga (Rp)</label>
            <input v-model.number="bookingForm.harga" type="number" min="0" step="1000" placeholder="0" :disabled="bookingSubmitting" />
          </div>
          <div class="filter-group full">
            <label>Catatan</label>
            <input v-model="bookingForm.catatan" type="text" placeholder="Contoh: butuh bagasi 20kg (opsional)" :disabled="bookingSubmitting" />
          </div>
        </div>
        <div class="form-actions">
          <button class="cancel-button" type="button" :disabled="bookingSubmitting" @click="showBookingForm = false">Batal</button>
          <button class="submit-button" type="button" :disabled="bookingSubmitting || !selectedTripId" @click="handleBookingCreate">
            {{ bookingSubmitting ? 'Menyimpan...' : (editingBookingId !== null ? 'Simpan Perubahan' : 'Kirim Pengajuan') }}
          </button>
        </div>
      </div>

      <div v-if="bookingsLoading" class="table-state">Memuat pemesanan...</div>
      <p v-else-if="tripBookings.length === 0" class="empty-text">Belum ada pemesanan untuk perjalanan ini.</p>
      <ul v-else class="booking-list">
        <li v-for="booking in tripBookings" :key="booking.id" class="booking-item">
          <div class="booking-info">
            <strong>{{ booking.jenis_label }}</strong>
            <span>{{ booking.vendor_name || '—' }}{{ booking.kode_booking ? ` · ${booking.kode_booking}` : '' }}</span>
            <span>{{ formatDate(booking.tanggal) }} · {{ formatCurrency(booking.harga) }}</span>
          </div>
          <span class="status-badge" :class="`book-${booking.status}`">{{ booking.status_label }}</span>
          <button
            v-if="booking.status === 'dipesan' || booking.status === 'dikonfirmasi'"
            type="button"
            class="text-button"
            :disabled="bookingSubmitting"
            @click="openBookingEdit(booking)"
          >
            Ubah
          </button>
          <button
            v-if="booking.status === 'dipesan'"
            type="button"
            class="text-danger"
            :disabled="cancellingBookingId === booking.id"
            @click="handleBookingCancel(booking.id)"
          >
            Batalkan
          </button>
        </li>
      </ul>
    </section>

    <!-- Ajukan Lagi -->
    <section v-if="selectedTrip" class="booking-card">
      <div class="booking-header">
        <div>
          <h2>Ajukan Lagi Perjalanan Ini</h2>
          <p>Salin tujuan, keperluan, estimasi, dan kebutuhan sebagai draft baru. Pengeluaran tidak ikut disalin.</p>
        </div>
        <button class="add-button" type="button" @click="showDuplicateForm = !showDuplicateForm">
          {{ showDuplicateForm ? 'Tutup Form' : 'Ajukan Lagi' }}
        </button>
      </div>

      <p v-if="duplicateError" class="data-error" role="alert">{{ duplicateError }}</p>
      <p v-if="duplicateMessage" class="data-success" role="status">{{ duplicateMessage }}</p>

      <div v-if="showDuplicateForm" class="booking-form">
        <div class="form-grid">
          <div class="filter-group">
            <label>Tanggal Berangkat Baru</label>
            <input v-model="duplicateForm.tanggal_berangkat" type="date" :min="today()" :disabled="duplicating" />
          </div>
          <div class="filter-group">
            <label>Tanggal Kembali Baru</label>
            <input v-model="duplicateForm.tanggal_pulang" type="date" :min="duplicateForm.tanggal_berangkat || today()" :disabled="duplicating" />
          </div>
        </div>
        <div class="form-actions">
          <button class="cancel-button" type="button" :disabled="duplicating" @click="showDuplicateForm = false">Batal</button>
          <button class="submit-button" type="button" :disabled="duplicating || !selectedTripId" @click="handleDuplicate">
            {{ duplicating ? 'Menyalin...' : 'Buat Draft Salinan' }}
          </button>
        </div>
      </div>
    </section>

    <!-- Dokumen Resmi -->
    <section v-if="selectedTrip && canPrintDocs" class="booking-card">
      <div class="booking-header">
        <div>
          <h2>Dokumen Resmi</h2>
          <p>Unduh Surat Perintah Tugas dan Surat Perjalanan Dinas perjalanan ini.</p>
        </div>
        <div class="doc-actions">
          <button type="button" class="add-button" :disabled="printingDoc" @click="printDoc('spt')">
            {{ printingDoc ? '...' : 'Cetak SPT' }}
          </button>
          <button type="button" class="add-button" :disabled="printingDoc" @click="printDoc('spd')">
            {{ printingDoc ? '...' : 'Cetak SPD' }}
          </button>
          <button type="button" class="add-button outline" :disabled="printingDoc" @click="saveCalendar">
            {{ printingDoc ? '...' : 'Kalender' }}
          </button>
        </div>
      </div>
      <p v-if="docError" class="data-error" role="alert">{{ docError }}</p>
    </section>

    <!-- Diskusi -->
    <TripComments v-if="selectedTripId" :trip-id="selectedTripId" />

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
          <AppIcon name="search" />
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
import type { Booking, BookingJenis, ExpenseType, Payment } from '~/types/api'
import { useTrips } from '~/composables/useTrips'
import { useBookings } from '~/composables/useBookings'
import { useVendors } from '~/composables/useVendors'
import { useExpenses } from '~/composables/useExpenses'
import { usePayments } from '~/composables/usePayments'
import { apiErrorMessage } from '~/composables/useApi'
import { expenseTypeLabel, formatCurrency, formatDate, tripStatusLabel } from '~/utils/format'

const { trips, loading: tripsLoading, error: tripsError, fetchTrips, duplicateTrip, downloadDocument, downloadCalendar } = useTrips()
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

const {
  bookings: tripBookings,
  loading: bookingsLoading,
  fetchBookings,
  createBooking,
  updateBooking,
  deleteBooking,
} = useBookings()

const { vendors, fetchVendors } = useVendors()

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

const showBookingForm = ref(false)
const bookingSubmitting = ref(false)
const bookingError = ref('')
const bookingMessage = ref('')
const cancellingBookingId = ref<number | null>(null)
const editingBookingId = ref<number | null>(null)

const showDuplicateForm = ref(false)
const duplicating = ref(false)
const duplicateError = ref('')
const duplicateMessage = ref('')

const duplicateForm = reactive({
  tanggal_berangkat: '',
  tanggal_pulang: '',
})

const printingDoc = ref(false)
const docError = ref('')

const canPrintDocs = computed(() =>
  !!selectedTrip.value && ['disetujui', 'berjalan', 'selesai', 'lengkap'].includes(selectedTrip.value.status),
)

const printDoc = async (kind: 'spt' | 'spd') => {
  if (!selectedTripId.value || printingDoc.value) return

  printingDoc.value = true
  docError.value = ''

  try {
    await downloadDocument(selectedTripId.value, kind)
  } catch (err) {
    docError.value = apiErrorMessage(err, 'Gagal mengunduh dokumen.')
  } finally {
    printingDoc.value = false
  }
}

const saveCalendar = async () => {
  if (!selectedTripId.value || printingDoc.value) return

  printingDoc.value = true
  docError.value = ''

  try {
    await downloadCalendar(selectedTripId.value)
  } catch (err) {
    docError.value = apiErrorMessage(err, 'Gagal mengunduh kalender.')
  } finally {
    printingDoc.value = false
  }
}

const bookingForm = reactive({
  jenis: 'tiket_pesawat' as BookingJenis,
  tanggal: '',
  vendor_id: null as number | null,
  vendor: '',
  harga: '' as number | '',
  catatan: '',
})

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

const bookingStatusNote = computed(() => {
  if (!selectedTrip.value) return ''
  return `Tanggal layanan harus dalam rentang ${formatDate(selectedTrip.value.tanggal_berangkat)} – ${formatDate(selectedTrip.value.tanggal_pulang)}.`
})

const loadBookings = async () => {
  if (!selectedTripId.value) {
    tripBookings.value = []
    return
  }

  try {
    await fetchBookings({ trip_id: selectedTripId.value, per_page: 100 })
  } catch {
    // pesan error sudah disimpan oleh composable
  }
}

const toggleBookingForm = () => {
  bookingError.value = ''
  bookingMessage.value = ''
  editingBookingId.value = null
  bookingForm.vendor_id = null
  showBookingForm.value = !showBookingForm.value

  if (showBookingForm.value && !bookingForm.tanggal && selectedTrip.value) {
    bookingForm.tanggal = selectedTrip.value.tanggal_berangkat
  }
}

const openBookingEdit = (booking: Booking) => {
  bookingError.value = ''
  bookingMessage.value = ''
  editingBookingId.value = booking.id
  bookingForm.jenis = booking.jenis
  bookingForm.tanggal = booking.tanggal
  bookingForm.vendor_id = booking.vendor_id
  bookingForm.vendor = booking.vendor ?? ''
  bookingForm.harga = Number(booking.harga)
  bookingForm.catatan = booking.catatan ?? ''
  showBookingForm.value = true
}

const handleBookingCreate = async () => {
  bookingError.value = ''
  bookingMessage.value = ''

  if (!selectedTripId.value || !selectedTrip.value) {
    bookingError.value = 'Pilih perjalanan terlebih dahulu.'
    return
  }

  const harga = Number(bookingForm.harga)

  if (!bookingForm.tanggal) {
    bookingError.value = 'Tanggal layanan wajib diisi.'
    return
  }

  if (
    bookingForm.tanggal < selectedTrip.value.tanggal_berangkat
    || bookingForm.tanggal > selectedTrip.value.tanggal_pulang
  ) {
    bookingError.value = bookingStatusNote.value
    return
  }

  if (!Number.isFinite(harga) || harga < 0) {
    bookingError.value = 'Harga wajib diisi dengan benar.'
    return
  }

  bookingSubmitting.value = true

  try {
    if (editingBookingId.value !== null) {
      await updateBooking(editingBookingId.value, {
        jenis: bookingForm.jenis,
        tanggal: bookingForm.tanggal,
        vendor_id: bookingForm.vendor_id,
        vendor: bookingForm.vendor_id !== null ? null : (bookingForm.vendor.trim() || null),
        harga,
        catatan: bookingForm.catatan.trim() || null,
      })
      bookingMessage.value = 'Pemesanan berhasil diubah.'
    } else {
      await createBooking(selectedTripId.value, {
        jenis: bookingForm.jenis,
        tanggal: bookingForm.tanggal,
        vendor_id: bookingForm.vendor_id,
        vendor: bookingForm.vendor_id !== null ? null : (bookingForm.vendor.trim() || null),
        harga,
        catatan: bookingForm.catatan.trim() || null,
      })
      bookingMessage.value = 'Pengajuan pemesanan terkirim. Admin akan mengonfirmasi.'
    }

    bookingForm.vendor_id = null
    bookingForm.vendor = ''
    bookingForm.harga = ''
    bookingForm.catatan = ''
    editingBookingId.value = null
    showBookingForm.value = false
    await loadBookings()
  } catch (err) {
    bookingError.value = apiErrorMessage(err, 'Gagal menyimpan pemesanan.')
  } finally {
    bookingSubmitting.value = false
  }
}

const handleBookingCancel = async (id: number) => {
  if (!window.confirm('Batalkan pemesanan ini?')) return

  bookingError.value = ''
  bookingMessage.value = ''
  cancellingBookingId.value = id

  try {
    await deleteBooking(id)
    bookingMessage.value = 'Pemesanan dibatalkan.'
    await loadBookings()
  } catch (err) {
    bookingError.value = apiErrorMessage(err, 'Gagal membatalkan pemesanan.')
  } finally {
    cancellingBookingId.value = null
  }
}

const handleDuplicate = async () => {
  duplicateError.value = ''
  duplicateMessage.value = ''

  if (!selectedTripId.value) {
    duplicateError.value = 'Pilih perjalanan terlebih dahulu.'
    return
  }

  if (!duplicateForm.tanggal_berangkat || !duplicateForm.tanggal_pulang) {
    duplicateError.value = 'Tanggal berangkat dan kembali wajib diisi.'
    return
  }

  if (duplicateForm.tanggal_pulang < duplicateForm.tanggal_berangkat) {
    duplicateError.value = 'Tanggal kembali tidak boleh sebelum tanggal berangkat.'
    return
  }

  duplicating.value = true

  try {
    const copy = await duplicateTrip(selectedTripId.value, {
      tanggal_berangkat: duplicateForm.tanggal_berangkat,
      tanggal_pulang: duplicateForm.tanggal_pulang,
    })

    duplicateMessage.value = `Draft salinan dibuat (TRV-${copy.id}). Lengkapi lalu ajukan dari menu Rencana.`
    duplicateForm.tanggal_berangkat = ''
    duplicateForm.tanggal_pulang = ''
    showDuplicateForm.value = false
    await fetchTrips({ page: 1 })
  } catch (err) {
    duplicateError.value = apiErrorMessage(err, 'Gagal membuat salinan.')
  } finally {
    duplicating.value = false
  }
}

watch(selectedTripId, () => {
  formError.value = ''
  formMessage.value = ''
  paymentError.value = ''
  paymentMessage.value = ''
  bookingError.value = ''
  bookingMessage.value = ''
  showBookingForm.value = false
  duplicateError.value = ''
  duplicateMessage.value = ''
  showDuplicateForm.value = false
  loadExpenses().catch(() => {})
  loadPayment()
  loadBookings()
  fetchVendors().catch(() => {})
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
.add-button.outline { background: var(--white); color: var(--primary); }
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
.book-dipesan { background: #fff3df; color: #b45309; }
.book-dikonfirmasi { background: #e9f0ff; color: #1d4ed8; }
.book-selesai { background: #dff7ef; color: #18a77c; }
.book-dibatalkan { background: #fee2e2; color: #b42318; }

.booking-card { padding: 16px 18px; margin-bottom: 20px; background: var(--white); border: 1px solid var(--border); border-radius: 10px; }
.booking-header { display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 12px; }
.booking-header h2 { margin: 0 0 4px; font-size: 13px; font-weight: 700; color: var(--text); }
.booking-header p { margin: 0; font-size: 11px; line-height: 1.5; color: var(--text-muted); }
.doc-actions { display: flex; flex-wrap: wrap; gap: 8px; }
.booking-form { margin-bottom: 14px; padding-top: 14px; border-top: 1px solid #edf0f4; }
.booking-list { display: flex; flex-direction: column; margin: 0; padding: 0; list-style: none; }
.booking-item { display: flex; align-items: center; flex-wrap: wrap; gap: 8px 12px; padding: 10px 0; border-bottom: 1px solid #edf0f4; }
.booking-item:last-child { padding-bottom: 0; border-bottom: none; }
.booking-info { flex: 1; min-width: 180px; display: flex; flex-direction: column; gap: 2px; }
.booking-info strong { color: var(--text); font-size: 11px; }
.booking-info span { color: var(--text-muted); font-size: 10px; }
.empty-text { padding: 12px 0; color: #9aa4b5; font-size: 11px; }
.form-grid .filter-group.full { grid-column: 1 / -1; }

/* FILTER CARD */
.filter-card { display: grid; grid-template-columns: minmax(190px, 0.8fr) minmax(240px, 1fr) 160px 160px; gap: 14px; padding: 16px; margin-bottom: 24px; background: var(--white); border: 1px solid var(--border); border-radius: 10px; }
.filter-group { display: flex; flex-direction: column; gap: 6px; }
.filter-group label { font-size: 9px; font-weight: 600; color: #667085; }
.search-input, .date-input { height: 31px; display: flex; align-items: center; border: 1px solid #dce2eb; border-radius: 6px; background: var(--white); }
.search-input svg, .date-input svg { width: 14px; height: 14px; margin: 0 8px; color: #718096; flex-shrink: 0; }
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
.text-button { padding: 0; border: 0; background: transparent; color: #1769ff; font-family: inherit; font-size: 9px; font-weight: 600; cursor: pointer; }
.text-button:disabled { cursor: not-allowed; opacity: 0.6; }
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