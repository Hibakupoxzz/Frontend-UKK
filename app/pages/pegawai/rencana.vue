<template>
  <div class="pegawai-rencana-page">
    <!-- Breadcrumb -->
    <div class="breadcrumb">
      <NuxtLink to="/dashboard">Dashboard</NuxtLink>
      <AppIcon name="chevron-right" class="crumb-sep" />
      <NuxtLink to="/pegawai/dashboard">Pegawai</NuxtLink>
      <AppIcon name="chevron-right" class="crumb-sep" />
      <strong>Rencana Perjalanan</strong>
    </div>

    <!-- Header -->
    <div class="page-header">
      <h1>Buat Rencana Perjalanan</h1>
    </div>

    <!-- Form Card -->
    <div class="form-card">
      <div class="form-content">
        <h2>Formulir Pengajuan Perjalanan Dinas</h2>

        <!-- Row 1 -->
        <div class="form-row">
          <div class="form-group">
            <label>Tujuan Kota <span>*</span></label>
            <input v-model="form.tujuan" type="text" placeholder="Pilih kota tujuan" required/>
          </div>

          <div class="form-group">
            <label>Tanggal Berangkat <span>*</span></label>
            <div class="input-with-icon">
              <input v-model="form.tanggal_berangkat" type="date" :min="today" required/>
            </div>
          </div>

          <div class="form-group">
            <label>Tanggal Kembali <span>*</span></label>
            <div class="input-with-icon">
              <input v-model="form.tanggal_pulang" type="date" :min="form.tanggal_berangkat || today" required/>
            </div>
          </div>
        </div>

        <!-- Row 2 -->
        <div class="form-row">
          <div class="form-group">
            <label>Kebutuhan Perjalanan <small>(Opsional)</small></label>
            <select v-model="form.needs">
              <option value="">Tidak ada kebutuhan khusus</option>
              <option value="transportasi">Transportasi</option>
              <option value="penginapan">Penginapan</option>
            </select>
          </div>

          <div class="form-group">
            <label>Estimasi Biaya <small>(Opsional)</small></label>
            <div class="currency-input">
              <span>Rp</span>
              <input
                v-model.number="form.estimasi_biaya"
                type="number"
                min="0"
                step="1000"
                placeholder="0"
              />
            </div>
          </div>
        </div>

        <!-- Row 3 -->
        <div class="form-row">
          <div class="form-group full">
            <label>Tujuan/Keperluan <span>*</span></label>
            <textarea v-model="form.keperluan" rows="4" placeholder="Masukkan tujuan atau keperluan perjalanan secara detail..." required></textarea>
          </div>
        </div>
      </div>

      <!-- Footer -->
      <div class="form-footer">
        <button
          type="button"
          class="cancel-button"
          @click="resetForm"
          :disabled="loading"
        >
          Batal
        </button>

        <button
          type="button"
          class="submit-button"
          @click="handleSubmit"
          :disabled="loading"
        >
          {{ loading ? 'Mengirim...' : 'Ajukan Perjalanan' }}
        </button>
      </div>

      <p v-if="message" class="form-feedback success" role="status">{{ message }}</p>
      <p v-if="errorMessage" class="form-feedback error" role="alert">{{ errorMessage }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
// Form state can be added here

import { computed, reactive, ref } from 'vue'
import { useTrips } from '~/composables/useTrips'
import { apiErrorMessage } from '~/composables/useApi'

const { createTrip, submitTrip } = useTrips()

const today = computed(() => {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
})

const form = reactive({
  tujuan: '',
  tanggal_berangkat: '',
  tanggal_pulang: '',
  keperluan: '',
  estimasi_biaya: '' as number | '',
  needs: '' as '' | 'transportasi' | 'penginapan',
})

const loading = ref(false)
const message = ref('')
const errorMessage = ref('')

const resetForm = () => {
  form.tujuan = ''
  form.tanggal_berangkat = ''
  form.tanggal_pulang = ''
  form.keperluan = ''
  form.estimasi_biaya = ''
  form.needs = ''
  message.value = ''
  errorMessage.value = ''
}

const handleSubmit = async () => {
  message.value = ''
  errorMessage.value = ''

  if (
    !form.tujuan.trim() ||
    !form.tanggal_berangkat ||
    !form.tanggal_pulang ||
    !form.keperluan.trim()
  ) {
    errorMessage.value = 'Lengkapi semua field wajib.'
    return
  }

  if (form.tanggal_pulang < form.tanggal_berangkat) {
    errorMessage.value = 'Tanggal kembali tidak boleh sebelum tanggal berangkat.'
    return
  }

  const estimasi = form.estimasi_biaya === '' ? null : Number(form.estimasi_biaya)

  if (estimasi !== null && (!Number.isFinite(estimasi) || estimasi < 0)) {
    errorMessage.value = 'Estimasi biaya tidak valid.'
    return
  }

  loading.value = true

  try {
    const created = await createTrip({
      tujuan: form.tujuan.trim(),
      tanggal_berangkat: form.tanggal_berangkat,
      tanggal_pulang: form.tanggal_pulang,
      keperluan: form.keperluan.trim(),
      estimasi_biaya: estimasi,
      needs: form.needs
        ? [{ jenis: form.needs, keterangan: null }]
        : undefined,
    })

    await submitTrip(created.id)

    message.value = 'Perjalanan berhasil diajukan!'
    resetForm()
  } catch (err) {
    errorMessage.value = apiErrorMessage(
      err,
      'Gagal mengajukan perjalanan. Periksa koneksi atau respons API.'
    )
  } finally {
    loading.value = false
  }
}

</script>

<style scoped>
.pegawai-rencana-page {
  width: 100%;
  min-height: calc(100vh - 70px);
  padding: 24px 28px;
  background: #f5f6f8;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
  margin-bottom: 24px;
}

.page-header h1 { margin: 0; font-size: 23px; font-weight: 700; color: var(--text); }

/* FORM CARD */
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

/* FORM ROW */
.form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-bottom: 18px; }

/* FORM GROUP */
.form-group { display: flex; flex-direction: column; gap: 7px; }
.form-group.full { grid-column: 1 / -1; }

.form-group label { font-size: 12px; font-weight: 600; color: var(--text); }
.form-group label span { color: #ef4444; }

/* INPUT */
.form-group input, .form-group select, .form-group textarea {
  width: 100%; box-sizing: border-box; padding: 9px 10px;
  border: 1px solid #dce2eb; border-radius: 6px;
  background: var(--white); color: var(--text);
  font-family: inherit; font-size: 10px; outline: none;
}
.form-group input::placeholder, .form-group textarea::placeholder { color: #a8b1c0; }
.form-group input:focus, .form-group select:focus, .form-group textarea:focus { border-color: var(--primary); }

/* CURRENCY */
.currency-input { display: flex; align-items: center; border: 1px solid #dce2eb; border-radius: 6px; overflow: hidden; }
.currency-input span { padding-left: 10px; font-size: 10px; color: #8d97a8; }
.currency-input input { border: none; border-radius: 0; }

/* FILE INPUT */
.file-input { display: flex; align-items: center; gap: 10px; min-height: 35px; }
.file-button { display: inline-flex; align-items: center; padding: 8px 11px; border: 1px solid #dce2eb; border-radius: 6px; background: #f7f8fa; color: var(--text); font-size: 10px; cursor: pointer; }
.file-button input { display: none; }
.file-name { font-size: 9px; color: #9aa4b5; }

/* FOOTER */
.form-footer { display: flex; justify-content: flex-end; gap: 10px; padding: 12px 24px 20px; border-top: 1px solid #e5e8ee; }
.form-feedback { margin: 0; padding: 10px 24px 16px; font-size: 11px; }
.form-feedback.success { color: #18a77c; }
.form-feedback.error { color: #dc2626; }
.cancel-button, .submit-button { min-width: 61px; padding: 8px 14px; border-radius: 6px; font-family: inherit; font-size: 10px; cursor: pointer; }
.cancel-button { border: 1px solid var(--primary); background: var(--white); color: var(--primary); }
.submit-button { border: 1px solid var(--primary); background: var(--primary); color: var(--white); }
.cancel-button:hover { background: #f2f5ff; }
.submit-button:hover { opacity: 0.9; }

/* RESPONSIVE */
@media (max-width: 900px) {
  .form-row { grid-template-columns: 1fr 1fr; gap: 14px; margin-bottom: 14px; }
  .three-column { grid-template-columns: 1fr 1fr; }
}

@media (max-width: 767px) {
  .pegawai-rencana-page { padding: 16px; }
  .form-row, .three-column { grid-template-columns: 1fr; gap: 14px; margin-bottom: 14px; }
  .form-group label { font-size: 11px; }
  .form-group input, .form-group select { height: 40px; font-size: 16px; }
  .form-group textarea { font-size: 16px; }
  .currency-input span { font-size: 12px; }
  .file-button { height: 40px; font-size: 12px; }
  .file-name { font-size: 11px; }
  .form-footer { flex-direction: column-reverse; padding: 12px 16px 16px; }
  .cancel-button, .submit-button { width: 100%; min-height: 44px; font-size: 13px; }
}

@media (max-width: 374px) {
  .form-content { padding: 14px; }
}
</style>