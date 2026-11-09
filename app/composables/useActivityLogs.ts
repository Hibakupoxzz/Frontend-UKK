import { apiErrorMessage } from '~/composables/useApi'

export interface ActivityLogItem {
  id: number
  action: string
  action_label: string
  actor: { id: number; name: string } | null
  description: string
  metadata: Record<string, unknown> | null
  created_at: string | null
}

interface ActivityLogResponse {
  data: ActivityLogItem[]
  actions: Record<string, string>
  meta: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export const useActivityLogs = () => {
  const { get } = useApi()

  const items = ref<ActivityLogItem[]>([])
  const actions = ref<Record<string, string>>({})
  const meta = ref<ActivityLogResponse['meta'] | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchLogs = async (params: { action?: string; page?: number } = {}) => {
    loading.value = true
    error.value = null

    try {
      const response = await get<ActivityLogResponse>('/activity-logs', {
        action: params.action || undefined,
        page: params.page,
      })

      items.value = response.data
      actions.value = response.actions
      meta.value = response.meta

      return response
    } catch (err) {
      error.value = apiErrorMessage(err, 'Gagal memuat log aktivitas.')
      throw err
    } finally {
      loading.value = false
    }
  }

  return {
    items,
    actions,
    meta,
    loading,
    error,
    fetchLogs,
  }
}
