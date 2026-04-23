import { apiClient } from './client'
import type { CreatePrescriptionBody, ListPrescriptionsRes, Prescription } from '@/types/prescription'

export const prescriptionApi = {
  list: (ticketId: string, page = 1, limit = 20) =>
    apiClient
      .get<{ data: ListPrescriptionsRes }>(
        `/ticket/${ticketId}/prescriptions?page=${page}&limit=${limit}`
      )
      .then((r) => r.data.data),

  detail: (ticketId: string, prescriptionId: string) =>
    apiClient
      .get<{ data: Prescription }>(`/ticket/${ticketId}/prescriptions/${prescriptionId}`)
      .then((r) => r.data.data),

  create: (ticketId: string, body: CreatePrescriptionBody) =>
    apiClient
      .post<{ data: Prescription }>(`/ticket/${ticketId}/prescriptions`, body)
      .then((r) => r.data.data),
}
