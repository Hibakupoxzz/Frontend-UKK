import type { DashboardResponse, DashboardSummary } from '~/types/api'
import { apiErrorMessage } from '~/composables/useApi'

export const useDashboard = () => {
  const { get } = useApi()

  const summary = ref<DashboardSummary | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchDashboard = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await get<DashboardResponse>('/dashboard')
      summary.value = response.data

      return response.data
    } catch (err) {
      error.value = apiErrorMessage(err, 'Gagal memuat ringkasan dashboard.')
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    summary,
    loading,
    error,
    fetchDashboard,
  }
}
