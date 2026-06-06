import { apiClient } from './client'
import type {
  DailyLog,
  DailyLogWindow,
  MyDailyLogsFilter,
  MyDailyLogsRes,
  SubmitDailyLogBody,
  TasksForDailyLogRes,
  TodayTasksFilter,
  UpdateDailyLogBody,
} from '@/types/dailyLog'

export const dailyLogApi = {
  /** Fetch khung giờ làm việc daily-log từ BE (admin có thể đổi qua /admin). */
  getWindow: () =>
    apiClient
      .get<{ data: DailyLogWindow }>('/daily-log/window')
      .then((r) => r.data.data),

  todayTasks: (page = 1, limit = 20, filter: TodayTasksFilter = {}) => {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (filter.milestoneId) q.set('milestoneId', filter.milestoneId)
    if (filter.hasLoggedToday !== undefined) {
      q.set('hasLoggedToday', String(filter.hasLoggedToday))
    }
    return apiClient
      .get<{ data: TasksForDailyLogRes }>(`/daily-log/farmer/today?${q.toString()}`)
      .then((r) => r.data.data)
  },

  submit: (body: SubmitDailyLogBody) =>
    apiClient
      .post<{ data: DailyLog }>('/daily-log/farmer/submit', body)
      .then((r) => r.data.data),

  update: (dailyLogId: string, body: UpdateDailyLogBody) =>
    apiClient
      .patch<{ data: DailyLog }>(`/daily-log/farmer/${dailyLogId}`, body)
      .then((r) => r.data.data),

  delete: (dailyLogId: string) =>
    apiClient
      .delete<{ statusCode: number; message?: string }>(`/daily-log/farmer/${dailyLogId}`)
      .then((r) => r.data),

  myLogs: (page = 1, limit = 20, filter: MyDailyLogsFilter = {}) => {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (filter.employeeTaskId) q.set('employeeTaskId', filter.employeeTaskId)
    if (filter.search) q.set('search', filter.search)
    return apiClient
      .get<{ data: MyDailyLogsRes }>(`/daily-log/farmer/my-logs?${q.toString()}`)
      .then((r) => r.data.data)
  },
}
