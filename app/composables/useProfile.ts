import type { ApiUser, UpdatePasswordPayload, UpdateProfilePayload } from '~/types/api'
import { apiErrorMessage, unwrapData } from '~/composables/useApi'

export const useProfile = () => {
  const { get, put, remove, request } = useApi()
  const { setUser } = useAuth()

  const loading = ref(false)
  const error = ref<string | null>(null)

  const applyToSession = (payload: ApiUser) => {
    setUser({
      name: payload.name,
      email: payload.email,
      department: payload.department ?? undefined,
      no_hp: payload.no_hp ?? undefined,
      jabatan: payload.jabatan ?? undefined,
      foto_url: payload.foto_url ?? undefined,
      is_active: payload.is_active,
    })

    return payload
  }

  // GET /me mengembalikan objek user langsung (tanpa pembungkus `data`).
  const fetchProfile = async () => {
    error.value = null

    try {
      const result = await get<ApiUser>('/me')
      return applyToSession(result)
    } catch (err) {
      error.value = apiErrorMessage(err, 'Gagal memuat profil.')
      throw err
    }
  }

  const updateProfile = async (payload: UpdateProfilePayload) => {
    loading.value = true
    error.value = null

    try {
      const result = unwrapData(await put<ApiUser | { data: ApiUser }>('/me', payload))
      return applyToSession(result)
    } catch (err) {
      error.value = apiErrorMessage(err, 'Gagal menyimpan profil.')
      throw err
    } finally {
      loading.value = false
    }
  }

  const updatePassword = async (payload: UpdatePasswordPayload) => {
    loading.value = true
    error.value = null

    try {
      return await put<{ message: string }>('/me/password', payload)
    } catch (err) {
      error.value = apiErrorMessage(err, 'Gagal mengubah kata sandi.')
      throw err
    } finally {
      loading.value = false
    }
  }

  const uploadPhoto = async (file: File) => {
    loading.value = true
    error.value = null

    try {
      const form = new FormData()
      form.append('foto', file)

      const result = unwrapData(await request<ApiUser | { data: ApiUser }>('/me/foto', {
        method: 'POST',
        body: form,
      }))

      return applyToSession(result)
    } catch (err) {
      error.value = apiErrorMessage(err, 'Gagal mengunggah foto profil.')
      throw err
    } finally {
      loading.value = false
    }
  }

  const deletePhoto = async () => {
    loading.value = true
    error.value = null

    try {
      const result = unwrapData(await remove<ApiUser | { data: ApiUser }>('/me/foto'))
      return applyToSession(result)
    } catch (err) {
      error.value = apiErrorMessage(err, 'Gagal menghapus foto profil.')
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    fetchProfile,
    updateProfile,
    updatePassword,
    uploadPhoto,
    deletePhoto,
  }
}
