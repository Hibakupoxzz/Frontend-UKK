import type { AnalyticsData, ReportTable, TripQuery } from '~/types/api'
import { apiErrorMessage } from '~/composables/useApi'

type ReportKind = 'trips' | 'expenses' | 'bookings' | 'budgets'
type ReportFormat = 'pdf' | 'xlsx'

export const useReports = () => {
  const { get, request } = useApi()

  const tripReport = ref<ReportTable | null>(null)
  const expenseReport = ref<ReportTable | null>(null)
  const analytics = ref<AnalyticsData | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchTripReport = async (params: TripQuery = {}) => {
    loading.value = true
    error.value = null

    try {
      tripReport.value = await get<ReportTable>('/reports/trips', {
        ...params,
        format: 'json',
        status: params.status || undefined,
      })

      return tripReport.value
    } catch (err) {
      error.value = apiErrorMessage(err, 'Gagal memuat laporan perjalanan.')
      throw err
    } finally {
      loading.value = false
    }
  }

  const fetchExpenseReport = async (params: TripQuery = {}) => {
    loading.value = true
    error.value = null

    try {
      expenseReport.value = await get<ReportTable>('/reports/expenses', {
        ...params,
        format: 'json',
      })

      return expenseReport.value
    } catch (err) {
      error.value = apiErrorMessage(err, 'Gagal memuat laporan pengeluaran.')
      throw err
    } finally {
      loading.value = false
    }
  }

  const downloadReport = async (kind: ReportKind, format: ReportFormat, params: TripQuery = {}) => {
    const blob = await request<Blob>(`/reports/${kind}`, {
      query: {
        ...params,
        format,
        status: params.status || undefined,
      },
      responseType: 'blob',
    })

    if (!import.meta.client) return

    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `laporan-${kind}.${format}`
    link.click()
    URL.revokeObjectURL(url)
  }

  const fetchAnalytics = async (year: number | string) => {
    try {
      const response = await get<{ data: AnalyticsData }>('/reports/analytics', { year })
      analytics.value = response.data

      return analytics.value
    } catch (err) {
      error.value = apiErrorMessage(err, 'Gagal memuat tren belanja.')
      throw err
    }
  }

  return {
    tripReport,
    expenseReport,
    analytics,
    loading,
    error,
    fetchTripReport,
    fetchExpenseReport,
    fetchAnalytics,
    downloadReport,
  }
}
