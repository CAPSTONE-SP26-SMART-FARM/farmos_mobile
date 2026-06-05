import { apiClient } from './client'
import type { AbandonResolutionBody, RateTicketBody } from '@/types/ticketLifecycle'
import type { ResolveTicketBody, AddAddendumBody, PrescriptionFull } from '@/types/medicine'

export type TicketSolution = {
  id: string
  ticketId: string
  authorId: string
  /** 'AI' khi AI fallback giải quyết, 'DOCTOR' khi doctor giải quyết. */
  source: 'AI' | 'DOCTOR' | string
  rootCause: string
  rootCauseReason: string
  treatment: string
  prevention: string
  severityNote: string | null
  language: string
  createdAt: string
}

export type TicketAddendum = {
  id: string
  ticketId: string
  type: 'SOLUTION_NOTE' | 'PRESCRIPTION_NOTE' | 'CORRECTION'
  content: string
  authorId: string
  author?: { id: string; fullName: string; avatarUrl: string | null } | null
  createdAt: string
}

export type TicketFullRes = {
  ticket: unknown
  solution: TicketSolution | null
  prescription: PrescriptionFull | null
  addenda: TicketAddendum[]
  rating: unknown
  broadcasts: unknown[]
  abandonLogs: unknown[]
  // BE flag P2-2: true khi worker abandon-detect đã reset ticket nhưng owner chưa chọn
  // FALLBACK_AI / REFUND_TICKET. Mobile tự mở modal khi mở screen mà flag = true (cover
  // case offline → mất WS event `ticket.fallback-required`).
  pendingFallbackChoice: boolean
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
