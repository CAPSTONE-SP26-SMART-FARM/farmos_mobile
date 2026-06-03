import { create } from 'zustand'

/**
 * Theo dõi ticket nào vừa được fallback sang AI và đang chờ AI ra giải pháp.
 *
 * Set khi: user bấm "Dùng AI" ở Alert (list screen) hoặc AbandonModal (detail screen).
 * Clear khi: socket `ticket.ai.resolved` đến, hoặc detail refresh thấy `solution.source === 'AI'`,
 * hoặc mutation abandon fail (rollback).
 *
 * Cross-screen Zustand vì list screen cần set rồi navigate ngay sang detail —
 * detail mở lên phải đọc được flag để render banner "AI đang phân tích…".
 */
interface AiProcessingState {
  pending: Record<string, true>
  start: (ticketId: string) => void
  stop: (ticketId: string) => void
  isProcessing: (ticketId: string) => boolean
}

export const useAiProcessingStore = create<AiProcessingState>((set, get) => ({
  pending: {},
  start: (id) => set((s) => ({ pending: { ...s.pending, [id]: true } })),
  stop: (id) =>
    set((s) => {
      if (!s.pending[id]) return s
      const next = { ...s.pending }
      delete next[id]
      return { pending: next }
    }),
  isProcessing: (id) => !!get().pending[id],
}))
