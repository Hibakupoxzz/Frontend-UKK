import type { CreateTripPayload, Paginated, Trip, TripQuery } from '~/types/api'
import { apiErrorMessage } from '~/composables/useApi'

export const useTrips = () => {
  const { get, post, put, remove, request } = useApi()

  const trips = ref<Trip[]>([])
  const meta = ref<Paginated<Trip>['meta'] | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchTrips = async (params: TripQuery = {}) => {
    loading.value = true
    error.value = null

    try {
      const response = await get<Paginated<Trip>>('/trips', {
        ...params,
        status: params.status || undefined,
        tujuan: params.tujuan || undefined,
        dari: params.dari || undefined,
        sampai: params.sampai || undefined,
      })

      trips.value = response.data
      meta.value = response.meta

      return response
    } catch (err) {
      error.value = apiErrorMessage(err, 'Gagal memuat data perjalanan.')
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchTrip = async (id: number | string) => {
    loading.value = true
    error.value = null

    try {
      return await get<Trip>(`/trips/${id}`)
    } catch (err) {
      error.value = apiErrorMessage(err, 'Gagal memuat detail perjalanan.')
      throw err
    } finally {
      loading.value = false
    }
  }

  const createTrip = (payload: CreateTripPayload) => post<Trip>('/trips', payload)

  const updateTrip = (id: number | string, payload: CreateTripPayload) => put<Trip>(`/trips/${id}`, payload)

  const deleteTrip = (id: number | string) => remove<{ message: string }>(`/trips/${id}`)

  const submitTrip = (id: number | string) => post<Trip>(`/trips/${id}/submit`)

  const startTrip = (id: number | string) => post<Trip>(`/trips/${id}/start`)

  const finishTrip = (id: number | string) => post<Trip>(`/trips/${id}/finish`)

  const uploadDocument = async (id: number | string, file: File, jenis?: string) => {
    const form = new FormData()
    form.append('file', file)
    if (jenis) form.append('jenis', jenis)

    return request<{ id: number; url: string }>(`/trips/${id}/documents`, {
      method: 'POST',
      body: form,
    })
  }

  return {
    trips,
    meta,
    loading,
    error,
    fetchTrips,
    fetchTrip,
    createTrip,
    updateTrip,
    deleteTrip,
    submitTrip,
    startTrip,
    finishTrip,
    uploadDocument,
  }
}
