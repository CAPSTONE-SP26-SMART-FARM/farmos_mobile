import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { prescriptionApi } from '@/services/api/prescription'
import { socketService } from '@/services/socket/socketService'
import { queryKeys } from '@/constants/queryKeys'
import { useToast } from '@/hooks/useToast'
import type { CreatePrescriptionBody } from '@/types/prescription'

export function usePrescriptions(ticketId: string, enabled = true) {
  const qc = useQueryClient()
  const { showToast } = useToast()

  const query = useQuery({
    queryKey: queryKeys.prescriptions.list(ticketId),
    queryFn: () => prescriptionApi.list(ticketId),
    enabled: !!ticketId && enabled,
    retry: false,
  })

  useEffect(() => {
    if (!ticketId) return
    // Payload spec (BE doc `BE--Fix-issue-prescription`):
    //   { created: { ticketId, prescriptionId, authorId, source }, reissued? }
    //   - source: 'DOCTOR' khi bác sĩ kê đơn, 'AI' khi AI fallback gen đơn (BR-70)
    //   - reissued chỉ có ở doctor v2 path (true = kê lại đơn cũ)
    const handler = (payload: {
      created: {
        ticketId: string
        prescriptionId: string
        authorId: string
        source: 'DOCTOR' | 'AI'
      }
      reissued?: boolean
    }) => {
      if (payload.created.ticketId !== ticketId) return
      qc.invalidateQueries({ queryKey: queryKeys.prescriptions.list(ticketId) })
      // Cũng invalidate ticket /full vì /full.prescription = latest prescription
      // — doctor reissue / AI gen mới thì /full cũng đổi.
      qc.invalidateQueries({ queryKey: queryKeys.ticketFull(ticketId) })
      const isAi = payload.created.source === 'AI'
      const isReissue = !!payload.reissued
      showToast.success({
        message: isAi
          ? 'AI đã tạo đơn thuốc gợi ý'
          : isReissue
            ? 'Bác sĩ đã cập nhật đơn thuốc!'
            : 'Bác sĩ vừa kê đơn thuốc mới!',
      })
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
      // Prescription nằm trong /full payload + status ticket có thể chuyển.
      qc.invalidateQueries({ queryKey: queryKeys.ticketFull(ticketId) })
      qc.invalidateQueries({ queryKey: queryKeys.incident.detail(ticketId) })
      qc.invalidateQueries({ queryKey: queryKeys.incident.doctorDetail(ticketId) })
    },
  })
}
