import type { Budget, CreateBudgetPayload } from '~/types/api'
import { apiErrorMessage, unwrapData } from '~/composables/useApi'

export const useBudgets = () => {
  const { get, post, put, remove } = useApi()

  const budgets = ref<Budget[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const fetchBudgets = async (periode?: string) => {
    loading.value = true
    error.value = null

    try {
      const response = await get<Budget[] | { data: Budget[] }>('/budgets', {
        periode: periode || undefined,
      })

      budgets.value = unwrapData(response)

      return budgets.value
    } catch (err) {
      error.value = apiErrorMessage(err, 'Gagal memuat pagu anggaran.')
      throw err
    } finally {
      loading.value = false
    }
  }

  const createBudget = async (payload: CreateBudgetPayload) =>
    unwrapData(await post<Budget | { data: Budget }>('/budgets', payload))

  const updateBudget = async (id: number, payload: CreateBudgetPayload) =>
    unwrapData(await put<Budget | { data: Budget }>(`/budgets/${id}`, payload))

  const deleteBudget = (id: number) => remove<{ message: string }>(`/budgets/${id}`)

  return {
    budgets,
    loading,
    error,
    fetchBudgets,
    createBudget,
    updateBudget,
    deleteBudget,
  }
}
