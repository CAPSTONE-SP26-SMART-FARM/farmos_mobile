import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { ticketLifecycleApi } from '@/services/api/ticketLifecycle'
import type { AbandonResolutionBody, RateTicketBody } from '@/types/ticketLifecycle'
import type { ResolveTicketBody, AddAddendumBody } from '@/types/medicine'

export function useTicketFull(ticketId: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.ticketFull(ticketId),
    queryFn: () => ticketLifecycleApi.getFull(ticketId),
    enabled: enabled && !!ticketId,
  })
}

// Common: ticket-level invalidates dùng cho mọi mutation liên quan tới 1 ticket cụ thể.
// Bao gồm cả farmer (`incident.detail`) lẫn doctor (`incident.doctorDetail`) + ticketFull (/full)
// + list (broad).
function invalidateTicket(qc: ReturnType<typeof useQueryClient>, ticketId: string) {
  qc.invalidateQueries({ queryKey: queryKeys.incident.detail(ticketId) })
  qc.invalidateQueries({ queryKey: queryKeys.incident.doctorDetail(ticketId) })
  qc.invalidateQueries({ queryKey: queryKeys.ticketFull(ticketId) })
  qc.invalidateQueries({ queryKey: ['incident', 'list'] })
  qc.invalidateQueries({ queryKey: ['incident', 'doctor-list'] })
}

export function useCloseTicket(ticketId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => ticketLifecycleApi.close(ticketId),
    onSuccess: () => {
      invalidateTicket(qc, ticketId)
      qc.invalidateQueries({ queryKey: ['incident', 'doctor-stats'] })
    },
  })
}

export function useRateTicket(ticketId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: RateTicketBody) => ticketLifecycleApi.rate(ticketId, body),
    onSuccess: () => {
      invalidateTicket(qc, ticketId)
      // Rating ảnh hưởng DQS tier (doctor quality score) + stats (avg rating field bên BE).
      qc.invalidateQueries({ queryKey: queryKeys.doctor.dqs })
      qc.invalidateQueries({ queryKey: ['incident', 'doctor-stats'] })
    },
  })
}

export function useAbandonResolution(ticketId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: AbandonResolutionBody) => ticketLifecycleApi.abandon(ticketId, body),
    onSuccess: () => {
      invalidateTicket(qc, ticketId)
      // REFUND_TICKET → BE hoàn quota. FALLBACK_AI cũng có thể trừ/hoàn tuỳ flow.
      qc.invalidateQueries({ queryKey: queryKeys.ticketBalance })
      qc.invalidateQueries({ queryKey: ['incident', 'doctor-stats'] })
    },
  })
}

export function useRejectTicket(ticketId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => ticketLifecycleApi.reject(ticketId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcast'] })
      qc.invalidateQueries({ queryKey: queryKeys.incident.doctorDetail(ticketId) })
      // Reject làm giảm acceptanceRate trong stats.
      qc.invalidateQueries({ queryKey: ['incident', 'doctor-stats'] })
    },
  })
}

export function useResolveTicket(ticketId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ResolveTicketBody) => ticketLifecycleApi.resolve(ticketId, body),
    onSuccess: () => {
      invalidateTicket(qc, ticketId)
      qc.invalidateQueries({ queryKey: queryKeys.prescriptions.list(ticketId) })
      // Resolve = doctor được ghi nhận commission vào ví + counter performance/revenue stats.
      qc.invalidateQueries({ queryKey: queryKeys.doctorWallet.summary })
      qc.invalidateQueries({ queryKey: ['doctor-wallet', 'transactions'] })
      qc.invalidateQueries({ queryKey: ['incident', 'doctor-stats'] })
    },
  })
}

export function useAddAddendum(ticketId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: AddAddendumBody) => ticketLifecycleApi.addAddendum(ticketId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.incident.detail(ticketId) })
      // Addenda nằm trong /full payload → cần refresh detail screen.
      qc.invalidateQueries({ queryKey: queryKeys.ticketFull(ticketId) })
    },
  })
}
