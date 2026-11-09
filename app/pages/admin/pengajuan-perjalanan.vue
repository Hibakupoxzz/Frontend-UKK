<template>
  <div class="pengajuan-page">

    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <NuxtLink to="/dashboard">Dashboard</NuxtLink>
      <AppIcon name="chevron-right" class="crumb-sep" />
      <span>Pengajuan Perjalanan</span>
      <AppIcon name="chevron-right" class="crumb-sep" />
      <strong>Buat Baru</strong>
    </div>

    <!-- Page Title -->
    <div class="page-title">
      <div class="back">
      
      <h1><NuxtLink to="/dashboard" class="back-icon"><AppIcon name="arrow-left" /><span>Pengajuan Perjalanan Dinas</span></NuxtLink></h1>
      </div>
      <LayoutPageactions />

    </div>

    <!-- Form Card -->
    <div class="form-card">

      <div class="form-content">

        <h2>Informasi Perjalanan</h2>

        <!-- Row 1 -->
        <div class="form-row three-column">

          <div class="form-group">
            <label>
              Tujuan Kota <span>*</span>
            </label>

            <input
              v-model="form.tujuan"
              type="text"
              placeholder="Pilih kota tujuan"
            />
          </div>

          <div class="form-group">
            <label>
              Tanggal Berangkat <span>*</span>
            </label>

            <div class="input-with-icon">
              <input
                v-model="form.tanggal_berangkat"
                type="date"
                :min="today"
              />
              <span><AppIcon name="calendar" /></span>
            </div>
          </div>

          <div class="form-group">
            <label>
              Tanggal Kembali <span>*</span>
            </label>

            <div class="input-with-icon">
              <input
                v-model="form.tanggal_pulang"
                type="date"
                :min="form.tanggal_berangkat || today"
              />
              <span><AppIcon name="calendar" /></span>
            </div>
          </div>

        </div>

        <!-- Row 2 -->
        <div class="form-row">
          <div class="form-group full">
            <label>
              Tujuan/Keperluan <span>*</span>
            </label>

            <textarea
              v-model="form.keperluan"
              rows="4"
              placeholder="Masukkan tujuan atau keperluan perjalanan secara detail..."
            ></textarea>
          </div>
        </div>

        <!-- Row 3 -->
        <div class="form-row">
          <div class="form-group full">
            <label>
              Lampiran <small>(Opsional)</small>
            </label>

            <div class="file-input">
              <label class="file-button">
                Pilih File
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png,.pdf"
                  @change="handleFile"
                />
              </label>

              <span class="file-name">
                {{ form.file ? form.file.name : 'Belum ada file dipilih' }}
              </span>
            </div>
          </div>
        </div>

      </div>

      <div v-if="error" class="form-message error" role="alert">{{ error }}</div>

      <!-- Footer -->
      <div class="form-footer">

        <button
          type="button"
          class="cancel-button"
          :disabled="submitting"
          @click="cancelForm"
        >
          Batal
        </button>

        <button
          type="button"
          class="submit-button"
          :disabled="submitting"
          @click="submitForm"
        >
          {{ submitting ? 'Mengirim...' : 'Ajukan' }}
        </button>

      </div>

    </div>

  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import type { CreateTripPayload } from '~/types/api'
import { useTrips } from '~/composables/useTrips'
import { apiErrorMessage } from '~/composables/useApi'

const router = useRouter()
const { createTrip, submitTrip, uploadDocument } = useTrips()

const today = new Date().toISOString().slice(0, 10)

const form = reactive({
  tujuan: '',
  tanggal_berangkat: '',
  tanggal_pulang: '',
  keperluan: '',
  file: null as File | null,
})

const submitting = ref(false)
const error = ref('')

const handleFile = (event: Event) => {
  const target = event.target as HTMLInputElement
  form.file = target.files?.[0] ?? null
}

const resetForm = () => {
  form.tujuan = ''
  form.tanggal_berangkat = ''
  form.tanggal_pulang = ''
  form.keperluan = ''
  form.file = null
}

const cancelForm = () => {
  router.push('/admin/perjalanan-dinas')
}

const submitForm = async () => {
  error.value = ''

  if (!form.tujuan.trim() || !form.tanggal_berangkat || !form.tanggal_pulang || !form.keperluan.trim()) {
    error.value = 'Lengkapi tujuan, tanggal, dan keperluan perjalanan.'
    return
  }

  const payload: CreateTripPayload = {
    tujuan: form.tujuan.trim(),
    tanggal_berangkat: form.tanggal_berangkat,
    tanggal_pulang: form.tanggal_pulang,
    keperluan: form.keperluan.trim(),
  }

  submitting.value = true

  try {
    const trip = await createTrip(payload)

    if (form.file) {
      try {
        await uploadDocument(trip.id, form.file, 'Lampiran pengajuan')
      } catch {
        // dokumen opsional; pengajuan tetap dilanjutkan
      }
    }

    await submitTrip(trip.id)

    resetForm()
    await router.push({ path: '/admin/DetailPerjalanan', query: { id: trip.id } })
  } catch (err) {
    error.value = apiErrorMessage(err, 'Gagal mengirim pengajuan perjalanan.')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.pengajuan-page {
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
  flex-wrap: wrap;
  gap: 9px;

  margin-bottom: 4px;

  font-size: 9px;
  color: #9aa4b5;
}

.breadcrumb a {
  color: #9aa4b5;
  text-decoration: none;
}

.breadcrumb a:hover {
  color: var(--primary);
}

.breadcrumb strong {
  color: var(--text);
  font-weight: 600;
}

/* =========================
   PAGE TITLE
========================= */

.page-title {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 9px;

  margin-bottom: 24px;
}

.page-title h1 {
  margin: 0;

  min-width: 0;

  font-size: 22px;
  font-weight: 700;

  color: var(--text);
}

.back-icon {
  display: flex;
  align-items: center;

  gap: 8px;

  color: var(--text);
  text-decoration: none;

  font-size: 22px;
  line-height: 1.25;

  overflow-wrap: anywhere;
}

/* =========================
   FORM CARD
========================= */

.form-card {
  background: var(--white);

  border: 1px solid var(--border);
  border-radius: 12px;

  overflow: hidden;
}

.form-content {
  padding: 24px;
}

.form-content h2 {
  margin: 0 0 22px;

  font-size: 25px;
  font-weight: 700;

  color: var(--text);
}

/* =========================
   FORM ROW
========================= */

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;

  gap: 18px;

  margin-bottom: 18px;
}

.three-column {
  grid-template-columns: 1fr 1fr 1fr;
}

.full {
  grid-column: 1 / -1;
}

.form-message {
  margin: 0 24px 4px;
  padding: 11px 14px;
  border-radius: 8px;
  font-size: 11px;
}

.form-message.error {
  border: 1px solid #f4c7c7;
  background: #fff5f5;
  color: #b42318;
}

/* =========================
   FORM GROUP
========================= */

.form-group {
  display: flex;
  flex-direction: column;
  gap: 7px;
}

.form-group label {
  font-size: 12px;
  font-weight: 600;
  color: var(--text);
}

.form-group label span {
  color: #ef4444;
}

.form-group label small {
  font-size: 9px;
  font-weight: 400;
  color: #8d97a8;
}

/* =========================
   INPUT
========================= */

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  box-sizing: border-box;

  padding: 9px 10px;

  border: 1px solid #dce2eb;
  border-radius: 6px;

  background: var(--white);
  color: var(--text);

  font-family: inherit;
  font-size: 10px;

  outline: none;
}

.form-group input::placeholder,
.form-group textarea::placeholder {
  color: #a8b1c0;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  border-color: var(--primary);
}

.form-group textarea {
  resize: none;
  min-height: 73px;
}

/* =========================
   DATE INPUT
========================= */

.input-with-icon {
  position: relative;
}

.input-with-icon input {
  padding-right: 32px;
}

.input-with-icon span {
  position: absolute;

  right: 10px;
  top: 50%;

  transform: translateY(-50%);

  font-size: 12px;
  color: #718096;

  pointer-events: none;
}

/* =========================
   CURRENCY
========================= */

.currency-input {
  display: flex;
  align-items: center;

  border: 1px solid #dce2eb;
  border-radius: 6px;

  overflow: hidden;
}

.currency-input span {
  padding-left: 10px;

  font-size: 10px;
  color: #8d97a8;
}

.currency-input input {
  border: none;
  border-radius: 0;
}

.currency-input:focus-within {
  border-color: var(--primary);
}

/* =========================
   FILE INPUT
========================= */

.file-input {
  display: flex;
  align-items: center;
  gap: 10px;

  min-height: 35px;
}

.file-button {
  display: inline-flex;
  align-items: center;

  padding: 8px 11px;

  border: 1px solid #dce2eb;
  border-radius: 6px;

  background: #f7f8fa;
  color: var(--text);

  font-size: 10px;
  cursor: pointer;
}

.file-button input {
  display: none;
}

.file-name {
  font-size: 9px;
  color: #9aa4b5;
}

/* =========================
   FOOTER
========================= */

.form-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;

  padding: 12px 24px 20px;

  border-top: 1px solid #e5e8ee;
}

.cancel-button,
.submit-button {
  min-width: 61px;

  padding: 8px 14px;

  border-radius: 6px;

  font-family: inherit;
  font-size: 10px;

  cursor: pointer;
}

.cancel-button {
  border: 1px solid var(--primary);

  background: var(--white);
  color: var(--primary);
}

.submit-button {
  border: 1px solid var(--primary);

  background: var(--primary);
  color: var(--white);
}

.cancel-button:hover {
  background: #f2f5ff;
}

.submit-button:hover {
  opacity: 0.9;
}

.cancel-button:disabled,
.submit-button:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

/* =========================
   RESPONSIVE
========================= */

@media (max-width: 900px) {
  .pengajuan-page {
    padding: 20px;
  }

  .three-column {
    grid-template-columns: 1fr 1fr;
  }
}

@media (max-width: 767px) {
  .pengajuan-page {
    padding: 16px;
  }

  .page-title {
    gap: 10px;
    margin-bottom: 18px;
  }

  .page-title h1 {
    font-size: 18px;
  }

  .back-icon {
    font-size: 18px;
  }

  .form-content {
    padding: 16px;
  }

  .form-content h2 {
    font-size: 18px;
    margin-bottom: 16px;
  }

  .form-row,
  .three-column {
    grid-template-columns: 1fr;
    gap: 14px;
    margin-bottom: 14px;
  }

  .form-group label {
    font-size: 11px;
  }

  .input-with-icon span {
    display: none;
  }

  .form-group input,
  .form-group select {
    min-height: 42px;
    font-size: 16px;
  }

  .form-group textarea {
    font-size: 16px;
  }

  .currency-input span {
    font-size: 12px;
  }

  .file-input {
    align-items: flex-start;
    flex-direction: column;
    gap: 8px;
  }

  .file-button {
    min-height: 40px;
    font-size: 12px;
  }

  .file-name {
    font-size: 11px;
  }

  .form-footer {
    flex-direction: column-reverse;
    padding: 12px 16px 16px;
  }

  .cancel-button,
  .submit-button {
    width: 100%;
    min-height: 44px;
    font-size: 13px;
  }
}

@media (max-width: 374px) {
  .pengajuan-page {
    padding: 12px;
  }

  .form-content {
    padding: 14px;
  }
}
</style>