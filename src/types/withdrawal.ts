export type WithdrawalStatus =
  | 'pending'
  | 'in_progress'
  | 'paid'
  | 'done'
  | 'rejected'
  | 'cancelled'
  | 'not_received'

export type WithdrawalRequest = {
  id: string
  doctorId: string
  walletId: string
  amount: number
  status: WithdrawalStatus

  bankAccountId: string
  snapshotBankCode: string
  snapshotBankName: string
  snapshotAccountNumber: string
  snapshotAccountHolder: string
  snapshotBranch: string | null

  doctorNote: string | null

  reviewedBy: string | null
  reviewedAt: string | null
  rejectReason: string | null

  paidBy: string | null
  paidAt: string | null
  transferReference: string | null
  transferProofUrl: string | null
  adminNote: string | null

  confirmedAt: string | null
  notReceivedAt: string | null
  notReceivedReason: string | null

  createdAt: string
  updatedAt: string
}

export type CreateWithdrawalBody = {
  amount: number
  bankAccountId: string
  doctorNote?: string
}

export type ReportNotReceivedBody = {
  reason: string
}
