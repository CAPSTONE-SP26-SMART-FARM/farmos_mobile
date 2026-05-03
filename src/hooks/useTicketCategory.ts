import { useQuery } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { ticketCategoryApi } from '@/services/api/ticketCategory'

export function useActiveTicketCategories(enabled = true) {
  return useQuery({
    queryKey: queryKeys.ticketCategory.active,
    queryFn: () => ticketCategoryApi.listActive(),
    staleTime: 5 * 60 * 1000,
    enabled,
  })
}
