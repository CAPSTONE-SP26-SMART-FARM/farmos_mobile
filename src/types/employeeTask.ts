export type UpdateTaskProgressBody = {
  progress: number
}

export type UpdateTaskProgressRes = {
  id: string
  progress: number
  status: string
}

/**
 * Socket event payload — fire trên room `user:{farmerId}` khi manager/owner
 * tạo / assign / unassign / update / complete task gán cho farmer.
 * Không có taskId nên client chỉ invalidate broad list, không update spot.
 */
export type EmployeeTaskUpdatedPayload = {
  action: 'created' | 'assigned' | 'unassigned' | 'updated' | 'completed'
  taskTitle: string
}
