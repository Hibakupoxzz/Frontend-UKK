<template>
  <div class="atasan-page">
    <div class="breadcrumb">
      <NuxtLink to="/atasan/dashboard">Dashboard</NuxtLink><AppIcon name="chevron-right" class="crumb-sep" />
      <NuxtLink to="/atasan/persetujuan">Persetujuan</NuxtLink><AppIcon name="chevron-right" class="crumb-sep" />
      <strong>Detail Pengajuan</strong>
    </div>

    <header class="page-header">
      <div>
        <p class="eyebrow">ID Pengajuan: {{ requestId }}</p>
        <h1>Detail Pengajuan Perjalanan</h1>
        <p>Tinjau informasi pengajuan sebelum memberikan keputusan.</p>
      </div>
      <span v-if="trip" class="status" :class="tripStatusClass(trip.status)">{{ tripStatusLabel(trip.status) }}</span>
      <span v-else class="status">Status belum tersedia</span>
    </header>

    <p v-if="trip && trip.status === 'diajukan'" class="level-note" role="status">
      {{ trip.approval_level_label ?? 'Menunggu persetujuan atasan' }} — setelah disetujui atasan, pengajuan diteruskan ke HRD untuk keputusan final.
    </p>

    <div v-if="error" class="data-error" role="alert">
      <strong>Data gagal dimuat</strong>
      <span>{{ error }}</span>
    </div>

    <div v-if="loading && !trip" class="panel loading-panel">Memuat detail pengajuan...</div>

    <div v-else-if="trip" class="detail-grid">
      <section class="panel">
        <h2>Informasi Pegawai dan Perjalanan</h2>
        <dl class="info-grid">
          <div><dt>Nama Pegawai</dt><dd>{{ trip.user?.name ?? '—' }}</dd></div>
          <div><dt>Departemen</dt><dd>{{ trip.user?.department ?? '—' }}</dd></div>
          <div><dt>Tujuan Perjalanan</dt><dd>{{ trip.tujuan }}</dd></div>
          <div><dt>Durasi</dt><dd>{{ duration }}</dd></div>
          <div><dt>Tanggal Keberangkatan</dt><dd>{{ formatDate(trip.tanggal_berangkat) }}</dd></div>
          <div><dt>Tanggal Kembali</dt><dd>{{ formatDate(trip.tanggal_pulang) }}</dd></div>
          <div class="wide"><dt>Keperluan Perjalanan</dt><dd>{{ trip.keperluan }}</dd></div>
          <div><dt>Kebutuhan Transportasi</dt><dd>{{ needDescription('transportasi') }}</dd></div>
          <div><dt>Kebutuhan Penginapan</dt><dd>{{ needDescription('penginapan') }}</dd></div>
        </dl>
      </section>

      <div class="side-column">
        <section class="panel">
          <h2>Estimasi vs Realisasi</h2>
          <dl class="cost-list">
            <div><dt>Estimasi Anggaran</dt><dd>{{ formatCurrencyOrDash(trip.estimasi_biaya) }}</dd></div>
            <div><dt>Realisasi Biaya</dt><dd>{{ formatCurrency(trip.total_biaya) }}</dd></div>
            <div class="total">
              <dt>Selisih</dt>
              <dd :class="varianceClass">{{ formatCurrencyOrDash(trip.selisih_biaya) }}</dd>
            </div>
          </dl>
          <p class="cost-note">
            Realisasi diambil dari pengeluaran yang tercatat. Estimasi diisi pegawai saat mengajukan perjalanan.
          </p>
        </section>

        <section class="panel">
          <h2>Informasi Pengajuan</h2>
          <dl class="cost-list">
            <div><dt>Pemohon</dt><dd>{{ trip.user?.name ?? '—' }}</dd></div>
            <div><dt>Waktu Pengajuan</dt><dd>{{ formatDate(trip.created_at) }}</dd></div>
            <div><dt>Atasan Peninjau</dt><dd>{{ lastApprover }}</dd></div>
            <div><dt>Status Keputusan</dt><dd>{{ tripStatusLabel(trip.status) }}</dd></div>
          </dl>
        </section>
      </div>

      <section class="panel list-panel">
        <h2>Kebutuhan Perjalanan</h2>
        <ul v-if="trip.needs?.length" class="need-list">
          <li v-for="need in trip.needs" :key="need.id">
            <strong>{{ needLabel(need.jenis) }}</strong>
            <span>{{ need.keterangan || 'Tanpa keterangan' }}</span>
          </li>
        </ul>
        <p v-else class="empty-text">Belum ada kebutuhan perjalanan yang dicatat.</p>
      </section>

      <section class="panel list-panel">
        <h2>Dokumen Pendukung</h2>
        <ul v-if="trip.documents?.length" class="document-list">
          <li v-for="document in trip.documents" :key="document.id">
            <a :href="document.url" target="_blank" rel="noopener">{{ document.jenis || 'Dokumen' }}</a>
          </li>
        </ul>
        <p v-else class="empty-text">Belum ada dokumen pendukung yang diunggah.</p>
      </section>

      <section class="panel list-panel">
        <h2>Riwayat Persetujuan</h2>
        <ul v-if="trip.approvals?.length" class="approval-list">
          <li v-for="approval in trip.approvals" :key="approval.id">
            <div class="approval-head">
              <span class="status" :class="tripStatusClass(approval.status)">{{ tripStatusLabel(approval.status) }}</span>
              <span class="approval-meta">{{ approval.approver || '—' }} · {{ formatDate(approval.at) }}</span>
            </div>
            <p v-if="approval.catatan" class="approval-note">{{ approval.catatan }}</p>
          </li>
        </ul>
        <p v-else class="empty-text">Belum ada riwayat keputusan untuk pengajuan ini.</p>
      </section>

      <section class="panel decision-panel">
        <h2>Keputusan Atasan</h2>
        <label for="decision-note">Catatan keputusan</label>
        <textarea
          id="decision-note"
          v-model="note"
          rows="4"
          placeholder="Tuliskan catatan untuk pengajuan ini..."
          :disabled="!canDecide || submitting"
        ></textarea>
        <p v-if="decisionError" class="decision-error" role="alert">{{ decisionError }}</p>
        <p v-else-if="!canDecide" class="decision-note">Pengajuan ini sudah diproses atau sudah diteruskan ke HRD sehingga keputusan tidak dapat diubah lagi.</p>
        <p v-else class="decision-note">Catatan wajib diisi saat menolak pengajuan.</p>
        <div class="actions">
          <button type="button" class="reject-button" :disabled="!canDecide || submitting" @click="handleReject">
            Tolak Pengajuan
          </button>
          <button type="button" class="approve-button" :disabled="!canDecide || submitting" @click="handleApprove">
            {{ submitting ? 'Memproses...' : 'Setujui Pengajuan' }}
          </button>
        </div>
      </section>
    </div>

    <div v-else class="panel loading-panel">Detail pengajuan tidak dapat dimuat.</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Trip } from '~/types/api'
import { apiErrorMessage } from '~/composables/useApi'
import { useApprovals } from '~/composables/useApprovals'
import { useTrips } from '~/composables/useTrips'
import { formatCurrency, formatDate, tripStatusClass, tripStatusLabel } from '~/utils/format'

definePageMeta({ layout: 'atasan' })

const route = useRoute()
const requestId = computed(() => String(route.params.id ?? ''))
const note = ref('')
const trip = ref<Trip | null>(null)
const submitting = ref(false)
const decisionError = ref<string | null>(null)

const { fetchTrip, loading, error } = useTrips()
const { approve, reject } = useApprovals()

const canDecide = computed(
  () => trip.value?.status === 'diajukan' && (trip.value?.approval_level ?? 1) < 2,
)

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

  return `${Math.round((end - start) / 86_400_000) + 1} hari`
})

const lastApprover = computed(() => {
  const approvals = trip.value?.approvals ?? []
  return approvals.length ? (approvals[approvals.length - 1]?.approver ?? '—') : '—'
})

const needLabel = (jenis: string) => {
  if (jenis === 'transportasi') return 'Transportasi'
  if (jenis === 'penginapan') return 'Penginapan'
  return jenis
}

const needDescription = (jenis: 'transportasi' | 'penginapan') => {
  const items = trip.value?.needs?.filter((need) => need.jenis === jenis) ?? []
  if (items.length === 0) return '—'

  return items.map((need) => need.keterangan || 'Tanpa keterangan').join(', ')
}

const handleApprove = async () => {
  if (!trip.value || !canDecide.value || submitting.value) return

  submitting.value = true
  decisionError.value = null

  try {
    await approve(trip.value.id, note.value.trim() || undefined)
    await navigateTo('/atasan/persetujuan')
  } catch (err) {
    decisionError.value = apiErrorMessage(err, 'Gagal menyetujui pengajuan.')
  } finally {
    submitting.value = false
  }
}

const handleReject = async () => {
  if (!trip.value || !canDecide.value || submitting.value) return

  if (!note.value.trim()) {
    decisionError.value = 'Catatan wajib diisi saat menolak pengajuan.'
    return
  }

  submitting.value = true
  decisionError.value = null

  try {
    await reject(trip.value.id, note.value.trim())
    await navigateTo('/atasan/persetujuan')
  } catch (err) {
    decisionError.value = apiErrorMessage(err, 'Gagal menolak pengajuan.')
  } finally {
    submitting.value = false
  }
}

onMounted(async () => {
  try {
    trip.value = await fetchTrip(requestId.value)
  } catch {
    // Pesan error sudah disimpan oleh composable.
  }
})
</script>

<style scoped>
.atasan-page { min-height: calc(100vh - 70px); padding: 26px 28px; background: #f5f6f8; }
.breadcrumb { display: flex; flex-wrap: wrap; gap: 9px; margin-bottom: 8px; color: #8792a3; font-size: 11px; }
.breadcrumb a { color: var(--primary); }
.breadcrumb strong { color: var(--text); font-weight: 600; }
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.page-header h1 { margin: 3px 0 6px; color: var(--text); font-size: 24px; }
.page-header p { margin: 0; color: var(--text-muted); font-size: 12px; }
.eyebrow { color: var(--text-muted); font-size: 11px !important; }
.level-note {
  margin: 0 0 14px;
  padding: 9px 12px;
  border: 1px solid #dbe4ff;
  border-radius: 8px;
  background: #f4f7ff;
  color: var(--primary);
  font-size: 11px;
  line-height: 1.5;
}
.status { display: inline-block; padding: 7px 10px; border-radius: 20px; background: #edf1f7; color: #667085; font-size: 10px; white-space: nowrap; }
.status.approved { background: #e8f7ef; color: #15803d; }
.status.rejected { background: #fdecec; color: #b42318; }
.status.ongoing { background: #e8efff; color: #315bb5; }
.status.completed { background: #eaf7f1; color: #15803d; }
.status.draft { background: #eef1f5; color: #667085; }
.detail-grid { display: grid; grid-template-columns: minmax(0, 1.35fr) minmax(270px, 0.8fr); gap: 16px; margin-top: 16px; }
.panel { min-width: 0; padding: 19px; border: 1px solid var(--border); border-radius: 10px; background: var(--white); }
.panel h2 { margin: 0 0 18px; color: var(--text); font-size: 14px; }
.info-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 20px; }
dt { color: var(--text-muted); font-size: 10px; }
dd { margin: 6px 0 0; color: var(--text); font-size: 12px; font-weight: 500; overflow-wrap: anywhere; }
.wide { grid-column: 1 / -1; }
.side-column { display: grid; gap: 16px; align-content: start; }
.cost-list { display: grid; gap: 13px; }
.cost-list > div { display: flex; justify-content: space-between; gap: 12px; }
.cost-list dd { margin: 0; }
.cost-list .total { padding-top: 13px; border-top: 1px solid var(--border); font-weight: 700; }
.cost-list .total dt, .cost-list .total dd { color: var(--text); font-weight: 700; }
.cost-list dd.over-budget { color: #b42318; }
.cost-list dd.under-budget { color: #15803d; }
.cost-note, .decision-note { margin: 13px 0 0; color: var(--text-muted); font-size: 10px; line-height: 1.5; }
.list-panel { grid-column: 1 / -1; }
.need-list, .document-list, .approval-list { display: grid; gap: 10px; margin: 0; padding: 0; list-style: none; }
.need-list li { display: flex; flex-wrap: wrap; gap: 8px; padding-bottom: 10px; border-bottom: 1px solid #edf0f4; font-size: 11px; }
.need-list li:last-child, .approval-list li:last-child { padding-bottom: 0; border-bottom: none; }
.need-list strong { color: var(--text); font-weight: 600; }
.need-list span, .empty-text { color: var(--text-muted); font-size: 11px; }
.document-list a { color: var(--primary); font-size: 11px; font-weight: 600; }
.approval-list li { display: grid; gap: 6px; padding-bottom: 10px; border-bottom: 1px solid #edf0f4; }
.approval-head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; }
.approval-meta { color: var(--text-muted); font-size: 10px; }
.approval-note { color: var(--text); font-size: 11px; line-height: 1.5; }
.decision-panel { grid-column: 1 / -1; }
.decision-panel label { display: block; margin-bottom: 7px; color: var(--text); font-size: 11px; font-weight: 600; }
textarea { width: 100%; resize: vertical; padding: 11px; border: 1px solid var(--border); border-radius: 7px; background: #f8fafc; color: var(--text); font: inherit; font-size: 11px; }
textarea:disabled { cursor: not-allowed; opacity: 0.7; }
.decision-error { margin: 10px 0 0; color: #b42318; font-size: 11px; font-weight: 600; }
.actions { display: flex; justify-content: flex-end; gap: 10px; margin-top: 16px; }
.actions button { min-height: 39px; padding: 0 15px; border-radius: 7px; font: inherit; font-size: 11px; font-weight: 600; }
.reject-button { border: 1px solid #efc7c7; background: #fff7f7; color: #b42318; }
.approve-button { border: 1px solid var(--primary); background: var(--primary); color: #fff; }
.actions button:disabled { cursor: not-allowed; opacity: 0.55; }
.loading-panel { margin-top: 16px; color: var(--text-muted); font-size: 12px; text-align: center; }
.data-error { display: flex; flex-direction: column; gap: 5px; padding: 14px 16px; border: 1px solid #f3c7c7; border-radius: 8px; background: #fff7f7; color: #b42318; font-size: 12px; line-height: 1.5; }
.data-error strong { font-size: 12px; }
@media (max-width: 900px) { .detail-grid { grid-template-columns: 1fr; } .decision-panel, .list-panel { grid-column: auto; } .side-column { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
@media (max-width: 650px) { .atasan-page { padding: 18px 15px; } .page-header { align-items: flex-start; flex-direction: column; } .page-header h1 { font-size: 21px; } .side-column { grid-template-columns: 1fr; } .info-grid { gap: 15px; } .actions { flex-direction: column-reverse; } .actions button { width: 100%; min-height: 44px; } }
</style>
