import { apiClient } from './client'
import type {
  DoctorBankAccount,
  CreateBankAccountBody,
  UpdateBankAccountBody,
} from '@/types/bankAccount'

export const bankAccountApi = {
  list: () =>
    apiClient
      .get<{ data: { data: DoctorBankAccount[] } }>('/doctor/me/bank-accounts')
      .then((r) => r.data.data.data),

  create: (body: CreateBankAccountBody) =>
    apiClient
      .post<{ data: DoctorBankAccount }>('/doctor/me/bank-accounts', body)
      .then((r) => r.data.data),

  update: (id: string, body: UpdateBankAccountBody) =>
    apiClient
      .patch<{ data: DoctorBankAccount }>(`/doctor/me/bank-accounts/${id}`, body)
      .then((r) => r.data.data),

  setDefault: (id: string) =>
    apiClient
      .patch<{ data: DoctorBankAccount }>(`/doctor/me/bank-accounts/${id}/set-default`)
      .then((r) => r.data.data),

  delete: (id: string) =>
    apiClient.delete(`/doctor/me/bank-accounts/${id}`),
}
