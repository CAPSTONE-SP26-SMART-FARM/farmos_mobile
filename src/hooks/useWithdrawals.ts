import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { withdrawalApi } from '@/services/api/withdrawal'
import { socketService } from '@/services/socket/socketService'
import type {
  WithdrawalStatus,
  CreateWithdrawalBody,
  ReportNotReceivedBody,
} from '@/types/withdrawal'

export function useWithdrawalList(status?: WithdrawalStatus, limit = 10) {
  return useQuery({
    queryKey: queryKeys.withdrawal.list(status),
    queryFn: () => withdrawalApi.list(1, limit, status),
  })
}

export function useWithdrawalDetail(id: string, enabled = true) {
  return useQuery({
    queryKey: queryKeys.withdrawal.detail(id),
    queryFn: () => withdrawalApi.get(id),
    enabled: enabled && !!id,
  })
}

export function useCreateWithdrawal() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateWithdrawalBody) => withdrawalApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.withdrawal.list() })
      qc.invalidateQueries({ queryKey: queryKeys.doctorWallet.summary })
      qc.invalidateQueries({ queryKey: queryKeys.doctorWallet.transactions() })
    },
  })
}

export function useCancelWithdrawal(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => withdrawalApi.cancel(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.withdrawal.detail(id) })
      qc.invalidateQueries({ queryKey: queryKeys.withdrawal.list() })
      // Cancel withdrawal đang pending → BE trả tiền về ví doctor.
      qc.invalidateQueries({ queryKey: queryKeys.doctorWallet.summary })
      qc.invalidateQueries({ queryKey: queryKeys.doctorWallet.transactions() })
    },
  })
}

export function useConfirmWithdrawalReceived(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: () => withdrawalApi.confirmReceived(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.withdrawal.detail(id) })
      qc.invalidateQueries({ queryKey: queryKeys.withdrawal.list() })
    },
  })
}

export function useReportWithdrawalNotReceived(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: ReportNotReceivedBody) =>
      withdrawalApi.reportNotReceived(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.withdrawal.detail(id) })
      qc.invalidateQueries({ queryKey: queryKeys.withdrawal.list() })
    },
  })
}

export function useWithdrawalListeners() {
  const qc = useQueryClient()

  useEffect(() => {
    // Admin → doctor cross-user events. BE đã gửi `notification.created` cho
    // mỗi event → render qua NotificationBanner. Mobile chỉ invalidate cache
    // để screen rút tiền refresh tự động (xem policy `useToast.ts`).
    const invalidateOne = (withdrawalId?: string) => {
      qc.invalidateQueries({ queryKey: queryKeys.withdrawal.list() })
      if (withdrawalId) qc.invalidateQueries({ queryKey: queryKeys.withdrawal.detail(withdrawalId) })
    }
    const onApproved = (payload: { withdrawalId?: string }) => invalidateOne(payload?.withdrawalId)
    const onPaid = (payload: { withdrawalId?: string }) => invalidateOne(payload?.withdrawalId)
    const onRejected = (payload: { withdrawalId?: string }) => invalidateOne(payload?.withdrawalId)
    socketService.on('withdrawal.approved', onApproved)
    socketService.on('withdrawal.paid', onPaid)
    socketService.on('withdrawal.rejected', onRejected)
    return () => {
      socketService.off('withdrawal.approved', onApproved)
      socketService.off('withdrawal.paid', onPaid)
      socketService.off('withdrawal.rejected', onRejected)
    }
  }, [qc])
}
