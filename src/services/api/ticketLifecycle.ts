import { apiClient } from './client'
import type { AbandonResolutionBody, RateTicketBody } from '@/types/ticketLifecycle'
import type { ResolveTicketBody, AddAddendumBody, PrescriptionFull } from '@/types/medicine'

export type TicketFullRes = {
  ticket: unknown
  solution: unknown
  prescription: PrescriptionFull | null
  addenda: unknown[]
  rating: unknown
  broadcasts: unknown[]
  abandonLogs: unknown[]
}

export const ticketLifecycleApi = {
  getFull: (ticketId: string) =>
    apiClient
      .get<{ data: TicketFullRes }>(`/tickets/${ticketId}/full`)
      .then((r) => r.data.data),

  close: (ticketId: string) =>
    apiClient
      .post(`/tickets/${ticketId}/close`, {})
      .then((r) => r.data),

  rate: (ticketId: string, body: RateTicketBody) =>
    apiClient
      .post(`/tickets/${ticketId}/rating`, body)
      .then((r) => r.data),

  abandon: (ticketId: string, body: AbandonResolutionBody) =>
    apiClient
      .post(`/tickets/${ticketId}/abandon-resolution`, body)
      .then((r) => r.data),

  reject: (ticketId: string) =>
    apiClient
      .post(`/tickets/${ticketId}/reject`, {})
      .then((r) => r.data),

  resolve: (ticketId: string, body: ResolveTicketBody) =>
    apiClient
      .post(`/tickets/${ticketId}/resolve`, body)
      .then((r) => r.data),

  addAddendum: (ticketId: string, body: AddAddendumBody) =>
    apiClient
      .post(`/tickets/${ticketId}/addenda`, body)
      .then((r) => r.data),
}
