import type { Paginated, Trip } from '~/types/api'
import { apiErrorMessage } from '~/composables/useApi'

export const useApprovals = () => {
  const { get, post } = useApi()

  const approvals = ref<Trip[]>([])
  const meta = ref<Paginated<Trip>['meta'] | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchApprovals = async (page = 1) => {
    loading.value = true
    error.value = null

    try {
      const response = await get<Paginated<Trip>>('/approvals', { page })
      approvals.value = response.data
      meta.value = response.meta

      return response
    } catch (err) {
      error.value = apiErrorMessage(err, 'Gagal memuat daftar persetujuan.')
      throw err
    } finally {
      loading.value = false
    }
  }

  const approve = (id: number | string, catatan?: string) =>
    post<Trip>(`/trips/${id}/approve`, { catatan: catatan || null })

  const reject = (id: number | string, catatan: string) =>
    post<Trip>(`/trips/${id}/reject`, { catatan })

  const complete = (id: number | string) =>
    post<Trip>(`/trips/${id}/complete`)

  return {
    approvals,
    meta,
    loading,
    error,
    fetchApprovals,
    approve,
    reject,
    complete,
  }
}
