import { useQuery } from '@tanstack/react-query'
import { prescriptionApi } from '@/services/api/prescription'
import { queryKeys } from '@/constants/queryKeys'

export function usePrescriptions(ticketId: string) {
  return useQuery({
    queryKey: queryKeys.prescriptions.list(ticketId),
    queryFn: () => prescriptionApi.list(ticketId),
    enabled: !!ticketId,
  })
}

export function usePrescriptionDetail(ticketId: string, prescriptionId: string) {
  return useQuery({
    queryKey: queryKeys.prescriptions.detail(ticketId, prescriptionId),
    queryFn: () => prescriptionApi.detail(ticketId, prescriptionId),
    enabled: !!ticketId && !!prescriptionId,
  })
}
