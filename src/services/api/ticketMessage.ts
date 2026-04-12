import { apiClient } from './client'
import type { CreateTicketMessageBody, ListTicketMessagesRes, TicketMessage } from '@/types/ticketMessage'

export const ticketMessageApi = {
  // limit=100 để lấy hết messages trong 1 request — chat ticket thường không quá 100 tin
  list: (ticketId: string, page = 1, limit = 100) =>
    apiClient
      .get<{ data: ListTicketMessagesRes }>(`/ticket/${ticketId}/messages?page=${page}&limit=${limit}`)
      .then((r) => r.data.data),

  send: (ticketId: string, body: CreateTicketMessageBody) =>
    apiClient
      .post<{ data: TicketMessage }, CreateTicketMessageBody>(`/ticket/${ticketId}/messages`, body)
      .then((r) => r.data.data),
}
