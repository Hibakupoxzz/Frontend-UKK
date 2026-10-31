import type { ApiErrorData } from '~/types/api'

type QueryValue = string | number | boolean | null | undefined
export type Query = Record<string, QueryValue>

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  query?: Query
  headers?: Record<string, string>
  responseType?: 'json' | 'blob' | 'text' | 'arrayBuffer' | 'stream'
}

export const apiErrorMessage = (error: unknown, fallback = 'Terjadi kesalahan saat memuat data.'): string => {
  const data = (error as { data?: ApiErrorData }).data

  if (data?.errors) {
    const firstError = Object.values(data.errors).flat()[0]
    if (typeof firstError === 'string' && firstError) {
      return firstError
    }
  }

  if (typeof data?.message === 'string' && data.message) {
    return data.message
  }

  if (error instanceof Error && error.message) {
    return error.message
  }

  return fallback
}

/**
 * Laravel wraps single JSON resources in a `data` key. Use this for endpoints
 * returning one resource, never for paginated collections.
 */
export const unwrapData = <T>(response: T | { data: T }): T => {
  if (response && typeof response === 'object' && 'data' in (response as Record<string, unknown>)) {
    return (response as { data: T }).data
  }

  return response as T
}

export const useApi = () => {
  const config = useRuntimeConfig()
  const apiBase = config.public.apiBase as string
  const { token, clearSession } = useAuth()

  const request = async <T>(path: string, options: RequestOptions = {}): Promise<T> => {
    try {
      return await $fetch<T>(path, {
        baseURL: apiBase,
        method: options.method ?? 'GET',
        body: options.body as Record<string, unknown> | FormData | undefined,
        query: options.query,
        responseType: options.responseType,
        headers: {
          Accept: 'application/json',
          ...(token.value ? { Authorization: `Bearer ${token.value}` } : {}),
          ...(options.headers ?? {}),
        },
      })
    } catch (error) {
      if ((error as { status?: number }).status === 401) {
        clearSession()
        await navigateTo('/admin/login')
      }

      throw error
    }
  }

  return {
    request,
    get: <T>(path: string, query?: Query) => request<T>(path, { query }),
    post: <T>(path: string, body?: unknown) => request<T>(path, { method: 'POST', body }),
    put: <T>(path: string, body?: unknown) => request<T>(path, { method: 'PUT', body }),
    remove: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
  }
}
