import { apiClient } from './client'
import type { ActiveTicketCategoriesRes } from '@/types/ticketCategory'

export const ticketCategoryApi = {
  listActive: () =>
    apiClient
      .get<{ data: ActiveTicketCategoriesRes }>('/ticket-categories/active')
      .then((r) => r.data.data.data),
}
