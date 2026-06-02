export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'verified' | 'cancelled'

export type TaskTodayLogBrief = {
  id: string
  activities: string
  notes: string
  createdAt: string
}

export type TaskForDailyLog = {
  id: string
  milestoneId: string
  zoneId: string
  milestoneName?: string | null
  title: string
  description: string | null
  priority: TaskPriority
  status: TaskStatus
  progress: number
  startDate?: string | null
  assignedDate: string | null
  hasLoggedToday?: boolean
  todayLog?: TaskTodayLogBrief | null
}

export type TodayTasksFilter = {
  milestoneId?: string
  hasLoggedToday?: boolean
}

export type AttachmentItem = {
  url: string
  fileName?: string
  mimeType?: string
  sizeBytes?: number
}

export type AttachmentRes = AttachmentItem & {
  id: string
  employeeTaskId: string | null
  dailyLogId: string | null
  uploadedBy: string
  createdAt: string
}

export type TasksForDailyLogRes = {
  data: TaskForDailyLog[]
  meta: { page: number; limit: number; totalItems: number; totalPages: number }
}

export type SubmitDailyLogBody = {
  employeeTaskId: string
  activities: string
  notes?: string
  attachments?: AttachmentItem[]
}

/**
 * Update body. Semantics theo BE:
 * - omit `attachments` => keep current
 * - `attachments: []` => clear all
 * - `attachments: [...]` => replace
 */
export type UpdateDailyLogBody = {
  activities?: string
  notes?: string
  attachments?: AttachmentItem[]
}

export type DailyLogZone = { id: string; name: string }

export type DailyLogFarmer = {
  id: string
  fullName: string
  email: string
  phone: string | null
  avatarUrl: string | null
}

export type DailyLogTask = {
  id: string
  title: string
  milestoneId: string | null
}

export type DailyLog = {
  id: string
  zoneId: string
  zone: DailyLogZone
  milestoneId: string | null
  employeeTaskId: string | null
  task: DailyLogTask | null
  logDate: string
  activities: string
  notes: string | null
  loggedBy: string
  farmer: DailyLogFarmer
  attachments: AttachmentRes[]
  createdAt: string
}

export type MyDailyLogsFilter = {
  employeeTaskId?: string
  search?: string
}

export type MyDailyLogsRes = {
  data: DailyLog[]
  meta: { page: number; limit: number; totalItems: number; totalPages: number }
}
