export type TaskPriority = 'low' | 'normal' | 'high' | 'urgent'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'verified' | 'cancelled'

export type TaskForDailyLog = {
  id: string
  milestoneId: string
  zoneId: string
  title: string
  description: string | null
  priority: TaskPriority
  status: TaskStatus
  assignedDate: string | null
}

export type TasksForDailyLogRes = {
  data: TaskForDailyLog[]
  meta: { page: number; limit: number; totalItems: number; totalPages: number }
}

export type SubmitDailyLogBody = {
  employeeTaskId: string
  activities: string
  notes?: string
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
  createdAt: string
}
