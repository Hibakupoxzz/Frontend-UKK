import type { ApiUser, CreateUserPayload, Paginated, UpdateUserPayload, UserQuery } from '~/types/api'
import { apiErrorMessage, unwrapData } from '~/composables/useApi'

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
        is_active: params.is_active === '' ? undefined : params.is_active,
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

  const fetchUser = async (id: number | string) =>
    unwrapData(await get<ApiUser | { data: ApiUser }>(`/users/${id}`))

  const createUser = async (payload: CreateUserPayload) =>
    unwrapData(await post<ApiUser | { data: ApiUser }>('/users', payload))

  const updateUser = async (id: number | string, payload: UpdateUserPayload) =>
    unwrapData(await put<ApiUser | { data: ApiUser }>(`/users/${id}`, payload))

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
