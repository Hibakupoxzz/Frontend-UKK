import type { AppNotification, NotificationListResponse } from '~/types/api'
import { apiErrorMessage } from '~/composables/useApi'

interface FetchOptions {
  force?: boolean
  perPage?: number
  page?: number
}

type NotificationMeta = NotificationListResponse['meta']

export const useNotifications = () => {
  const { get, post } = useApi()
  const { isAuthenticated } = useAuth()

  const items = useState<AppNotification[]>('notifications_items', () => [])
  const unreadCount = useState<number>('notifications_unread', () => 0)
  const meta = useState<NotificationMeta | null>('notifications_meta', () => null)
  const loading = useState<boolean>('notifications_loading', () => false)
  const loaded = useState<boolean>('notifications_loaded', () => false)
  const error = useState<string | null>('notifications_error', () => null)

  const fetchNotifications = async (options: FetchOptions = {}) => {
    if (!isAuthenticated.value) return null
    if (loading.value) return null
    if (loaded.value && !options.force) return null

    const page = options.page ?? 1

    loading.value = true
    error.value = null

    try {
      const response = await get<NotificationListResponse>('/notifications', {
        page,
        per_page: options.perPage ?? 15,
      })

      items.value = page === 1 ? response.data : [...items.value, ...response.data]
      unreadCount.value = response.unread_count
      meta.value = response.meta
      loaded.value = true

      return response
    } catch (err) {
      error.value = apiErrorMessage(err, 'Gagal memuat notifikasi.')
      throw err
    } finally {
      loading.value = false
    }
  }

  const loadMore = async () => {
    if (loading.value) return null
    if (!meta.value || meta.value.current_page >= meta.value.last_page) return null

    return fetchNotifications({
      force: true,
      page: meta.value.current_page + 1,
      perPage: meta.value.per_page,
    })
  }

  const refreshUnreadCount = async () => {
    if (!isAuthenticated.value || loading.value) return null

    try {
      const response = await get<{ unread_count: number }>('/notifications/unread-count')
      unreadCount.value = response.unread_count

      return response.unread_count
    } catch {
      // Polling tidak boleh mengganggu halaman; error ditampilkan saat panel dibuka.
      return null
    }
  }

  const markRead = async (id: string) => {
    const response = await post<{ data: AppNotification; unread_count: number }>(
      `/notifications/${id}/read`,
    )

    const index = items.value.findIndex((item) => item.id === id)
    if (index !== -1) {
      items.value[index] = response.data
    }

    unreadCount.value = response.unread_count

    return response.data
  }

  const markAllRead = async () => {
    await post<{ message: string; unread_count: number }>('/notifications/read-all')

    const readAt = new Date().toISOString()
    items.value = items.value.map((item) => ({
      ...item,
      read_at: item.read_at ?? readAt,
    }))
    unreadCount.value = 0
  }

  const resetNotifications = () => {
    items.value = []
    unreadCount.value = 0
    meta.value = null
    loaded.value = false
    error.value = null
  }

  return {
    items,
    unreadCount,
    meta,
    loading,
    loaded,
    error,
    fetchNotifications,
    loadMore,
    refreshUnreadCount,
    markRead,
    markAllRead,
    resetNotifications,
  }
}
