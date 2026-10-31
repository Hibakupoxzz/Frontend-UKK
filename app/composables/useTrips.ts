import type { CreateTripPayload, Paginated, Trip, TripQuery } from '~/types/api'
import { apiErrorMessage, unwrapData } from '~/composables/useApi'

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
      return unwrapData(await get<Trip | { data: Trip }>(`/trips/${id}`))
    } catch (err) {
      error.value = apiErrorMessage(err, 'Gagal memuat detail perjalanan.')
      throw err
    } finally {
      loading.value = false
    }
  }

  const createTrip = async (payload: CreateTripPayload) =>
    unwrapData(await post<Trip | { data: Trip }>('/trips', payload))

  const updateTrip = async (id: number | string, payload: CreateTripPayload) =>
    unwrapData(await put<Trip | { data: Trip }>(`/trips/${id}`, payload))

  const deleteTrip = (id: number | string) => remove<{ message: string }>(`/trips/${id}`)

  const submitTrip = async (id: number | string) =>
    unwrapData(await post<Trip | { data: Trip }>(`/trips/${id}/submit`))

  const startTrip = async (id: number | string) =>
    unwrapData(await post<Trip | { data: Trip }>(`/trips/${id}/start`))

  const finishTrip = async (id: number | string) =>
    unwrapData(await post<Trip | { data: Trip }>(`/trips/${id}/finish`))

  const uploadDocument = async (id: number | string, file: File, jenis?: string) => {
    const form = new FormData()
    form.append('file', file)
    if (jenis) form.append('jenis', jenis)

    return request<{ id: number; url: string }>(`/trips/${id}/documents`, {
      method: 'POST',
      body: form,
    })
  }

  const deleteDocument = (documentId: number | string) =>
    remove<{ message: string }>(`/documents/${documentId}`)

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
    deleteDocument,
  }
}
