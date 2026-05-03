import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { bankAccountApi } from '@/services/api/bankAccount'
import type { CreateBankAccountBody, UpdateBankAccountBody } from '@/types/bankAccount'

export function useBankAccountList() {
  return useQuery({
    queryKey: queryKeys.bankAccount.list,
    queryFn: () => bankAccountApi.list(),
  })
}

export function useCreateBankAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: CreateBankAccountBody) => bankAccountApi.create(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.bankAccount.list })
    },
  })
}

export function useUpdateBankAccount(id: string) {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: UpdateBankAccountBody) => bankAccountApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.bankAccount.list })
    },
  })
}

export function useSetDefaultBankAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => bankAccountApi.setDefault(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.bankAccount.list })
    },
  })
}

export function useDeleteBankAccount() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => bankAccountApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: queryKeys.bankAccount.list })
    },
  })
}
