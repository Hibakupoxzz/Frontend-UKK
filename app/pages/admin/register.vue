
<template>
  <div class="register-page">
    <!-- LEFT BRAND SECTION -->
    <section class="brand-section">
      <div class="brand-content">
        <img
          src="~/assets/image/eduabsen.png"
          alt="Eduabsen"
          class="brand-image"
        />

        <p class="brand-description">
          Kelola perjalanan dinas menjadi lebih mudah,
          cepat, dan terorganisir.
        </p>
      </div>

      <p class="copyright">
        © 2026 Eduabsen. All rights reserved.
      </p>
    </section>

    <!-- RIGHT REGISTER SECTION -->
    <section class="form-section">
      <!-- BACK TO DASHBOARD -->
      <NuxtLink to="/admin/dashboard" class="back-home">
        <AppIcon name="arrow-left" class="back-arrow" />
        Kembali ke Dashboard
      </NuxtLink>

      <div class="register-form">
        <!-- HEADER -->
        <div class="form-header">
          <h1>Buat Akun Baru</h1>
          <p>Daftar untuk mulai mengelola perjalanan dinas</p>
        </div>

        <!-- FORM -->
        <form @submit.prevent="register">
          <!-- NAMA LENGKAP -->
          <div class="form-group">
            <label for="name">Nama Lengkap <span>*</span></label>
            <input
              id="name"
              v-model="form.name"
              type="text"
              placeholder="Masukkan nama lengkap"
              autocomplete="name"
              required
            />
          </div>

          <!-- EMAIL -->
          <div class="form-group">
            <label for="email">Email <span>*</span></label>
            <input
              id="email"
              v-model="form.email"
              type="email"
              placeholder="Masukkan email"
              autocomplete="email"
              required
            />
          </div>

          <!-- NOMOR TELEPON -->
          <div class="form-group">
            <label for="phone">Nomor Telepon <span>*</span></label>
            <input
              id="phone"
              v-model="form.phone"
              type="tel"
              placeholder="Masukkan nomor telepon"
              autocomplete="tel"
              required
            />
          </div>

          <!-- DEPARTEMEN -->
          <div class="form-group">
            <label for="department">Departemen <span>*</span></label>
            <select
              id="department"
              v-model="form.department"
              required
            >
              <option value="" disabled>Pilih departemen</option>
              <option value="Marketing">Marketing</option>
              <option value="Sales">Sales</option>
              <option value="HRD">HRD</option>
              <option value="Finance">Finance</option>
              <option value="IT">IT</option>
            </select>
          </div>

          <!-- PASSWORD -->
          <div class="form-group">
            <label for="password">Password <span>*</span></label>

            <div class="password-input">
              <input
                id="password"
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="Buat password"
                autocomplete="new-password"
                minlength="8"
                required
              />

              <button
                type="button"
                class="password-toggle"
                :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
                @click="showPassword = !showPassword"
              >
                <AppIcon :name="showPassword ? 'eye-off' : 'eye'" />
              </button>
            </div>

            <small class="input-hint">Minimal 8 karakter.</small>
          </div>

          <!-- KONFIRMASI PASSWORD -->
          <div class="form-group">
            <label for="confirmPassword">
              Konfirmasi Password <span>*</span>
            </label>

            <div class="password-input">
              <input
                id="confirmPassword"
                v-model="form.confirmPassword"
                :type="showConfirmPassword ? 'text' : 'password'"
                placeholder="Ulangi password"
                autocomplete="new-password"
                minlength="8"
                required
              />

              <button
                type="button"
                class="password-toggle"
                :aria-label="showConfirmPassword ? 'Sembunyikan password' : 'Tampilkan password'"
                @click="showConfirmPassword = !showConfirmPassword"
              >
                <AppIcon :name="showConfirmPassword ? 'eye-off' : 'eye'" />
              </button>
            </div>
          </div>

          <!-- SYARAT DAN KETENTUAN -->
          <label class="agreement">
            <input
              v-model="form.agreement"
              type="checkbox"
              required
            />

            <span>
              Saya menyetujui
              <a href="#" @click.prevent="showTerms">
                Syarat &amp; Ketentuan
              </a>
            </span>
          </label>

          <!-- REGISTER BUTTON -->
          <button type="submit" class="register-button">
            Daftar
          </button>

          <!-- ADMIN NOTE -->
          <p class="admin-note">
            Pendaftaran akun baru diproses oleh administrator.
            Jika Anda belum memiliki akun, silakan hubungi administrator instansi Anda.
          </p>

          <!-- LOGIN -->
          <p class="login-text">
            Sudah punya akun?
            <NuxtLink to="/admin/login">Masuk</NuxtLink>
          </p>
        </form>
      </div>
    </section>

    <!-- MODAL SYARAT & KETENTUAN -->
    <div
      v-if="showTermsModal"
      class="terms-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Syarat dan Ketentuan"
      @click.self="showTermsModal = false"
    >
      <div class="terms-modal">
        <div class="terms-header">
          <h2>Syarat &amp; Ketentuan</h2>
          <button
            type="button"
            class="terms-close"
            aria-label="Tutup Syarat dan Ketentuan"
            @click="showTermsModal = false"
          >
            <AppIcon name="x" />
          </button>
        </div>

        <div class="terms-body">
          <p>
            Akun EduAbsen Travel App dibuat dan dikelola oleh administrator
            instansi Anda. Dengan mencentang persetujuan ini, Anda menyatakan bahwa:
          </p>
          <ol>
            <li>
              Data yang Anda isi (nama, email, nomor HP) adalah benar dan milik Anda.
            </li>
            <li>
              Anda akan menjaga kerahasiaan kata sandi dan tidak membagikan akun
              kepada orang lain.
            </li>
            <li>
              Pengajuan perjalanan dinas, pengeluaran, dan bukti transaksi yang Anda
              catat adalah benar dan dapat dipertanggungjawabkan.
            </li>
            <li>
              Administrator dapat menonaktifkan akun yang menyalahgunakan sistem.
            </li>
          </ol>
          <p>
            Pendaftaran akun baru dilakukan oleh administrator. Jika Anda belum
            memiliki akun, silakan hubungi administrator instansi Anda.
          </p>
        </div>

        <div class="terms-footer">
          <button
            type="button"
            class="terms-agree"
            @click="acceptTerms"
          >
            Saya Mengerti
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'

definePageMeta({
  layout: 'auth'
})

const form = reactive({
  name: '',
  email: '',
  phone: '',
  department: '',
  password: '',
  confirmPassword: '',
  agreement: false
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const showTermsModal = ref(false)

const register = () => {
  if (form.password.length < 8) {
    alert('Password harus minimal 8 karakter.')
    return
  }

  if (form.password !== form.confirmPassword) {
    alert('Konfirmasi password tidak sesuai.')
    return
  }

  if (!form.agreement) {
    alert('Silakan setujui Syarat & Ketentuan.')
    return
  }

  // Belum terhubung ke backend.
  // Jangan menganggap akun sudah benar-benar dibuat.
  console.log('Data formulir registrasi siap diproses:', {
    name: form.name,
    email: form.email,
    phone: form.phone,
    department: form.department
  })

  alert('Form registrasi valid. Integrasi backend belum dilakukan.')
}

const showTerms = () => {
  showTermsModal.value = true
}

const acceptTerms = () => {
  form.agreement = true
  showTermsModal.value = false
}
</script>

<style scoped>
/* PAGE */
.register-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  background: #fff;
}

/* LEFT BRAND */
.brand-section {
  position: relative;
  width: 42%;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  background: #10192d;
  color: #fff;
}

.brand-content {
  width: 100%;
  padding: 30px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.brand-image {
  display: block;
  width: 270px;
  max-width: 100%;
  height: auto;
  object-fit: contain;
}

.brand-description {
  max-width: 310px;
  margin: 25px 0 0;
  color: #fff;
  font-size: 14px;
  line-height: 1.6;
}

.copyright {
  position: absolute;
  right: 12px;
  bottom: 18px;
  left: 12px;
  margin: 0;
  text-align: center;
  color: #8792a6;
  font-size: 10px;
}

/* RIGHT FORM */
.form-section {
  position: relative;
  flex: 1;
  min-width: 0;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 76px 32px 32px;
  box-sizing: border-box;
}

.register-form {
  width: 100%;
  max-width: 420px;
}

/* BACK TO DASHBOARD */
.back-home {
  position: absolute;
  top: 26px;
  left: 28px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  color: #64748b;
  font-size: 13px;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.2s;
}

.back-home:hover {
  color: #2d6df6;
}

.back-arrow {
  width: 18px;
  height: 18px;
}

/* HEADER */
.form-header {
  margin-bottom: 22px;
}

.form-header h1 {
  margin: 0 0 7px;
  color: #263248;
  font-size: 25px;
  font-weight: 700;
}

.form-header p {
  margin: 0;
  color: #738096;
  font-size: 13px;
  line-height: 1.5;
}

/* INPUT GROUP */
.form-group {
  margin-bottom: 13px;
}

.form-group > label {
  display: block;
  margin-bottom: 6px;
  color: #263248;
  font-size: 13px;
  font-weight: 600;
}

.form-group > label span {
  color: #ef4444;
}

.form-group input,
.form-group select {
  width: 100%;
  height: 40px;
  padding: 0 12px;
  box-sizing: border-box;
  border: 1px solid #dce3ec;
  border-radius: 6px;
  outline: none;
  background: #fff;
  color: #263248;
  font-family: inherit;
  font-size: 13px;
}

.form-group input::placeholder {
  color: #a4afbe;
  font-size: 12px;
}

.form-group input:focus,
.form-group select:focus {
  border-color: #2d6df6;
  box-shadow: 0 0 0 2px rgb(45 109 246 / 10%);
}

/* PASSWORD */
.password-input {
  position: relative;
}

.password-input input {
  padding-right: 42px;
}

.password-toggle {
  position: absolute;
  top: 50%;
  right: 12px;
  transform: translateY(-50%);
  padding: 0;
  border: none;
  background: transparent;
  color: #718096;
  cursor: pointer;
  font-size: 15px;
}

.input-hint {
  display: block;
  margin-top: 4px;
  color: #8b96a7;
  font-size: 11px;
}

/* AGREEMENT */
.agreement {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 4px 0 15px;
  color: #596579;
  font-size: 12px;
  line-height: 1.5;
  cursor: pointer;
}

.agreement input {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
  margin: 0;
  accent-color: #2d6df6;
}

.agreement a {
  color: #2d6df6;
  font-weight: 600;
  text-decoration: none;
}

/* REGISTER BUTTON */
.register-button {
  width: 100%;
  min-height: 42px;
  border: none;
  border-radius: 6px;
  background: #2d6df6;
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}

.register-button:hover {
  background: #2460df;
}

/* ADMIN NOTE */
.admin-note {
  margin: 14px 0 0;
  padding: 9px 11px;
  border: 1px dashed #dce2eb;
  border-radius: 7px;
  background: #fafbfc;
  color: #8792a5;
  font-size: 11px;
  line-height: 1.6;
  text-align: center;
}

/* LOGIN LINK */
.login-text {
  margin: 17px 0 0;
  text-align: center;
  color: #8b96a7;
  font-size: 12px;
}

.login-text a {
  color: #2d6df6;
  font-weight: 600;
  text-decoration: none;
}

/* RESPONSIVE */
@media (max-width: 900px) {
  .brand-section {
    width: 35%;
  }

  .brand-image {
    width: 220px;
  }

  .form-section {
    padding-right: 24px;
    padding-left: 24px;
  }
}

@media (max-width: 700px) {
  .register-page {
    flex-direction: column;
  }

  .brand-section {
    width: 100%;
    min-height: 200px;
  }

  .brand-content {
    padding: 24px;
  }

  .brand-image {
    width: 180px;
  }

  .brand-description {
    max-width: 280px;
    margin-top: 12px;
    font-size: 12px;
  }

  .copyright {
    display: none;
  }

  .form-section {
    min-height: auto;
    padding: 78px 22px 32px;
  }

  .back-home {
    top: 24px;
    left: 22px;
  }

  .register-form {
    max-width: 460px;
  }

  .form-group > label {
    font-size: 14px;
  }

  .form-group input,
  .form-group select {
    height: 44px;
    font-size: 16px;
  }

  .form-group input::placeholder {
    font-size: 14px;
  }

  .input-hint,
  .agreement,
  .admin-note,
  .login-text {
    font-size: 13px;
  }

  .agreement input {
    width: 16px;
    height: 16px;
  }

  .register-button,
  .google-button {
    min-height: 46px;
    font-size: 14px;
  }
}

@media (max-width: 400px) {
  .form-section {
    padding-right: 18px;
    padding-left: 18px;
  }

  .form-header h1 {
    font-size: 22px;
  }
}

/* MODAL SYARAT & KETENTUAN */
.terms-overlay {
  position: fixed;
  inset: 0;
  z-index: 2000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background: rgba(16, 25, 45, 0.55);
}

.terms-modal {
  width: 100%;
  max-width: 480px;
  max-height: calc(100vh - 60px);
  display: flex;
  flex-direction: column;
  border-radius: 12px;
  background: #fff;
  box-shadow: 0 24px 60px rgba(16, 25, 45, 0.3);
  overflow: hidden;
}

.terms-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 16px 20px;
  border-bottom: 1px solid #edf0f5;
}

.terms-header h2 {
  margin: 0;
  color: #263248;
  font-size: 16px;
  font-weight: 700;
}

.terms-close {
  width: 30px;
  height: 30px;
  padding: 0;
  border: none;
  border-radius: 50%;
  background: #f1f3f6;
  color: #667085;
  font-size: 13px;
  cursor: pointer;
}

.terms-close:hover {
  background: #e4e8ee;
}

.terms-body {
  padding: 16px 20px;
  overflow-y: auto;
  color: #475569;
  font-size: 13px;
  line-height: 1.65;
}

.terms-body p {
  margin: 0 0 10px;
}

.terms-body ol {
  margin: 0 0 10px;
  padding-left: 20px;
}

.terms-body li + li {
  margin-top: 6px;
}

.terms-footer {
  padding: 14px 20px;
  border-top: 1px solid #edf0f5;
}

.terms-agree {
  width: 100%;
  min-height: 42px;
  border: none;
  border-radius: 7px;
  background: var(--primary);
  color: #fff;
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.terms-agree:hover {
  opacity: 0.9;
}
</style>