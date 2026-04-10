import { apiClient } from './client'
import type { CreateIncidentBody, IncidentTicket, ListIncidentTicketsRes } from '@/types/incident'

export const incidentApi = {
  list: (page = 1, limit = 20) =>
    apiClient
      .get<{ data: ListIncidentTicketsRes }>(`/ticket/incident/farmer?page=${page}&limit=${limit}`)
      .then((r) => r.data.data),

  detail: (ticketId: string) =>
    apiClient
      .get<{ data: IncidentTicket }>(`/ticket/incident/farmer/${ticketId}`)
      .then((r) => r.data.data),

  create: (body: CreateIncidentBody) =>
    apiClient
      .post<{ data: IncidentTicket }, CreateIncidentBody>('/ticket/incident', body)
      .then((r) => r.data.data),
}
