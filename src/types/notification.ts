export type NotificationType =
  | 'incident_assigned'
  | 'incident_accepted'
  | 'prescription_created'
  | 'ticket_message'
  | 'production_request_replied'
  | 'production_request_created'
  | 'alert_triggered'
  | 'system'

export type Notification = {
  id: string
  type: NotificationType
  title: string
  content: string
  redirectUrl: string | null
  isRead: boolean
  createdAt: string
}

export type ListNotificationsRes = {
  data: Notification[]
  meta: { page: number; limit: number; totalItems: number; totalPages: number }
}

export type MarkNotificationReadBody = {
  isRead: boolean
}
