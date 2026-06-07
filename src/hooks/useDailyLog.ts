import { useEffect, useMemo, useState } from 'react'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { queryKeys } from '@/constants/queryKeys'
import { dailyLogApi } from '@/services/api/dailyLog'
import { FALLBACK_WINDOW, isWithinWindow } from '@/utils/dailyLogWindow'
import type {
  DailyLogWindow,
  SubmitDailyLogBody,
  TodayTasksFilter,
  UpdateDailyLogBody,
} from '@/types/dailyLog'

const MY_LOGS_PAGE_SIZE = 10

export function useTodayTasks(filter: TodayTasksFilter = {}, page = 1) {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.dailyLog.todayTasks(page, filter.milestoneId, filter.hasLoggedToday),
    queryFn: () => dailyLogApi.todayTasks(page, 20, filter),
    // Override default 5 phút — task assignment có thể đổi bất kỳ lúc nào từ
    // manager web. 30s đủ benefit cache (tab switch / scroll) nhưng vẫn fresh
    // khi user thực sự cần. Socket + focusManager + useFocusEffect cover các
    // tình huống force-refresh; staleTime ngắn là safety net cuối.
    staleTime: 30_000,
  })

  // Embed `window` từ /today response vào cache window key (đỡ 1 round-trip
  // cho `useDailyLogWindow` đang mount cùng screen). Snapshot luôn fresher hơn
  // standalone `/daily-log/window` cache nếu user vừa fetch /today.
  useEffect(() => {
    const w = query.data?.window
    if (w) {
      qc.setQueryData<DailyLogWindow>(queryKeys.dailyLog.window(), w)
    }
  }, [query.data?.window, qc])

  return query
}

/**
 * Snapshot khung giờ + tự tick mỗi phút để re-evaluate `isOpen` từ clock local.
 *
 * Trả về `{ window, isOpen, label }` — UI dùng `isOpen` để disable button,
 * `label` để render "Chỉ thao tác trong khung 07:00 – 17:00".
 *
 * Fallback: nếu BE chưa response → dùng FALLBACK_WINDOW (07-17 VN). isOpen
 * tự tính từ clock local, không lệ thuộc BE.
 */
export function useDailyLogWindow() {
  const qc = useQueryClient()
  const query = useQuery({
    queryKey: queryKeys.dailyLog.window(),
    queryFn: () => dailyLogApi.getWindow(),
    staleTime: 5 * 60_000, // BE cache 5 phút — mobile align
    gcTime: 30 * 60_000,
  })

  const window = query.data ?? FALLBACK_WINDOW

  // Tick mỗi 30s để re-evaluate isOpen từ clock local (snapshot startHour/endHour
  // không đổi giữa các tick). 30s đủ smooth UX countdown gần biên giờ.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 30_000)
    return () => clearInterval(id)
  }, [])

  const isOpen = useMemo(() => isWithinWindow(now, window), [now, window])

  // Refetch khi user nhận 422 OutOfWindow — gọi từ screen catch error.
  const refreshWindow = () => {
    qc.invalidateQueries({ queryKey: queryKeys.dailyLog.window() })
  }

  return { window, isOpen, refreshWindow, isLoading: query.isLoading }
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
