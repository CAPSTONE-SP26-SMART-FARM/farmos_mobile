import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { prescriptionApi } from '@/services/api/prescription'
import { socketService } from '@/services/socket/socketService'
import { queryKeys } from '@/constants/queryKeys'
import type { CreatePrescriptionBody } from '@/types/prescription'

export function usePrescriptions(ticketId: string, enabled = true) {
  const qc = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.prescriptions.list(ticketId),
    queryFn: () => prescriptionApi.list(ticketId),
    enabled: !!ticketId && enabled,
    retry: false,
  })

  useEffect(() => {
    if (!ticketId) return
    // Payload BE: `{ created: { ticketId, prescriptionId, authorId, source }, reissued? }`.
    // Cross-user event (doctor/AI tạo đơn → farmer nhận) — chỉ invalidate cache.
    // KHÔNG showToast: BE đã gửi `notification.created` để render banner (xem
    // policy ở `useToast.ts`). Tránh duplicate (banner + toast cùng nội dung).
    const handler = (payload: { created: { ticketId: string } }) => {
      if (payload.created.ticketId !== ticketId) return
      qc.invalidateQueries({ queryKey: queryKeys.prescriptions.list(ticketId) })
      qc.invalidateQueries({ queryKey: queryKeys.ticketFull(ticketId) })
    }
    socketService.on('prescription.incident.created', handler)
    return () => socketService.off('prescription.incident.created', handler)
  }, [ticketId, qc])

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
