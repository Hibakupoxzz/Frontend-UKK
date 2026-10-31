<template>
  <div class="page">
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <NuxtLink to="/dashboard">Dashboard</NuxtLink>
      <span>›</span>
      <NuxtLink to="/finance/dashboard">Finance</NuxtLink>
      <span>›</span>
      <strong>Pembayaran</strong>
    </div>

    <!-- Header -->
    <div class="page-header">
      <h1>Pembayaran Pengeluaran</h1>
      <button class="refresh-button" type="button" :disabled="loading" @click="reload">
        {{ loading ? 'Memuat...' : 'Muat Ulang' }}
      </button>
    </div>

    <div v-if="error" class="data-error" role="alert">{{ error }}</div>

    <!-- Stats -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon blue">💰</div>
        <div>
          <p>Total Diajukan</p>
          <h2>{{ formatCurrency(stats.total) }}</h2>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon orange">⏳</div>
        <div>
          <p>Menunggu Verifikasi</p>
          <h2>{{ formatCurrency(stats.menunggu) }}</h2>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon cyan">▣</div>
        <div>
          <p>Siap Dibayar</p>
          <h2>{{ formatCurrency(stats.siap) }}</h2>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon green">✓</div>
        <div>
          <p>Sudah Dibayar</p>
          <h2>{{ formatCurrency(stats.dibayar) }}</h2>
        </div>
      </div>
    </div>

    <!-- Filter -->
    <div class="filter-card">
      <div class="filter-group search-group">
        <label>Cari Pegawai / Tujuan</label>
        <div class="search-input">
          <svg viewBox="0 0 24 24"><path d="M10.5 4a6.5 6.5 0 1 0 4.08 11.56l4.43 4.43 1.41-1.41-4.43-4.43A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z"/></svg>
          <input v-model="search" type="text" placeholder="Cari..." />
        </div>
      </div>

      <div class="filter-group">
        <label>Status Pembayaran</label>
        <select v-model="selectedStatus">
          <option value="">Semua Status</option>
          <option value="diajukan">Menunggu Verifikasi</option>
          <option value="disetujui">Siap Dibayar</option>
          <option value="dibayar">Dibayar</option>
          <option value="ditolak">Ditolak</option>
        </select>
      </div>
    </div>

    <div v-if="actionMessage" class="data-success" role="status">{{ actionMessage }}</div>

    <!-- Table -->
    <div class="table-card">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th class="no-column">No</th>
              <th>Pegawai</th>
              <th>Tujuan</th>
              <th>Tanggal</th>
              <th>Diajukan</th>
              <th>Disetujui</th>
              <th>Status</th>
              <th class="action-column">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && rows.length === 0">
              <td colspan="8" class="table-state">Memuat data pembayaran...</td>
            </tr>
            <tr v-else-if="filteredRows.length === 0">
              <td colspan="8" class="table-state">Belum ada pengajuan pembayaran.</td>
            </tr>
            <tr v-for="(item, index) in filteredRows" :key="item.id">
              <td>{{ index + 1 }}</td>
              <td>{{ item.employee }}</td>
              <td>{{ item.tujuan }}</td>
              <td>{{ item.tanggal }}</td>
              <td>{{ formatCurrency(item.diajukan) }}</td>
              <td>{{ item.disetujui === null ? '—' : formatCurrency(item.disetujui) }}</td>
              <td>
                <span class="status-badge" :class="`status-${item.status}`">{{ item.status_label }}</span>
              </td>
              <td>
                <button type="button" class="detail-button" @click="openDetail(item.raw)">Detail</button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile cards -->
      <div class="payment-cards">
        <article v-for="(item, index) in filteredRows" :key="`card-${item.id}`" class="payment-card">
          <div class="payment-card-header">
            <span class="payment-card-number">#{{ index + 1 }}</span>
            <span class="status-badge" :class="`status-${item.status}`">{{ item.status_label }}</span>
          </div>
          <div class="payment-card-title">{{ item.employee }}</div>
          <div class="payment-card-subtitle">{{ item.tujuan }} · {{ item.tanggal }}</div>
          <dl class="payment-card-details">
            <div>
              <dt>Diajukan</dt>
              <dd>{{ formatCurrency(item.diajukan) }}</dd>
            </div>
            <div>
              <dt>Disetujui</dt>
              <dd>{{ item.disetujui === null ? '—' : formatCurrency(item.disetujui) }}</dd>
            </div>
          </dl>
          <button type="button" class="detail-button block" @click="openDetail(item.raw)">Lihat Detail</button>
        </article>
        <p v-if="loading && rows.length === 0" class="empty-state">Memuat data pembayaran...</p>
        <p v-else-if="filteredRows.length === 0" class="empty-state">Belum ada pengajuan pembayaran.</p>
      </div>

      <div class="table-footer">
        <span class="showing-text">Menampilkan {{ filteredRows.length }} dari {{ rows.length }} pengajuan</span>
      </div>
    </div>

    <!-- Detail panel -->
    <section v-if="selected" class="detail-card">
      <div class="detail-header">
        <div>
          <p class="detail-eyebrow">Pengajuan Pembayaran #{{ selected.id }}</p>
          <h2>{{ selected.trip?.tujuan ?? 'Perjalanan dinas' }}</h2>
          <p class="detail-subtitle">
            {{ selected.trip?.user?.name ?? selected.requested_by?.name ?? '—' }}
            <span v-if="selected.trip?.user?.department"> · {{ selected.trip.user.department }}</span>
          </p>
        </div>
        <div class="detail-header-actions">
          <span class="status-badge" :class="`status-${selected.status}`">{{ selected.status_label }}</span>
          <button type="button" class="close-button" aria-label="Tutup" @click="closeDetail">×</button>
        </div>
      </div>

      <div class="detail-grid">
        <div>
          <span>Tanggal Perjalanan</span>
          <strong>
            {{ formatDate(selected.trip?.tanggal_berangkat) }} - {{ formatDate(selected.trip?.tanggal_pulang) }}
          </strong>
        </div>
        <div>
          <span>Jumlah Diajukan</span>
          <strong>{{ formatCurrency(selected.jumlah_diajukan) }}</strong>
        </div>
        <div>
          <span>Jumlah Disetujui</span>
          <strong>{{ selected.jumlah_disetujui === null ? '—' : formatCurrency(selected.jumlah_disetujui) }}</strong>
        </div>
        <div>
          <span>Metode</span>
          <strong>{{ selected.metode ? (selected.metode === 'transfer' ? 'Transfer' : 'Tunai') : '—' }}</strong>
        </div>
        <div>
          <span>No. Referensi</span>
          <strong>{{ selected.no_referensi || '—' }}</strong>
        </div>
        <div>
          <span>Diverifikasi Oleh</span>
          <strong>{{ selected.verified_by?.name || '—' }}</strong>
        </div>
        <div>
          <span>Dibayar Oleh</span>
          <strong>{{ selected.paid_by?.name || '—' }}</strong>
        </div>
        <div>
          <span>Bukti Transfer</span>
          <strong>
            <a v-if="selected.bukti_url" :href="selected.bukti_url" target="_blank" rel="noopener" class="file-link">Lihat Bukti</a>
            <template v-else>—</template>
          </strong>
        </div>
      </div>

      <div v-if="selected.catatan" class="detail-note">
        <span>Catatan</span>
        <p>{{ selected.catatan }}</p>
      </div>

      <div v-if="actionError" class="data-error" role="alert">{{ actionError }}</div>

      <!-- Actions -->
      <div v-if="canAct" class="action-area">
        <div class="action-buttons">
          <button
            v-if="selected.status === 'diajukan'"
            type="button"
            class="primary-button"
            :class="{ active: actionMode === 'verify' }"
            @click="startVerify"
          >
            Verifikasi
          </button>
          <button
            v-if="selected.status === 'disetujui'"
            type="button"
            class="primary-button"
            :class="{ active: actionMode === 'pay' }"
            @click="startPay"
          >
            Bayar
          </button>
          <button
            v-if="selected.status === 'diajukan' || selected.status === 'disetujui'"
            type="button"
            class="danger-button"
            :class="{ active: actionMode === 'reject' }"
            @click="startReject"
          >
            Tolak
          </button>
        </div>

        <!-- Verify form -->
        <div v-if="actionMode === 'verify'" class="action-form">
          <div class="form-grid">
            <div class="filter-group">
              <label>Jumlah Disetujui (Rp)</label>
              <input v-model="verifyForm.jumlah_disetujui" type="number" min="1" step="1" />
            </div>
            <div class="filter-group grow">
              <label>Catatan (opsional)</label>
              <input v-model="verifyForm.catatan" type="text" placeholder="Catatan verifikasi" />
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="cancel-button" :disabled="submitting" @click="actionMode = null">Batal</button>
            <button type="button" class="primary-button" :disabled="submitting" @click="submitVerify">
              {{ submitting ? 'Memproses...' : 'Simpan Verifikasi' }}
            </button>
          </div>
        </div>

        <!-- Pay form -->
        <div v-if="actionMode === 'pay'" class="action-form">
          <div class="form-grid">
            <div class="filter-group">
              <label>Metode</label>
              <select v-model="payForm.metode">
                <option value="transfer">Transfer</option>
                <option value="tunai">Tunai</option>
              </select>
            </div>
            <div class="filter-group">
              <label>No. Referensi</label>
              <input v-model="payForm.no_referensi" type="text" placeholder="Contoh: TRX-2026-001" />
            </div>
            <div class="filter-group">
              <label>Bukti Transfer (opsional)</label>
              <input type="file" accept=".jpg,.jpeg,.png,.pdf" @change="handleBukti" />
            </div>
            <div class="filter-group grow">
              <label>Catatan (opsional)</label>
              <input v-model="payForm.catatan" type="text" placeholder="Catatan pembayaran" />
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="cancel-button" :disabled="submitting" @click="actionMode = null">Batal</button>
            <button type="button" class="primary-button" :disabled="submitting" @click="submitPay">
              {{ submitting ? 'Memproses...' : 'Konfirmasi Pembayaran' }}
            </button>
          </div>
        </div>

        <!-- Reject form -->
        <div v-if="actionMode === 'reject'" class="action-form">
          <div class="form-grid">
            <div class="filter-group grow">
              <label>Alasan Penolakan</label>
              <input v-model="rejectForm.catatan" type="text" placeholder="Wajib diisi" />
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="cancel-button" :disabled="submitting" @click="actionMode = null">Batal</button>
            <button type="button" class="danger-button" :disabled="submitting" @click="submitReject">
              {{ submitting ? 'Memproses...' : 'Tolak Pengajuan' }}
            </button>
          </div>
        </div>
      </div>

      <p v-else-if="selected.status === 'dibayar'" class="detail-done">
        Pembayaran sudah selesai diproses{{ selected.paid_at ? ` pada ${formatDateTime(selected.paid_at)}` : '' }}.
      </p>
      <p v-else-if="selected.status === 'ditolak'" class="detail-done rejected">
        Pengajuan ditolak. Pegawai dapat mengajukan ulang setelah memperbaiki data.
      </p>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { Payment } from '~/types/api'
import { usePayments } from '~/composables/usePayments'
import { apiErrorMessage } from '~/composables/useApi'
import { formatCurrency, formatDate } from '~/utils/format'

const {
  payments,
  loading,
  error,
  fetchPayments,
  fetchPayment,
  verifyPayment,
  rejectPayment,
  payPayment,
} = usePayments()

const search = ref('')
const selectedStatus = ref('')
const selected = ref<Payment | null>(null)
const actionMode = ref<'verify' | 'reject' | 'pay' | null>(null)
const actionError = ref('')
const actionMessage = ref('')
const submitting = ref(false)

const verifyForm = reactive({ jumlah_disetujui: '' as string | number, catatan: '' })
const rejectForm = reactive({ catatan: '' })
const payForm = reactive({
  metode: 'transfer' as 'transfer' | 'tunai',
  no_referensi: '',
  catatan: '',
  bukti: null as File | null,
})

const rows = computed(() => payments.value.map((payment) => {
  const disetujui = payment.jumlah_disetujui

  return {
    id: payment.id,
    raw: payment,
    employee: payment.trip?.user?.name ?? payment.requested_by?.name ?? '—',
    tujuan: payment.trip?.tujuan ?? '—',
    tanggal: formatDate(payment.trip?.tanggal_berangkat),
    diajukan: payment.jumlah_diajukan,
    disetujui: disetujui === null ? null : disetujui,
    status: payment.status,
    status_label: payment.status_label,
  }
}))

const filteredRows = computed(() => {
  const query = search.value.trim().toLowerCase()

  return rows.value.filter((row) => {
    const searchMatch = !query
      || row.employee.toLowerCase().includes(query)
      || row.tujuan.toLowerCase().includes(query)

    const statusMatch = !selectedStatus.value || row.status === selectedStatus.value

    return searchMatch && statusMatch
  })
})

const stats = computed(() => {
  const total = rows.value.reduce((sum, row) => sum + row.diajukan, 0)
  const menunggu = rows.value
    .filter((row) => row.status === 'diajukan')
    .reduce((sum, row) => sum + row.diajukan, 0)
  const siap = rows.value
    .filter((row) => row.status === 'disetujui')
    .reduce((sum, row) => sum + (row.disetujui ?? row.diajukan), 0)
  const dibayar = rows.value
    .filter((row) => row.status === 'dibayar')
    .reduce((sum, row) => sum + (row.disetujui ?? row.diajukan), 0)

  return { total, menunggu, siap, dibayar }
})

const canAct = computed(() => !!selected.value
  && (selected.value.status === 'diajukan' || selected.value.status === 'disetujui'))

const formatDateTime = (value: string) => {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value

  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}

const reload = async () => {
  try {
    await fetchPayments({ per_page: 100 })
  } catch {
    // pesan error sudah disimpan oleh composable
  }
}

const openDetail = (payment: Payment) => {
  selected.value = payment
  actionMode.value = null
  actionError.value = ''
  actionMessage.value = ''
  verifyForm.jumlah_disetujui = payment.jumlah_diajukan
  verifyForm.catatan = ''
  rejectForm.catatan = ''
  payForm.metode = 'transfer'
  payForm.no_referensi = ''
  payForm.catatan = ''
  payForm.bukti = null
}

const closeDetail = () => {
  selected.value = null
  actionMode.value = null
  actionError.value = ''
}

const startVerify = () => {
  actionMode.value = 'verify'
  actionError.value = ''
  verifyForm.jumlah_disetujui = selected.value?.jumlah_diajukan ?? ''
  verifyForm.catatan = ''
}

const startPay = () => {
  actionMode.value = 'pay'
  actionError.value = ''
  payForm.metode = 'transfer'
  payForm.no_referensi = ''
  payForm.catatan = ''
  payForm.bukti = null
}

const startReject = () => {
  actionMode.value = 'reject'
  actionError.value = ''
  rejectForm.catatan = ''
}

const handleBukti = (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null

  if (file && file.size > 2 * 1024 * 1024) {
    actionError.value = 'Ukuran bukti maksimal 2 MB.'
    payForm.bukti = null
    input.value = ''
    return
  }

  actionError.value = ''
  payForm.bukti = file
}

const refreshSelected = async (id: number) => {
  selected.value = await fetchPayment(id)
}

const submitVerify = async () => {
  if (!selected.value) return

  const jumlah = Number(verifyForm.jumlah_disetujui)

  if (!Number.isFinite(jumlah) || jumlah <= 0) {
    actionError.value = 'Jumlah disetujui harus lebih dari 0.'
    return
  }

  submitting.value = true
  actionError.value = ''

  try {
    const payment = await verifyPayment(selected.value.id, {
      jumlah_disetujui: jumlah,
      catatan: verifyForm.catatan.trim() || null,
    })

    selected.value = payment
    actionMode.value = null
    actionMessage.value = 'Pengajuan berhasil diverifikasi dan siap dibayar.'
    await reload()
  } catch (err) {
    actionError.value = apiErrorMessage(err, 'Gagal memverifikasi pembayaran.')
  } finally {
    submitting.value = false
  }
}

const submitReject = async () => {
  if (!selected.value) return

  if (!rejectForm.catatan.trim()) {
    actionError.value = 'Alasan penolakan wajib diisi.'
    return
  }

  submitting.value = true
  actionError.value = ''

  try {
    const payment = await rejectPayment(selected.value.id, rejectForm.catatan.trim())

    selected.value = payment
    actionMode.value = null
    actionMessage.value = 'Pengajuan pembayaran ditolak.'
    await reload()
  } catch (err) {
    actionError.value = apiErrorMessage(err, 'Gagal menolak pembayaran.')
  } finally {
    submitting.value = false
  }
}

const submitPay = async () => {
  if (!selected.value) return

  if (payForm.metode === 'transfer' && !payForm.no_referensi.trim()) {
    actionError.value = 'Nomor referensi wajib diisi untuk pembayaran transfer.'
    return
  }

  submitting.value = true
  actionError.value = ''

  try {
    const payment = await payPayment(selected.value.id, {
      metode: payForm.metode,
      no_referensi: payForm.no_referensi.trim() || null,
      catatan: payForm.catatan.trim() || null,
      bukti: payForm.bukti,
    })

    selected.value = payment
    actionMode.value = null
    actionMessage.value = 'Pembayaran berhasil dicatat.'
    await reload()
  } catch (err) {
    actionError.value = apiErrorMessage(err, 'Gagal mencatat pembayaran.')
  } finally {
    submitting.value = false
  }
}

onMounted(reload)
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

.refresh-button {
  height: 34px;
  padding: 0 14px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--white);
  color: var(--text);
  font-family: inherit;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
}

.refresh-button:hover { border-color: var(--primary); color: var(--primary); }
.refresh-button:disabled { opacity: 0.6; cursor: not-allowed; }

.data-error { margin-bottom: 16px; padding: 11px 14px; border: 1px solid #f4c7c7; border-radius: 8px; background: #fff5f5; color: #b42318; font-size: 11px; }
.data-success { margin-bottom: 16px; padding: 11px 14px; border: 1px solid #b7e4d1; border-radius: 8px; background: #f0fdf7; color: #0f7b58; font-size: 11px; }

/* STATS */
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

/* FILTER */
.filter-card {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) 195px;
  gap: 14px;
  padding: 16px;
  margin-bottom: 24px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 10px;
}

.filter-group { display: flex; flex-direction: column; gap: 6px; }
.filter-group.grow { grid-column: 1 / -1; }
.filter-group label { font-size: 9px; font-weight: 600; color: #667085; }

.search-input {
  height: 31px; display: flex; align-items: center;
  border: 1px solid #dce2eb; border-radius: 6px; background: var(--white);
}
.search-input svg { width: 14px; height: 14px; margin: 0 8px; fill: #718096; flex-shrink: 0; }
.search-input input,
.filter-group input,
.filter-group select {
  width: 100%; height: 31px; box-sizing: border-box;
  border: 1px solid #dce2eb; border-radius: 6px;
  background: var(--white); color: var(--text);
  outline: none; font-family: inherit; font-size: 10px;
}
.search-input input { border: none; }
.filter-group select { padding: 0 10px; }
.filter-group input[type="number"],
.filter-group input[type="text"] { padding: 0 10px; }
.filter-group input[type="file"] { padding: 5px 8px; height: auto; }

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
.action-column { width: 78px; }
.table-state { padding: 22px 12px; text-align: center; font-size: 10px; color: #8792a5; }

.status-badge {
  display: inline-flex; align-items: center;
  padding: 4px 9px; border-radius: 5px;
  font-size: 9px; font-weight: 600; white-space: nowrap;
}
.status-diajukan { background: #fff3df; color: #b45309; }
.status-disetujui { background: #e9f0ff; color: #1d4ed8; }
.status-ditolak { background: #fee2e2; color: #b42318; }
.status-dibayar { background: #dff7ef; color: #18a77c; }

.detail-button {
  height: 27px;
  padding: 0 11px;
  border: 1px solid var(--primary);
  border-radius: 6px;
  background: #f5f8ff;
  color: var(--primary);
  font-family: inherit;
  font-size: 9px;
  font-weight: 600;
  cursor: pointer;
}
.detail-button:hover { background: #eaf0ff; }
.detail-button.block { width: 100%; height: 32px; margin-top: 4px; }

/* MOBILE CARDS */
.payment-cards { display: none; }
.payment-card {
  padding: 14px; background: var(--white); border: 1px solid var(--border); border-radius: 10px;
}
.payment-card-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.payment-card-number { font-size: 10px; color: #9aa4b5; }
.payment-card-title { color: var(--text); font-size: 14px; font-weight: 700; line-height: 1.35; }
.payment-card-subtitle { margin-top: 4px; font-size: 11px; color: var(--text-muted); }
.payment-card-details { display: grid; grid-template-columns: 1fr; gap: 8px; margin: 12px 0; }
.payment-card-details > div { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.payment-card-details dt { font-size: 10px; color: #8792a5; }
.payment-card-details dd { margin: 0; font-size: 11px; font-weight: 500; color: var(--text); text-align: right; }

.empty-state { padding: 28px 16px; text-align: center; font-size: 12px; color: #8792a5; }

.table-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px 18px; }
.showing-text { font-size: 9px; color: #718096; }

/* DETAIL */
.detail-card {
  margin-top: 24px;
  padding: 22px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 11px;
}

.detail-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #edf0f5;
}

.detail-eyebrow { margin: 0 0 4px; font-size: 9px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; color: #9aa4b5; }
.detail-header h2 { margin: 0; font-size: 18px; font-weight: 700; color: var(--text); }
.detail-subtitle { margin: 4px 0 0; font-size: 11px; color: var(--text-muted); }
.detail-header-actions { display: flex; align-items: center; gap: 10px; }

.close-button {
  width: 28px; height: 28px;
  display: flex; align-items: center; justify-content: center;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--white);
  color: #667085;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}
.close-button:hover { color: #b42318; border-color: #f4c7c7; }

.detail-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
  padding: 18px 0;
}

.detail-grid > div { display: flex; flex-direction: column; gap: 4px; min-width: 0; }
.detail-grid span { font-size: 9px; color: #8792a5; }
.detail-grid strong { font-size: 11px; font-weight: 600; color: var(--text); word-break: break-word; }

.detail-note { padding: 12px 14px; border-radius: 8px; background: #f8fafc; }
.detail-note span { font-size: 9px; color: #8792a5; }
.detail-note p { margin: 4px 0 0; font-size: 11px; color: var(--text); line-height: 1.5; }

.detail-done { margin: 18px 0 0; padding: 12px 14px; border-radius: 8px; background: #f0fdf7; font-size: 11px; color: #0f7b58; }
.detail-done.rejected { background: #fff5f5; color: #b42318; }

.action-area { margin-top: 18px; padding-top: 18px; border-top: 1px solid #edf0f5; }
.action-buttons { display: flex; flex-wrap: wrap; gap: 10px; }

.action-form { margin-top: 16px; padding: 16px; border: 1px solid #edf0f5; border-radius: 9px; background: #fbfcfe; }
.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.form-actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 14px; }

.primary-button,
.danger-button,
.cancel-button {
  height: 34px;
  padding: 0 16px;
  border-radius: 7px;
  font-family: inherit;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid transparent;
}

.primary-button { background: var(--primary); color: #fff; }
.primary-button:hover { opacity: 0.9; }
.primary-button.active { box-shadow: 0 0 0 2px #c7d6ff; }

.danger-button { border-color: #f4c7c7; background: #fff5f5; color: #b42318; }
.danger-button:hover { background: #fee2e2; }
.danger-button.active { box-shadow: 0 0 0 2px #fbd5d5; }

.cancel-button { border-color: var(--border); background: var(--white); color: var(--text); }
.cancel-button:hover { background: #f8fafc; }

.primary-button:disabled,
.danger-button:disabled,
.cancel-button:disabled { opacity: 0.6; cursor: not-allowed; }

.file-link { color: var(--primary); font-weight: 600; text-decoration: none; }
.file-link:hover { text-decoration: underline; }

/* RESPONSIVE */
@media (max-width: 1023px) {
  .page { padding: 20px; }
  .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .detail-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}

@media (max-width: 767px) {
  .page { padding: 16px; }
  .page-header h1 { font-size: 20px; }
  .stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
  .stat-card { padding: 12px; gap: 10px; }
  .stat-card h2 { font-size: 14px; }
  .filter-card { grid-template-columns: 1fr; padding: 14px; gap: 12px; margin-bottom: 16px; }
  .filter-group input, .filter-group select { font-size: 16px; }
  .table-wrapper { display: none; }
  .table-footer { flex-direction: column; align-items: flex-start; gap: 10px; padding: 0 14px 14px; }
  .payment-cards { display: flex; flex-direction: column; gap: 12px; padding: 14px; }
  .table-card { border: none; background: transparent; overflow: visible; }
  .detail-card { padding: 16px; }
  .detail-grid { grid-template-columns: 1fr; gap: 12px; }
  .detail-header { flex-direction: column; }
  .form-grid { grid-template-columns: 1fr; }
}

@media (max-width: 374px) {
  .page { padding: 12px; }
  .stats-grid { grid-template-columns: 1fr; }
  .payment-cards { padding: 10px; }
}
</style>
