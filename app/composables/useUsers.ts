import type { ApiUser, Paginated, UserQuery, UserRole } from '~/types/api'
import { apiErrorMessage } from '~/composables/useApi'

interface UserPayload {
  name: string
  email: string
  password?: string
  role: UserRole
  department?: string | null
  atasan_id?: number | null
}

export const useUsers = () => {
  const { get, post, put, remove } = useApi()

  const users = ref<ApiUser[]>([])
  const meta = ref<Paginated<ApiUser>['meta'] | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchUsers = async (params: UserQuery = {}) => {
    loading.value = true
    error.value = null

    try {
      const response = await get<Paginated<ApiUser>>('/users', {
        ...params,
        q: params.q || undefined,
        role: params.role || undefined,
      })

      users.value = response.data
      meta.value = response.meta

      return response
    } catch (err) {
      error.value = apiErrorMessage(err, 'Gagal memuat data pengguna.')
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchUser = (id: number | string) => get<ApiUser>(`/users/${id}`)

  const createUser = (payload: UserPayload) => post<ApiUser>('/users', payload)

  const updateUser = (id: number | string, payload: Partial<UserPayload>) =>
    put<ApiUser>(`/users/${id}`, payload)

  const deleteUser = (id: number | string) => remove<{ message: string }>(`/users/${id}`)

  return {
    users,
    meta,
    loading,
    error,
    fetchUsers,
    fetchUser,
    createUser,
    updateUser,
    deleteUser,
  }
}
