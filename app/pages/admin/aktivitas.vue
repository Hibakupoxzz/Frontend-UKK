<template>
  <div class="activity-page">
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <NuxtLink to="/dashboard">Dashboard</NuxtLink>
      <AppIcon name="chevron-right" class="crumb-sep" />
      <strong>Log Aktivitas</strong>
    </div>

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1>Log Aktivitas</h1>
        <p>Riwayat aksi penting pengguna pada sistem.</p>
      </div>

      <LayoutPageactions />
    </div>

    <div v-if="error" class="state-banner error-banner" role="alert">
      <span>{{ error }}</span>
      <button type="button" :disabled="loading" @click="reload">Coba Lagi</button>
    </div>

    <!-- Filter -->
    <div class="filter-card">
      <div class="filter-group">
        <label for="filter-action">Jenis Aksi</label>
        <select id="filter-action" v-model="filterAction">
          <option value="">Semua Aksi</option>
          <option v-for="(label, action) in actions" :key="action" :value="action">
            {{ label }}
          </option>
        </select>
      </div>
    </div>

    <!-- Table -->
    <div class="table-card">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Waktu</th>
              <th>Pelaku</th>
              <th>Aksi</th>
              <th>Deskripsi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && items.length === 0">
              <td colspan="4" class="table-state">Memuat log aktivitas...</td>
            </tr>
            <tr v-else-if="items.length === 0">
              <td colspan="4" class="table-state">Belum ada aktivitas yang tercatat.</td>
            </tr>
            <tr v-for="item in items" :key="item.id">
              <td>{{ formatDateTime(item.created_at) }}</td>
              <td>{{ item.actor?.name ?? 'Sistem' }}</td>
              <td>
                <span class="status-badge">{{ item.action_label }}</span>
              </td>
              <td>{{ item.description }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div class="table-footer">
        <span class="showing-text">
          Menampilkan {{ items.length }} dari {{ meta?.total ?? items.length }} catatan
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
import { onMounted, ref, watch } from 'vue'
import { useActivityLogs } from '~/composables/useActivityLogs'

const { items, actions, meta, loading, error, fetchLogs } = useActivityLogs()

const page = ref(1)
const filterAction = ref('')

const formatDateTime = (value: string | null) => {
  if (!value) return '—'

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
  page.value = 1
  await fetchLogs({ action: filterAction.value || undefined, page: 1 }).catch(() => {})
}

const changePage = async (value: number) => {
  const lastPage = meta.value?.last_page ?? 1
  if (value < 1 || value > lastPage || value === page.value) return
  page.value = value
  await fetchLogs({ action: filterAction.value || undefined, page: value }).catch(() => {})
}

watch(filterAction, () => {
  void reload()
})

onMounted(() => {
  void reload()
})
</script>

<style scoped>
.activity-page {
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
.filter-group select {
  min-width: 200px;
  padding: 8px 10px;
  border: 1px solid #dce2eb;
  border-radius: 6px;
  background: var(--white);
  color: var(--text);
  font-family: inherit;
  font-size: 10px;
  outline: none;
}

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

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 9px;
  border-radius: 5px;
  background: #eef1f5;
  color: #667085;
  font-size: 9px;
  font-weight: 600;
  white-space: nowrap;
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
  .activity-page { padding: 16px; }
  .page-header h1 { font-size: 20px; }
}
</style>
