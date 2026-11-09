<template>
  <div class="login-page">
    <!-- LEFT BRAND SECTION -->
    <section class="brand-section">
      <div class="brand-content">
        <img
          src="~/assets/image/eduabsen.png"
          alt="Eduabsen"
          class="brand-image"
        />

        <p class="brand-description">
          Kelola perjalanan dinas menjadi lebih
          mudah, cepat, dan terorganisir.
        </p>
      </div>

      <p class="copyright">
        © 2026 CTMS. All rights reserved.
      </p>
    </section>

    <!-- RIGHT LOGIN SECTION -->
    <section class="form-section">

      <div class="login-form">
        <!-- HEADER -->
        <div class="form-header">
          <h1>Selamat Datang!</h1>
          <p>Silakan masuk untuk melanjutkan</p>
        </div>

        <form @submit.prevent="handleLogin">
          <!-- EMAIL -->
          <div class="form-group">
            <label>
              Email <span>*</span>
            </label>

            <input
              v-model="form.email"
              type="email"
              placeholder="masukkan email"
              required
              autocomplete="email"
            />
          </div>

          <!-- PASSWORD -->
          <div class="form-group">
            <label>
              Password <span>*</span>
            </label>

            <div class="password-input">
              <input
                v-model="form.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="masukkan password"
                required
                autocomplete="current-password"
              />

              <button
                type="button"
                class="password-toggle"
                aria-label="Tampilkan atau sembunyikan password"
                @click="showPassword = !showPassword"
              >
                <AppIcon :name="showPassword ? 'eye-off' : 'eye'" />
              </button>
            </div>
          </div>

          <!-- REMEMBER + FORGOT -->
          <div class="login-options">
            <label class="remember">
              <input
                v-model="rememberMe"
                type="checkbox"
              />
              <span>Ingat saya</span>
            </label>

            <span class="forgot-password" title="Hubungi administrator untuk mengatur ulang password">
              Lupa password?
            </span>
          </div>

          <!-- ERROR MESSAGE -->
          <div v-if="error" class="error-message">
            {{ error }}
          </div>

          <!-- DIVIDER -->
          <div class="divider">
            <span></span>
            <p>atau masuk dengan</p>
            <span></span>
          </div>

          <!-- GOOGLE -->
          <button
            type="button"
            class="google-button"
            @click="loginWithGoogle"
            :disabled="loading"
          >
            <strong>G</strong>
            Masuk dengan Google
          </button>

          <!-- LOGIN -->
          <button type="submit" class="login-button" :disabled="loading">
            <span v-if="loading">Memproses...</span>
            <span v-else>Masuk</span>
          </button>

          <!-- REGISTER -->
          <p class="register-text">
            Belum punya akun?
            <NuxtLink to="/admin/register">
              Daftar
            </NuxtLink>
          </p>
        </form>

        <!-- DEMO ACCOUNTS -->
        <div class="demo-accounts">
          <p class="demo-title">Akun Demo (password: password123)</p>
          <div class="demo-list">
            <button
              v-for="account in demoAccounts"
              :key="account.email"
              type="button"
              class="demo-account"
              @click="fillDemoAccount(account)"
            >
              <span class="demo-role">{{ account.role }}</span>
              <span class="demo-email">{{ account.email }}</span>
            </button>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue'
import { useAuth } from '~/composables/useAuth'
import { ROLE_ROUTES } from '~/utils/nav'

definePageMeta({
  layout: 'auth'
})

const { login } = useAuth()

// FORM DATA
const form = reactive({
  email: '',
  password: ''
})

// REMEMBER ME
const rememberMe = ref(false)

// PASSWORD VISIBILITY
const showPassword = ref(false)

// LOADING STATE
const loading = ref(false)

// ERROR STATE
const error = ref<string | null>(null)

// DEMO ACCOUNTS
const demoAccounts = [
  { email: 'admin@eduabsen.com', role: 'Administrator' },
  { email: 'finance@eduabsen.com', role: 'Finance' },
  { email: 'hrd@eduabsen.com', role: 'HRD' },
  { email: 'pegawai@eduabsen.com', role: 'Pegawai' },
  { email: 'atasan@eduabsen.com', role: 'Atasan' },
]

const handleLogin = async () => {
  error.value = null
  
  if (!form.email) {
    error.value = 'Email wajib diisi.'
    return
  }

  if (!form.password) {
    error.value = 'Password wajib diisi.'
    return
  }

  loading.value = true

  try {
    const loggedInUser = await login(form.email, form.password)
    navigateTo(ROLE_ROUTES[loggedInUser.role])
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Login gagal. Silakan coba lagi.'
  } finally {
    loading.value = false
  }
}

const fillDemoAccount = (account: { email: string; role: string }) => {
  form.email = account.email
  form.password = 'password123'
  error.value = null
}

const loginWithGoogle = () => {
  alert('Fitur login Google belum diintegrasikan.')
}
</script>

<style scoped>
/* LOGIN PAGE */
.login-page {
  width: 100%;
  min-height: 100vh;
  display: flex;
  background: #ffffff;
}

/* LEFT BRAND */
.brand-section {
  width: 40%;
  min-height: 100vh;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #10192d;
  color: #ffffff;
  box-sizing: border-box;
}

.brand-content {
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 30px;
}

/* EDUABSEN IMAGE */
.brand-image {
  width: 290px;
  height: auto;
  display: block;
  object-fit: contain;
}

/* DESCRIPTION */
.brand-description {
  max-width: 310px;
  margin: 25px 0 0;
  color: #ffffff;
  font-size: 16px;
  font-weight: 600;
  line-height: 1.5;
  text-align: center;
}

/* COPYRIGHT */
.copyright {
  position: absolute;
  bottom: 18px;
  left: 0;
  right: 0;
  margin: 0;
  text-align: center;
  color: #68748b;
  font-size: 10px;
}

/* RIGHT FORM */
.form-section {
  position: relative;
  flex: 1;
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 70px 40px 40px;
  box-sizing: border-box;
}

/* BACK TO DASHBOARD */
.back-home {
  position: absolute;
  top: 28px;
  left: 32px;
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
  font-size: 22px;
  line-height: 1;
}

/* LOGIN FORM */
.login-form {
  width: 100%;
  max-width: 430px;
}

/* HEADER */
.form-header {
  margin-bottom: 28px;
}

.form-header h1 {
  margin: 0 0 6px;
  color: #263248;
  font-size: 28px;
  font-weight: 700;
}

.form-header p {
  margin: 0;
  color: #738096;
  font-size: 13px;
}

/* FORM GROUP */
.form-group {
  margin-bottom: 17px;
}

.form-group label {
  display: block;
  margin-bottom: 7px;
  color: #263248;
  font-size: 12px;
  font-weight: 600;
}

.form-group label span {
  color: #ef4444;
}

/* INPUT */
.form-group input {
  width: 100%;
  height: 42px;
  box-sizing: border-box;
  padding: 0 13px;
  border: 1px solid #dce3ec;
  border-radius: 6px;
  outline: none;
  background: #ffffff;
  color: #263248;
  font-family: inherit;
  font-size: 12px;
}

.form-group input::placeholder {
  color: #a4afbe;
  font-size: 12px;
}

.form-group input:focus {
  border-color: #2d6df6;
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
  font-size: 14px;
}

/* LOGIN OPTIONS */
.login-options {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 3px;
  margin-bottom: 25px;
}

.remember {
  display: flex;
  align-items: center;
  gap: 7px;
  color: #596579;
  font-size: 11px;
  cursor: pointer;
}

.remember input {
  width: 14px;
  height: 14px;
  margin: 0;
  accent-color: #2d6df6;
  cursor: pointer;
}

.forgot-password {
  color: #2d6df6;
  text-decoration: none;
  font-size: 11px;
  font-weight: 500;
}

/* ERROR MESSAGE */
.error-message {
  margin-bottom: 16px;
  padding: 10px 12px;
  border-radius: 6px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  font-size: 12px;
  font-weight: 500;
}

/* DIVIDER */
.divider {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 0 0 15px;
}

.divider span {
  flex: 1;
  height: 1px;
  background: #e5e9ef;
}

.divider p {
  margin: 0;
  color: #a0aaba;
  font-size: 10px;
}

/* GOOGLE BUTTON */
.google-button {
  width: 100%;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 9px;
  border: 1px solid #dce3ec;
  border-radius: 6px;
  background: #ffffff;
  color: #344054;
  font-family: inherit;
  font-size: 12px;
  cursor: pointer;
  transition: 0.2s;
}

.google-button:hover:not(:disabled) {
  background: #f8fafc;
}

.google-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.google-button strong {
  color: #4285f4;
  font-size: 17px;
  font-weight: 700;
}

/* LOGIN BUTTON */
.login-button {
  width: 100%;
  height: 42px;
  margin-top: 12px;
  border: none;
  border-radius: 6px;
  background: #2d6df6;
  color: #ffffff;
  font-family: inherit;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: 0.2s;
}

.login-button:hover:not(:disabled) {
  background: #2460df;
}

.login-button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

/* REGISTER TEXT */
.register-text {
  margin: 18px 0 0;
  text-align: center;
  color: #8b96a7;
  font-size: 11px;
}

.register-text a {
  color: #2d6df6;
  text-decoration: none;
  font-weight: 600;
}

/* DEMO ACCOUNTS */
.demo-accounts {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #e5e9ef;
}

.demo-title {
  margin: 0 0 12px;
  font-size: 11px;
  font-weight: 600;
  color: #8b96a7;
  text-align: center;
}

.account-note {
  margin: 12px 0 0;
  color: #8b96a7;
  font-size: 10px;
  line-height: 1.5;
  text-align: center;
}

.demo-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.demo-account {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border: 1px solid #dce3ec;
  border-radius: 6px;
  background: #fafbfc;
  color: #344054;
  font-size: 12px;
  cursor: pointer;
  transition: 0.2s;
  text-align: left;
}

.demo-account:hover {
  background: #f0f4f8;
  border-color: #2d6df6;
}

.demo-role {
  font-weight: 600;
  color: #2d6df6;
  font-size: 11px;
  background: #eef3ff;
  padding: 2px 8px;
  border-radius: 4px;
}

.demo-email {
  font-size: 11px;
  color: #64748b;
}

/* RESPONSIVE */
@media (max-width: 800px) {
  .login-page {
    flex-direction: column;
  }

  .brand-section {
    width: 100%;
    min-height: 280px;
  }

  .brand-image {
    width: 220px;
  }

  .brand-description {
    margin-top: 15px;
    font-size: 13px;
  }

  .copyright {
    display: none;
  }

  .form-section {
    min-height: auto;
    padding: 80px 20px 35px;
  }

  .back-home {
    top: 24px;
    left: 20px;
  }

  .form-group label {
    font-size: 13px;
  }

  .form-group input {
    height: 44px;
    font-size: 16px;
  }

  .form-group input::placeholder {
    font-size: 14px;
  }

  .password-toggle {
    font-size: 16px;
  }

  .login-options {
    flex-wrap: wrap;
    gap: 10px;
  }

  .remember,
  .forgot-password {
    font-size: 12px;
  }

  .remember input {
    width: 16px;
    height: 16px;
  }

  .divider p,
  .register-text {
    font-size: 12px;
  }

  .google-button,
  .login-button {
    height: 46px;
    font-size: 13px;
  }

  .demo-account {
    font-size: 13px;
  }

  .demo-role {
    font-size: 12px;
  }

  .demo-email {
    font-size: 12px;
  }
}

@media (max-width: 480px) {
  .brand-section {
    min-height: 220px;
  }

  .brand-image {
    width: 170px;
  }

  .brand-description {
    max-width: 260px;
    font-size: 12px;
  }

  .form-section {
    padding: 72px 18px 30px;
  }

  .back-home {
    top: 22px;
    left: 18px;
    font-size: 12px;
  }

  .form-header h1 {
    font-size: 24px;
  }

  .login-form {
    max-width: 100%;
  }

  .demo-list {
    gap: 6px;
  }

  .demo-account {
    padding: 8px 10px;
  }
}

@media (max-width: 374px) {
  .brand-section {
    min-height: 190px;
  }

  .brand-image {
    width: 150px;
  }

  .form-section {
    padding: 66px 14px 26px;
  }

  .form-header h1 {
    font-size: 22px;
  }
}
</style>