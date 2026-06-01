import { apiClient } from './client'
import type {
  DailyLog,
  MyDailyLogsFilter,
  MyDailyLogsRes,
  SubmitDailyLogBody,
  TasksForDailyLogRes,
  TodayTasksFilter,
} from '@/types/dailyLog'

export const dailyLogApi = {
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

  myLogs: (page = 1, limit = 20, filter: MyDailyLogsFilter = {}) => {
    const q = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (filter.employeeTaskId) q.set('employeeTaskId', filter.employeeTaskId)
    if (filter.search) q.set('search', filter.search)
    return apiClient
      .get<{ data: MyDailyLogsRes }>(`/daily-log/farmer/my-logs?${q.toString()}`)
      .then((r) => r.data.data)
  },
}
