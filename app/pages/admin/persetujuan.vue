<template>
  <div class="approval-page">

    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <NuxtLink to="/dashboard">Dashboard</NuxtLink>
      <AppIcon name="chevron-right" class="crumb-sep" />
      <strong>Persetujuan</strong>
    </div>

    <!-- Header -->
    <div class="page-header">
      <h1>Persetujuan Perjalanan</h1>

      <LayoutPageactions />
    </div>

    <!-- Tabs -->
    <div class="tabs">
      <button
        :class="{ active: activeTab === 'waiting' }"
        @click="activeTab = 'waiting'"
      >
        Menunggu Persetujuan <span class="tab-count">{{ tabCounts.waiting }}</span>
      </button>

      <button
        :class="{ active: activeTab === 'approved' }"
        @click="activeTab = 'approved'"
      >
        Disetujui <span class="tab-count">{{ tabCounts.approved }}</span>
      </button>

      <button
        :class="{ active: activeTab === 'rejected' }"
        @click="activeTab = 'rejected'"
      >
        Ditolak <span class="tab-count">{{ tabCounts.rejected }}</span>
      </button>
    </div>

    <div v-if="error || actionError" class="data-error" role="alert">
      {{ actionError || error }}
    </div>

    <!-- Reject Panel -->
    <div v-if="rejectingId" class="reject-panel">
      <p class="reject-title">Tolak pengajuan {{ rejectingName }}</p>
      <textarea
        v-model="rejectNote"
        rows="3"
        placeholder="Tulis alasan penolakan (wajib)..."
      />
      <div class="reject-actions">
        <button class="reject-cancel" type="button" :disabled="actionLoadingId !== null" @click="cancelReject">
          Batal
        </button>
        <button class="reject-confirm" type="button" :disabled="actionLoadingId !== null" @click="confirmReject">
          {{ actionLoadingId !== null ? 'Memproses...' : 'Konfirmasi Tolak' }}
        </button>
      </div>
    </div>

    <!-- Approval Card -->
    <div class="approval-card">

      <div
        v-for="request in filteredRequests"
        :key="request.id"
        class="approval-item"
      >

        <!-- Avatar -->
        <div
          class="avatar"
          :class="request.avatarClass"
        >
          {{ request.initial }}
        </div>

        <!-- Information -->
        <div class="request-info">

          <div class="name-row">
            <h3>{{ request.name }}</h3>
            <span>• {{ request.position }}</span>
          </div>

          <p class="route">
            {{ request.route }}
          </p>

          <p class="purpose">
            {{ request.purpose }}
          </p>

          <p class="date">
            Tanggal: {{ request.date }}
          </p>

          <p v-if="request.levelLabel" class="level">
            {{ request.levelLabel }}
          </p>

        </div>

        <!-- Action -->
        <div
          v-if="activeTab === 'waiting'"
          class="request-actions"
        >
          <button
            class="reject-button"
            :disabled="actionLoadingId === request.id"
            @click="startReject(request)"
          >
            Tolak
          </button>

          <button
            class="approve-button"
            :disabled="actionLoadingId === request.id"
            @click="approveRequest(request)"
          >
            {{ actionLoadingId === request.id ? 'Memproses...' : 'Setujui' }}
          </button>
        </div>

        <div v-else class="request-status">
          <span class="status-badge" :class="request.statusClass">{{ request.statusLabel }}</span>
        </div>

      </div>

      <!-- Empty -->
      <div
        v-if="loading && filteredRequests.length === 0"
        class="empty-state"
      >
        Memuat data persetujuan...
      </div>
      <div
        v-else-if="filteredRequests.length === 0"
        class="empty-state"
      >
        Tidak ada data persetujuan.
      </div>

    </div>

    <!-- Footer -->
    <div class="approval-footer">

      <span>
        Menampilkan {{ filteredRequests.length }} dari {{ requests.length }} data
      </span>

      <button type="button" :disabled="loading" @click="refresh">
        {{ loading ? 'Memuat...' : 'Muat Ulang' }}
      </button>

    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { TripStatus } from '~/types/api'
import { useTrips } from '~/composables/useTrips'
import { useApprovals } from '~/composables/useApprovals'
import { apiErrorMessage } from '~/composables/useApi'
import { formatDateRange, tripStatusClass, tripStatusLabel } from '~/utils/format'

type Tab = 'waiting' | 'approved' | 'rejected'

interface ApprovalRequest {
  id: number
  userId: number | null
  name: string
  position: string
  route: string
  purpose: string
  date: string
  status: TripStatus
  statusLabel: string
  statusClass: string
  levelLabel: string | null
  initial: string
  avatarClass: string
}

const { trips, loading, error, fetchTrips } = useTrips()
const { approve, reject } = useApprovals()
const { user } = useAuth()

const activeTab = ref<Tab>('waiting')
const actionLoadingId = ref<number | null>(null)
const actionError = ref('')
const rejectingId = ref<number | null>(null)
const rejectingName = ref('')
const rejectNote = ref('')

const TAB_STATUS: Record<Tab, TripStatus> = {
  waiting: 'diajukan',
  approved: 'disetujui',
  rejected: 'ditolak',
}

const AVATAR_CLASSES = ['red', 'blue', 'orange', 'green', 'purple']

const avatarClass = (name: string) => AVATAR_CLASSES[name.charCodeAt(0) % AVATAR_CLASSES.length] ?? 'blue'

const dayCount = (start: string, end: string) => {
  const startDate = new Date(start).getTime()
  const endDate = new Date(end).getTime()
  if (Number.isNaN(startDate) || Number.isNaN(endDate)) return 1
  return Math.max(1, Math.round((endDate - startDate) / 86_400_000) + 1)
}

const requests = computed<ApprovalRequest[]>(() => trips.value.map((trip) => ({
  id: trip.id,
  userId: trip.user?.id ?? null,
  name: trip.user?.name ?? '—',
  position: trip.user?.department ?? '—',
  route: trip.tujuan,
  purpose: trip.keperluan,
  date: `${formatDateRange(trip.tanggal_berangkat, trip.tanggal_pulang)} (${dayCount(trip.tanggal_berangkat, trip.tanggal_pulang)} hari)`,
  status: trip.status,
  statusLabel: trip.statusLabel ?? tripStatusLabel(trip.status),
  statusClass: tripStatusClass(trip.status),
  levelLabel: trip.status === 'diajukan' ? (trip.approval_level_label ?? null) : null,
  initial: (trip.user?.name ?? '?').charAt(0).toUpperCase(),
  avatarClass: avatarClass(trip.user?.name ?? '?'),
})))

const filteredRequests = computed(() => requests.value.filter((request) => {
  if (request.status !== TAB_STATUS[activeTab.value]) return false
  if (activeTab.value === 'waiting' && String(request.userId) === String(user.value?.id)) return false
  return true
}))

const tabCounts = computed(() => ({
  waiting: requests.value.filter((request) => request.status === 'diajukan' && String(request.userId) !== String(user.value?.id)).length,
  approved: requests.value.filter((request) => request.status === 'disetujui').length,
  rejected: requests.value.filter((request) => request.status === 'ditolak').length,
}))

const refresh = async () => {
  await fetchTrips({ page: 1 })
}

const approveRequest = async (request: ApprovalRequest) => {
  actionError.value = ''
  actionLoadingId.value = request.id

  try {
    await approve(request.id)
    await refresh()
  } catch (err) {
    actionError.value = apiErrorMessage(err, 'Gagal menyetujui pengajuan.')
  } finally {
    actionLoadingId.value = null
  }
}

const startReject = (request: ApprovalRequest) => {
  actionError.value = ''
  rejectingId.value = request.id
  rejectingName.value = request.name
  rejectNote.value = ''
}

const cancelReject = () => {
  rejectingId.value = null
  rejectingName.value = ''
  rejectNote.value = ''
}

const confirmReject = async () => {
  if (!rejectingId.value) return

  actionError.value = ''

  if (!rejectNote.value.trim()) {
    actionError.value = 'Alasan penolakan wajib diisi.'
    return
  }

  actionLoadingId.value = rejectingId.value

  try {
    await reject(rejectingId.value, rejectNote.value.trim())
    cancelReject()
    await refresh()
  } catch (err) {
    actionError.value = apiErrorMessage(err, 'Gagal menolak pengajuan.')
  } finally {
    actionLoadingId.value = null
  }
}

onMounted(() => {
  refresh().catch(() => {})
})
</script>

<style scoped>
/* =========================
   PAGE
========================= */

.approval-page {
  width: 100%;
  min-height: calc(100vh - 70px);
  padding: 24px 28px;
  background: #f5f6f8;
}

/* =========================
   BREADCRUMB
========================= */

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 9px;

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

/* =========================
   HEADER
========================= */

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

/* =========================
   TABS
========================= */

.tabs {
  display: flex;
  align-items: center;
  gap: 26px;

  height: 37px;

  border-bottom: 1px solid #dfe3ea;

  margin-bottom: 24px;
}

.tabs button {
  position: relative;

  height: 37px;

  padding: 0;

  border: none;
  background: transparent;

  color: #718096;

  font-family: inherit;
  font-size: 10px;

  cursor: pointer;
}

.tabs button.active {
  color: var(--primary);
  font-weight: 600;
}

.tabs button.active::after {
  content: "";

  position: absolute;

  left: 0;
  right: 0;
  bottom: -1px;

  height: 2px;

  background: var(--primary);
}

.tab-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;

  min-width: 17px;
  height: 17px;

  margin-left: 4px;
  padding: 0 4px;

  border-radius: 20px;

  background: #eef1f7;
  color: #667085;

  font-size: 8px;
  font-weight: 700;
}

.tabs button.active .tab-count {
  background: #e8efff;
  color: var(--primary);
}

.data-error {
  margin-bottom: 16px;
  padding: 11px 14px;

  border: 1px solid #f4c7c7;
  border-radius: 8px;

  background: #fff5f5;
  color: #b42318;

  font-size: 10px;
}

/* =========================
   REJECT PANEL
========================= */

.reject-panel {
  margin-bottom: 18px;
  padding: 15px 16px;

  background: var(--white);
  border: 1px solid #f4c7c7;
  border-radius: 10px;
}

.reject-title {
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
  font-family: inherit;
  font-size: 10px;
  resize: vertical;
}

.reject-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;

  margin-top: 10px;
}

.reject-actions button {
  min-height: 30px;
  padding: 0 13px;

  border-radius: 5px;

  font-family: inherit;
  font-size: 9px;
  font-weight: 600;

  cursor: pointer;
}

.reject-cancel {
  border: 1px solid #dce2eb;
  background: var(--white);
  color: #667085;
}

.reject-confirm {
  border: 1px solid #ef4444;
  background: #ef4444;
  color: #fff;
}

.reject-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* =========================
   CARD
========================= */

.approval-card {
  padding: 0 16px;

  background: var(--white);

  border: 1px solid var(--border);
  border-radius: 11px;
}

/* =========================
   ITEM
========================= */

.approval-item {
  min-height: 94px;

  display: flex;
  align-items: center;

  gap: 12px;

  border-bottom: 1px solid #e5e8ee;
}

.approval-item:last-child {
  border-bottom: none;
}

/* =========================
   AVATAR
========================= */

.avatar {
  width: 30px;
  height: 30px;

  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  color: var(--white);

  font-size: 15px;
  font-weight: 600;
}

.avatar.red {
  background: #ef4444;
}

.avatar.blue {
  background: #2563eb;
}

.avatar.orange {
  background: #f59e0b;
}

.avatar.green {
  background: #10b981;
}

.avatar.purple {
  background: #8b5cf6;
}

/* =========================
   INFORMATION
========================= */

.request-info {
  flex: 1;
  min-width: 0;
}

.name-row {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 5px;
}

.name-row h3 {
  margin: 0;

  font-size: 11px;
  font-weight: 700;

  color: var(--text);
}

.name-row span {
  font-size: 8px;
  color: #7b8aa0;
}

.route {
  margin: 3px 0 0;

  font-size: 10px;
  font-weight: 600;

  color: var(--primary);
}

.purpose {
  margin: 2px 0 0;

  font-size: 8px;
  color: #718096;
}

.date {
  margin: 3px 0 0;

  font-size: 8px;
  color: #9aa4b5;
}

.level {
  margin: 4px 0 0;

  display: inline-block;

  padding: 3px 8px;

  border-radius: 4px;

  background: #eef2ff;

  color: var(--primary);

  font-size: 8px;
  font-weight: 600;
}

/* =========================
   ACTION
========================= */

.request-actions {
  display: flex;
  align-items: center;
  gap: 9px;
}

.request-actions button {
  height: 26px;

  padding: 0 12px;

  border-radius: 5px;

  font-family: inherit;
  font-size: 9px;

  cursor: pointer;
}

.request-actions button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.request-status {
  display: flex;
  align-items: center;
  flex-shrink: 0;
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

.reject-button {
  border: 1px solid #ff5b5b;

  background: var(--white);

  color: #ef4444;
}

.reject-button:hover {
  background: #fff1f1;
}

.approve-button {
  border: 1px solid #10b981;

  background: var(--white);

  color: #10a779;
}

.approve-button:hover {
  background: #edfff8;
}

/* =========================
   EMPTY
========================= */

.empty-state {
  padding: 45px 20px;

  text-align: center;

  font-size: 10px;
  color: #9aa4b5;
}

/* =========================
   FOOTER
========================= */

.approval-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;

  margin-top: 22px;

  font-size: 9px;
  color: #718096;
}

.approval-footer button {
  border: none;
  background: transparent;

  color: var(--primary);

  font-family: inherit;
  font-size: 9px;
  font-weight: 600;

  cursor: pointer;
}

/* =========================
   RESPONSIVE
========================= */

@media (max-width: 767px) {
  .approval-page {
    padding: 16px;
  }

  .page-header h1 {
    font-size: 20px;
  }

  .tabs {
    gap: 18px;

    height: auto;
    min-height: 40px;

    margin-bottom: 18px;

    overflow-x: auto;
  }

  .tabs button {
    height: 40px;

    flex-shrink: 0;

    font-size: 11px;
  }

  .approval-card {
    padding: 0 14px;
  }

  .approval-item {
    display: grid;
    grid-template-columns: 30px minmax(0, 1fr);
    column-gap: 12px;

    align-items: start;

    min-height: 0;
    padding: 16px 0;
  }

  .avatar {
    grid-column: 1;
  }

  .request-info {
    grid-column: 2;
  }

  .name-row h3 {
    font-size: 12px;
  }

  .name-row span {
    font-size: 10px;
  }

  .route {
    font-size: 11px;
  }

  .purpose,
  .date {
    font-size: 10px;
  }

  .request-actions {
    grid-column: 2;

    flex-direction: row;
    gap: 8px;

    margin-top: 12px;
  }

  .request-status {
    grid-column: 2;

    margin-top: 10px;
  }

  .request-actions button {
    flex: 1;

    width: auto;
    min-height: 40px;

    font-size: 12px;
  }

  .approval-footer {
    flex-wrap: wrap;
    gap: 10px;

    margin-top: 18px;

    font-size: 11px;
  }

  .approval-footer button {
    min-height: 36px;

    padding: 0 4px;

    font-size: 11px;
  }
}

@media (max-width: 374px) {
  .approval-page {
    padding: 12px;
  }

  .approval-card {
    padding: 0 12px;
  }
}
</style>    