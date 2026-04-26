import { apiClient } from './client'
import type { CreateIncidentBody, IncidentTicket, ListIncidentTicketsRes, TicketStatus } from '@/types/incident'
import type { FarmerMyMilestone, FarmerAssignment } from '@/types/production'

export const incidentApi = {
  // Farmer endpoints
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

  myMilestones: () =>
    apiClient
      .get<{ data: { data: FarmerMyMilestone[] } }>('/production-milestone/farmer/my-milestones')
      .then((r) => r.data.data.data),

  myAssignments: () =>
    apiClient
      .get<{ data: { data: FarmerAssignment[] } }>('/sensor-reading/farmer/my-assignments')
      .then((r) => r.data.data.data),

  endIncident: (ticketId: string) =>
    apiClient
      .put<{ data: IncidentTicket }>(`/ticket/incident/${ticketId}/end`, {})
      .then((r) => r.data.data),

  updateStatus: (ticketId: string, status: TicketStatus) =>
    apiClient
      .put<{ data: IncidentTicket }>(`/ticket/incident/farmer/${ticketId}/status`, { status })
      .then((r) => r.data.data),

  // Doctor endpoints
  doctorList: (page = 1, limit = 20, ended?: boolean) => {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (ended !== undefined) q.set('ended', String(ended))
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
