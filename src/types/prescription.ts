export type CreatePrescriptionBody = {
  medicineName: string
  dosage: string
}

export type Prescription = {
  id: string
  ticketId: string
  medicineName: string
  dosage: string
  createdAt: string
}

export type ListPrescriptionsRes = {
  data: Prescription[]
  meta: { page: number; limit: number; totalItems: number; totalPages: number }
}
