<template>
  <div class="atasan-page">
    <div class="breadcrumb"><NuxtLink to="/atasan/dashboard">Dashboard</NuxtLink><span>›</span><NuxtLink to="/atasan/perjalanan-tim">Perjalanan Tim</NuxtLink><span>›</span><strong>Detail</strong></div>
    <header class="page-header">
      <div><p class="eyebrow">ID Perjalanan: {{ tripId }}</p><h1>Detail Perjalanan Tim</h1></div>
      <span v-if="trip" class="status" :class="tripStatusClass(trip.status)">{{ tripStatusLabel(trip.status) }}</span>
      <span v-else class="status">Status belum tersedia</span>
    </header>

    <div v-if="error" class="data-error" role="alert">
      <strong>Data gagal dimuat</strong>
      <span>{{ error }}</span>
    </div>

    <div v-if="loading && !trip" class="panel loading-panel">Memuat detail perjalanan...</div>

    <template v-else-if="trip">
      <section class="panel">
        <h2>Informasi Pegawai dan Perjalanan</h2>
        <dl class="info-grid">
          <div><dt>Nama Pegawai</dt><dd>{{ trip.user?.name ?? '—' }}</dd></div><div><dt>Departemen</dt><dd>{{ trip.user?.department ?? '—' }}</dd></div>
          <div><dt>Tujuan</dt><dd>{{ trip.tujuan }}</dd></div><div><dt>Status Pelaksanaan</dt><dd>{{ tripStatusLabel(trip.status) }}</dd></div>
          <div><dt>Tanggal Berangkat</dt><dd>{{ formatDate(trip.tanggal_berangkat) }}</dd></div><div><dt>Tanggal Kembali</dt><dd>{{ formatDate(trip.tanggal_pulang) }}</dd></div>
          <div><dt>Estimasi Anggaran</dt><dd>{{ formatCurrencyOrDash(trip.estimasi_biaya) }}</dd></div>
          <div><dt>Realisasi Biaya</dt><dd>{{ formatCurrency(trip.total_biaya) }}</dd></div>
          <div><dt>Selisih</dt><dd :class="varianceClass">{{ formatCurrencyOrDash(trip.selisih_biaya) }}</dd></div>
          <div><dt>Transportasi / Penginapan</dt><dd>{{ needSummary }}</dd></div>
          <div class="wide"><dt>Keperluan Perjalanan</dt><dd>{{ trip.keperluan }}</dd></div>
        </dl>
      </section>

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
        <p v-else class="empty-text">Belum ada riwayat keputusan untuk perjalanan ini.</p>
      </section>

      <NuxtLink to="/atasan/perjalanan-tim" class="back-link">Kembali ke Perjalanan Tim</NuxtLink>
    </template>

    <div v-else class="panel loading-panel">Detail perjalanan tidak dapat dimuat.</div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { Trip } from '~/types/api'
import { useTrips } from '~/composables/useTrips'
import { formatCurrency, formatDate, tripStatusClass, tripStatusLabel } from '~/utils/format'

definePageMeta({ layout: 'atasan' })

const route = useRoute()
const tripId = computed(() => String(route.params.id ?? ''))
const trip = ref<Trip | null>(null)

const { fetchTrip, loading, error } = useTrips()

const needLabel = (jenis: string) => {
  if (jenis === 'transportasi') return 'Transportasi'
  if (jenis === 'penginapan') return 'Penginapan'
  return jenis
}

const formatCurrencyOrDash = (value: number | null | undefined) =>
  value === null || value === undefined ? '—' : formatCurrency(value)

const varianceClass = computed(() => {
  const variance = trip.value?.selisih_biaya
  if (variance === null || variance === undefined || variance === 0) return ''
  return variance > 0 ? 'over-budget' : 'under-budget'
})

const needSummary = computed(() => {
  const needs = trip.value?.needs ?? []
  if (needs.length === 0) return '—'

  return needs
    .map((need) => `${needLabel(need.jenis)}${need.keterangan ? `: ${need.keterangan}` : ''}`)
    .join(', ')
})

onMounted(async () => {
  try {
    trip.value = await fetchTrip(tripId.value)
  } catch {
    // Pesan error sudah disimpan oleh composable.
  }
})
</script>

<style scoped>
.atasan-page { min-height: calc(100vh - 70px); padding: 26px 28px; background: #f5f6f8; }
.breadcrumb { display: flex; flex-wrap: wrap; gap: 9px; margin-bottom: 8px; color: #8792a3; font-size: 11px; }
.breadcrumb a, .back-link { color: var(--primary); }
.breadcrumb strong { color: var(--text); font-weight: 600; }
.page-header { display: flex; align-items: center; justify-content: space-between; gap: 15px; margin-bottom: 18px; }
.eyebrow { margin: 0 0 5px; color: var(--text-muted); font-size: 11px; }
h1 { margin: 0; color: var(--text); font-size: 24px; }
.status { display: inline-block; padding: 7px 10px; border-radius: 20px; background: #edf1f7; color: #667085; font-size: 10px; white-space: nowrap; }
.status.approved { background: #e8f7ef; color: #15803d; }
.status.rejected { background: #fdecec; color: #b42318; }
.status.ongoing { background: #e8efff; color: #315bb5; }
.status.completed { background: #eaf7f1; color: #15803d; }
.status.draft { background: #eef1f5; color: #667085; }
.panel { margin-top: 16px; padding: 20px; border: 1px solid var(--border); border-radius: 10px; background: #fff; }
.panel h2 { margin: 0 0 20px; color: var(--text); font-size: 14px; }
.info-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 20px; }
dt { color: var(--text-muted); font-size: 10px; }
dd { margin: 6px 0 0; color: var(--text); font-size: 12px; overflow-wrap: anywhere; }
dd.over-budget { color: #b42318; font-weight: 600; }
dd.under-budget { color: #15803d; font-weight: 600; }
.wide { grid-column: 1 / -1; }
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
.back-link { display: inline-flex; margin-top: 24px; font-size: 11px; font-weight: 600; }
.loading-panel { color: var(--text-muted); font-size: 12px; text-align: center; }
.data-error { display: flex; flex-direction: column; gap: 5px; padding: 14px 16px; border: 1px solid #f3c7c7; border-radius: 8px; background: #fff7f7; color: #b42318; font-size: 12px; line-height: 1.5; }
.data-error strong { font-size: 12px; }
@media (max-width: 650px) { .atasan-page { padding: 18px 15px; } .page-header { align-items: flex-start; flex-direction: column; } h1 { font-size: 21px; } }
</style>
