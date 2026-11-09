import type { TripComment } from '~/types/api'
import { apiErrorMessage, unwrapData } from '~/composables/useApi'

export const useTripComments = () => {
  const { get, post, remove } = useApi()

  const comments = ref<TripComment[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchComments = async (tripId: number | string) => {
    loading.value = true
    error.value = null

    try {
      const response = await get<{ data: TripComment[] }>(`/trips/${tripId}/comments`)
      comments.value = response.data

      return comments.value
    } catch (err) {
      error.value = apiErrorMessage(err, 'Gagal memuat diskusi.')
      throw err
    } finally {
      loading.value = false
    }
  }

  const createComment = async (tripId: number | string, body: string) =>
    unwrapData(await post<TripComment | { data: TripComment }>(`/trips/${tripId}/comments`, { body }))

  const deleteComment = (id: number) => remove<{ message: string }>(`/comments/${id}`)

  const resetComments = () => {
    comments.value = []
    error.value = null
  }

  return {
    comments,
    loading,
    error,
    fetchComments,
    createComment,
    deleteComment,
    resetComments,
  }
}
