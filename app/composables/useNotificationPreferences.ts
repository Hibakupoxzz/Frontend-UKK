import type { NotificationPreferences } from '~/types/api'
import { apiErrorMessage, unwrapData } from '~/composables/useApi'

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email: true,
  in_app: true,
  travel_reminder: true,
  payment_updates: true,
}

export const useNotificationPreferences = () => {
  const { get, put } = useApi()

  const preferences = useState<NotificationPreferences>(
    'notification_preferences',
    () => ({ ...DEFAULT_PREFERENCES }),
  )
  const loading = useState<boolean>('notification_preferences_loading', () => false)
  const saving = useState<boolean>('notification_preferences_saving', () => false)
  const loaded = useState<boolean>('notification_preferences_loaded', () => false)
  const error = useState<string | null>('notification_preferences_error', () => null)
  const message = useState<string | null>('notification_preferences_message', () => null)

  const fetchPreferences = async (force = false) => {
    if (loaded.value && !force) return null

    loading.value = true
    error.value = null

    try {
      const response = await get<NotificationPreferences | { data: NotificationPreferences }>(
        '/me/notifications/preferences',
      )

      preferences.value = { ...DEFAULT_PREFERENCES, ...unwrapData(response) }
      loaded.value = true

      return preferences.value
    } catch (err) {
      error.value = apiErrorMessage(err, 'Gagal memuat preferensi notifikasi.')
      throw err
    } finally {
      loading.value = false
    }
  }

  const updatePreference = async (key: keyof NotificationPreferences) => {
    if (saving.value) return null

    const previous = { ...preferences.value }
    const next: NotificationPreferences = {
      ...previous,
      [key]: !previous[key],
    }

    preferences.value = next
    saving.value = true
    error.value = null
    message.value = null

    try {
      const response = await put<NotificationPreferences | { data: NotificationPreferences }>(
        '/me/notifications/preferences',
        { [key]: next[key] },
      )

      preferences.value = { ...DEFAULT_PREFERENCES, ...unwrapData(response) }
      message.value = 'Preferensi notifikasi berhasil disimpan.'

      return preferences.value
    } catch (err) {
      preferences.value = previous
      error.value = apiErrorMessage(err, 'Gagal menyimpan preferensi notifikasi.')

      return null
    } finally {
      saving.value = false
    }
  }

  const resetPreferences = () => {
    preferences.value = { ...DEFAULT_PREFERENCES }
    loaded.value = false
    error.value = null
    message.value = null
  }

  return {
    preferences,
    loading,
    saving,
    loaded,
    error,
    message,
    fetchPreferences,
    updatePreference,
    resetPreferences,
  }
}
