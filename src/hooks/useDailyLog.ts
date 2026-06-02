import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { dailyLogApi } from '@/services/api/dailyLog'
import type {
  SubmitDailyLogBody,
  TodayTasksFilter,
  UpdateDailyLogBody,
} from '@/types/dailyLog'

const MY_LOGS_PAGE_SIZE = 10

export function useTodayTasks(filter: TodayTasksFilter = {}, page = 1) {
  return useQuery({
    queryKey: queryKeys.dailyLog.todayTasks(page, filter.milestoneId, filter.hasLoggedToday),
    queryFn: () => dailyLogApi.todayTasks(page, 20, filter),
  })
}

/** Badge count "cần ghi hôm nay" cho Home — tasks chưa log hôm nay. */
export function useTasksForDailyLog() {
  return useTodayTasks({ hasLoggedToday: false })
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

export function useUpdateDailyLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateDailyLogBody }) =>
      dailyLogApi.update(id, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-log'] })
    },
  })
}

export function useDeleteDailyLog() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => dailyLogApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['daily-log'] })
    },
  })
}

export function useMyDailyLogsByTask(taskId: string, search = '') {
  return useInfiniteQuery({
    queryKey: queryKeys.dailyLog.myLogs(taskId, search),
    enabled: !!taskId,
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      dailyLogApi.myLogs(pageParam, MY_LOGS_PAGE_SIZE, {
        employeeTaskId: taskId,
        search: search || undefined,
      }),
    getNextPageParam: (last) =>
      last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined,
  })
}
