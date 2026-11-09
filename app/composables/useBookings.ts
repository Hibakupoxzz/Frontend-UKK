import type { Booking, BookingQuery, CreateBookingPayload, Paginated, UpdateBookingPayload } from '~/types/api'
import { apiErrorMessage, unwrapData } from '~/composables/useApi'

export const useBookings = () => {
  const { get, post, put, remove } = useApi()

  const bookings = ref<Booking[]>([])
  const meta = ref<Paginated<Booking>['meta'] | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchBookings = async (params: BookingQuery = {}) => {
    loading.value = true
    error.value = null

    try {
      const response = await get<Paginated<Booking>>('/bookings', {
        ...params,
        trip_id: params.trip_id || undefined,
        jenis: params.jenis || undefined,
        status: params.status || undefined,
      })

      bookings.value = response.data
      meta.value = response.meta

      return response
    } catch (err) {
      error.value = apiErrorMessage(err, 'Gagal memuat data pemesanan.')
      throw err
    } finally {
      loading.value = false
    }
  }

  const createBooking = async (tripId: number | string, payload: CreateBookingPayload) =>
    unwrapData(await post<Booking | { data: Booking }>(`/trips/${tripId}/bookings`, payload))

  const updateBooking = async (id: number | string, payload: UpdateBookingPayload) =>
    unwrapData(await put<Booking | { data: Booking }>(`/bookings/${id}`, payload))

  const deleteBooking = (id: number | string) =>
    remove<{ message: string }>(`/bookings/${id}`)

  return {
    bookings,
    meta,
    loading,
    error,
    fetchBookings,
    createBooking,
    updateBooking,
    deleteBooking,
  }
}
