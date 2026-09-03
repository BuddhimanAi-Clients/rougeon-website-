import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../lib/api'
import type { ApiData, Cart } from '../types/commerce'

export const cartQueryKey = ['cart'] as const

export function useCart() {
  return useQuery({
    queryKey: cartQueryKey,
    queryFn: async () => (await apiRequest<ApiData<Cart>>('/api/v1/cart')).data,
  })
}
