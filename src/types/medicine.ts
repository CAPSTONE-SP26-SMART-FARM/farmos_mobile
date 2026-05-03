export type Medicine = {
  id: string
  code: string
  name: string
  scientificName: string | null
  form: string
  unit: string
  strength: string | null
  withdrawalPeriodDays: number | null
  isActive: boolean
}

export type MedicineCatalogRes = {
  data: Medicine[]
}

export type PrescriptionItemInput = {
  medicineId?: string | null
  customMedicineName?: string | null
  dosage: string
  frequency: string
  usageInstructions: string
  durationDays?: number | null
  route?: string | null
  warnings?: string | null
  orderIndex?: number
}

export type ResolveTicketBody = {
  rootCause: string
  rootCauseReason: string
  treatment: string
  prevention: string
  severityNote?: string
  prescription?: {
    generalNotes?: string
    items: PrescriptionItemInput[]
  }
}

export type AddAddendumBody = {
  type: 'SOLUTION_NOTE' | 'PRESCRIPTION_NOTE' | 'CORRECTION'
  content: string
}

export type PrescriptionItemRes = {
  id: string
  prescriptionId: string
  medicineId: string | null
  customMedicineName: string | null
  dosage: string
  route: string | null
  frequency: string
  durationDays: number | null
  usageInstructions: string
  warnings: string | null
  orderIndex: number
  withdrawalPeriodDays: number | null
  medicineName: string | null
  createdAt: string
}

export type PrescriptionFull = {
  id: string
  ticketId: string
  authorId: string
  status: string
  generalNotes: string | null
  createdAt: string
  items: PrescriptionItemRes[]
}
