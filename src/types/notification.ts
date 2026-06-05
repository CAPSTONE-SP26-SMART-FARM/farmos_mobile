// BE Notification enum (round 3): chỉ 5 values chính thức. Mobile dùng các
// literal cụ thể dưới đây cho exhaustive switch, nhưng cho phép `string` ở
// `Notification.type` để defensive khi BE thêm type mới hoặc legacy data.
export type NotificationType =
  | 'sensor_alert'
  | 'incident_ticket'
  | 'system_update'
  | 'payment_reminder'
  | 'new_message'

export type Notification = {
  id: string
  /** BE chính thức 5 values (xem `NotificationType`), nhưng tolerate string lạ. */
  type: NotificationType | string
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
