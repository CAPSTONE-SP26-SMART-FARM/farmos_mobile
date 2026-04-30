import { apiClient } from './client'
import type { DailyLog, SubmitDailyLogBody, TasksForDailyLogRes } from '@/types/dailyLog'

export const dailyLogApi = {
  listTasksForToday: (page = 1, limit = 20) =>
    apiClient
      .get<{ data: TasksForDailyLogRes }>(`/daily-log/farmer/tasks?page=${page}&limit=${limit}`)
      .then((r) => r.data.data),

  submit: (body: SubmitDailyLogBody) =>
    apiClient
      .post<{ data: DailyLog }>('/daily-log/farmer/submit', body)
      .then((r) => r.data.data),
}
