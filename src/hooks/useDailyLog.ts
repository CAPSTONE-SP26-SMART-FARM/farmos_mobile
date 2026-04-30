import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { dailyLogApi } from '@/services/api/dailyLog'
import type { SubmitDailyLogBody } from '@/types/dailyLog'

export function useTasksForDailyLog(page = 1) {
  return useQuery({
    queryKey: queryKeys.dailyLog.tasksForToday(page),
    queryFn: () => dailyLogApi.listTasksForToday(page),
  })
}

export function useSubmitDailyLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (body: SubmitDailyLogBody) => dailyLogApi.submit(body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-log'] })
    },
  })
}
