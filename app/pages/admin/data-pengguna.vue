<template>
  <div class="data-pengguna-page">
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <NuxtLink to="/dashboard">Dashboard</NuxtLink>
      <AppIcon name="chevron-right" class="crumb-sep" />
      <strong>Data Pengguna</strong>
    </div>

    <!-- Header -->
    <div class="page-header">
      <div>
        <h1>Data Pengguna</h1>
        <p>Kelola akun, role, atasan, dan status aktif pengguna aplikasi.</p>
      </div>
      <button class="add-button" type="button" @click="openCreate">+ Tambah Pengguna</button>
    </div>

    <div v-if="message" class="data-success" role="status">{{ message }}</div>
    <div v-if="pageError" class="data-error" role="alert">{{ pageError }}</div>
    <div v-if="error" class="data-error" role="alert">{{ error }}</div>

    <!-- Filter Card -->
    <form class="filter-card" @submit.prevent="applyFilters">
      <div class="filter-group search-group">
        <label>Cari Nama / Email</label>
        <div class="search-input">
          <AppIcon name="search" />
          <input v-model="search" type="text" placeholder="Cari pengguna..." />
        </div>
      </div>

      <div class="filter-group">
        <label>Role</label>
        <select v-model="selectedRole" @change="applyFilters">
          <option value="">Semua Role</option>
          <option v-for="role in roleOptions" :key="role.value" :value="role.value">{{ role.label }}</option>
        </select>
      </div>

      <div class="filter-group">
        <label>Status</label>
        <select v-model="selectedActive" @change="applyFilters">
          <option value="">Semua Status</option>
          <option value="1">Aktif</option>
          <option value="0">Nonaktif</option>
        </select>
      </div>

      <button class="search-button" type="submit">Cari</button>
    </form>

    <!-- Table Card -->
    <div class="table-card">
      <div class="table-wrapper">
        <table>
          <thead>
            <tr>
              <th class="no-column">No</th>
              <th>Nama</th>
              <th>Email</th>
              <th>Role</th>
              <th>Departemen</th>
              <th>Atasan</th>
              <th>Status</th>
              <th class="action-column">Aksi</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="loading && rows.length === 0">
              <td colspan="8" class="table-state">Memuat data pengguna...</td>
            </tr>
            <tr v-else-if="rows.length === 0">
              <td colspan="8" class="table-state">Tidak ada pengguna yang cocok dengan filter.</td>
            </tr>
            <tr v-for="(item, index) in rows" :key="item.id">
              <td>{{ rowOffset + index + 1 }}</td>
              <td>
                <div class="user-cell">
                  <span class="user-name">{{ item.name }}</span>
                  <span class="user-id">ID-{{ item.id }}</span>
                </div>
              </td>
              <td>{{ item.email }}</td>
              <td><span class="role-badge">{{ item.roleLabel }}</span></td>
              <td>{{ item.department }}</td>
              <td>{{ item.atasan }}</td>
              <td>
                <span class="status-badge" :class="item.is_active ? 'active' : 'inactive'">
                  {{ item.is_active ? 'Aktif' : 'Nonaktif' }}
                </span>
              </td>
              <td>
                <div class="row-actions">
                  <button class="detail-button" type="button" @click="openEdit(item.raw)">Edit</button>
                  <button
                    class="detail-button"
                    type="button"
                    :disabled="item.id === currentUserId"
                    :title="item.id === currentUserId ? 'Gunakan Keamanan Akun untuk password sendiri' : 'Reset password pengguna'"
                    @click="openReset(item.raw)"
                  >
                    Reset
                  </button>
                  <button
                    class="delete-button"
                    type="button"
                    :disabled="item.id === currentUserId"
                    :title="item.id === currentUserId ? 'Tidak bisa menghapus akun sendiri' : 'Hapus pengguna'"
                    @click="removeUser(item.raw)"
                  >
                    Hapus
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Mobile Cards -->
      <div class="user-cards">
        <article v-for="(item, index) in rows" :key="`card-${item.id}`" class="user-card">
          <div class="user-card-header">
            <span class="user-card-number">#{{ rowOffset + index + 1 }}</span>
            <span class="status-badge" :class="item.is_active ? 'active' : 'inactive'">
              {{ item.is_active ? 'Aktif' : 'Nonaktif' }}
            </span>
          </div>
          <div class="user-card-title">{{ item.name }}</div>
          <div class="user-card-subtitle">{{ item.email }}</div>
          <dl class="user-card-details">
            <div>
              <dt>Role</dt>
              <dd>{{ item.roleLabel }}</dd>
            </div>
            <div>
              <dt>Departemen</dt>
              <dd>{{ item.department }}</dd>
            </div>
            <div>
              <dt>Atasan</dt>
              <dd>{{ item.atasan }}</dd>
            </div>
          </dl>
          <div class="row-actions">
            <button class="detail-button block" type="button" @click="openEdit(item.raw)">Edit</button>
            <button
              class="detail-button block"
              type="button"
              :disabled="item.id === currentUserId"
              @click="openReset(item.raw)"
            >
              Reset
            </button>
            <button
              class="delete-button block"
              type="button"
              :disabled="item.id === currentUserId"
              @click="removeUser(item.raw)"
            >
              Hapus
            </button>
          </div>
        </article>
        <p v-if="loading && rows.length === 0" class="empty-state">Memuat data pengguna...</p>
        <p v-else-if="rows.length === 0" class="empty-state">Tidak ada pengguna yang cocok dengan filter.</p>
      </div>

      <!-- Pagination -->
      <div class="table-footer">
        <span class="showing-text">
          Menampilkan {{ rows.length }} dari {{ totalUsers }} pengguna
        </span>
        <div v-if="lastPage > 1" class="pagination">
          <button
            v-for="pageNumber in pageNumbers"
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

    <!-- Form Modal -->
    <div v-if="showForm" class="modal-backdrop" @click.self="closeForm">
      <div class="modal-card" role="dialog" aria-modal="true" :aria-label="editingId ? 'Edit pengguna' : 'Tambah pengguna'">
        <div class="modal-header">
          <h2>{{ editingId ? 'Edit Pengguna' : 'Tambah Pengguna' }}</h2>
          <button class="close-button" type="button" aria-label="Tutup" @click="closeForm"><AppIcon name="x" /></button>
        </div>

        <form @submit.prevent="submitForm">
          <div v-if="formError" class="data-error" role="alert">{{ formError }}</div>

          <div class="form-grid">
            <div class="form-group">
              <label for="user-name">Nama Lengkap</label>
              <input id="user-name" v-model="form.name" type="text" autocomplete="off" placeholder="Nama lengkap" />
            </div>

            <div class="form-group">
              <label for="user-email">Email</label>
              <input id="user-email" v-model="form.email" type="email" autocomplete="off" placeholder="nama@perusahaan.com" />
            </div>

            <div class="form-group">
              <label for="user-password">Kata Sandi</label>
              <input
                id="user-password"
                v-model="form.password"
                type="password"
                autocomplete="new-password"
                :placeholder="editingId ? 'Kosongkan bila tidak diganti' : 'Minimal 8 karakter'"
              />
            </div>

            <div class="form-group">
              <label for="user-role">Role</label>
              <select id="user-role" v-model="form.role" :disabled="editingSelf">
                <option v-for="role in roleOptions" :key="role.value" :value="role.value">{{ role.label }}</option>
              </select>
            </div>

            <div class="form-group">
              <label for="user-department">Departemen</label>
              <input id="user-department" v-model="form.department" type="text" placeholder="Contoh: Marketing" />
            </div>

            <div class="form-group">
              <label for="user-position">Jabatan</label>
              <input id="user-position" v-model="form.jabatan" type="text" placeholder="Contoh: Staf Marketing" />
            </div>

            <div class="form-group">
              <label for="user-phone">Nomor HP</label>
              <input id="user-phone" v-model="form.no_hp" type="text" placeholder="08xxxxxxxxxx" />
            </div>

            <div class="form-group">
              <label for="user-atasan">Atasan</label>
              <select id="user-atasan" v-model="form.atasan_id">
                <option value="">Tanpa atasan</option>
                <option
                  v-for="atasan in atasanOptions"
                  :key="atasan.id"
                  :value="atasan.id"
                  :disabled="atasan.id === editingId"
                >
                  {{ atasan.name }} ({{ atasan.role }})
                </option>
              </select>
            </div>
          </div>

          <label class="checkbox-row" :class="{ disabled: editingSelf }">
            <input v-model="form.is_active" type="checkbox" :disabled="editingSelf" />
            <span>Akun aktif (dapat login)</span>
          </label>

          <p v-if="editingSelf" class="modal-note">
            Anda tidak dapat mengubah role atau menonaktifkan akun sendiri.
          </p>

          <div class="modal-actions">
            <button class="cancel-button" type="button" :disabled="submitting" @click="closeForm">Batal</button>
            <button class="save-button" type="submit" :disabled="submitting">
              {{ submitting ? 'Menyimpan...' : (editingId ? 'Simpan Perubahan' : 'Tambah Pengguna') }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Reset Password Modal -->
    <div v-if="showReset" class="modal-backdrop" @click.self="closeReset">
      <div class="modal-card" role="dialog" aria-modal="true" aria-label="Reset password pengguna">
        <div class="modal-header">
          <h2>Reset Password</h2>
          <button class="close-button" type="button" aria-label="Tutup" @click="closeReset"><AppIcon name="x" /></button>
        </div>

        <p class="modal-note">
          Password baru untuk <strong>{{ resetTarget?.name }}</strong> ({{ resetTarget?.email }}).
          Pengguna akan dipaksa login ulang di semua perangkat.
        </p>

        <form @submit.prevent="submitReset">
          <div v-if="resetError" class="data-error" role="alert">{{ resetError }}</div>

          <div class="form-grid">
            <div class="form-group">
              <label for="reset-password">Password Baru</label>
              <input
                id="reset-password"
                v-model="resetFields.password"
                type="password"
                autocomplete="new-password"
                placeholder="Minimal 8 karakter"
              />
            </div>

            <div class="form-group">
              <label for="reset-password-confirm">Konfirmasi Password</label>
              <input
                id="reset-password-confirm"
                v-model="resetFields.password_confirmation"
                type="password"
                autocomplete="new-password"
                placeholder="Ulangi password baru"
              />
            </div>
          </div>

          <div class="modal-actions">
            <button class="cancel-button" type="button" :disabled="resetting" @click="closeReset">Batal</button>
            <button class="save-button" type="submit" :disabled="resetting">
              {{ resetting ? 'Menyimpan...' : 'Reset Password' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import type { ApiUser, Paginated, UpdateUserPayload, UserRole } from '~/types/api'
import { useUsers } from '~/composables/useUsers'
import { useApi, apiErrorMessage } from '~/composables/useApi'
import { useAuth } from '~/composables/useAuth'

const { users, meta, loading, error, fetchUsers, createUser, updateUser, deleteUser, resetPassword } = useUsers()
const { get } = useApi()
const { user: sessionUser, setUser } = useAuth()

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

const search = ref('')
const selectedRole = ref('')
const selectedActive = ref('')
const page = ref(1)
const message = ref('')
const pageError = ref('')

const atasanOptions = ref<ApiUser[]>([])

const showForm = ref(false)
const editingId = ref<number | null>(null)
const editingSelf = ref(false)
const submitting = ref(false)
const formError = ref('')

const form = reactive({
  name: '',
  email: '',
  password: '',
  role: 'pegawai' as UserRole,
  department: '',
  no_hp: '',
  jabatan: '',
  atasan_id: '' as string | number,
  is_active: true,
})

const currentUserId = computed(() => Number(sessionUser.value?.id ?? 0))

const rows = computed(() => users.value.map((user) => ({
  id: user.id,
  raw: user,
  name: user.name,
  email: user.email,
  role: (user.role ?? user.roles?.[0] ?? 'pegawai') as UserRole,
  roleLabel: ROLE_LABELS[(user.role ?? user.roles?.[0] ?? 'pegawai') as UserRole] ?? '—',
  department: user.department || '—',
  atasan: user.atasan?.name || '—',
  is_active: user.is_active !== false,
})))

const rowOffset = computed(() => ((meta.value?.current_page ?? 1) - 1) * (meta.value?.per_page ?? 15))
const totalUsers = computed(() => meta.value?.total ?? rows.value.length)
const lastPage = computed(() => Math.max(meta.value?.last_page ?? 1, 1))
const pageNumbers = computed(() => Array.from({ length: lastPage.value }, (_, index) => index + 1))

const loadAtasanOptions = async () => {
  try {
    const [atasanResponse, adminResponse] = await Promise.all([
      get<Paginated<ApiUser>>('/users', { role: 'atasan', per_page: 100 }),
      get<Paginated<ApiUser>>('/users', { role: 'admin', per_page: 100 }),
    ])

    const merged = [...adminResponse.data, ...atasanResponse.data]
    const unique = new Map<number, ApiUser>()

    for (const item of merged) {
      unique.set(item.id, item)
    }

    atasanOptions.value = Array.from(unique.values()).sort((a, b) => a.name.localeCompare(b.name))
  } catch {
    atasanOptions.value = []
  }
}

const fetchList = async () => {
  try {
    await fetchUsers({
      page: page.value,
      per_page: 15,
      q: search.value.trim() || undefined,
      role: selectedRole.value || undefined,
      is_active: selectedActive.value === '' ? undefined : selectedActive.value === '1',
    })
  } catch {
    // pesan error sudah disimpan oleh composable
  }
}

const applyFilters = () => {
  page.value = 1
  fetchList()
}

const changePage = (value: number) => {
  if (value < 1 || value > lastPage.value || value === page.value) return
  page.value = value
  fetchList()
}

const resetForm = () => {
  form.name = ''
  form.email = ''
  form.password = ''
  form.role = 'pegawai'
  form.department = ''
  form.no_hp = ''
  form.jabatan = ''
  form.atasan_id = ''
  form.is_active = true
  formError.value = ''
}

const openCreate = () => {
  resetForm()
  editingId.value = null
  editingSelf.value = false
  showForm.value = true
  message.value = ''
}

const openEdit = (user: ApiUser) => {
  resetForm()
  editingId.value = user.id
  editingSelf.value = user.id === currentUserId.value
  form.name = user.name
  form.email = user.email
  form.role = (user.role ?? user.roles?.[0] ?? 'pegawai') as UserRole
  form.department = user.department ?? ''
  form.no_hp = user.no_hp ?? ''
  form.jabatan = user.jabatan ?? ''
  form.atasan_id = user.atasan?.id ?? ''
  form.is_active = user.is_active !== false
  showForm.value = true
  message.value = ''
}

const closeForm = () => {
  if (submitting.value) return
  showForm.value = false
}

const submitForm = async () => {
  formError.value = ''

  const name = form.name.trim()
  const email = form.email.trim()
  const password = form.password.trim()

  if (!name || !email) {
    formError.value = 'Nama dan email wajib diisi.'
    return
  }

  if (!editingId.value && password.length < 8) {
    formError.value = 'Kata sandi minimal 8 karakter.'
    return
  }

  if (editingId.value && password && password.length < 8) {
    formError.value = 'Kata sandi baru minimal 8 karakter.'
    return
  }

  submitting.value = true

  try {
    const basePayload = {
      name,
      email,
      department: form.department.trim() || null,
      no_hp: form.no_hp.trim() || null,
      jabatan: form.jabatan.trim() || null,
      atasan_id: form.atasan_id === '' ? null : Number(form.atasan_id),
    }

    if (editingId.value) {
      const payload: UpdateUserPayload = { ...basePayload }

      if (!editingSelf.value) {
        payload.role = form.role
        payload.is_active = form.is_active
      }

      if (password) payload.password = password

      const updated = await updateUser(editingId.value, payload)

      if (editingSelf.value) {
        setUser({
          name: updated.name,
          email: updated.email,
          department: updated.department ?? undefined,
          no_hp: updated.no_hp ?? undefined,
          jabatan: updated.jabatan ?? undefined,
        })
      }

      message.value = 'Data pengguna berhasil diperbarui.'
    } else {
      await createUser({
        ...basePayload,
        password,
        role: form.role,
        is_active: form.is_active,
      })
      message.value = 'Pengguna baru berhasil ditambahkan.'
    }

    showForm.value = false
    await fetchList()
    await loadAtasanOptions()
  } catch (err) {
    formError.value = apiErrorMessage(err, 'Gagal menyimpan data pengguna.')
  } finally {
    submitting.value = false
  }
}

const removeUser = async (user: ApiUser) => {
  if (user.id === currentUserId.value) return

  if (!window.confirm(`Hapus pengguna "${user.name}"? Tindakan ini tidak dapat dibatalkan.`)) return

  message.value = ''
  pageError.value = ''

  try {
    await deleteUser(user.id)
    message.value = `Pengguna "${user.name}" berhasil dihapus.`

    if (rows.value.length === 1 && page.value > 1) {
      page.value -= 1
    }

    await fetchList()
    await loadAtasanOptions()
  } catch (err) {
    pageError.value = apiErrorMessage(err, 'Gagal menghapus pengguna.')
  }
}

const showReset = ref(false)
const resetting = ref(false)
const resetError = ref('')
const resetTarget = ref<ApiUser | null>(null)
const resetFields = reactive({
  password: '',
  password_confirmation: '',
})

const openReset = (user: ApiUser) => {
  if (user.id === currentUserId.value) return

  resetTarget.value = user
  resetFields.password = ''
  resetFields.password_confirmation = ''
  resetError.value = ''
  showReset.value = true
}

const closeReset = () => {
  showReset.value = false
  resetTarget.value = null
  resetError.value = ''
}

const submitReset = async () => {
  if (!resetTarget.value) return

  resetError.value = ''

  if (resetFields.password.length < 8) {
    resetError.value = 'Password baru minimal 8 karakter.'
    return
  }

  if (resetFields.password !== resetFields.password_confirmation) {
    resetError.value = 'Konfirmasi password tidak cocok.'
    return
  }

  resetting.value = true

  try {
    await resetPassword(resetTarget.value.id, resetFields.password, resetFields.password_confirmation)
    message.value = `Password "${resetTarget.value.name}" berhasil direset.`
    closeReset()
    await fetchList()
  } catch (err) {
    resetError.value = apiErrorMessage(err, 'Gagal mereset password.')
  } finally {
    resetting.value = false
  }
}

onMounted(async () => {
  await fetchList()
  await loadAtasanOptions()
})
</script>

<style scoped>
.data-pengguna-page {
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
.page-header p { margin: 4px 0 0; font-size: 10px; color: #8792a5; }

.add-button {
  min-height: 34px;
  padding: 0 13px;
  border: 1px solid var(--primary);
  border-radius: 7px;
  background: var(--primary);
  color: #fff;
  font-family: inherit;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
}

.add-button:hover { opacity: 0.9; }

.data-error { margin-bottom: 16px; padding: 11px 14px; border: 1px solid #f4c7c7; border-radius: 8px; background: #fff5f5; color: #b42318; font-size: 11px; }
.data-success { margin-bottom: 16px; padding: 11px 14px; border: 1px solid #b7e4d1; border-radius: 8px; background: #f0fdf7; color: #0f7b58; font-size: 11px; }

/* FILTER */
.filter-card {
  display: grid;
  grid-template-columns: minmax(240px, 1fr) 180px 170px auto;
  gap: 14px;
  align-items: end;
  padding: 16px;
  margin-bottom: 24px;
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 10px;
}

.filter-group { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
.filter-group label { font-size: 9px; font-weight: 600; color: #667085; }

.search-input {
  height: 31px;
  display: flex;
  align-items: center;
  border: 1px solid #dce2eb;
  border-radius: 6px;
  background: var(--white);
}
.search-input svg { width: 14px; height: 14px; margin: 0 8px; color: #718096; flex-shrink: 0; }
.search-input input { border: none; }
.filter-group select,
.filter-group input {
  width: 100%;
  height: 31px;
  box-sizing: border-box;
  border: 1px solid #dce2eb;
  border-radius: 6px;
  background: var(--white);
  color: var(--text);
  outline: none;
  font-family: inherit;
  font-size: 10px;
  padding: 0 10px;
}
.filter-group select:focus,
.filter-group input:focus { border-color: var(--primary); }

.search-button {
  height: 31px;
  padding: 0 16px;
  border: 1px solid var(--primary);
  border-radius: 6px;
  background: var(--primary);
  color: #fff;
  font-family: inherit;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
}

.search-button:hover { opacity: 0.9; }

/* TABLE */
.table-card {
  background: var(--white);
  border: 1px solid var(--border);
  border-radius: 11px;
  overflow: hidden;
}

.table-wrapper { padding: 18px; overflow-x: auto; }
table { width: 100%; border-collapse: collapse; }
thead { background: #f3f4f6; }
th { padding: 10px 12px; text-align: left; font-size: 9px; font-weight: 600; color: #718096; white-space: nowrap; }
td { padding: 12px; border-bottom: 1px solid #e5e8ee; font-size: 10px; color: #344054; vertical-align: middle; }
tbody tr:last-child td { border-bottom: none; }
.no-column { width: 34px; }
.action-column { width: 118px; }
.table-state { padding: 22px 12px; text-align: center; font-size: 10px; color: #8792a5; }

.user-cell { display: flex; flex-direction: column; gap: 2px; }
.user-name { font-weight: 600; color: var(--text); }
.user-id { font-size: 8px; color: #9aa4b5; }

.role-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 5px;
  background: #eef2f8;
  color: #475467;
  font-size: 9px;
  font-weight: 600;
  white-space: nowrap;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 9px;
  border-radius: 5px;
  font-size: 9px;
  font-weight: 600;
  white-space: nowrap;
}
.status-badge.active { background: #dff7ef; color: #18a77c; }
.status-badge.inactive { background: #fee2e2; color: #b42318; }

.row-actions { display: flex; align-items: center; gap: 6px; }

.detail-button {
  height: 27px;
  padding: 0 10px;
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

.delete-button {
  height: 27px;
  padding: 0 10px;
  border: 1px solid #f4c7c7;
  border-radius: 6px;
  background: #fff5f5;
  color: #b42318;
  font-family: inherit;
  font-size: 9px;
  font-weight: 600;
  cursor: pointer;
}
.delete-button:hover { background: #fee2e2; }
.delete-button:disabled { opacity: 0.45; cursor: not-allowed; }

.detail-button.block,
.delete-button.block { flex: 1; width: 100%; height: 32px; }

/* MOBILE CARDS */
.user-cards { display: none; }
.user-card { padding: 14px; background: var(--white); border: 1px solid var(--border); border-radius: 10px; }
.user-card-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
.user-card-number { font-size: 10px; color: #9aa4b5; }
.user-card-title { color: var(--text); font-size: 14px; font-weight: 700; line-height: 1.35; }
.user-card-subtitle { margin-top: 3px; font-size: 11px; color: var(--text-muted); overflow-wrap: anywhere; }
.user-card-details { display: grid; grid-template-columns: 1fr; gap: 8px; margin: 12px 0; }
.user-card-details > div { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; }
.user-card-details dt { font-size: 10px; color: #8792a5; }
.user-card-details dd { margin: 0; font-size: 11px; font-weight: 500; color: var(--text); text-align: right; }

.empty-state { padding: 28px 16px; text-align: center; font-size: 12px; color: #8792a5; }

.table-footer { display: flex; align-items: center; justify-content: space-between; gap: 12px; padding: 12px 18px 18px; }
.showing-text { font-size: 9px; color: #718096; }

.pagination { display: flex; flex-wrap: wrap; gap: 5px; }
.page-button {
  min-width: 28px;
  height: 28px;
  padding: 0 6px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--white);
  color: #475467;
  font-family: inherit;
  font-size: 9px;
  cursor: pointer;
}
.page-button.active { background: var(--primary); border-color: var(--primary); color: #fff; }

/* MODAL */
.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.45);
}

.modal-card {
  width: 100%;
  max-width: 640px;
  max-height: calc(100vh - 40px);
  overflow-y: auto;
  padding: 20px;
  background: var(--white);
  border-radius: 12px;
  box-shadow: 0 20px 45px rgba(15, 23, 42, 0.2);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 18px;
}
.modal-header h2 { margin: 0; font-size: 17px; font-weight: 700; color: var(--text); }

.close-button {
  width: 28px;
  height: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--white);
  color: #667085;
  font-size: 16px;
  line-height: 1;
  cursor: pointer;
}
.close-button:hover { color: #b42318; border-color: #f4c7c7; }

.form-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.form-group { display: flex; flex-direction: column; gap: 6px; }
.form-group label { font-size: 9px; font-weight: 600; color: #667085; }
.form-group input,
.form-group select {
  width: 100%;
  height: 34px;
  box-sizing: border-box;
  padding: 0 10px;
  border: 1px solid #dce2eb;
  border-radius: 6px;
  background: var(--white);
  color: var(--text);
  outline: none;
  font-family: inherit;
  font-size: 10px;
}
.form-group input:focus,
.form-group select:focus { border-color: var(--primary); }
.form-group select:disabled,
.form-group input:disabled { opacity: 0.6; cursor: not-allowed; }

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  font-size: 10px;
  color: var(--text);
  cursor: pointer;
}
.checkbox-row.disabled { opacity: 0.6; cursor: not-allowed; }
.checkbox-row input { width: 14px; height: 14px; accent-color: var(--primary); }

.modal-note { margin: 10px 0 0; font-size: 9px; color: #8792a5; line-height: 1.5; }

.modal-actions { display: flex; justify-content: flex-end; gap: 8px; margin-top: 20px; }

.cancel-button,
.save-button {
  height: 34px;
  padding: 0 16px;
  border-radius: 7px;
  font-family: inherit;
  font-size: 10px;
  font-weight: 600;
  cursor: pointer;
}
.cancel-button { border: 1px solid var(--border); background: var(--white); color: var(--text); }
.cancel-button:hover { background: #f8fafc; }
.save-button { border: 1px solid var(--primary); background: var(--primary); color: #fff; }
.save-button:hover { opacity: 0.9; }
.cancel-button:disabled,
.save-button:disabled { opacity: 0.6; cursor: not-allowed; }

/* RESPONSIVE */
@media (max-width: 1023px) {
  .data-pengguna-page { padding: 20px; }
  .filter-card { grid-template-columns: minmax(200px, 1fr) 160px 150px auto; }
}

@media (max-width: 850px) {
  .filter-card { grid-template-columns: 1fr 1fr; }
  .filter-group.search-group { grid-column: 1 / -1; }
  .search-button { width: 100%; }
}

@media (max-width: 767px) {
  .data-pengguna-page { padding: 16px; }
  .page-header h1 { font-size: 20px; }
  .page-header p { font-size: 11px; }
  .table-wrapper { display: none; }
  .table-card { border: none; background: transparent; overflow: visible; }
  .user-cards { display: flex; flex-direction: column; gap: 12px; padding: 14px; }
  .table-footer { flex-direction: column; align-items: flex-start; gap: 10px; padding: 0 14px 14px; }
  .filter-card { grid-template-columns: 1fr; padding: 14px; gap: 12px; margin-bottom: 16px; }
  .filter-group select,
  .filter-group input { height: 40px; font-size: 16px; }
  .search-input { height: 40px; }
  .search-input input { font-size: 16px; }
  .search-button { height: 40px; font-size: 12px; }
  .form-grid { grid-template-columns: 1fr; }
  .modal-card { padding: 16px; }
  .modal-actions { flex-direction: column-reverse; }
  .cancel-button,
  .save-button { width: 100%; height: 42px; font-size: 12px; }
}

@media (max-width: 374px) {
  .data-pengguna-page { padding: 12px; }
  .user-cards { padding: 10px; }
}
</style>
