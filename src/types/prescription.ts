import type { PrescriptionItemRes } from './medicine'

// Sentinel BE dùng cho prescription do AI fallback sinh ra (xem BE handoff).
// authorId === AI_AUTHOR_ID → mobile render badge + disclaimer + disable re-issue.
export const AI_AUTHOR_ID = 'AI' as const

export type CreatePrescriptionBody = {
  medicineName: string
  dosage: string
}

export type Prescription = {
  id: string
  ticketId: string
  /** UUID doctor hoặc literal string `"AI"` (xem AI_AUTHOR_ID). */
  authorId: string
  status: string
  generalNotes: string | null
  items: PrescriptionItemRes[]
  createdAt: string
  // Legacy summary fields BE vẫn trả về cho list view — giữ optional để code cũ
  // (PrescriptionCard) không vỡ trong khi migrate hoàn tất.
  medicineName?: string
  dosage?: string
}

export type ListPrescriptionsRes = {
  data: Prescription[]
  meta: { page: number; limit: number; totalItems: number; totalPages: number }
}

/** Prescription do AI fallback (Gemini) sinh ra — không phải doctor authored. */
export const isAiPrescription = (p: { authorId: string }): boolean =>
  p.authorId === AI_AUTHOR_ID

/** Item trong AI prescription — flag được set trong metadata.aiGenerated khi BE expose. */
export const isAiPrescriptionItem = (item: PrescriptionItemRes): boolean =>
  // Hiện BE chưa expose `isAiGenerated` ở response (xem BE handoff phase 2).
  // Fallback detect: AI item luôn có customMedicineName + medicineId === null.
  item.medicineId === null && !!item.customMedicineName
