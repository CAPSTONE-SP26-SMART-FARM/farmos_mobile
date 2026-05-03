import { apiClient } from './client'
import type {
  WithdrawalRequest,
  WithdrawalStatus,
  CreateWithdrawalBody,
  ReportNotReceivedBody,
} from '@/types/withdrawal'

export type ListWithdrawalRes = {
  data: WithdrawalRequest[]
  meta: {
    page: number
    limit: number
    totalItems: number
    totalPages: number
    hasNextPage: boolean
    hasPreviousPage: boolean
  }
}

export const withdrawalApi = {
  list: (page = 1, limit = 10, status?: WithdrawalStatus) => {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (status) q.set('status', status)
    return apiClient
      .get<{ data: ListWithdrawalRes }>(`/doctor/me/withdrawals?${q.toString()}`)
      .then((r) => r.data.data)
  },

  get: (id: string) =>
    apiClient
      .get<{ data: WithdrawalRequest }>(`/doctor/me/withdrawals/${id}`)
      .then((r) => r.data.data),

  create: (body: CreateWithdrawalBody) =>
    apiClient
      .post<{ data: WithdrawalRequest }>('/doctor/me/withdrawals', body)
      .then((r) => r.data.data),

  cancel: (id: string) =>
    apiClient
      .post<{ data: WithdrawalRequest }>(`/doctor/me/withdrawals/${id}/cancel`, {})
      .then((r) => r.data.data),

  confirmReceived: (id: string) =>
    apiClient
      .post<{ data: WithdrawalRequest }>(`/doctor/me/withdrawals/${id}/confirm-received`)
      .then((r) => r.data.data),

  reportNotReceived: (id: string, body: ReportNotReceivedBody) =>
    apiClient
      .post<{ data: WithdrawalRequest }>(
        `/doctor/me/withdrawals/${id}/report-not-received`,
        body
      )
      .then((r) => r.data.data),
}
