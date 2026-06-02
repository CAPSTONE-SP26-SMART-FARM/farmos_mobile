import { apiClient } from './client'
import type { UpdateTaskProgressBody, UpdateTaskProgressRes } from '@/types/employeeTask'

export const employeeTaskApi = {
  updateProgress: (id: string, body: UpdateTaskProgressBody) =>
    apiClient
      .patch<{ data?: UpdateTaskProgressRes } | UpdateTaskProgressRes | null>(
        `/employee-task/farmer/${id}/progress`,
        body,
      )
      .then((r) => {
        // BE có thể trả về { statusCode, message, data: T }, trả T trực tiếp,
        // hoặc 204 No Content (r.data = '' / null). Mọi case đều xem là success.
        const body = r.data as any
        return (body?.data ?? body ?? null) as UpdateTaskProgressRes | null
      }),
}
