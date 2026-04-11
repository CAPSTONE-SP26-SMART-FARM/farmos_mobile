import { apiClient } from './client'
import type { CreateTicketMessageBody, ListTicketMessagesRes, TicketMessage } from '@/types/ticketMessage'

export const ticketMessageApi = {
  list: (ticketId: string, page = 1, limit = 50) =>
    apiClient
      .get<{ data: ListTicketMessagesRes }>(`/ticket/${ticketId}/messages?page=${page}&limit=${limit}`)
      .then((r) => r.data.data),

  send: (ticketId: string, body: CreateTicketMessageBody) =>
    apiClient
      .post<{ data: TicketMessage }, CreateTicketMessageBody>(`/ticket/${ticketId}/messages`, body)
      .then((r) => r.data.data),
}
