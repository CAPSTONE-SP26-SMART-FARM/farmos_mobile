import { apiClient } from './client'
import type {
  DoctorWalletSummary,
  DoctorWalletTransactionType,
  ListDoctorWalletTransactionsRes,
} from '@/types/doctorWallet'

export const doctorWalletApi = {
  summary: () =>
    apiClient
      .get<{ data: DoctorWalletSummary }>('/doctor-wallet/doctor/my')
      .then((r) => r.data.data),

  transactions: (page = 1, limit = 20, transactionType?: DoctorWalletTransactionType) => {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (transactionType) q.set('transactionType', transactionType)
    return apiClient
      .get<{ data: ListDoctorWalletTransactionsRes }>(
        `/doctor-wallet/doctor/my/transactions?${q.toString()}`
      )
      .then((r) => r.data.data)
  },
}
