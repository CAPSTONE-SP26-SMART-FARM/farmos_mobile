import { useMutation, useQueryClient } from '@tanstack/react-query'
import { employeeTaskApi } from '@/services/api/employeeTask'
import type { UpdateTaskProgressBody } from '@/types/employeeTask'

export function useUpdateTaskProgress() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTaskProgressBody }) =>
      employeeTaskApi.updateProgress(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-log'] })
      qc.invalidateQueries({ queryKey: ['farmer-milestone'] })
    },
  })
}
