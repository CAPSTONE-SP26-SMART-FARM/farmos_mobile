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

export function useCloseTicket(ticketId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => ticketLifecycleApi.close(ticketId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.incident.detail(ticketId) })
      qc.invalidateQueries({ queryKey: ['incident', 'list'] })
    },
  })
}

export function useRateTicket(ticketId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: RateTicketBody) => ticketLifecycleApi.rate(ticketId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.incident.detail(ticketId) })
    },
  })
}

export function useAbandonResolution(ticketId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: AbandonResolutionBody) => ticketLifecycleApi.abandon(ticketId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.incident.detail(ticketId) })
      qc.invalidateQueries({ queryKey: queryKeys.ticketFull(ticketId) })
      qc.invalidateQueries({ queryKey: ['incident', 'list'] })
    },
  })
}

export function useRejectTicket(ticketId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => ticketLifecycleApi.reject(ticketId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['broadcast'] })
    },
  })
}

export function useResolveTicket(ticketId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ResolveTicketBody) => ticketLifecycleApi.resolve(ticketId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.incident.detail(ticketId) })
      qc.invalidateQueries({ queryKey: queryKeys.incident.doctorDetail(ticketId) })
      qc.invalidateQueries({ queryKey: queryKeys.prescriptions.list(ticketId) })
    },
  })
}

export function useAddAddendum(ticketId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: AddAddendumBody) => ticketLifecycleApi.addAddendum(ticketId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.incident.detail(ticketId) })
    },
  })
}
