<template>
  <div class="hrd-approval-page">
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <NuxtLink to="/dashboard">Dashboard</NuxtLink>
      <AppIcon name="chevron-right" class="crumb-sep" />
      <NuxtLink to="/hrd/dashboard">HRD</NuxtLink>
      <AppIcon name="chevron-right" class="crumb-sep" />
      <strong>Persetujuan Akhir</strong>
    </div>

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1>Persetujuan Akhir HRD</h1>
        <p>Pengajuan yang sudah disetujui atasan dan menunggu keputusan final.</p>
      </div>

      <LayoutPageactions />
    </div>

    <div v-if="error" class="state-banner error-banner" role="alert">
      <span>{{ error }}</span>
      <button type="button" :disabled="loading" @click="reload">Coba Lagi</button>
    </div>

    <!-- Summary -->
    <div class="summary-grid">
      <div class="summary-card">
        <p>Menunggu Keputusan</p>
        <h2>{{ meta?.total ?? approvals.length }}</h2>
      </div>
      <div class="summary-card">
        <p>Total Estimasi Antrean</p>
        <h2>{{ formatCurrency(totalEstimasi) }}</h2>
      </div>
    </div>

    <!-- Table -->
    <div class="table-card">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>No</th>
              <th>Pegawai</th>
              <th>Departemen</th>
              <th>Tujuan</th>
              <th>Tanggal</th>
              <th>Estimasi / Realisasi</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && approvals.length === 0">
              <td colspan="7" class="table-state">Memuat antrean persetujuan...</td>
            </tr>
            <tr v-else-if="approvals.length === 0">
              <td colspan="7" class="table-state">Tidak ada pengajuan menunggu keputusan akhir.</td>
            </tr>
            <template v-for="(item, index) in approvals" :key="item.id">
              <tr>
                <td>{{ rowOffset + index + 1 }}</td>
                <td>{{ item.user?.name ?? '—' }}</td>
                <td>{{ item.user?.department ?? '—' }}</td>
                <td>{{ item.tujuan }}</td>
                <td>{{ formatDate(item.tanggal_berangkat) }}</td>
                <td>
                  {{ item.estimasi_biaya === null ? '—' : formatCurrency(item.estimasi_biaya) }}
                  / {{ formatCurrency(item.total_biaya) }}
                </td>
                <td>
                  <div class="row-actions">
                    <NuxtLink :to="`/hrd/detail-perjalanan/${item.id}`" class="detail-link">Detail</NuxtLink>
                    <button
                      type="button"
                      class="approve-button"
                      :disabled="actingId === item.id"
                      @click="handleApprove(item.id)"
                    >
                      {{ actingId === item.id ? '...' : 'Setujui' }}
                    </button>
                    <button
                      type="button"
                      class="reject-button"
                      :disabled="actingId === item.id"
                      @click="toggleReject(item.id)"
                    >
                      Tolak
                    </button>
                  </div>
                </td>
              </tr>
              <tr v-if="rejectingId === item.id">
                <td colspan="7" class="reject-cell">
                  <p v-if="actionError" class="form-message error" role="alert">{{ actionError }}</p>
                  <div class="reject-form">
                    <input
                      v-model="rejectNote"
                      type="text"
                      placeholder="Alasan penolakan (wajib)"
                      :disabled="actingId === item.id"
                    />
                    <button
                      type="button"
                      class="reject-button"
                      :disabled="actingId === item.id || !rejectNote.trim()"
                      @click="handleReject(item.id)"
                    >
                      {{ actingId === item.id ? 'Memproses...' : 'Konfirmasi Tolak' }}
                    </button>
                  </div>
                </td>
              </tr>
            </template>
          </tbody>
        </table>
      </div>

      <p v-if="actionMessage" class="form-message success" role="status">{{ actionMessage }}</p>

      <div class="table-footer">
        <span class="showing-text">
          Menampilkan {{ approvals.length }} dari {{ meta?.total ?? approvals.length }} pengajuan
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
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useApprovals } from '~/composables/useApprovals'
import { apiErrorMessage } from '~/composables/useApi'
import { formatCurrency, formatDate } from '~/utils/format'

const { approvals, meta, loading, error, fetchApprovals, approve, reject } = useApprovals()

const page = ref(1)
const actingId = ref<number | null>(null)
const rejectingId = ref<number | null>(null)
const rejectNote = ref('')
const actionError = ref('')
const actionMessage = ref('')

const totalEstimasi = computed(() =>
  approvals.value.reduce((sum, trip) => sum + Number(trip.estimasi_biaya ?? 0), 0),
)

const rowOffset = computed(() => ((meta.value?.current_page ?? 1) - 1) * (meta.value?.per_page ?? 0))

const reload = async () => {
  page.value = 1
  await fetchApprovals(1).catch(() => {})
}

const changePage = async (value: number) => {
  const lastPage = meta.value?.last_page ?? 1
  if (value < 1 || value > lastPage || value === page.value) return
  page.value = value
  await fetchApprovals(value).catch(() => {})
}

const handleApprove = async (id: number) => {
  actingId.value = id
  actionError.value = ''
  actionMessage.value = ''

  try {
    await approve(id)
    actionMessage.value = 'Pengajuan disetujui final.'
    await fetchApprovals(page.value).catch(() => {})
  } catch (err) {
    actionError.value = apiErrorMessage(err, 'Gagal menyetujui pengajuan.')
  } finally {
    actingId.value = null
  }
}

const toggleReject = (id: number) => {
  actionError.value = ''
  rejectingId.value = rejectingId.value === id ? null : id
  rejectNote.value = ''
}

const handleReject = async (id: number) => {
  if (!rejectNote.value.trim()) {
    actionError.value = 'Alasan penolakan wajib diisi.'
    return
  }

  actingId.value = id
  actionError.value = ''
  actionMessage.value = ''

  try {
    await reject(id, rejectNote.value.trim())
    actionMessage.value = 'Pengajuan ditolak.'
    rejectingId.value = null
    rejectNote.value = ''
    await fetchApprovals(page.value).catch(() => {})
  } catch (err) {
    actionError.value = apiErrorMessage(err, 'Gagal menolak pengajuan.')
  } finally {
    actingId.value = null
  }
}

onMounted(() => {
  void reload()
})
</script>

<style scoped>
.hrd-approval-page {
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
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

.row-actions { display: flex; align-items: center; gap: 8px; }

.detail-link { color: var(--primary); font-size: 10px; font-weight: 600; text-decoration: none; }
.detail-link:hover { text-decoration: underline; }

.approve-button {
  padding: 5px 10px;
  border: 1px solid var(--primary);
  border-radius: 5px;
  background: var(--primary);
  color: #fff;
  font-family: inherit;
  font-size: 9px;
  font-weight: 600;
  cursor: pointer;
}

.reject-button {
  padding: 5px 10px;
  border: 1px solid #efc4c4;
  border-radius: 5px;
  background: var(--white);
  color: #b42318;
  font-family: inherit;
  font-size: 9px;
  font-weight: 600;
  cursor: pointer;
}

.approve-button:disabled,
.reject-button:disabled { cursor: not-allowed; opacity: 0.6; }

.reject-cell { background: #fff7f7; }

.reject-form { display: flex; gap: 8px; }

.reject-form input {
  flex: 1;
  min-width: 0;
  padding: 7px 9px;
  border: 1px solid #dce2eb;
  border-radius: 6px;
  background: var(--white);
  color: var(--text);
  font-family: inherit;
  font-size: 10px;
  outline: none;
}

.reject-form input:focus { border-color: var(--primary); }

.form-message {
  margin: 12px 16px 0;
  padding: 9px 11px;
  border: 1px solid transparent;
  border-radius: 7px;
  font-size: 10px;
  line-height: 1.5;
}

.form-message.error { border-color: #f4c7c7; background: #fff5f5; color: #b42318; }
.form-message.success { border-color: #b7e4d1; background: #f0fdf7; color: #0f7b58; }

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
  .hrd-approval-page { padding: 16px; }
  .page-header h1 { font-size: 20px; }
  .summary-grid { grid-template-columns: 1fr; }
}
</style>
