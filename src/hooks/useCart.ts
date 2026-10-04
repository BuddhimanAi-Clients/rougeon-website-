import { useQuery } from '@tanstack/react-query'
import { ApiError, apiRequest } from '../lib/api'
import type { ApiData, Cart } from '../types/commerce'

export const cartQueryKey = ['cart'] as const

export function useCart() {
  return useQuery({
    queryKey: cartQueryKey,
    // A definite answer from the server (for example a staff account) will not
    // change on retry; only retry network or server failures.
    retry: (failureCount, error) => failureCount < 1 && !(error instanceof ApiError && error.status >= 400 && error.status < 500),
    queryFn: async () => (await apiRequest<ApiData<Cart>>('/api/v1/cart')).data,
  })
}
