<template>
  <div class="settings-page">

    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <NuxtLink to="/dashboard">Dashboard</NuxtLink>
      <span>›</span>
      <strong>Pengaturan</strong>
    </div>

    <!-- Header -->
    <div class="page-header">
      <h1>Pengaturan Akun</h1>

      <LayoutPageactions />
    </div>

    <!-- Content -->
    <div class="settings-grid">

      <!-- LEFT COLUMN -->
      <div class="left-column">

        <!-- Informasi Profil -->
        <section class="settings-card profile-card">

          <div class="card-header">
            <h2>Informasi Profil</h2>

            <button
              class="edit-button"
              type="button"
              @click="editingProfile ? cancelEditProfile() : startEditProfile()"
            >
              {{ editingProfile ? 'Batal' : 'Edit Profil' }}
            </button>
          </div>

          <div v-if="profileError" class="form-message error" role="alert">{{ profileError }}</div>
          <div v-if="profileMessage" class="form-message success" role="status">{{ profileMessage }}</div>
          <div v-if="photoError" class="form-message error" role="alert">{{ photoError }}</div>
          <div v-if="photoMessage" class="form-message success" role="status">{{ photoMessage }}</div>

          <div class="profile-info">

            <div class="avatar-block">
              <div class="profile-avatar">
                <img v-if="user?.foto_url" :src="user.foto_url" :alt="user.name" />
                <span v-else>{{ initials }}</span>
              </div>

              <div class="avatar-actions">
                <label class="photo-button" :class="{ disabled: uploadingPhoto }">
                  {{ uploadingPhoto ? 'Mengunggah...' : 'Ganti Foto' }}
                  <input
                    type="file"
                    accept="image/png,image/jpeg"
                    :disabled="uploadingPhoto"
                    @change="handlePhoto"
                  />
                </label>
                <button
                  v-if="user?.foto_url"
                  class="text-button"
                  type="button"
                  :disabled="uploadingPhoto"
                  @click="removePhoto"
                >
                  Hapus
                </button>
              </div>
            </div>

            <div v-if="!editingProfile" class="profile-detail">

              <h3>{{ user?.name || 'Pengguna' }}</h3>

              <p class="profile-email">
                {{ user?.email || '—' }}
              </p>

              <div class="profile-tags">
                <span>{{ roleLabel }}</span>
                <span>{{ user?.department || 'Tanpa departemen' }}</span>
                <span v-if="user?.jabatan">{{ user.jabatan }}</span>
              </div>

              <p v-if="user?.no_hp" class="profile-phone">{{ user.no_hp }}</p>

            </div>

          </div>

          <form v-if="editingProfile" class="profile-form" @submit.prevent="submitProfile">

            <div class="form-row">
              <div class="form-group">
                <label for="profile-name">Nama Lengkap</label>
                <input
                  id="profile-name"
                  v-model="profileForm.name"
                  type="text"
                  autocomplete="name"
                  placeholder="Nama lengkap"
                />
              </div>

              <div class="form-group">
                <label for="profile-email">Email</label>
                <input
                  id="profile-email"
                  v-model="profileForm.email"
                  type="email"
                  autocomplete="email"
                  placeholder="nama@perusahaan.com"
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="profile-phone">Nomor HP</label>
                <input
                  id="profile-phone"
                  v-model="profileForm.no_hp"
                  type="text"
                  autocomplete="tel"
                  placeholder="08xxxxxxxxxx"
                />
              </div>

              <div class="form-group">
                <label for="profile-position">Jabatan</label>
                <input
                  id="profile-position"
                  v-model="profileForm.jabatan"
                  type="text"
                  placeholder="Contoh: Staf Marketing"
                />
              </div>
            </div>

            <div class="form-actions">
              <button class="cancel-button" type="button" :disabled="savingProfile" @click="cancelEditProfile">
                Batal
              </button>
              <button class="save-button" type="submit" :disabled="savingProfile">
                {{ savingProfile ? 'Menyimpan...' : 'Simpan Profil' }}
              </button>
            </div>

          </form>

          <p v-else class="card-note">
            Nama, email, nomor HP, dan jabatan dapat Anda ubah sendiri. Foto profil mendukung JPG/PNG maksimal 2 MB.
          </p>

        </section>

        <!-- Preferensi Notifikasi -->
        <section class="settings-card notification-card">

          <h2>Preferensi Notifikasi</h2>

          <div v-if="prefsError" class="form-message error" role="alert">{{ prefsError }}</div>
          <div v-if="prefsMessage" class="form-message success" role="status">{{ prefsMessage }}</div>

          <p v-if="loadingPrefs && !prefsLoaded" class="card-note">
            Memuat preferensi notifikasi...
          </p>
          <p v-else class="card-note">
            Atur channel mana yang Anda terima. Perubahan tersimpan otomatis saat toggle ditekan.
          </p>

          <!-- Email -->
          <div class="notification-item">

            <div>
              <h3>Notifikasi Email</h3>

              <p>
                Terima update pengajuan dan persetujuan lewat email utama.
              </p>
            </div>

            <button
              class="toggle"
              type="button"
              role="switch"
              :disabled="savingPrefs || loadingPrefs"
              aria-label="Notifikasi Email"
              :aria-checked="preferences.email"
              @click="updatePreference('email')"
              :class="{ active: preferences.email }"
            >
              <span></span>
            </button>

          </div>

          <!-- Push -->
          <div class="notification-item">

            <div>
              <h3>Push Notification Persetujuan</h3>

              <p>
                Dapatkan pemberitahuan langsung saat status berubah.
              </p>
            </div>

            <button
              class="toggle"
              type="button"
              role="switch"
              :disabled="savingPrefs || loadingPrefs"
              aria-label="Push Notification Persetujuan"
              :aria-checked="preferences.in_app"
              @click="updatePreference('in_app')"
              :class="{ active: preferences.in_app }"
            >
              <span></span>
            </button>

          </div>

          <!-- Reminder -->
          <div class="notification-item">

            <div>
              <h3>Pengingat Perjalanan</h3>

              <p>
                Pemberitahuan akomodasi dan jadwal tiket sebelum keberangkatan.
              </p>
            </div>

            <button
              class="toggle"
              type="button"
              role="switch"
              :disabled="savingPrefs || loadingPrefs"
              aria-label="Pengingat Perjalanan"
              :aria-checked="preferences.travel_reminder"
              @click="updatePreference('travel_reminder')"
              :class="{ active: preferences.travel_reminder }"
            >
              <span></span>
            </button>

          </div>

          <!-- Reimbursement -->
          <div class="notification-item">

            <div>
              <h3>Status Reimbursement</h3>

              <p>
                Informasi ketika klaim dana Anda disetujui keuangan.
              </p>
            </div>

            <button
              class="toggle"
              type="button"
              role="switch"
              :disabled="savingPrefs || loadingPrefs"
              aria-label="Status Reimbursement"
              :aria-checked="preferences.payment_updates"
              @click="updatePreference('payment_updates')"
              :class="{ active: preferences.payment_updates }"
            >
              <span></span>
            </button>

          </div>

        </section>

      </div>

      <!-- RIGHT COLUMN -->
      <section class="settings-card security-card">

        <h2>Keamanan Akun</h2>

        <p class="card-note">
          Gunakan minimal 8 karakter. Setelah kata sandi diubah, sesi Anda saat ini tetap aktif.
        </p>

        <div v-if="passwordError" class="form-message error" role="alert">{{ passwordError }}</div>
        <div v-if="passwordMessage" class="form-message success" role="status">{{ passwordMessage }}</div>

        <form @submit.prevent="submitPassword">

          <!-- Password Lama -->
          <div class="form-group">

            <label for="current-password">Kata Sandi Sekarang</label>

            <input
              id="current-password"
              v-model="passwordForm.current_password"
              type="password"
              autocomplete="current-password"
              placeholder="••••••••••••"
            />

          </div>

          <!-- Password Baru -->
          <div class="form-group">

            <label for="new-password">Kata Sandi Baru</label>

            <input
              id="new-password"
              v-model="passwordForm.password"
              type="password"
              autocomplete="new-password"
              placeholder="Minimal 8 karakter"
            />

          </div>

          <!-- Konfirmasi -->
          <div class="form-group">

            <label for="confirm-password">Konfirmasi Kata Sandi</label>

            <input
              id="confirm-password"
              v-model="passwordForm.password_confirmation"
              type="password"
              autocomplete="new-password"
              placeholder="Ulangi kata sandi baru..."
            />

          </div>

          <div class="security-footer">

            <button class="save-button" type="submit" :disabled="savingPassword">
              {{ savingPassword ? 'Menyimpan...' : 'Simpan Sandi' }}
            </button>

          </div>

        </form>

      </section>

    </div>

  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { useProfile } from '~/composables/useProfile'
import { useNotificationPreferences } from '~/composables/useNotificationPreferences'
import { apiErrorMessage } from '~/composables/useApi'

const { user, getInitials } = useAuth()
const { fetchProfile, updateProfile, updatePassword, uploadPhoto, deletePhoto } = useProfile()
const {
  preferences,
  loading: loadingPrefs,
  saving: savingPrefs,
  loaded: prefsLoaded,
  error: prefsError,
  message: prefsMessage,
  fetchPreferences,
  updatePreference,
} = useNotificationPreferences()

const editingProfile = ref(false)
const savingProfile = ref(false)
const profileError = ref('')
const profileMessage = ref('')

const uploadingPhoto = ref(false)
const photoError = ref('')
const photoMessage = ref('')

const savingPassword = ref(false)
const passwordError = ref('')
const passwordMessage = ref('')

const profileForm = reactive({
  name: '',
  email: '',
  no_hp: '',
  jabatan: '',
})

const passwordForm = reactive({
  current_password: '',
  password: '',
  password_confirmation: '',
})

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  hrd: 'HRD',
  finance: 'Finance',
  atasan: 'Atasan',
  pegawai: 'Pegawai',
}

const roleLabel = computed(() => {
  const role = user.value?.role
  return role ? (roleLabels[role] ?? role) : '—'
})

const initials = computed(() => (user.value?.name ? getInitials(user.value.name) : '—'))

const fillProfileForm = () => {
  profileForm.name = user.value?.name ?? ''
  profileForm.email = user.value?.email ?? ''
  profileForm.no_hp = user.value?.no_hp ?? ''
  profileForm.jabatan = user.value?.jabatan ?? ''
}

const startEditProfile = () => {
  fillProfileForm()
  editingProfile.value = true
  profileError.value = ''
  profileMessage.value = ''
  photoError.value = ''
  photoMessage.value = ''
}

const cancelEditProfile = () => {
  editingProfile.value = false
  profileError.value = ''
  fillProfileForm()
}

const submitProfile = async () => {
  const name = profileForm.name.trim()
  const email = profileForm.email.trim()

  if (!name || !email) {
    profileError.value = 'Nama dan email wajib diisi.'
    return
  }

  savingProfile.value = true
  profileError.value = ''
  profileMessage.value = ''

  try {
    await updateProfile({
      name,
      email,
      no_hp: profileForm.no_hp.trim() || null,
      jabatan: profileForm.jabatan.trim() || null,
    })

    editingProfile.value = false
    profileMessage.value = 'Profil berhasil diperbarui.'
    fillProfileForm()
  } catch (err) {
    profileError.value = apiErrorMessage(err, 'Gagal menyimpan profil.')
  } finally {
    savingProfile.value = false
  }
}

const handlePhoto = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0] ?? null
  input.value = ''

  if (!file) return

  photoError.value = ''
  photoMessage.value = ''

  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    photoError.value = 'Format foto harus JPG atau PNG.'
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    photoError.value = 'Ukuran foto maksimal 2 MB.'
    return
  }

  uploadingPhoto.value = true

  try {
    await uploadPhoto(file)
    photoMessage.value = 'Foto profil berhasil diperbarui.'
  } catch (err) {
    photoError.value = apiErrorMessage(err, 'Gagal mengunggah foto profil.')
  } finally {
    uploadingPhoto.value = false
  }
}

const removePhoto = async () => {
  if (!window.confirm('Hapus foto profil?')) return

  uploadingPhoto.value = true
  photoError.value = ''
  photoMessage.value = ''

  try {
    await deletePhoto()
    photoMessage.value = 'Foto profil berhasil dihapus.'
  } catch (err) {
    photoError.value = apiErrorMessage(err, 'Gagal menghapus foto profil.')
  } finally {
    uploadingPhoto.value = false
  }
}

const submitPassword = async () => {
  passwordError.value = ''
  passwordMessage.value = ''

  if (!passwordForm.current_password) {
    passwordError.value = 'Kata sandi sekarang wajib diisi.'
    return
  }

  if (passwordForm.password.length < 8) {
    passwordError.value = 'Kata sandi baru minimal 8 karakter.'
    return
  }

  if (passwordForm.password !== passwordForm.password_confirmation) {
    passwordError.value = 'Konfirmasi kata sandi tidak cocok.'
    return
  }

  savingPassword.value = true

  try {
    await updatePassword({
      current_password: passwordForm.current_password,
      password: passwordForm.password,
      password_confirmation: passwordForm.password_confirmation,
    })

    passwordForm.current_password = ''
    passwordForm.password = ''
    passwordForm.password_confirmation = ''
    passwordMessage.value = 'Kata sandi berhasil diubah.'
  } catch (err) {
    passwordError.value = apiErrorMessage(err, 'Gagal mengubah kata sandi.')
  } finally {
    savingPassword.value = false
  }
}

onMounted(async () => {
  try {
    await fetchProfile()
  } catch {
    // Data sesi lokal tetap dipakai bila permintaan gagal.
  }

  fillProfileForm()

  try {
    await fetchPreferences()
  } catch {
    // Pesan error preferensi ditampilkan dari state composable.
  }
})
</script>

<style scoped>

/* =========================
   PAGE
========================= */

.settings-page {
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


/* =========================
   HEADER
========================= */

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;

  margin-bottom: 24px;
}

.page-header h1 {
  margin: 0;

  font-size: 23px;

  font-weight: 700;

  color: var(--text);
}


/* =========================
   GRID
========================= */

.settings-grid {
  display: grid;

  grid-template-columns: minmax(0, 1.35fr) minmax(280px, 1fr);

  gap: 18px;

  align-items: start;
}

.left-column {
  display: flex;
  flex-direction: column;

  gap: 18px;
}


/* =========================
   CARD
========================= */

.settings-card {
  background: var(--white);

  border: 1px solid var(--border);

  border-radius: 10px;

  padding: 20px;
}

.settings-card h2 {
  margin: 0;

  font-size: 14px;

  font-weight: 700;

  color: var(--text);
}


/* =========================
   PROFILE
========================= */

.profile-card {
  padding: 20px;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 10px;

  margin-bottom: 20px;
}

.card-header h2 {
  margin: 0;

  font-size: 14px;
  font-weight: 700;

  color: var(--text);
}

.edit-button {
  height: 22px;

  padding: 0 9px;

  border: 1px solid var(--primary);
  border-radius: 5px;

  background: var(--white);

  color: var(--primary);

  font-family: inherit;
  font-size: 8px;

  cursor: pointer;

  transition: 0.2s;
}

.edit-button:hover {
  background: #eef4ff;
}

.card-note {
  margin: 14px 0 0;
  padding: 9px 11px;
  border: 1px dashed #dce2eb;
  border-radius: 7px;
  background: #fafbfc;
  font-size: 9px;
  line-height: 1.5;
  color: #8792a5;
}

.form-message {
  margin-bottom: 14px;
  padding: 9px 11px;
  border: 1px solid transparent;
  border-radius: 7px;
  font-size: 9px;
  line-height: 1.5;
}

.form-message.error {
  border-color: #f4c7c7;
  background: #fff5f5;
  color: #b42318;
}

.form-message.success {
  border-color: #b7e4d1;
  background: #f0fdf7;
  color: #0f7b58;
}

.edit-button:disabled,
.toggle:disabled,
.save-button:disabled,
.cancel-button:disabled,
.form-group input:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.profile-info {
  display: flex;
  align-items: center;

  gap: 14px;
}

.avatar-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}

.profile-avatar {
  width: 58px;
  height: 58px;

  flex-shrink: 0;

  display: flex;
  align-items: center;
  justify-content: center;

  border-radius: 50%;

  background: #e8edf5;

  border: 1px solid #dce3ec;

  overflow: hidden;
}

.profile-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.profile-avatar span {
  display: flex;
  align-items: center;
  justify-content: center;

  width: 100%;
  height: 100%;

  background: #d7dce5;

  color: #ffffff;

  font-size: 18px;
  font-weight: 600;
}

.avatar-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.photo-button {
  position: relative;
  padding: 3px 7px;
  border: 1px solid #dce2eb;
  border-radius: 5px;
  background: var(--white);
  color: var(--primary);
  font-size: 8px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
}

.photo-button:hover {
  border-color: var(--primary);
  background: #f5f8ff;
}

.photo-button.disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.photo-button input {
  position: absolute;
  inset: 0;
  opacity: 0;
  cursor: pointer;
}

.photo-button.disabled input {
  cursor: not-allowed;
}

.text-button {
  padding: 0;
  border: 0;
  background: transparent;
  color: #b42318;
  font-family: inherit;
  font-size: 8px;
  cursor: pointer;
}

.text-button:hover {
  text-decoration: underline;
}

.profile-detail {
  display: flex;
  flex-direction: column;

  min-width: 0;
}

.profile-detail h3 {
  margin: 0 0 4px;

  font-size: 13px;
  line-height: 1.2;

  color: var(--text);

  font-weight: 700;

  overflow-wrap: anywhere;
}

.profile-email {
  margin: 0 0 7px;

  font-size: 9px;

  color: #8792a5;

  overflow-wrap: anywhere;
}

.profile-phone {
  margin: 7px 0 0;
  font-size: 9px;
  color: #667085;
}

.profile-tags {
  display: flex;

  align-items: center;
  flex-wrap: wrap;

  gap: 6px;
}

.profile-tags span {
  padding: 3px 7px;

  border-radius: 4px;

  background: #f1f3f6;

  color: #718096;

  font-size: 8px;

  line-height: 1;
}

.profile-form {
  margin-top: 18px;
  padding-top: 18px;
  border-top: 1px solid #edf0f5;
}

.form-row {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.form-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 4px;
}

.cancel-button {
  height: 30px;
  padding: 0 15px;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--white);
  color: var(--text);
  font-family: inherit;
  font-size: 9px;
  font-weight: 600;
  cursor: pointer;
}

.cancel-button:hover {
  background: #f8fafc;
}

/* =========================
   NOTIFICATION
========================= */

.notification-card {
  padding-bottom: 10px;
}

.notification-card > h2 {
  margin-bottom: 8px;
}

.notification-item {
  min-height: 62px;

  display: flex;
  align-items: center;
  justify-content: space-between;

  gap: 20px;

  border-bottom: 1px solid #e7eaf0;
}

.notification-item:last-child {
  border-bottom: none;
}

.notification-item h3 {
  margin: 0 0 3px;

  font-size: 10px;

  font-weight: 600;

  color: var(--text);
}

.notification-item p {
  margin: 0;

  font-size: 8px;

  color: #8792a5;
}


/* =========================
   TOGGLE
========================= */

.toggle {
  position: relative;

  width: 32px;
  height: 18px;

  flex-shrink: 0;

  padding: 0;

  border: none;

  border-radius: 20px;

  background: #9aa9bd;

  cursor: pointer;

  transition: 0.2s;
}

.toggle span {
  position: absolute;

  top: 3px;
  left: 3px;

  width: 12px;
  height: 12px;

  border-radius: 50%;

  background: var(--white);

  transition: 0.2s;
}

.toggle.active {
  background: var(--primary);
}

.toggle.active span {
  left: 17px;
}

.toggle:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}


/* =========================
   SECURITY
========================= */

.security-card {
  min-height: 250px;
}

.security-card h2 {
  margin-bottom: 18px;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;

  margin-bottom: 6px;

  font-size: 9px;

  font-weight: 600;

  color: var(--text);
}

.form-group input {
  width: 100%;
  height: 32px;

  box-sizing: border-box;

  padding: 0 10px;

  border: 1px solid #dce2eb;

  border-radius: 6px;

  outline: none;

  background: var(--white);

  color: var(--text);

  font-family: inherit;

  font-size: 9px;
}

.form-group input:focus {
  border-color: var(--primary);
}

.form-group input::placeholder {
  color: #9aa6b8;
}


/* =========================
   SAVE BUTTON
========================= */

.security-footer {
  display: flex;
  justify-content: flex-end;

  margin-top: 22px;
}

.save-button {
  height: 30px;

  padding: 0 15px;

  border: none;

  border-radius: 6px;

  background: var(--primary);

  color: var(--white);

  font-family: inherit;

  font-size: 9px;

  font-weight: 600;

  cursor: pointer;
}

.save-button:hover {
  opacity: 0.9;
}


/* =========================
   RESPONSIVE
========================= */

@media (max-width: 1023px) {
  .settings-page {
    padding: 20px;
  }
}

@media (max-width: 850px) {
  .settings-grid {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 767px) {
  .settings-page {
    padding: 16px;
  }

  .page-header h1 {
    font-size: 20px;
  }

  .settings-grid,
  .left-column {
    gap: 14px;
  }

  .settings-card {
    padding: 16px;
  }

  .settings-card h2,
  .card-header h2 {
    font-size: 15px;
  }

  .edit-button {
    height: 36px;
    padding: 0 12px;
    font-size: 11px;
  }

  .profile-info {
    align-items: flex-start;
  }

  .profile-detail h3 {
    font-size: 14px;
  }

  .profile-email,
  .profile-tags span,
  .profile-phone {
    font-size: 10px;
  }

  .photo-button,
  .text-button {
    font-size: 10px;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 0;
  }

  .form-message {
    font-size: 11px;
  }

  .notification-item {
    align-items: flex-start;
    gap: 14px;

    min-height: 0;
    padding: 14px 0;
  }

  .notification-item h3 {
    font-size: 12px;
  }

  .notification-item p {
    font-size: 10px;
    line-height: 1.5;
  }

  .form-group label {
    font-size: 11px;
  }

  .form-group input {
    height: 42px;
    font-size: 16px;
  }

  .security-card {
    min-height: 0;
  }

  .security-footer {
    justify-content: stretch;
    margin-top: 18px;
  }

  .save-button {
    width: 100%;
    height: 44px;
    font-size: 13px;
  }

  .form-actions {
    flex-direction: column-reverse;
    margin-top: 10px;
  }

  .cancel-button {
    height: 42px;
    font-size: 12px;
  }
}

@media (max-width: 374px) {
  .settings-page {
    padding: 12px;
  }

  .settings-card {
    padding: 14px;
  }
}
</style>
