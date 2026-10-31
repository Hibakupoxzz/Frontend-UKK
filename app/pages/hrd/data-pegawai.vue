<template>
  <div class="data-pegawai-page">
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <NuxtLink to="/dashboard">Dashboard</NuxtLink>
      <span>›</span>
      <NuxtLink to="/hrd/dashboard">HRD</NuxtLink>
      <span>›</span>
      <strong>Data Pegawai</strong>
    </div>

    <!-- Header -->
    <div class="page-header">
      <h1>Data Pegawai</h1>
    </div>

    <!-- Filter Card -->
    <div class="filter-card">
      <div class="filter-group search-group">
        <label>Cari Pegawai / ID</label>
        <div class="search-input">
          <svg viewBox="0 0 24 24"><path d="M10.5 4a6.5 6.5 0 1 0 4.08 11.56l4.43 4.43 1.41-1.41-4.43-4.43A6.5 6.5 0 0 0 10.5 4Zm0 2a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Z"/></svg>
          <input v-model="search" type="text" placeholder="Cari pegawai..." />
        </div>
      </div>

      <div class="filter-group">
        <label>Departemen</label>
        <select v-model="selectedDepartment">
          <option value="">Semua Departemen</option>
          <option v-for="department in departments" :key="department" :value="department">{{ department }}</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Role</label>
        <select v-model="selectedRole">
          <option value="">Semua Role</option>
          <option v-for="role in roleOptions" :key="role.value" :value="role.value">{{ role.label }}</option>
        </select>
      </div>
    </div>

    <div v-if="error" class="data-error" role="alert">{{ error }}</div>

    <!-- Table Card -->
    <div class="table-card">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th class="no-column">No</th>
              <th>ID Pegawai</th>
              <th>Nama</th>
              <th>Departemen</th>
              <th>Role</th>
              <th>Email</th>
              <th>Atasan</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && pegawai.length === 0">
              <td colspan="7" class="table-state">Memuat data pegawai...</td>
            </tr>
            <tr v-else-if="filteredPegawai.length === 0">
              <td colspan="7" class="table-state">{{ search || selectedDepartment || selectedRole ? 'Tidak ada pegawai yang cocok dengan filter.' : 'Belum ada data pegawai.' }}</td>
            </tr>
            <tr v-for="(pegawaiItem, index) in filteredPegawai" :key="pegawaiItem.id">
              <td>{{ index + 1 }}</td>
              <td>PG-{{ pegawaiItem.id }}</td>
              <td>{{ pegawaiItem.name }}</td>
              <td>{{ pegawaiItem.department }}</td>
              <td><span class="role-badge">{{ pegawaiItem.position }}</span></td>
              <td>{{ pegawaiItem.email }}</td>
              <td>{{ pegawaiItem.atasan }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div class="pegawai-cards">
        <article v-for="(pegawaiItem, index) in filteredPegawai" :key="`card-${pegawaiItem.id}`" class="pegawai-card">
          <div class="pegawai-card-header">
            <span class="pegawai-card-number">#{{ index + 1 }}</span>
            <span class="role-badge">{{ pegawaiItem.position }}</span>
          </div>
          <div class="pegawai-card-title">{{ pegawaiItem.name }}</div>
          <div class="pegawai-card-subtitle">{{ pegawaiItem.department }}</div>
          <dl class="pegawai-card-details">
            <div>
              <dt>ID Pegawai</dt>
              <dd>PG-{{ pegawaiItem.id }}</dd>
            </div>
            <div>
              <dt>Email</dt>
              <dd>{{ pegawaiItem.email }}</dd>
            </div>
            <div>
              <dt>Atasan</dt>
              <dd>{{ pegawaiItem.atasan }}</dd>
            </div>
          </dl>
        </article>
        <p v-if="loading && pegawai.length === 0" class="empty-state">Memuat data pegawai...</p>
        <p v-else-if="filteredPegawai.length === 0" class="empty-state">Belum ada data pegawai.</p>
      </div>

      <!-- Pagination -->
      <div class="table-footer">
        <span class="showing-text">Menampilkan {{ filteredPegawai.length }} dari {{ totalPegawai }} data</span>
        <div v-if="lastPage > 1" class="pagination">
          <button
            v-for="pageNumber in lastPage"
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
import type { UserRole } from '~/types/api'
import { useUsers } from '~/composables/useUsers'

const { users, meta, loading, error, fetchUsers } = useUsers()

const search = ref('')
const selectedDepartment = ref('')
const selectedRole = ref('')
const page = ref(1)

const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  atasan: 'Atasan',
  pegawai: 'Pegawai',
  finance: 'Finance',
  hrd: 'HRD',
}

const roleOptions = (Object.keys(ROLE_LABELS) as UserRole[]).map((value) => ({
  value,
  label: ROLE_LABELS[value],
}))

const pegawai = computed(() => users.value.map((user) => {
  const role = (user.role ?? user.roles?.[0] ?? 'pegawai') as UserRole

  return {
    id: user.id,
    name: user.name,
    department: user.department ?? '—',
    position: ROLE_LABELS[role] ?? role,
    role,
    email: user.email,
    atasan: user.atasan?.name ?? '—',
  }
}))

const departments = computed(() => {
  const values = new Set<string>()
  for (const item of pegawai.value) {
    if (item.department && item.department !== '—') values.add(item.department)
  }
  return Array.from(values).sort((a, b) => a.localeCompare(b))
})

const filteredPegawai = computed(() => {
  return pegawai.value.filter((item) => {
    const query = search.value.toLowerCase()
    const searchMatch = !query
      || item.name.toLowerCase().includes(query)
      || item.id.toString().includes(query)
      || item.email.toLowerCase().includes(query)

    const departmentMatch = !selectedDepartment.value || item.department === selectedDepartment.value
    const roleMatch = !selectedRole.value || item.role === selectedRole.value

    return searchMatch && departmentMatch && roleMatch
  })
})

const totalPegawai = computed(() => meta.value?.total ?? pegawai.value.length)
const lastPage = computed(() => Math.max(meta.value?.last_page ?? 1, 1))

const changePage = async (value: number) => {
  if (value < 1 || value > lastPage.value || value === page.value) return
  page.value = value
  await fetchUsers({ page: value })
}

onMounted(() => {
  fetchUsers({ page: 1 }).catch(() => {})
})
</script>

<style scoped>
.data-pegawai-page {
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

.data-error {
  margin-bottom: 16px; padding: 11px 14px;
  border: 1px solid #f4c7c7; border-radius: 8px;
  background: #fff5f5; color: #b42318; font-size: 10px;
}

/* FILTER CARD */
.filter-card {
  display: grid;
  grid-template-columns: minmax(280px, 1fr) 195px 195px;
  gap: 14px;
  padding: 16px;
  margin-bottom: 24px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 10px;
}

.filter-group { display: flex; flex-direction: column; gap: 6px; }
.filter-group label { font-size: 9px; font-weight: 600; color: #667085; }

.search-input, .date-input {
  height: 31px; display: flex; align-items: center;
  border: 1px solid #dce2eb; border-radius: 6px; background: var(--white);
}
.search-input svg, .date-input svg { width: 14px; height: 14px; margin: 0 8px; fill: #718096; flex-shrink: 0; }
.search-input input, .date-input input, .filter-group select {
  width: 100%; height: 31px; box-sizing: border-box;
  border: 1px solid #dce2eb; border-radius: 6px;
  background: var(--white); color: var(--text);
  outline: none; font-family: inherit; font-size: 10px;
}
.search-input input { border: none; }
.date-input input { border: none; padding: 0 0 0 4px; }
.filter-group select { padding: 0 10px; }
.search-input input:focus, .date-input input:focus, .filter-group select:focus { outline: none; }

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
.action-column { width: 80px; text-align: center; }

.status-badge {
  display: inline-flex; align-items: center;
  padding: 4px 9px; border-radius: 5px;
  font-size: 9px; font-weight: 600; white-space: nowrap;
}
.role-badge {
  display: inline-flex; align-items: center;
  padding: 4px 9px; border-radius: 5px;
  background: #eef1f7; color: #667085;
  font-size: 9px; font-weight: 600; white-space: nowrap;
}
.active { background: #dff7ef; color: #18a77c; }
.nonactive { background: #ffe8e8; color: #ef5350; }
.table-state { height: 90px; text-align: center; color: #8792a5; font-size: 11px; }

.detail-button {
  display: inline-block; margin: auto;
  border: none; background: transparent;
  color: #1769ff; font-family: inherit; font-size: 10px; font-weight: 600; cursor: pointer; text-decoration: none;
}
.detail-button:hover { text-decoration: underline; }

/* MOBILE CARDS */
.pegawai-cards { display: none; }
.pegawai-card {
  padding: 14px; background: var(--white); border: 1px solid var(--border); border-radius: 10px;
}
.pegawai-card-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
.pegawai-card-number { font-size: 10px; color: #9aa4b5; }
.pegawai-card-title { display: block; color: var(--text); font-size: 14px; font-weight: 700; line-height: 1.35; }
.pegawai-card-subtitle { margin-top: 4px; font-size: 11px; color: var(--text-muted); }
.pegawai-card-details { display: grid; grid-template-columns: 1fr; gap: 8px; margin: 12px 0; }
.pegawai-card-details > div { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.pegawai-card-details dt { font-size: 10px; color: #8792a5; }
.pegawai-card-details dd { margin: 0; font-size: 11px; font-weight: 500; color: var(--text); text-align: right; }
.pegawai-card-actions { display: flex; justify-content: flex-end; padding-top: 10px; border-top: 1px solid #eef1f5; }
.pegawai-card-actions .detail-button { width: 100%; min-height: 40px; border: 1px solid var(--primary); border-radius: 7px; background: #f5f8ff; }

.empty-state { padding: 28px 16px; text-align: center; font-size: 12px; color: #8792a5; }

/* FOOTER */
.table-footer { display: flex; align-items: center; justify-content: space-between; padding: 12px 18px 18px; }
.showing-text { font-size: 9px; color: #718096; }
.pagination { display: flex; gap: 6px; }
.page-button { width: 25px; height: 25px; border: 1px solid #dce2eb; border-radius: 5px; background: var(--white); color: var(--text); font-family: inherit; font-size: 9px; cursor: pointer; }
.page-button.active { border-color: var(--primary); background: var(--primary); color: var(--white); }

/* RESPONSIVE */
@media (max-width: 1023px) {
  .data-pegawai-page { padding: 20px; }
  table { min-width: 0; table-layout: fixed; }
  th { padding: 9px 6px; } td { padding: 11px 6px; font-size: 9px; }
  .status-badge { padding: 3px 7px; font-size: 8.5px; }
  .detail-button { font-size: 9px; }
}

@media (max-width: 767px) {
  .data-pegawai-page { padding: 16px; }
  .filter-card { grid-template-columns: 1fr; padding: 14px; gap: 12px; margin-bottom: 16px; }
  .page-header h1 { font-size: 20px; }
  .filter-group input, .filter-group select { font-size: 16px; }
  .table-wrapper { display: none; }
  .table-footer { flex-direction: column; align-items: flex-start; gap: 10px; padding: 0 14px 14px; }
  .pagination { flex-wrap: wrap; }
  .pegawai-cards { display: flex; flex-direction: column; gap: 12px; padding: 14px; }
  .table-card { border: none; background: transparent; overflow: visible; }
  .pegawai-card { padding: 12px; }
}

@media (max-width: 540px) {
  .filter-group input, .filter-group select { font-size: 14px; }
}

@media (max-width: 374px) {
  .data-pegawai-page { padding: 12px; }
  .pegawai-cards { padding: 10px; }
}
</style>