import { apiClient } from './client'
import type { CreateIncidentBody, IncidentTicket, ListIncidentTicketsRes } from '@/types/incident'
import type { FarmerMyMilestone, FarmerAssignment } from '@/types/production'

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

  myMilestones: () =>
    apiClient
      .get<{ data: { data: FarmerMyMilestone[] } }>('/production-milestone/farmer/my-milestones')
      .then((r) => r.data.data.data),

  myAssignments: () =>
    apiClient
      .get<{ data: { data: FarmerAssignment[] } }>('/sensor-reading/farmer/my-assignments')
      .then((r) => r.data.data.data),
}
