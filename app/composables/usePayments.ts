import type { Paginated, Payment, PaymentQuery, PaymentStatus } from '~/types/api'
import { apiErrorMessage, unwrapData } from '~/composables/useApi'

export interface VerifyPaymentPayload {
  jumlah_disetujui?: number | null
  catatan?: string | null
}

export interface PayPaymentPayload {
  metode: 'transfer' | 'tunai'
  no_referensi?: string | null
  catatan?: string | null
  bukti?: File | null
}

const ACTIVE_STATUSES: PaymentStatus[] = ['diajukan', 'disetujui', 'dibayar']

export const usePayments = () => {
  const { get, post, request } = useApi()

  const payments = ref<Payment[]>([])
  const meta = ref<Paginated<Payment>['meta'] | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchPayments = async (params: PaymentQuery = {}) => {
    loading.value = true
    error.value = null

    try {
      const response = await get<Paginated<Payment>>('/payments', {
        ...params,
        status: params.status || undefined,
        q: params.q || undefined,
        trip_id: params.trip_id || undefined,
      })

      payments.value = response.data
      meta.value = response.meta

      return response
    } catch (err) {
      error.value = apiErrorMessage(err, 'Gagal memuat data pembayaran.')
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchPayment = async (id: number | string) => {
    loading.value = true
    error.value = null

    try {
      return unwrapData(await get<Payment | { data: Payment }>(`/payments/${id}`))
    } catch (err) {
      error.value = apiErrorMessage(err, 'Gagal memuat detail pembayaran.')
      throw err
    } finally {
      loading.value = false
    }
  }

  const requestPayment = async (tripId: number | string, payload: { jumlah_diajukan?: number; catatan?: string | null } = {}) =>
    unwrapData(await post<Payment | { data: Payment }>(`/trips/${tripId}/payments`, {
      jumlah_diajukan: payload.jumlah_diajukan || undefined,
      catatan: payload.catatan || null,
    }))

  const verifyPayment = async (id: number | string, payload: VerifyPaymentPayload = {}) =>
    unwrapData(await post<Payment | { data: Payment }>(`/payments/${id}/verify`, {
      jumlah_disetujui: payload.jumlah_disetujui || undefined,
      catatan: payload.catatan || null,
    }))

  const rejectPayment = async (id: number | string, catatan: string) =>
    unwrapData(await post<Payment | { data: Payment }>(`/payments/${id}/reject`, { catatan }))

  const payPayment = async (id: number | string, payload: PayPaymentPayload) => {
    const form = new FormData()
    form.append('metode', payload.metode)

    if (payload.no_referensi) form.append('no_referensi', payload.no_referensi)
    if (payload.catatan) form.append('catatan', payload.catatan)
    if (payload.bukti) form.append('bukti', payload.bukti)

    return unwrapData(await request<Payment | { data: Payment }>(`/payments/${id}/pay`, {
      method: 'POST',
      body: form,
    }))
  }

  const hasActivePayment = (items: Payment[]) => items.some((item) => ACTIVE_STATUSES.includes(item.status))

  return {
    payments,
    meta,
    loading,
    error,
    fetchPayments,
    fetchPayment,
    requestPayment,
    verifyPayment,
    rejectPayment,
    payPayment,
    hasActivePayment,
  }
}
