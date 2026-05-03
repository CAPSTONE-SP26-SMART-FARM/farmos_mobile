import { useEffect } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { withdrawalApi } from '@/services/api/withdrawal'
import { socketService } from '@/services/socket/socketService'
import { useToast } from '@/hooks/useToast'
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
  const { showToast } = useToast()

  useEffect(() => {
    const onApproved = () => {
      qc.invalidateQueries({ queryKey: queryKeys.withdrawal.list() })
      showToast.success({ message: 'Yêu cầu rút đã được duyệt' })
    }
    const onPaid = (payload: any) => {
      qc.invalidateQueries({ queryKey: queryKeys.withdrawal.list() })
      const ref = payload?.transferReference || 'N/A'
      showToast.success({ message: `Đã chuyển khoản: ${ref}` })
    }
    const onRejected = (payload: any) => {
      qc.invalidateQueries({ queryKey: queryKeys.withdrawal.list() })
      const reason = payload?.rejectReason || 'Không rõ'
      showToast.error({ message: `Từ chối: ${reason}` })
    }
    socketService.on('withdrawal.approved', onApproved)
    socketService.on('withdrawal.paid', onPaid)
    socketService.on('withdrawal.rejected', onRejected)
    return () => {
      socketService.off('withdrawal.approved', onApproved)
      socketService.off('withdrawal.paid', onPaid)
      socketService.off('withdrawal.rejected', onRejected)
    }
  }, [qc, showToast])
}
