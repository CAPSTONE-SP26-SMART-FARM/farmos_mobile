import { apiClient } from './client'
import type { UpdateTaskProgressBody, UpdateTaskProgressRes } from '@/types/employeeTask'

export const employeeTaskApi = {
  updateProgress: (id: string, body: UpdateTaskProgressBody) =>
    apiClient
      .patch<{ data: UpdateTaskProgressRes }>(`/employee-task/farmer/${id}/progress`, body)
      .then((r) => r.data.data),
}
