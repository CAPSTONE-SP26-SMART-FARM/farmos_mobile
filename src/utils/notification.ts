import type { MaterialIcons } from '@expo/vector-icons'
import { detectSensorKind, SENSOR_ICON } from './sensor'

type IconName = React.ComponentProps<typeof MaterialIcons>['name']

export type NotificationMeta = { icon: IconName; color: string; bg: string }

// Map theo BE NotificationType enum (prisma): sensor_alert | incident_ticket | system_update | payment_reminder | new_message
export const NOTIFICATION_TYPE_META: Record<string, NotificationMeta> = {
  sensor_alert:     { icon: 'warning',         color: '#4B5563', bg: '#F3F4F6' },
  incident_ticket:  { icon: 'assignment',      color: '#4B5563', bg: '#F3F4F6' },
  new_message:      { icon: 'chat-bubble',     color: '#4B5563', bg: '#F3F4F6' },
  payment_reminder: { icon: 'payments',        color: '#4B5563', bg: '#F3F4F6' },
  system_update:    { icon: 'system-update',   color: '#4B5563', bg: '#F3F4F6' },
  system:           { icon: 'notifications',   color: '#4B5563', bg: '#F3F4F6' },
}

/**
 * Resolve icon + bg cho 1 notification. Với `sensor_alert` ưu tiên parse title
 * ra loại sensor (grass/thermostat/water-drop/wb-sunny). Còn lại dùng map.
 */
export function resolveNotificationIcon(type: string, title: string): {
  icon: IconName
  color: string
  bg: string
} {
  const meta = NOTIFICATION_TYPE_META[type] ?? NOTIFICATION_TYPE_META.system
  if (type === 'sensor_alert') {
    const kind = detectSensorKind(title)
    if (kind) return { ...meta, icon: SENSOR_ICON[kind] }
  }
  return meta
}
