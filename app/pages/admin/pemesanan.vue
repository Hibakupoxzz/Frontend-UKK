<template>
  <div class="booking-page">
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <NuxtLink to="/dashboard">Dashboard</NuxtLink>
      <AppIcon name="chevron-right" class="crumb-sep" />
      <NuxtLink to="/admin/perjalanan-dinas">Perjalanan Dinas</NuxtLink>
      <AppIcon name="chevron-right" class="crumb-sep" />
      <strong>Pemesanan</strong>
    </div>

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1>Pemesanan Tiket &amp; Penginapan</h1>
        <p>Pemesanan dicatat manual oleh admin atau pemilik perjalanan, bukan hasil pencarian vendor.</p>
      </div>

      <LayoutPageactions />
    </div>

    <div v-if="listError" class="state-banner error-banner" role="alert">
      <span>{{ listError }}</span>
      <button type="button" :disabled="loading" @click="reload">Coba Lagi</button>
    </div>

    <!-- Summary -->
    <div class="summary-grid">
      <div class="summary-card">
        <p>Total Pemesanan</p>
        <h2>{{ meta?.total ?? bookings.length }}</h2>
      </div>
      <div class="summary-card">
        <p>Menunggu Konfirmasi</p>
        <h2>{{ countByStatus('dipesan') }}</h2>
      </div>
      <div class="summary-card">
        <p>Total Nilai</p>
        <h2>{{ formatCurrency(totalHarga) }}</h2>
      </div>
    </div>

    <!-- Filter -->
    <div class="filter-card">
      <div class="filter-group">
        <label for="filter-jenis">Jenis</label>
        <select id="filter-jenis" v-model="filterJenis">
          <option value="">Semua Jenis</option>
          <option value="tiket_pesawat">Tiket Pesawat</option>
          <option value="tiket_kereta">Tiket Kereta</option>
          <option value="hotel">Hotel / Penginapan</option>
          <option value="transport_lokal">Transport Lokal</option>
          <option value="lainnya">Lainnya</option>
        </select>
      </div>

      <div class="filter-group">
        <label for="filter-status">Status</label>
        <select id="filter-status" v-model="filterStatus">
          <option value="">Semua Status</option>
          <option value="dipesan">Dipesan</option>
          <option value="dikonfirmasi">Dikonfirmasi</option>
          <option value="selesai">Selesai</option>
          <option value="dibatalkan">Dibatalkan</option>
        </select>
      </div>

      <button type="button" class="primary-button" @click="showForm = !showForm">
        {{ showForm ? 'Tutup Form' : '+ Tambah Pemesanan' }}
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
      <h2>Tambah Pemesanan</h2>

      <p v-if="formError" class="form-message error" role="alert">{{ formError }}</p>
      <p v-if="formMessage" class="form-message success" role="status">{{ formMessage }}</p>

      <form @submit.prevent="handleCreate">
        <div class="form-grid">
          <div class="form-group full">
            <label for="booking-trip">Perjalanan Dinas</label>
            <select id="booking-trip" v-model="form.trip_id" :disabled="saving || tripsLoading" required>
              <option value="">— Pilih perjalanan —</option>
              <option v-for="trip in tripOptions" :key="trip.id" :value="trip.id">
                TRV-{{ trip.id }} · {{ trip.tujuan }} ({{ tripStatusLabel(trip.status) }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="booking-jenis">Jenis</label>
            <select id="booking-jenis" v-model="form.jenis" :disabled="saving" required>
              <option value="tiket_pesawat">Tiket Pesawat</option>
              <option value="tiket_kereta">Tiket Kereta</option>
              <option value="hotel">Hotel / Penginapan</option>
              <option value="transport_lokal">Transport Lokal</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>

          <div class="form-group">
            <label for="booking-tanggal">Tanggal Layanan</label>
            <input id="booking-tanggal" v-model="form.tanggal" type="date" :disabled="saving" required />
          </div>

          <div class="form-group">
            <label for="booking-vendor">Vendor (Direktori)</label>
            <select id="booking-vendor" v-model="form.vendor_id" :disabled="saving">
              <option :value="null">— Pilih vendor / isi manual —</option>
              <option v-for="vendor in vendorOptions" :key="vendor.id" :value="vendor.id">
                {{ vendor.nama }}{{ vendor.harga_acuan !== null ? ` · acuan ${formatCurrency(vendor.harga_acuan)}` : '' }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="booking-vendor-manual">Vendor Manual</label>
            <input
              id="booking-vendor-manual"
              v-model="form.vendor"
              type="text"
              placeholder="Isi bila tidak ada di direktori"
              :disabled="saving || form.vendor_id !== null"
            />
          </div>

          <div class="form-group">
            <label for="booking-kode">Kode Booking</label>
            <input id="booking-kode" v-model="form.kode_booking" type="text" placeholder="Opsional" :disabled="saving" />
          </div>

          <div class="form-group">
            <label for="booking-harga">Harga (Rp)</label>
            <input id="booking-harga" v-model.number="form.harga" type="number" min="0" step="1000" placeholder="0" :disabled="saving" required />
          </div>

          <div class="form-group">
            <label for="booking-catatan">Catatan</label>
            <input id="booking-catatan" v-model="form.catatan" type="text" placeholder="Opsional" :disabled="saving" />
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="primary-button" :disabled="saving">
            {{ saving ? 'Menyimpan...' : 'Simpan Pemesanan' }}
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
              <th>Kode</th>
              <th>Jenis</th>
              <th>Perjalanan</th>
              <th>Vendor</th>
              <th>Tanggal</th>
              <th>Harga</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && bookings.length === 0">
              <td colspan="8" class="table-state">Memuat data pemesanan...</td>
            </tr>
            <tr v-else-if="bookings.length === 0">
              <td colspan="8" class="table-state">Belum ada pemesanan yang sesuai filter.</td>
            </tr>
            <tr v-for="booking in bookings" :key="booking.id">
              <td>{{ booking.kode_booking || '—' }}</td>
              <td>{{ booking.jenis_label }}</td>
              <td>
                <NuxtLink
                  :to="{ path: '/admin/DetailPerjalanan', query: { id: booking.trip_id } }"
                  class="destination"
                >
                  {{ booking.trip?.tujuan ?? `TRV-${booking.trip_id}` }}
                </NuxtLink>
                <span class="trip-owner">{{ booking.trip?.user?.name ?? '' }}</span>
              </td>
              <td>{{ booking.vendor_name || '—' }}</td>
              <td>{{ formatDate(booking.tanggal) }}</td>
              <td>{{ formatCurrency(booking.harga) }}</td>
              <td>
                <span class="status-badge" :class="statusClass(booking.status)">
                  {{ booking.status_label }}
                </span>
              </td>
              <td>
                <div class="row-actions">
                  <button
                    type="button"
                    class="text-button"
                    :disabled="rowSaving === booking.id"
                    @click="openEdit(booking)"
                  >
                    Edit
                  </button>
                  <select
                    :value="booking.status"
                    :disabled="rowSaving === booking.id"
                    aria-label="Ubah status pemesanan"
                    @change="handleStatusChange(booking.id, ($event.target as HTMLSelectElement).value)"
                  >
                    <option value="dipesan">Dipesan</option>
                    <option value="dikonfirmasi">Dikonfirmasi</option>
                    <option value="selesai">Selesai</option>
                    <option value="dibatalkan">Dibatalkan</option>
                  </select>
                  <button
                    type="button"
                    class="text-danger"
                    :disabled="rowSaving === booking.id"
                    @click="handleDelete(booking.id)"
                  >
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="table-footer">
        <span class="showing-text">
          Menampilkan {{ bookings.length }} dari {{ meta?.total ?? bookings.length }} pemesanan
        </span>

        <div v-if="(meta?.last_page ?? 1) > 1" class="pagination">
          <button
            v-for="pageNumber in meta?.last_page ?? 1"
            :key="pageNumber"
            class="page-button"
            :class="{ active: pageNumber === page }"
            type="button"
            @click="changePage(pageNumber)"
          >
            {{ pageNumber }}
          </button>
        </div>
      </div>
    </div>

    <!-- Direktori Vendor -->
    <section class="table-card vendor-card">
      <div class="section-header">
        <div>
          <h2>Direktori Vendor</h2>
          <p>Maskapai, hotel, dan transport langganan beserta harga acuan untuk perbandingan.</p>
        </div>
        <button type="button" class="primary-button" @click="showVendorForm = !showVendorForm">
          {{ showVendorForm ? 'Tutup Form' : '+ Tambah Vendor' }}
        </button>
      </div>

      <p v-if="vendorError" class="form-message error" role="alert">{{ vendorError }}</p>
      <p v-if="vendorMessage" class="form-message success" role="status">{{ vendorMessage }}</p>

      <form v-if="showVendorForm" class="vendor-form" @submit.prevent="handleVendorCreate">
        <div class="form-grid">
          <div class="form-group">
            <label for="vendor-nama">Nama Vendor</label>
            <input id="vendor-nama" v-model="vendorForm.nama" type="text" placeholder="Contoh: Garuda Indonesia" :disabled="vendorSaving" required />
          </div>

          <div class="form-group">
            <label for="vendor-jenis">Jenis</label>
            <select id="vendor-jenis" v-model="vendorForm.jenis" :disabled="vendorSaving" required>
              <option value="maskapai">Maskapai</option>
              <option value="kereta">Kereta</option>
              <option value="hotel">Hotel</option>
              <option value="transport">Transport</option>
              <option value="lainnya">Lainnya</option>
            </select>
          </div>

          <div class="form-group">
            <label for="vendor-kontak">Kontak</label>
            <input id="vendor-kontak" v-model="vendorForm.kontak" type="text" placeholder="Opsional" :disabled="vendorSaving" />
          </div>

          <div class="form-group">
            <label for="vendor-kota">Kota</label>
            <input id="vendor-kota" v-model="vendorForm.kota" type="text" placeholder="Opsional" :disabled="vendorSaving" />
          </div>

          <div class="form-group full">
            <label for="vendor-harga">Harga Acuan (Rp)</label>
            <input id="vendor-harga" v-model.number="vendorForm.harga_acuan" type="number" min="0" step="1000" placeholder="Opsional, untuk perbandingan" :disabled="vendorSaving" />
          </div>
        </div>

        <div class="form-actions">
          <button type="submit" class="primary-button" :disabled="vendorSaving">
            {{ vendorSaving ? 'Menyimpan...' : 'Simpan Vendor' }}
          </button>
        </div>
      </form>

      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Nama</th>
              <th>Jenis</th>
              <th>Kontak / Kota</th>
              <th>Harga Acuan</th>
              <th>Status</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="vendorsLoading && vendors.length === 0">
              <td colspan="6" class="table-state">Memuat direktori vendor...</td>
            </tr>
            <tr v-else-if="vendors.length === 0">
              <td colspan="6" class="table-state">Belum ada vendor. Tambahkan langganan maskapai, hotel, atau transport.</td>
            </tr>
            <tr v-for="vendor in vendors" :key="vendor.id">
              <td>{{ vendor.nama }}</td>
              <td>{{ vendorJenisLabel(vendor.jenis) }}</td>
              <td>{{ vendor.kontak || '—' }}{{ vendor.kota ? ` · ${vendor.kota}` : '' }}</td>
              <td>{{ vendor.harga_acuan === null ? '—' : formatCurrency(vendor.harga_acuan) }}</td>
              <td>
                <span class="status-badge" :class="vendor.is_active ? 'completed' : 'draft'">
                  {{ vendor.is_active ? 'Aktif' : 'Nonaktif' }}
                </span>
              </td>
              <td>
                <div class="row-actions">
                  <button type="button" class="text-button" :disabled="vendorSaving" @click="handleVendorToggle(vendor)">
                    {{ vendor.is_active ? 'Nonaktifkan' : 'Aktifkan' }}
                  </button>
                  <button type="button" class="text-danger" :disabled="vendorSaving" @click="handleVendorDelete(vendor.id)">
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Edit Modal -->
    <div v-if="editingId !== null" class="modal-backdrop" @click.self="closeEdit">
      <div class="modal-card" role="dialog" aria-modal="true" aria-label="Ubah pemesanan">
        <div class="modal-header">
          <h2>Ubah Pemesanan</h2>
          <button class="close-button" type="button" aria-label="Tutup" @click="closeEdit"><AppIcon name="x" /></button>
        </div>

        <form @submit.prevent="handleEditSave">
          <p v-if="editError" class="form-message error" role="alert">{{ editError }}</p>

          <div class="form-grid">
            <div class="form-group">
              <label for="edit-jenis">Jenis</label>
              <select id="edit-jenis" v-model="editForm.jenis" :disabled="editSaving">
                <option value="tiket_pesawat">Tiket Pesawat</option>
                <option value="tiket_kereta">Tiket Kereta</option>
                <option value="hotel">Hotel / Penginapan</option>
                <option value="transport_lokal">Transport Lokal</option>
                <option value="lainnya">Lainnya</option>
              </select>
            </div>

            <div class="form-group">
              <label for="edit-tanggal">Tanggal Layanan</label>
              <input id="edit-tanggal" v-model="editForm.tanggal" type="date" :disabled="editSaving" required />
            </div>

            <div class="form-group">
              <label for="edit-vendor">Vendor (Direktori)</label>
              <select id="edit-vendor" v-model="editForm.vendor_id" :disabled="editSaving">
                <option :value="null">— Pilih vendor / isi manual —</option>
                <option v-for="vendor in vendorOptions" :key="vendor.id" :value="vendor.id">
                  {{ vendor.nama }}
                </option>
              </select>
            </div>

            <div class="form-group">
              <label for="edit-vendor-manual">Vendor Manual</label>
              <input
                id="edit-vendor-manual"
                v-model="editForm.vendor"
                type="text"
                :disabled="editSaving || editForm.vendor_id !== null"
              />
            </div>

            <div class="form-group">
              <label for="edit-kode">Kode Booking</label>
              <input id="edit-kode" v-model="editForm.kode_booking" type="text" :disabled="editSaving" />
            </div>

            <div class="form-group">
              <label for="edit-harga">Harga (Rp)</label>
              <input id="edit-harga" v-model.number="editForm.harga" type="number" min="0" step="1000" :disabled="editSaving" required />
            </div>

            <div class="form-group">
              <label for="edit-catatan">Catatan</label>
              <input id="edit-catatan" v-model="editForm.catatan" type="text" :disabled="editSaving" />
            </div>
          </div>

          <div class="form-actions">
            <button class="ghost-button" type="button" :disabled="editSaving" @click="closeEdit">Batal</button>
            <button class="primary-button" type="submit" :disabled="editSaving">
              {{ editSaving ? 'Menyimpan...' : 'Simpan Perubahan' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch } from 'vue'
import type { Booking, BookingJenis, BookingStatus, TripQuery, Vendor, VendorJenis } from '~/types/api'
import { useBookings } from '~/composables/useBookings'
import { useReports } from '~/composables/useReports'
import { useTrips } from '~/composables/useTrips'
import { useVendors } from '~/composables/useVendors'
import { apiErrorMessage } from '~/composables/useApi'
import { formatCurrency, formatDate, tripStatusLabel } from '~/utils/format'

const {
  bookings,
  meta,
  loading,
  error: listError,
  fetchBookings,
  createBooking,
  updateBooking,
  deleteBooking,
} = useBookings()

const { trips, loading: tripsLoading, fetchTrips } = useTrips()
const { downloadReport } = useReports()
const {
  vendors,
  loading: vendorsLoading,
  fetchVendors,
  createVendor,
  updateVendor,
  deleteVendor,
} = useVendors()

const vendorOptions = computed(() => vendors.value)

const showVendorForm = ref(false)
const vendorSaving = ref(false)
const vendorError = ref('')
const vendorMessage = ref('')

const vendorForm = reactive({
  nama: '',
  jenis: 'hotel' as VendorJenis,
  kontak: '',
  kota: '',
  harga_acuan: '' as number | '',
})

const vendorJenisLabel = (jenis: string) => {
  switch (jenis) {
    case 'maskapai':
      return 'Maskapai'
    case 'kereta':
      return 'Kereta'
    case 'hotel':
      return 'Hotel'
    case 'transport':
      return 'Transport'
    default:
      return 'Lainnya'
  }
}

const handleVendorCreate = async () => {
  vendorError.value = ''
  vendorMessage.value = ''

  if (!vendorForm.nama.trim()) {
    vendorError.value = 'Nama vendor wajib diisi.'
    return
  }

  const hargaAcuan = vendorForm.harga_acuan === '' ? null : Number(vendorForm.harga_acuan)

  if (hargaAcuan !== null && (!Number.isFinite(hargaAcuan) || hargaAcuan < 0)) {
    vendorError.value = 'Harga acuan tidak valid.'
    return
  }

  vendorSaving.value = true

  try {
    await createVendor({
      nama: vendorForm.nama.trim(),
      jenis: vendorForm.jenis,
      kontak: vendorForm.kontak.trim() || null,
      kota: vendorForm.kota.trim() || null,
      harga_acuan: hargaAcuan,
    })

    vendorForm.nama = ''
    vendorForm.kontak = ''
    vendorForm.kota = ''
    vendorForm.harga_acuan = ''
    showVendorForm.value = false
    vendorMessage.value = 'Vendor berhasil ditambahkan.'
    await fetchVendors().catch(() => {})
  } catch (err) {
    vendorError.value = apiErrorMessage(err, 'Gagal menambah vendor.')
  } finally {
    vendorSaving.value = false
  }
}

const handleVendorToggle = async (vendor: Vendor) => {
  vendorError.value = ''
  vendorMessage.value = ''
  vendorSaving.value = true

  try {
    await updateVendor(vendor.id, {
      nama: vendor.nama,
      jenis: vendor.jenis,
      is_active: !vendor.is_active,
    })
    await fetchVendors().catch(() => {})
  } catch (err) {
    vendorError.value = apiErrorMessage(err, 'Gagal mengubah status vendor.')
  } finally {
    vendorSaving.value = false
  }
}

const handleVendorDelete = async (id: number) => {
  if (!window.confirm('Hapus vendor ini?')) return

  vendorError.value = ''
  vendorMessage.value = ''

  try {
    await deleteVendor(id)
    vendorMessage.value = 'Vendor dihapus.'
    await fetchVendors().catch(() => {})
  } catch (err) {
    vendorError.value = apiErrorMessage(err, 'Gagal menghapus vendor.')
  } finally {
    vendorSaving.value = false
  }
}

const page = ref(1)
const filterJenis = ref<BookingJenis | ''>('')
const filterStatus = ref<BookingStatus | ''>('')
const showForm = ref(false)
const saving = ref(false)
const formError = ref('')
const formMessage = ref('')
const rowSaving = ref<number | null>(null)
const exporting = ref(false)
const exportError = ref('')

const form = reactive({
  trip_id: '' as number | '',
  jenis: 'tiket_pesawat' as BookingJenis,
  vendor_id: null as number | null,
  vendor: '',
  kode_booking: '',
  tanggal: '',
  harga: '' as number | '',
  catatan: '',
})

const tripOptions = computed(() => trips.value)

const totalHarga = computed(() => bookings.value.reduce((sum, booking) => sum + Number(booking.harga || 0), 0))

const countByStatus = (status: BookingStatus) =>
  bookings.value.filter((booking) => booking.status === status).length

const statusClass = (status: BookingStatus) => {
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

const currentFilters = () => ({
  jenis: filterJenis.value || undefined,
  status: filterStatus.value || undefined,
})

const reload = async () => {
  page.value = 1
  await fetchBookings({ page: 1, ...currentFilters() }).catch(() => {})
}

watch([filterJenis, filterStatus], () => {
  void reload()
})

const changePage = async (value: number) => {
  const lastPage = meta.value?.last_page ?? 1
  if (value < 1 || value > lastPage || value === page.value) return
  page.value = value
  await fetchBookings({ page: value, ...currentFilters() }).catch(() => {})
}

const handleExport = async (format: 'pdf' | 'xlsx') => {
  exportError.value = ''
  exporting.value = true

  try {
    await downloadReport('bookings', format, currentFilters() as TripQuery)
  } catch (err) {
    exportError.value = apiErrorMessage(err, 'Gagal mengunduh laporan pemesanan.')
  } finally {
    exporting.value = false
  }
}

const handleCreate = async () => {
  formError.value = ''
  formMessage.value = ''

  if (form.trip_id === '') {
    formError.value = 'Pilih perjalanan dinas terlebih dahulu.'
    return
  }

  const harga = Number(form.harga)

  if (!form.tanggal || !Number.isFinite(harga) || harga < 0) {
    formError.value = 'Tanggal dan harga wajib diisi dengan benar.'
    return
  }

  saving.value = true

  try {
    await createBooking(form.trip_id, {
      jenis: form.jenis,
      vendor_id: form.vendor_id,
      vendor: form.vendor_id !== null ? null : (form.vendor.trim() || null),
      kode_booking: form.kode_booking.trim() || null,
      tanggal: form.tanggal,
      harga,
      catatan: form.catatan.trim() || null,
    })

    form.trip_id = ''
    form.vendor_id = null
    form.vendor = ''
    form.kode_booking = ''
    form.tanggal = ''
    form.harga = ''
    form.catatan = ''
    formMessage.value = 'Pemesanan berhasil ditambahkan.'
    await reload()
  } catch (err) {
    formError.value = apiErrorMessage(err, 'Gagal menambah pemesanan.')
  } finally {
    saving.value = false
  }
}

const handleStatusChange = async (id: number, status: string) => {
  rowSaving.value = id

  try {
    await updateBooking(id, { status: status as BookingStatus })
    await fetchBookings({
      page: page.value,
      jenis: filterJenis.value || undefined,
      status: filterStatus.value || undefined,
    }).catch(() => {})
  } catch (err) {
    listError.value = apiErrorMessage(err, 'Gagal mengubah status pemesanan.')
  } finally {
    rowSaving.value = null
  }
}

const handleDelete = async (id: number) => {
  if (!window.confirm('Hapus pemesanan ini?')) return

  rowSaving.value = id

  try {
    await deleteBooking(id)
    await fetchBookings({
      page: page.value,
      jenis: filterJenis.value || undefined,
      status: filterStatus.value || undefined,
    }).catch(() => {})
  } catch (err) {
    listError.value = apiErrorMessage(err, 'Gagal menghapus pemesanan.')
  } finally {
    rowSaving.value = null
  }
}

const editingId = ref<number | null>(null)
const editSaving = ref(false)
const editError = ref('')

const editForm = reactive({
  jenis: 'tiket_pesawat' as BookingJenis,
  vendor_id: null as number | null,
  vendor: '',
  kode_booking: '',
  tanggal: '',
  harga: 0,
  catatan: '',
})

const openEdit = (booking: Booking) => {
  editingId.value = booking.id
  editError.value = ''
  editForm.jenis = booking.jenis
  editForm.vendor_id = booking.vendor_id
  editForm.vendor = booking.vendor ?? ''
  editForm.kode_booking = booking.kode_booking ?? ''
  editForm.tanggal = booking.tanggal
  editForm.harga = Number(booking.harga)
  editForm.catatan = booking.catatan ?? ''
}

const closeEdit = () => {
  editingId.value = null
  editError.value = ''
}

const handleEditSave = async () => {
  if (editingId.value === null) return

  editError.value = ''

  const harga = Number(editForm.harga)

  if (!editForm.tanggal || !Number.isFinite(harga) || harga < 0) {
    editError.value = 'Tanggal dan harga wajib diisi dengan benar.'
    return
  }

  editSaving.value = true

  try {
    await updateBooking(editingId.value, {
      jenis: editForm.jenis,
      vendor_id: editForm.vendor_id,
      vendor: editForm.vendor_id !== null ? null : (editForm.vendor.trim() || null),
      kode_booking: editForm.kode_booking.trim() || null,
      tanggal: editForm.tanggal,
      harga,
      catatan: editForm.catatan.trim() || null,
    })

    closeEdit()
    await fetchBookings({
      page: page.value,
      jenis: filterJenis.value || undefined,
      status: filterStatus.value || undefined,
    }).catch(() => {})
  } catch (err) {
    editError.value = apiErrorMessage(err, 'Gagal menyimpan perubahan.')
  } finally {
    editSaving.value = false
  }
}

onMounted(() => {
  void reload()
  void fetchTrips({ per_page: 100 }).catch(() => {})
  void fetchVendors().catch(() => {})
})
</script>

<style scoped>
.booking-page {
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

.summary-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.summary-card {
  padding: 16px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--white);
}

.summary-card p { margin: 0 0 6px; font-size: 10px; color: var(--text-muted); }
.summary-card h2 { margin: 0; font-size: 20px; font-weight: 700; color: var(--text); overflow-wrap: anywhere; }

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

.filter-group select {
  min-width: 170px;
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
  border: 1px solid transparent;
  border-radius: 7px;
  font-size: 10px;
  line-height: 1.5;
}

.form-message.error { border-color: #f4c7c7; background: #fff5f5; color: #b42318; }
.form-message.success { border-color: #b7e4d1; background: #f0fdf7; color: #0f7b58; }

.form-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-bottom: 14px;
}

.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group.full { grid-column: 1 / -1; }
.form-group label { font-size: 9px; font-weight: 600; color: var(--text); }

.form-group select,
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

.form-group select:focus,
.form-group input:focus { border-color: var(--primary); }

.form-actions { display: flex; justify-content: flex-end; }

.table-card {
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--white);
  overflow: hidden;
}

.vendor-card {
  margin-top: 16px;
  padding: 18px;
  overflow: visible;
}

.section-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 14px;
}

.section-header h2 {
  margin: 0;
  color: var(--text);
  font-size: 14px;
  font-weight: 700;
}

.section-header p {
  margin: 4px 0 0;
  color: var(--text-muted);
  font-size: 10px;
}

.vendor-form {
  margin-bottom: 14px;
  padding: 14px;
  border: 1px dashed #dce2eb;
  border-radius: 8px;
  background: #fafbfc;
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

.destination { color: var(--primary); font-weight: 600; text-decoration: none; }
.destination:hover { text-decoration: underline; }
.trip-owner { display: block; margin-top: 2px; font-size: 9px; color: #8792a5; }

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 9px;
  border-radius: 5px;
  font-size: 9px;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge.waiting { background: #fff3df; color: #ef9b16; }
.status-badge.approved { background: #e8efff; color: var(--primary); }
.status-badge.completed { background: #dff7ef; color: #18a77c; }
.status-badge.rejected { background: #ffe8e8; color: #ef5350; }

.row-actions { display: flex; align-items: center; gap: 8px; }

.row-actions select {
  padding: 5px 7px;
  border: 1px solid #dce2eb;
  border-radius: 5px;
  background: var(--white);
  color: var(--text);
  font-family: inherit;
  font-size: 9px;
  outline: none;
}

.text-danger {
  padding: 0;
  border: 0;
  background: transparent;
  color: #b42318;
  font: inherit;
  font-size: 9px;
  cursor: pointer;
}

.text-danger:disabled { cursor: not-allowed; opacity: 0.55; }

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

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1500;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: rgba(16, 25, 45, 0.5);
}

.modal-card {
  width: 100%;
  max-width: 560px;
  max-height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  background: var(--white);
  box-shadow: 0 24px 60px rgba(16, 25, 45, 0.3);
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 18px;
  border-bottom: 1px solid #edf0f4;
}

.modal-header h2 {
  margin: 0;
  color: var(--text);
  font-size: 14px;
  font-weight: 700;
}

.close-button {
  width: 30px;
  height: 30px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: #f1f3f6;
  color: #667085;
  font-size: 14px;
  cursor: pointer;
}

.modal-card form {
  padding: 16px 18px;
  overflow-y: auto;
}

.modal-card .form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.table-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;
  padding: 12px 16px;
  border-top: 1px solid #edf0f4;
}

.showing-text { font-size: 9px; color: #8792a5; }

.pagination { display: flex; flex-wrap: wrap; gap: 6px; }

.page-button {
  min-width: 28px;
  height: 28px;
  padding: 0 8px;
  border: 1px solid #dce2eb;
  border-radius: 6px;
  background: var(--white);
  color: #667085;
  font-family: inherit;
  font-size: 10px;
  cursor: pointer;
}

.page-button.active { border-color: var(--primary); background: var(--primary); color: #fff; }

@media (max-width: 767px) {
  .booking-page { padding: 16px; }
  .page-header h1 { font-size: 20px; }
  .summary-grid { grid-template-columns: 1fr; }
  .form-grid { grid-template-columns: 1fr; }
  .filter-group select { min-width: 0; width: 100%; }
  .filter-group { flex: 1 1 140px; }
}
</style>
