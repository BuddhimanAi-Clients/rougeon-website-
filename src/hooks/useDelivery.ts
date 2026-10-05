import { useQuery } from '@tanstack/react-query'
import { apiRequest } from '../lib/api'
import type { ApiData, DeliveryBranch } from '../types/commerce'

const HOUR = 60 * 60 * 1000

/** Delivery areas the courier serves. Changes rarely, so it is cached for the visit. */
export function useDeliveryBranches() {
  return useQuery({
    queryKey: ['delivery-branches'],
    staleTime: HOUR,
    queryFn: async () => (await apiRequest<ApiData<DeliveryBranch[]>>('/api/v1/shipping/branches')).data,
  })
}

/** The one Delivery amount the customer pays for the chosen area. */
export function useDeliveryQuote(branch: string | null | undefined) {
  return useQuery({
    queryKey: ['delivery-quote', branch],
    enabled: Boolean(branch),
    staleTime: HOUR / 2,
    retry: 1,
    queryFn: async () => (await apiRequest<ApiData<{ branch: string | null; deliveryFee: string }>>(`/api/v1/shipping/quote?branch=${encodeURIComponent(branch ?? '')}`)).data,
  })
}
