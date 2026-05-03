import { create } from 'zustand'
import type { PrescriptionItemInput } from '@/types/medicine'

export type RxItem = PrescriptionItemInput & { _displayName: string }

interface ResolveState {
  ticketId: string | null
  rootCause: string
  rootCauseReason: string
  treatment: string
  prevention: string
  items: RxItem[]

  setField: (key: 'rootCause' | 'rootCauseReason' | 'treatment' | 'prevention', value: string) => void
  setTicketId: (id: string) => void
  addItems: (items: RxItem[]) => void
  addItem: (item: RxItem) => void
  updateItem: (idx: number, patch: Partial<RxItem>) => void
  removeItem: (idx: number) => void
  reset: () => void
}

const initial = {
  ticketId: null,
  rootCause: '',
  rootCauseReason: '',
  treatment: '',
  prevention: '',
  items: [] as RxItem[],
}

export const useResolveStore = create<ResolveState>((set) => ({
  ...initial,
  setField: (key, value) => set({ [key]: value } as any),
  setTicketId: (id) => set({ ticketId: id }),
  addItems: (newItems) => set((s) => ({ items: [...s.items, ...newItems] })),
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
  updateItem: (idx, patch) =>
    set((s) => ({ items: s.items.map((item, i) => (i === idx ? { ...item, ...patch } : item)) })),
  removeItem: (idx) => set((s) => ({ items: s.items.filter((_, i) => i !== idx) })),
  reset: () => set(initial),
}))
