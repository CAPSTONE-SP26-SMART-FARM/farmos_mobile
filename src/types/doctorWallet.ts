export type DoctorWalletTransactionType =
  | 'EARNING'
  | 'WITHDRAWAL'
  | 'WITHDRAWAL_PENDING'
  | 'WITHDRAWAL_REFUND'
  | 'PENALTY'

export interface DoctorWalletSummary {
  walletId: string | null
  doctorId: string
  balance: number
  updatedAt: string | null
}

export interface DoctorWalletTransaction {
  id: string
  walletId: string
  amount: number
  transactionType: DoctorWalletTransactionType
  referenceTicketId: string | null
  createdAt: string
}

export interface ListDoctorWalletTransactionsRes {
  data: DoctorWalletTransaction[]
  meta: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}
