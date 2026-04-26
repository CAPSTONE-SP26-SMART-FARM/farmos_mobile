import { useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { doctorWalletApi } from '@/services/api/doctorWallet'
import { socketService } from '@/services/socket/socketService'
import { useToast } from '@/hooks/useToast'
import type { DoctorWalletTransactionType } from '@/types/doctorWallet'

export function useDoctorWalletSummary() {
  const qc = useQueryClient()
  const { showToast } = useToast()
  const query = useQuery({
    queryKey: queryKeys.doctorWallet.summary,
    queryFn: () => doctorWalletApi.summary(),
  })

  useEffect(() => {
    const handler = () => {
      qc.invalidateQueries({ queryKey: queryKeys.doctorWallet.summary })
      qc.invalidateQueries({ queryKey: ['doctor-wallet', 'transactions'] })
      showToast.success({ message: 'Bạn đã nhận được tiền từ một ca sự cố!' })
    }
    socketService.on('doctor.wallet.credited', handler)
    return () => socketService.off('doctor.wallet.credited', handler)
  }, [qc, showToast])

  return query
}

export function useDoctorWalletTransactions(
  page = 1,
  transactionType?: DoctorWalletTransactionType
) {
  return useQuery({
    queryKey: queryKeys.doctorWallet.transactions(page, transactionType),
    queryFn: () => doctorWalletApi.transactions(page, 20, transactionType),
  })
}
