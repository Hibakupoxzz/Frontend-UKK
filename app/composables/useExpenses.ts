import type { CreateExpensePayload, Expense, ExpenseListResponse } from '~/types/api'
import { apiErrorMessage } from '~/composables/useApi'

export const useExpenses = () => {
  const { get, post, put, remove, request } = useApi()

  const expenses = ref<Expense[]>([])
  const totalBiaya = ref(0)
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchExpenses = async (tripId: number | string) => {
    loading.value = true
    error.value = null

    try {
      const response = await get<ExpenseListResponse>(`/trips/${tripId}/expenses`)
      expenses.value = response.data
      totalBiaya.value = response.total_biaya

      return response
    } catch (err) {
      error.value = apiErrorMessage(err, 'Gagal memuat data pengeluaran.')
      throw err
    } finally {
      loading.value = false
    }
  }

  const createExpense = (tripId: number | string, payload: CreateExpensePayload) =>
    post<Expense>(`/trips/${tripId}/expenses`, payload)

  const updateExpense = (id: number | string, payload: CreateExpensePayload) =>
    put<Expense>(`/expenses/${id}`, payload)

  const deleteExpense = (id: number | string) =>
    remove<{ message: string }>(`/expenses/${id}`)

  const uploadReceipt = async (expenseId: number | string, file: File) => {
    const form = new FormData()
    form.append('file', file)

    return request<{ id: number; url: string }>(`/expenses/${expenseId}/receipts`, {
      method: 'POST',
      body: form,
    })
  }

  const deleteReceipt = (receiptId: number | string) =>
    remove<{ message: string }>(`/receipts/${receiptId}`)

  return {
    expenses,
    totalBiaya,
    loading,
    error,
    fetchExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    uploadReceipt,
    deleteReceipt,
  }
}
