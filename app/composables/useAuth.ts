export type UserRole = 'admin' | 'finance' | 'hrd' | 'pegawai' | 'atasan'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  department?: string
  position?: string
  avatar?: string
  no_hp?: string
  jabatan?: string
  foto_url?: string
  signature_url?: string
  is_active?: boolean
  password_expires_in_days?: number
  password_expired?: boolean
}

interface ApiUser {
  id: string | number
  name: string
  email: string
  department?: string | null
  no_hp?: string | null
  jabatan?: string | null
  foto_url?: string | null
  signature_url?: string | null
  is_active?: boolean
  role?: string | null
  roles?: string[] | null
  password_expires_in_days?: number | null
  password_expired?: boolean | null
}

interface LoginResponse {
  token: string
  user: ApiUser
}

interface ApiErrorData {
  message?: string
  errors?: Record<string, string[]>
}

const isUserRole = (role: unknown): role is UserRole =>
  role === 'admin'
  || role === 'finance'
  || role === 'hrd'
  || role === 'pegawai'
  || role === 'atasan'

const STORAGE_KEY = 'eduabsen_user'
const TOKEN_KEY = 'eduabsen_token'

const toUser = (payload: ApiUser): User => {
  const candidates = [payload.role, ...(payload.roles ?? [])]
  const role = candidates.find((value): value is UserRole => isUserRole(value))

  if (!role) {
    throw new Error('Role pengguna tidak dikenali. Hubungi administrator.')
  }

  return {
    id: String(payload.id),
    name: payload.name,
    email: payload.email,
    role,
    department: payload.department ?? undefined,
    no_hp: payload.no_hp ?? undefined,
    jabatan: payload.jabatan ?? undefined,
    foto_url: payload.foto_url ?? undefined,
    signature_url: payload.signature_url ?? undefined,
    is_active: payload.is_active,
    password_expires_in_days: payload.password_expires_in_days ?? undefined,
    password_expired: payload.password_expired ?? undefined,
  }
}

const toErrorMessage = (error: unknown): string => {
  const data = (error as { data?: ApiErrorData }).data

  if (data?.errors) {
    const firstError = Object.values(data.errors).flat()[0]
    if (typeof firstError === 'string' && firstError) {
      return firstError
    }
  }

  if (typeof data?.message === 'string' && data.message) {
    return data.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Login gagal. Silakan coba lagi.'
}

const isValidStoredUser = (value: unknown): value is User => {
  if (!value || typeof value !== 'object') return false

  const candidate = value as Partial<User>

  return typeof candidate.id === 'string'
    && typeof candidate.name === 'string'
    && typeof candidate.email === 'string'
    && isUserRole(candidate.role)
}

export const useAuth = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string

  const user = useState<User | null>('user', () => null)
  const token = useState<string | null>('auth_token', () => null)
  const isAuthenticated = useState<boolean>('isAuthenticated', () => false)

  const persistSession = (sessionUser: User, sessionToken: string) => {
    if (!import.meta.client) return

    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionUser))
    localStorage.setItem(TOKEN_KEY, sessionToken)
  }

  const clearSession = () => {
    user.value = null
    token.value = null
    isAuthenticated.value = false

    // Bersihkan state notifikasi agar akun berikutnya tidak melihat sisa data.
    try {
      useState('notifications_items', () => []).value = []
      useState('notifications_unread', () => 0).value = 0
      useState('notifications_meta', () => null).value = null
      useState('notifications_loaded', () => false).value = false
      useState<string | null>('notifications_error', () => null).value = null
      useState('notification_preferences_loaded', () => false).value = false
      useState<string | null>('notification_preferences_error', () => null).value = null
      useState<string | null>('notification_preferences_message', () => null).value = null
    } catch {
      // useState belum tersedia (mis. di luar konteks Nuxt); abaikan.
    }

    if (import.meta.client) {
      localStorage.removeItem(STORAGE_KEY)
      localStorage.removeItem(TOKEN_KEY)
    }
  }

  const login = async (email: string, password: string): Promise<User> => {
    try {
      const response = await $fetch<LoginResponse>('/login', {
        baseURL: apiBase,
        method: 'POST',
        body: { email, password },
      })

      const loggedInUser = toUser(response.user)

      user.value = loggedInUser
      token.value = response.token
      isAuthenticated.value = true
      persistSession(loggedInUser, response.token)

      return loggedInUser
    } catch (error) {
      throw new Error(toErrorMessage(error))
    }
  }

  // Registrasi belum tersedia di API. Akun dibuat oleh administrator.
  const register = async (_userData: Omit<User, 'id'>): Promise<User> => {
    throw new Error('Registrasi belum tersedia. Silakan hubungi administrator.')
  }

  const logout = async () => {
    const activeToken = token.value

    clearSession()

    if (activeToken) {
      try {
        await $fetch('/logout', {
          baseURL: apiBase,
          method: 'POST',
          headers: { Authorization: `Bearer ${activeToken}` },
        })
      } catch {
        // Token mungkin sudah kedaluwarsa; sesi lokal tetap dibersihkan.
      }
    }

    await navigateTo('/admin/login')
  }

  const initAuth = () => {
    if (!import.meta.client) return
    if (user.value && token.value) return

    const storedUser = localStorage.getItem(STORAGE_KEY)
    const storedToken = localStorage.getItem(TOKEN_KEY)

    if (!storedUser || !storedToken) {
      clearSession()
      return
    }

    let parsed: unknown
    try {
      parsed = JSON.parse(storedUser)
    } catch {
      clearSession()
      return
    }

    if (!isValidStoredUser(parsed)) {
      clearSession()
      return
    }

    user.value = parsed
    token.value = storedToken
    isAuthenticated.value = true
  }

  // Menyinkronkan data profil terbaru (hasil PUT /me) ke sesi lokal.
  const setUser = (payload: Partial<User>) => {
    if (!user.value) return

    const updated = { ...user.value, ...payload }
    user.value = updated

    if (token.value) {
      persistSession(updated, token.value)
    }
  }

  const hasRole = (roles: UserRole | UserRole[]) => {
    if (!user.value) return false
    const roleArray = Array.isArray(roles) ? roles : [roles]
    return roleArray.includes(user.value.role)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  return {
    user: readonly(user),
    token: readonly(token),
    isAuthenticated: readonly(isAuthenticated),
    login,
    register,
    logout,
    initAuth,
    clearSession,
    setUser,
    hasRole,
    getInitials,
  }
}
