import { apiClient } from './client'
import type {
  CreateIncidentBody, IncidentTicket, ListIncidentTicketsRes, TicketBalanceItem,
  ListTicketsFilter, ListDoctorTicketsFilter,
} from '@/types/incident'
import type { FarmerMyMilestone } from '@/types/production'

export const incidentApi = {
  // Farmer endpoints — v2
  list: (page = 1, limit = 20, filter: ListTicketsFilter = {}) => {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (filter.status) q.set('status', filter.status)
    if (filter.dateRange) q.set('dateRange', filter.dateRange)
    if (filter.search) q.set('search', filter.search)
    return apiClient
      .get<{ data: ListIncidentTicketsRes }>(`/tickets?${q.toString()}`)
      .then((r) => r.data.data)
  },

  detail: (ticketId: string) =>
    apiClient
      .get<{ data: IncidentTicket }>(`/tickets/${ticketId}`)
      .then((r) => r.data.data),

  create: (body: CreateIncidentBody) =>
    apiClient
      .post<{ data: IncidentTicket }>('/tickets', body)
      .then((r) => r.data.data),

  cancel: (ticketId: string, reason?: string) =>
    apiClient
      .post<{ data: IncidentTicket }>(`/tickets/${ticketId}/cancel`, { reason })
      .then((r) => r.data.data),

  myMilestones: () =>
    apiClient
      .get<{ data: { data: FarmerMyMilestone[] } }>('/production-milestone/farmer/my-milestones')
      .then((r) => r.data.data.data),


  getTicketBalance: () =>
    apiClient
      .get<{ data: { data: TicketBalanceItem[] } }>('/me/ticket-balance')
      .then((r) => r.data.data.data),

  // Doctor endpoints — giữ v1
  doctorList: (page = 1, limit = 20, filter: ListDoctorTicketsFilter = {}) => {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (filter.ended !== undefined) q.set('ended', String(filter.ended))
    if (filter.status) q.set('status', filter.status)
    if (filter.dateRange) q.set('dateRange', filter.dateRange)
    if (filter.search) q.set('search', filter.search)
    return apiClient
      .get<{ data: ListIncidentTicketsRes }>(`/ticket/incident/doctor?${q.toString()}`)
      .then((r) => r.data.data)
  },

  doctorDetail: (ticketId: string) =>
    apiClient
      .get<{ data: IncidentTicket }>(`/ticket/incident/doctor/${ticketId}`)
      .then((r) => r.data.data),

  acceptIncident: (ticketId: string) =>
    apiClient
      .put<{ data: IncidentTicket }>(`/ticket/incident/doctor/${ticketId}/accept`, {})
      .then((r) => r.data.data),
}
