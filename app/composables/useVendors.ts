import type { CreateVendorPayload, Vendor } from '~/types/api'
import { apiErrorMessage, unwrapData } from '~/composables/useApi'

export const useVendors = () => {
  const { get, post, put, remove } = useApi()

  const vendors = ref<Vendor[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchVendors = async (onlyActive = true) => {
    loading.value = true
    error.value = null

    try {
      const response = await get<{ data: Vendor[] }>('/vendors', {
        aktif: onlyActive ? 1 : undefined,
        per_page: 100,
      })

      vendors.value = response.data

      return vendors.value
    } catch (err) {
      error.value = apiErrorMessage(err, 'Gagal memuat direktori vendor.')
      throw err
    } finally {
      loading.value = false
    }
  }

  const createVendor = async (payload: CreateVendorPayload) =>
    unwrapData(await post<Vendor | { data: Vendor }>('/vendors', payload))

  const updateVendor = async (id: number, payload: CreateVendorPayload) =>
    unwrapData(await put<Vendor | { data: Vendor }>(`/vendors/${id}`, payload))

  const deleteVendor = (id: number) => remove<{ message: string }>(`/vendors/${id}`)

  return {
    vendors,
    loading,
    error,
    fetchVendors,
    createVendor,
    updateVendor,
    deleteVendor,
  }
}
