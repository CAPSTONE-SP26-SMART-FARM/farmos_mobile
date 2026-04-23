import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { prescriptionApi } from '@/services/api/prescription'
import { socketService } from '@/services/socket/socketService'
import { queryKeys } from '@/constants/queryKeys'
import { useToast } from '@/hooks/useToast'
import type { CreatePrescriptionBody } from '@/types/prescription'

export function usePrescriptions(ticketId: string) {
  const qc = useQueryClient()
  const { showToast } = useToast()

  const query = useQuery({
    queryKey: queryKeys.prescriptions.list(ticketId),
    queryFn: () => prescriptionApi.list(ticketId),
    enabled: !!ticketId,
  })

  useEffect(() => {
    if (!ticketId) return
    const handler = (_payload: { created: { ticketId: string } }) => {
      if (_payload.created.ticketId !== ticketId) return
      qc.invalidateQueries({ queryKey: queryKeys.prescriptions.list(ticketId) })
      showToast.success({ message: '💊 Bác sĩ vừa kê đơn thuốc mới!' })
    }
    socketService.on('prescription.incident.created', handler)
    return () => socketService.off('prescription.incident.created', handler)
  }, [ticketId, qc, showToast])

  return query
}

export function usePrescriptionDetail(ticketId: string, prescriptionId: string) {
  return useQuery({
    queryKey: queryKeys.prescriptions.detail(ticketId, prescriptionId),
    queryFn: () => prescriptionApi.detail(ticketId, prescriptionId),
    enabled: !!ticketId && !!prescriptionId,
  })
}

export function useCreatePrescription(ticketId: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreatePrescriptionBody) => prescriptionApi.create(ticketId, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.prescriptions.list(ticketId) })
    },
  })
}
