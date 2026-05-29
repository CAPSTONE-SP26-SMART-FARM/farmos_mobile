import type { MaterialIcons } from '@expo/vector-icons'
import { detectSensorKind, SENSOR_ICON } from './sensor'

type IconName = React.ComponentProps<typeof MaterialIcons>['name']

export type NotificationMeta = { icon: IconName; color: string; bg: string }

// Per-sensor coloring for sensor_alert notifications — match SensorCard semantic colors.
const SENSOR_ICON_COLOR: Record<string, { color: string; bg: string }> = {
  air_temperature: { color: '#DC2828', bg: '#FEE2E2' },
  air_humidity:    { color: '#0EA5E9', bg: '#E0F2FE' },
  soil_moisture:   { color: '#65A30D', bg: '#ECFCCB' },
  light_intensity: { color: '#F59E0B', bg: '#FEF3C7' },
}

// Map theo BE NotificationType enum + alias FE Notification type.
export const NOTIFICATION_TYPE_META: Record<string, NotificationMeta> = {
  sensor_alert:                  { icon: 'warning',         color: '#DC2828', bg: '#FEE2E2' },
  alert_triggered:               { icon: 'warning',         color: '#DC2828', bg: '#FEE2E2' },
  incident_ticket:               { icon: 'assignment',      color: '#2463EB', bg: '#DBEAFE' },
  incident_assigned:             { icon: 'assignment-ind',  color: '#2463EB', bg: '#DBEAFE' },
  incident_accepted:             { icon: 'assignment-turned-in', color: '#16A249', bg: '#DCFCE7' },
  prescription_created:          { icon: 'medication',      color: '#7C3AED', bg: '#EDE9FE' },
  ticket_message:                { icon: 'chat-bubble',     color: '#2463EB', bg: '#DBEAFE' },
  new_message:                   { icon: 'chat-bubble',     color: '#2463EB', bg: '#DBEAFE' },
  production_request_created:    { icon: 'agriculture',     color: '#D97706', bg: '#FEF3C7' },
  production_request_replied:    { icon: 'agriculture',     color: '#16A249', bg: '#DCFCE7' },
  payment_reminder:              { icon: 'payments',        color: '#D97706', bg: '#FEF3C7' },
  system_update:                 { icon: 'system-update',   color: '#4B5563', bg: '#F3F4F6' },
  system:                        { icon: 'notifications',   color: '#4B5563', bg: '#F3F4F6' },
}

/**
 * Resolve icon + bg cho 1 notification. Với `sensor_alert` / `alert_triggered` ưu tiên
 * parse title ra loại sensor (grass/thermostat/water-drop/wb-sunny) và dùng màu tương ứng.
 */
export function resolveNotificationIcon(type: string, title: string): NotificationMeta {
  const meta = NOTIFICATION_TYPE_META[type] ?? NOTIFICATION_TYPE_META.system
  if (type === 'sensor_alert' || type === 'alert_triggered') {
    const kind = detectSensorKind(title)
    if (kind) {
      const tint = SENSOR_ICON_COLOR[kind]
      return tint
        ? { icon: SENSOR_ICON[kind], color: tint.color, bg: tint.bg }
        : { ...meta, icon: SENSOR_ICON[kind] }
    }
  }
  return meta
}
