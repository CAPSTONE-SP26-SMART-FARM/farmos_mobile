export type Prescription = {
  id: string
  ticketId: string
  medicineName: string
  dosage: string
  frequency: string
  durationDays: number
  withdrawalPeriodDays: number | null
  instructions: string | null
  createdAt: string
}

export type ListPrescriptionsRes = {
  data: Prescription[]
  meta: { page: number; limit: number; totalItems: number; totalPages: number }
}
