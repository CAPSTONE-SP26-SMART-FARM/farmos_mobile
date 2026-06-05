import type { PrescriptionItemRes } from './medicine'

// Sentinel UUID BE dùng cho prescription do AI fallback sinh ra. Column
// `Prescription.authorId` là `@db.Uuid` (không nhận literal string) — BE set
// sentinel này cho mọi AI prescription. Xem BE doc `BE--Fix-issue-prescription`.
export const AI_AUTHOR_SENTINEL_UUID = '00000000-0000-0000-0000-000000000000' as const

export type CreatePrescriptionBody = {
  medicineName: string
  dosage: string
}

export type Prescription = {
  id: string
  ticketId: string
  /** UUID doctor hoặc `AI_AUTHOR_SENTINEL_UUID` cho AI prescription. */
  authorId: string
  status: string
  generalNotes: string | null
  items: PrescriptionItemRes[]
  createdAt: string
  // Legacy summary fields BE vẫn auto-derive từ items[0] khi null.
  medicineName?: string | null
  dosage?: string | null
}

export type ListPrescriptionsRes = {
  data: Prescription[]
  meta: { page: number; limit: number; totalItems: number; totalPages: number }
}

/** Prescription do AI fallback (Gemini) sinh ra — không phải doctor authored. */
export const isAiPrescription = (p: { authorId: string }): boolean =>
  p.authorId === AI_AUTHOR_SENTINEL_UUID

/** Item trong AI prescription — AI luôn dùng customMedicineName (không link Medicine catalog). */
export const isAiPrescriptionItem = (item: PrescriptionItemRes): boolean =>
  item.medicineId === null && !!item.customMedicineName
