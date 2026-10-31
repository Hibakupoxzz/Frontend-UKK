<template>
  <div class="detail-page">
    <div class="breadcrumb">
      <NuxtLink to="/admin/dashboard">Dashboard</NuxtLink>
      <span>›</span>
      <NuxtLink to="/admin/perjalanan-dinas">Perjalanan Dinas</NuxtLink>
      <span>›</span>
      <strong>Detail</strong>
    </div>

    <div class="page-header">
      <div>
        <h1>Detail Perjalanan</h1>
        <p v-if="trip">TRV-{{ trip.id }} · {{ trip.tujuan }}</p>
      </div>

      <NuxtLink to="/admin/perjalanan-dinas" class="back-button">
        ← Kembali
      </NuxtLink>
    </div>

    <div v-if="!tripId" class="state-card error" role="alert">
      ID perjalanan tidak ditemukan pada tautan ini.
    </div>
    <div v-else-if="loading && !trip" class="state-card">Memuat detail perjalanan...</div>
    <div v-else-if="!trip && error" class="state-card error" role="alert">{{ error }}</div>

    <template v-else-if="trip">
      <div v-if="actionError" class="data-error" role="alert">{{ actionError }}</div>
      <div v-if="actionMessage" class="data-success" role="status">{{ actionMessage }}</div>

      <section class="summary-card">
        <div class="summary-main">
          <div class="avatar">{{ initial }}</div>
          <div>
            <h2>{{ trip.user?.name || '—' }}</h2>
            <p>{{ trip.user?.department || '—' }} · {{ trip.keperluan }}</p>
          </div>
        </div>

        <span class="status-badge" :class="tripStatusClass(trip.status)">
          {{ tripStatusLabel(trip.status) }}
        </span>
      </section>

      <section class="panel">
        <h2>Informasi Perjalanan</h2>
        <dl class="info-grid">
          <div>
            <dt>Pegawai</dt>
            <dd>{{ trip.user?.name || '—' }}</dd>
          </div>
          <div>
            <dt>Departemen</dt>
            <dd>{{ trip.user?.department || '—' }}</dd>
          </div>
          <div>
            <dt>Tujuan</dt>
            <dd>{{ trip.tujuan }}</dd>
          </div>
          <div>
            <dt>Tanggal Berangkat</dt>
            <dd>{{ formatDate(trip.tanggal_berangkat) }}</dd>
          </div>
          <div>
            <dt>Tanggal Pulang</dt>
            <dd>{{ formatDate(trip.tanggal_pulang) }}</dd>
          </div>
          <div>
            <dt>Durasi</dt>
            <dd>{{ duration }}</dd>
          </div>
          <div>
            <dt>Status</dt>
            <dd>{{ tripStatusLabel(trip.status) }}</dd>
          </div>
          <div>
            <dt>Estimasi Anggaran</dt>
            <dd>{{ formatCurrencyOrDash(trip.estimasi_biaya) }}</dd>
          </div>
          <div>
            <dt>Realisasi Biaya</dt>
            <dd>{{ formatCurrency(totalBiaya) }}</dd>
          </div>
          <div>
            <dt>Selisih</dt>
            <dd :class="varianceClass">{{ formatCurrencyOrDash(trip.selisih_biaya) }}</dd>
          </div>
          <div class="full-width">
            <dt>Keperluan</dt>
            <dd>{{ trip.keperluan }}</dd>
          </div>
        </dl>
      </section>

      <div class="grid-2">
        <section class="panel">
          <h2>Kebutuhan Perjalanan</h2>

          <p v-if="!trip.needs?.length" class="empty-text">Tidak ada kebutuhan khusus.</p>
          <ul v-else class="need-list">
            <li v-for="need in trip.needs" :key="need.id">
              <span class="need-badge">{{ needLabel(need.jenis) }}</span>
              <span>{{ need.keterangan || 'Tanpa keterangan tambahan' }}</span>
            </li>
          </ul>
        </section>

        <section class="panel">
          <h2>Dokumen Pendukung</h2>

          <p v-if="!trip.documents?.length" class="empty-text">Belum ada dokumen diunggah.</p>
          <ul v-else class="document-list">
            <li v-for="document in trip.documents" :key="document.id">
              <a :href="document.url" target="_blank" rel="noopener">
                {{ document.jenis || `Dokumen #${document.id}` }}
              </a>
              <button
                v-if="isOwner"
                type="button"
                class="text-danger"
                :disabled="documentLoading"
                @click="handleDocumentDelete(document.id)"
              >
                Hapus
              </button>
            </li>
          </ul>

          <div v-if="isOwner" class="document-form">
            <input
              type="file"
              accept=".jpg,.jpeg,.png,.pdf"
              :disabled="documentLoading"
              @change="handleDocumentFile"
            />
            <input
              v-model="documentJenis"
              type="text"
              placeholder="Jenis dokumen (opsional)"
              :disabled="documentLoading"
            />
            <button
              type="button"
              class="primary-button"
              :disabled="documentLoading || !documentFile"
              @click="handleDocumentUpload"
            >
              {{ documentLoading ? 'Mengunggah...' : 'Unggah' }}
            </button>
          </div>
          <p v-if="documentError" class="form-message error" role="alert">{{ documentError }}</p>
          <p v-if="documentMessage" class="form-message success" role="status">{{ documentMessage }}</p>
        </section>
      </div>

      <section class="panel">
        <h2>Riwayat Persetujuan</h2>

        <p v-if="!trip.approvals?.length" class="empty-text">Belum ada riwayat persetujuan.</p>
        <ul v-else class="approval-list">
          <li v-for="approval in trip.approvals" :key="approval.id">
            <div>
              <strong>{{ approval.approver || 'Sistem' }}</strong>
              <span>{{ formatDate(approval.at) }}</span>
            </div>
            <span class="status-badge" :class="tripStatusClass(approval.status)">
              {{ tripStatusLabel(approval.status) }}
            </span>
            <p v-if="approval.catatan">{{ approval.catatan }}</p>
          </li>
        </ul>
      </section>

      <section class="panel">
        <div class="panel-heading">
          <h2>Pengeluaran</h2>
          <strong>{{ formatCurrency(totalBiaya) }}</strong>
        </div>

        <div v-if="expensesLoading" class="empty-text">Memuat pengeluaran...</div>
        <p v-else-if="expenses.length === 0" class="empty-text">Belum ada pengeluaran dicatat.</p>
        <div v-else class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>No</th>
                <th>Jenis</th>
                <th>Tanggal</th>
                <th>Keterangan</th>
                <th>Jumlah</th>
                <th>Bukti</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(expense, index) in expenses" :key="expense.id">
                <td>{{ index + 1 }}</td>
                <td>{{ expenseTypeLabel(expense.jenis) }}</td>
                <td>{{ formatDate(expense.tanggal) }}</td>
                <td>{{ expense.keterangan || '—' }}</td>
                <td>{{ formatCurrency(expense.jumlah) }}</td>
                <td>
                  <div v-if="expense.receipts?.length" class="receipt-links">
                    <a
                      v-for="receipt in expense.receipts"
                      :key="receipt.id"
                      :href="receipt.url"
                      target="_blank"
                      rel="noopener"
                    >
                      Lihat
                    </a>
                  </div>
                  <span v-else class="empty-text">Belum ada</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section class="panel">
        <div class="panel-heading">
          <h2>Reimbursement</h2>
          <NuxtLink to="/admin/laporan" class="panel-link">Lihat laporan</NuxtLink>
        </div>

        <p v-if="!trip.payments?.length" class="empty-text">Belum ada pengajuan pembayaran.</p>
        <ul v-else class="payment-history">
          <li v-for="payment in trip.payments" :key="payment.id">
            <div>
              <strong>{{ payment.status_label }}</strong>
              <span>
                Diajukan {{ formatCurrency(payment.jumlah_diajukan) }}
                <template v-if="payment.jumlah_disetujui !== null">
                  · Disetujui {{ formatCurrency(payment.jumlah_disetujui) }}
                </template>
              </span>
              <span>{{ formatDate(payment.created_at) }}</span>
            </div>
          </li>
        </ul>
      </section>

      <div v-if="rejecting" class="reject-panel">
        <p>Tolak pengajuan {{ trip.user?.name || '' }}</p>
        <textarea
          v-model="rejectNote"
          rows="3"
          placeholder="Tulis alasan penolakan (wajib)..."
          :disabled="actionLoading"
        />
        <div class="reject-actions">
          <button type="button" class="secondary-button" :disabled="actionLoading" @click="cancelReject">
            Batal
          </button>
          <button type="button" class="danger-button" :disabled="actionLoading" @click="handleReject">
            {{ actionLoading ? 'Memproses...' : 'Konfirmasi Tolak' }}
          </button>
        </div>
      </div>

      <section v-if="hasActions" class="action-bar">
        <button
          v-if="canSubmit"
          type="button"
          class="primary-button"
          :disabled="actionLoading"
          @click="handleSubmit"
        >
          {{ actionLoading ? 'Memproses...' : 'Ajukan Ulang' }}
        </button>

        <button
          v-if="canStart"
          type="button"
          class="primary-button"
          :disabled="actionLoading"
          @click="handleStart"
        >
          {{ actionLoading ? 'Memproses...' : 'Mulai Perjalanan' }}
        </button>

        <button
          v-if="canFinish"
          type="button"
          class="primary-button"
          :disabled="actionLoading"
          @click="handleFinish"
        >
          {{ actionLoading ? 'Memproses...' : 'Selesaikan Perjalanan' }}
        </button>

        <button
          v-if="canApprove"
          type="button"
          class="secondary-button danger"
          :disabled="actionLoading"
          @click="startReject"
        >
          Tolak
        </button>

        <button
          v-if="canApprove"
          type="button"
          class="primary-button"
          :disabled="actionLoading"
          @click="handleApprove"
        >
          {{ actionLoading ? 'Memproses...' : 'Setujui' }}
        </button>

        <button
          v-if="canComplete"
          type="button"
          class="primary-button"
          :disabled="actionLoading"
          @click="handleComplete"
        >
          {{ actionLoading ? 'Memproses...' : 'Tandai Lengkap' }}
        </button>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import type { Trip, TripDocument } from '~/types/api'
import { useTrips } from '~/composables/useTrips'
import { useExpenses } from '~/composables/useExpenses'
import { useApprovals } from '~/composables/useApprovals'
import { useAuth } from '~/composables/useAuth'
import { apiErrorMessage } from '~/composables/useApi'
import {
  expenseTypeLabel,
  formatCurrency,
  formatDate,
  tripStatusClass,
  tripStatusLabel,
} from '~/utils/format'

const route = useRoute()
const { user } = useAuth()

const tripId = computed(() => String(route.query.id ?? ''))

const {
  loading,
  error,
  fetchTrip,
  submitTrip,
  startTrip,
  finishTrip,
  uploadDocument,
  deleteDocument,
} = useTrips()

const {
  expenses,
  totalBiaya,
  loading: expensesLoading,
  fetchExpenses,
} = useExpenses()

const { approve, reject, complete } = useApprovals()

const trip = ref<Trip | null>(null)
const actionLoading = ref(false)
const actionError = ref('')
const actionMessage = ref('')

const rejecting = ref(false)
const rejectNote = ref('')

const documentFile = ref<File | null>(null)
const documentJenis = ref('')
const documentLoading = ref(false)
const documentError = ref('')
const documentMessage = ref('')

const needLabel = (jenis: string) => {
  if (jenis === 'transportasi') return 'Transportasi'
  if (jenis === 'penginapan') return 'Penginapan'
  return jenis
}

const initial = computed(() => (trip.value?.user?.name || '?').charAt(0).toUpperCase())

const formatCurrencyOrDash = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : formatCurrency(value)

const varianceClass = computed(() => {
  const variance = trip.value?.selisih_biaya
  if (variance === null || variance === undefined || variance === 0) return ''
  return variance > 0 ? 'over-budget' : 'under-budget'
})

const duration = computed(() => {
  if (!trip.value) return '—'

  const start = new Date(trip.value.tanggal_berangkat).getTime()
  const end = new Date(trip.value.tanggal_pulang).getTime()

  if (Number.isNaN(start) || Number.isNaN(end)) return '—'

  return `${Math.max(1, Math.round((end - start) / 86_400_000) + 1)} hari`
})

const isOwner = computed(() => !!user.value && String(user.value.id) === String(trip.value?.user?.id))

const canSubmit = computed(() => isOwner.value && ['draft', 'ditolak'].includes(trip.value?.status ?? ''))
const canStart = computed(() => isOwner.value && trip.value?.status === 'disetujui')
const canFinish = computed(() => isOwner.value && trip.value?.status === 'berjalan')
const canApprove = computed(() => !isOwner.value && trip.value?.status === 'diajukan')
const canComplete = computed(() => !isOwner.value && trip.value?.status === 'selesai')

const hasActions = computed(() =>
  canSubmit.value || canStart.value || canFinish.value || canApprove.value || canComplete.value
)

const load = async () => {
  if (!tripId.value) {
    trip.value = null
    return
  }

  trip.value = await fetchTrip(tripId.value)

  if (trip.value) {
    await fetchExpenses(trip.value.id)
  }
}

const refresh = async () => {
  await load()
}

const resetFeedback = () => {
  actionError.value = ''
  actionMessage.value = ''
}

const runAction = async (action: () => Promise<unknown>, successMessage: string) => {
  resetFeedback()
  actionLoading.value = true

  try {
    await action()
    await refresh()
    actionMessage.value = successMessage
  } catch (err) {
    actionError.value = apiErrorMessage(err, 'Aksi gagal diproses.')
  } finally {
    actionLoading.value = false
  }
}

const handleSubmit = () => runAction(() => submitTrip(tripId.value), 'Perjalanan berhasil diajukan ulang.')
const handleStart = () => runAction(() => startTrip(tripId.value), 'Perjalanan dimulai.')
const handleFinish = () => runAction(() => finishTrip(tripId.value), 'Perjalanan diselesaikan.')
const handleComplete = () => runAction(() => complete(tripId.value), 'Perjalanan ditandai lengkap.')
const handleApprove = () => runAction(() => approve(tripId.value), 'Pengajuan disetujui.')

const startReject = () => {
  resetFeedback()
  rejecting.value = true
  rejectNote.value = ''
}

const cancelReject = () => {
  rejecting.value = false
  rejectNote.value = ''
}

const handleReject = async () => {
  resetFeedback()

  if (!rejectNote.value.trim()) {
    actionError.value = 'Alasan penolakan wajib diisi.'
    return
  }

  actionLoading.value = true

  try {
    await reject(tripId.value, rejectNote.value.trim())
    cancelReject()
    await refresh()
    actionMessage.value = 'Pengajuan ditolak.'
  } catch (err) {
    actionError.value = apiErrorMessage(err, 'Gagal menolak pengajuan.')
  } finally {
    actionLoading.value = false
  }
}

const handleDocumentFile = (event: Event) => {
  const input = event.target as HTMLInputElement
  documentFile.value = input.files?.[0] ?? null
}

const handleDocumentUpload = async () => {
  documentError.value = ''
  documentMessage.value = ''

  if (!documentFile.value) {
    documentError.value = 'Pilih file dokumen terlebih dahulu.'
    return
  }

  documentLoading.value = true

  try {
    await uploadDocument(tripId.value, documentFile.value, documentJenis.value.trim() || undefined)
    documentFile.value = null
    documentJenis.value = ''
    await refresh()
    documentMessage.value = 'Dokumen berhasil diunggah.'
  } catch (err) {
    documentError.value = apiErrorMessage(err, 'Gagal mengunggah dokumen.')
  } finally {
    documentLoading.value = false
  }
}

const handleDocumentDelete = async (document: TripDocument['id']) => {
  if (!window.confirm('Hapus dokumen ini?')) return

  documentError.value = ''
  documentMessage.value = ''
  documentLoading.value = true

  try {
    await deleteDocument(document)
    await refresh()
    documentMessage.value = 'Dokumen dihapus.'
  } catch (err) {
    documentError.value = apiErrorMessage(err, 'Gagal menghapus dokumen.')
  } finally {
    documentLoading.value = false
  }
}

onMounted(() => {
  load().catch(() => {})
})

watch(tripId, () => {
  load().catch(() => {})
})
</script>

<style scoped>
.detail-page {
  width: 100%;
  min-height: calc(100vh - 70px);
  padding: 24px 28px;
  background: #f5f6f8;
}

.breadcrumb {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
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

.page-header p {
  margin: 4px 0 0;
  font-size: 11px;
  color: #8993a5;
}

.back-button {
  display: inline-flex;
  align-items: center;
  min-height: 34px;
  padding: 0 13px;
  border: 1px solid var(--border);
  border-radius: 7px;
  background: var(--white);
  color: var(--text);
  font-size: 10px;
  font-weight: 600;
  text-decoration: none;
}

.state-card {
  padding: 22px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--white);
  color: #8792a5;
  font-size: 11px;
}

.state-card.error {
  border-color: #f4c7c7;
  background: #fff5f5;
  color: #b42318;
}

.data-error,
.data-success {
  margin-bottom: 14px;
  padding: 10px 13px;
  border-radius: 7px;
  font-size: 10px;
}

.data-error {
  border: 1px solid #f4c7c7;
  background: #fff5f5;
  color: #b42318;
}

.data-success {
  border: 1px solid #bfe8d8;
  background: #f1fbf7;
  color: #147a5b;
}

.summary-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 14px;
  padding: 18px;
  margin-bottom: 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--white);
}

.summary-main {
  display: flex;
  align-items: center;
  gap: 13px;
}

.avatar {
  display: grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 50%;
  background: #e8efff;
  color: var(--primary);
  font-size: 15px;
  font-weight: 700;
}

.summary-main h2 {
  margin: 0;
  color: var(--text);
  font-size: 14px;
}

.summary-main p {
  margin: 4px 0 0;
  color: #8993a5;
  font-size: 10px;
}

.panel {
  padding: 18px;
  margin-bottom: 14px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--white);
}

.panel h2 {
  margin: 0 0 14px;
  color: var(--text);
  font-size: 13px;
}

.panel-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 14px;
}

.panel-heading h2 {
  margin: 0;
}

.panel-heading strong {
  color: var(--text);
  font-size: 13px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
  margin: 0;
}

.info-grid > div {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.info-grid .full-width {
  grid-column: 1 / -1;
}

.info-grid dt {
  color: #8993a5;
  font-size: 9px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.info-grid dd.over-budget { color: #b42318; font-weight: 600; }
.info-grid dd.under-budget { color: #15803d; font-weight: 600; }

.info-grid dd {
  margin: 0;
  color: var(--text);
  font-size: 11px;
  line-height: 1.5;
}

.grid-2 {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.grid-2 .panel {
  margin-bottom: 0;
}

.need-list,
.document-list,
.approval-list {
  display: grid;
  gap: 9px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.need-list li {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--text);
  font-size: 10px;
}

.need-badge {
  padding: 3px 8px;
  border-radius: 20px;
  background: #eef1f7;
  color: #667085;
  font-size: 9px;
  font-weight: 600;
  white-space: nowrap;
}

.document-list li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  padding: 8px 10px;
  border: 1px solid #edf0f4;
  border-radius: 6px;
  background: #fafbfd;
  font-size: 10px;
}

.document-list a {
  color: var(--primary);
  font-weight: 600;
  text-decoration: none;
  overflow-wrap: anywhere;
}

.document-form {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) auto;
  gap: 8px;
  margin-top: 12px;
}

.document-form input {
  min-height: 32px;
  padding: 0 9px;
  border: 1px solid #dce2eb;
  border-radius: 6px;
  background: var(--white);
  color: var(--text);
  font: inherit;
  font-size: 10px;
}

.document-form input[type='file'] {
  padding: 5px 8px;
}

.reject-panel {
  padding: 15px;
  margin-bottom: 14px;
  border: 1px solid #f4c7c7;
  border-radius: 10px;
  background: var(--white);
}

.reject-panel p {
  margin: 0 0 9px;
  color: var(--text);
  font-size: 11px;
  font-weight: 600;
}

.reject-panel textarea {
  width: 100%;
  box-sizing: border-box;
  padding: 9px 10px;
  border: 1px solid #dce2eb;
  border-radius: 6px;
  color: var(--text);
  font: inherit;
  font-size: 10px;
  resize: vertical;
}

.reject-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 10px;
}

.action-bar {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 9px;
  padding: 15px 18px;
  border: 1px solid var(--border);
  border-radius: 10px;
  background: var(--white);
}

.primary-button,
.secondary-button,
.danger-button {
  min-height: 34px;
  padding: 0 14px;
  border-radius: 6px;
  font-family: inherit;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
}

.primary-button {
  border: 1px solid var(--primary);
  background: var(--primary);
  color: var(--white);
}

.secondary-button {
  border: 1px solid #dce2eb;
  background: var(--white);
  color: #667085;
}

.secondary-button.danger {
  border-color: #efc4c4;
  color: #b42318;
}

.danger-button {
  border: 1px solid #ef4444;
  background: #ef4444;
  color: var(--white);
}

.primary-button:disabled,
.secondary-button:disabled,
.danger-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
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

.approval-list li {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 4px 10px;
  padding: 10px;
  border: 1px solid #edf0f4;
  border-radius: 7px;
  background: #fafbfd;
}

.approval-list li > div {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.approval-list strong {
  color: var(--text);
  font-size: 10px;
}

.approval-list span {
  color: #8993a5;
  font-size: 9px;
}

.approval-list p {
  grid-column: 1 / -1;
  margin: 4px 0 0;
  color: #667085;
  font-size: 10px;
  line-height: 1.5;
}

.payment-history {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.payment-history li {
  padding: 10px;
  border: 1px solid #edf0f4;
  border-radius: 7px;
  background: #fafbfd;
}

.payment-history li > div {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 4px 10px;
}

.payment-history strong {
  color: var(--text);
  font-size: 10px;
}

.payment-history span {
  color: #8993a5;
  font-size: 9px;
}

.panel-link {
  color: var(--primary);
  font-size: 9px;
  font-weight: 600;
  text-decoration: none;
}

.panel-link:hover {
  text-decoration: underline;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
}

th {
  padding: 9px 8px;
  background: #f3f4f6;
  color: #718096;
  font-size: 9px;
  font-weight: 600;
}

td {
  padding: 10px 8px;
  border-bottom: 1px solid #edf0f4;
  color: var(--text);
  font-size: 10px;
}

tbody tr:last-child td {
  border-bottom: 0;
}

.receipt-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.receipt-links a {
  color: var(--primary);
  font-size: 9px;
  font-weight: 600;
  text-decoration: none;
}

.empty-text {
  margin: 0;
  color: #8993a5;
  font-size: 10px;
  line-height: 1.5;
}

.form-message {
  margin: 10px 0 0;
  font-size: 10px;
}

.form-message.success {
  color: #147a5b;
}

.form-message.error {
  color: #b42318;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 5px 9px;
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

@media (max-width: 1050px) {
  .info-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .grid-2 {
    grid-template-columns: 1fr;
  }

  .grid-2 .panel {
    margin-bottom: 0;
  }
}

@media (max-width: 767px) {
  .detail-page {
    padding: 16px;
  }

  .page-header h1 {
    font-size: 20px;
  }

  .document-form {
    grid-template-columns: 1fr;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 374px) {
  .detail-page {
    padding: 12px;
  }
}
</style>
